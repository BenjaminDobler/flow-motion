import { Injectable, signal } from '@angular/core';
import { NgBondContainer } from '../components/ng-bond-container/ng-bond-container';
import { NgBondProperty } from '../components/ng-bond-property/ng-bond-property';

export class SelectionManager {
  selectionTargets = signal<(NgBondContainer | NgBondProperty)[]>([]);
  selectionMap = new Map<NgBondContainer | NgBondProperty, boolean>();

  select(target: NgBondContainer | NgBondProperty) {
    this.selectionMap.set(target, true);
    this.selectionTargets.update((selections) => [...selections, target]);
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
}
