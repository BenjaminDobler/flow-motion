import { Component, effect, inject } from '@angular/core';
import { TimelineService } from '../../services/timeline.service';
import { ElementPropertyInspectorComponent, SelectionManager } from '@richapps/ngx-bond';
import { FormsModule } from '@angular/forms';
import { EditablePathComponent } from '../../../../components/editable-path/editable-path.component';

@Component({
  selector: 'inspector',
  imports: [FormsModule, ElementPropertyInspectorComponent],
  templateUrl: './inspector.component.html',
  styleUrl: './inspector.component.scss',
})
export class InspectorComponent {
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
