import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DraggerDirective } from './directives/drag-directive/dragger.directive';
import { NgBondService } from './services/ngbond.service';
import { DragProperty } from './directives/drag-property/drag-property.directive';
import { NgBondContainerComponent } from './components/ng-bond-container/ng-bond-container.component';

@Component({
  selector: 'app-root',
  imports: [DraggerDirective, DragProperty, NgBondContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [NgBondService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'demo';

  protected ngBondService: NgBondService = inject(NgBondService);
}
