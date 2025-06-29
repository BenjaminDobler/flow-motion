import { Component, inject, signal, WritableSignal } from '@angular/core';
import { Link, NgBondService } from '../../lib/ngbond/services/ngbond.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'bond-inspector',
  imports: [FormsModule],
  templateUrl: './inspector.component.html',
  styleUrl: './inspector.component.scss',
})
export class InspectorComponent {
  protected bondService: NgBondService = inject(NgBondService);

  animationBubbleCount = signal(5);
  animationBubbleDuration = signal(4);

  updateProperty(s: WritableSignal<any>, property: string, value: any) {
    s.update((x) => ({
      ...x,
      [property]: value,
    }));
  }

  updateAnimateLink(link: Link, evt: any) {
    console.log(evt.target.checked);
    this.bondService.getBrondPropertyById(link().inputId).animatedLink.set(evt.target.checked);
  }
}
