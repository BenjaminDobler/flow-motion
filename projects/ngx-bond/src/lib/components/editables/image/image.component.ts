import { Component, effect, forwardRef, inject, input, output } from '@angular/core';
import { NgBondContainer, NgBondProperty } from '@richapps/ngx-bond';

@Component({
  selector: 'app-image',
  imports: [NgBondProperty],
  templateUrl: './image.component.html',
  styleUrl: './image.component.scss',
})
export class ImageComponent {
  static inspectableProperties = [
    {
      name: 'src',
      type: 'string',
      setterName: 'src',
      isSignal: true,
      event: 'srcChanged',
      serializable: true,
    },
  ];
  src = input<string>('');
  srcChanged = output<string>();

  type = 'image';

  rand = Math.floor(Math.random() * 1000);

  container = inject(NgBondContainer);

  get inspectableProperties() {
    return ImageComponent.inspectableProperties;
  }

  constructor() {
    effect(() => {
      console.log('Image source changed:', this.src());
      this.srcChanged.emit(this.src());
    });
  }
}
