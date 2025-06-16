import { Component } from '@angular/core';
import { NgBondContainer } from '../../../components/ng-bond-container/ng-bond-container';
import { NgBondProperty } from '../../../components/ng-bond-property/ng-bond-property';

@Component({
  selector: 'app-property-container',
  imports: [NgBondProperty],
  templateUrl: './property-container.component.html',
  styleUrl: './property-container.component.scss',
})
export class PropertyContainerComponent extends NgBondContainer {}
