import { Directive, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { svgPathBbox } from 'svg-path-bbox';
import { FMContainer } from '../fm-container/fm-container';
import { Link } from '../../services/fm.service';

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

  link = model.required<Link>();

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
      this.link().properties.midPoint.set({ x: point.x, y: point.y });
      this.link().properties.totalLength.set(totalLength);
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
  }
}
