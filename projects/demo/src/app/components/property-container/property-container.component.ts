import { Component } from '@angular/core';
import { NgBondContainer, NgBondProperty } from '@richapps/ngx-bond';
 


@Component({
  selector: 'app-property-container',
  imports: [NgBondProperty],
  templateUrl: './property-container.component.html',
  styleUrl: './property-container.component.scss',
})
export class PropertyContainerComponent extends NgBondContainer {}
