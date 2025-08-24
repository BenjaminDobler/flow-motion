import { Component, inject } from '@angular/core';
import { WorldComponent } from '../world/world.component';

@Component({
  selector: 'app-test',
  imports: [],
  templateUrl: './Test.component.html',
  styleUrl: './Test.component.scss',
})
export class TestComponent {

  parent = inject(WorldComponent)

  constructor() {
    console.log('TestComponent initialized with parent:', this.parent);
  }
 }
