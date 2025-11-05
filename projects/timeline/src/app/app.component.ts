import { Component, inject, ViewChild, ViewContainerRef } from '@angular/core';
import { TimelineComponent, TimelineService, InspectorComponent, MotionPathComponent } from '@richapps/flow-motion-timeline';
import { ComponentFactory, KeyManager, NgBondContainer, FMService, NgBondWorld, SelectionManager } from '@richapps/flow-motion';
import { gsap } from 'gsap';


import { MotionPathHelper } from 'gsap/MotionPathHelper';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import EasePack from 'gsap/EasePack';

gsap.registerPlugin(MotionPathHelper, MotionPathPlugin, EasePack);

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
  imports: [TimelineComponent, NgBondWorld, InspectorComponent, NgBondContainer, MotionPathComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [FMService, SelectionManager, KeyManager, TimelineService, InspectorComponent, ComponentFactory, SelectionManager],
  host: {},
})
export class AppComponent {
  title = 'demo';

  @ViewChild('insert_slot', { read: ViewContainerRef })
  worldHost!: ViewContainerRef;
  // svgCanvas = viewChild<ElementRef>('svg_canvas');

  @ViewChild(NgBondWorld)
  ngBondWorld!: NgBondWorld;

  fmService = inject(FMService);

  timelineService = inject(TimelineService);
  // svgEdit?: SVGEdit;

  constructor() {
    // afterNextRender(() => {
    //   if (this.svgCanvas()) {
    //     this.svgEdit = new SVGEdit();
    //     this.svgEdit.svg = this.svgCanvas()?.nativeElement;
    //     this.svgEdit.init();

    //     this.svgEdit.pathChanged$.pipe(distinctUntilChanged()).subscribe((d) => {
    //       if (this.timelineService.selectedTween()) {
    //         if (this.timelineService.selectedTween()) {
    //           this.timelineService.selectedTween()!.tween.motionPath = d;
    //         }
    //         this.timelineService.createGsapTimeline();
    //       }
    //     });
    //   }
    // });
  }

  // onTweenSelected(event: { tween: TimelineTween; track: TimelineTrack; group: TimelineGroup }) {
  //   console.log('Tween selected:', event);
  //   // Handle the tween selection logic here

  //   if (this.timelineService.selectedTween()?.tween === event.tween) {
  //     this.timelineService.selectedTween.set(null);
  //     this.svgEdit?.clearAll();
  //     return;
  //   }

  //   this.timelineService.selectedTween.set(event);
  //   this.svgEdit?.clearAll();
  //   if (this.svgEdit) {
  //     if (event.tween.motionPath) {
  //       this.svgEdit.setPath(event.tween.motionPath);
  //     } else {
  //       const d = `M ${event.tween.start.value.x} ${event.tween.start.value.y} L ${event.tween.end.value.x} ${event.tween.end.value.y}`;
  //       console.log('Setting path:', d);
  //       this.svgEdit.setPath(`M ${event.tween.start.value.x} ${event.tween.start.value.y} L ${event.tween.end.value.x} ${event.tween.end.value.y}`);
  //     }
  //   }
  // }
}
