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
  signal,
  viewChildren,
  AfterViewInit,
  OnInit,
  OnDestroy,
  effect,
  output,
  isSignal,
  computed,
  Host,
  Injector,
  afterNextRender,
} from '@angular/core';
import { makeDraggable } from '../util/drag.util';
import { NgBondProperty } from '../ng-bond-property/ng-bond-property';
import { NGBondItem, NgBondWorld } from '../ng-bond-world/ng-bond-world.component';
import { BehaviorSubject, distinctUntilChanged, filter, fromEvent, race, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { NgBondService } from '../../services/ngbond.service';
import { SelectionManager } from '../../services/selection.manager';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NgBondContainerHost } from '../../types/types';

@Directive({
  selector: '[bondcontainer]',
  standalone: true,
  exportAs: 'bondcontainer',
  host: {
    '[style.touchAction]': "'none'",
  },
})
export class NgBondContainer implements NGBondItem, OnDestroy {
  host = inject(NgBondContainerHost, { optional: true });

  injector = inject(Injector);

  static inspectableProperties = [
    {
      name: 'x',
      type: 'number',
      setterName: 'x',
      isSignal: true,
    },
    {
      name: 'y',
      type: 'number',
      setterName: 'y',
      isSignal: true,
    },
    {
      name: 'width',
      event: 'widthUpdated',
      type: 'number',
      setterName: 'width',
      isSignal: true,
    },
    {
      name: 'height',
      evenet: 'heightUpdated',
      type: 'number',
      setterName: 'height',
      isSignal: true,
    },
    {
      name: 'position',
      event: 'positionUpdated',
      type: 'number',
      setterName: 'position',
      isSignal: true,
    },
  ];

  get inspectableProperties() {
    return NgBondContainer.inspectableProperties;
  }

  el: ElementRef = inject(ElementRef);

  @Input()
  positioning: 'none' | 'absolute' | 'transform' = 'absolute';

  resizable = input<boolean>(true);

  draggable = input<boolean>(true);

  id = input<string>('', { alias: 'bondcontainer' });

  @Input()
  minWidth = 0;

  @Input()
  minHeight = 0;

  showCursor = input<boolean>(true);

  parentContainer = signal<NGBondItem | null>(null);

  minX = input<number>(Number.NEGATIVE_INFINITY);
  maxX = input<number>(Number.POSITIVE_INFINITY);
  minY = input<number>(Number.NEGATIVE_INFINITY);
  maxY = input<number>(Number.POSITIVE_INFINITY);

  x = model(0);
  y = model(0);

  gY = computed(() => {
    return this.y() + (this.parentContainer()?.gY() || 0);
  });

  gX = computed(() => {
    return this.x() + (this.parentContainer()?.gX() || 0);
  });

  width = signal<number>(0);
  height = signal<number>(0);

  _widthChanged = toSignal(toObservable(this.width).pipe(distinctUntilChanged()));
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
  dragContainerContentChildren = contentChildren<NgBondContainer>(NgBondContainer, { descendants: false });

  dragViewChildren = viewChildren<NgBondProperty>(NgBondProperty);

  children = computed(() => {
    return this.dragContainerContentChildren().filter((c) => c.parentContainer() === this);
  });

  ngBondService = inject(NgBondService, { optional: true });
  selectionManager = inject(SelectionManager, { optional: true });

  dragWorld: NgBondWorld | null = inject(NgBondWorld, { optional: true });

  public type = 'container';

  disabled$ = new BehaviorSubject<boolean>(false);

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

  bounds = computed(() => {
    return {
      left: this.x() || 0,
      top: this.y() || 0,
      width: this.width() || 0,
      height: this.height() || 0,
    };
  });

  public globalBounds = computed(() => {
    return {
      left: this.gX() || 0,
      top: this.gY() || 0,
      width: this.width() || 0,
      height: this.height() || 0,
    };
  });

  constructor() {
    effect(() => {
      const isInitialized = this.initialized();
      if (!isInitialized) {
        console.warn('NgBondContainer not initialized yet, skipping setting parent container for children:', this.id());
        return;
      }
      console.log('PPP set children parent container:', this.id());

      this.draggableContentChildren().forEach((c) => c.container?.parentContainer.set(this));
      this.dragContainerContentChildren().forEach((c) => c.parentContainer.set(this));
      this.dragViewChildren().forEach((c) => c.container?.parentContainer.set(this));
    });

    effect(() => {
      const parentContainer = this.parentContainer();
      const inited = this.inited();
      if (parentContainer && inited) {
        console.log('parent container changed:', this.id(), parentContainer.gX(), parentContainer.gY());
        this.initialize();
      }
    });

    effect(() => {
      const x = this.x();
      const y = this.y();
      const inited = this.inited();
      this.setPositionImmediately(x, y);
    });

    effect(() => {
      const w = this._widthChanged();
      if (w && this.inited()) {
        this.updateWidth(w);
      }
    });

    effect(() => {
      const h = this._heightChanged();
      if (h && this.inited()) {
        this.updateHeight(h);
      }
    });
  }

