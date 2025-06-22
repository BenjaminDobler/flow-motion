import { Component, inject, Signal, WritableSignal } from '@angular/core';
import { NgBondContainer } from '../../lib/ngbond/components/ng-bond-container/ng-bond-container';
import { NgBondWorld } from '../../lib/ngbond/components/ng-bond-world/ng-bond-world.component';
import { Link, NgBondService } from '../../lib/ngbond/services/ngbond.service';
import { NgBondProperty } from '../../lib/ngbond/components/ng-bond-property/ng-bond-property';
import { FormsModule } from '@angular/forms';

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
  imports: [NgBondContainer, NgBondWorld, NgBondProperty, FormsModule],
  templateUrl: './db-management.component.html',
  styleUrl: './db-management.component.scss',
  providers: [NgBondService],
})
export class DbManagementComponent {
  tables = dbData;

  bondService: NgBondService = inject(NgBondService);

  updateProperty(s: WritableSignal<any>, property: string, value: any) {
    s.update((x) => ({
      ...x,
      [property]: value,
    }));
  }

  updateAnimateLink(link: Link, evt: any) {
    console.log(evt.target.checked);
    this.bondService
      .getBrondPropertyById(link().inputId)
      .animatedLink.set(evt.target.checked);
  }
}
