import { Component, signal } from '@angular/core';
import { FmCanvas } from '@richapps/flow-motion';

@Component({
  selector: 'app-root',
  imports: [FmCanvas],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('fm-canvas-demo');

}
