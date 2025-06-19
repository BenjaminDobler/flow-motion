import {
  Directive,
  ElementRef,
  inject,
  input,
  model,
  output,
  Signal,
  signal,
} from '@angular/core';
import { makeDraggable } from '../util/drag.util';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgBondWorld } from '../ng-bond-world/ng-bond-world.component';
import { Link, NgBondService } from '../../services/ngbond.service';

export type LinkPosition = 'Left' | 'Right' | 'Top' | 'Bottom';

@Directive({
  selector: '[bondproperty]',
  standalone: true,
  exportAs: 'bondproperty',
  host: {
    '[class.has-link]': 'this.hasLink()',
  },
})
export class NgBondProperty {
  hasLink = signal<boolean>(false);
  isStartOfLink = signal<boolean>(false);
  isEndOfLink = signal<boolean>(false);
  el: ElementRef = inject(ElementRef);

  id = input<string>('', { alias: 'bondproperty' });

  bondcolor = input<string>('');
  bondstrokewidth = input<number>();

  // Positions within the parent
  x = model(0);
  y = model(0);

  // global positions within the bond world
  gX = model(0);
  gY = model(0);

  positionUpdated = output<{ x: number; y: number }>();
  widthUpdated = output<number>();
  heightUpdated = output<number>();

  public resizeOffset = 5;

  ngBondService: NgBondService = inject(NgBondService);

  dragWorld: NgBondWorld = inject(NgBondWorld);

  constructor() {
    const itemElement = this.el.nativeElement;
    const drag = makeDraggable(itemElement);

    const dragPreview = {
      gX: signal<number>(0),
      gY: signal<number>(0),
    };

    let parentElement = itemElement.parentElement;
    let parentRect = parentElement.getBoundingClientRect();
    let itemRect = itemElement.getBoundingClientRect();
    let worldRect = parentRect;
    let currentPreview: Signal<Link> | null;
    let isFirstMove = true;

    drag.dragStart$.pipe(takeUntilDestroyed()).subscribe((evt) => {
      itemRect = itemElement.getBoundingClientRect();
      parentRect = parentElement.getBoundingClientRect();
      worldRect = parentRect;
      isFirstMove = true;
      if (this.dragWorld) {
        let worldEl = this.dragWorld.el.nativeElement;
        worldRect = worldEl.getBoundingClientRect();
      }
    });

    drag.dragMove$.subscribe((move) => {
      if (isFirstMove && this.id()) {
        currentPreview = this.ngBondService.createLink(
          this.id(),
          dragPreview,
        ) as any;
        isFirstMove = false;
      }
      const offsetX = move.originalEvent.x - move.startOffsetX;
      const offsetY = move.originalEvent.y - move.startOffsetY;

      const x = offsetX - parentRect.left;
      const y = offsetY - parentRect.top;

      const gX = x + parentRect.left - worldRect.left;
      const gY = y + parentRect.top - worldRect.top;

      dragPreview.gX.set(gX);
      dragPreview.gY.set(gY);
    });

    drag.dragEnd$.subscribe((e) => {
      const targetComp = this.ngBondService.getComponent(
        e.originalEvent.target,
      );

      if (this.id() && targetComp?.id()) {
        this.ngBondService.createLink(this.id(), targetComp.id());
      }

      if (currentPreview) {
        this.ngBondService.removePreview(currentPreview);
      }
    });
  }

  position(): LinkPosition {
    const itemElement = this.el?.nativeElement;
    const parentElement = itemElement.parentElement;
    const parentRect = parentElement.getBoundingClientRect();
    const centerX = parentRect.width / 2;
    const centerY = parentRect.height / 2;
    const angleDeg =
      (Math.atan2(centerY - this.y(), centerX - this.x()) * 180) / Math.PI;
    let heading = (360 + angleDeg) % 360;

    let position: LinkPosition;
    if (heading < 40 || heading > 320) {
      position = 'Left';
    } else if (heading < 140) {
      position = 'Top';
    } else if (heading < 220) {
      position = 'Right';
    } else {
      position = 'Bottom';
    }
    return position;
  }

  updatePosition() {
    const itemElement = this.el?.nativeElement;
    let parentElement = itemElement.parentElement;

    let worldRect = { left: 0, top: 0 };
    if (this.dragWorld) {
      const worldElement = this.dragWorld.el.nativeElement;
      worldRect = worldElement.getBoundingClientRect();
    }

    let parentRect = parentElement.getBoundingClientRect();
    let itemRect = itemElement.getBoundingClientRect();
    const x = itemRect.left - parentRect.left;
    const y = itemRect.top - parentRect.top;
    this.x.set(x);
    this.y.set(y);

    const gX = parentRect.left + x - worldRect.left;
    const gY = parentRect.top + y - worldRect.top;

    this.gX.set(gX);
    this.gY.set(gY);
  }

  ngOnInit() {
    this.ngBondService.registerDraggableElement(this);
    this.updatePosition();
  }

  ngOnDestroy() {
    this.ngBondService.removeDraggableElement(this);
  }
}
