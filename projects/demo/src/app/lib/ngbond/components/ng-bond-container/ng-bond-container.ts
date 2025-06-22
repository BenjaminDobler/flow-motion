import {
  contentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  inject,
  input,
  Input,
  model,
  Output,
  viewChildren,
} from '@angular/core';
import { makeDraggable } from '../util/drag.util';
import { NgBondProperty } from '../ng-bond-property/ng-bond-property';
import { NgBondWorld } from '../ng-bond-world/ng-bond-world.component';
import { Subject, takeUntil } from 'rxjs';
import { NgBondService } from '../../services/ngbond.service';

@Directive({
  selector: '[bondcontainer]',
  standalone: true,
  exportAs: 'bondcontainer',
})
export class NgBondContainer {
  el: ElementRef = inject(ElementRef);

  @Input()
  positioning: 'none' | 'absolute' | 'transform' = 'absolute';

  @Input()
  resizable = true;

  id = input<string>('', { alias: 'bondcontainer' });

  @Input()
  minWidth = 0;

  @Input()
  minHeight = 0;

  x = model(0);
  y = model(0);

  gX = model(0);
  gY = model(0);

  @Output()
  positionUpdated: EventEmitter<{ x: number; y: number }> = new EventEmitter<{
    x: number;
    y: number;
  }>();

  @Output()
  widthUpdated: EventEmitter<number> = new EventEmitter<number>();

  @Output()
  heightUpdated: EventEmitter<number> = new EventEmitter<number>();

  onDestroy$ = new Subject<void>();

  public resizeOffset = 5;

  draggableContentChildren = contentChildren<NgBondProperty>(NgBondProperty, {
    descendants: true,
  });
  dragContainerContentChildren = contentChildren<NgBondContainer>(
    NgBondContainer,
    { descendants: true },
  );

  dragViewChildren = viewChildren<NgBondProperty>(NgBondProperty);

  ngBondService: NgBondService = inject(NgBondService);

  dragWorld: NgBondWorld = inject(NgBondWorld);

  get bounds() {
    const rect = this.el.nativeElement.getBoundingClientRect();
    return {
      left: this.gX(),
      top: this.gY(),
      width: rect.width,
      height: rect.height,
    };
  }

  ngAfterViewInit() {
    const itemElement = this.el?.nativeElement;
    let parentElement = itemElement.parentElement;
    let parentRect = parentElement.getBoundingClientRect();
    let itemRect = itemElement.getBoundingClientRect();
    let worldRect = parentRect;
    if (this.dragWorld) {
      let worldEl = this.dragWorld.el.nativeElement;
      worldRect = worldEl.getBoundingClientRect();
    }

    const setWidth = (width: number) => {
      this.positioning !== 'none' && (itemElement.style.width = `${width}px`);
      this.widthUpdated.emit(width);
    };
    const setHeight = (height: number) => {
      this.positioning !== 'none' && (itemElement.style.height = `${height}px`);
      this.heightUpdated.emit(height);
    };

    const pos = (x: number, y: number) => {
      if (this.positioning === 'absolute') {
        itemElement.style.left = `${x}px`;
        itemElement.style.top = `${y}px`;
      } else if (this.positioning === 'transform') {
        itemElement.style.transform = `translate(${x}px, ${y}px)`;
      }

      this.x.set(x);
      this.y.set(y);

      const gX = x + parentRect.left - worldRect.left;
      const gY = y + parentRect.top - worldRect.top;

      this.gX.set(gX);
      this.gY.set(gY);

      this.draggableContentChildren().forEach((c) => c.updatePosition());
      this.dragContainerContentChildren().forEach((c) => c.updatePosition());
      this.dragViewChildren().forEach((c) => c.updatePosition());

      this.positionUpdated.emit({ x, y });
    };

    const drag = makeDraggable(itemElement);

    drag.dragStart$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
      itemRect = itemElement.getBoundingClientRect();
      parentRect = parentElement.getBoundingClientRect();
    });
    drag.dragMove$.pipe(takeUntil(this.onDestroy$)).subscribe((move) => {
      this.resizeOffset = this.resizable ? this.resizeOffset : 0;

      const isBottomHeightDrag =
        move.startOffsetY > itemRect.height - this.resizeOffset;
      const isLeftWidthDrag = move.startOffsetX < this.resizeOffset;
      const isRightWidthDrag =
        move.startOffsetX > itemRect.width - this.resizeOffset;
      const isTopHeightDrag = move.startOffsetY < this.resizeOffset;

      if (
        !isBottomHeightDrag &&
        !isLeftWidthDrag &&
        !isRightWidthDrag &&
        !isTopHeightDrag
      ) {
        const offsetX = move.originalEvent.x - move.startOffsetX;
        const offsetY = move.originalEvent.y - move.startOffsetY;

        const x = offsetX - parentRect.left;
        const y = offsetY - parentRect.top;

        pos(x, y);
      } else if (isBottomHeightDrag) {
        let height =
          move.originalEvent.y -
          itemRect.top +
          itemRect.height -
          move.startOffsetY;
        height = Math.max(height, this.minHeight);
        setHeight(height);
      } else if (isRightWidthDrag) {
        let width =
          move.originalEvent.x -
          itemRect.left +
          itemRect.width -
          move.startOffsetX;
        width = Math.max(width, this.minWidth);

        setWidth(width);
      } else if (isLeftWidthDrag) {
        const x = move.originalEvent.x - move.startOffsetX - parentRect.left;
        const y = move.originalEvent.y - move.startOffsetY - parentRect.top;
        const width = itemRect.left - parentRect.left + itemRect.width - x;

        if (width > this.minWidth) {
          pos(x, y);
          setWidth(width);
        }
      } else if (isTopHeightDrag) {
        const x = move.originalEvent.x - move.startOffsetX - parentRect.left;

        const y = move.originalEvent.y - move.startOffsetY - parentRect.top;
        const height = itemRect.top - parentRect.top + itemRect.height - y;
        if (height > this.minHeight) {
          pos(x, y);
          setHeight(height);
        }
      }
    });

    // drag.dragStart$.pipe(takeUntilDestroyed()).subscribe(() => {
    //   // console.log('drag start');
    // });
  }

  constructor() {}

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

    this.draggableContentChildren().forEach((c) => c.updatePosition());
    this.dragContainerContentChildren().forEach((c) => c.updatePosition());
  }

  ngOnInit() {
    this.ngBondService.registerDraggableElement(this);
    this.updatePosition();
  }

  ngOnDestroy() {
    this.ngBondService.removeDraggableElement(this);
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}
