import {
  Directive,
  ElementRef,
  inject,
  output,
  AfterViewInit, OnDestroy,
} from '@angular/core';
import { ResizeObserverService } from './resize-observer.service';

@Directive({
  selector: '[appResizeObserver]',
})
export class ResizeObserverDirective implements AfterViewInit, OnDestroy {
  observer = inject(ResizeObserverService);
  el = inject(ElementRef);

  size = output<{ width: number; height: number }>();

  ngAfterViewInit() {
    this.observer.observe(this.el.nativeElement, (w: number, h: number) => {
      this.size.emit({ width: w, height: h });
    });
  }

  ngOnDestroy() {
    this.observer.unobserve(this.el.nativeElement);
  }
}
