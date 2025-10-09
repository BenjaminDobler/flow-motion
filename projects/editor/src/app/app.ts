import { Component, inject, signal, viewChild } from '@angular/core';
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
  PathDirectiveDirective,
  NgBondContainer,
  TextComponentComponent,
  ImageComponent,
  SerializationService,
} from '@richapps/ngx-bond';
import { TimelineComponent, TimelineService } from '@richapps/ngx-bond-timeline';
import { NgSplitComponent, NgSplitPanelComponent } from '@richapps/ngx-split';
import { InspectorComponent } from './components/inspector/inspector.component';
import { ChildInspectorComponent } from './components/child-inspector/child-inspector.component';
import { IconComponent } from '@richapps/ui-components';

@Component({
  selector: 'app-root',
  imports: [SvgCanvasComponent, IconComponent,  NgBondWorld, ConnectionContainerComponent, InspectorComponent, TimelineComponent, NgSplitPanelComponent, NgSplitComponent, ChildInspectorComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  providers: [NgBondService, ComponentFactory, SelectionManager, KeyManager, TimelineService, SVGCanvas, MotionPathService, SerializationService],
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

  addText() {
    this.componentFactory.addComponent(TextComponentComponent, { resizable: false, bgColor: 'transparent' });
  }

  async save() {
    this.serialization.serialize();
    // const components = this.componentFactory.serializeComponents();
    // const animation = this.timelineService.timeline();
    // const animationClone = JSON.parse(JSON.stringify(animation));

    // animation.groups.forEach((group: any) => {
    //   group.tracks.forEach((track: any) => {
    //     track.keyframes.forEach((keyframe: any, index: number) => {
    //       keyframe.index = index;
    //     });
    //   });
    // });

    // const fileHandle = await showSaveFilePicker({
    //   types: [
    //     {
    //       description: 'JSON Files',
    //       accept: { 'application/json': ['.json'] },
    //     },
    //   ],
    // });

    // // Create a writer (request permission if necessary).
    // const writer = await fileHandle.createWritable();
    // // Write the full length of the contents
    // await writer.write(JSON.stringify({ components, animation }, null, 2));
    // // Close the file and write the contents to disk
    // await writer.close();
  }

  async load() {

    this.serialization.loadSerialized();
    // const fileHandle = await window.showOpenFilePicker({
    //   types: [
    //     {
    //       description: 'JSON Files',
    //       accept: { 'application/json': ['.json'] },
    //     },
    //   ],
    // });

    // const file = await fileHandle[0].getFile();
    // const contents = await file.text();
    // const { components, animation } = JSON.parse(contents);

    // animation.groups.forEach((group: any) => {
    //   group.tracks.forEach((track: any) => {
    //     track.tweens.forEach((tween: any, index: number) => {
    //       tween.start = track.keyframes[tween.start.index];
    //       tween.end = track.keyframes[tween.end.index];
    //     });
    //   });
    // });

    // this.componentFactory.loadSerialized(components);
    // this.timelineService.timeline.set(animation);

    // // this.componentFactory.loadSerialized()
    // // this.timelineService.loadAnimation(animation);
  }
}
