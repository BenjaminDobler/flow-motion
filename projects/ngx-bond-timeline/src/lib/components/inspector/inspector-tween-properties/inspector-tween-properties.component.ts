import { Component, inject } from '@angular/core';
import { TimelineService } from '../../../services/timeline.service';
import { EditablePathComponent, ElementPropertyInspectorComponent, SelectionManager } from '@richapps/ngx-bond';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'inspector-tween-properties',
  imports: [FormsModule, ElementPropertyInspectorComponent],
  templateUrl: './inspector-tween-properties.component.html',
  styleUrl: './inspector-tween-properties.component.scss',
})
export class InspectorTweenProperties {
  timelineService = inject(TimelineService);
  selectionManager = inject(SelectionManager);

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
    'elastic.out(1.7)',
    'elastic.inOut',
    'back.in(1.7)',
    'back.out(1.7)',
    'back.inOut(1.7)',
    'rough',
    'slow',
    'steps',
    'expo.in',
  ];

  easingChanged(easing: string) {
    if (this.timelineService.selectedTween()) {
      this.timelineService.selectedTween()!.tween.easing = easing;
      this.timelineService.createGsapTimeline();
    }
  }

  getDirectives(element: any) {
    return this.timelineService.componentFactory.containerElementMap.get(element)?.directives;
  }

  getComponentInstance(element: any) {
    return this.timelineService.componentFactory.containerElementMap.get(element)?.instance;
  }

  addPathComponent() {
    this.timelineService.componentFactory.addComponent(EditablePathComponent);
  }
}
