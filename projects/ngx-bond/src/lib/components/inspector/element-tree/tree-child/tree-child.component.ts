import { Component, computed, inject, input } from '@angular/core';
import { NgBondContainer, NGBondItem, SelectionManager } from '@richapps/ngx-bond';

@Component({
  selector: 'tree-child',
  imports: [],
  templateUrl: './tree-child.component.html',
  styleUrl: './tree-child.component.scss',
  host: {
    '[class.selected]': 'selected()',
    '(click)': 'selection.toggleSelection(child())',
  },
})
export class TreeChildComponent {
  selection = inject(SelectionManager);
  child = input.required<NGBondItem>();

  selected = computed(() => {
    return this.selection.selectionTargets().includes(this.child() as NgBondContainer);
  });
}
