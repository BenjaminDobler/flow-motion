import { afterNextRender, computed, Directive, effect, ElementRef, EventEmitter, inject, Injector, input, model, output, signal } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { outputToObservable, toObservable } from '@angular/core/rxjs-interop';
import { NgBondContainer } from '../ng-bond-container/ng-bond-container';
import { ComponentFactory } from '../../services/component.factory';
import { SelectionManager } from '../../services/selection.manager';
import { Path } from '../svg-canvas/path';
import { Point } from '../svg-canvas/point';

@Directive({
  selector: '[pathdirective]',
  host: {
    '(dblclick)': 'onDblClick($event)',
  },
  hostDirectives: [
    {
      directive: NgBondContainer,
      inputs: ['bondcontainer'],
    },
  ],
})
export class PathDirectiveDirective {
  [key: string]: any; // Add index signature to allow dynamic property assignment
  componentFactory = inject(ComponentFactory);

  public type = 'path';

  static inspectableProperties = [
    {
      name: 'stroke',
      type: 'color',
      setterName: 'stroke',
      isSignal: true,
      event: 'strokeChanged',
      serializable: true,
    },
    {
      name: 'strokeWidth',
      type: 'number',
      setterName: 'strokeWidth',
      isSignal: true,
      event: 'strokeWidthChanged',
      serializable: true,
    },
    {
      name: 'fill',
      type: 'color',
      setterName: 'fill',
      isSignal: true,
      event: 'fillChanged',
      serializable: true,
    },
    {
      name: 'totalLength',
      type: 'number',
      setterName: 'totalLength',
      isSignal: true,
      event: 'totalLengthChanged',
      serializable: true,
    },
    {
      name: 'strokeDasharray',
      type: 'number',
      setterName: 'strokeDasharray',
      isSignal: true,
      event: 'strokeDasharrayChanged',
      serializable: true,
    },
    {
      name: 'strokeDashoffset',
      type: 'number',
      setterName: 'strokeDashoffset',
      isSignal: true,
      event: 'strokeDashoffsetChanged',
      serializable: true,
    },
    {
      name: 'pathprogress',
      type: 'range',
      min: 0,
      max: 100,
      step: 1,
      setterName: 'pathprogress',
      isSignal: true,
      event: 'pathprogressChanged',
      serializable: true,
    },
    {
      name: 'strokeLineJoint',
      type: 'select',
      options: ['miter', 'round', 'bevel'],
      setterName: 'strokeLineJoint',
      isSignal: true,
      event: 'strokeLineJointChanged',
      serializable: true,
    },
    {
      name: 'strokeLineCap',
      type: 'select',
      options: ['butt', 'round', 'square'],
      setterName: 'strokeLineCap',
      isSignal: true,
      event: 'strokeLineCapChanged',
      serializable: true,
    },
  ];

  get inspectableProperties() {
    return PathDirectiveDirective.inspectableProperties;
  }

  path = input.required<Path>();

  container = inject(NgBondContainer);

  selection = inject(SelectionManager);

  injector = inject(Injector);

  enabled = true;

  dragging = signal(false);

  get stroke() {
    return this.path()?.stroke || '#ffffff';
  }
  strokeChanged = output<string>();

  get strokeWidth() {
    return this.path()?.strokeWidth || 1;
  }
  strokeWidthChanged = output<number>();

  //fill = model('none');

  get fill() {
    return this.path()?.fill || 'none';
  }

  fillChanged = output<string>();

  el = inject(ElementRef);

  totalLength = signal(0);
  totalLengthChanged = output<number>();

  strokeDasharray = model('');
  strokeDasharrayChanged = output<string>();

  strokeDashoffset = model(0);
  strokeDashoffsetChanged = output<number>();

  pathprogress = model(100);
  pathprogressChanged = output<number>();

  strokeLineJoint = model<'miter' | 'round' | 'bevel'>('miter');

  strokeLineJointChanged = output<string>();

  strokeLineCap = model<'butt' | 'round' | 'square'>('butt');
  strokeLineCapChanged = output<string>();

  destroyed$ = new Subject<void>();

  d = computed(() => {
    return this.path()?.d() || '';
  });

