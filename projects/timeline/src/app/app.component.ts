import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TimelineComponent } from './lib/timeline/components/timeline/timeline.component';
import { Timeline } from './lib/timeline/model/timeline';
import { TestitDirective } from './testit.directive';
import { NgBondContainer } from './lib/ngbond/components/ng-bond-container/ng-bond-container';
import { NgBondWorld } from './lib/ngbond/components/ng-bond-world/ng-bond-world.component';
import { NgBondService } from './lib/ngbond/services/ngbond.service';
import { SelectionManager } from './lib/ngbond/services/selection.manager';
import { KeyManager } from './lib/ngbond/services/key.manager';
import { TestComponentComponent } from './components/test-component/test-component.component';

@Component({
  selector: 'app-root',
  imports: [TimelineComponent, TestitDirective, NgBondContainer, NgBondWorld],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [NgBondService, SelectionManager, KeyManager],
})
export class AppComponent {
  title = 'demo';

  @ViewChild('insert_slot', { read: ViewContainerRef })
  worldHost!: ViewContainerRef;

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

  addComponent() {
    this.worldHost.createComponent(TestComponentComponent);
  }
}
