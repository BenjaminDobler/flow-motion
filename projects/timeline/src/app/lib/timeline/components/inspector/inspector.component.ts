import { Component, inject } from '@angular/core';
import { TimelineService } from '../../services/timeline.service';

@Component({
  selector: 'inspector',
  imports: [],
  templateUrl: './inspector.component.html',
  styleUrl: './inspector.component.scss',
})
export class InspectorComponent {
  timelineService = inject(TimelineService);


  easings = [
    'linear',
    'power1.in',
    'power1.out',
    'power1.inOut',
    'power2.in',
    'power2.out',
    'power2.inOut',
    'power3.in',
    'power3.out',
    'power3.inOut',
    'power4.in',
    'power4.out',
    'power4.inOut',
    'bounce.in',
    'bounce.out',
    'bounce.inOut',
    'elastic.in',
    'elastic.out',
    'elastic.inOut',
    'back.in',
    'back.out',
    'back.inOut',
    'rough',
    'slow',
    'steps',
    'expo.in',
  ]

  easingChanged(easing: string) {
    if (this.timelineService.selectedTween()) {
      console.log('Easing changed:', easing);
      this.timelineService.selectedTween()!.tween.easing = easing;
      this.timelineService.createGsapTimeline();
    }
  }
}