  setPositionImmediately(x: number, y: number) {
    if (this.itemElement && this.positioning !== 'none') {
      if (this.positioning === 'absolute') {
        this.itemElement.style.left = `${x}px`;
        this.itemElement.style.top = `${y}px`;
      } else if (this.positioning === 'transform') {
        this.itemElement.style.transform = `translate(${x}px, ${y}px)`;
      }
    }
    this.positionUpdated.emit({ x, y });
  }

  disable() {
    this.disabled$.next(true);
  }

  enable() {
    this.disabled$.next(false);
  }

  private updateWidth(w: number) {
    if (this.itemElement) {
      this.positioning !== 'none' && (this.itemElement.style.width = `${w}px`);
      this.widthUpdated.emit(w);
    } else {
      console.warn('No item element to update width on');
    }
  }

  private updateHeight(h: number) {
    if (this.itemElement) {
      this.positioning !== 'none' && (this.itemElement.style.height = `${h}px`);
      this.heightUpdated.emit(h);
    } else {
      console.warn('No item element to update height on');
    }
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

  initialized = signal(false);

  getWorld() {
    let parentContainer = this.parentContainer();
    while (parentContainer) {
      if (parentContainer instanceof NgBondWorld) {
        return parentContainer;
      }
      if (typeof parentContainer.parentContainer === 'function') {
        parentContainer = parentContainer.parentContainer();
      } else {
        break;
      }
    }
    return null;
  }

  initialize() {
    if (this.initialized()) {
      console.warn('NgBondContainer already initialized:', this.id());
      return;
    }
    console.log('PPP initialize container', this.id());

    console.log('PPP WORLD ', this.getWorld());

    // setTimeout(() => {
    //   this.initialized.set(true);
    // }, 100);
    this.initialized.set(true);
    if (this.ngBondService) {
      this.ngBondService.registerDraggableElement(this);
    }
    this.updateBounds();

    if (this.positioning !== 'none') {
      // this.pos(this.x(), this.y());
      this.setPositionImmediately(this.x(), this.y());
    }

    if (this.itemRect && this.width() === 0 && this.height() === 0) {
      this.setWidth(this.itemRect.width);
      this.setHeight(this.itemRect.height);
    } else {
      this.updateWidth(this.width());
      this.updateHeight(this.height());
    }

    if (this.positioning === 'none') {
      this.updatePosition();
    }

    if (!this.itemElement) {
      return;
    }

    if (!this.draggable()) {
      this.inited.set(true);
      return;
    }

    this.setUpDraggable();
    this.inited.set(true);
  }

  setUpDraggable() {
    if (!this.itemElement) {
      return;
    }
    const drag = makeDraggable(this.itemElement, this.disabled$);

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
      this.resizeOffset = this.resizable() ? this.resizeOffset : 0;

      const isBottomHeightDrag = move.startOffsetY > this.itemRect.height - this.resizeOffset;
      const isLeftWidthDrag = move.startOffsetX < this.resizeOffset;
      const isRightWidthDrag = move.startOffsetX > this.itemRect.width - this.resizeOffset;
      const isTopHeightDrag = move.startOffsetY < this.resizeOffset;

      if (this.resizable() === false || (!isBottomHeightDrag && !isLeftWidthDrag && !isRightWidthDrag && !isTopHeightDrag)) {
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
        const bounds = this.globalBounds();
        const x = evt.x - bounds.left - this.worldRect.left;
        const y = evt.y - bounds.top - this.worldRect.top;

        const isBottomHeightDrag = y > bounds.height - this.resizeOffset;
        const isLeftWidthDrag = x < this.resizeOffset;
        const isRightWidthDrag = x > bounds.width - this.resizeOffset;
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
  }

  ngAfterViewInit() {
    // This is needed to ensure that the initial position is set correctly after the view is initialized
    this.inited.set(true);
  }

  updatePosition() {
    const itemElement = this.el?.nativeElement;
    // const parentElement = itemElement.parentElement;

    // let worldRect = { left: 0, top: 0 };
    // if (this.dragWorld) {
    //   const worldElement = this.dragWorld.el.nativeElement;
    //   worldRect = worldElement.getBoundingClientRect();
    // }

    const itemRect = itemElement.getBoundingClientRect();

    // if (!this.parentContainer()) {
    //   console.warn('No parent container set for NgBondContainer, cannot update position.');
    //   return;
    // }

    const containerX = this.parentContainer()?.gX?.() || 0;
    const containerY = this.parentContainer()?.gY?.() || 0;

    const x = itemRect.left - containerX - (this.getWorld()?.rect?.left || 0);
    const y = itemRect.top - containerY - (this.getWorld()?.rect?.top || 0);

    this.x.set(x);
    this.y.set(y);

    // this.draggableContentChildren().forEach((c) => c.container?.updatePosition());
    // this.dragContainerContentChildren().forEach((c) => c.updatePosition());
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
      console.log('no item element to set position on');
      return;
    }
    console.log('Setting position:', this.id(), x, y);

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
