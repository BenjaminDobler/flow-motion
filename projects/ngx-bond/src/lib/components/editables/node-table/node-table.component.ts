import { afterNextRender, ChangeDetectionStrategy, Component, effect, inject, model, signal } from '@angular/core';
import { InspectableProperty, NgBondContainer, NgBondProperty, SelectionManager } from '../../../../public-api';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'lib-node-table',
  imports: [NgBondContainer, NgBondProperty, FormsModule],
  templateUrl: './node-table.component.html',
  styleUrl: './node-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(dblclick)': 'onDblClick($event)',
    '[class.edit-mode]': 'container.editMode()',
  },
})
export class NodeTableComponent {
  container = inject(NgBondContainer);
  selection = inject(SelectionManager);

  title = model('Node Table');
  type = 'node-table';

  fields = model<{ name: string; type: string }[]>([
    { name: 'Name', type: 'string' },
    { name: 'Value', type: 'string' },
  ]);

  static inspectableProperties: InspectableProperty[] = [
    {
      name: 'title',
      type: 'string',
    },
    {
      name: 'fields',
      type: 'array',
      arrayItemType: {
        name: 'string',
        type: 'string',
      },
    },
  ];

  get inspectableProperties() {
    return NodeTableComponent.inspectableProperties;
  }

  constructor() {
    afterNextRender(() => {
      if (this.container.displayName() === '') {
        this.container.displayName.set('Node Table ');
      }
    });
  }

  addRow() {
    this.fields.update((fields) => {
      return [...fields, { name: 'New Field', type: 'string' }];
    });
    setTimeout(() => {
      this.container.recalculateSize();
    });
  }

  removeRow(index: number) {
    this.fields.update((fields) => {
      const newFields = [...fields];
      newFields.splice(index, 1);
      return newFields;
    });
    setTimeout(() => {
      this.container.recalculateSize();
    });
  }

  onFieldInput(field: any,prop: string, event: any) {
    console.log(event);
    const content = event.target.innerText;
    console.log('content ', content);
    field[prop] = content;
  }

  updateFields() {
    console.log('updating fields');
    this.fields.update((fields) => {
      return [...fields];
    });
  };



  onDblClick(evt: MouseEvent) {
    this.selection.disabled.set(true);
    this.selection.unselectAll();
    evt.stopPropagation();
    evt.preventDefault();
  }
}
