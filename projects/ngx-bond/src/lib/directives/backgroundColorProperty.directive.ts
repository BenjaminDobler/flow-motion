import { Directive, effect, ElementRef, inject, Input, model, output, signal } from '@angular/core';

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
  }
}
