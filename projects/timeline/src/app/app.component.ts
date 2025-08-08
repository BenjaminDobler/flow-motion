import {
  afterNextRender,
  Component,
  effect,
  ElementRef,
  EnvironmentInjector,
  inject,
  inputBinding,
  output,
  outputBinding,
  runInInjectionContext,
  signal,
  viewChild,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { TimelineComponent } from './lib/timeline/components/timeline/timeline.component';
import { Timeline, TimelineTween } from './lib/timeline/model/timeline';
import { TestComponentComponent } from './components/test-component/test-component.component';
import { KeyManager, NgBondContainer, NgBondService, NgBondWorld, SelectionManager } from '@richapps/ngx-bond';
import { TimelineService } from './lib/timeline/services/timeline.service';
import { gsap } from 'gsap';
import { SVGEdit } from '@richapps/ngx-pentool';
import { distinctUntilChanged } from 'rxjs';

import { MotionPathHelper } from 'gsap/MotionPathHelper';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(MotionPathHelper, MotionPathPlugin);

const props = ['x', 'y', 'width', 'height'];

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
      console.log('rendering', prop, data.interp(progress));
      data.target[prop].set(data.interp(progress));
    },
  });
});

// gsap.registerPlugin({
//   name: `x`,
//   get(target: any) {
//     return target.x();
//   },
//   init(target: any, endValue: any, b: any) {
//     const currentValue = target.x() | 0;
//     const data: any = this;
//     data.target = target;
//     data.interp = gsap.utils.interpolate(currentValue, endValue);
//   },
//   render(progress: any, data: any) {
//     console.log('render x', progress, data.interp(progress));
//     data.target.x.set(data.interp(progress));
//   },
// });

// gsap.registerPlugin({
//   name: `y`,
//   get(target: any) {
//     return target.y();
//   },
//   init(target: any, endValue: any, b: any) {
//     const currentValue = target.y() | 0;
//     const data: any = this;
//     data.target = target;
//     data.interp = gsap.utils.interpolate(currentValue, endValue);
//   },
//   render(progress: any, data: any) {
//     data.target.y.set(data.interp(progress));
//   },
// });

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
  imports: [TimelineComponent, NgBondWorld],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [NgBondService, SelectionManager, KeyManager, TimelineService],
})
export class AppComponent {
  title = 'demo';

  @ViewChild('insert_slot', { read: ViewContainerRef })
  worldHost!: ViewContainerRef;
  svgCanvas = viewChild<ElementRef>('svg_canvas');

  bondService = inject(NgBondService);

  timelineService = inject(TimelineService);
  svgEdit?: SVGEdit;

  selectedTween: TimelineTween | null = null;

  constructor() {
    afterNextRender(() => {
      this.timelineService.setWorldHost(this.worldHost);
      if (this.svgCanvas()) {
        this.svgEdit = new SVGEdit();
        this.svgEdit.svg = this.svgCanvas()?.nativeElement;
        this.svgEdit.init();

        this.svgEdit.pathChanged$.pipe(distinctUntilChanged()).subscribe((d) => {
          console.log('Path changed:', d);
          if (this.selectedTween) {
            this.selectedTween.motionPath = d;
            this.timelineService.createGsapTimeline();
          }
        });
      }
    });


    const animationTimeline = gsap.timeline();
    let animatedObject = { x: 0, y: 0 };
    animationTimeline.to(animatedObject, {
      duration: 0.5,
      motionPath: 'M222.15625 115.41015625 C446.046875 369.92304687499995 620.19453125 464.703125 802.6484375 431.34375',
      onUpdate: () => console.log("YO", animatedObject),
    }, 2);
  }

  onTweenSelected(event: { tween: TimelineTween; track: any; group: any }) {
    console.log('Tween selected:', event);
    // Handle the tween selection logic here

    if (this.selectedTween === event.tween) {
      this.selectedTween = null;
      this.svgEdit?.clearAll();
      return;
    }

    this.selectedTween = event.tween;
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
}
