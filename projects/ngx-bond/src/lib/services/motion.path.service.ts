import { effect, inject, signal, untracked } from '@angular/core';
import { Path } from '../components/svg-canvas/path';
import { SVGCanvas } from '../components/svg-canvas/svgcanvas';
import { FLTween, TimelineService } from '../../public-api';
export class MotionPathService {
  timeline = inject(TimelineService);
  svg = inject(SVGCanvas);

  currentMotionPath = signal<Path | undefined>(undefined);
  selectedTween?: FLTween;

  constructor() {
    effect(() => {
      const selectedTween = this.timeline.selectedTween();

      untracked(() => {
        const mp = this.currentMotionPath();
        if (!selectedTween && mp) {
          this.svg.deletePath(mp);
        } else {
          let d: string = '';
          if (selectedTween?.motionPath()) {
            d = selectedTween.motionPath() as string;
          } else if (selectedTween) {
            d = `M${selectedTween.start().value().x} ${selectedTween.start().value().y} L${selectedTween.end().value().x} ${selectedTween.end().value().y}`;
          }
          if (d) {
            const path = Path.deserialize({ d, fill: 'none', stroke: '#00ff00' }, this.svg);
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
      console.log('motion path d changed:', d);

      const s = this.timeline.selectedTween();
      if (s && d) {
        s.motionPath.set(d);
      }
    });
  }
}
