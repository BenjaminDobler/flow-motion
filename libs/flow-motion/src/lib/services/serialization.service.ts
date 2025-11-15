import { inject } from '@angular/core';
import { ComponentFactory } from './component.factory';
import {
  FLGroup,
  FLKeyframe,
  FLTrack,
  FLTween,
  TimelineService,
} from '../../index';
import {
  SerializedComponentData,
  SerializedTimelineGroup,
} from './serialization.types';

export class SerializationService {
  private timeline = inject(TimelineService);
  private components = inject(ComponentFactory);

  serialize(toLocalStorage = true) {
    const components = this.components.serializeComponents();
    const timelineData = this.timeline.timeline;

    const serializedData: SerializedTimelineGroup[] = timelineData
      .groups()
      .map((g) => {
        return {
          name: g.name(),
          id: g.id(),
          tracks: g.tracks().map((t) => {
            return {
              name: t.name(),
              keyframes: t.keyframes().map((kf) => {
                return {
                  time: kf.time(),
                  value: kf.value(),
                };
              }),
              tweens: t.tweens().map((tween) => {
                return {
                  start: {
                    time: tween.start().time(),
                    value: tween.start().value(),
                  },
                  end: {
                    time: tween.end().time(),
                    value: tween.end().value(),
                  },
                  easing: tween.easing(),
                  motionPath: tween.motionPath(),
                };
              }),
            };
          }),
        };
      });

    components.timeline = {
      groups: serializedData,
    };
    components.canvas = {
      backgroundColor: this.components.world?.backgroundColor() || '#ffffff',
    };

    if (toLocalStorage) {
      localStorage.setItem('serialized', JSON.stringify(components, null, 2));
    }
    return components;
  }

  private loadSerializedDataFromLocalStorage() {
    const serialized = localStorage.getItem('serialized');

    if (serialized) {
      const serializedObj = JSON.parse(serialized);
      return serializedObj;
    }
    return undefined;
  }
  loadSerialized(data?: SerializedComponentData) {
    // clear all
    this.components.clearAll();

    const serializedObj: SerializedComponentData =
      data || this.loadSerializedDataFromLocalStorage();
    if (!serializedObj) {
      return;
    }

    this.components.loadSerialized(serializedObj);

    if (serializedObj.canvas) {
      this.components.world?.backgroundColor.set(
        serializedObj.canvas.backgroundColor
      );
    }

    if (serializedObj.timeline) {
      const timelineData = serializedObj.timeline;
      const flGroups = timelineData.groups.map((g) => {
        const flGroup = new FLGroup(g.id, g.name);
        g.tracks.forEach((track) => {
          const flTrack = new FLTrack(track.name, flGroup);
          flTrack.name.set(track.name);
          flTrack.keyframes.set(
            track.keyframes.map(
              (kf) => new FLKeyframe(kf.time, kf.value, flTrack)
            )
          );

          flTrack.tweens.set(
            track.tweens.map((tween) => {
              const start = flTrack.keyframes().find((kf) => {
                return kf.time() === tween.start.time;
              });
              const end = flTrack
                .keyframes()
                .find((kf) => kf.time() === tween.end.time);

              
              const t = new FLTween(start!, end!, flTrack);
              t.easing.set(tween.easing);
              t.motionPath.set(tween.motionPath);
              return t;
            })
          );

          flGroup.tracks.update((tracks) => [...tracks, flTrack]);
        });
        return flGroup;
      });

      setTimeout(() => {
        this.timeline.timeline.groups.set(flGroups);
        this.timeline.createGsapTimeline();
      }, 500);
    }
  }
}
