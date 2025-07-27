import { Component, effect, EnvironmentInjector, inject, inputBinding, output, outputBinding, runInInjectionContext, signal, ViewChild, ViewContainerRef } from '@angular/core';
import { TimelineComponent } from './lib/timeline/components/timeline/timeline.component';
import { Timeline } from './lib/timeline/model/timeline';
import { TestComponentComponent } from './components/test-component/test-component.component';
import { KeyManager, NgBondContainer, NgBondService, NgBondWorld, SelectionManager } from '@richapps/ngx-bond';
import { TimelineService } from './lib/timeline/services/timeline.service';
import { gsap } from 'gsap';

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
  imports: [TimelineComponent, NgBondWorld],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [NgBondService, SelectionManager, KeyManager, TimelineService],
})
export class AppComponent {
  title = 'demo';

  @ViewChild('insert_slot', { read: ViewContainerRef })
  worldHost!: ViewContainerRef;

  bondService = inject(NgBondService);

  private injector: EnvironmentInjector = inject(EnvironmentInjector);
  timelineService = inject(TimelineService);

  componentCount = 0;
  addComponent() {
    const id = 'some-id-' + this.componentCount;
    this.componentCount++;
    const componentRef = this.worldHost.createComponent(TestComponentComponent, {
      directives: [
        {
          type: NgBondContainer,
          bindings: [
            outputBinding('positionUpdated', (evt: any) => {
              this.propertyChanged(id, 'position', evt);
            }),
            outputBinding('widthUpdated', (evt: any) => {
              this.propertyChanged(id, 'width', evt);
            }),
            outputBinding('heightUpdated', (evt: any) => {
              this.propertyChanged(id, 'height', evt);
            }),
          ],
        },
      ],
    });
    componentRef.setInput('bondcontainer', id);

    this.timelineService.timeline.update((currentTimeline) => {
      currentTimeline.groups.push({
        name: id,
        tracks: [],
      });
      return { ...currentTimeline };
    });
  }

  propertyChanged(id: string, property: string, value: any) {
    if (this.gsapTimeline?.isActive() || this.timelineService.scrubbing()) {
      console.warn('GSAP timeline is active, skipping property change:', id, property, value);
      return;
    }
    console.log('Property changed:', id, property, value);
    // Handle the property change logic here
    // For example, update the timeline or perform some action based on the change
    this.timelineService.timeline.update((currentTimeline) => {
      const group = currentTimeline.groups.find((g) => g.name === id);
      const track = group?.tracks.find((t) => t.name === property);
      if (track) {
        const keyframeIndex = track.keyframes.findIndex((kf) => kf.time === this.timelineService.position());
        if (keyframeIndex !== -1) {
          track.keyframes[keyframeIndex].value = value;
        } else {
          console.log(track.keyframes, this.timelineService.position());
          // If no keyframe exists at the current position, create a new one
          // console.log('Creating new keyframe for property:', property, 'at position:', this.timelineService.position());
          track.keyframes.push({
            value: value,
            time: this.timelineService.position(),
          });
        }
      } else {
        group?.tracks.push({
          name: property,
          keyframes: [
            {
              value: value,
              time: this.timelineService.position(),
            },
          ],
          tweens: [],
        });
      }
      return { ...currentTimeline };
    });

    this.createGsapTimeline();
  }

  gsapTimeline: any;

  createGsapTimeline() {
    const t = this.timelineService.timeline();

    let timeline = this.timelineService.animationTimeline;
    timeline.clear();
    timeline.pause();

    t.groups.forEach((group) => {
      const element = this.bondService.getComponentById(group.name);
      console.log('Element found for group:', element);
      if (element) {
        group.tracks.forEach((track) => {
          track.keyframes.forEach((keyframe, index) => {
            if (index < track.keyframes.length - 1) {
              const nextKeyframe = track.keyframes[index + 1];
              console.log('Creating GSAP timeline for track:', track.name, 'at keyframe:', keyframe);
              timeline.set(element, { [`signal_` + track.name]: keyframe.value }, keyframe.time / 1000);
              timeline.to(
                element,
                {
                  [`signal_` + track.name]: nextKeyframe.value,
                  duration: (nextKeyframe.time - keyframe.time) / 1000,
                  ease: 'power1.inOut',
                },
                keyframe.time / 1000
              );
            }
          });
        });
      }
    });

    this.gsapTimeline = timeline;

    // timeline.play();
  }
}
