import { Component, inject } from '@angular/core';
import { ComponentFactory } from '../../../services/component.factory';
import { FormsModule } from '@angular/forms';
import { SelectionManager } from '@richapps/ngx-bond';

@Component({
  selector: 'element-property-inspector',
  imports: [FormsModule],
  templateUrl: './element-property-inspector.component.html',
  styleUrl: './element-property-inspector.component.scss',
})
export class ElementPropertyInspectorComponent {
  componentFactory: ComponentFactory = inject(ComponentFactory);
  selectionManager = inject(SelectionManager);

  getDirectives(element: any) {
    return this.componentFactory.containerElementMap.get(element)?.directives;
  }

  getComponentInstance(element: any) {
    return this.componentFactory.containerElementMap.get(element)?.instance;
  }
}
