import { Component } from '@angular/core';
import { FMContainer, FMProperty } from '@richapps/flow-motion';
 


@Component({
  selector: 'app-property-container',
  imports: [FMProperty],
  templateUrl: './property-container.component.html',
  styleUrl: './property-container.component.scss',
})
export class PropertyContainerComponent extends FMContainer {}
