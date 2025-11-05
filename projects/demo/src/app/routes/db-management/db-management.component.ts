import { Component, inject } from '@angular/core';
import { NgBondContainer, NgBondWorld, FMService, NgBondProperty, SelectionManager, KeyManager } from '@richapps/flow-motion';
import { InspectorComponent } from '../../components/inspector/inspector.component';
import { ConnectionContainerComponent } from '../../../../../flow-motion/src/lib/components/connection-container/connection-container.component';

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
  imports: [NgBondContainer, NgBondWorld, InspectorComponent, NgBondProperty, ConnectionContainerComponent],
  templateUrl: './db-management.component.html',
  styleUrl: './db-management.component.scss',
  providers: [FMService, SelectionManager, KeyManager],
})
export class DbManagementComponent {
  tables = dbData;

  fmService: FMService = inject(FMService);
}
