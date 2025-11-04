import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, model, output, signal } from '@angular/core';
import { FLGroup, FLKeyframe, FLTrack, FLTween } from '../../model/timeline';
import { TimelineRulerComponent } from './timeline-ruler/timeline-ruler.component';
import { TimelineKeyframeComponent } from './timeline-keyframe/timeline-keyframe.component';
import { TimelineTweenComponent } from './timeline-tween/timeline-tween.component';
import { TimelineService } from '../../services/timeline.service';
import { CommonModule } from '@angular/common';
import { TimelineControlsComponent } from './timeline-controls/timeline-controls.component';
import { ContextMenu } from '@richapps/ui-components';
import { KeyManager, NgBondContainer, NgBondService, SelectionManager } from '../../../../public-api';

@Component({
  selector: 'timeline',
  imports: [TimelineRulerComponent, TimelineKeyframeComponent, TimelineTweenComponent, NgBondContainer, CommonModule, TimelineControlsComponent, ContextMenu],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
  providers: [NgBondService, SelectionManager, KeyManager],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineComponent {
  timelineService = inject(TimelineService);

  changeRef = inject(ChangeDetectorRef);

  trackContextMenu = [
    {
      label: 'Add Keyframe',
    },
  ];

  selectedTween = model<FLTween | null>(null);

  tweenSelected = output<FLTween | null>();

  onTweenClick(event: MouseEvent, tween: FLTween) {
    
    if (this.selectedTween() === tween) {
      this.selectedTween.set(null);
      this.timelineService.selectedTween.set(null);
      return;
    }

    this.selectedTween.set(tween);
    //if (tween.track.name() === 'position') {
      // show motion path
      this.tweenSelected.emit(tween);

      if (this.timelineService.selectedTween() === tween) {
        this.timelineService.selectedTween.set(null);
        return;
      }

      this.timelineService.selectedTween.set(tween);
    //} 
  }


  // add new tween starting from keyframe
  onTween(keyframe: FLKeyframe) {

      const sortedTracks = keyframe.track.keyframes().sort((a, b) => a.time() - b.time());
      const index = sortedTracks.findIndex((k) => k === keyframe);
      if (index < sortedTracks.length - 1) {
        const nextKeyframe = sortedTracks[index + 1];
        const tween = new FLTween(keyframe, nextKeyframe, keyframe.track);
        keyframe.track.tweens.update((tweens) => [...tweens, tween]);
      }
    this.timelineService.createGsapTimeline();
  }

  isTweenDragging = signal<boolean>(false);

  onTweenDragStart() {
    this.isTweenDragging.set(true);
  }

  onTweenDragEnd() {
    this.isTweenDragging.set(false);
    this.timelineService.createGsapTimeline();
  }

  onKeyframePositionUpdated(position: { x: number; y: number }, keyframe: FLKeyframe) {
    if (this.isTweenDragging()) {
      return;
    }
    //this.changeRef.markForCheck();

    const time = position.x * (this.timelineService.millisecondsPerPixel() || 1);
    keyframe.time.set(Math.round(time));
    
    
    // this.timelineService.timeline.update((currentTimeline) => {
    //   if (!currentTimeline) {
    //     return currentTimeline;
    //   }
    //   // Update the keyframe time
    //   const updatedKeyframe: TimelineKeyframe = {
    //     ...keyframe,
    //     time: Math.round(time),
    //   };

    //   track.tweens.forEach((tween) => {
    //     if (tween.start === keyframe) {
    //       tween.start = updatedKeyframe;
    //     }
    //     if (tween.end === keyframe) {
    //       tween.end = updatedKeyframe;
    //     }
    //   });
    //   // Update the timeline with the new keyframe time
    //   currentTimeline.groups = currentTimeline.groups.map((g) => {
    //     if (g === group) {
    //       return {
    //         ...g,
    //         tracks: g.tracks.map((t) => {
    //           if (t === track) {
    //             return {
    //               ...t,
    //               keyframes: t.keyframes.map((kf) => (kf === keyframe ? updatedKeyframe : kf)),
    //             };
    //           }
    //           return t;
    //         }),
    //       };
    //     }
    //     return g;
    //   });
    //   // Return the updated timeline
    //   return { ...currentTimeline };
    // });
  }

  onTweenPositionUpdated(position: { x: number; y: number }, tween: FLTween) {
    const start = tween.start();
    const end = tween.end();

    const duration = end.time() - start.time();

    const newStart = position.x * (this.timelineService.millisecondsPerPixel() || 1);

    start.time.set(Math.round(newStart));
    end.time.set(Math.round(newStart + duration));

  }

  onKeyframeClick(keyframe: FLKeyframe) {
    this.timelineService.setPosition(keyframe.time());
  }

  onKeyframeDragEnd() {
    this.timelineService.createGsapTimeline();
  }

  onTrackContextMenuSelected(data: any, track: FLTrack) {
    const position = data.initEvent.offsetX;
    const time = position * (this.timelineService.millisecondsPerPixel() || 1);
    
    this.timelineService.addKeyframe(track, Math.round(time));
  }

  onDeleteKeyframe(keyframe: FLKeyframe, track: FLTrack) {
    this.timelineService.deleteKeyframe(keyframe, track);
  }
}
