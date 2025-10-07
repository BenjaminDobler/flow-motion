import { inject } from '@angular/core';
import { ComponentFactory } from './component.factory';
import { TimelineService } from '@richapps/ngx-bond-timeline';

export class SerializationService {
  private timeline = inject(TimelineService);
  private components = inject(ComponentFactory);

  serialize() {
    const components = this.components.serializeComponents();
    const timelineData = this.timeline.timeline();
    console.log('Timeline Data:', timelineData);

    components.timeline = timelineData;

    localStorage.setItem('serialized', JSON.stringify(components, null, 2));
    console.log('Serialized:', JSON.stringify(components, null, 2));
  }

  loadSerialized() {
    const serialized = localStorage.getItem('serialized');

    if (serialized) {
      const serializedObj: any = JSON.parse(serialized);

      this.components.loadSerialized(serializedObj);

      const timelineData = serializedObj.timeline;
      timelineData.groups.forEach((g: any) => {
        g.tracks.forEach((track: any) => {
          track.tweens = track.tweens.map((tween: any) => {
            console.log(tween);
            const start = track.keyframes.find((kf: any) => kf.time === tween.start.time);
            const end = track.keyframes.find((kf: any) => kf.time === tween.end.time);

            if (start && end) {
              tween.start = start;
              tween.end = end;
            }
            return tween;
          });
        });
      });

      setTimeout(() => {
        this.timeline.timeline.set(serializedObj.timeline);
        this.timeline.createGsapTimeline();
      }, 500);
    }
  }
}
