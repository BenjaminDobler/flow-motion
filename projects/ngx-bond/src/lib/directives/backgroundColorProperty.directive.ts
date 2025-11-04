import {
  afterNextRender,
  computed,
  ContentChild,
  ContentChildren,
  Directive,
  effect,
  ElementRef,
  inject,
  Input,
  isSignal,
  model,
  output,
  signal,
  ViewChild,
  viewChild,
  ViewChildren,
} from '@angular/core';
import { InspectableProperty } from '../types/types';

@Directive({
  selector: '[backgroundColorProperty]',
  exportAs: 'backgroundColorProperty',
  host: {},
})
export class BackgroundColorPropertyDirective {
  static inspectableProperties: InspectableProperty[] = [
    {
      name: 'backgroundColor',
      type: 'color',
    },
    {
      name: 'borderRadius',
      type: 'number',
      prefixIcon: 'iconRadius',
    },
    {
      name: 'opacity',
      suffix: '%',
      type: 'number',
    },
    {
      name: 'overflow',
      type: 'select',
      category: 'Layout',
      options: ['visible', 'hidden', 'scroll', 'auto'],
    },
    {
      name: 'shadowEnabled',
      type: 'checkbox',
      category: 'Shadow',
    },
    {
      name: 'shadowHorizontalOffset',
      type: 'number',
      prefix: 'X',
      group: {
        name: 'shadowPosition',
      },
      category: 'Shadow',
    },
    {
      name: 'shadowVerticalOffset',
      type: 'number',
      prefix: 'Y',
      group: {
        name: 'shadowPosition',
      },
      category: 'Shadow',
    },
    {
      name: 'shadowBlurRadius',
      type: 'number',
      group: {
        name: 'shadowProps',
      },
      category: 'Shadow',
    },
    {
      name: 'shadowSpread',
      type: 'number',
      group: {
        name: 'shadowProps',
      },
      category: 'Shadow',
    },
    {
      name: 'shadowColor',
      type: 'color',
      category: 'Shadow',
    },
    {
      name: 'shadowColorAlpha',
      type: 'range',
      min: 0,
      max: 255,
      step: 0.1,
      category: 'Shadow',
    },
    {
      name: 'borderEnabled',
      type: 'checkbox',
      category: 'Border',
    },
    {
      name: 'borderWidth',
      type: 'number',
      category: 'Border',
    },
    {
      name: 'borderColor',
      type: 'color',
      category: 'Border',
    },
    {
      name: 'mixBlendMode',
      type: 'select',
      options: [
        'normal',
        'multiply',
        'screen',
        'overlay',
        'darken',
        'lighten',
        'color-dodge',
        'color-burn',
        'hard-light',
        'soft-light',
        'difference',
        'exclusion',
        'hue',
        'saturation',
        'color',
        'luminosity',
      ],
    },
    {
      name: 'blur',
      label: 'Blur',
      type: 'number',
      suffix: 'px',
      category: 'Filter',
    },
    {
      name: 'brightness',
      label: 'Brightness',
      type: 'number',

      suffix: '%',
      category: 'Filter',
    },
    {
      name: 'contrast',
      label: 'Contrast',
      type: 'range',
      min: 0,
      max: 100,
      step: 1,
      suffix: '%',
      category: 'Filter',
    },
    {
      name: 'grayscale',
      label: 'Grayscale',
      type: 'number',
      suffix: '%',
      category: 'Filter',
    },
    {
      name: 'hueRotate',
      label: 'Hue Rotate',
      type: 'number',
      suffix: 'deg',
      category: 'Filter',
    },
    {
      name: 'invert',
      label: 'Invert',
      type: 'number',
      suffix: '%',
      category: 'Filter',
    },
    {
      name: 'saturate',
      label: 'Saturate',
      type: 'number',
      suffix: '%',
      category: 'Filter',
    },
  ];

  get inspectableProperties() {
    return BackgroundColorPropertyDirective.inspectableProperties;
  }

  el: ElementRef = inject(ElementRef);

  content: any;

  backgroundColor = model('#333333');

  borderRadius = model(0);
  borderColor = model('#000000');
  borderEnabled = model(false);

