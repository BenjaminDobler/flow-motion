export interface Timeline {
  groups: TimelineGroup[];
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
  easing?: string; // Easing function name, e.g., 'easeInOutQuad'
  motionPath?: string; // Optional motion path for the tween
}

export interface TimelineKeyframe {
  time: number;
  value: any;
}
