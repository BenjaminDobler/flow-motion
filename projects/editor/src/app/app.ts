import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import {
  SvgCanvasComponent,
  ConnectionContainerComponent,
  FMService,
  ComponentFactory,
  SelectionManager,
  KeyManager,
  SVGCanvas,
  MotionPathService,
  TextComponentComponent,
  ImageComponent,
  SerializationService,
  TimelineService,
  TimelineComponent,
  DuplicateService,
  PathDirectiveDirective,
  FMWorld,
  FMContainer,
  History,
  ShapeComponent,
} from '@richapps/flow-motion';
import { NgSplitComponent, NgSplitPanelComponent } from '@richapps/ngx-split';
import { InspectorComponent } from './components/inspector/inspector.component';
import { ChildInspectorComponent } from './components/child-inspector/child-inspector.component';
import { IconComponent, EdSelectComponent, EdSelectOptionComponent, ContextMenu } from '@richapps/ui-components';
import { NodeTableComponent } from '@richapps/flow-motion';
import { toPng, toJpeg, toBlob, toPixelData, toSvg } from 'html-to-image';

@Component({
  selector: 'app-root',
  imports: [
    SvgCanvasComponent,
    ContextMenu,
    IconComponent,
    FMWorld,
    EdSelectComponent,
    EdSelectOptionComponent,
    ConnectionContainerComponent,
    InspectorComponent,
    TimelineComponent,
    NgSplitPanelComponent,
    NgSplitComponent,
    ChildInspectorComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  providers: [FMService, ComponentFactory, History, SelectionManager, KeyManager, TimelineService, SVGCanvas, MotionPathService, SerializationService, DuplicateService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(dblclick)': 'this.onDoubleClick($event)',
  },
})
export class App {
  protected readonly title = signal('editor');

  svgCanvas = viewChild(SvgCanvasComponent);
  world = viewChild(FMWorld);
  protected ngBondService: FMService = inject(FMService);
  protected timelineService: TimelineService = inject(TimelineService);
  protected selection: SelectionManager = inject(SelectionManager);
  protected componentFactory = inject(ComponentFactory);
  protected motionPath = inject(MotionPathService);
  protected serialization = inject(SerializationService);
  protected history = inject(History);

  menu = [
    { label: 'Save', action: () => this.save() },
    { label: 'Save as...', action: () => this.saveAs() },
    { label: 'Load', action: () => this.loadFrom() },
    { label: 'Load latest', action: () => this.load() },
    { label: 'Export Image', action: () => this.exportImage() },
    { label: 'Undo', action: () => this.undo() },
    { label: 'Redo', action: () => this.redo() },
  ];

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

  saveAs() {
    const data = this.serialization.serialize(false);
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'flow-motion-project.json';
    link.click();
  }

  loadFrom() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event: any) => {
        const json = event.target.result;
        console.log('LOADING JSON', event);
        this.serialization.loadSerialized(JSON.parse(json));
      };
      reader.readAsText(file);
      


    };
    input.click();
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


  addShape() {
    this.componentFactory.addComponent(ShapeComponent, {
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      shape: 'diamond',
    });
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

  async exportImage() {
    toJpeg(this.world()!.el.nativeElement as any, { quality: 0.95 }).then((dataUrl) => {
      const link = document.createElement('a');
      link.download = 'export.jpeg';
      link.href = dataUrl;
      link.click();
    });
  }

  undo() {
    this.history.undo();
  }

  redo() {
    this.history.redo();
  }
}
