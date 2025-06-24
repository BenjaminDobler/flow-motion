import {
  fromEvent,
  last,
  map,
  share,
  startWith,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';

const mouseMove$ = fromEvent<MouseEvent>(document, 'mousemove');
const mouseUp$ = fromEvent<MouseEvent>(document, 'mouseup');

export function makeDraggable(element: HTMLElement) {
  const mouseDown$ = fromEvent<MouseEvent>(element, 'mousedown').pipe(
    tap((e: MouseEvent) => {
      if (e.target instanceof HTMLInputElement) {
        console.log('yes it is an input!');
      } else {
        e.preventDefault();
        e.stopPropagation();
      }
    }),
    map((evt) => ({
      pageY: evt.pageY,
      pageX: evt.pageX,
      offsetX: evt.offsetX,
      offsetY: evt.offsetY,
      target: evt.target
    })),
    share(),
  );

  const dragStart$ = mouseDown$;
  const dragMove$ = dragStart$.pipe(
    switchMap((start) =>
      mouseMove$.pipe(
        map((moveEvent) => ({
          originalEvent: moveEvent,
          deltaX: moveEvent.pageX - start.pageX,
          deltaY: moveEvent.pageY - start.pageY,
          startOffsetX: start.offsetX,
          startOffsetY: start.offsetY,

        })),
        takeUntil(mouseUp$),
      ),
    ),
    share(),
  );

  const dragEnd$ = dragStart$.pipe(
    switchMap((start) =>
      mouseMove$.pipe(
        startWith(start),
        map((moveEvent) => ({
          originalEvent: moveEvent,
          deltaX: moveEvent.pageX - start.pageX,
          deltaY: moveEvent.pageY - start.pageY,
          startOffsetX: start.offsetX,
          startOffsetY: start.offsetY,
        })),
        takeUntil(mouseUp$),
        last(),
      ),
    ),
  );

  return { dragStart$, dragMove$, dragEnd$ };
}
