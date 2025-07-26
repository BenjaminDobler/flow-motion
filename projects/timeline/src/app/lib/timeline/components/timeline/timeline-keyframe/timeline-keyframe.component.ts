import { Component, computed, input, output, signal } from '@angular/core';
import { CdkContextMenuTrigger, CdkMenuItem, CdkMenu } from '@angular/cdk/menu';
import { Timeline, TimelineKeyframe } from '../../../model/timeline';

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
  keyframe = input<TimelineKeyframe>();
  timeline = input<Timeline>();
  dragging = signal<boolean>(false);

  tween = output<TimelineKeyframe>();

  time = computed(() => {
    const mpp = this.timeline()?.millisecondsPerPixel || 1;
    return this.keyframe() ? this.keyframe()!.time : 0;
  });

  constructor() {}

  onTweenClick() {
    this.tween.emit(this.keyframe()!);
  }

  onDragStart() {
    this.dragging.set(true);
  }
  onDragEnd() {
    this.dragging.set(false);
  }
}
