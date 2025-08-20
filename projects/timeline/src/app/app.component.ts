import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  viewChild,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { TimelineComponent } from './lib/timeline/components/timeline/timeline.component';
import { TimelineGroup, TimelineTrack, TimelineTween } from './lib/timeline/model/timeline';
import { KeyManager, NgBondService, NgBondWorld, SelectionManager } from '@richapps/ngx-bond';
import { TimelineService } from './lib/timeline/services/timeline.service';
import { gsap } from 'gsap';
import { SVGEdit } from '@richapps/ngx-pentool';
import { distinctUntilChanged } from 'rxjs';

import { MotionPathHelper } from 'gsap/MotionPathHelper';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { InspectorComponent } from './lib/timeline/components/inspector/inspector.component';
import { ImageComponent } from './components/image/image.component';
import { ComponentFactory } from './lib/timeline/services/component.factory';

gsap.registerPlugin(MotionPathHelper, MotionPathPlugin);

const props = ['x', 'y', 'width', 'height', 'borderRadius', 'backgroundColor', 'pathPosition'];

props.forEach((prop) => {
  gsap.registerPlugin({
    name: `signal_${prop}`,
    get(target: any) {
      return target[prop]();
    },
    init(target: any, endValue: any, b: any) {
      const currentValue = target[prop]() | 0;
      const data: any = this;
      data.target = target;
      data.interp = gsap.utils.interpolate(currentValue, endValue);
    },
    render(progress: any, data: any) {
      data.target[prop].set(data.interp(progress));
    },
  });
});

gsap.registerPlugin({
  name: `signal_position`,
  get(target: any) {
    return {
      x: target.x(),
      y: target.y(),
    };
  },
  init(target: any, endValue: any, b: any) {
    const currentValue = {
      x: target.x() | 0,
      y: target.y() | 0,
    };
    const data: any = this;
    data.target = target;
    data.interp = gsap.utils.interpolate(currentValue, endValue);
  },
  render(progress: any, data: any) {
    data.target.x.set(data.interp(progress).x);
    data.target.y.set(data.interp(progress).y);
  },
});

@Component({
  selector: 'app-root',
  imports: [TimelineComponent, NgBondWorld, InspectorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [NgBondService, SelectionManager, KeyManager, TimelineService, InspectorComponent, ComponentFactory, SelectionManager],
  host: {
    '(drop)': 'onDrop($event)',
    '(dragover)': '$event.preventDefault()',
    '(dragenter)': '$event.preventDefault()',
    '(dragleave)': '$event.preventDefault()',
    '(dragend)': '$event.preventDefault()',
    '(dragstart)': '$event.preventDefault()',
    '(drag)': '$event.preventDefault()',
  }
})
export class AppComponent {
  title = 'demo';

  @ViewChild('insert_slot', { read: ViewContainerRef })
  worldHost!: ViewContainerRef;
  svgCanvas = viewChild<ElementRef>('svg_canvas');

  bondService = inject(NgBondService);

  timelineService = inject(TimelineService);
  svgEdit?: SVGEdit;

  constructor() {
    afterNextRender(() => {
      this.timelineService.componentFactory.setWorldHost(this.worldHost);
      if (this.svgCanvas()) {
        this.svgEdit = new SVGEdit();
        this.svgEdit.svg = this.svgCanvas()?.nativeElement;
        this.svgEdit.init();

        this.svgEdit.pathChanged$.pipe(distinctUntilChanged()).subscribe((d) => {
          if (this.timelineService.selectedTween()) {
            if (this.timelineService.selectedTween()) {
              this.timelineService.selectedTween()!.tween.motionPath = d;
            }
            this.timelineService.createGsapTimeline();
          }
        });
      }
    });

  }

  onTweenSelected(event: { tween: TimelineTween; track: TimelineTrack; group: TimelineGroup }) {
    console.log('Tween selected:', event);
    // Handle the tween selection logic here

    if (this.timelineService.selectedTween()?.tween === event.tween) {
      this.timelineService.selectedTween.set(null);
      this.svgEdit?.clearAll();
      return;
    }

    this.timelineService.selectedTween.set(event);
    this.svgEdit?.clearAll();
    if (this.svgEdit) {
      if (event.tween.motionPath) {
        this.svgEdit.setPath(event.tween.motionPath);
      } else {
        const d = `M ${event.tween.start.value.x} ${event.tween.start.value.y} L ${event.tween.end.value.x} ${event.tween.end.value.y}`;
        console.log('Setting path:', d);
        this.svgEdit.setPath(`M ${event.tween.start.value.x} ${event.tween.start.value.y} L ${event.tween.end.value.x} ${event.tween.end.value.y}`);
      }
    }
  }

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

      this.timelineService.componentFactory.addComponent(ImageComponent, {
        src:reader.result as string

      });

      image.onload = () => {
        console.log('Image loaded', image);
      };
    };

  }
}
