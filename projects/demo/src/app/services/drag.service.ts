import { computed, effect, Signal, signal } from '@angular/core';
import { DraggerDirective } from '../directives/drag-directive/dragger.directive';
import { DragProperty } from '../directives/drag-property/drag-property.directive';

export type Link = Signal<{
  x1: number | undefined;
  y1: number | undefined;
  x2: number | undefined;
  y2: number | undefined;
  stroke: string;
  path: string;
  path2: string;
  inputId: string;
  outputId: string;
}>;

interface DragPoint {
  gX: Signal<number>;
  gY: Signal<number>;
}

export class DragService {
  dragElements = signal<(DraggerDirective | DragProperty)[]>([]);

  links = signal<Link[]>([]);

  constructor() {
    effect(() => {
      const elements = this.dragElements();
      console.log('drag elements', elements);
    });
  }

  registerDraggableElement(el: DraggerDirective | DragProperty) {
    this.dragElements.update((els) => [...els, el]);
  }

  removeDraggableElement(el: DraggerDirective | DragProperty) {
    this.dragElements.update((x) => x.filter((e) => e !== el));
  }

  createLink(id1: string, id2: string, stroke = 'cornflowerblue') {
    const p1 = this.dragElements().find((d) => d.id === id1);
    const p2 = this.dragElements().find((d) => d.id === id2);

    const x1 = p1?.gX();
    const y1 = p1?.gY();
    const x2 = p2?.gX();
    const y2 = p2?.gY();

    const yOffset = 10;

    if (p1 && p2) {
      const link = computed(() => ({
        x1: p1?.gX(),
        y1: p1.gY(),
        x2: p2.gX(),
        y2: p2.gY(),
        inputId: id1,
        outputId: id2,
        stroke,
        path: `M ${p1?.gX()} ${p1?.gY()} L ${p2?.gX()} ${p2?.gY()}`,
        path2: `M ${p1?.gX()} ${p1?.gY() + yOffset} C ${p2?.gX()} ${p1?.gY() + yOffset} ${p1?.gX()} ${p2?.gY() + yOffset} ${p2?.gX()} ${p2?.gY() + yOffset}`,
      }));

      this.links.update((x) => [...x, link]);
    }
  }

  createPreviewLink(
    id1: string,
    dragPoint: DragPoint,
    stroke = 'cornflowerblue',
  ) {
    const p1 = this.dragElements().find((d) => d.id === id1);
    const p2 = dragPoint;

    const x1 = p1?.gX();
    const y1 = p1?.gY();
    const x2 = p2?.gX();
    const y2 = p2?.gY();

    const yOffset = 10;

    if (p1 && p2) {
      const link = computed(() => ({
        x1: p1?.gX(),
        y1: p1.gY(),
        x2: p2.gX(),
        y2: p2.gY(),
        inputId: id1,
        outputId: 'current_drag_preview',
        stroke,
        path: `M ${p1?.gX()} ${p1?.gY()} L ${p2?.gX()} ${p2?.gY()}`,
        path2: `M ${p1?.gX()} ${p1?.gY() + yOffset} C ${p2?.gX()} ${p1?.gY() + yOffset} ${p1?.gX()} ${p2?.gY() + yOffset} ${p2?.gX()} ${p2?.gY() + yOffset}`,
      }));

      this.links.update((x) => [...x, link]);
      return link;
    }
    return null;
  }

  removePreview(link: any) {
    this.links.update((x) => x.filter((l) => l !== link));
  }

  getComponent(targetElement: any) {
    this.dragElements().forEach((e) => {
      console.log(e.el.nativeElement);
    });
    const c = this.dragElements().find(
      (e) => e.el.nativeElement === targetElement,
    );
    return c;
  }
}
