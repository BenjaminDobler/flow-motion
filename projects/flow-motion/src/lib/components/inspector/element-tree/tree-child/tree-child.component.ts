import { Component, computed, inject, input, output } from '@angular/core';
import { IconComponent } from '@richapps/ui-components';
import { FMContainer, FMItem, SelectionManager } from '../../../../../public-api';

@Component({
  selector: 'tree-child',
  imports: [IconComponent],
  templateUrl: './tree-child.component.html',
  styleUrl: './tree-child.component.scss',
  host: {
    '[class.selected]': 'selected()',
  },
})
export class TreeChildComponent {
  selection = inject(SelectionManager);
  child = input.required<FMItem>();
  onselect = output<FMItem>();
  onremove = output<FMItem>();

  selected = computed(() => {
    return this.selection.selectionTargets().includes(this.child() as FMContainer);
  });

  toggleSelection() {
    this.selection.toggleSelection(this.child() as FMContainer);
  }

  component = computed(() => {
    const container = this.selection.components?.containerElementMap.get(this.child() as FMContainer);
    if (!container) {
      return this.child();
    }
    return container?.instance;
  });

  remove(child?: FMItem) {
    this.onremove.emit(child || this.child());
  }
}
