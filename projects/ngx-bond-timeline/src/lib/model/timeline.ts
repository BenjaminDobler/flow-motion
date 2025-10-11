import { signal, Signal, WritableSignal } from "@angular/core";





export class FLTimeline {
  groups: WritableSignal<FLGroup[]> = signal([]);
}

export class FLKeyframe {
  time: WritableSignal<number> = signal(0);
  value: WritableSignal<any> = signal(null);
  track: FLTrack;

  constructor(time: number = 0, value: any = null, track: FLTrack) {
    this.time.set(time);
    this.value.set(value);
    this.track = track;
  }
}

export class FLTween {
  start: Signal<FLKeyframe>;
  end: Signal<FLKeyframe>;
  easing: WritableSignal<string> = signal('linear');
  motionPath: WritableSignal<string | null> = signal(null);
  track: FLTrack;

  constructor(start: FLKeyframe, end: FLKeyframe, track: FLTrack) {
    this.start = signal(start);
    this.end = signal(end);
    this.track = track;
  }
}


export class FLTrack {
  name: WritableSignal<string> = signal('New Track');
  keyframes: WritableSignal<FLKeyframe[]> = signal([]);
  tweens: WritableSignal<FLTween[]> = signal([]);
  group: FLGroup;

  constructor(name: string = 'New Track', group: FLGroup) {
    this.name.set(name);
    this.group = group;
  }
}

export class FLGroup {
  name: WritableSignal<string> = signal('New Group');
  tracks: WritableSignal<FLTrack[]> = signal([]);
  expanded: WritableSignal<boolean> = signal(true);

  constructor(name: string) {
    this.name.set(name);
  }
}