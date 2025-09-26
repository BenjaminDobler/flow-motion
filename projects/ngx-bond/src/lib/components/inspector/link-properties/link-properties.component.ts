import { Component, computed, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConnectionDirective, NgBondContainer, SelectionManager } from '@richapps/ngx-bond';

@Component({
  selector: 'link-properties',
  imports: [FormsModule],
  templateUrl: './link-properties.component.html',
  styleUrl: './link-properties.component.scss',
})
export class LinkPropertiesComponent {



  selection = inject(SelectionManager);

  selectedLink = computed(()=>{
    const sel = this.selection.selectionTargets();
    return sel.filter(s => s.type === 'link');

  });

  constructor() {


  }


  getDirective(container: NgBondContainer) {
    return container.injector.get(ConnectionDirective);
  }

 }
