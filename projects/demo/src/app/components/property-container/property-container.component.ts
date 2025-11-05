import { Component } from '@angular/core';
import { NgBondContainer, NgBondProperty } from '@richapps/flow-motion';
 


@Component({
  selector: 'app-property-container',
  imports: [NgBondProperty],
  templateUrl: './property-container.component.html',
  styleUrl: './property-container.component.scss',
})
export class PropertyContainerComponent extends NgBondContainer {}
