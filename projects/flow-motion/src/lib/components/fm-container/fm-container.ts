import { Directive, ElementRef, inject, input, Input, model, signal, OnDestroy, effect, output, computed, Injector } from '@angular/core';
import { FMItem, FMWorld } from '../fm-world/fm-world';
import { BehaviorSubject, distinctUntilChanged, fromEvent, race, Subject, switchMap, takeUntil } from 'rxjs';
import { FMService } from '../../services/fm.service';
import { SelectionManager } from '../../services/selection.manager';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { makeDraggable } from '@richapps/ngx-drag';
import { InspectableProperty } from '../../types/types';

@Directive({
  selector: '[fm-container]',
  standalone: true,
  exportAs: 'fm-container',
  host: {
    '[style.touchAction]': "'none'",
    '[class.selected]': 'isSelected()',
    '[class.approached]': 'isApproached()',
    '[class.editMode]': 'editMode()',
    '[class.backgroundMode]': 'backgroundMode()',
    '(dblclick)': 'onDblClick($event)',
  },
})
export class FMContainer implements FMItem, OnDestroy {
  injector = inject(Injector);

  static inspectableProperties: InspectableProperty[] = [
    {
      name: 'x',
      alias: 'X',
      prefix: 'X',
      category: 'Position',
      type: 'number',
      noneAnimatable: true,
      group: {
        name: 'Position',
      },
    },
    {
      name: 'y',
      alias: 'Y',
      prefix: 'Y',
      category: 'Position',
      noneAnimatable: true,
      type: 'number',
      group: {
        name: 'Position',
      },
    },
    {
      name: 'width',
      alias: 'W',
      prefix: 'W',
      category: 'Layout',
      type: 'number',
      group: {
        name: 'Size',
      },
    },
    {
      name: 'height',
      prefix: 'H',
      category: 'Layout',
      alias: 'H',
      type: 'number',
      group: {
        name: 'Size',
      },
    },
    {
      name: 'position',
      event: 'positionUpdated',
      type: 'number',
      noneSerializable: true,
    },
    {
      name: 'displayName',
      label: 'Name',
      type: 'string',
      noneAnimatable: true,
    },
    {
      name: 'rotate',
      type: 'number',
      prefixIcon: 'rotate',
    },
    // {
    //   name: 'bounds',
    //   type: 'DOMRect',
    //   noneSerializable: true,
    //   readonly: true,
    // },
    // {
    //   name: 'globalBounds',
    //   type: 'DOMRect',
    //   noneSerializable: true,
    //   readonly: true,
    // },
    {
      category: 'Connection',
      name: 'connectionOffset',
      label: 'Offset',
      type: 'number',
    },
    {
      category: 'Connection',

      name: 'leftTopPosition',
      label: 'Left Top',
      type: 'number',
    },
    {
      category: 'Connection',
      name: 'rightTopPosition',
      label: 'Right Top',
      type: 'number',
    },
    {
      category: 'Connection',
      name: 'leftBottomPosition',
      label: 'Left Bottom',
      type: 'number',
    },
    {
      category: 'Connection',
      name: 'rightBottomPosition',
      label: 'Right Bottom',
      type: 'number',
    },
  ];

  get inspectableProperties() {
    return FMContainer.inspectableProperties;
  }

  el: ElementRef = inject(ElementRef);

  connectionOffset = model(0);
  leftTopPosition = model(50);
  rightTopPosition = model(50);
  leftBottomPosition = model(50);
  rightBottomPosition = model(50);

  editMode = signal<boolean>(false);
  backgroundMode = signal<boolean>(false);

  @Input()
  positioning: 'none' | 'absolute' | 'transform' = 'absolute';

  resizable = model<boolean>(true);

  draggable = input<boolean>(true);

  id = model<string>('', { alias: 'fm-container' });
  displayName = model<string>('');

  minWidth = input<number>(0);
  minHeight = input<number>(0);

  showCursor = input<boolean>(true);

  // parentContainer = signal<NGBondItem | null>(null);

