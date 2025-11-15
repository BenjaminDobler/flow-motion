import { Component, inject, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Link, FMService } from '../../../services/fm.service';
import { FMProperty } from '../../fm-property/fm-property';

@Component({
  selector: 'connection-inspector',
  imports: [FormsModule],
  templateUrl: './connection-inspector.component.html',
  styleUrl: './connection-inspector.component.scss',
})
export class ConnectionInspectorComponent {
  fmService = inject(FMService);
  animationBubbleCount = signal(5);
  animationBubbleDuration = signal(4);

  updateProperty(s: WritableSignal<any>, property: string, value: unknown) {
    s.update((x) => ({
      ...x,
      [property]: value,
    }));
  }

  updateAnimateLink(link: Link, evt: Event) {
    const target = evt.target as HTMLInputElement;
    const container = this.fmService.getDraggableElementById(link.inputId);

    if (!container) {
      console.warn(`No container found for link inputId: ${link.inputId}`);
      return;
    }

    const property1 = container.injector.get(FMProperty);

    property1.animatedLink.set(target.checked);
  }
}
