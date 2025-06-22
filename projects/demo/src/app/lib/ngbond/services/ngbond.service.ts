import { computed, effect, model, Signal, signal } from '@angular/core';
import { NgBondContainer } from '../components/ng-bond-container/ng-bond-container';
import {
  LinkPosition,
  NgBondProperty,
} from '../components/ng-bond-property/ng-bond-property';
import { getBend, pointToPath } from '../components/util/connections.util';
import { OrthogonalConnector } from '../components/util/orthoconnector';
import { getSimpleBezierPath } from '../components/util/connections/simple-bezier';
import { getLinePath } from '../components/util/connections/simple.line';
import { getOrhogonalConnection } from '../components/util/connections/orthogonal';
import { getMultiLinePath } from '../components/util/connections/multi-step';

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

export interface DragPoint {
  gX: Signal<number>;
  gY: Signal<number>;
}

export interface LinkProperties {
  strokeWidth?: number;
  stroke?: string;
  strokeDasharray?: string;
  curveType?: 'bezier' | 'straight' | 'multi-line' | 'orthogonal';
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
    let p2Position: LinkPosition = 'left';

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
          pathFunction = getSimpleBezierPath;
        } else if (defProps?.curveType === 'straight') {
          pathFunction = getLinePath;
        } else if (defProps?.curveType === 'orthogonal') {
          pathFunction = getOrhogonalConnection;
        } else {
          pathFunction = getMultiLinePath;
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
            p1,
            p2,
          ),
        };
      });

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
    const c = this.dragElements().find(
      (e) => e.el.nativeElement === targetElement,
    );
    return c;
  }
}
