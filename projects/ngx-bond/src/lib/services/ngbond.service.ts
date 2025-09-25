import { computed, Signal, signal, WritableSignal } from '@angular/core';
import { NgBondContainer } from '../components/ng-bond-container/ng-bond-container';
import { LinkPosition, NgBondProperty } from '../components/ng-bond-property/ng-bond-property';
import { getSimpleBezierPath } from '../components/util/connections/simple-bezier';
import { getLinePath } from '../components/util/connections/simple.line';
import { getOrhogonalConnection } from '../components/util/connections/orthogonal';
import { getMultiLinePath } from '../components/util/connections/multi-step';
import { getDistance } from '../components/util/geo';
import { NgBondWorld } from '@richapps/ngx-bond';

// export type  LinkContent = {
//   x1: number | undefined;
//   y1: number | undefined;
//   x2: number | undefined;
//   y2: number | undefined;
//   properties: LinkProperties;
//   path: string;
//   inputId: string;
//   outputId: string;
// };

// export type Link = Signal<LinkContent>;

export type Bound = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const inspectableLinkProperties = [
  {
    name: 'stroke',
    type: 'color',
    setterName: 'stroke',
    isSignal: true,
    event: 'strokeChanged',
    serializable: true,
  },
  {
    name: 'textOnPath',
    type: 'text',
    setterName: 'textOnPath',
    isSignal: true,
    event: 'textOnPathChanged',
    serializable: true,
  },
  {
    name: 'strokeWidth',
    type: 'number',
    setterName: 'strokeWidth',
    isSignal: true,
    event: 'strokeWidthChanged',
    serializable: true,
  },
  {
    name: 'strokeDasharray',
    type: 'string',
    setterName: 'strokeDasharray',
    isSignal: true,
    event: 'strokeDasharrayChanged',
    serializable: true,
  },
  {
    name: 'curveRadius',
    type: 'number',
    setterName: 'curveRadius',
    isSignal: true,
    event: 'curveRadiusChanged',
    serializable: true,
  },
  {
    name: 'animationBubbleCount',
    type: 'number',
    setterName: 'animationBubbleCount',
    isSignal: true,
    event: 'animationBubbleCountChanged',
    serializable: true,
  },
  {
    name: 'animationBubbleDuration',
    type: 'number',
    setterName: 'animationBubbleDuration',
    isSignal: true,
    event: 'animationBubbleDurationChanged',
    serializable: true,
  },
  {
    name: 'animationBubbleRadius',
    type: 'number',
    setterName: 'animationBubbleRadius',
    isSignal: true,
    event: 'animationBubbleRadiusChanged',
    serializable: true,
  },
  {
    name: 'animate',
    type: 'checkbox',
    setterName: 'animate',
    isSignal: true,
    event: 'animateChanged',
    serializable: true,
  },
  {
    name: 'curveType',
    type: 'select',
    options: ['bezier', 'straight', 'multi-line', 'orthogonal'],
    setterName: 'curveType',
    isSignal: true,
    event: 'curveTypeChanged',
    serializable: true,
  },
];

export interface Link {
  x1: Signal<number | undefined>;
  y1: Signal<number | undefined>;
  x2: Signal<number | undefined>;
  y2: Signal<number | undefined>;
  inputId: string;
  outputId: string;
  properties: LinkProperties;
  path: Signal<string>;
  inspectableProperties: any;
}

export interface DragPoint {
  gX: Signal<number>;
  gY: Signal<number>;
  width: Signal<number>;
  height: Signal<number>;
}

export interface LinkProperties {
  strokeWidth: WritableSignal<number | undefined>;
  stroke: WritableSignal<string | undefined>;
  strokeDasharray: WritableSignal<string | undefined>;
  curveType: WritableSignal<'bezier' | 'straight' | 'multi-line' | 'orthogonal' | undefined>;
  curveRadius: WritableSignal<number | undefined>;
  animate: WritableSignal<boolean | undefined>;
  animationBubbleCount: WritableSignal<number>;
  animationBubbleDuration: WritableSignal<number>;
  animationBubbleRadius: WritableSignal<number>;
  textOnPath: WritableSignal<string>;
  midPoint: WritableSignal<{ x: number; y: number }>;
  totalLength: WritableSignal<number>;
}

const defaultLinkProperties: any = {
  strokeWidth: 2,
  stroke: 'cornflowerblue',
  strokeDasharray: '10',
  curveType: 'bezier',
  curveRadius: 10,
  textOnPath: '',
};

export class NgBondService {
  dragElements = signal<NgBondContainer[]>([]);

  links = signal<Link[]>([]);
  scale = signal<number>(1);
  snap = signal<boolean>(true);
  snapDistance = signal<number>(60);

  world?: NgBondWorld;

  defaultProperties = signal<any>(defaultLinkProperties);

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
    const p1 = this.getBrondPropertyById(id1);
    const property1 = p1?.injector.get(NgBondProperty);

    if (!property1) {
      console.warn(`No property found for id: ${id1}`);
      return null;
    }

    const p1Position = property1.position();
    let p2Position: LinkPosition = 'left';

    let p2: NgBondProperty | DragPoint = id2 as DragPoint;
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

      const defProps = this.defaultProperties();
      const animate = property1.animatedLink;

