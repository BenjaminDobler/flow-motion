import { Component, inject } from '@angular/core';
import { NgBondContainer } from '../../lib/ngbond/components/ng-bond-container/ng-bond-container';
import { SelectionManager } from '../../lib/ngbond/services/selection.manager';

@Component({
  selector: 'app-image-component',
  imports: [],
  templateUrl: './image-component.component.html',
  styleUrl: './image-component.component.scss',
  hostDirectives: [
    {
      directive: NgBondContainer,
    },
  ],
})
export class ImageComponentComponent {
}
