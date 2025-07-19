import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { NgBondContainer } from '../components/ng-bond-container/ng-bond-container';
import { NgBondProperty } from '../components/ng-bond-property/ng-bond-property';
import { KeyManager } from './key.manager';

export class SelectionManager {
  keyManager: KeyManager = inject(KeyManager);
  selectionTargets = signal<(NgBondContainer | NgBondProperty)[]>([]);
  selectionMap = new Map<NgBondContainer | NgBondProperty, boolean>();

  selectedGroup = computed(() => {
    if (this.selectionTargets().length === 0) {
      return null;
    }

    const first = this.selectionTargets()[0];

    let xMin = first.gX();
    let yMin = first.gY();
    let xMax = first.gX() + first.width();
    let yMax = first.gY() + first.height();

    this.selectionTargets().forEach((target) => {
      const bounds = target.bounds;
      xMin = Math.min(xMin, bounds.left);
      yMin = Math.min(yMin, bounds.top);
      xMax = Math.max(xMax, bounds.left + bounds.width);
      yMax = Math.max(yMax, bounds.top + bounds.height);
    });

    return {
      x: xMin,
      y: yMin,
      width: xMax - xMin,
      height: yMax - yMin,
    };
  });

  constructor() {}

  select(target: NgBondContainer | NgBondProperty) {
    console.log('Selecting', target);
    if (this.selectionMap.has(target)) {
      if (!this.keyManager.keydownMap.has('Shift')) {
        this.selectionTargets().forEach((t) => {
          this.selectionMap.delete(t);
        });
        this.selectionMap.set(target, true);
        this.selectionTargets.set([target]);
      } else {
        this.unselect(target);
      }
    } else if (this.keyManager.keydownMap.has('Shift')) {
      this.selectionMap.set(target, true);
      this.selectionTargets.update((selections) => [...selections, target]);
    } else {
      if (this.selectionTargets().length > 0) {
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

  unselectAll() {
    this.selectionTargets().forEach((t) => this.unselect(t));
  }

  isSelected(target: NgBondContainer | NgBondProperty) {
    return this.selectionMap.get(target);
  }

  moveBy(x: number, y: number, source: NgBondContainer) {
    this.selectionTargets().forEach((t) => {
      if (t !== source && t.type === 'container') {
        (t as NgBondContainer).moveBy(x, y);
      }
    });
  }

  alignHorizontal() {
    const group = this.selectedGroup();
    if (!group) return;

    const { y, height } = group;
    this.selectionTargets().forEach((t) => {
      if (t.type === 'container') {
        (t as NgBondContainer).moveBy(0, y - t.gY());
      }
    });
  }

  alignVertical() {
    const group = this.selectedGroup();
    if (!group) return;

    const { x, width } = group;
    this.selectionTargets().forEach((t) => {
      if (t.type === 'container') {
        (t as NgBondContainer).moveBy(x - t.gX(), 0);
      }
    });
  }

  alignCenter() {
    const group = this.selectedGroup();
    if (!group) return;

    const { x, y, width, height } = group;
    this.selectionTargets().forEach((t) => {
      if (t.type === 'container') {
        const target = t as NgBondContainer;
        target.moveBy(x + width / 2 - target.gX() - target.width() / 2, y + height / 2 - target.gY() - target.height() / 2);
      }
    });
  }

  alignVerticalCenter() {
    const group = this.selectedGroup();
    if (!group) return;

    const { y, height } = group;
    this.selectionTargets().forEach((t) => {
      if (t.type === 'container') {
        const target = t as NgBondContainer;
        target.moveBy(0, y + height / 2 - target.gY() - target.height() / 2);
      }
    });
  }
}
