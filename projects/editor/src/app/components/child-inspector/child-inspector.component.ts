import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ElementPropertyInspectorComponent, ElementTreeComponent } from '@richapps/ngx-bond';

@Component({
  selector: 'child-inspector',
  imports: [ElementTreeComponent],
  templateUrl: './child-inspector.component.html',
  styleUrl: './child-inspector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildInspectorComponent {}
