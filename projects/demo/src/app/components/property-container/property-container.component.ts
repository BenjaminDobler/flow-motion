import { Component } from '@angular/core';
import { NgBondProperty } from '../../lib/ngbond/components/ng-bond-property/ng-bond-property';
import { NgBondContainer } from '../../lib/ngbond/components/ng-bond-container/ng-bond-container';


@Component({
  selector: 'app-property-container',
  imports: [NgBondProperty],
  templateUrl: './property-container.component.html',
  styleUrl: './property-container.component.scss',
})
export class PropertyContainerComponent extends NgBondContainer {}
