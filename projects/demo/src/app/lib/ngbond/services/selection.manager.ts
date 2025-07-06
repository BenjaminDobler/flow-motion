import { effect, inject, Injectable, signal } from '@angular/core';
import { NgBondContainer } from '../components/ng-bond-container/ng-bond-container';
import { NgBondProperty } from '../components/ng-bond-property/ng-bond-property';
import { KeyManager } from './key.manager';

export class SelectionManager {
  keyManager: KeyManager = inject(KeyManager);
  selectionTargets = signal<(NgBondContainer | NgBondProperty)[]>([]);
  selectionMap = new Map<NgBondContainer | NgBondProperty, boolean>();

  constructor() {}

  select(target: NgBondContainer | NgBondProperty) {
    if (this.selectionMap.has(target)) {
      console.log('already has target Shift Down?', this.keyManager.keydownMap.has('Shift'));
      if (!this.keyManager.keydownMap.has('Shift')) {
        console.log('delete other');
         this.selectionTargets().forEach((t) => {
          this.selectionMap.delete(t);
        });
        this.selectionMap.set(target, true);
      this.selectionTargets.set([target]);
      }
      
      
    } else if (this.keyManager.keydownMap.has('Shift')) {
      this.selectionMap.set(target, true);
      this.selectionTargets.update((selections) => [...selections, target]);
    } else {
      if (this.selectionTargets().length > 0) {
        console.log('delete others2');
        this.selectionTargets().forEach((t) => {
          this.selectionMap.delete(t);
        });
      }
      this.selectionMap.set(target, true);
      this.selectionTargets.set([target]);
    }
  }

  unselect(target: NgBondContainer | NgBondProperty) {
    if (this.selectionMap.has(target)) {
      this.selectionMap.delete(target);
      this.selectionTargets.update((targets) => targets.filter((x) => x !== target));
    }
  }

  isSelected(target: NgBondContainer | NgBondProperty) {
    return this.selectionMap.get(target);
  }

  moveBy(x: number, y: number, source: NgBondContainer) {
    console.log('move by ', x, y);
    this.selectionTargets().forEach((t) => {
      if (t !== source && t.type === 'container') {
        (t as NgBondContainer).moveBy(x, y);
      }
    });
  }
}
