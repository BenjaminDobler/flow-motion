import { Component, inject, model } from '@angular/core';
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
    },
  ];
  src = model<string>('');

  type = 'image';

  rand = Math.floor(Math.random() * 1000);

  container = inject(NgBondContainer);

  get inspectableProperties() {
    return ImageComponent.inspectableProperties;
  }

  constructor() {
    if (this.container.displayName() === '') {
      this.container.displayName.set('Image ');
    }
  }
}
