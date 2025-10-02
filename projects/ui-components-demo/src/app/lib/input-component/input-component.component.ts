import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'input-component',
  imports: [FormsModule],
  templateUrl: './input-component.component.html',
  styleUrl: './input-component.component.scss',
})
export class InputComponent { 



  value = model<string>('');
}
