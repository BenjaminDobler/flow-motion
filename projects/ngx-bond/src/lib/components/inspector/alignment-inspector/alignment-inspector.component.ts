import { Component, inject } from '@angular/core';
import { SelectionManager } from '@richapps/ngx-bond';

@Component({
  selector: 'alignment-inspector',
  imports: [],
  templateUrl: './alignment-inspector.component.html',
  styleUrl: './alignment-inspector.component.scss',
})
export class AlignmentInspectorComponent { 




  selectionManager = inject(SelectionManager);

}
