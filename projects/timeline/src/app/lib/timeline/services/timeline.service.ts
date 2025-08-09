import { inject, outputBinding, signal, ViewContainerRef } from '@angular/core';

import { gsap } from 'gsap';
import { Timeline, TimelineGroup, TimelineTrack, TimelineTween } from '../model/timeline';
import { NgBondContainer, NgBondService } from '@richapps/ngx-bond';
import { TestComponentComponent } from '../../../components/test-component/test-component.component';

export class TimelineService {
  private bondService = inject(NgBondService);

  worldHost!: ViewContainerRef;

  selectedTween = signal<{ tween: TimelineTween; track: TimelineTrack; group: TimelineGroup } | null>(null);

  animationTimeline: gsap.core.Timeline = gsap.timeline({
    onUpdate: () => {
      this.position.set(Math.round(this.animationTimeline.time() * 1000));
      if (this.animationTimeline.isActive()) {
        this.playing.set(true);
      } else {
        this.playing.set(false);
      }
    },
  });

  playing = signal(false);

  position = signal(0);
  scrubbing = signal(false);

  timeline = signal<Timeline>({
    millisecondsPerPixel: 10,
    maxTime: 10000, // Optional, can be omitted if not needed
    groups: [],
  });

  constructor() {}

  setPosition(pos: number) {
    //this.animationTimeline.play(pos/1000);

    this.position.set(pos);
    this.animationTimeline.seek(pos / 1000, false);
  }

  setScrubbing(scrubbing: boolean) {
    this.scrubbing.set(scrubbing);
  }

  play() {
    this.animationTimeline.play();
    this.playing.set(true);
  }

  pause() {
    this.animationTimeline.pause();
    this.playing.set(false);
  }

  stop() {
    this.animationTimeline.pause(0);
    this.playing.set(false);
  }

  setWorldHost(worldHost: any) {
    this.worldHost = worldHost;
  }

  createGsapTimeline() {
    const t = this.timeline();

    let timeline = this.animationTimeline;
    timeline.clear();
    timeline.pause();

    t.groups.forEach((group) => {
      const element = this.bondService.getComponentById(group.name);
      if (element) {
        group.tracks.forEach((track) => {
          track.keyframes.forEach((keyframe, index) => {
            timeline.set(element, { [`signal_` + track.name]: keyframe.value }, keyframe.time / 1000);

            if (index < track.keyframes.length - 1) {
              const nextKeyframe = track.keyframes[index + 1];
              console.log('Creating GSAP timeline for track:', track.name, 'at keyframe:', keyframe);
              const tween = track.tweens.find((tween) => tween.start === keyframe);
              let props: any;
              if (tween) {
                const duration = (nextKeyframe.time - keyframe.time) / 1000;
                props = {
                  [`signal_` + track.name]: nextKeyframe.value,
                  duration: (nextKeyframe.time - keyframe.time) / 1000,
                  ease: tween.easing || 'none',
                };
                if (tween.motionPath) {
                  const proxyElement = {
                    x: element.x(),
                    y: element.y(),
                    rotation: 0,
                  };

                  timeline.to(
                    proxyElement,
                    {
                      duration,
                      motionPath: tween.motionPath,
                      autoRotate: true,
                      ease: tween.easing || 'none',

                      onUpdate: () => {
                        element.x.set(proxyElement.x);
                        element.y.set(proxyElement.y);
                      },
                    },
                    keyframe.time / 1000
                  );
                } else {
                  timeline.to(element, props, keyframe.time / 1000);
                }

                console.log('props:', props);
              }
            }
          });
        });
      }
    });

    this.animationTimeline = timeline;

    // timeline.play();
  }

  componentCount = 0;
  addComponent(componentClass: { new (...args: any[]): TestComponentComponent } = TestComponentComponent, inputs: any = {}) {
    const id = 'some-id-' + this.componentCount;
    this.componentCount++;
    const componentRef = this.worldHost.createComponent(componentClass, {
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

    for(const key in inputs) {
      componentRef.setInput(key, inputs[key]);
    }

    this.timeline.update((currentTimeline) => {
      currentTimeline.groups.push({
        name: id,
        tracks: [],
      });
      return { ...currentTimeline };
    });
  }

  propertyChanged(id: string, property: string, value: any) {
    if (this.animationTimeline?.isActive() || this.scrubbing()) {
      return;
    }
    // Handle the property change logic here
    // For example, update the timeline or perform some action based on the change
    this.timeline.update((currentTimeline) => {
      const group = currentTimeline.groups.find((g) => g.name === id);
      const track = group?.tracks.find((t) => t.name === property);
      if (track) {
        const keyframeIndex = track.keyframes.findIndex((kf) => kf.time === this.position());
        if (keyframeIndex !== -1) {
          track.keyframes[keyframeIndex].value = value;
        } else {
          // If no keyframe exists at the current position, create a new one
          // console.log('Creating new keyframe for property:', property, 'at position:', this.timelineService.position());
          track.keyframes.push({
            value: value,
            time: this.position(),
          });
        }
      } else {
        group?.tracks.push({
          name: property,
          keyframes: [
            {
              value: value,
              time: this.position(),
            },
          ],
          tweens: [],
        });
      }
      return { ...currentTimeline };
    });

    this.createGsapTimeline();
  }

  updateTween(tween: TimelineTween) {}
}
