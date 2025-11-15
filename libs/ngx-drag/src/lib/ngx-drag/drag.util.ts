import { fromEvent, last, map, share, startWith, switchMap, take, takeUntil, tap, filter, BehaviorSubject, NEVER, Subject } from 'rxjs';

const mouseMove$ = fromEvent<PointerEvent>(document, 'pointermove').pipe(share());
const mouseUp$ = fromEvent<PointerEvent>(document, 'pointerup').pipe(share());

export function makeDraggable(element: HTMLElement, disabled$ = new BehaviorSubject<boolean>(false)) {
  const mouseDown$ =  fromEvent<PointerEvent>(element, 'pointerdown').pipe(
    filter((e: PointerEvent)=>{
      return !(e.target as any).attributes.preventselection && e.button === 0;
    }),
    tap((e: PointerEvent) => {
      if (!(e.target instanceof HTMLInputElement) && disabled$.getValue() === false) {
        e.preventDefault();
        e.stopPropagation();
      } 
    }),
    map((evt) => {
      const rect = element.getBoundingClientRect();
      const offsetX = evt.pageX - rect.left;
      const offsetY = evt.pageY - rect.top;

      return {
        pageY: evt.pageY,
        pageX: evt.pageX,
        offsetX,
        offsetY,
        calcOffsetX: offsetX,
        calcOffsetY: offsetY,
        target: element,
      };
    }),
    share()
  );


  const dragStart$ = mouseDown$.pipe(
    switchMap((start) =>
      mouseMove$
        .pipe(
          map((moveEvent) => {
            return {
              ...start,
              ...moveEvent as any,
              offsetX: start.offsetX,
              offsetY: start.offsetY,
            };
          }),
          take(1)
        )
        .pipe(takeUntil(mouseUp$))
    ),
    share()
  );

  const dragMove$ = dragStart$.pipe(
    switchMap((start: any) =>
      mouseMove$.pipe(
        map((moveEvent) => {
          return {
            originalEvent: moveEvent as any,
            deltaX: moveEvent.pageX - start.pageX,
            deltaY: moveEvent.pageY - start.pageY,
            startOffsetX: start.offsetX,
            startOffsetY: start.offsetY,
          };
        }),
        takeUntil(mouseUp$)
      )
    ),
    share()
  );

  const dragEnd$ = dragStart$.pipe(
    switchMap((start) =>
      mouseMove$.pipe(
        startWith(start),
        map((moveEvent) => ({
          originalEvent: moveEvent as any,
          deltaX: moveEvent.pageX - start.pageX,
          deltaY: moveEvent.pageY - start.pageY,
          startOffsetX: start.offsetX,
          startOffsetY: start.offsetY,
        })),
        takeUntil(mouseUp$),
        last()
      )
    )
  );

  // Create a click event that is emitted when the mouse is released without moving
  const click$ = mouseDown$.pipe(switchMap((start) => mouseUp$.pipe(takeUntil(mouseMove$))));


  return { dragStart$: disabled$.pipe(switchMap((d)=>{
    if(!d) return dragStart$;
    return NEVER;
  })), dragMove$: disabled$.pipe(switchMap((d)=>{
    if(!d) return dragMove$;
    return NEVER;
  })), dragEnd$: disabled$.pipe(switchMap((d)=>{
    if(!d) return dragEnd$;
    return NEVER;
  })), click$: disabled$.pipe(switchMap((d)=>{
    if(!d) return click$;
    return NEVER;
  })) };
}
