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
import { NgBondService, Link } from '../../services/ngbond.service';
import { NgBondWorld } from '../ng-bond-world/ng-bond-world.component';

@Directive({
  selector: '[bondproperty]',
  standalone: true,
  exportAs: 'bondproperty',
  host: {
    '[class.has-link]': 'this.hasLink()'
  }
})
export class NgBondProperty {

  hasLink = signal<boolean>(false);
  el: ElementRef = inject(ElementRef);

  id = input<string>('', { alias: 'bondproperty' });

  x = model(0);
  y = model(0);

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
      console.log('drag start');
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
      console.log('move ', this.id());
      if (isFirstMove && this.id()) {
        currentPreview = this.ngBondService.createPreviewLink(
          this.id(),
          dragPreview,
          '#dedede',
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
