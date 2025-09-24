import { DOCUMENT, inject, signal } from '@angular/core';
import { fromEvent } from 'rxjs';

export class KeyManager {
  document: Document = inject(DOCUMENT);

  keydownMap: Map<string, boolean> = new Map<string, boolean>();
  keysDown = signal<string[]>([]);
  keyUp$ = fromEvent<KeyboardEvent>(this.document, 'keyup');
  keyDown$ = fromEvent<KeyboardEvent>(this.document, 'keydown');

  constructor() {
    this.init();
  }

  init() {
    this.keyUp$.subscribe((evt) => {
      this.keydownMap.delete(evt.key);
    });

    this.keyDown$.subscribe((evt) => {
      console.log('key down', evt.key);
      this.keydownMap.set(evt.key, true);
      this.keysDown.update((x) => [...x, evt.key]);
    });
  }

  isKeyDown(key: string): boolean {
    return this.keydownMap.has(key);
  }
}
