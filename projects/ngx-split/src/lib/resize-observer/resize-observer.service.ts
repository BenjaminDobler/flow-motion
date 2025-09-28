import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ResizeObserverService {
  expectedWidths = new WeakMap();
  expectedHeights = new WeakMap();

  resizeObserver?: ResizeObserver;

  observerMap = new Map();

  init() {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (
          this.expectedWidths.get(entry.target) === entry.contentRect.width &&
          this.expectedHeights.get(entry.target) === entry.contentRect.height
        ) {
          continue;
        }
        this.expectedHeights.set(entry.target, entry.contentRect.height);
        this.expectedWidths.set(entry.target, entry.contentRect.width);

        if (this.observerMap.has(entry.target)) {
          this.observerMap.get(entry.target)(
            entry.contentRect.width,
            entry.contentRect.height
          );
        }
      }
    });
  }

  observe(el: HTMLElement, callback: (w: number, h: number) => void) {
    if (!this.resizeObserver) {
      this.init();
    }
    this.resizeObserver?.observe(el);
    this.observerMap.set(el, callback);
  }

  unobserve(el: HTMLElement) {
    this.resizeObserver?.unobserve(el);
    this.observerMap.delete(el);
  }
}
