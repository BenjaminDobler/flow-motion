import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { NgBondProperty } from '../components/ng-bond-property/ng-bond-property';
import { KeyManager } from './key.manager';
import { NgBondContainer } from '../components/ng-bond-container/ng-bond-container';

export class SelectionManager {
  keyManager: KeyManager = inject(KeyManager);
  selectionTargets = signal<(NgBondContainer)[]>([]);
  selectionMap = new Map<NgBondContainer, boolean>();

  selectedGroup = computed(() => {
    const selectionTargets = this.selectionTargets();
    if (this.selectionTargets().length === 0) {
      console.warn('No selection targets available to compute group bounds');
      return null;
    }

    const first = this.selectionTargets()[0];

    let xMin = first.gX();
    let yMin = first.gY();
    let xMax = first.gX() + first.width();
    let yMax = first.gY() + first.height();

    this.selectionTargets().forEach((target) => {
      // const bounds = 'globalBounds' in target && target.globalBounds
      //   ? target.globalBounds
      //   : target.bounds;
      // console.log('target bounds: ', bounds);

      const bounds = target.globalBounds();

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

  setAll(targets: (NgBondContainer)[]) {
    this.selectionTargets.set(targets);
    this.selectionMap.clear();
    targets.forEach((target) => {
      this.selectionMap.set(target, true);
    });
  }

  select(target: NgBondContainer) {
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

  unselect(target: NgBondContainer) {
    if (this.selectionMap.has(target)) {
      this.selectionMap.delete(target);
      this.selectionTargets.update((targets) => targets.filter((x) => x !== target));
    }
  }

  unselectAll() {
    this.selectionTargets().forEach((t) => this.unselect(t));
  }

  isSelected(target: NgBondContainer) {
    return this.selectionMap.get(target);
  }

  moveBy(x: number, y: number, source: NgBondContainer) {
    this.selectionTargets().forEach((t) => {
      if (t !== source && t.type === 'container') {
        (t as NgBondContainer).moveBy(x, y);
      }
    });
  }

  align(type: 'left' | 'right' | 'horizontal-center' | 'top' | 'bottom' | 'vertical-center') {
    if (this.selectionTargets().length === 0) return;

    switch (type) {
      case 'left':
        this.alignLeft();
        break;
      case 'right':
        this.alignRight();
        break;
      case 'horizontal-center':
        this.alignHorizontalCenter();
        break;
      case 'top':
        this.alignTop();
        break;
      case 'bottom':
        this.alignBottom();
        break;
      case 'vertical-center':
        this.alignVerticalCenter();
        break;
    }
  }

  alignLeft() {
    const group = this.selectedGroup();
    if (!group) return;

    const { y, height } = group;
    const minX = Math.min(...this.selectionTargets().map((t) => t.gX()));
    this.selectionTargets().forEach((target) => {
      if (target.type === 'container') {
        (target as NgBondContainer).moveBy(minX - target.gX(), 0);
      } else if (target.type === 'property') {
       // target.gX.set(minX);
      }
    });
  }

  alignRight() {
    const group = this.selectedGroup();
    if (!group) return;

    const { y, height } = group;
    const maxX = Math.max(...this.selectionTargets().map((t) => t.gX()));
    this.selectionTargets().forEach((target) => {
      if (target.type === 'container') {
        (target as NgBondContainer).moveBy(maxX - target.gX(), 0);
      } else if (target.type === 'property') {
        // target.gX.update((x) => {
        //   return maxX - target.width() + x;
        // });
      }
    });
  }

  alignTop() {
    const group = this.selectedGroup();
    if (!group) return;

    const minY = Math.min(...this.selectionTargets().map((t) => t.gY()));
    this.selectionTargets().forEach((target) => {
      if (target.type === 'container') {
        (target as NgBondContainer).moveBy(0, minY - target.gY());
      } else if (target.type === 'property') {
        //target.gY.set(minY);
      }
    });
  }

  alignBottom() {
    const group = this.selectedGroup();
    if (!group) return;

    const maxY = Math.max(...this.selectionTargets().map((t) => t.gY()));
    this.selectionTargets().forEach((target) => {
      if (target.type === 'container') {
        (target as NgBondContainer).moveBy(0, maxY - target.gY());
      } else if (target.type === 'property') {
        //target.gY.set(maxY);
      }
    });
  }

  alignHorizontalCenter() {
    const group = this.selectedGroup();
    if (!group) return;

    const centerX = group.x + group.width / 2;
    this.selectionTargets().forEach((target) => {
      if (target.type === 'container') {
        (target as NgBondContainer).moveBy(centerX - (target.x() + target.width() / 2), 0);
      } else if (target.type === 'property') {
        target.x.set(centerX - target.width() / 2);
      }
    });
  }

  alignVerticalCenter() {
    const group = this.selectedGroup();
    if (!group) return;

    const centerY = group.y + group.height / 2;
    this.selectionTargets().forEach((target) => {
      if (target.type === 'container') {
        (target as NgBondContainer).moveBy(0, centerY - (target.y() + target.height() / 2));
      } else if (target.type === 'property') {
        target.y.set(centerY - target.height() / 2);
      }
    });
  }
}
