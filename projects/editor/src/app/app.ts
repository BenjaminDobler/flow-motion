import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import {
  NgBondWorld,
  SvgCanvasComponent,
  ConnectionContainerComponent,
  NgBondService,
  ComponentFactory,
  SelectionManager,
  KeyManager,
  SVGCanvas,
  MotionPathService,
  NgBondContainer,
  TextComponentComponent,
  ImageComponent,
  SerializationService,
  TimelineService,
  TimelineComponent,
  DuplicateService,
  PathDirectiveDirective,
} from '@richapps/ngx-bond';
import { NgSplitComponent, NgSplitPanelComponent } from '@richapps/ngx-split';
import { InspectorComponent } from './components/inspector/inspector.component';
import { ChildInspectorComponent } from './components/child-inspector/child-inspector.component';
import { IconComponent } from '@richapps/ui-components';
import { NodeTableComponent } from '@richapps/ngx-bond';

@Component({
  selector: 'app-root',
  imports: [SvgCanvasComponent, IconComponent, NgBondWorld, ConnectionContainerComponent, InspectorComponent, TimelineComponent, NgSplitPanelComponent, NgSplitComponent, ChildInspectorComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  providers: [NgBondService, ComponentFactory, SelectionManager, KeyManager, TimelineService, SVGCanvas, MotionPathService, SerializationService, DuplicateService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(dblclick)': 'this.onDoubleClick($event)',
  },
})
export class App {
  protected readonly title = signal('editor');

  svgCanvas = viewChild(SvgCanvasComponent);
  protected ngBondService: NgBondService = inject(NgBondService);
  protected timelineService: TimelineService = inject(TimelineService);
  protected selection: SelectionManager = inject(SelectionManager);
  protected componentFactory = inject(ComponentFactory);
  protected motionPath = inject(MotionPathService);
  protected serialization = inject(SerializationService);

  svg = inject(SVGCanvas);

  ngAfterViewInit() {
    this.svg.modeChange.subscribe((m) => {
      if (!this.svg.selectedPathElement && m === 'pen') {
        console.log('SVG MODE PEN - DISABLING SELECTION');
        console.log(this.svg.selectedPathElement);
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

        this.componentFactory.containerElementMap.forEach((container: any, key: NgBondContainer) => {
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

  addPath() {
    this.svg.mode.set('pen');
  }

  addContainer() {
    this.componentFactory.addComponent();
  }

  async addImage() {
    const [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.componentFactory.addComponent(ImageComponent, {
        src: reader.result as string,
        x: 100,
        y: 100,
      });
    };
  }

  addNodeTable() {
    this.componentFactory.addComponent(NodeTableComponent);
  }

  addText() {
    this.componentFactory.addComponent(TextComponentComponent, { resizable: false, bgColor: 'transparent' });
  }

  async save() {
    this.serialization.serialize();
  }

  async load() {
    this.serialization.loadSerialized();
  }
}
