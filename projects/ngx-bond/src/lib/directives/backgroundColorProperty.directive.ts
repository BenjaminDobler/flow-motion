import { afterNextRender, computed, ContentChild, ContentChildren, Directive, effect, ElementRef, inject, Input, isSignal, model, output, signal, ViewChild, viewChild, ViewChildren } from '@angular/core';
import { InspectableProperty } from '@richapps/ngx-bond';

@Directive({
  selector: '[backgroundColorProperty]',
  exportAs: 'backgroundColorProperty',
  host: {

  },
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
    }
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

    afterNextRender(()=>{
      content = this.el.nativeElement.querySelector('.content-container');
      inited.set(true);
    })

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
