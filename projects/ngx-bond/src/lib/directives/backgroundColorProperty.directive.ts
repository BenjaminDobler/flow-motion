import { computed, Directive, effect, ElementRef, inject, Input, model, output, signal } from '@angular/core';

@Directive({
  selector: '[backgroundColorProperty]',
  exportAs: 'backgroundColorProperty',
})
export class BackgroundColorPropertyDirective {
  static inspectableProperties = [
    {
      name: 'backgroundColor',
      type: 'color',
      setterName: 'backgroundColor',
      isSignal: true,
      event: 'backgroundColorChanged',
      serializable: true,
    },
    {
      name: 'borderRadius',
      type: 'number',
      setterName: 'borderRadius',
      isSignal: true,
      event: 'borderRadiusChanged',
      serializable: true,
    },
    {
      name: 'opacity',
      type: 'number',
      setterName: 'opacity',
      isSignal: true,
      event: 'opacityChanged',
      serializable: true,
    },
    {
      name: 'overflow',
      type: 'select',
      setterName: 'overflow',
      isSignal: true,
      event: 'overflowChanged',
      serializable: true,
      options: ['visible', 'hidden', 'scroll', 'auto'],
    },
    {
      name: 'shadowEnabled',
      type: 'checkbox',
      setterName: 'shadowEnabled',
      isSignal: true,
      event: 'shadowEnabledChanged',
      serializable: true,
    },
    {
      name: 'shadowHorizontalOffset',
      type: 'number',
      setterName: 'shadowHorizontalOffset',
      isSignal: true,
      event: 'shadowHorizontalOffsetChanged',
      serializable: true,
    },
    {
      name: 'shadowVerticalOffset',
      type: 'number',
      setterName: 'shadowVerticalOffset',
      isSignal: true,
      event: 'shadowVerticalOffsetChanged',
      serializable: true,
    },
    {
      name: 'shadowBlurRadius',
      type: 'number',
      setterName: 'shadowBlurRadius',
      isSignal: true,
      event: 'shadowBlurRadiusChanged',
      serializable: true,
    },
    {
      name: 'shadowSpread',
      type: 'number',
      setterName: 'shadowSpread',
      isSignal: true,
      event: 'shadowSpreadChanged',
      serializable: true,
    },
    {
      name: 'shadowColor',
      type: 'color',
      setterName: 'shadowColor',
      isSignal: true,
      event: 'shadowColorChanged',
      serializable: true,
    },
  ];

  get inspectableProperties() {
    return BackgroundColorPropertyDirective.inspectableProperties;
  }

  el: ElementRef = inject(ElementRef);

  backgroundColorChanged = output<string>();
  backgroundColor = model('#333333');

  borderRadius = model(0);
  borderRadiusChanged = output<number>();

  overflow = model('visible');
  overflowChanged = output<string>();

  opacity = model(1);
  opacityChanged = output<number>();

  shadowEnabled = model(false);
  shadowEnabledChanged = output<boolean>();

  shadowHorizontalOffset = model(0);
  shadowHorizontalOffsetChanged = output<number>();

  shadowVerticalOffset = model(0);
  shadowVerticalOffsetChanged = output<number>();

  shadowBlurRadius = model(0);
  shadowBlurRadiusChanged = output<number>();

  shadowSpread = model(0);
  shadowSpreadChanged = output<number>();

  shadowColor = model('#000000');
  shadowColorChanged = output<string>();

  shadowCss = computed(() => {
    if (!this.shadowEnabled()) {
      return 'none';
    }
    return `${this.shadowHorizontalOffset()}px ${this.shadowVerticalOffset()}px ${this.shadowBlurRadius()}px ${this.shadowSpread()}px ${this.shadowColor()}`;
  });

  constructor() {
    effect(() => {
      let bg = this.backgroundColor();
      this.backgroundColorChanged.emit(bg);
      this.el.nativeElement.style.backgroundColor = bg;
    });

    effect(() => {
      const op = this.opacity();
      this.opacityChanged.emit(op);
      this.el.nativeElement.style.opacity = op.toString();
    });

    effect(() => {
      const br = this.borderRadius();
      this.borderRadiusChanged.emit(br);
      this.el.nativeElement.style.borderRadius = `${br}px`;
    });

    effect(() => {
      const ov = this.overflow();
      this.overflowChanged.emit(ov);
      this.el.nativeElement.style.overflow = ov;
    });

    effect(() => {
      const se = this.shadowEnabled();
      this.shadowEnabledChanged.emit(se);
    });

    effect(() => {
      const sho = this.shadowHorizontalOffset();
      this.shadowHorizontalOffsetChanged.emit(sho);
    });
    
    effect(() => {
      const svo = this.shadowVerticalOffset();
      this.shadowVerticalOffsetChanged.emit(svo);
    });

    effect(() => {
      const sbr = this.shadowBlurRadius();
      this.shadowBlurRadiusChanged.emit(sbr);
    });

    effect(() => {
      const ss = this.shadowSpread();
      this.shadowSpreadChanged.emit(ss);
    });

    effect(() => {
      const sc = this.shadowColor();
      this.shadowColorChanged.emit(sc);
    });

    effect(() => {
      this.el.nativeElement.style.boxShadow = this.shadowCss();
    });
  }
}
