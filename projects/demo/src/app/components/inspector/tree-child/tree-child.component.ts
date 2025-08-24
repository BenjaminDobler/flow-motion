import { Component, input } from '@angular/core';
import { NgBondContainer, NGBondItem } from '@richapps/ngx-bond';

@Component({
  selector: 'tree-child',
  imports: [],
  templateUrl: './tree-child.component.html',
  styleUrl: './tree-child.component.scss',
})
export class TreeChildComponent {
  child = input.required<NGBondItem>();
}
