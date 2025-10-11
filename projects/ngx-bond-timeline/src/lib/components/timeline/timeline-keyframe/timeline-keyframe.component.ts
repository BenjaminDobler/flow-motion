import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FLKeyframe, FLTimeline } from '../../../model/timeline';
import { TimelineService } from '../../../services/timeline.service';
import { ContextMenu } from '@richapps/ui-components';

@Component({
  selector: 'timeline-keyframe',
  imports: [ ContextMenu],
  templateUrl: './timeline-keyframe.component.html',
  styleUrl: './timeline-keyframe.component.scss',
  host: {
    '(dragStart)': 'onDragStart()',
    '(dragEnd)': 'onDragEnd()',
  },
})
export class TimelineKeyframeComponent {
  timelineService = inject(TimelineService);

  contextMenuItems = [
    { label: 'Tween', action: () => this.createTween() },
    { label: 'Delete', action: () => this.deleteKeyframe() }
  ];

  keyframe = input<FLKeyframe>();
  timeline = input<FLTimeline>();
  dragging = signal<boolean>(false);

  tween = output<FLKeyframe>();
  delete = output<FLKeyframe>();

  time = computed(() => {
    const mpp = this.timelineService.millisecondsPerPixel() || 1;
    return this.keyframe() ? this.keyframe()!.time : 0;
  });

  constructor() {}

  createTween() { 
    this.tween.emit(this.keyframe()!);
  }

  deleteKeyframe() {
    this.delete.emit(this.keyframe()!);
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
