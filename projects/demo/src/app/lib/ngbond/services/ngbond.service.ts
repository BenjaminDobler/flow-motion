import { computed, Signal, signal } from '@angular/core';
import { NgBondContainer } from '../components/ng-bond-container/ng-bond-container';
import { LinkPosition, NgBondProperty } from '../components/ng-bond-property/ng-bond-property';
import { getSimpleBezierPath } from '../components/util/connections/simple-bezier';
import { getLinePath } from '../components/util/connections/simple.line';
import { getOrhogonalConnection } from '../components/util/connections/orthogonal';
import { getMultiLinePath } from '../components/util/connections/multi-step';
import { getDistance } from '../components/util/geo';

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
  width: Signal<number>;
  height: Signal<number>;
}

export interface LinkProperties {
  strokeWidth?: number;
  stroke?: string;
  strokeDasharray?: string;
  curveType?: 'bezier' | 'straight' | 'multi-line' | 'orthogonal';
  curveRadius?: number;
  animate?: boolean;
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
  scale = signal<number>(1);
  snap = signal<boolean>(true);
  snapDistance = signal<number>(60);

  defaultProperties = signal<LinkProperties>(defaultLinkProperties);

  registerDraggableElement(el: NgBondContainer | NgBondProperty) {
    this.dragElements.update((els) => [...els, el]);
  }

  removeDraggableElement(el: NgBondContainer | NgBondProperty) {
    this.dragElements.update((x) => x.filter((e) => e !== el));
  }

  getBrondPropertyById(id: string) {
    const p1 = this.dragElements().find((d) => d.id() === id) as NgBondProperty;
    return p1;
  }

  createLink(id1: string, id2: string | DragPoint, linkProperties?: LinkProperties, add = true) {
    const p1 = this.getBrondPropertyById(id1);

    const p1Position = p1.position();
    let p2Position: LinkPosition = 'left';

    let p2: NgBondProperty | DragPoint;
    if (typeof id2 === 'string') {
      const p2Property = this.getBrondPropertyById(id2);
      if (add) {
        p2Property.hasLink.set(true);
        p2Property.isEndOfLink.set(true);
      }
      p2 = p2Property;
      p2Position = p2Property.position();
    } else {
      p2 = id2 as DragPoint;
    }

    if (add) {
      p1.hasLink.set(true);
      p1.isStartOfLink.set(true);
    }

    if (p1 && p2) {
      const link = computed(() => {
        const x1 = p1?.gX() + p1.width() / 2;
        const y1 = p1.gY() + p1.height() / 2;
        const x2 = p2?.gX() + p2.width() / 2;
        const y2 = p2?.gY() + p2.height() / 2;

        const defProps = this.defaultProperties();
        const animate = p1.animatedLink();

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
          strokeWidth: p1.bondstrokewidth() || linkProperties?.strokeWidth || defProps.strokeWidth || 2,
          stroke: p1.bondcolor() || linkProperties?.stroke || defProps.stroke || '',
          properties: {
            animate,
            strokeWidth: p1.bondstrokewidth() || linkProperties?.strokeWidth || defProps.strokeWidth || 2,
            stroke: p1.bondcolor() || linkProperties?.stroke || defProps.stroke || '',
            strokeDasharray: linkProperties?.strokeDasharray || defProps.strokeDasharray || '10',
          },
          path: pathFunction(x1 ?? 0, y1 ?? 0, x2 ?? 0, y2 ?? 0, p1Position, p2Position, defProps?.curveRadius || 10, p1, p2),
        };
      });

      if (add) {
        this.links.update((x) => [...x, link]);
      }
      return link;
    }
    return null;
  }

  snapLink?: any;
  currentSnapTarget?: NgBondProperty;
  currentDragSource?: NgBondProperty;

  removePreview(link: any) {
    this.links.update((x) => x.filter((l) => l !== link));
    this.snapLink = undefined;
  }

  startDragPreview(p: NgBondProperty) {
    this.currentDragSource = p;
  }

  updateDragPreview(x: number, y: number) {
    if (this.snap()) {
      let smalledDist = Number.POSITIVE_INFINITY;
      let smallestEl;
      for (const el of this.dragElements()) {
        if (el instanceof NgBondProperty) {
          const dist = getDistance({ x, y }, { x: el.gX(), y: el.gY() });
          if (dist < smalledDist) {
            smalledDist = dist;
            smallestEl = el;
          }
        }
      }
      if (this.currentDragSource && smalledDist < this.snapDistance() && smallestEl) {
        this.currentSnapTarget = smallestEl;
        this.snapLink = this.createLink(
          this.currentDragSource.id(),
          smallestEl.id(),
          {
            stroke: '#333',
          },
          false
        );
      } else {
        this.snapLink = undefined;
        this.currentSnapTarget = undefined;
      }
    }
  }

  endDragPreview(sourceId?: string, targetId?: string) {
    if (sourceId && targetId) {
      this.createLink(sourceId, targetId);
    } else if (sourceId && this.snap() && this.currentSnapTarget) {
      this.createLink(sourceId, this.currentSnapTarget.id());
    }
  }

  removeLink(link: any) {
    const p1 = this.dragElements().find((d) => d.id() === link().inputId) as NgBondProperty;
    const p2 = this.dragElements().find((d) => d.id() === link().outputId) as NgBondProperty;

    p1.hasLink.set(false);
    p1.isStartOfLink.set(false);
    p2.hasLink.set(false);
    p2.isEndOfLink.set(false);

    this.links.update((x) => x.filter((l) => l !== link));
  }

  getComponent(targetElement: any) {
    const c = this.dragElements().find((e) => e.el.nativeElement === targetElement);
    return c;
  }
}
