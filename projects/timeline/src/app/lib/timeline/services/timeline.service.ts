import { signal } from '@angular/core';

import { gsap } from 'gsap';
import { Timeline } from '../model/timeline';

export class TimelineService {
  animationTimeline: gsap.core.Timeline = gsap.timeline({
    onUpdate: () => {
      this.position.set(Math.round(this.animationTimeline.time() * 1000));
    },
  });

  position = signal(0);
  scrubbing = signal(false);

  timeline = signal<Timeline>({
    millisecondsPerPixel: 10,
    maxTime: 10000, // Optional, can be omitted if not needed
    groups: [],
  });

  constructor() {}

  setPosition(pos: number) {
    this.position.set(pos);
    this.animationTimeline.seek(pos / 1000, true);
  }

  setScrubbing(scrubbing: boolean) {
    this.scrubbing.set(scrubbing);
  }

  play() {
    this.animationTimeline.play();
  }

  pause() {
    this.animationTimeline.pause();
  }
}
