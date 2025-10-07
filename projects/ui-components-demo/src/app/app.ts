import { Component, Input, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ColorComponent, EdSelectComponent, EdSelectOptionComponent, InputComponent, InputGroupComponent, RadiusIconComponent } from '@richapps/ngx-bond';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, InputComponent, ColorComponent, EdSelectComponent, EdSelectOptionComponent, InputGroupComponent, RadiusIconComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('ui-components-demo');

  width = signal(100);

  selectedOption = signal('Option 1');
}
