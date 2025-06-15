import { computed, effect, Signal, signal } from '@angular/core';
import { DraggerDirective } from '../directives/drag-directive/dragger.directive';

type Link = Signal<{
  x1: number | undefined;
  y1: number | undefined;
  x2: number | undefined;
  y2: number | undefined;
  path: string;
  path2: string;
}>;

export class DragService {
  dragElements = signal<DraggerDirective[]>([]);

  links = signal<Link[]>([]);

  constructor() {
    effect(() => {
      const elements = this.dragElements();
      console.log('drag elements', elements);
    });
  }

  registerDraggableElement(el: DraggerDirective) {
    this.dragElements.update((els) => [...els, el]);
  }

  removeDraggableElement(el: DraggerDirective) {
    this.dragElements.update((x) => x.filter((e) => e !== el));
  }

  createLink() {
    const p1 = this.dragElements().find((d) => d.id === 'property1');
    const p2 = this.dragElements().find((d) => d.id === 'property4');

    const link = computed(() => ({
      x1: p1?.gX(),
      y1: p1?.gY(),
      x2: p2?.gX(),
      y2: p2?.gY(),
      path: `M ${p1?.gX()} ${p1?.gY()} L ${p2?.gX()} ${p2?.gY()}`,
      path2: `M ${p1?.gX()} ${p1?.gY()} C ${p2?.gX()} ${p1?.gY()} ${p1?.gX()} ${p2?.gY()} ${p2?.gX()} ${p2?.gY()}`,
    }));

    this.links.update((x) => [...x, link]);
  }
}
