import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { ComponentFactory, KeyManager, MotionPathService, NgBondContainer, NgBondProperty, NgBondService, NgBondWorld, PathDirectiveDirective, SelectionManager, SVGCanvas, SvgCanvasComponent } from '@richapps/ngx-bond';
import { PropertyContainerComponent } from '../../components/property-container/property-container.component';
import { InspectorComponent } from '../../components/inspector/inspector.component';
import { MotionPathComponent, TimelineComponent, TimelineService } from '@richapps/ngx-bond-timeline';

@Component({
  selector: 'app-root',
  imports: [NgBondContainer, NgBondProperty, SvgCanvasComponent, NgBondWorld, PropertyContainerComponent, InspectorComponent, TimelineComponent, MotionPathComponent],
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
  protected ngBondService: NgBondService = inject(NgBondService);
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
    console.log('double click', event);
    const canvas = this.svgCanvas();
    if (canvas) {
      if (this.svg.selectedPathElement && this.selection.disabled()) {
        this.selection.disabled.set(false);
        this.svg.mode.set('select');
        const path = this.svg.selectedPathElement;
        this.svg.unselectPath();
        // this.selection.select(canvas.selectedPathElement);
        console.log('children', this.componentFactory.containerElementMap);

        this.componentFactory.containerElementMap.forEach((container: any, key: NgBondContainer) => {
          console.log(key, container);
          container.directives.forEach((dir: any) => {
            console.log('dir', typeof dir);
            if (dir.type === 'path-directive') {
              console.log('found path directive', dir);
              if ((dir as PathDirectiveDirective).path() === path) {
                this.selection.select(key);
              }
            }
          });
        });
      }
    }
  }
}
