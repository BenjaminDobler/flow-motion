import { afterNextRender, Component, effect, ElementRef, inject, viewChild } from '@angular/core';
import { TimelineService } from '@richapps/ngx-bond-timeline';
import { SVGEdit } from '@richapps/ngx-pentool';
import { distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'motion-path',
  imports: [],
  templateUrl: './motion-path.component.html',
  styleUrl: './motion-path.component.scss',
})
export class MotionPathComponent {
  svgCanvas = viewChild<ElementRef>('svg_canvas');
  svgEdit?: SVGEdit;
  timelineService: TimelineService = inject(TimelineService);

  constructor() {
    afterNextRender(() => {
      if (this.svgCanvas()) {
        this.svgEdit = new SVGEdit();
        this.svgEdit.svg = this.svgCanvas()?.nativeElement;
        this.svgEdit.init();

        this.svgEdit.pathChanged$.pipe(distinctUntilChanged()).subscribe((d) => {
          if (this.timelineService.selectedTween()) {
            if (this.timelineService.selectedTween()) {
              this.timelineService.selectedTween()!.tween.motionPath = d;
            }
            this.timelineService.createGsapTimeline();
          }
        });
      }
    });

    effect(() => {
      const selectedTween = this.timelineService.selectedTween();

      console.log('selected tween changed:', selectedTween)
      if (!selectedTween) {
        this.svgEdit?.clearAll();
      } else {
        this.svgEdit?.clearAll();
        if (this.svgEdit) {
          if (selectedTween.tween.motionPath) {
            this.svgEdit.setPath(selectedTween.tween.motionPath);
          } else {
            const d = `M ${selectedTween.tween.start.value.x} ${selectedTween.tween.start.value.y} L ${selectedTween.tween.end.value.x} ${selectedTween.tween.end.value.y}`;
            console.log('Setting path:', d);
            this.svgEdit.setPath(`M ${selectedTween.tween.start.value.x} ${selectedTween.tween.start.value.y} L ${selectedTween.tween.end.value.x} ${selectedTween.tween.end.value.y}`);
          }
        }
      }
    });
  }
}
