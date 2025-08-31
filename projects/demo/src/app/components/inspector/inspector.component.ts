import { Component, inject, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DecimalPipe } from '@angular/common';
import {
  Link,
  NgBondContainer,
  NgBondProperty,
  NgBondService,
  SelectionManager,
  ComponentFactory,
  ElementPropertyInspectorComponent,
  ElementTreeComponent,
  AlignmentInspectorComponent,
  ConnectionInspectorComponent,
  TextComponentComponent,
} from '@richapps/ngx-bond';
import { InspectorTweenProperties } from '@richapps/ngx-bond-timeline';

type tabType = 'properties' | 'children' | 'selection' | 'element-inspector' | 'child-tree' | 'tween';
type Tab = {
  label: string;
  value: tabType;
};

@Component({
  selector: 'bond-inspector',
  imports: [
    FormsModule,
    DecimalPipe,
    ConnectionInspectorComponent,
    ElementTreeComponent,
    AlignmentInspectorComponent,
    ElementPropertyInspectorComponent,
    ElementPropertyInspectorComponent,
    ElementTreeComponent,
    ConnectionInspectorComponent,
    InspectorTweenProperties,
  ],
  templateUrl: './inspector.component.html',
  styleUrl: './inspector.component.scss',
})
export class InspectorComponent {
  protected bondService: NgBondService = inject(NgBondService);
  protected selected = signal<tabType>('element-inspector');
  protected selectionManager: SelectionManager = inject(SelectionManager);
  protected componentFactory = inject(ComponentFactory);

  protected tabs = signal<Tab[]>([
    { label: 'Element', value: 'element-inspector' },
    { label: 'Children', value: 'child-tree' },
    { label: 'Connection', value: 'properties' },
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
    const container = this.bondService.getBrondPropertyById(link().inputId);

    if (!container) {
      console.warn(`No container found for link inputId: ${link().inputId}`);
      return;
    }

    const property1 = container.injector.get(NgBondProperty);

    property1.animatedLink.set(target.checked);
  }

  toggleSelection(target: NgBondContainer) {
    if (this.selectionManager.isSelected(target)) {
      this.selectionManager.unselect(target);
    } else {
      this.selectionManager.select(target);
    }
  }

  addText() {
    this.componentFactory.addComponent(TextComponentComponent, { resizable: false, bgColor: 'transparent' });
  }
}
