import { Component, effect, input, output } from '@angular/core';

@Component({
  selector: 'app-image',
  imports: [],
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
