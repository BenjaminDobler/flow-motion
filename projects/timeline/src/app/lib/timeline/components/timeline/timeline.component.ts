import { ChangeDetectorRef, Component, inject, input, model, output, signal } from '@angular/core';
import { Timeline, TimelineGroup, TimelineKeyframe, TimelineTrack, TimelineTween } from '../../model/timeline';
import { TimelineRulerComponent } from './timeline-ruler/timeline-ruler.component';
import { TimelineKeyframeComponent } from './timeline-keyframe/timeline-keyframe.component';
import { TimelineTweenComponent } from './timeline-tween/timeline-tween.component';
import { KeyManager, NgBondContainer, NgBondService, SelectionManager } from '@richapps/ngx-bond';
import { TimelineService } from '../../services/timeline.service';
import { CommonModule } from '@angular/common';
import { TimelineControlsComponent } from './timeline-controls/timeline-controls.component';

@Component({
  selector: 'timeline',
  imports: [TimelineRulerComponent, TimelineKeyframeComponent, TimelineTweenComponent, NgBondContainer, CommonModule, TimelineControlsComponent],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
  providers: [NgBondService, SelectionManager, KeyManager],
})
export class TimelineComponent {
  timelineService = inject(TimelineService);

  changeRef = inject(ChangeDetectorRef);

  selectedTween = model<TimelineTween | null>(null);

  tweenSelected = output<{ tween: TimelineTween; track: TimelineTrack; group: TimelineGroup }>();

  onTweenClick(event: MouseEvent, tween: TimelineTween, track: TimelineTrack, group: TimelineGroup) {
    console.log('on tween click');
    // event.stopPropagation();
    // console.log('Tween clicked:', tween, track, group);
    this.selectedTween.set(tween);
    if (track.name === 'position') {
      // show motion path
      this.tweenSelected.emit({ tween, track, group });
    }
  }

  onTween(keyframe: TimelineKeyframe, group: TimelineGroup, track: TimelineTrack) {
    this.timelineService.timeline.update((currentTimeline) => {
      if (!currentTimeline) {
        return currentTimeline;
      }
      const sortedTracks = track.keyframes.sort((a, b) => a.time - b.time);
      const index = sortedTracks.findIndex((k) => k === keyframe);
      if (index < sortedTracks.length - 1) {
        const nextKeyframe = sortedTracks[index + 1];
        const tween: TimelineTween = {
          start: keyframe,
          end: nextKeyframe,
        };
        // track.tweens.push(tween);
      }
      currentTimeline.groups = currentTimeline.groups.map((g) => {
        if (g === group) {
          return {
            ...g,
            tracks: g.tracks.map((t) => {
              if (t === track) {
                return {
                  ...t,
                  tweens: [
                    ...t.tweens,
                    {
                      start: keyframe,
                      end: sortedTracks[index + 1] || keyframe, // Fallback to the same keyframe if no next one exists
                    },
                  ],
                };
              }
              return t;
            }),
          };
        }
        return g;
      });
      // Return the updated timeline
      return { ...currentTimeline };
    });

    this.timelineService.createGsapTimeline();
  }

  isTweenDragging = signal<boolean>(false);

  onTweenDragStart() {
    this.isTweenDragging.set(true);
  }

  onTweenDragEnd() {
    this.isTweenDragging.set(false);
  }

  onKeyframePositionUpdated(position: { x: number; y: number }, keyframe: TimelineKeyframe, track: TimelineTrack, group: TimelineGroup) {
    if (this.isTweenDragging()) {
      return;
    }
    //this.changeRef.markForCheck();

    const time = position.x * (this.timelineService.millisecondsPerPixel() || 1);
    this.timelineService.timeline.update((currentTimeline) => {
      if (!currentTimeline) {
        return currentTimeline;
      }
      // Update the keyframe time
      const updatedKeyframe: TimelineKeyframe = {
        ...keyframe,
        time: Math.round(time),
      };

      track.tweens.forEach((tween) => {
        if (tween.start === keyframe) {
          tween.start = updatedKeyframe;
        }
        if (tween.end === keyframe) {
          tween.end = updatedKeyframe;
        }
      });
      // Update the timeline with the new keyframe time
      currentTimeline.groups = currentTimeline.groups.map((g) => {
        if (g === group) {
          return {
            ...g,
            tracks: g.tracks.map((t) => {
              if (t === track) {
                return {
                  ...t,
                  keyframes: t.keyframes.map((kf) => (kf === keyframe ? updatedKeyframe : kf)),
                };
              }
              return t;
            }),
          };
        }
        return g;
      });
      // Return the updated timeline
      return { ...currentTimeline };
    });
  }

  onTweenPositionUpdated(position: { x: number; y: number }, tween: TimelineTween, track: TimelineTrack, group: TimelineGroup) {
    const start = tween.start;
    const end = tween.end;

    const duration = end.time - start.time;

    const newStart = position.x * (this.timelineService.millisecondsPerPixel() || 1);

    const startKeyframe = { ...tween.start, time: newStart };
    const endKeyframe = { ...tween.end, time: newStart + duration };
    this.timelineService.timeline.update((currentTimeline) => {
      if (!currentTimeline) {
        return currentTimeline;
      }

      start.time = Math.round(newStart);
      end.time = Math.round(newStart + duration);

      return { ...currentTimeline };
    });
  }

  onKeyframeClick(event: MouseEvent, keyframe: TimelineKeyframe, track: TimelineTrack, group: TimelineGroup) {
    this.timelineService.setPosition(keyframe.time);
  }
}
