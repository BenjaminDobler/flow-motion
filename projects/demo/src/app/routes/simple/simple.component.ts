import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { KeyManager, NgBondContainer, NgBondProperty, NgBondService, NgBondWorld, SelectionManager } from '@richapps/ngx-bond';
import { PropertyContainerComponent } from '../../components/property-container/property-container.component';
import { InspectorComponent } from '../../components/inspector/inspector.component';
import { MotionPathComponent, TimelineComponent, TimelineService } from '@richapps/ngx-bond-timeline';


@Component({
  selector: 'app-root',
  imports: [NgBondContainer, NgBondProperty, NgBondWorld, PropertyContainerComponent, InspectorComponent, TimelineComponent, MotionPathComponent],
  templateUrl: './simple.component.html',
  styleUrl: './simple.component.scss',
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleComponent {
  protected ngBondService: NgBondService = inject(NgBondService);
  protected timelineService: TimelineService = inject(TimelineService);

  cX = signal(200);

  constructor() {
    this.ngBondService.defaultProperties.update((x) => ({ ...x, curveType: 'orthogonal' }));
  }
}
