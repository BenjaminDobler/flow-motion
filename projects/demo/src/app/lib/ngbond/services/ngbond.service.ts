import { computed, effect, model, Signal, signal } from '@angular/core';
import { NgBondContainer } from '../components/ng-bond-container/ng-bond-container';
import {
  LinkPosition,
  NgBondProperty,
} from '../components/ng-bond-property/ng-bond-property';
import { getBend } from '../components/util/connections.util';

export type Link = Signal<{
  x1: number | undefined;
  y1: number | undefined;
  x2: number | undefined;
  y2: number | undefined;
  properties: LinkProperties;
  path: string;
  inputId: string;
  outputId: string;
}>;

interface DragPoint {
  gX: Signal<number>;
  gY: Signal<number>;
}

export interface LinkProperties {
  strokeWidth?: number;
  stroke?: string;
  strokeDasharray?: string;
  curveType?: 'bezier' | 'straight' | 'multi-line';
  curveRadius?: number;
}

const defaultLinkProperties: LinkProperties = {
  strokeWidth: 2,
  stroke: 'cornflowerblue',
  strokeDasharray: '10',
  curveType: 'bezier',
  curveRadius: 10,
};

export class NgBondService {
  dragElements = signal<(NgBondContainer | NgBondProperty)[]>([]);

  links = signal<Link[]>([]);

  constructor() {}

  defaultProperties = signal<LinkProperties>(defaultLinkProperties);

  registerDraggableElement(el: NgBondContainer | NgBondProperty) {
    this.dragElements.update((els) => [...els, el]);
  }

  removeDraggableElement(el: NgBondContainer | NgBondProperty) {
    this.dragElements.update((x) => x.filter((e) => e !== el));
  }

  createLink(
    id1: string,
    id2: string | DragPoint,
    linkProperties?: LinkProperties,
  ) {
    const p1 = this.dragElements().find(
      (d) => d.id() === id1,
    ) as NgBondProperty;

    const p1Position = p1.position();
    let p2Position: LinkPosition = 'Left';

    let p2: NgBondProperty | DragPoint;
    if (typeof id2 === 'string') {
      const p2Property = this.dragElements().find(
        (d) => d.id() === id2,
      ) as NgBondProperty;
      p2Property.hasLink.set(true);
      p2Property.isEndOfLink.set(true);
      p2 = p2Property;
      p2Position = p2Property.position();
    } else {
      p2 = id2 as DragPoint;
    }

    p1.hasLink.set(true);
    p1.isStartOfLink.set(true);

    const yOffset = 7;

    if (p1 && p2) {
      const link = computed(() => {
        const x1 = p1?.gX();
        const y1 = p1.gY();
        const x2 = p2?.gX();
        const y2 = p2?.gY();
        const defProps = this.defaultProperties();

        let pathFunction;
        if (defProps?.curveType === 'bezier') {
          pathFunction = this.getSimpleBezierPath;
        } else if (defProps?.curveType === 'straight') {
          pathFunction = this.getLinePath;
        } else {
          pathFunction = this.getMultiLinePath;
        }
        return {
          x1,
          y1,
          x2,
          y2,
          inputId: id1,
          outputId: typeof id2 === 'string' ? id2 : 'current_drag_preview',
          strokeWidth:
            p1.bondstrokewidth() ||
            linkProperties?.strokeWidth ||
            defProps.strokeWidth ||
            2,
          stroke:
            p1.bondcolor() || linkProperties?.stroke || defProps.stroke || '',
          properties: {
            strokeWidth:
              p1.bondstrokewidth() ||
              linkProperties?.strokeWidth ||
              defProps.strokeWidth ||
              2,
            stroke:
              p1.bondcolor() || linkProperties?.stroke || defProps.stroke || '',
            strokeDasharray:
              linkProperties?.strokeDasharray ||
              defProps.strokeDasharray ||
              '10',
          },
          path: pathFunction(
            x1 ?? 0,
            y1 ?? 0,
            x2 ?? 0,
            y2 ?? 0,
            p1Position,
            p2Position,
            defProps?.curveRadius || 10,
          ),
        };
      });

      this.links.update((x) => [...x, link]);
      return link;
    }
    return null;
  }

  getMultiLinePath(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    p1Position: LinkPosition,
    p2Position: LinkPosition,
    curveRadius = 10,
  ) {
    let offset = 20;
    let path = `M ${x1} ${y1}`;

    const points = [];

    if (p1Position === 'Right' && p2Position === 'Left' && x2 > x1) {
      const dist = x2 - x1;
      offset = dist / 2;

      points.push({ x: x1, y: y1 });
      points.push({ x: x1 + offset, y: y1 });
      points.push({ x: x2 - offset, y: y2 });
      points.push({ x: x2, y: y2 });
    } else if (p1Position === 'Right' && p2Position === 'Left' && x2 < x1) {
      const ydist = y1 - y2;
      points.push({ x: x1, y: y1 });
      points.push({ x: x1 + offset, y: y1 });
      points.push({ x: x1 + offset, y: y1 - ydist / 2 });
      points.push({ x: x2 - offset, y: y1 - ydist / 2 });
      points.push({ x: x2 - offset, y: y2 });
      points.push({ x: x2, y: y2 });
    }

    const segments: any[] = [];

    for (let i = 0; i <= points.length - 1; i++) {
      if (i === 0) {
        segments.push(`M ${points[i].x} ${points[i].y}`);
      } else if (i === points.length - 1) {
        segments.push(`L ${points[i].x} ${points[i].y}`);
      } else {
        const prevPoint = points[i - 1];
        const currentPoint = points[i];
        const nextPoint = points[i + 1];
        segments.push(getBend(prevPoint, currentPoint, nextPoint, curveRadius));
      }
    }

    path = segments.join(' ');

    return path;
  }

  getLinePath(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    p1Position: LinkPosition,
    p2Position: LinkPosition,
    curveRadius = 10,
  ) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  getSimpleBezierPath(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    p1Position: LinkPosition,
    p2Position: LinkPosition,
    curveRadius = 10,
  ) {
    const yOffset = 7;
    return `M ${x1} ${y1} C ${x2} ${y1 + yOffset} ${x1} ${y2 + yOffset} ${x2} ${y2 + yOffset}`;
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
    const c = this.dragElements().find(
      (e) => e.el.nativeElement === targetElement,
    );
    return c;
  }
}
