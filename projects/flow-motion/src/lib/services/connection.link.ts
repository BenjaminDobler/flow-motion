import { signal } from '@angular/core';

export class ConnectionLink {
  animate = signal(false);
  strokeWidth = signal(2);
  stroke = signal('#000000');
  curveType = signal('curved');
  strokeDasharray = signal(0);
  curveRadius = signal(0);
  animationBubbleCount = signal<number>(10);
  animationBubbleDuration = signal<number>(4);
  animationBubbleRadius = signal<number>(3);
  animationBubbleColor = signal<string>('#333');
  textOnPath = signal<string>('');
  midPoint = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  totalLength = signal<number>(0);
  startMarker = signal('none');
  endMarker = signal('none');
  startMarkerOrient = signal('none');
  endMarkerOrient = signal('none');
}
