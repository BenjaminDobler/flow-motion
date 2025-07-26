import { Component, effect, EnvironmentInjector, inject, inputBinding, output, outputBinding, runInInjectionContext, signal, ViewChild, ViewContainerRef } from '@angular/core';
import { TimelineComponent } from './lib/timeline/components/timeline/timeline.component';
import { Timeline } from './lib/timeline/model/timeline';
import { TestComponentComponent } from './components/test-component/test-component.component';
import { KeyManager, NgBondContainer, NgBondService, NgBondWorld, SelectionManager } from '@richapps/ngx-bond';

@Component({
  selector: 'app-root',
  imports: [TimelineComponent, NgBondWorld],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [NgBondService, SelectionManager, KeyManager],
})
export class AppComponent {
  title = 'demo';

  @ViewChild('insert_slot', { read: ViewContainerRef })
  worldHost!: ViewContainerRef;

  private injector: EnvironmentInjector = inject(EnvironmentInjector);

  timeline: Timeline = {
    millisecondsPerPixel: 10,
    maxTime: 10000, // Optional, can be omitted if not needed
    groups: [
      {
        name: 'Group 1',
        tracks: [
          {
            name: 'Track 1',
            tweens: [],
            keyframes: [
              {
                value: 'Keyframe 1',
                time: 0,
              },
              {
                value: 'Keyframe 2',
                time: 1000,
              },
            ],
          },
          {
            name: 'Track 2',
            tweens: [],
            keyframes: [
              {
                value: 'Keyframe 3',
                time: 2000,
              },
              {
                value: 'Keyframe 4',
                time: 5000,
              },
            ],
          },
        ],
      },
      {
        name: 'Group 2',
        tracks: [
          {
            name: 'Track 1',
            keyframes: [
              {
                value: 'Keyframe 3',
                time: 2000,
              },
              {
                value: 'Keyframe 4',
                time: 5000,
              },
            ],
            tweens: [],
          },
          {
            name: 'Track 2',
            keyframes: [
              {
                value: 'Keyframe 3',
                time: 2000,
              },
              {
                value: 'Keyframe 4',
                time: 5000,
              },
              {
                value: 'Keyframe 3',
                time: 6000,
              },
              {
                value: 'Keyframe 4',
                time: 9000,
              },
            ],
            tweens: [],
          },
        ],
      },
    ],
  };

  t = signal<Timeline>(this.timeline);

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
              console.log('====== position changed for ', id, evt);
            }),
            outputBinding('widthUpdated', (evt: any) => {
              console.log('====== width changed for ', id, evt);
            }),
            outputBinding('heightUpdated', (evt: any) => {
              console.log('====== height changed for ', id, evt);
            }),
          ],
        },
      ],
    });
    componentRef.setInput('bondcontainer', id);

    this.t.update((currentTimeline) => {
      currentTimeline.groups.push({
        name: id,
        tracks: [
          {
            name: 'x',
            keyframes: [],
            tweens: [],
          },
          {
            name: 'y',
            keyframes: [],
            tweens: [],
          },
        ],
      });
      return { ...currentTimeline };
    });
  }
}
