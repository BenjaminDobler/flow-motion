import { afterNextRender, Component, effect, inject, model, signal } from '@angular/core';
import { InspectableProperty, NgBondContainer, NgBondProperty } from '../../../../public-api';

@Component({
  selector: 'lib-node-table',
  imports: [NgBondContainer, NgBondProperty],
  templateUrl: './node-table.component.html',
  styleUrl: './node-table.component.scss',
})
export class NodeTableComponent {
  container = inject(NgBondContainer);
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
}
