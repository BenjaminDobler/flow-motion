import { Directive, effect, model } from '@angular/core';

@Directive({
  selector: '[appTestit]',
})
export class TestitDirective { 


  x = model(0);
  y = model(0);


  constructor() {
    console.log('init', this.x(), 'y:', this.y());
    effect(() => {
      console.log('TestitDirective x:', this.x(), 'y:', this.y());
      });
    }

}
