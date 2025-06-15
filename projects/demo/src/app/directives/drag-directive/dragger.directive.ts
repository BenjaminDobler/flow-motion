import {
  contentChildren,
  Directive,
  effect,
  ElementRef,
  EventEmitter,
  inject,
  input,
  Input,
  model,
  Output,
  viewChildren,
} from '@angular/core';
import { makeDraggable } from './drag.util';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DragService } from '../../services/drag.service';
import { DragWorld } from '../drag-world/drag.world';
import { DragProperty } from '../drag-property/drag-property.directive';

@Directive({
  selector: '[draggable]',
  standalone: true,
  exportAs: 'draggable',
})
export class DraggerDirective {
  el: ElementRef = inject(ElementRef);

  @Input()
  positioning: 'none' | 'absolute' | 'transform' = 'absolute';

  @Input()
  resizable = true;

  @Input()
  id?: string;

  @Input()
  minWidth = 0;

  @Input()
  minHeight = 0;

  // @Input()
  // x = 0;

  // @Input()
  // y = 0;

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

  public resizeOffset = 5;

  draggableChildren = viewChildren<DragProperty>(DragProperty);
  draggableContentChildren =
    contentChildren<DragProperty>(DragProperty);

  dragService: DragService = inject(DragService);

  dragWorld: DragWorld = inject(DragWorld);

  constructor() {
    effect(() => {
      console.log(this.draggableChildren());
      console.log(this.draggableContentChildren());
    });
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

      this.positionUpdated.emit({ x, y });
    };

    const drag = makeDraggable(itemElement);

    drag.dragStart$.pipe(takeUntilDestroyed()).subscribe(() => {
      itemRect = itemElement.getBoundingClientRect();
      parentRect = parentElement.getBoundingClientRect();
    });
    drag.dragMove$.pipe(takeUntilDestroyed()).subscribe((move) => {
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

    drag.dragStart$.pipe(takeUntilDestroyed()).subscribe(() => {
      // console.log('drag start');
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
    this.dragService.registerDraggableElement(this);
    this.updatePosition();
  }

  ngOnDestroy() {
    this.dragService.removeDraggableElement(this);
  }
}
