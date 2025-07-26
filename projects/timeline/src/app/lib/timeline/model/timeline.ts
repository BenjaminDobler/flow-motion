export interface Timeline {
  groups: TimelineGroup[];
  millisecondsPerPixel: number;
  maxTime?: number;
}

export interface TimelineGroup {
  name: string;
  tracks: TimelineTrack[];
}

export interface TimelineTrack {
  name: string;
  keyframes: TimelineKeyframe[];
  tweens: TimelineTween[];
}


export interface TimelineTween {
  start: TimelineKeyframe;
  end: TimelineKeyframe;
}

export interface TimelineKeyframe {
  time: number;
  value: any;
}
