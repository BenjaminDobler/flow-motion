import { Component, inject } from '@angular/core';
import { ComponentFactory, NgBondService, SelectionManager } from '@richapps/ngx-bond';
import { TreeChildComponent } from './tree-child/tree-child.component';

@Component({
  selector: 'element-tree',
  imports: [TreeChildComponent],
  templateUrl: './element-tree.component.html',
  styleUrl: './element-tree.component.scss',
})
export class ElementTreeComponent {
  bondService = inject(NgBondService);
  selection = inject(SelectionManager);
  components = inject(ComponentFactory);

  removeComponent(item: any) {
    this.components.removeComponent(item);
    //this.selection.clearSelection();
  }

}
