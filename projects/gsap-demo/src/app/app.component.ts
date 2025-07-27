import { Component, viewChild } from '@angular/core';
import { gsap } from 'gsap';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  box = viewChild<any>('box');

  ngAfterViewInit() {
    const boxRef = this.box();
    if (boxRef) {
      gsap.to(boxRef.nativeElement, {
        x: 100,
        duration: 2,
        ease: 'ease.inOut',
      });
    }
  }
}