      const stroke = property1?.bondcolor() || linkProperties?.stroke || defProps.stroke || '';
      const strokeWidth = property1?.bondstrokewidth() || linkProperties?.strokeWidth || defProps.strokeWidth || 2;
      const curveType = linkProperties?.curveType || defProps.curveType || 'bezier';
      const curveRadius = linkProperties?.curveRadius || defProps.curveRadius || 10;

      const link: Link = {
        x1: computed(() => (p1?.gX ? p1.gX() + (p1.width ? p1.width() / 2 : 0) : undefined)),
        y1: computed(() => (p1?.gY ? p1.gY() + (p1.height ? p1.height() / 2 : 0) : undefined)),
        x2: computed(() => (p2?.gX ? p2.gX() + (p2.width ? p2.width() / 2 : 0) : undefined)),
        y2: computed(() => (p2?.gY ? p2.gY() + (p2.height ? p2.height() / 2 : 0) : undefined)),
        inputId: id1,
        outputId: typeof id2 === 'string' ? id2 : 'current_drag_preview',
        inspectableProperties: inspectableLinkProperties,
        properties: {
          animate: animate,
          strokeWidth: signal(strokeWidth),
          stroke: signal(stroke),
          curveType: signal(curveType),
          strokeDasharray: signal(linkProperties?.strokeDasharray || defProps.strokeDasharray || '10'),
          curveRadius: signal(curveRadius),
          animationBubbleCount: signal<number>(10),
          animationBubbleDuration: signal<number>(4),
          animationBubbleRadius: signal<number>(3),
          textOnPath: signal<string>(''),
          midPoint: signal<{ x: number; y: number }>({ x: 0, y: 0 }),
          totalLength: signal<number>(0),
        },
        path: computed(() => {
          const cType = link.properties.curveType();
          const curveRadius = link.properties.curveRadius();
          let pathFunction;
          if (cType === 'bezier') {
            pathFunction = getSimpleBezierPath;
          } else if (cType === 'straight') {
            pathFunction = getLinePath;
          } else if (cType === 'orthogonal') {
            pathFunction = getOrhogonalConnection;
          } else {
            pathFunction = getMultiLinePath;
          }
          const x1 = p1?.gX ? p1.gX() + (p1.width ? p1.width() / 2 : 0) : 0;
          const y1 = p1?.gY ? p1.gY() + (p1.height ? p1.height() / 2 : 0) : 0;
          const x2 = p2?.gX ? p2.gX() + (p2.width ? p2.width() / 2 : 0) : 0;
          const y2 = p2?.gY ? p2.gY() + (p2.height ? p2.height() / 2 : 0) : 0;
          const p = pathFunction(x1 ?? 0, y1 ?? 0, x2 ?? 0, y2 ?? 0, p1Position, p2Position, curveRadius, property1, p2);
          return p;
        }),
      };

      //return link;

      // return {
      //   x1,
      //   y1,
      //   x2,
      //   y2,
      //   inputId: id1,
      //   outputId: typeof id2 === 'string' ? id2 : 'current_drag_preview',
      //   strokeWidth: property1?.bondstrokewidth() || linkProperties?.strokeWidth || defProps.strokeWidth || 2,
      //   stroke: property1?.bondcolor() || linkProperties?.stroke || defProps.stroke || '',
      //   properties: {
      //     animate,
      //     strokeWidth: property1?.bondstrokewidth() || linkProperties?.strokeWidth || defProps.strokeWidth || 2,
      //     stroke: property1?.bondcolor() || linkProperties?.stroke || defProps.stroke || '',
      //     strokeDasharray: linkProperties?.strokeDasharray || defProps.strokeDasharray || '10',
      //   },
      //   path: pathFunction(x1 ?? 0, y1 ?? 0, x2 ?? 0, y2 ?? 0, p1Position, p2Position, defProps?.curveRadius || 10, property1, p2),
      // };
      //});

      if (add) {
        this.links.update((x) => [...x, link]);
      }
      return link;
    }
    return null;
  }

  snapLink = signal<Link | null>(null);
  currentSnapTarget?: NgBondProperty;
  currentDragSource?: NgBondProperty;

  removePreview(link: any) {
    this.links.update((x) => x.filter((l) => l !== link));
    this.snapLink.set(null);
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
        const l = this.createLink(
          this.currentDragSource.id(),
          smallestEl.id(),
          {
            stroke: signal('#333'),
            strokeDasharray: signal('5,5'),
            strokeWidth: signal(3),
            curveType: signal('straight'),
            curveRadius: signal(0),
            animate: signal(false),
            animationBubbleCount: signal(0),
            animationBubbleDuration: signal(0),
            animationBubbleRadius: signal(3),
            textOnPath: signal(''),
            midPoint: signal({ x: 0, y: 0 }),
            totalLength: signal(0),
          },
          false
        );
        this.snapLink.set(l);
      } else {
        this.snapLink.set(null);
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
    console.log('removing link', link);
    const p1 = this.dragElements().find((d) => d.id() === link.inputId);
    const p2 = this.dragElements().find((d) => d.id() === link.outputId);

    console.log('p1', p1);
    console.log('p2', p2);

    const property1 = p1?.injector.get(NgBondProperty);
    const property2 = p2?.injector.get(NgBondProperty);
    if (!property1 || !property2) {
      console.warn(`No properties found for link: ${link}`);
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