  constructor() {


    if (this.container.displayName() === '') {
      this.container.displayName.set('Path ');
    } 
    this.container.type = this.type;
    // const resizeObserver = new ResizeObserver((entries) => {
    //   for (const entry of entries) {
    //     if (entry.contentBoxSize) {
    //       const width = entry.contentBoxSize[0]?.inlineSize || entry.contentRect.width;
    //       const height = entry.contentBoxSize[0]?.blockSize || entry.contentRect.height;

    //       // this.container.width.set(width);
    //       // this.container.height.set(height);
    //       console.log('Size changed to', width, height);
    //     }
    //   }

    //   console.log('Size changed');
    // });

    // resizeObserver.observe(this.container.el?.nativeElement);

    // const debouncedPathChange = toSignal(toObservable(this.d).pipe(distinctUntilChanged(), debounceTime(500)));
    let previousPoints: Point[] = [];

    effect(() => {
      const path = this.path();
      const points = this.path()?.points();
      console.log('Points changed', points?.length);

      // find all new points recognized by their id
      const newPoints = points.filter((p) => !previousPoints.includes(p));
      // find all removed points recognized by their id
      const removedPoints = previousPoints.filter((p) => !points.includes(p));

      newPoints.forEach((p) => {
        this['point-position-changed-' + p.id] = new EventEmitter();// new Subject<{ x: number; y: number }>();

        console.log('ppp ', this['point-position-' + p.id]);


        
        console.log('point added', p.id);



        this.componentFactory.containerElementMap.get(this.container)?.propertyDirectiveMap.set('point-position-' + p.id, this);


        this.inspectableProperties.push({
          name: 'point-position-' + p.id,
          type: 'position',
          setterName: 'point-position-' + p.id,
          isSignal: false,
          event: 'point-position-changed-' + p.id,
          serializable: false,
        });

        const sub = p.positionChanged.subscribe(() => {
          if (this.dragging()) {
            return;
          }
          console.log('Point moved, updating path bounding box ', p.id, p.x, p.y);

          this.componentFactory.propertyChanged.next({ id: this.container.id(), property: 'point-position-' + p.id, value: { x: p.x, y: p.y, id: p.id } });
        });
      });

      removedPoints.forEach((p) => {
        console.log('Point removed, unsubscribing ', p.id);
      });

      previousPoints = [...points];
    });

    effect(() => {
      const d = this.path()?.d() || '';

      if (this.dragging()) {
        return;
      }

      const rect = this.path()?.boundingBox();
      this.container.width.set(rect?.width || 0);
      this.container.height.set(rect?.height || 0);
      //this.container.setPositionImmediately(rect?.left || 0, rect?.top || 0);
      this.container.x.set(rect?.x || 0);
      this.container.y.set(rect?.y || 0);
      //});
    });

    effect(() => {
      const d = this.path()?.d() || '';
      const length = this.container.el?.nativeElement.getTotalLength();
      this.totalLength.set(length || 0);
    });

    effect(() => {
      const stroke = this.stroke();
      this.path()?.stroke.set(stroke);
      this.strokeChanged.emit(stroke);
    });

    effect(() => {
      const strokeWidth = this.strokeWidth();
      this.path()?.strokeWidth.set(strokeWidth);
      this.strokeWidthChanged.emit(strokeWidth);
    });

    effect(() => {
      const fill = this.fill();
      this.path()?.fill.set(fill);
      this.fillChanged.emit(fill);
    });

    effect(() => {
      const strokeDasharray = this.strokeDasharray();
      this.path()?.strokeDasharray.set(strokeDasharray);
      this.strokeDasharrayChanged.emit(strokeDasharray);
    });

    effect(() => {
      const pathprogress = this.pathprogress();
      this.strokeDasharray.set(this.totalLength() + '');
      this.strokeDashoffset.set(this.totalLength() - this.totalLength() * (pathprogress / 100));
      this.pathprogressChanged.emit(pathprogress);
    });

    effect(() => {
      const strokeDashoffset = this.strokeDashoffset();
      this.path()?.strokeDashoffset.set(strokeDashoffset);
      this.strokeDashoffsetChanged.emit(strokeDashoffset);
    });

    effect(() => {
      const strokeLineJoint = this.strokeLineJoint();
      this.path()?.strokeLineJoint.set(strokeLineJoint);
      this.strokeLineJointChanged.emit(strokeLineJoint);
    });

    effect(() => {
      const strokeLineCap = this.strokeLineCap();
      this.path()?.strokeLineCap.set(strokeLineCap);
      this.strokeLineCapChanged.emit(strokeLineCap);
    });

    this.container.positioning = 'none';
    this.container.resizable.set(false);

    this.container.dragStart.subscribe(() => {
      this.dragging.set(true);
    });

    this.container.dragEnd.subscribe(() => {
      this.dragging.set(false);
    });

    let isFirst = true;


    this.container.positionUpdated.subscribe(()=>{

    });

    const p$ = outputToObservable(this.container.positionUpdated);

    p$.pipe(takeUntil(this.destroyed$)).subscribe((position) => {
      if (position.xBy === 0 && position.yBy === 0) {
        return;
      }
      if (this.selection.disabled() || isFirst) {
        isFirst = false;
        return;
      }
      this.path()?.moveBy(position.xBy, position.yBy);
    });

    afterNextRender(() => {
      this.container.id.set(this.path().id());
      this.componentFactory.addSvgContainer(this.container, [this]);
    });
  }

  onDblClick(evt: MouseEvent) {
    this.selection.disabled.set(true);
    if (this.path()) {
      const path = this.path();
      path.canvas.selectedPathElement = path;
      this.selection.unselectAll();
      evt.stopPropagation();
      evt.preventDefault();
    }
  }

  beforeRemove() {
    this.path()?.delete();
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
