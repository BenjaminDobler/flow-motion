import { computed, Signal, signal } from '@angular/core';
import { NgBondContainer } from '../components/ng-bond-container/ng-bond-container';
import { LinkPosition, NgBondProperty } from '../components/ng-bond-property/ng-bond-property';
import { getSimpleBezierPath } from '../components/util/connections/simple-bezier';
import { getLinePath } from '../components/util/connections/simple.line';
import { getOrhogonalConnection } from '../components/util/connections/orthogonal';
import { getMultiLinePath } from '../components/util/connections/multi-step';
import { getDistance } from '../components/util/geo';
import { NgBondWorld } from '@richapps/ngx-bond';

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
  dragElements = signal<NgBondContainer[]>([]);

  links = signal<Link[]>([]);
  scale = signal<number>(1);
  snap = signal<boolean>(true);
  snapDistance = signal<number>(60);

  world?: NgBondWorld;

  defaultProperties = signal<LinkProperties>(defaultLinkProperties);

  registerDraggableElement(el: NgBondContainer) {
    this.dragElements.update((els) => [...els, el]);
  }

  removeDraggableElement(el: NgBondContainer | NgBondProperty) {
    this.dragElements.update((x) => x.filter((e) => e !== el));
  }

  getBrondPropertyById(id: string) {
    const p1 = this.dragElements().find((d) => d.id() === id);
    return p1;
  }

  createLink(id1: string, id2: string | DragPoint, linkProperties?: LinkProperties, add = true) {
    console.log('create link called with:', id1, id2, linkProperties, add);
    const p1 = this.getBrondPropertyById(id1);
    const property1 = p1?.injector.get(NgBondProperty);

    console.log('property 1:', property1);

    if (!property1) {
      console.warn(`No property found for id: ${id1}`);
      return null;
    } 

    const p1Position = property1.position();
    let p2Position: LinkPosition = 'left';

    let p2: NgBondProperty | DragPoint;
    if (typeof id2 === 'string') {
      const p2Property = this.getBrondPropertyById(id2);
      const property2 = p2Property?.injector.get(NgBondProperty);
      if (property2) {
        if (add) {
          property2.hasLink.set(true);
          property2.isEndOfLink.set(true);
        }
        p2 = property2;
        p2Position = property2?.position();
      }
    } else {
      p2 = id2 as DragPoint;
    }

    if (add) {
      property1?.hasLink.set(true);
      property1?.isStartOfLink.set(true);
    }

    if (p1) {
      const link = computed(() => {
        const x1 = p1?.gX ? p1.gX() + (p1.width ? p1.width() / 2 : 0) : undefined;
        const y1 = p1?.gY ? p1.gY() + (p1.height ? p1.height() / 2 : 0) : undefined;
        const x2 = p2?.gX ? p2.gX() + (p2.width ? p2.width() / 2 : 0) : undefined;
        const y2 = p2?.gY ? p2.gY() + (p2.height ? p2.height() / 2 : 0) : undefined;

        const defProps = this.defaultProperties();
        const animate = property1.animatedLink();

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
          strokeWidth: property1?.bondstrokewidth() || linkProperties?.strokeWidth || defProps.strokeWidth || 2,
          stroke: property1?.bondcolor() || linkProperties?.stroke || defProps.stroke || '',
          properties: {
            animate,
            strokeWidth: property1?.bondstrokewidth() || linkProperties?.strokeWidth || defProps.strokeWidth || 2,
            stroke: property1?.bondcolor() || linkProperties?.stroke || defProps.stroke || '',
            strokeDasharray: linkProperties?.strokeDasharray || defProps.strokeDasharray || '10',
          },
          path: pathFunction(x1 ?? 0, y1 ?? 0, x2 ?? 0, y2 ?? 0, p1Position, p2Position, defProps?.curveRadius || 10, property1, p2),
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
          if (el.container) {
            const dist = getDistance({ x, y }, { x: el.container.gX(), y: el.container.gY() });
            if (dist < smalledDist) {
              smalledDist = dist;
              smallestEl = el;
            }
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
    const p1 = this.dragElements().find((d) => d.id() === link().inputId);
    const p2 = this.dragElements().find((d) => d.id() === link().outputId);

    const property1 = p1?.injector.get(NgBondProperty);
    const property2 = p2?.injector.get(NgBondProperty); 
    if (!property1 || !property2) {
      console.warn(`No properties found for link: ${link()}`);
      return;
    }

    property1.hasLink.set(false);
    property1.isStartOfLink.set(false);
    property2.hasLink.set(false);
    property2.isEndOfLink.set(false);

    this.links.update((x) => x.filter((l) => l !== link));
  }

  getComponent(targetElement: any) {
    const c = this.dragElements().find((e) => e.el.nativeElement === targetElement);
    return c;
  }

  getComponentById(id: string) {
    return this.dragElements().find((e) => e.id() === id);
  }
}
