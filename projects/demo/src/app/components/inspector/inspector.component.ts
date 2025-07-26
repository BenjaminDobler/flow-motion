import { Component, inject, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DecimalPipe } from '@angular/common';
import { ElementInspectorComponent } from './element-inspector/element-inspector.component';
import { Link, NgBondContainer, NgBondProperty, NgBondService, SelectionManager } from '@richapps/ngx-bond';

type tabType = 'properties' | 'children' | 'selection' | 'element-inspector';
type Tab = {
  label: string;
  value: tabType;
};

@Component({
  selector: 'bond-inspector',
  imports: [FormsModule, DecimalPipe, ElementInspectorComponent],
  templateUrl: './inspector.component.html',
  styleUrl: './inspector.component.scss',
})
export class InspectorComponent {
  protected bondService: NgBondService = inject(NgBondService);
  protected selected = signal<tabType>('properties');
  protected selectionManager: SelectionManager = inject(SelectionManager);

  protected tabs = signal<Tab[]>([
    { label: 'Properties', value: 'properties' },
    { label: 'Children', value: 'children' },
    { label: 'Selection', value: 'selection' },
    { label: 'Element', value: 'element-inspector' },
  ]);

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
