import { ChangeDetectionStrategy, Component, inject, model } from '@angular/core';
import { NgBondProperty } from '../../ng-bond-property/ng-bond-property';
import { NgBondContainer } from '../../ng-bond-container/ng-bond-container';

@Component({
  selector: 'editable-image',
  imports: [NgBondProperty],
  templateUrl: './image.component.html',
  styleUrl: './image.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
