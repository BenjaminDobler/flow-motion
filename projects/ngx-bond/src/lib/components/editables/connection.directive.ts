import { Directive, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { Link, NgBondContainer } from '@richapps/ngx-bond';
import { svgPathBbox } from 'svg-path-bbox';

@Directive({
  selector: '[connection]',
  hostDirectives: [
    {
      directive: NgBondContainer,
      inputs: ['bondcontainer'],
    },
  ],
})
export class ConnectionDirective {
  public type = 'connection-directive';

  static inspectableProperties = [
    {
      name: 'stroke',
      type: 'color',
      setterName: 'stroke',
      isSignal: true,
      event: 'strokeChanged',
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

  get inspectableProperties() {
    return ConnectionDirective.inspectableProperties;
  }

  link = model.required<Link>();

  container = inject(NgBondContainer, { optional: true });

  stroke = model<string | undefined>(undefined);
  strokeChanged = output<string | undefined>();

  strokeWidth = model<number | undefined>(undefined);
  strokeWidthChanged = output<number | undefined>();

  strokeDasharray = model<string | undefined>(undefined);
  strokeDasharrayChanged = output<string | undefined>();

  animate = model<boolean>(false);
  animateChanged = output<boolean>();

  curveType = model<'bezier' | 'straight' | 'multi-line' | 'orthogonal' | undefined>(undefined);
  curveTypeChanged = output<'bezier' | 'straight' | 'multi-line' | 'orthogonal' | undefined>();

  curveRadius = model<number | undefined>(10);
  curveRadiusChanged = output<number | undefined>();

  animationBubbleCount = model<number>(10);
  animationBubbleCountChanged = output<number>();

  animationBubbleDuration = model<number>(4);
  animationBubbleDurationChanged = output<number>();

  animationBubbleRadius = model<number>(3);
  animationBubbleRadiusChanged = output<number>();

  constructor() {
    this.container?.ignoreSelectionManagement.set(true);
    if (this.container) {
      this.container.type = this.type;
    }

    effect(() => {
      const link = this.link();
      this.curveType.set(link.properties.curveType());
      this.curveRadius.set(link.properties.curveRadius());
      this.stroke.set(link.properties.stroke());
      this.strokeWidth.set(link.properties.strokeWidth());
      console.log('stroke width', this.strokeWidth());
      const animate = link.properties.animate();
      if(animate === undefined || animate === null) {
        this.animate.set(false);
      }
    });

    effect(() => {
      const link = this.link();
      console.log('ConnectionDirective link changed', link);

      const bbox = svgPathBbox(link.path());
      const rect = { x: bbox[0], y: bbox[1], width: bbox[2] - bbox[0], height: bbox[3] - bbox[1] };

      this.container?.setWidth(rect.width);
      this.container?.setHeight(rect.height);
      this.container?.x.set(rect.x);
      this.container?.y.set(rect.y);
    });

    effect(() => {
      const strokeWidth = this.strokeWidth();
      if (!strokeWidth) {
        return;
      }

      untracked(() => {
        const l = this.link();

        l.properties.strokeWidth.set(strokeWidth);
      });

      this.strokeWidthChanged.emit(strokeWidth);
    });

    effect(() => {
      const stroke = this.stroke();
      if (!stroke) {
        return;
      }

      untracked(() => {
        const l = this.link();

        l.properties.stroke.set(stroke);
      });

      this.strokeChanged.emit(stroke);
    });

    effect(() => {
      const animate = this.animate();

      untracked(() => {
        const l = this.link();

        console.log('set animate', animate);
        l.properties.animate.set(animate);
      });

      this.animateChanged.emit(animate);
    });

    effect(() => {
      const curveType = this.curveType();

      untracked(() => {
        const l = this.link();
        console.log('update curve type', curveType);

        l.properties.curveType.set(curveType);
      });

      this.curveTypeChanged.emit(curveType);
    });

    effect(() => {
      const curveRadius = this.curveRadius();

      untracked(() => {
        const l = this.link();
        console.log('update curve radius', curveRadius);

        l.properties.curveRadius.set(curveRadius);
      });

      this.curveRadiusChanged.emit(curveRadius);
    });

    effect(() => {
      const animationBubbleCount = this.animationBubbleCount();

      untracked(() => {
        const l = this.link();
        console.log('update animation bubble count', animationBubbleCount);

        l.properties.animationBubbleCount.set(animationBubbleCount);
      });

      this.animationBubbleCountChanged.emit(animationBubbleCount);
    });

    effect(() => {
      const animationBubbleDuration = this.animationBubbleDuration();

      untracked(() => {
        const l = this.link();
        console.log('update animation bubble duration', animationBubbleDuration);

        l.properties.animationBubbleDuration.set(animationBubbleDuration);
      });

      this.animationBubbleDurationChanged.emit(animationBubbleDuration);
    });

    effect(() => {
      const animationBubbleRadius = this.animationBubbleRadius();

      untracked(() => {
        const l = this.link();
        console.log('update animation bubble radius', animationBubbleRadius);

        l.properties.animationBubbleRadius.set(animationBubbleRadius);
      });

      this.animationBubbleRadiusChanged.emit(animationBubbleRadius);
    });

    effect(()=>{
      const strokeDasharray = this.strokeDasharray();
      if(!strokeDasharray) {
        return;
      }

      untracked(()=>{
        const l = this.link();
        l.properties.strokeDasharray.set(strokeDasharray);
      })

      this.strokeDasharrayChanged.emit(strokeDasharray);
    })
  }
}
