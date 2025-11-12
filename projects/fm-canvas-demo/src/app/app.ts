import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FmCanvas } from "../../../flow-motion/src/public-api";

@Component({
  selector: 'app-root',
  imports: [FmCanvas],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('fm-canvas-demo');

}
