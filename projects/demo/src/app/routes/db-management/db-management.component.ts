import { Component, inject } from '@angular/core';
import { NgBondContainer } from '../../lib/ngbond/components/ng-bond-container/ng-bond-container';
import { NgBondWorld } from '../../lib/ngbond/components/ng-bond-world/ng-bond-world.component';
import { NgBondService } from '../../lib/ngbond/services/ngbond.service';
import { NgBondProperty } from '../../lib/ngbond/components/ng-bond-property/ng-bond-property';
import { InspectorComponent } from '../../components/inspector/inspector.component';
import { SelectionManager } from '../../lib/ngbond/services/selection.manager';

const dbData = [
  {
    name: 'order_items',
    fields: [
      { name: 'id', type: 'int' },
      { name: 'order_id', type: 'int' },
      { name: 'product_id', type: 'int' },
      { name: 'quantity', type: 'int' },
      { name: 'unit_price', type: 'decimal' },
    ],
  },
  {
    name: 'orders',
    fields: [
      { name: 'id', type: 'int' },
      { name: 'user_id', type: 'int' },
      { name: 'status', type: 'varchar' },
      { name: 'total_amount', type: 'int' },
      { name: 'created_at', type: 'timestamp' },
    ],
  },
  {
    name: 'users',
    fields: [
      { name: 'id', type: 'int' },
      { name: 'fullname', type: 'int' },
      { name: 'email', type: 'varchar' },
      { name: 'gender', type: 'int' },
      { name: 'date_of_birth', type: 'timestamp' },
      { name: 'country_code', type: 'varchar' },
      { name: 'created_at', type: 'timestamp' },
    ],
  },
];

@Component({
  selector: 'app-db-management',
  imports: [NgBondContainer, NgBondWorld, NgBondProperty, InspectorComponent],
  templateUrl: './db-management.component.html',
  styleUrl: './db-management.component.scss',
  providers: [NgBondService, SelectionManager],
})
export class DbManagementComponent {
  tables = dbData;

  bondService: NgBondService = inject(NgBondService);
}
