 export interface SerializedTimelineData {
  groups: SerializedTimelineGroup[];
}

export interface SerializedTimelineGroup {
  name: string;
  id: string;
  tracks: SerializedTimelineTrack[];
}

export interface SerializedTimelineTrack {
  name: string;
  keyframes: SerializedTimelineKeyframe[];
  tweens: SerializedTimelineTween[];
}

export interface SerializedTimelineKeyframe {
  time: number;
  value: string | number | boolean;
}

export interface SerializedTimelineTween {
  start: {
    time: number;
    value: string | number | boolean;
  };
  end: {
    time: number;
    value: string | number | boolean;
  };
  easing: string;
  motionPath: string | null;
}

export interface SerializedCanvas {
  backgroundColor: string;
}

export interface SerializedComponent {
  name: string;
  id: string;
  properties: { [key: string]: any };
  directives: { name: string; properties: { [key: string]: any } }[];
  elements: SerializedComponent[];
  pathData?: any;
}

export interface SerializedComponentData {
  elements: SerializedComponent[];
  links: SerializedLink[];
  canvas?: SerializedCanvas;
  timeline?: SerializedTimelineData;
}

export interface SerializedLink {
  inputId: string;
  outputId: string;
  props: { [key: string]: any };
}
