import { Directive, ElementRef, inject, input, model, output, Signal, signal, OnInit, OnDestroy } from '@angular/core';
import { makeDraggable } from '../util/drag.util';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgBondWorld } from '../ng-bond-world/ng-bond-world.component';
import { Link, NgBondService } from '../../services/ngbond.service';
import { NgBondContainer } from '../ng-bond-container/ng-bond-container';

export type LinkPosition = 'left' | 'right' | 'top' | 'bottom';

@Directive({
  selector: '[bondproperty]',
  standalone: true,
  exportAs: 'bondproperty',
  host: {
    '[class.has-link]': 'this.hasLink()',
    '[style.touchAction]': "'none'",
  },
})
export class NgBondProperty implements OnInit, OnDestroy {
  hasLink = signal<boolean>(false);
  isStartOfLink = signal<boolean>(false);
  isEndOfLink = signal<boolean>(false);
  el: ElementRef = inject(ElementRef);

  id = input<string>('', { alias: 'bondproperty' });

  bondcolor = input<string>('');
  bondstrokewidth = input<number>();

  animatedLink = model<boolean>(false);
  // Positions within the parent
  x = model(0);
  y = model(0);

  width = model(0);
  height = model(0);

  // global positions within the bond world
  gX = model(0);
  gY = model(0);

  positionUpdated = output<{ x: number; y: number }>();
  widthUpdated = output<number>();
  heightUpdated = output<number>();

  public type = 'propertys';

  public resizeOffset = 5;

  ngBondService: NgBondService = inject(NgBondService);

  dragWorld: NgBondWorld | null = inject(NgBondWorld, { optional: true });

  container? = inject(NgBondContainer, { optional: true });

  constructor() {
    const itemElement = this.el.nativeElement;
    const drag = makeDraggable(itemElement);

    const dragPreview = {
      gX: signal<number>(0),
      gY: signal<number>(0),
      width: signal(0),
      height: signal(0),
    };

    const parentElement = this.parent();
    let parentRect = parentElement.getBoundingClientRect();
    let worldRect = parentRect;
    let currentPreview: Signal<Link> | null;
    let isFirstMove = true;

    drag.dragStart$.pipe(takeUntilDestroyed()).subscribe(() => {
      parentRect = parentElement.getBoundingClientRect();
      worldRect = parentRect;
      isFirstMove = true;
      if (this.dragWorld) {
        const worldEl = this.dragWorld.el.nativeElement;
        worldRect = worldEl.getBoundingClientRect();
      }
    });

    drag.dragMove$.subscribe((move) => {
      if (isFirstMove && this.id()) {
        this.ngBondService.currentDragSource = this;
        currentPreview = this.ngBondService.createLink(this.id(), dragPreview) as any;
        isFirstMove = false;
      }
      const offsetX = move.originalEvent.x - move.startOffsetX;
      const offsetY = move.originalEvent.y - move.startOffsetY;

      const x = offsetX - parentRect.left;
      const y = offsetY - parentRect.top;

      const gX = x + parentRect.left - worldRect.left;
      const gY = y + parentRect.top - worldRect.top;

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
  }

  position(): LinkPosition {
    const parentRect = this.parent().getBoundingClientRect();
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

  updatePosition() {
    const itemElement = this.el?.nativeElement;
    let worldRect = { left: 0, top: 0 };
    if (this.dragWorld) {
      const worldElement = this.dragWorld.el.nativeElement;
      worldRect = worldElement.getBoundingClientRect();
    }

    const parentRect = this.parent().getBoundingClientRect();
    const itemRect = itemElement.getBoundingClientRect();
    this.width.set(itemRect.width);
    this.height.set(itemRect.height);
    const x = itemRect.left - parentRect.left;
    const y = itemRect.top - parentRect.top;
    this.x.set(x);
    this.y.set(y);

    const gX = parentRect.left + x - worldRect.left;
    const gY = parentRect.top + y - worldRect.top;

    this.gX.set(gX);
    this.gY.set(gY);
  }

  private parent() {
    const itemElement = this.el?.nativeElement;
    let parentElement = itemElement.parentElement;
    if (this.container) {
      parentElement = this.container.el.nativeElement;
    }
    return parentElement;
  }

  ngOnInit() {
    this.ngBondService.registerDraggableElement(this);
    this.updatePosition();
  }

  ngOnDestroy() {
    this.ngBondService.removeDraggableElement(this);
  }
}
