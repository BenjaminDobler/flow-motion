import { Component, inject } from '@angular/core';
import { DraggerDirective } from './directives/drag-directive/dragger.directive';
import { DragService } from './services/drag.service';
import { DragWorld } from './directives/drag-world/drag.world';
import { DragProperty } from './directives/drag-property/drag-property.directive';

@Component({
  selector: 'app-root',
  imports: [DraggerDirective, DragWorld, DragProperty],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [DragService]
})
export class AppComponent {
  title = 'demo';

  protected dragService: DragService = inject(DragService);
}
