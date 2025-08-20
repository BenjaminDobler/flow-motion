import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Timeline, TimelineTween } from '../../../model/timeline';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, Observable, of, switchMap, timer } from 'rxjs';
import { NgBondContainer } from '@richapps/ngx-bond';
import { TimelineService } from '../../../services/timeline.service';

@Component({
  selector: 'timeline-tween',
  imports: [],
  templateUrl: './timeline-tween.component.html',
  styleUrl: './timeline-tween.component.scss',
  host: {
    '(dragStart)': 'onDragStart()',
    '(dragEnd)': 'onDragEnd()',
  },
})
export class TimelineTweenComponent extends NgBondContainer {

  timelineService = inject(TimelineService);
  tween = input<TimelineTween>();
  timeline = input<Timeline>();
  dragging = signal<boolean>(false);
  duration = computed(() => {
    this.timeline();
    const start = this.tween()?.start.time || 0;
    const end = this.tween()?.end.time || 0;
    return end - start;
  });

  durationChanged = toSignal(
    toObservable(this.duration).pipe(
      distinctUntilChanged(),
      switchMap(() => new Observable<boolean>((observer) => {
        observer.next(true);
        const timer$ = timer(500);
        timer$.subscribe(() => {
          observer.next(false);
          observer.complete();
        });
      })),
    ),
  );

  constructor() {
    super();
    effect(() => {
      const start = this.tween()?.start.time || 0;
      const end = this.tween()?.end.time || 0;
      const mpp = this.timelineService.millisecondsPerPixel() || 1;
      const w = (end - start) / mpp;
      this.setWidth(w);

      const x = start / mpp;
      this.x.set(x);
    });
  }

  onDragStart() {
    console.log('Drag started for tween', this.tween());
    this.dragging.set(true);
  }
  onDragEnd() {
    console.log('Drag ended for tween', this.tween());
    this.dragging.set(false);
  }

  // width = computed(() => {
  //   const start = this.tween()?.start.time || 0;
  //   const end = this.tween()?.end.time || 0;
  //   const mpp = this.timeline()?.millisecondsPerPixel || 1;
  //   const w = (end - start) / mpp;
  //   return w;
  // });

  // x = computed(() => {
  //   const start = this.tween()?.start.time || 0;
  //   const mpp = this.timeline()?.millisecondsPerPixel || 1;
  //   const x = start / mpp;
  //   return x;
  // });
}
