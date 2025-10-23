import { Component, effect, signal, viewChild, ViewChild, viewChildren, ViewContainerRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WorldComponent } from './components/world/world.component';
import { ContentDirective } from './directives/content.directive';
import { TestComponent } from './components/Test/Test.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WorldComponent, ContentDirective],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('content-test');

  @ViewChild('insert_slot', { read: ViewContainerRef })
  worldHost!: ViewContainerRef;

  directives = viewChildren<ContentDirective>(ContentDirective);


  constructor() {
  }
  
  createComponent() {
    if (this.worldHost) {
      const componentRef = this.worldHost.createComponent(TestComponent, {
        directives: [ContentDirective],
      });

      componentRef.setInput('appContent', 'Hello from dynamically created component!');
      componentRef.hostView.detectChanges();
      
    } else {
      console.error('World host not found');
    }
  }
}
