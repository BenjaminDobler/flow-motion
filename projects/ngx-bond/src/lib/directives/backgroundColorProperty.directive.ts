import { Directive, effect, ElementRef, inject, Input, model, output, signal } from '@angular/core';

export function rgbToHex(rgb: string): string {
  // Set seperator based on the rgb string provided
  // checks for both rgb and rgba string.
  // Example:
  // 1. rgb(255, 255, 255)
  // 2. rgba(255, 255, 255, 1)
  // 3. rgb(255 255 255)
  // 4. rgba(255 255 255 / 1)
  // 5. rgb(100%, 100%, 100%)
  // 6. rgba(100%, 100%, 100%, 100%)
  // 7. rgb(100% 100% 100%)
  // 8. rgba(100% 100% 100% / 100%)
  const seperator = rgb.indexOf(',') > -1 ? ',' : ' ';

  // Array containing hex values converted from the rgbArray
  const hexArray: string[] = [];

  // Check if it is rgba
  const isRgba = rgb.indexOf('rgba') > -1;

  // Remove slash from string if present
  // make sure to replace the space before it as well or we will have an
  // empty string inside the rgbArray
  rgb = rgb.replace(' /', '');

  // Convert the color string to an array
  const rgbArray = rgb
    .substring(isRgba ? 5 : 4)
    .split(')')[0]
    .split(seperator);

  // Convert rgb values from rgbArray to hex values and add it to the hexArray
  rgbArray.forEach((colorValue, index) => {
    let trimmedColorValue = colorValue.trim();
    let hexValue = trimmedColorValue;

    // Convert the percentage value to proper rgb value
    // so 100% becomes 255 => (100 / 100) * 255
    if (trimmedColorValue.indexOf('%') > -1) {
      hexValue = String(Math.round((+trimmedColorValue.substring(0, trimmedColorValue.length - 1) / 100) * 255));
    }

    // If the index is 3, this is the alpha value,
    // check if it is less than or equal to 1 becuase,
    // if percentage format is used then rather than being 0.9 it will be 90% and
    // we don't want to do any rounding as it is already rounded.
    // Then multiply it with 255 and then round the value
    // So, alpha value of 0.4 becomes -> 102
    if (index == 3 && +hexValue <= 1) {
      hexValue = String(Math.round(+hexValue * 255));
    }

    // Conver hexValue to a number and then to a hex string
    hexValue = (+hexValue).toString(16);

    // If only one hex value is present, then add a leading 0
    if (hexValue.length == 1) hexValue = '0' + hexValue;

    // Push the hex values to the hexArray
    hexArray.push(hexValue);
  });

  // Return the Hex string
  return '#' + hexArray.join('');
}

@Directive({
  selector: '[backgroundColorProperty]',
  exportAs: 'backgroundColorProperty',
})
export class BackgroundColorPropertyDirective {
  static inspectableProperties = [
    {
      name: 'bgColor',
      type: 'color',
      setterName: 'bgColor',
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

  // backgroundColor = model('#00ff00');
  backgroundColorChanged = output<string>();

  // private _backgroundColor = '#00ff00';

  // get backgroundColor() {
  //   return this._backgroundColor;
  // }

  // @Input()
  // set backgroundColor(value: string) {
  //   if (value !== this._backgroundColor) {
  //     this._backgroundColor = value;
  //     this.bgColor.set(value);
  //   }
  // }

  bgColor = model('#00ff00');

  borderRadius = model(20);
  borderRadiusChanged = output<number>();

  overflow = model('visible');
  overflowChanged = output<string>();

  constructor() {
    effect(() => {
      let bg = this.bgColor();

      this.backgroundColorChanged.emit(bg);
      this.el.nativeElement.style.backgroundColor = bg;

      // if (bg.startsWith('rgb')) {
      //   this.el.nativeElement.style.backgroundColor = rgbToHex(bg);
      // } else {
      //   this.el.nativeElement.style.backgroundColor = bg;
      // }
      this.el.nativeElement.style.backgroundColor = bg;
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
