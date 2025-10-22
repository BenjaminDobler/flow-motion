import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  Signal,
  signal,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  WritableSignal,
} from '@angular/core';
import { Link, NgBondService } from '../../services/ngbond.service';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { SelectionManager } from '../../services/selection.manager';
import { KeyManager } from '../../services/key.manager';
import { makeDraggable } from '@richapps/ngx-drag';
import { touches } from '../../utils/geo.utils';
import { ComponentFactory } from '../../services/component.factory';
import { ImageComponent } from '../editables/image/image.component';
import { ConnectionDirective } from '../editables/connection.directive';
import { NgBondContainer } from '../ng-bond-container/ng-bond-container';
import { toObservable } from '@angular/core/rxjs-interop';
import { BehaviorSubject, fromEvent } from 'rxjs';
import { InspectableProperty } from '../../types/types';

export interface NGBondItem {
  x: Signal<number>;
  y: Signal<number>;
  width: Signal<number>;
  height: Signal<number>;
  gX: Signal<number>;
  gY: Signal<number>;
  id: Signal<string>;
  children: Signal<NGBondItem[]>;
  type: string;
  displayName: WritableSignal<string>;
  addChild: (child: NGBondItem) => void;
  removeChild: (child: NGBondItem) => void;
  detachChild?: (viewRef: ComponentRef<any>) => void;
}

@Component({
  selector: 'ng-bond-world',
  imports: [DecimalPipe],
  templateUrl: './ng-bond-world.component.html',
  styleUrl: './ng-bond-world.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [],
  host: {
    '(click)': 'onClick($event)',
    '(drop)': 'onDrop($event)',
    '(dragover)': '$event.preventDefault()',
    '(dragenter)': '$event.preventDefault()',
    '(dragleave)': '$event.preventDefault()',
    '(dragend)': '$event.preventDefault()',
    '(dragstart)': '$event.preventDefault()',
    '(drag)': '$event.preventDefault()',
    '(wheel)': 'onWheel($event)',
  },
})
export class NgBondWorld implements NGBondItem {
  public static inspectableProperties: InspectableProperty[] = [
    {
      name: 'backgroundColor',
      alias: 'Background',
      type: 'color',
      category: 'Canvas',
    },
    {
      group: {
        name: 'Transform',
      },
      name: 'scale',
      alias: 'Scale',
      type: 'range',
      min: 0.1,
      max: 5,
      step: 0.01,
      category: 'Canvas',
    },
    {
      group: {
        name: 'Transform',
      },
      name: 'scale',
      alias: 'Scale',
      type: 'number',
      format: (value: number)=>{
        return Math.round(value * 100);
      },
      min: 0.1,
      max: 5,
      step: 0.01,
      suffix: '%',
      category: 'Canvas',
    },
  ];

  get inspectableProperties() {
    return NgBondWorld.inspectableProperties;
  }

  displayName = model<string>('World');

  public el: ElementRef<HTMLElement> = inject(ElementRef);
  protected dragService: NgBondService = inject(NgBondService);
  protected selectionManager: SelectionManager = inject(SelectionManager);

  type = 'world';

  backgroundColor = signal<string>('#1e1e1e');

  disabled$ = toObservable(this.selectionManager.disabled);
  private keymanager: KeyManager = inject(KeyManager);

  @ViewChild('insert_slot', { read: ViewContainerRef })
  worldHost!: ViewContainerRef;

  id = signal<string>('world');

  scale = model<number>(1);

  children = signal<NGBondItem[]>([]);
  x = signal(0);
  y = signal(0);
  gX = signal(0);
  gY = signal(0);
  width = signal(2000);
  height = signal(2000);

  startP = signal<{ x: number; y: number } | null>(null);
  endP = signal<{ x: number; y: number } | null>(null);

  rect: DOMRect | null = null;

  componentFactory = inject(ComponentFactory);

  constructor() {
    this.componentFactory.world = this;

    this.dragService.world = this;

    effect(() => {
      const disabled = this.selectionManager.disabled();

      this.endP.set(null);
      this.startP.set(null);
    });

    effect(() => {
      const scale = this.scale();
      this.dragService.scale.set(scale);
    });
  }

  addChild(child: NGBondItem) {
    this.children.update((c) => [...c, child]);
    this.selectionManager.rootChildren.update((c) => [...c, child as NgBondContainer]);
  }

