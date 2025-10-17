import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TimelineService } from '../../../services/timeline.service';
import { NgBondContainer } from '../../../../../public-api';
@Component({
  selector: 'timeline-ruler',
  imports: [NgBondContainer],
  templateUrl: './timeline-ruler.component.html',
  styleUrl: './timeline-ruler.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineRulerComponent {
  duration = input<number>();
  millisecondsPerPixel = input<number>();

  timelineService = inject(TimelineService);

  height = 30;

  patternPath = computed(() => {
    const d = this.duration();
    const mpp = this.millisecondsPerPixel();

    let path = '';
    if (d && mpp) {
      const width1S = 1000 / mpp;
      const stepW = width1S / 10;


      path += `M ${0.5} ${this.height} L ${0.5} 0`;

      for (let i = 0; i < 10; i++) {
        const x = i * stepW;
        let h = this.height * 0.7;
        if (i % 5 === 0) {
          h = this.height * 0.5;
        }
        path += `M ${x + 0.5} ${this.height} L ${x + 0.5} ${h}`;
      }
      path += `M ${width1S + 0.5} ${this.height} L ${width1S + 0.5} 0`;
    }
    return path;
  });

  patternWidth = computed(() => {
    const d = this.duration();
    const mpp = this.millisecondsPerPixel();

    let pW = 0;
    if (d && mpp) {
      pW = 1000 / mpp;
    }
    return pW;
  });

  onScrubberPositionUpdated(event: { x: number; y: number }) {
    const mpp = this.millisecondsPerPixel();
    if (mpp !== undefined) {
      const pos = event.x * mpp;
      this.timelineService.setPosition(Math.round(pos));
    }
  }
  onScrubberDragStart(event: any) {
    this.timelineService.setScrubbing(true);
  }
  onScrubberDragEnd(event: any) {
    this.timelineService.setScrubbing(false);
  }

  onClick(event: MouseEvent) {
    this.timelineService.setScrubbing(true);
    const mpp = this.millisecondsPerPixel();
    if (mpp !== undefined) {
      const pos = event.offsetX * mpp;
      this.timelineService.setPosition(Math.round(pos));
    }
    setTimeout(() => {
      this.timelineService.setScrubbing(false);
    });
  }
}
