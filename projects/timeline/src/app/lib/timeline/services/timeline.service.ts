import { inject, outputBinding, signal, ViewContainerRef } from '@angular/core';

import { gsap } from 'gsap';
import { Timeline, TimelineGroup, TimelineTrack, TimelineTween } from '../model/timeline';
import { NgBondContainer, NgBondService } from '@richapps/ngx-bond';
import { TestComponentComponent } from '../../../components/test-component/test-component.component';
import { BackgroundColorPropertyDirective } from '../directives/backgroundColorProperty.directive';
import { ComponentFactory } from './component.factory';

export class TimelineService {
  private bondService = inject(NgBondService);

  componentFactory = inject(ComponentFactory);


  selectedTween = signal<{ tween: TimelineTween; track: TimelineTrack; group: TimelineGroup } | null>(null);

  animationTimeline: gsap.core.Timeline = gsap.timeline({
    onUpdate: () => {
      this.position.set(Math.round(this.animationTimeline.time() * 1000));
      if (this.animationTimeline.isActive()) {
        this.playing.set(true);
      } else {
        setTimeout(() => {
          this.playing.set(false);
        }, 100);
      }
    },
  });

  duration = signal(15000); // Default duration in milliseconds
  millisecondsPerPixel = signal(10); // Default milliseconds per pixel

  playing = signal(false);

  position = signal(0);
  scrubbing = signal(false);

  timeline = signal<Timeline>({
    groups: [],
  });

  constructor() {
    this.componentFactory.propertyChanged.subscribe(({ id, property, value }) => {
      this.propertyChanged(id, property, value);
    });

    this.componentFactory.componentAdded.subscribe((id) => {
      this.timeline.update((currentTimeline) => {
        currentTimeline.groups.push({
          name: id,
          tracks: [],
        });
        return { ...currentTimeline };
      });
    });
  }

  setPosition(pos: number) {
    //this.animationTimeline.play(pos/1000);

    this.position.set(pos);
    this.animationTimeline.seek(pos / 1000, false);
  }

  setScrubbing(scrubbing: boolean) {
    if (!scrubbing) {
      setTimeout(() => {
        this.scrubbing.set(scrubbing);
      }, 100);
    } else {
      this.scrubbing.set(scrubbing);
    }
  }

  play() {
    this.animationTimeline.play();
    this.playing.set(true);
  }

  pause() {
    this.scrubbing.set(true);

    this.animationTimeline.pause();
    this.playing.set(false);
    setTimeout(() => {
      this.scrubbing.set(false);
    }, 100);
  }

  stop() {
    this.scrubbing.set(true);
    this.animationTimeline.pause(0);
    this.playing.set(false);
    setTimeout(() => {
      this.scrubbing.set(false);
    }, 100);
  }


  createGsapTimeline() {
    const t = this.timeline();

    let timeline = this.animationTimeline;
    timeline.clear();
    timeline.pause();

    t.groups.forEach((group) => {
      const element = this.bondService.getComponentById(group.name);
      const e = this.componentFactory.containerElementMap.get(element as NgBondContainer);

      if (element) {
        group.tracks.forEach((track) => {
          const targetDirective = e?.propertyDirectiveMap.get(track.name);
          const prop = targetDirective.inspectableProperties.find((p: any) => p.setterName === track.name);
          const isSignal = prop?.isSignal || false;
          const animationProp = isSignal ? `signal_${track.name}` : track.name;

          track.keyframes.forEach((keyframe, index) => {
            timeline.set(targetDirective, { [animationProp]: keyframe.value }, keyframe.time / 1000);

            if (index < track.keyframes.length - 1) {
              const nextKeyframe = track.keyframes[index + 1];
              const tween = track.tweens.find((tween) => tween.start === keyframe);
              let props: any;
              if (tween) {
                const duration = (nextKeyframe.time - keyframe.time) / 1000;
                props = {
                  duration: (nextKeyframe.time - keyframe.time) / 1000,
                  ease: tween.easing || 'none',
                };

                if (isSignal) {
                  props[`signal_${track.name}`] = nextKeyframe.value;
                } else {
                  props[track.name] = nextKeyframe.value;
                }

                if (tween.motionPath) {
                  const proxyElement = {
                    x: targetDirective.x(),
                    y: targetDirective.y(),
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
                        targetDirective.x.set(proxyElement.x);
                        targetDirective.y.set(proxyElement.y);
                      },
                    },
                    keyframe.time / 1000
                  );
                } else {
                  timeline.to(targetDirective, props, keyframe.time / 1000);
                }
              }
            }
          });
        });
      }
    });

    this.animationTimeline = timeline;

    // timeline.play();
  }



  propertyChanged(id: string, property: string, value: any) {
    if (this.playing() || this.scrubbing()) {
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
