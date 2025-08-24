import { contentChildren, Directive, effect, input } from '@angular/core';

@Directive({
  selector: '[appContent]',
})
export class ContentDirective {


  appContent = input.required<string>();
  constructor() {
    console.log('ContentDirective initialized');
  }
}
