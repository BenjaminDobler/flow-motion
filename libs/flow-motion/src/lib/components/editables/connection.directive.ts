import { afterNextRender, Directive, effect, EnvironmentInjector, EventEmitter, Inject, inject, Injector, model, output, runInInjectionContext, signal } from '@angular/core';
import { svgPathBbox } from 'svg-path-bbox';
import { FMContainer } from '../fm-container/fm-container';
import { Link } from '../../services/fm.service';
import { ComponentFactory, inspectableLinkProperties } from '../../../index';

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

  static inspectableProperties = inspectableLinkProperties;

  get inspectableProperties() {
    return inspectableLinkProperties;
  }

  link = model.required<Link>();

  injector = inject(Injector);

  envInjector = inject(EnvironmentInjector);

  componentFactory = inject(ComponentFactory);

  container = inject(FMContainer, { optional: true });

  pathMidpoint = signal<{ x: number; y: number }>({ x: 0, y: 0 });

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

    const t: any = this;
    const setupOutput = (prop: keyof Link) => {
      t[`${prop}Changed`] = new EventEmitter<any>();
      effect(() => {
        const link = this.link();
        const value = (link as any)[prop]();
        t[`${prop}Changed`].emit(value);
      });
    };

    this.inspectableProperties.forEach((prop) => {
      Object.defineProperty(this, prop.name, {
        get() {
          return t.link()[prop.name];
        },
      });
      setupOutput(prop.name as keyof Link);
    });

    effect(() => {
      //#endregion

      const pathprogress = this.link().pathprogress();
      console.log('Updating pathprogress to ', pathprogress);
      //const totalLength = this.totalLength();
      const pathEl = this.container?.el.nativeElement;
      const length = pathEl.getTotalLength();
      if (pathprogress !== 100) {
        console.log(' total length ', length);
        this.link().strokeDasharray.set(length + '');
      }
      // this.strokeDashoffset.set(length - length * (pathprogress / 100));
      this.link().strokeDashoffset.set(length - length * (pathprogress / 100));
      // this.pathprogressChanged.emit(pathprogress);
    });

    afterNextRender(() => {
      this.componentFactory.addConnectionComponent(this.container!, [this], this.link(), this);
    });
  }
}
