import { Component, input } from '@angular/core';

@Component({
  selector: 'ed-icon',
  imports: [],
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
})
export class IconComponent { 


  icon = input<string>();
}
