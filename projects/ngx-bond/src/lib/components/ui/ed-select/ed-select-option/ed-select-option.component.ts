import { Component, contentChildren, ElementRef, inject, input } from '@angular/core';
import { EdSelectComponent } from '../ed-select.component';

@Component({
  selector: 'ed-select-option',
  imports: [],
  templateUrl: './ed-select-option.component.html',
  styleUrl: './ed-select-option.component.scss',
  host: {
    '(click)': 'onSelect()',
    '[class.selected]': 'select.selected() === value'
  }
})
export class EdSelectOptionComponent {

  value = input<any>();

  select = inject(EdSelectComponent);

  elementRef = inject<any>(ElementRef); 

  onSelect() {
    console.log('option selected', this.value());
    this.select.selected.set(this.value());
  }




 }
