import { effect, inject, signal, untracked } from '@angular/core';
import { Path, SVGCanvas } from '@richapps/ngx-bond';
import { FLTween, TimelineService } from '@richapps/ngx-bond-timeline';

export class MotionPathService {
  timeline = inject(TimelineService);
  svg = inject(SVGCanvas);

  currentMotionPath = signal<Path | undefined>(undefined);
  selectedTween?: FLTween;

  constructor() {
    effect(() => {
      const selectedTween = this.timeline.selectedTween();
      console.log('selected tween changed:', selectedTween);

      if (selectedTween) {
        console.log('value ', selectedTween.tween.start());
      } 

      untracked(() => {
        const mp = this.currentMotionPath();
        if (!selectedTween && mp) {
          this.svg.deletePath(mp);
        } else {
          let d: string = '';
          if (selectedTween?.tween.motionPath()) {
            d = selectedTween.tween.motionPath() as string;
          } else if (selectedTween) {
            d = `M${selectedTween.tween.start().value().x} ${selectedTween.tween.start().value().y} L${selectedTween.tween.end().value().x} ${selectedTween.tween.end().value().y}`;
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
        s.tween.motionPath.set(d);
      }
    });
  }
}
