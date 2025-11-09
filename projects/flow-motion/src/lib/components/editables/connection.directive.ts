import { afterNextRender, Directive, effect, Inject, inject, Injector, model, output, signal } from '@angular/core';
import { svgPathBbox } from 'svg-path-bbox';
import { FMContainer } from '../fm-container/fm-container';
import { Link } from '../../services/fm.service';
import { ComponentFactory } from '../../../public-api';

@Directive({
  selector: '[connection]',
  hostDirectives: [
    {
      directive: FMContainer,
      inputs: ['fm-container'],
    },
  ],
})
export class ConnectionDirective {
  public type = 'link';

  static inspectableProperties = [
    {
      name: 'stroke',
      type: 'color',
    },
    {
      name: 'strokeWidth',
      type: 'number',
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
      name: 'strokeDasharray',
      type: 'number',
      setterName: 'strokeDasharray',
      isSignal: true,
      event: 'strokeDasharrayChanged',
      serializable: true,
    },
  ];

  get inspectableProperties() {
    return ConnectionDirective.inspectableProperties;
  }

  link = model.required<Link>();

  injector = inject(Injector);

  componentFactory = inject(ComponentFactory);

  container = inject(FMContainer, { optional: true });

  pathMidpoint = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  get stroke() {
    return this.link().stroke;
  }

  get strokeWidth() {
    return this.link().strokeWidth;
  }

  get pathprogress() {
    return this.link().pathprogress;
  }

  get curveType() {
    return this.link().curveType;
  }
  strokeChanged = output<string | undefined>();
  strokeWidthChanged = output<number | undefined>();

  pathprogressChanged = output<number>();

  strokeDashoffset = model(0);
  strokeDashoffsetChanged = output<number>();

  strokeDasharray = model('');
  strokeDasharrayChanged = output<string>();

  constructor() {
    this.container?.ignoreSelectionManagement.set(true);
    if (this.container) {
      this.container.type = this.type;
    }

    effect(() => {
      const link = this.link();
      const path = link.path();
      const pathEl = this.container?.el.nativeElement;
      const totalLength = pathEl.getTotalLength();
      const point = pathEl.getPointAtLength(totalLength * 0.5);
      this.pathMidpoint.set({ x: point.x, y: point.y });
      this.link().midPoint.set({ x: point.x, y: point.y });
      this.link().totalLength.set(totalLength);
    });

    effect(() => {
      const link = this.link();

      const bbox = svgPathBbox(link.path());
      const rect = { x: bbox[0], y: bbox[1], width: bbox[2] - bbox[0], height: bbox[3] - bbox[1] };

      this.container?.setWidth(rect.width);
      this.container?.setHeight(rect.height);
      this.container?.x.set(rect.x);
      this.container?.y.set(rect.y);
    });

    effect(() => {
      const link = this.link();
      const stroke = link.stroke();
      console.log('Updating stroke to ', stroke);
      this.strokeChanged.emit(stroke);
    });

    effect(() => {//#endregion

      const pathprogress = this.link().pathprogress();
      console.log('Updating pathprogress to ', pathprogress);
      //const totalLength = this.totalLength();
      const pathEl = this.container?.el.nativeElement;
      const length = pathEl.getTotalLength();
      if (pathprogress!== 100) {
        console.log(' total length ', length);
        this.link().strokeDasharray.set(length + '');
      }
      // this.strokeDashoffset.set(length - length * (pathprogress / 100));
      this.link().strokeDashoffset.set(length - length * (pathprogress / 100));
      this.pathprogressChanged.emit(pathprogress);
    });

    effect(() => {
      const link = this.link();
      const stroke = link.strokeWidth();
      console.log('Updating stroke WIDTH   to ', stroke);
      this.strokeWidthChanged.emit(stroke);
    });

    effect(() => {
      const link = this.link();
      console.log('Link changed', link);
    });

    afterNextRender(() => {
      // this.container.id.set(this.path().id());
      // this.componentFactory.addSvgContainer(this.container, [this], true);
      this.componentFactory.addConnectionComponent(this.container!, [this], this.link(), this);
    });
  }
}
