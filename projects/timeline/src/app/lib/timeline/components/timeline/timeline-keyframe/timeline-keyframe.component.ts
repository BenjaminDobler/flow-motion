import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CdkContextMenuTrigger, CdkMenuItem, CdkMenu } from '@angular/cdk/menu';
import { Timeline, TimelineKeyframe } from '../../../model/timeline';
import { TimelineService } from '../../../services/timeline.service';

@Component({
  selector: 'timeline-keyframe',
  imports: [CdkContextMenuTrigger, CdkMenu, CdkMenuItem],
  templateUrl: './timeline-keyframe.component.html',
  styleUrl: './timeline-keyframe.component.scss',
  host: {
    '(dragStart)': 'onDragStart()',
    '(dragEnd)': 'onDragEnd()',
  },
})
export class TimelineKeyframeComponent {
  timelineService = inject(TimelineService);

  keyframe = input<TimelineKeyframe>();
  timeline = input<Timeline>();
  dragging = signal<boolean>(false);

  tween = output<TimelineKeyframe>();

  time = computed(() => {
    const mpp = this.timelineService.millisecondsPerPixel() || 1;
    return this.keyframe() ? this.keyframe()!.time : 0;
  });

  constructor() {}

  onTweenClick() {
    this.tween.emit(this.keyframe()!);
  }

  onDragStart() {
    this.dragging.set(true);
    this.timelineService.setScrubbing(true);
  }
  onDragEnd() {
    this.dragging.set(false);
    this.timelineService.setScrubbing(false);
  }
}
