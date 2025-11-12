import { effect, inject, signal, untracked } from '@angular/core';
import { Path } from '../components/svg-canvas/path';
import { SVGCanvas } from '../components/svg-canvas/svgcanvas';
import { ComponentFactory, FLTween, TimelineService } from '../../public-api';
export class MotionPathService {
  timeline = inject(TimelineService);
  svg = inject(SVGCanvas);
  componentFactory = inject(ComponentFactory);

  currentMotionPath = signal<Path | undefined>(undefined);
  selectedTween?: FLTween;

  constructor() {
    effect(() => {
      const selectedTween = this.timeline.selectedTween();

      untracked(() => {
        const mp = this.currentMotionPath();
        if (!selectedTween && mp) {
          let container: any = this.getContainerForPath(mp);

          if (container) {
            this.componentFactory.removeComponent(container);
          }
        } else {
          let d: string = '';
          if (selectedTween?.motionPath()) {
            d = selectedTween.motionPath() as string;
          } else if (selectedTween) {
            d = `M${selectedTween.start().value().x} ${selectedTween.start().value().y} L${selectedTween.end().value().x} ${selectedTween.end().value().y}`;
          }
          if (d) {
            const path = Path.deserialize({ d, fill: 'none', stroke: '#00ff00', isMotionPath: true }, this.svg);

            this.svg.paths.update((paths) => {
              return [...paths, path];
            });
            path.draw();
            this.currentMotionPath.set(path);
          }
        }
      });
    });

    effect(() => {
      const d = this.currentMotionPath()?.d();
      const s = this.timeline.selectedTween();

      if (s && d) {
        const container = this.getContainerForPath(this.currentMotionPath()!);
        if (container) {
          const instance = this.componentFactory.containerElementMap.get(container);
          const pathDirective = instance?.directives.find((d: any) => d.type === 'path');
          const length = pathDirective.el.nativeElement.getTotalLength();
          const startPoint = pathDirective.el.nativeElement.getPointAtLength(0);
          const endPoint = pathDirective.el.nativeElement.getPointAtLength(length);
          s.start().value.set({ x: startPoint.x, y: startPoint.y });
          s.end().value.set({ x: endPoint.x, y: endPoint.y });
          this.timeline.createGsapTimeline();
        }
        s.motionPath.set(d);
      }
    });
  }

  getContainerForPath(mp: Path) {
    let container: any;
    this.componentFactory.containerElementMap.forEach((value, key) => {
      const pathDirective = value.directives.find((d: any) => d.type === 'path');
      if (pathDirective) {
        const p = pathDirective.path() === mp;
        if (p) {
          container = pathDirective.container;
        }
      }
    });
    return container;
  }
}