  minX = input<number>(Number.NEGATIVE_INFINITY);
  maxX = input<number>(Number.POSITIVE_INFINITY);
  minY = input<number>(Number.NEGATIVE_INFINITY);
  maxY = input<number>(Number.POSITIVE_INFINITY);

  x = model(0);
  y = model(0);

  rotate = model(0);

  gY = computed(() => {
    return this.y() + (this.parent()?.gY() || 0);
  });

  gX = computed(() => {
    return this.x() + (this.parent()?.gX() || 0);
  });

  width = model<number>(0);
  height = model<number>(0);

  _widthChanged = toSignal(toObservable(this.width).pipe(distinctUntilChanged()));
  _heightChanged = toSignal(toObservable(this.height).pipe(distinctUntilChanged()));

  dragStart = output<void>();
  dragEnd = output<void>();

  positionUpdated = output<{ x: number; y: number; xBy: number; yBy: number }>();
  widthUpdated = output<number>();
  heightUpdated = output<number>();

  onDestroy$ = new Subject<void>();

  public resizeOffset = 10;

  isSelected = signal(false);
  isApproached = signal(false);

  ngBondService = inject(FMService, { optional: true });
  selectionManager = inject(SelectionManager, { optional: true });

  world: FMWorld | null = inject(FMWorld, { optional: true });

  public type = 'container';

  disabled$ = new BehaviorSubject<boolean>(false);

  inited = signal(false);

  ignoreSelectionManagement = model<boolean>(false);

  children = signal<FMItem[]>([]);

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

  parentContainer: FMContainer | null = inject(FMContainer, {
    optional: true,
    skipSelf: true,
  });

  parent = signal<FMItem | null>(null);

