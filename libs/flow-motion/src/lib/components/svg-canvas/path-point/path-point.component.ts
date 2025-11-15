import { ChangeDetectionStrategy, Component, ElementRef, inject, input, model, output } from '@angular/core';
import { makeDraggable } from '@richapps/ngx-drag';
import { Subject, takeUntil } from 'rxjs';
import { Point } from '../point';
import { getSnappedAnglePoint } from '../util';
import { KeyManager } from '../../../services/key.manager';

@Component({
  selector: 'path-point',
  imports: [],
  templateUrl: './path-point.component.html',
  styleUrl: './path-point.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PathPointComponent {
  onDestroy$ = new Subject<void>();

  el = inject<ElementRef<HTMLElement>>(ElementRef);
  keys = inject(KeyManager);

  dragStart = output<void>();
  dragEnd = output<void>();

  x = model<number>(0);
  y = model<number>(0);

  point = input.required<Point>();

  ngAfterViewInit() {
    this.setUpDraggable();
  }

  setUpDraggable() {
    const itemElement = this.el?.nativeElement;
    const parentElement = itemElement.parentElement?.parentElement;
    const parentRect = parentElement?.getBoundingClientRect() || { left: 0, top: 0 };

    const drag = makeDraggable(itemElement);

    drag.dragStart$.pipe(takeUntil(this.onDestroy$)).subscribe((start) => {
      this.dragStart.emit();
    });

    drag.dragEnd$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
      this.dragEnd.emit();
    });

    drag.dragMove$.pipe(takeUntil(this.onDestroy$)).subscribe((move) => {
      const offsetX = move.originalEvent.x - move.startOffsetX;
      const offsetY = move.originalEvent.y - move.startOffsetY;
      let x = offsetX - parentRect.left;
      let y = offsetY - parentRect.top;

      this.pos(x, y);
    });
  }

  pos(x: number, y: number) {
    // this.x.set(x);
    // this.y.set(y);
    const point = this.point();

    let newPoint = { x, y };
    if (point.centerPoint && this.keys.isKeyDown('Shift')) {
      newPoint = getSnappedAnglePoint(newPoint, point.centerPoint);
    }

    const diffX = newPoint.x - this.point().x;
    const diffY = newPoint.y - this.point().y;

    this.point().x = newPoint.x;
    this.point().y = newPoint.y;

    if (point.opposite && point.centerPoint) {
      const diffX = point.x - point.centerPoint.x;
      const diffY = point.y - point.centerPoint.y;

      point.opposite.x = point.centerPoint.x + -1 * diffX;
      point.opposite.y = point.centerPoint.y + -1 * diffY;
    }

    if (point.controlPoint1) {
      point.controlPoint1.x += diffX;
      point.controlPoint1.y += diffY;
    }

    if (point.controlPoint2) {
      point.controlPoint2.x += diffX;
      point.controlPoint2.y += diffY;
    }
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}
