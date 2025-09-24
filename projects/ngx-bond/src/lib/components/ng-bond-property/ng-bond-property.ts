import { Directive, ElementRef, inject, input, model, output, Signal, signal, OnInit, OnDestroy, computed, forwardRef, effect } from '@angular/core';
import { makeDraggable } from '../util/drag.util';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Link, NgBondService } from '../../services/ngbond.service';
import { NgBondContainer } from '../ng-bond-container/ng-bond-container';
import { SelectionManager } from '@richapps/ngx-bond';
export type LinkPosition = 'left' | 'right' | 'top' | 'bottom';

@Directive({
  selector: '[bondproperty]',
  standalone: true,
  exportAs: 'bondproperty',
  hostDirectives: [
    {
      directive: forwardRef(() => NgBondContainer),
      inputs: ['draggable', 'bondcontainer', 'positioning', 'bondcontainer:bondproperty'],
    },
  ],
  host: {
    '[class.has-link]': 'this.hasLink()',
    '[style.touchAction]': "'none'",
    '[positioning]': "'none'",
    '[draggable]': 'false',
  },
})
export class NgBondProperty {


  selection = inject(SelectionManager);
  get height() {
    return this.container?.height || signal(0);
  }

  get width() {
    return this.container?.width || signal(0);
  }

  get gY() {
    return this.container?.gY || signal(0);
  }

  get gX() {
    return this.container?.gX || signal(0);
  }

  get x() {
    return this.container?.x || signal(0);
  }

  get y() {
    return this.container?.y || signal(0);
  }

  hasLink = signal<boolean>(false);
  isStartOfLink = signal<boolean>(false);
  isEndOfLink = signal<boolean>(false);

  id = input<string>('', { alias: 'bondproperty' });

  bondcolor = input<string>('');
  bondstrokewidth = input<number>();

  animatedLink = model<boolean>(false);

  ngBondService = inject(NgBondService);
  el: ElementRef<HTMLElement> = inject(ElementRef);
  // Positions within the parent

  // global positions within the bond world

  public type = 'propertys';

  container? = inject(NgBondContainer, { optional: true });

  constructor() {
    console.log('NgBondProperty constructor:', this.id());
    const drag = makeDraggable(this.el.nativeElement);

    if (!this.ngBondService) {
      return;
    }

    const dragPreview = {
      gX: signal<number>(0),
      gY: signal<number>(0),
      width: signal(0),
      height: signal(0),
    };

    let parentRect = {
      width: this.container?.parent()?.width() ?? 0,
      height: this.container?.parent()?.height() ?? 0,
      left: this.container?.parent()?.gX() ?? 0,
      top: this.container?.parent()?.gY() ?? 0,
    };

    let worldRect = parentRect;
    let currentPreview: Signal<Link> | null;
    let isFirstMove = true;

    drag.dragStart$.pipe(takeUntilDestroyed()).subscribe(() => {
      parentRect = parentRect = {
        width: this.container?.parent()?.width() ?? 0,
        height: this.container?.parent()?.height() ?? 0,
        left: this.container?.parent()?.gX() ?? 0,
        top: this.container?.parent()?.gY() ?? 0,
      };
      worldRect = parentRect;
      isFirstMove = true;
      if (this.container?.world) {
        const worldEl = this.container.world.el.nativeElement;
        worldRect = worldEl.getBoundingClientRect();
      }
    });

    drag.dragMove$.subscribe((move) => {
      console.log('Drag move:', this.id());
      
      if (isFirstMove && this.id()) {
        this.ngBondService.currentDragSource = this;
        console.log('Creating drag preview for:', this.id());
        currentPreview = this.ngBondService.createLink(this.id(), dragPreview) as any;
        isFirstMove = false;
      }
      const offsetX = move.originalEvent.x - move.startOffsetX;
      const offsetY = move.originalEvent.y - move.startOffsetY;
      
      console.log('Offset:', offsetX, offsetY);

      const x = offsetX - parentRect.left;
      const y = offsetY - parentRect.top;

      const gX = x + parentRect.left - worldRect.left;
      const gY = y + parentRect.top - worldRect.top;

            this.selection.mouseMove(gX, gY);

      

      this.ngBondService.updateDragPreview(gX, gY);

      dragPreview.gX.set(gX);
      dragPreview.gY.set(gY);
    });

    drag.dragEnd$.subscribe((e) => {
      const targetComp = this.ngBondService.getComponent(e.originalEvent.target);

      this.ngBondService.endDragPreview(this.id(), targetComp?.id());

      if (currentPreview) {
        this.ngBondService.removePreview(currentPreview);
      }
    });

    effect(() => {
      const pw = this.container?.parent?.()?.width();
      const ph = this.container?.parent?.()?.height();

      this.container?.updatePosition();
    });
  }