  constructor() {
    this.parent.set(this.parentContainer || this.world || null);

    this.parent()?.addChild(this);

    // effect(() => {
    //   const selectionManagerDisabled = this.selectionManager?.disabled() || false;
    //   console.log('Container selection manager disabled changed to ', selectionManagerDisabled);
    //   //this.disabled$.next(selectionManagerDisabled);
    // });

    

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

  onDblClick(evt: MouseEvent) {
    if (this.selectionManager) {
      this.selectionManager.onContainerDblClick(this, evt);
    }
  }

  addChild(child: FMItem) {
    this.children.update((c) => [...c, child]);
  }

  removeChild(child: FMItem) {
    this.children.update((c) => c.filter((cChild) => cChild !== child));
  }

  previousX = 0;
  previousY = 0;

  setPositionImmediately(x: number, y: number) {
    const xBy = x - this.previousX;
    const yBy = y - this.previousY;

    if (this.itemElement && this.positioning !== 'none') {
      if (this.positioning === 'absolute') {
        this.itemElement.style.left = `${x}px`;
        this.itemElement.style.top = `${y}px`;
      } else if (this.positioning === 'transform') {
        this.itemElement.style.transform = `translate(${x}px, ${y}px) rotate(${this.rotate() || 0}deg)`;
      }
    }
    this.previousX = x;
    this.previousY = y;
    this.positionUpdated.emit({ x, y, xBy, yBy });
  }

  disable() {
    if (this.disabled$.getValue() === true) {
      return;
    }
    this.disabled$.next(true);
  }

  enable() {
    if (this.disabled$.getValue() === false) {
      return;
    }
    this.disabled$.next(false);
  }

  selected(value: boolean) {
    this.isSelected.set(value);
  }

  approached(value: boolean) {
    this.isApproached.set(value);
  }

  private updateWidth(w: number) {
    if (this.itemElement) {
      this.positioning !== 'none' && (this.itemElement.style.width = `${w}px`);
      this.widthUpdated.emit(w);
    }
  }

  private updateHeight(h: number) {
    if (this.itemElement) {
      this.positioning !== 'none' && (this.itemElement.style.height = `${h}px`);
      this.heightUpdated.emit(h);
    }
  }

  private updateBounds() {
    const scale = this.ngBondService ? this.ngBondService.scale() : 1;
    this.itemElement = this.el?.nativeElement;
    if (this.itemElement && this.itemElement.parentElement) {
      this.itemRect = this.itemElement.getBoundingClientRect();

      this.parentElement = this.itemElement.parentElement;
      this.parentRect = this.parentElement.getBoundingClientRect();
      this.worldRect = this.parentRect;
    }

    if (this.world) {
      const worldEl = this.world.el.nativeElement;
      this.worldRect = worldEl.getBoundingClientRect();
    }
  }

  setWidth = (width: number) => {
    if (width !== this.width()) {
      this.width.set(Math.round(width));
    }
  };
  setHeight = (height: number) => {
    if (height !== this.height()) {
      this.height.set(Math.round(height));
    }
  };

  onInitialized = output<boolean>();

  initialized = signal(false);

  initialize() {
    this.initialized.set(true);
    if (this.ngBondService) {
      this.ngBondService.registerDraggableElement(this);
    }
    this.updateBounds();

    if (this.positioning !== 'none') {
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
      setTimeout(() => {
        //this.logRect();
        this.updatePosition();
      });
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

    this.onInitialized.emit(true);
  }

  setUpDraggable() {
    if (!this.itemElement) {
      return;
    }

    const drag = makeDraggable(this.itemElement, this.disabled$);
    let scale = 1;

    const bottomHeightDrag = (x: number, y: number) => {
      let height = y - this.y();
      height = Math.max(height, this.minHeight());
      this.setHeight(height);
    };

    const rightWidthDrag = (x: number, y: number) => {
      let width = x - this.x();
      width = Math.max(width, this.minWidth());
      this.setWidth(width);
    };

    const leftWidthDrag = (x: number, y: number) => {
      let width = this.x() + this.width() - x;
      if (width > this.minWidth()) {
        this.pos(x, this.y());
        this.setWidth(width);
      }
    };

    const topHeightDrag = (x: number, y: number) => {
      let height = this.y() + this.height() - y;
      if (height > this.minHeight()) {
        this.pos(this.x(), y);
        this.setHeight(height);
      }
    };

    drag.click$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
      if (this.selectionManager) {
        this.selectionManager.select(this);
      }
      this.updateBounds();
    });

    drag.dragStart$.pipe(takeUntil(this.onDestroy$)).subscribe((start) => {
      scale = this.ngBondService ? this.ngBondService.scale() : 1;
      this.dragStart.emit();
      this.updateBounds();
      if (this.selectionManager) {
        this.selectionManager.dragStart(this);

        if (!this.selectionManager.isSelected(this)) {
          this.selectionManager.unselectAll();
          this.selectionManager.select(this);
        }
      }
    });

    drag.dragEnd$.pipe(takeUntil(this.onDestroy$)).subscribe(() => {
      this.selectionManager?.dragEnd(this);
      this.dragEnd.emit();
    });

    drag.dragMove$.pipe(takeUntil(this.onDestroy$)).subscribe((move) => {
      this.resizeOffset = this.resizable() ? this.resizeOffset : 0;

      const isBottomHeightDrag = move.startOffsetY > this.itemRect.height - this.resizeOffset;
      const isLeftWidthDrag = move.startOffsetX < this.resizeOffset;
      const isRightWidthDrag = move.startOffsetX > this.itemRect.width - this.resizeOffset;
      const isTopHeightDrag = move.startOffsetY < this.resizeOffset;

      const bottomRightCornerDrag = isBottomHeightDrag && isRightWidthDrag;
      const bottomLeftCornerDrag = isBottomHeightDrag && isLeftWidthDrag;
      const topLeftCornerDrag = isTopHeightDrag && isLeftWidthDrag;
      const topRightCornerDrag = isTopHeightDrag && isRightWidthDrag;

      if (this.resizable() === false || (!isBottomHeightDrag && !isLeftWidthDrag && !isRightWidthDrag && !isTopHeightDrag)) {
        let offsetX = move.originalEvent.x - move.startOffsetX;
        let offsetY = move.originalEvent.y - move.startOffsetY;

        let x = offsetX - this.parentRect.left;
        let y = offsetY - this.parentRect.top;

        x = x / scale;
        y = y / scale;

        this.pos(x, y);
      }

      if (isBottomHeightDrag || bottomRightCornerDrag || bottomLeftCornerDrag) {
        let offsetY = move.originalEvent.y;
        let y = offsetY - this.parentRect.top;
        y = y / scale;
        bottomHeightDrag(0, y);
      }

      if (isRightWidthDrag || bottomRightCornerDrag || topRightCornerDrag) {
        let offsetX = move.originalEvent.x;
        let x = offsetX - this.parentRect.left;
        x = x / scale;
        rightWidthDrag(x, 0);
      }

      if (isLeftWidthDrag || bottomLeftCornerDrag || topLeftCornerDrag) {
        let offsetX = move.originalEvent.x;
        let x = offsetX - this.parentRect.left;
        x = x / scale;
        leftWidthDrag(x, 0);
      }

      if (isTopHeightDrag || topLeftCornerDrag || topRightCornerDrag) {
        let offsetY = move.originalEvent.y;
        let y = offsetY - this.parentRect.top;
        y = y / scale;

        topHeightDrag(0, y);
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
        if (this.disabled$?.getValue()) {
          el.style.cursor = 'auto';
          return;
        }

        let offsetX = evt.offsetX;
        let offsetY = evt.offsetY;

        let x = offsetX;
        let y = offsetY;

        const isBottomHeightDrag = y > this.height() - this.resizeOffset;
        const isLeftWidthDrag = x < this.resizeOffset;
        const isRightWidthDrag = x > this.width() - this.resizeOffset;
        const isTopHeightDrag = y < this.resizeOffset;

        const bottomRightCornerDrag = isBottomHeightDrag && isRightWidthDrag;
        const bottomLeftCornerDrag = isBottomHeightDrag && isLeftWidthDrag;
        const topLeftCornerDrag = isTopHeightDrag && isLeftWidthDrag;
        const topRightCornerDrag = isTopHeightDrag && isRightWidthDrag;

        if (this.showCursor()) {
          if (bottomRightCornerDrag) {
            el.style.cursor = 'nwse-resize';
          } else if (bottomLeftCornerDrag) {
            el.style.cursor = 'nesw-resize';
          } else if (topLeftCornerDrag) {
            el.style.cursor = 'nwse-resize';
          } else if (topRightCornerDrag) {
            el.style.cursor = 'nesw-resize';
          } else if (isRightWidthDrag) {
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
    this.initialize();
  }

  updatePosition() {
    const itemElement = this.el?.nativeElement;

    const itemRect = itemElement.getBoundingClientRect();
    const scale = this.ngBondService ? this.ngBondService.scale() : 1;

    const containerX = this.parent()?.gX?.() || 0;
    const containerY = this.parent()?.gY?.() || 0;

    // const x = itemRect.left - containerX - (this.world?.rect?.left || 0);
    // const y = itemRect.top - containerY - (this.world?.rect?.top || 0);

    let worldLeft = this.world?.rect?.left || 0;
    let worldTop = this.world?.rect?.top || 0;

    let worldEl = this.world?.el?.nativeElement;

    worldLeft = worldLeft - (worldEl?.scrollLeft || 0);
    worldTop = worldTop - (worldEl?.scrollTop || 0);

    let gX = itemRect.left - worldLeft;
    let gY = itemRect.top - worldTop;

    gX = gX / scale;
    gY = gY / scale;

    const x = gX - containerX;
    const y = gY - containerY;

    this.x.set(x);
    this.y.set(y);
  }

  recalculateSize() {
    this.el.nativeElement.style.width = 'auto';
    this.el.nativeElement.style.height = 'auto';
    const itemElement = this.el?.nativeElement;
    const itemRect = itemElement.getBoundingClientRect();
    this.setWidth(itemRect.width);
    this.setHeight(itemRect.height);
  }

  ngOnDestroy() {
    this.parent()?.removeChild(this);
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
    x = Math.round(Math.max(this.minX(), Math.min(x, this.maxX())));
    y = Math.round(Math.max(this.minY(), Math.min(y, this.maxY())));

    const xBy = x - this.x();
    const yBy = y - this.y();
    if (this.selectionManager && isSource) {
      this.selectionManager.moveBy(xBy, yBy, this);
    }

    this.x.set(x);
    this.y.set(y);
  }
}
