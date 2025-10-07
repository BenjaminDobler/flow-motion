import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'color',
  imports: [FormsModule],
  templateUrl: './color.component.html',
  styleUrl: './color.component.scss',
})
export class ColorComponent {


  value = model<string>('#ff0000');
 }
