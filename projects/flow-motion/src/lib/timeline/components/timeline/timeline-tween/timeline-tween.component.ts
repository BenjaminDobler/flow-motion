import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FLTimeline, FLTween } from '../../../model/timeline';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, Observable, switchMap, timer } from 'rxjs';
import { TimelineService } from '../../../services/timeline.service';
import { FMContainer } from '../../../../../public-api';

@Component({
  selector: 'timeline-tween',
  imports: [],
  templateUrl: './timeline-tween.component.html',
  styleUrl: './timeline-tween.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(dragStart)': 'onDragStart()',
    '(dragEnd)': 'onDragEnd()',
  },
})
export class TimelineTweenComponent extends FMContainer {
  timelineService = inject(TimelineService);
  tween = input<FLTween>();
  timeline = input<FLTimeline>();
  dragging = signal<boolean>(false);
  duration = computed(() => {
    this.timeline();
    const start = this.tween()?.start().time() || 0;
    const end = this.tween()?.end().time() || 0;
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
      const start = this.tween()?.start().time() || 0;
      const end = this.tween()?.end().time() || 0;
      this.timeline();
      const mpp = this.timelineService.millisecondsPerPixel() || 1;
      const w = (end - start) / mpp;
      this.setWidth(w);

      const x = start / mpp;
      // this.x.set(x);
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
