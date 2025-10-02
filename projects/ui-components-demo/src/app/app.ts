import { Component, Input, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InputComponent } from './lib/input-component/input-component.component';
import { ColorComponent } from './lib/color/color.component';
import { EdSelectComponent } from "./lib/ed-select/ed-select.component";
import { EdSelectOptionComponent } from './lib/ed-select/ed-select-option/ed-select-option.component';
import { InputGroupComponent } from './lib/input-group/input-group.component';
import { FormsModule } from '@angular/forms';
import { RadiusIconComponent } from "./lib/icons/radius-icon/radius-icon.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, InputComponent, ColorComponent, EdSelectComponent, EdSelectOptionComponent, InputGroupComponent, RadiusIconComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('ui-components-demo');

  width = signal(100);
}
