import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectionManager } from '@richapps/ngx-bond';

@Component({
  selector: 'element-inspector',
  imports: [FormsModule],
  templateUrl: './element-inspector.component.html',
  styleUrl: './element-inspector.component.scss',
})
export class ElementInspectorComponent {
  protected selectionManager: SelectionManager = inject(SelectionManager);
}