  removeChild(child: NGBondItem) {
    this.children.update((c) => c.filter((cChild) => cChild !== child));
    this.selectionManager.rootChildren.update((c) => c.filter((cChild) => cChild !== (child as NgBondContainer)));
  }

  detachChild(viewRef: ComponentRef<any>) {
    const i = this.worldHost.indexOf(viewRef.hostView);
    this.worldHost.detach(i);
  }

  onWheel(event: WheelEvent) {
    if (event.metaKey || event.ctrlKey) {
          event.preventDefault();

      // Zooming
      this.handleZoom(event);
    }
  }

  handleZoom(event: WheelEvent) {
    const delta = -event.deltaY * 0.001;
    let newScale = this.scale() + delta;
    newScale = Math.min(Math.max(newScale, 0.1), 5);
    this.scale.set(newScale);
  }

  selectionRect = computed(() => {
    const start = this.startP();
    const end = this.endP();
    if (!start || !end) {
      return null;
    }
    return {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    };
  });

  ngAfterViewInit() {
    this.rect = this.el.nativeElement.getBoundingClientRect();

    const dis$ = new BehaviorSubject(false);
    this.disabled$.subscribe(dis$);
    const drag = makeDraggable(this.el.nativeElement, dis$);

    fromEvent<MouseEvent>(window, 'mousemove').subscribe((evt) => {
      let x = evt.clientX - this.rect!.left;
      let y = evt.clientY - this.rect!.top;
      x = x / this.dragService.scale();
      y = y / this.dragService.scale();
      this.selectionManager.mouseMove(x, y);
    });

    drag.dragStart$.subscribe((evt) => {
      if (this.selectionManager.disabled()) {
        return;
      }
      this.wasDrag = true;
      const scale = this.dragService.scale();
      this.startP.set({ x: evt.offsetX / scale, y: evt.offsetY / scale });
    });

    drag.dragMove$.subscribe((evt) => {
      if (this.selectionManager.disabled()) {
        return;
      }
      const scale = this.dragService.scale();
      this.endP.set({ x: (evt.startOffsetX + evt.deltaX) / scale, y: (evt.startOffsetY + evt.deltaY) / scale });
      const r = this.selectionRect();
      if (r) {
        // const targets = this.dragService.dragElements().filter((t) => {
        //   const c = contains({ x1: r?.x, y1: r.y, x2: r.x + r.width, y2: r.y + r.height }, { x1: t.gX(), y1: t.gY(), x2: t.gX() + t.width(), y2: t.gY() + t.height() });
        //   return c && t.type === 'container';
        // });

        const targets = this.dragService.dragElements().filter((t) => {
          const c = touches({ x1: r?.x, y1: r.y, x2: r.x + r.width, y2: r.y + r.height }, { x1: t.gX(), y1: t.gY(), x2: t.gX() + t.width(), y2: t.gY() + t.height() });
          return c && t.type === 'container';
        });

        this.selectionManager.setAll(targets);
      }
    });

    drag.dragEnd$.subscribe((evt) => {
      if (this.selectionManager.disabled()) {
        return;
      }
      if (evt.originalEvent && evt.originalEvent instanceof MouseEvent) {
        evt.originalEvent?.preventDefault();
        evt.originalEvent?.stopPropagation();
      }

      this.endP.set(null);
      this.startP.set(null);
    });
  }

  wasDrag = false;
  onClick(evt: MouseEvent) {
    if (this.wasDrag) {
      this.wasDrag = false;
      return;
    }
    // this.selectionManager.unselectAll();

    let hasComponent = false;
    let target = evt.target as HTMLElement;
    while (target && target !== this.el.nativeElement) {
      const targetComp = this.dragService.getComponent(target);
      if (targetComp) {
        // If the target is a component, do not unselect
        hasComponent = true;
        break;
      }
      target = target.parentElement as HTMLElement;
    }
    if (!hasComponent) {
      this.selectionManager.unselectAll();
    }
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer?.files.length === 0) {
      return;
    }
    const reader = new FileReader();
    if (!e.dataTransfer?.files[0]) {
      return;
    }
    reader.readAsDataURL(e.dataTransfer?.files[0]);
    reader.onload = () => {
      this.componentFactory.addComponent(ImageComponent, {
        src: reader.result as string,
        x: e.pageX - this.rect!.left,
        y: e.pageY - this.rect!.top,
      });
    };
  }
}
