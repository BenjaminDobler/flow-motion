import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FMWorld } from '../fm-world/fm-world';
import { ConnectionContainerComponent } from '../connection-container/connection-container.component';
import { SvgCanvasComponent } from '../svg-canvas/svg-canvas.component';
import { ComponentFactory, FMService, KeyManager, SelectionManager, SVGCanvas } from '../../../public-api';

@Component({
  selector: 'fm-canvas',
  imports: [FMWorld, ConnectionContainerComponent, SvgCanvasComponent],
  templateUrl: './fm-canvas.html',
  styleUrl: './fm-canvas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FMService, SelectionManager, ComponentFactory, KeyManager, SVGCanvas],
})
export class FmCanvas {
  fmService = inject(FMService);
}
