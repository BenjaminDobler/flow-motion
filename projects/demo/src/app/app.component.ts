import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgBondContainer } from './components/ng-bond-container/ng-bond-container';
import { NgBondService } from './services/ngbond.service';
import { NgBondProperty } from './components/ng-bond-property/ng-bond-property';
import { NgBondWorld } from './components/ng-bond-world/ng-bond-world.component';
import { PropertyContainerComponent } from './usage/components/property-container/property-container.component';

@Component({
  selector: 'app-root',
  imports: [NgBondContainer, NgBondProperty, NgBondWorld, PropertyContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [NgBondService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'demo';

  protected ngBondService: NgBondService = inject(NgBondService);
}
