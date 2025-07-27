import { contentChildren, Directive, ElementRef, EventEmitter, inject, input, Input, model, Output, signal, viewChildren, AfterViewInit, OnInit, OnDestroy, effect, output } from '@angular/core';
import { makeDraggable } from '../util/drag.util';
import { NgBondProperty } from '../ng-bond-property/ng-bond-property';
import { NgBondWorld } from '../ng-bond-world/ng-bond-world.component';
import { distinctUntilChanged, fromEvent, race, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { NgBondService } from '../../services/ngbond.service';
import { SelectionManager } from '../../services/selection.manager';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

@Directive({
  selector: '[bondcontainer]',
  standalone: true,
  exportAs: 'bondcontainer',
  host: {
    '[style.touchAction]': "'none'",
  },
})
export class NgBondContainer implements OnInit, OnDestroy {
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

  showCursor = input<boolean>(true);

  minX = input<number>(Number.NEGATIVE_INFINITY);
  maxX = input<number>(Number.POSITIVE_INFINITY);
  minY = input<number>(Number.NEGATIVE_INFINITY);
  maxY = input<number>(Number.POSITIVE_INFINITY);

  x = model(0);
  y = model(0);

  gX = model(0);
  gY = model(0);

  width = signal<number>(0);
  height = signal<number>(0);

  _widthChanged = toSignal(
    toObservable(this.width).pipe(
      tap((x) => console.log('=========0 WWWW', x)),
      distinctUntilChanged()
    )
  );
  _heightChanged = toSignal(toObservable(this.height).pipe(distinctUntilChanged()));

  dragStart = output<void>();
  dragEnd = output<void>();

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

  public resizeOffset = 10;

  draggableContentChildren = contentChildren<NgBondProperty>(NgBondProperty, {
    descendants: true,
  });
  dragContainerContentChildren = contentChildren<NgBondContainer>(NgBondContainer, { descendants: true });

  dragViewChildren = viewChildren<NgBondProperty>(NgBondProperty);

  ngBondService = inject(NgBondService, { optional: true });
  selectionManager = inject(SelectionManager, { optional: true });

  dragWorld: NgBondWorld | null = inject(NgBondWorld, { optional: true });

  public type = 'container';

  inited = signal(false);

  private itemElement?: HTMLElement;
  private parentElement?: HTMLElement;
  private itemRect: DOMRect = {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    bottom: 0,
    right: 0,
    x: 0,
    y: 0,
    toJSON: () => {},
  };
  private parentRect: DOMRect = {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    bottom: 0,
    right: 0,
    x: 0,
    y: 0,
    toJSON: () => {},
  };
  private worldRect: DOMRect = {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    bottom: 0,
    right: 0,
    x: 0,
    y: 0,
    toJSON: () => {},
  };

  public bounds = {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  };

  // get bounds() {
  //   const rect = this.el.nativeElement.getBoundingClientRect();
  //   return {
  //     left: this.gX(),
  //     top: this.gY(),
  //     width: rect.width,
  //     height: rect.height,
  //   };
  // }

  constructor() {
    effect(() => {
      const x = this.x();
      const y = this.y();
      const inited = this.inited();

      if (!this.itemElement) {
        return;
      }
      if (this.positioning === 'absolute') {
        this.itemElement.style.left = `${x}px`;
        this.itemElement.style.top = `${y}px`;
      } else if (this.positioning === 'transform') {
        this.itemElement.style.transform = `translate(${x}px, ${y}px)`;
      }

      // this.x.set(x);
      // this.y.set(y);

      const gX = x + this.parentRect.left - this.worldRect.left;
      const gY = y + this.parentRect.top - this.worldRect.top;

      const xBy = gX - this.gX();
      const yBy = gY - this.gY();

      this.bounds.left = x;
      this.bounds.top = y;

      this.gX.set(gX);
      this.gY.set(gY);

      // if (this.selectionManager && isSource) {
      //   this.selectionManager.moveBy(xBy, yBy, this);
      // }

      // this.gX.set(gX);
      // this.gY.set(gY);

      this.updateChildren();

      this.positionUpdated.emit({ x, y });
    });

    console.log('========= create width effect');
    effect(() => {
      const w = this._widthChanged();
      console.log('========= Width updated:', w);
      if (this.itemElement) {
        this.positioning !== 'none' && (this.itemElement.style.width = `${w}px`);
        console.log('========= Width updated:', w);
        this.widthUpdated.emit(w);
        this.bounds.width = w || 0;
        this.updateChildren();
      }
    });

    effect(() => {
      const h = this._heightChanged();
      if (this.itemElement) {
        this.positioning !== 'none' && (this.itemElement.style.height = `${h}px`);
        this.heightUpdated.emit(h);
        this.bounds.height = h || 0;
        this.updateChildren();
      }
    });
  }

  private updateBounds() {
    this.itemElement = this.el?.nativeElement;
    if (this.itemElement && this.itemElement.parentElement) {
      this.itemRect = this.itemElement.getBoundingClientRect();

      this.parentElement = this.itemElement.parentElement;
      this.parentRect = this.parentElement.getBoundingClientRect();
      this.worldRect = this.parentRect;
    }

    if (this.dragWorld) {
      const worldEl = this.dragWorld.el.nativeElement;
      this.worldRect = worldEl.getBoundingClientRect();
    }
  }

  setWidth = (width: number) => {
    if (width !== this.width()) {
      this.width.set(width);
    }
  };
  setHeight = (height: number) => {
    if (height !== this.height()) {
      this.height.set(height);
    }
  };

  ngAfterViewInit() {
    this.updateBounds();

    if (this.itemRect) {
      this.setWidth(this.itemRect.width);
      this.setHeight(this.itemRect.height);
    }

    this.pos(this.x(), this.y());

    if (!this.itemElement) {
      return;
    }

    const rect = this.el.nativeElement.getBoundingClientRect();
    this.bounds = {
      left: this.gX() || 0,
      top: this.gY() || 0,
      width: rect.width || 0,
      height: rect.height || 0,
    };

    const drag = makeDraggable(this.itemElement);

    drag.click$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
      if (this.selectionManager) {
        this.selectionManager.select(this);
      }
      this.updateBounds();
    });

    drag.dragStart$.pipe(takeUntil(this.onDestroy$)).subscribe((start) => {
      this.dragStart.emit();
      this.updateBounds();
      if (this.selectionManager) {
        if (!this.selectionManager.isSelected(this)) {
          this.selectionManager.unselectAll();
          this.selectionManager.select(this);
        }
      }
    });

    drag.dragEnd$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
      this.dragEnd.emit();
    });

    drag.dragMove$.pipe(takeUntil(this.onDestroy$)).subscribe((move) => {
      this.resizeOffset = this.resizable ? this.resizeOffset : 0;

      const isBottomHeightDrag = move.startOffsetY > this.itemRect.height - this.resizeOffset;
      const isLeftWidthDrag = move.startOffsetX < this.resizeOffset;
      const isRightWidthDrag = move.startOffsetX > this.itemRect.width - this.resizeOffset;
      const isTopHeightDrag = move.startOffsetY < this.resizeOffset;

      if (this.resizable === false || (!isBottomHeightDrag && !isLeftWidthDrag && !isRightWidthDrag && !isTopHeightDrag)) {
        const offsetX = move.originalEvent.x - move.startOffsetX;
        const offsetY = move.originalEvent.y - move.startOffsetY;
        let x = offsetX - this.parentRect.left;
        let y = offsetY - this.parentRect.top;

        if (this.ngBondService) {
          x = x / this.ngBondService.scale();
          y = y / this.ngBondService.scale();
        }
        this.pos(x, y);
      } else if (isBottomHeightDrag) {
        let height = move.originalEvent.y - this.itemRect.top + this.itemRect.height - move.startOffsetY;
        height = Math.max(height, this.minHeight);
        this.setHeight(height);
      } else if (isRightWidthDrag) {
        let width = move.originalEvent.x - this.itemRect.left + this.itemRect.width - move.startOffsetX;
        width = Math.max(width, this.minWidth);

        this.setWidth(width);
      } else if (isLeftWidthDrag) {
        const x = move.originalEvent.x - move.startOffsetX - this.parentRect.left;
        const width = this.itemRect.left - this.parentRect.left + this.itemRect.width - x;

        if (width > this.minWidth) {
          this.pos(x, this.y());
          this.setWidth(width);
        }
      } else if (isTopHeightDrag) {
        const y = move.originalEvent.y - move.startOffsetY - this.parentRect.top;
        const height = this.itemRect.top - this.parentRect.top + this.itemRect.height - y;
        if (height > this.minHeight) {
          this.pos(this.x(), y);
          this.setHeight(height);
        }
      }
    });

    const el = this.itemElement as HTMLElement;
    fromEvent<PointerEvent>(this.itemElement, 'pointerover')
      .pipe(
        switchMap(() => {
          return fromEvent<PointerEvent>(el, 'pointermove').pipe(takeUntil(race(fromEvent<PointerEvent>(el, 'pointerout'))));
        })
      )
      .subscribe((evt: PointerEvent) => {
        const x = evt.x - this.bounds.left - this.worldRect.left;
        const y = evt.y - this.bounds.top - this.worldRect.top;

        const isBottomHeightDrag = y > this.bounds.height - this.resizeOffset;
        const isLeftWidthDrag = x < this.resizeOffset;
        const isRightWidthDrag = x > this.bounds.width - this.resizeOffset;
        const isTopHeightDrag = y < this.resizeOffset;

        if (this.showCursor()) {
          if (isRightWidthDrag) {
            el.style.cursor = 'ew-resize';
          } else if (isLeftWidthDrag) {
            el.style.cursor = 'ew-resize';
          } else if (isBottomHeightDrag) {
            el.style.cursor = 'ns-resize';
          } else if (isTopHeightDrag) {
            el.style.cursor = 'ns-resize';
          } else {
            el.style.cursor = 'move';
          }
        }
      });

    this.inited.set(true);
  }

  private updateChildren() {
    this.draggableContentChildren().forEach((c) => c.updatePosition());
    this.dragContainerContentChildren().forEach((c) => c.updatePosition());
    this.dragViewChildren().forEach((c) => c.updatePosition());
  }

  updatePosition() {
    const itemElement = this.el?.nativeElement;
    const parentElement = itemElement.parentElement;

    let worldRect = { left: 0, top: 0 };
    if (this.dragWorld) {
      const worldElement = this.dragWorld.el.nativeElement;
      worldRect = worldElement.getBoundingClientRect();
    }

    const parentRect = parentElement.getBoundingClientRect();
    const itemRect = itemElement.getBoundingClientRect();
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
    if (this.ngBondService) {
      this.ngBondService.registerDraggableElement(this);
    }
    // this.updatePosition();
  }

  ngOnDestroy() {
    if (this.ngBondService) {
      this.ngBondService.removeDraggableElement(this);
    }
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  moveBy(x: number, y: number) {
    this.pos(this.x() + x, this.y() + y, false);
  }

  pos(x: number, y: number, isSource = true) {
    if (!this.itemElement) {
      return;
    }

    x = Math.max(this.minX(), Math.min(x, this.maxX()));
    y = Math.max(this.minY(), Math.min(y, this.maxY()));

    const xBy = x - this.x();
    const yBy = y - this.y();
    if (this.selectionManager && isSource) {
      this.selectionManager.moveBy(xBy, yBy, this);
    }

    this.x.set(x);
    this.y.set(y);
  }
}
