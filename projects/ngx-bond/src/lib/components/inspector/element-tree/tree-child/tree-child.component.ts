import { Component, computed, inject, input, output } from '@angular/core';
import { NgBondContainer, NGBondItem, SelectionManager } from '@richapps/ngx-bond';

@Component({
  selector: 'tree-child',
  imports: [],
  templateUrl: './tree-child.component.html',
  styleUrl: './tree-child.component.scss',
  host: {
    '[class.selected]': 'selected()',
  },
})
export class TreeChildComponent {
  selection = inject(SelectionManager);
  child = input.required<NGBondItem>();
  onselect = output<NGBondItem>();
  onremove = output<NGBondItem>();

  selected = computed(() => {
    return this.selection.selectionTargets().includes(this.child() as NgBondContainer);
  });

  toggleSelection() {
    this.selection.toggleSelection(this.child() as NgBondContainer);
  }

  component = computed(() => {
    const container = this.selection.components?.containerElementMap.get(this.child() as NgBondContainer);
    return container?.instance;
  });

  remove(child?: NGBondItem) {
    this.onremove.emit(child || this.child());
  }


}
