import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgBondContainer } from '../../lib/ngbond/components/ng-bond-container/ng-bond-container';
import { NgBondProperty } from '../../lib/ngbond/components/ng-bond-property/ng-bond-property';
import { NgBondWorld } from '../../lib/ngbond/components/ng-bond-world/ng-bond-world.component';
import { PropertyContainerComponent } from '../../components/property-container/property-container.component';
import { NgBondService } from '../../lib/ngbond/services/ngbond.service';
import { InspectorComponent } from '../../components/inspector/inspector.component';
import { SelectionManager } from '../../lib/ngbond/services/selection.manager';

@Component({
  selector: 'app-root',
  imports: [NgBondContainer, NgBondProperty, NgBondWorld, PropertyContainerComponent, InspectorComponent],
  templateUrl: './simple.component.html',
  styleUrl: './simple.component.scss',
  providers: [NgBondService, SelectionManager],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleComponent {
  protected ngBondService: NgBondService = inject(NgBondService);

  cX = signal(200);

  constructor() {
    this.ngBondService.defaultProperties.update((x) => ({ ...x, curveType: 'orthogonal' }));
  }
}