  border = computed(() => {
    if (!this.borderEnabled()) {
      return 'none';
    }
    const bw = this.borderWidth();
    if (bw > 0) {
      return `${bw}px solid ${this.borderColor()}`;
    }
    return 'none';
  });

  mixBlendMode = model('normal');

  borderWidth = model(0);

  overflow = model('visible');

  opacity = model(1);

  shadowEnabled = model(false);

  shadowHorizontalOffset = model(0);

  shadowVerticalOffset = model(7);

  shadowBlurRadius = model(29);

  shadowSpread = model(0);

  shadowColor = model('#64646f33');

  shadowColorAlpha = model(51);

  filter = computed(() => {
    const filters = [];
    if (this.blur() > 0) {
      filters.push(`blur(${this.blur()}px)`);
    }
    if (this.brightness() !== 100) {
      filters.push(`brightness(${this.brightness()}%)`);
    }
    if (this.contrast() !== 100) {
      filters.push(`contrast(${this.contrast()}%)`);
    }
    if (this.grayscale() > 0) {
      filters.push(`grayscale(${this.grayscale()}%)`);
    }
    if (this.hueRotate() > 0) {
      filters.push(`hue-rotate(${this.hueRotate()}deg)`);
    }
    if (this.invert() > 0) {
      filters.push(`invert(${this.invert()}%)`);
    }
    if (this.saturate() !== 100) {
      filters.push(`saturate(${this.saturate()}%)`);
    }
    return filters.join(' ');
  });

  blur = model(0);
  brightness = model(100);
  contrast = model(100);
  grayscale = model(0);
  hueRotate = model(0);
  invert = model(0);
  saturate = model(100);

  shadowCss = computed(() => {
    if (!this.shadowEnabled()) {
      return 'none';
    }

    const a = this.shadowColorAlpha();
    const as = a + '';
    const alpha = a == 255 ? '' : parseInt(as).toString(16).padStart(2, '0');
    return `${this.shadowHorizontalOffset()}px ${this.shadowVerticalOffset()}px ${this.shadowBlurRadius()}px ${this.shadowSpread()}px ${this.shadowColor()}${alpha}`;
  });

  constructor() {
    let content = this.el.nativeElement.querySelector('.content-container');
    let inited = signal(false);

    afterNextRender(() => {
      content = this.el.nativeElement.querySelector('.content-container');
      inited.set(true);
    });

    effect(() => {
      if (!inited()) return;

      const filter = this.filter();
      if (content) {
        content.style.filter = filter;
      } else {
        this.el.nativeElement.style.filter = filter;
      }
    });

    effect(() => {
      if (!inited()) return;

      const backgroundColor = this.backgroundColor();
      if (content) {
        content.style.backgroundColor = backgroundColor;
      } else {
        this.el.nativeElement.style.backgroundColor = backgroundColor;
      }
    });

    effect(() => {
      if (!inited()) return;

      const mixBlendMode = this.mixBlendMode();

      this.el.nativeElement.style.mixBlendMode = mixBlendMode;
    });

    effect(() => {
      if (!inited()) return;

      const opacity = this.opacity();
      if (content) {
        content.style.opacity = opacity;
      } else {
        this.el.nativeElement.style.opacity = opacity;
      }
    });

    effect(() => {
      if (!inited()) return;

      const borderRadius = this.borderRadius();
      if (content) {
        content.style.borderRadius = borderRadius + 'px';
      } else {
        this.el.nativeElement.style.borderRadius = borderRadius + 'px';
      }
    });

    effect(() => {
      if (!inited()) return;

      const overflow = this.overflow();
      if (content) {
        content.style.overflow = overflow;
      } else {
        this.el.nativeElement.style.overflow = overflow;
      }
    });

    effect(() => {
      if (!inited()) return;

      const border = this.border();
      if (content) {
        content.style.border = border;
      } else {
        this.el.nativeElement.style.border = border;
      }
    });

    effect(() => {
      if (!inited()) return;

      const boxShadow = this.shadowCss();
      if (content) {
        content.style.boxShadow = boxShadow;
      } else {
        this.el.nativeElement.style.boxShadow = boxShadow;
      }
    });
  }
}
