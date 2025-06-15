import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[dragworld]',
  standalone: true,
  exportAs: 'dragworld',
})
export class DragWorld {
    public el: ElementRef = inject(ElementRef);
}