  position(): LinkPosition {
    //const parentRect = this.parent().getBoundingClientRect();

    const parentRect = {
      width: this.container?.parent()?.width() ?? 0,
      height: this.container?.parent()?.height() ?? 0,
    };

    const centerX = parentRect.width / 2;
    const centerY = parentRect.height / 2;
    const angleDeg = (Math.atan2(centerY - this.y(), centerX - this.x()) * 180) / Math.PI;
    const heading = (360 + angleDeg) % 360;

    let position: LinkPosition;
    if (heading < 40 || heading > 320) {
      position = 'left';
    } else if (heading < 140) {
      position = 'top';
    } else if (heading < 220) {
      position = 'right';
    } else {
      position = 'bottom';
    }
    return position;
  }

  ngAfterViewInit() {
    console.log('NgBondProperty initialized:', this.id(), 'gx: ' + this.gX(), 'x: ' + this.x());
  }

  // updatePosition() {
  //   const itemElement = this.el?.nativeElement;
  //   let worldRect = { left: 0, top: 0 };
  //   if (this.dragWorld) {
  //     const worldElement = this.dragWorld.el.nativeElement;
  //     worldRect = worldElement.getBoundingClientRect();
  //   }

  //   const parentRect = this.parent().getBoundingClientRect();
  //   const itemRect = itemElement.getBoundingClientRect();

  //   // this.bounds.height = itemRect.height;
  //   // this.bounds.width = itemRect.width;
  //   // this.bounds.left = itemRect.left - parentRect.left;
  //   // this.bounds.top = itemRect.top - parentRect.top;
  //   this.width.set(itemRect.width);
  //   this.height.set(itemRect.height);
  //   const x = itemRect.left - parentRect.left;
  //   const y = itemRect.top - parentRect.top;
  //   this.x.set(x);
  //   this.y.set(y);

  //   const gX = parentRect.left + x - worldRect.left;
  //   const gY = parentRect.top + y - worldRect.top;

  //   this.gX.set(gX);
  //   this.gY.set(gY);
  // }

  // private parent() {
  //   const itemElement = this.el?.nativeElement;
  //   let parentElement = itemElement.parentElement;
  //   if (this.container) {
  //     parentElement = this.container.el.nativeElement;
  //   }
  //   return parentElement;
  // }

  // // bounds = {
  // //   left: this.gX(),
  // //   top: this.gY(),
  // //   width: 0,
  // //   height: 0,
  // // }

  // // get bounds() {
  // //   const rect = this.el.nativeElement.getBoundingClientRect();
  // //   return {
  // //     left: this.gX(),
  // //     top: this.gY(),
  // //     width: rect.width,
  // //     height: rect.height,
  // //   };
  // // }

  // ngOnInit() {
  //   this.ngBondService.registerDraggableElement(this);
  //   this.updatePosition();
  // }

  // ngOnDestroy() {
  //   this.ngBondService.removeDraggableElement(this);
  // }
}
