import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import {
  ComponentFactory,
  KeyManager,
  MotionPathService,
  FMContainer,
  FMProperty,
  FMService,
  FMWorld,
  PathDirectiveDirective,
  SelectionManager,
  SVGCanvas,
  SvgCanvasComponent,
  TimelineComponent,
  TimelineService,
  ConnectionContainerComponent,
} from '@richapps/flow-motion';
import { PropertyContainerComponent } from '../../components/property-container/property-container.component';
import { InspectorComponent } from '../../components/inspector/inspector.component';
import { NgSplitComponent, NgSplitPanelComponent } from '@richapps/ngx-split';
import { ChildInspectorComponent } from '../../components/child-inspector/child-inspector.component';

@Component({
  selector: 'app-root',
  imports: [SvgCanvasComponent, FMWorld, ConnectionContainerComponent, InspectorComponent, TimelineComponent, NgSplitPanelComponent, NgSplitComponent, ChildInspectorComponent],
  templateUrl: './simple.component.html',
  styleUrl: './simple.component.scss',
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(dblclick)': 'this.onDoubleClick($event)',
  },
})
export class SimpleComponent {
  svgCanvas = viewChild(SvgCanvasComponent);
  protected ngBondService: FMService = inject(FMService);
  protected timelineService: TimelineService = inject(TimelineService);
  protected selection: SelectionManager = inject(SelectionManager);
  protected componentFactory = inject(ComponentFactory);
  protected motionPath = inject(MotionPathService);
  svg = inject(SVGCanvas);

  cX = signal(200);

  constructor() {
    this.ngBondService.defaultProperties.update((x) => ({ ...x, curveType: 'orthogonal' }));
  }

  ngAfterViewInit() {
    this.svg.modeChange.subscribe((m) => {
      if (!this.svg.selectedPathElement && m === 'pen') {
        this.selection.disabled.set(true);
      }
    });
  }

  onDoubleClick(event: MouseEvent) {
    const canvas = this.svgCanvas();
    if (canvas) {
      if (this.svg.selectedPathElement && this.selection.disabled()) {
        this.selection.disabled.set(false);
        this.svg.mode.set('select');
        const path = this.svg.selectedPathElement;
        this.svg.unselectPath();

        this.componentFactory.containerElementMap.forEach((container: any, key: FMContainer) => {
          container.directives.forEach((dir: any) => {
            if (dir.type === 'path-directive') {
              if ((dir as PathDirectiveDirective).path() === path) {
                this.selection.select(key);
              }
            }
          });
        });
      } else {
        if (this.selection.disabled()) {
          this.selection.disabled.set(false);
        }
      }
    }
  }
}
