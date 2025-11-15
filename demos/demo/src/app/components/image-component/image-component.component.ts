import { Component } from '@angular/core';
import { FMContainer } from '@richapps/flow-motion';

@Component({
  selector: 'app-image-component',
  imports: [],
  templateUrl: './image-component.component.html',
  styleUrl: './image-component.component.scss',
  hostDirectives: [
    {
      directive: FMContainer,
    },
  ],
})
export class ImageComponentComponent {
}
