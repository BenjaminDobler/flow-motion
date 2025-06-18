import { Routes } from '@angular/router';
import { SimpleComponent } from './routes/simple/simple.component';
import { DbManagementComponent } from './routes/db-management/db-management.component';

export const routes: Routes = [
  {
    path: 'simple',
    component: SimpleComponent,
  },
  {
    path: 'db-management',
    component: DbManagementComponent,
  },
  {
    path:'',
    redirectTo: 'simple',
    pathMatch: 'full'
  }
];
