import { afterNextRender, ChangeDetectionStrategy, Component, effect, ElementRef, inject, viewChild } from '@angular/core';
import { SVGEdit } from '@richapps/ngx-pentool';
import { distinctUntilChanged } from 'rxjs';
import { TimelineService } from '../../services/timeline.service';

@Component({
  selector: 'motion-path',
  imports: [],
  templateUrl: './motion-path.component.html',
  styleUrl: './motion-path.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MotionPathComponent {
  svgCanvas = viewChild<ElementRef>('svg_canvas');
  svgEdit?: SVGEdit;
  timelineService: TimelineService = inject(TimelineService);

  constructor() {
    let initPath = '';
    afterNextRender(() => {
      if (this.svgCanvas()) {
        this.svgEdit = new SVGEdit();
        this.svgEdit.svg = this.svgCanvas()?.nativeElement;
        this.svgEdit.init();

        this.svgEdit.pathChanged$.pipe(distinctUntilChanged()).subscribe((d) => {
          console.log('motion path changed ', d);

          if (this.timelineService.selectedTween() !== null) {
            const selectedTween = this.timelineService.selectedTween();
            if (selectedTween) {
              const straightMotionPath = `M${selectedTween.start().value().x} ${selectedTween.start().value().y} L${selectedTween.end().value().x} ${selectedTween.end().value().y}`;
              if (d !== straightMotionPath) {
                console.log('it is not the same ');
                console.log(d, straightMotionPath);
                this.timelineService.selectedTween()!.motionPath.set(d);
              }

              this.timelineService.createGsapTimeline();
            }
          }
        });
      }
    });

    effect(() => {
      const selectedTween = this.timelineService.selectedTween();

      console.log('selected tween changed:', selectedTween);
      if (!selectedTween) {
        this.svgEdit?.clearAll();
      } else {
        this.svgEdit?.clearAll();
        if (this.svgEdit) {
          const motionPath = selectedTween.motionPath();
          if (motionPath) {
            this.svgEdit.setPath(motionPath);
          } else {
            const d = `M${selectedTween.start().value().x} ${selectedTween.start().value().y} L${selectedTween.end().value().x} ${selectedTween.end().value().y}`;
            console.log('Setting path:', d);
            initPath = d;
            this.svgEdit.setPath(d);
          }
        }
      }
    });
  }
}
