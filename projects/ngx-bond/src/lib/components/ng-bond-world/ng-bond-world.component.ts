import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, Signal, signal, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Link, NgBondService } from '../../services/ngbond.service';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { SelectionManager } from '../../services/selection.manager';
import { KeyManager } from '../../services/key.manager';
import { makeDraggable } from '../util/drag.util';
import { touches } from '../../utils/geo.utils';
import { ComponentFactory } from '../../services/component.factory';
import { ImageComponent } from '../editables/image/image.component';
import { NgBondContainer } from '@richapps/ngx-bond';

export interface NGBondItem {
  x: Signal<number>;
  y: Signal<number>;
  width: Signal<number>;
  height: Signal<number>;
  gX: Signal<number>;
  gY: Signal<number>;
  id: Signal<string>;
  children: Signal<NGBondItem[]>;
  addChild: (child: NGBondItem) => void;
  removeChild: (child: NGBondItem) => void;
}

@Component({
  selector: 'ng-bond-world',
  imports: [NgTemplateOutlet, DecimalPipe],
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
  },
})
export class NgBondWorld implements NGBondItem {
  public el: ElementRef<HTMLElement> = inject(ElementRef);
  protected dragService: NgBondService = inject(NgBondService);
  protected selectionManager: SelectionManager = inject(SelectionManager);
  public pathanimation = input<TemplateRef<unknown>>();
  private keymanager: KeyManager = inject(KeyManager);

  @ViewChild('insert_slot', { read: ViewContainerRef })
  worldHost!: ViewContainerRef;

  id = signal<string>('world');

  animationBubbleCount = input<number>(10);
  animationBubbleDuration = input<number>(4);

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
  }

  addChild(child: NGBondItem) {
    this.children.update((c) => [...c, child]);
    this.selectionManager.rootChildren.update((c) => [...c, child as NgBondContainer]);
  }

  removeChild(child: NGBondItem) {
    this.children.update((c) => c.filter((cChild) => cChild !== child));
    this.selectionManager.rootChildren.update((c) => c.filter((cChild) => cChild !== (child as NgBondContainer)));
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
    const drag = makeDraggable(this.el.nativeElement);

    drag.dragStart$.subscribe((evt) => {
      this.wasDrag = true;
      this.startP.set({ x: evt.offsetX, y: evt.offsetY });
    });

    drag.dragMove$.subscribe((evt) => {
      this.endP.set({ x: evt.startOffsetX + evt.deltaX, y: evt.startOffsetY + evt.deltaY });
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
      if (evt.originalEvent) {
        evt.originalEvent.preventDefault();
        evt.originalEvent.stopPropagation();
      }

      this.endP.set(null);
      this.startP.set(null);
    });
  }

  onConnectionClick(link: Link) {
    console.log('Connection clicked', link);
  }

  protected countToArray(count: number) {
    return Array(count).fill(0);
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
      const image = new Image();
      image.src = reader.result as string;

      this.componentFactory.addComponent(ImageComponent, {
        src: reader.result as string,
        x: e.pageX - this.rect!.left,
        y: e.pageY - this.rect!.top,
      });

      image.onload = () => {
        console.log('Image loaded', image);
      };
    };
  }
}
