import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ComponentFactory, ImageComponent, KeyManager, MotionPathService, NgBondService, SelectionManager, SVGCanvas, TextComponentComponent } from '@richapps/ngx-bond';

import { RouterModule } from '@angular/router';
import { TimelineService } from '@richapps/ngx-bond';

@Component({
  selector: 'app-root',
  imports: [RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [NgBondService, ComponentFactory, SelectionManager, KeyManager, TimelineService, SVGCanvas, MotionPathService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(drop)': 'onDrop($event)',
    '(dragover)': '$event.preventDefault()',
    '(dragenter)': '$event.preventDefault()',
    '(dragleave)': '$event.preventDefault()',
    '(dragend)': '$event.preventDefault()',
    '(dragstart)': '$event.preventDefault()',
    '(drag)': '$event.preventDefault()',
  },
})
export class AppComponent {
  title = 'demo';

  protected ngBondService: NgBondService = inject(NgBondService);
  protected componentFactory: ComponentFactory = inject(ComponentFactory);
  protected timelineService: TimelineService = inject(TimelineService);
  protected svg = inject(SVGCanvas);

  onDrop(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer?.files.length === 0) {
      return;
    }
    const reader = new FileReader();
    if (!e.dataTransfer?.files[0]) {
      return;
    }
    reader.readAsDataURL(e.dataTransfer?.files[0]);
    reader.onload = () => {
      const image = new Image();
      image.src = reader.result as string;
      image.onload = () => {
        console.log('Image loaded', image);
      };
    };
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
    const components = this.componentFactory.serializeComponents();
    const animation = this.timelineService.timeline();
    const animationClone = JSON.parse(JSON.stringify(animation));

    animation.groups.forEach((group: any) => {
      group.tracks.forEach((track: any) => {
        track.keyframes.forEach((keyframe: any, index: number) => {
          keyframe.index = index;
        });
      });
    });

    const fileHandle = await showSaveFilePicker({
      types: [
        {
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] },
        },
      ],
    });

    // Create a writer (request permission if necessary).
    const writer = await fileHandle.createWritable();
    // Write the full length of the contents
    await writer.write(JSON.stringify({ components, animation }, null, 2));
    // Close the file and write the contents to disk
    await writer.close();
  }

  async load() {
    const fileHandle = await window.showOpenFilePicker({
      types: [
        {
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] },
        },
      ],
    });

    const file = await fileHandle[0].getFile();
    const contents = await file.text();
    const { components, animation } = JSON.parse(contents);

    animation.groups.forEach((group: any) => {
      group.tracks.forEach((track: any) => {
        track.tweens.forEach((tween: any, index: number) => {
          tween.start = track.keyframes[tween.start.index];
          tween.end = track.keyframes[tween.end.index];
        });
      });
    });

    this.componentFactory.loadSerialized(components);
    this.timelineService.timeline.set(animation);

    // this.componentFactory.loadSerialized()
    // this.timelineService.loadAnimation(animation);
  }
}
