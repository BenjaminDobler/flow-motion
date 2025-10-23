import { Component, computed, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectionManager } from '../../../services/selection.manager';
import { NgBondContainer } from '../../ng-bond-container/ng-bond-container';
import { ConnectionDirective } from '../../editables/connection.directive';
import { ColorComponent, EdSelectComponent, EdSelectOptionComponent, InputComponent } from '@richapps/ui-components';

@Component({
  selector: 'link-properties',
  imports: [FormsModule, InputComponent, ColorComponent, EdSelectComponent, EdSelectOptionComponent],
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
