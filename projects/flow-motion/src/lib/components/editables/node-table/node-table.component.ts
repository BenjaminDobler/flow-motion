import { afterNextRender, ChangeDetectionStrategy, Component, effect, inject, model, signal } from '@angular/core';
import { InspectableProperty, FMContainer, SelectionManager, FMProperty } from '../../../../public-api';
import { FormsModule } from '@angular/forms';
import { BackgroundColorPropertyDirective } from '../../../directives/backgroundColorProperty.directive';

@Component({
  selector: 'lib-node-table',
  imports: [FMContainer, FMProperty, FormsModule],
  templateUrl: './node-table.component.html',
  styleUrl: './node-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(dblclick)': 'onDblClick($event)',
    '[class.edit-mode]': 'container.editMode()',
  },
})
export class NodeTableComponent {
  container = inject(FMContainer);
  selection = inject(SelectionManager);
  baseStyles = inject(BackgroundColorPropertyDirective);

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
        this.baseStyles.backgroundColor.set('none');
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
