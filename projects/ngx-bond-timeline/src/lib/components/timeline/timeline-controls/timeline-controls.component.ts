import { Component, inject } from '@angular/core';
import { TimelineService } from '../../../services/timeline.service';

@Component({
  selector: 'timeline-controls',
  imports: [],
  templateUrl: './timeline-controls.component.html',
  styleUrl: './timeline-controls.component.scss',
})
export class TimelineControlsComponent {
  timelineService = inject(TimelineService);
}
