import { inject, outputBinding, signal, ViewContainerRef } from '@angular/core';

import { gsap } from 'gsap';
import { FLGroup, FLKeyframe, FLTimeline, FLTrack, FLTween } from '../model/timeline';
import { configureGsap } from '../gsap.setup';
import { FMService } from '../../services/fm.service';
import { ComponentFactory } from '../../services/component.factory';
import { InspectableProperty } from '../../types/types';
import { FMContainer } from '../../../index';

export class TimelineService {
  private fmService = inject(FMService);

  componentFactory = inject(ComponentFactory);

  selectedTween = signal<FLTween | null>(null);

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

  timeline = new FLTimeline();

  constructor() {
    configureGsap();
    this.componentFactory.propertyChanged.subscribe(({ id, property, value }) => {
      this.propertyChanged(id, property, value);
    });

    this.componentFactory.componentAdded.subscribe(({ id, displayName }) => {
      this.timeline.groups.update((groups) => [...groups, new FLGroup(id, displayName)]);
    });

    this.componentFactory.componentRemoved.subscribe((id) => {
      this.timeline.groups.update((groups) => groups.filter((g) => g.id() !== id));
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
    this.position.set(0);
    this.playing.set(false);
    setTimeout(() => {
      this.scrubbing.set(false);
    }, 100);
  }

  createGsapTimeline() {
    const t = this.timeline;

    let timeline = this.animationTimeline;
    timeline.clear();
    timeline.pause();

    t.groups().forEach((group) => {
      const element = this.fmService.getComponentById(group.id());
      const e = this.componentFactory.containerElementMap.get(element as FMContainer);

      if (element) {
        group.tracks().forEach((track) => {
          const targetDirective = e?.propertyDirectiveMap.get(track.name());
          const prop: InspectableProperty = targetDirective.inspectableProperties.find((p: any) => p.name === track.name());
          const isSignal = !prop?.isGetter;
          const animationProp = isSignal ? `signal_${track.name()}` : track.name();

          track.keyframes().forEach((keyframe, index) => {
            timeline.set(targetDirective, { [animationProp]: keyframe.value() }, keyframe.time() / 1000);

            if (index < track.keyframes().length - 1) {
              const nextKeyframe = track.keyframes()[index + 1];
              const tween = track.tweens().find((tween) => tween.start() === keyframe);
              let props: any;
              if (tween) {
                const duration = (nextKeyframe.time() - keyframe.time()) / 1000;
                props = {
                  duration,
                  ease: tween.easing() || 'none',
                };

                if (isSignal) {
                  props[`signal_${track.name()}`] = nextKeyframe.value();
                } else {
                  props[track.name()] = nextKeyframe.value();
                }

                if (tween.motionPath()) {
                  const proxyElement = {
                    x: targetDirective.x(),
                    y: targetDirective.y(),
                    rotation: targetDirective.rotate ? targetDirective.rotate() : 0,
                  };

                  timeline.to(
                    proxyElement,
                    {
                      duration,
                      motionPath: {
                        path: tween.motionPath() as string,
                        autoRotate: tween.autoRotate(),
                      },
                      ease: tween.easing() || 'none',

                      onUpdate: () => {
                        targetDirective.x.set(proxyElement.x);
                        targetDirective.y.set(proxyElement.y);
                        if (tween.autoRotate()) {
                          targetDirective.rotate.set(proxyElement.rotation);
                        }
                      },
                    },
                    keyframe.time() / 1000
                  );
                } else {
                
                  if (track.name() === 'pathdata') {
                    const duration = (nextKeyframe.time() - keyframe.time()) / 1000;
                    const start = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    start.setAttribute('d', keyframe.value());

                    timeline.fromTo(
                      targetDirective.el.nativeElement,
                      { morphSVG: keyframe.value() },
                      {
                        morphSVG: nextKeyframe.value(),
                        ease: tween.easing() || 'none',
                        duration,
                      },
                      keyframe.time() / 1000
                    );
                  } else {
                    timeline.to(targetDirective, props, keyframe.time() / 1000);
                  }
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

    const group = this.timeline.groups().find((g) => g.id() === id);
    const track = group?.tracks().find((t) => t.name() === property);
    if (track) {
      const keyframeIndex = track.keyframes().findIndex((kf) => kf.time() === this.position());
      if (keyframeIndex !== -1) {
        track.keyframes()[keyframeIndex].value.set(value);
      } else {
        // If no keyframe exists at the current position, create a new one
        track.keyframes.update((kfs) => [...kfs, new FLKeyframe(this.position(), value, track)]);
      }
    } else {
      const newTrack = new FLTrack(property, group!);
      newTrack.name.set(property);
      newTrack.keyframes.set([new FLKeyframe(this.position(), value, newTrack)]);
      group?.tracks.update((tracks) => [...tracks, newTrack]);
    }

    group?.tracks().forEach((t) => {});

    this.createGsapTimeline();
  }

  addKeyframe(track: FLTrack, time: number) {
    const prevKeyframe = track.keyframes().reduce((prev, curr) => (curr.time() <= time && curr.time() > (prev?.time() || -1) ? curr : prev), null as FLKeyframe | null);
    const nextKeyframe = track.keyframes().reduce((next, curr) => (curr.time() >= time && (next?.time === undefined || curr.time() < next.time()) ? curr : next), null as FLKeyframe | null);

    const value = prevKeyframe ? prevKeyframe.value() : nextKeyframe ? nextKeyframe.value() : null;
    const newKeyframe = new FLKeyframe(time, value, track);

    track.keyframes.update((kfs) => [...kfs, newKeyframe].sort((a, b) => a.time() - b.time()));

    if (prevKeyframe && newKeyframe) {
      const existingTween = track.tweens().find((tween) => tween.start() === prevKeyframe && tween.end() === nextKeyframe);

      // Update tweens
      if (prevKeyframe && nextKeyframe && existingTween) {
        // Remove any existing tween between prevKeyframe and nextKeyframe
        track.tweens.update((tweens) => tweens.filter((tween) => !(tween.start() === prevKeyframe && tween.end() === nextKeyframe)));
        // Add new tweens

        track.tweens.update((tweens) => [...tweens, new FLTween(prevKeyframe, newKeyframe, track), new FLTween(newKeyframe, nextKeyframe, track)]);
      }
    }
  }

  deleteKeyframe(keyframe: FLKeyframe, track?: FLTrack) {
    if (track) {
      track.keyframes.update((kfs) => kfs.filter((kf) => kf !== keyframe));
      // Remove any tweens associated with this keyframe
      track.tweens.update((tweens) => tweens.filter((tween) => tween.start() !== keyframe && tween.end() !== keyframe));
      this.createGsapTimeline();
    }
  }

  updateTween(tween: FLTween) {}
}
