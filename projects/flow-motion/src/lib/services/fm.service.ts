import { computed, Signal, signal, WritableSignal } from '@angular/core';
import { LinkPosition } from '../components/fm-property/fm-property';
import { getSimpleBezierPath } from '../components/util/connections/simple-bezier';
import { getLinePath } from '../components/util/connections/simple.line';
import { getOrhogonalConnection } from '../components/util/connections/orthogonal';
import { getMultiLinePath } from '../components/util/connections/multi-step';
import { getDistance } from '../components/util/geo';
import { InspectableProperty } from '../types/types';
import { FMContainer, FMProperty, FMWorld } from '../../public-api';

export type Bound = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export const inspectableLinkProperties: InspectableProperty[] = [
  {
    category: 'Stroke',
    name: 'stroke',
    type: 'color',
  },
  {
    category: 'Text',
    name: 'textOnPath',
    type: 'text',
    label: 'Text',
  },
  {
    category: 'Text',
    name: 'alignTextToPath',
    type: 'checkbox',
    label: 'Align to Path',
  },
  {
    category: 'Text',
    name: 'color',
    type: 'color',
    label: 'Color',
  },
  {
    category: 'Text',
    name: 'fontSize',
    type: 'number',
    label: 'Font Size',
  },
  {
    category: 'Stroke',
    name: 'strokeWidth',
    type: 'number',
    label: 'Width',
  },
  {
    category: 'Stroke',
    name: 'strokeDasharray',
    type: 'string',
    label: 'Dash Array',
  },
  {
    category: 'Curve',
    name: 'curveRadius',
    type: 'number',
    label: 'Radius',
  },
  {
    category: 'Animation',
    name: 'animationBubbleCount',
    type: 'number',
    label: 'Count',
  },
  {
    category: 'Animation',
    name: 'animationBubbleDuration',
    type: 'number',
    label: 'Duration',
  },
  {
    category: 'Animation',
    name: 'animationBubbleRadius',
    type: 'number',
    label: 'Radius',
  },
  {
    category: 'Animation',
    name: 'animationBubbleColor',
    type: 'color',
    label: 'Color',
  },
  {
    category: 'Animation',
    name: 'animate',
    type: 'checkbox',
    label: 'Animate',
  },
  {
    category: 'Curve',
    name: 'curveType',
    label: 'Curve Type',
    type: 'select',
    options: ['bezier', 'straight', 'multi-line', 'orthogonal'],
  },
  {
    category: 'Markers',
    name: 'startMarker',
    label: 'Start Marker',
    type: 'select',
    options: ['none', 'arrow1', 'arrow2', 'circle', 'square', 'diamond'],
  },
  {
    category: 'Markers',
    name: 'startMarkerOrient',
    label: 'Start Marker Orient',
    type: 'select',
    options: ['auto', 'auto-start-reverse'],
  },
  {
    category: 'Markers',
    name: 'endMarker',
    type: 'select',
    label: 'End Marker',
    options: ['none', 'arrow1', 'arrow2', 'circle', 'square', 'diamond'],
  },
  {
    category: 'Markers',
    name: 'endMarkerOrient',
    type: 'select',
    label: 'End Marker Orient',
    options: ['auto', 'auto-start-reverse'],
  },
  {
    category: 'Stroke',
    name: 'strokeDashoffset',
    label: 'Dash Offset',
    type: 'number',
  },
  {
    category: 'Stroke',
    name: 'pathprogress',
    label: 'Path Progress',
    type: 'range',
    min: 0,
    max: 100,
    step: 1,
  },
];

export interface Link extends LinkProperties {
  x1: Signal<number | undefined>;
  y1: Signal<number | undefined>;
  x2: Signal<number | undefined>;
  y2: Signal<number | undefined>;
  inputId: string;
  outputId: string;
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
  animationBubbleColor: WritableSignal<string>;
  startMarker: WritableSignal<string>;
  startMarkerOrient: WritableSignal<string>;
  endMarker: WritableSignal<string>;
  endMarkerOrient: WritableSignal<string>;
  textOnPath: WritableSignal<string>;
  alignTextToPath: WritableSignal<boolean>;
  color: WritableSignal<string>;
  fontSize: WritableSignal<number>;
  midPoint: WritableSignal<{ x: number; y: number }>;
  totalLength: WritableSignal<number>;
  pathprogress: WritableSignal<number>;
  strokeDashoffset: WritableSignal<number>;
}

const defaultLinkProperties: any = {
  strokeWidth: 2,
  stroke: 'cornflowerblue',
  strokeDasharray: '10',
  curveType: 'bezier',
  curveRadius: 10,
  textOnPath: '',
};

export class FMService {
  dragElements = signal<FMContainer[]>([]);

  links = signal<Link[]>([]);
  scale = signal<number>(1);
  snap = signal<boolean>(true);
  snapDistance = signal<number>(60);

  world?: FMWorld;

  defaultProperties = signal<any>(defaultLinkProperties);

  registerDraggableElement(el: FMContainer) {
    this.dragElements.update((els) => [...els, el]);
  }

  removeDraggableElement(el: FMContainer | FMProperty) {
    this.dragElements.update((x) => x.filter((e) => e !== el));
  }

  getBrondPropertyById(id: string) {
    const p1 = this.dragElements().find((d) => d.id() === id);
    return p1;
  }

