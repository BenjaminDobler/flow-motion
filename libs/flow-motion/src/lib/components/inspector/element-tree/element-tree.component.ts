import { Component, inject } from '@angular/core';
import { TreeChildComponent } from './tree-child/tree-child.component';
import { ComponentFactory, FMService, SelectionManager } from '../../../../index';

@Component({
  selector: 'element-tree',
  imports: [TreeChildComponent],
  templateUrl: './element-tree.component.html',
  styleUrl: './element-tree.component.scss',
})
export class ElementTreeComponent {
  fmService = inject(FMService);
  selection = inject(SelectionManager);
  components = inject(ComponentFactory);

  removeComponent(item: any) {
    this.components.removeComponent(item);
    //this.selection.clearSelection();
  }

}
