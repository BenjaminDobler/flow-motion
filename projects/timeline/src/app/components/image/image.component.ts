import { Component, effect, input } from '@angular/core';

@Component({
  selector: 'app-image',
  imports: [],
  templateUrl: './image.component.html',
  styleUrl: './image.component.scss',
})
export class ImageComponent {
  src = input<string>('');


  constructor() {
    effect(() => {
      console.log('Image source changed:', this.src());
    });
  }
}
