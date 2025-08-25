import { Component, inject } from '@angular/core';
import { NgBondService, SelectionManager } from '@richapps/ngx-bond';
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
}
