import { Component, inject, signal, WritableSignal } from '@angular/core';
import { Link, NgBondService } from '../../lib/ngbond/services/ngbond.service';
import { FormsModule } from '@angular/forms';
import { SelectionManager } from '../../lib/ngbond/services/selection.manager';
import { NgBondContainer } from '../../lib/ngbond/components/ng-bond-container/ng-bond-container';
import { NgBondProperty } from '../../lib/ngbond/components/ng-bond-property/ng-bond-property';

@Component({
  selector: 'bond-inspector',
  imports: [FormsModule],
  templateUrl: './inspector.component.html',
  styleUrl: './inspector.component.scss',
})
export class InspectorComponent {
  protected bondService: NgBondService = inject(NgBondService);
  protected selected = signal<'properties' | 'children' | 'selection'>('properties');
  protected selectionManager: SelectionManager = inject(SelectionManager);

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
    this.bondService.getBrondPropertyById(link().inputId).animatedLink.set(target.checked);
  }

  toggleSelection(target: NgBondContainer | NgBondProperty) {
    if (this.selectionManager.isSelected(target)) {
      this.selectionManager.unselect(target);
    } else {
      this.selectionManager.select(target);
    }
  }
}
