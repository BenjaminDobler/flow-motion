import { computed, effect, Signal, signal } from '@angular/core';
import { NgBondContainer } from '../components/ng-bond-container/ng-bond-container';
import { NgBondProperty } from '../components/ng-bond-property/ng-bond-property';


export type Link = Signal<{
  x1: number | undefined;
  y1: number | undefined;
  x2: number | undefined;
  y2: number | undefined;
  strokeWidth: number;
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

export class NgBondService {
  dragElements = signal<(NgBondContainer | NgBondProperty)[]>([]);

  links = signal<Link[]>([]);

  constructor() {
    effect(() => {
      const elements = this.dragElements();
      console.log('drag elements', elements);
    });
  }

  registerDraggableElement(el: NgBondContainer | NgBondProperty) {
    this.dragElements.update((els) => [...els, el]);
  }

  removeDraggableElement(el: NgBondContainer | NgBondProperty) {
    this.dragElements.update((x) => x.filter((e) => e !== el));
  }

  createLink(id1: string, id2: string, stroke = 'cornflowerblue') {
    const p1 = this.dragElements().find(
      (d) => d.id() === id1,
    ) as NgBondProperty;
    const p2 = this.dragElements().find(
      (d) => d.id() === id2,
    ) as NgBondProperty;

    p2.hasLink.set(true);
    p2.isEndOfLink.set(true);
    p1.hasLink.set(true);
    p1.isStartOfLink.set(true);

    const yOffset = 7;

    if (p1 && p2) {
      const link = computed(() => ({
        x1: p1?.gX(),
        y1: p1.gY(),
        x2: p2.gX(),
        y2: p2.gY(),
        inputId: id1,
        outputId: id2,
        strokeWidth: p1.bondstrokewidth(),
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
    console.log('create preview link');
    const p1 = this.dragElements().find((d) => d.id() === id1) as NgBondProperty;
    const p2 = dragPoint;

    const yOffset = 7;

    if (p1.bondcolor()!=='') {
      stroke = p1.bondcolor();
    }

    

    if (p1 && p2) {
      const link = computed(() => ({
        x1: p1?.gX(),
        y1: p1.gY(),
        x2: p2.gX(),
        y2: p2.gY(),
        inputId: id1,
        outputId: 'current_drag_preview',
        strokeWidth: p1.bondstrokewidth(),
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

  removeLink(link: any) {
    const p1 = this.dragElements().find(
      (d) => d.id() === link().inputId,
    ) as NgBondProperty;
    const p2 = this.dragElements().find(
      (d) => d.id() === link().outputId,
    ) as NgBondProperty;

    p1.hasLink.set(false);
    p1.isStartOfLink.set(false);
    p2.hasLink.set(false);
    p2.isEndOfLink.set(false);


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
