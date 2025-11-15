import { Directive, ElementRef, EventEmitter, inject, input, Input, Output, AfterViewInit, output } from '@angular/core';
import { makeDraggable } from './drag.util';
import { Subject, takeUntil } from 'rxjs';

@Directive({
  selector: '[draggable]',
})
export class DraggerDirective implements AfterViewInit {
  el: ElementRef = inject(ElementRef);

  @Input()
  positioning: 'none' | 'absolute' | 'transform' = 'absolute';

  @Input()
  axis: 'both' | 'horizontal' | 'vertical' = 'both';

  @Input()
  resizable = true;

  @Input()
  minWidth = 0;

  @Input()
  minHeight = 0;

  minX = input<number>();
  maxX = input<number>();

  minY = input<number>();
  maxY = input<number>();

  @Output()
  positionUpdated: EventEmitter<{ x: number; y: number }> = new EventEmitter<{
    x: number;
    y: number;
  }>();

  dragStart = output<void>();
  dragEnd = output<void>();

  @Output()
  widthUpdated: EventEmitter<number> = new EventEmitter<number>();

  @Output()
  heightUpdated: EventEmitter<number> = new EventEmitter<number>();

  onDestroy$ = new Subject<void>();

  public resizeOffset = 5;

  ngAfterViewInit() {
    const itemElement = this.el?.nativeElement;
    const parentElement = itemElement.parentElement;

    let parentRect = parentElement.getBoundingClientRect();
    let itemRect = itemElement.getBoundingClientRect();

    const setWidth = (width: number) => {
      if (this.positioning !== 'none') {
        itemElement.style.width = `${width}px`;
      }
      this.widthUpdated.emit(width);
    };
    const setHeight = (height: number) => {
      if (this.positioning !== 'none') {
        itemElement.style.height = `${height}px`;
      }
      this.heightUpdated.emit(height);
    };

    const pos = (x: number, y: number) => {
      if (typeof this.minX() === 'number') {
        x = Math.max(this.minX() as number, x);
      }

      if (typeof this.minY() === 'number') {
        y = Math.max(this.minY() as number, y);
      }

      if (typeof this.maxY() === 'number') {
        y = Math.min(this.maxY() as number, y);
      }

      if (typeof this.maxX() === 'number') {
        x = Math.min(this.maxX() as number, x);
      }
      if (this.positioning === 'absolute') {
        if (this.axis === 'both' || this.axis === 'horizontal') {
          itemElement.style.left = `${x}px`;
        }
        if (this.axis === 'both' || this.axis === 'vertical') {
          itemElement.style.top = `${y}px`;
        }
      } else if (this.positioning === 'transform') {
        if (this.axis === 'both') {
          itemElement.style.transform = `translate(${x}px, ${y}px)`;
        } else if (this.axis === 'vertical') {
          itemElement.style.transform = `translateY(${y}px)`;
        } else {
          itemElement.style.transform = `translateX(${x}px)`;
        }
      }
      this.positionUpdated.emit({ x, y });
    };

    const drag = makeDraggable(itemElement);

    drag.dragStart$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
      itemRect = itemElement.getBoundingClientRect();
      parentRect = parentElement.getBoundingClientRect();
      this.dragStart.emit();
    });
    drag.dragMove$.pipe(takeUntil(this.onDestroy$)).subscribe((move) => {
      this.resizeOffset = this.resizable ? this.resizeOffset : 0;

      console.log('start offset x/y', move.startOffsetX);

      const isBottomHeightDrag = move.startOffsetY > itemRect.height - this.resizeOffset;
      const isLeftWidthDrag = move.startOffsetX < this.resizeOffset;
      const isRightWidthDrag = move.startOffsetX > itemRect.width - this.resizeOffset;
      const isTopHeightDrag = move.startOffsetY < this.resizeOffset;

      if (!this.resizable || (!isBottomHeightDrag && !isLeftWidthDrag && !isRightWidthDrag && !isTopHeightDrag)) {
        const offsetX = move.originalEvent.x - move.startOffsetX;
        const offsetY = move.originalEvent.y - move.startOffsetY;

        const x = offsetX - parentRect.left;
        const y = offsetY - parentRect.top;
        pos(x, y);
      } else if (isBottomHeightDrag) {
        let height = move.originalEvent.y - itemRect.top + itemRect.height - move.startOffsetY;
        height = Math.max(height, this.minHeight);
        setHeight(height);
      } else if (isRightWidthDrag) {
        let width = move.originalEvent.x - itemRect.left + itemRect.width - move.startOffsetX;
        width = Math.max(width, this.minWidth);
        console.log('set width', width);
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

    drag.dragStart$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
      // console.log('drag start');
    });

    drag.dragEnd$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
      this.dragEnd.emit();
    });
  }

  ngDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}
