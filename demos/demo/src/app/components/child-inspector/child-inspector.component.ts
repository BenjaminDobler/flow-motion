import { Component } from '@angular/core';
import { ElementPropertyInspectorComponent, ElementTreeComponent } from '@richapps/flow-motion';

@Component({
  selector: 'child-inspector',
  imports: [ElementTreeComponent],
  templateUrl: './child-inspector.component.html',
  styleUrl: './child-inspector.component.scss',
})
export class ChildInspectorComponent {}
