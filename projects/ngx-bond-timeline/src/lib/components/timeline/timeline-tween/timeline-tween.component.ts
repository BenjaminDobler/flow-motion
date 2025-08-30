import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
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
      switchMap(
        () =>
          new Observable<boolean>((observer) => {
            observer.next(true);
            const timer$ = timer(500);
            timer$.subscribe(() => {
              observer.next(false);
              observer.complete();
            });
          })
      )
    )
  );

  constructor() {
    super();
    effect(() => {
      const start = this.tween()?.start.time || 0;
      const end = this.tween()?.end.time || 0;
      this.timeline();
      const mpp = this.timelineService.millisecondsPerPixel() || 1;
      const w = (end - start) / mpp;
      this.setWidth(w);

      const x = start / mpp;
      this.x.set(x);
    });
    this.setHeight(20);
  }

  onDragStart() {
    this.dragging.set(true);
  }
  onDragEnd() {
    this.dragging.set(false);
  }
}