  createLink(id1: string, id2: string | DragPoint, linkProperties?: any, add = true) {
    const p1 = this.getBrondPropertyById(id1);
    const property1 = p1?.injector.get(FMProperty);

    if (!property1) {
      console.warn(`No property found for id: ${id1}`);
      return null;
    }

    const p1Position = property1.position();
    let p2Position: LinkPosition = 'left';

    let p2: FMProperty | DragPoint = id2 as DragPoint;
    if (typeof id2 === 'string') {
      const p2Property = this.getBrondPropertyById(id2);
      const property2 = p2Property?.injector.get(FMProperty);
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
      const animate = property1?.animatedLink() || linkProperties?.animate || defProps.animate || false;

      const stroke = property1?.bondcolor() || linkProperties?.stroke || defProps.stroke || '';
      const strokeWidth = property1?.bondstrokewidth() || linkProperties?.strokeWidth || defProps.strokeWidth || 2;
      const curveType = linkProperties?.curveType || defProps.curveType || 'bezier';
      const curveRadius = linkProperties?.curveRadius || defProps.curveRadius || 10;
      const startMarker = linkProperties?.startMarker || 'none';
      const startMarkerOrient = linkProperties?.startMarkerOrient || 'auto';
      const endMarker = linkProperties?.endMarker || 'arrow2';
      const endMarkerOrient = linkProperties?.endMarkerOrient || 'auto';

      const link: Link = {
        x1: computed(() => {
          const x = p1?.gX ? p1.gX() + (p1.width ? p1.width() / 2 : 0) : 0;
          return x;
        }),
        y1: computed(() => {
          const y = p1?.gY ? p1.gY() + (p1.height ? p1.height() / 2 : 0) : 0;
          return y;
        }),
        x2: computed(() => {
          const x = p2?.gX ? p2.gX() + (p2.width ? p2.width() / 2 : 0) : 0;
          return x;
        }),
        y2: computed(() => {
          const y = p2?.gY ? p2.gY() + (p2.height ? p2.height() / 2 : 0) : 0;
          return y;
        }),
        inputId: id1,
        outputId: typeof id2 === 'string' ? id2 : 'current_drag_preview',
        inspectableProperties: inspectableLinkProperties,
        animate: signal(animate),
        strokeWidth: signal(strokeWidth),
        stroke: signal(stroke),
        curveType: signal(curveType),
        strokeDasharray: signal(linkProperties?.strokeDasharray || defProps.strokeDasharray || '10'),
        curveRadius: signal(curveRadius),
        animationBubbleCount: signal<number>(10),
        animationBubbleDuration: signal<number>(4),
        animationBubbleRadius: signal<number>(3),
        animationBubbleColor: signal<string>('#333'),
        textOnPath: signal<string>(''),
        alignTextToPath: signal<boolean>(linkProperties?.strokeDasharray || false),
        color: signal<string>(linkProperties?.color || '#000000'),
        fontSize: signal<number>(linkProperties?.fontSize || 14),
        midPoint: signal<{ x: number; y: number }>({ x: 0, y: 0 }),
        totalLength: signal<number>(0),
        startMarker: signal(startMarker as string),
        endMarker: signal(endMarker as string),
        startMarkerOrient: signal(startMarkerOrient as string),
        endMarkerOrient: signal(endMarkerOrient as string),
        pathprogress: signal(linkProperties?.pathprogress || 100),
        strokeDashoffset: signal(0),
        path: computed(() => {
          const scale = this.scale();
          let cType = link.curveType();
          const curveRadius = link.curveRadius();
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

          let x1 = p1?.gX ? p1.gX() + (p1.width ? p1.width() / 2 : 0) : 0;
          let y1 = p1?.gY ? p1.gY() + (p1.height ? p1.height() / 2 : 0) : 0;
          let x2 = p2?.gX ? p2.gX() + (p2.width ? p2.width() / 2 : 0) : 0;
          let y2 = p2?.gY ? p2.gY() + (p2.height ? p2.height() / 2 : 0) : 0;

          const p = pathFunction(x1 ?? 0, y1 ?? 0, x2 ?? 0, y2 ?? 0, p1Position, p2Position, curveRadius, property1, p2);
          return p;
        }),
      };

      if (add) {
        this.links.update((x) => [...x, link]);
      }
      return link;
    }
    return null;
  }

  snapLink = signal<Link | null>(null);
  currentSnapTarget?: FMProperty;
  currentDragSource?: FMProperty;

  removePreview(link: any) {
    this.links.update((x) => x.filter((l) => l !== link));
    this.snapLink.set(null);
  }

  startDragPreview(p: FMProperty) {
    this.currentDragSource = p;
  }

  updateDragPreview(x: number, y: number) {
    if (this.snap()) {
      let smalledDist = Number.POSITIVE_INFINITY;
      let smallestEl;
      for (const el of this.dragElements()) {
        if (el.type === 'link-target') {
          const dist = getDistance({ x, y }, { x: el.gX(), y: el.gY() });
          if (dist < smalledDist) {
            smalledDist = dist;
            smallestEl = el;
          }
        }
      }
      if (this.currentDragSource && smalledDist < this.snapDistance() && smallestEl) {
        this.currentSnapTarget = smallestEl.injector.get(FMProperty);
        const l = this.createLink(
          this.currentDragSource.id(),
          smallestEl.id(),
          {
            stroke: '#333',
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
    const p1 = this.dragElements().find((d) => d.id() === link.inputId);
    const p2 = this.dragElements().find((d) => d.id() === link.outputId);

    const property1 = p1?.injector.get(FMProperty);
    const property2 = p2?.injector.get(FMProperty);
    if (!property1 || !property2) {
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
