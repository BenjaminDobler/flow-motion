import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { NgBondProperty } from '../components/ng-bond-property/ng-bond-property';
import { KeyManager } from './key.manager';
import { NgBondContainer } from '../components/ng-bond-container/ng-bond-container';
import { snap } from 'gsap';

export class SelectionManager {
  keyManager: KeyManager = inject(KeyManager);
  selectionTargets = signal<NgBondContainer[]>([]);
  selectionMap = new Map<NgBondContainer, boolean>();

  dragTarget = signal<NgBondContainer | null>(null);

  rootChildren = signal<NgBondContainer[]>([]);

  helpLines = computed(() => {
    const dragTarget = this.dragTarget();
    const lines: { x1: number; y1: number; x2: number; y2: number; snapX: number; snapY: number }[] = [];
    if (dragTarget) {
      const roots = this.rootChildren();

      const targetX = dragTarget.gX();
      const targetY = dragTarget.gY();
      const targetWidth = dragTarget.width();
      const targetHeight = dragTarget.height();

      const tolerance = 10;

      roots.forEach((root) => {
        // Create a helper line for the root
        const x = root.gX();
        const y = root.gY();
        const width = root.width();
        const height = root.height();
        if (root !== dragTarget) {
          // Vertical lines

          if (Math.abs(x - targetX) < tolerance) {
            console.log('  vertical left');
            const line = {
              x1: x,
              y1: Math.min(y, targetY) - 20,
              x2: x,
              y2: Math.max(y + height, targetY + targetHeight) + 20,
              snapX: x,
              snapY: targetY,
            };
            lines.push(line);
          }

          if (Math.abs(targetX + targetWidth - x) < tolerance) {
            console.log('  vertical right');
            const line = {
              x1: x,
              y1: Math.min(y, targetY) - 20,
              x2: x,
              y2: Math.max(y + height, targetY + targetHeight) + 20,
              snapX: x - targetWidth,
              snapY: targetY,
            };
            lines.push(line);
          }

          if (Math.abs(targetX + targetWidth / 2 - x) < tolerance) {
            console.log('  vertical right');
            const line = {
              x1: x,
              y1: Math.min(y, targetY) - 20,
              x2: x,
              y2: Math.max(y + height, targetY + targetHeight) + 20,
              snapX: x - targetWidth / 2,
              snapY: targetY,
            };
            lines.push(line);
          }

          if (Math.abs(targetX + targetWidth - (x + width / 2)) < tolerance) {
            console.log('  vertical right');
            const line = {
              x1: x + width / 2,
              y1: Math.min(y, targetY) - 20,
              x2: x + width / 2,
              y2: Math.max(y + height, targetY + targetHeight) + 20,
              snapX: x + width / 2 - targetWidth,
              snapY: targetY,
            };
            lines.push(line);
          }

          if (Math.abs(targetX + targetWidth / 2 - (x + width / 2)) < tolerance) {
            console.log('  vertical right');
            const line = {
              x1: x + width / 2,
              y1: Math.min(y, targetY) - 20,
              x2: x + width / 2,
              y2: Math.max(y + height, targetY + targetHeight) + 20,
              snapX: x + width / 2 - targetWidth / 2,
              snapY: targetY,
            };
            lines.push(line);
          }

          if (Math.abs(targetX - (x + width / 2)) < tolerance) {
            console.log('  vertical right');
            const line = {
              x1: x + width / 2,
              y1: Math.min(y, targetY) - 20,
              x2: x + width / 2,
              y2: Math.max(y + height, targetY + targetHeight) + 20,
              snapX: x + width / 2,
              snapY: targetY,
            };
            lines.push(line);
          }

          if (Math.abs(targetX + targetWidth - (x + width)) < tolerance) {
            console.log('  vertical right');
            const line = {
              x1: x + width,
              y1: Math.min(y, targetY) - 20,
              x2: x + width,
              y2: Math.max(y + height, targetY + targetHeight) + 20,
              snapX: x + width - targetWidth,
              snapY: targetY,
            };
            lines.push(line);
          }

          if (Math.abs(targetX + targetWidth / 2 - (x + width)) < tolerance) {
            console.log('  vertical right');
            const line = {
              x1: x + width,
              y1: Math.min(y, targetY) - 20,
              x2: x + width,
              y2: Math.max(y + height, targetY + targetHeight) + 20,
              snapX: x + width - targetWidth / 2,
              snapY: targetY,
            };
            lines.push(line);
          }

          if (Math.abs(targetX - (x + width)) < tolerance) {
            console.log('  vertical right');
            const line = {
              x1: x + width,
              y1: Math.min(y, targetY) - 20,
              x2: x + width,
              y2: Math.max(y + height, targetY + targetHeight) + 20,
              snapX: x + width,
              snapY: targetY,
            };
            lines.push(line);
          }

          // Horizontal lines
          if (Math.abs(y - targetY) < tolerance) {
            console.log('  horizontal top');
            const line = {
              x1: Math.min(x, targetX) - 20,
              y1: y,
              x2: Math.max(x + width, targetX + targetWidth) + 20,
              y2: y,
              snapX: targetX,
              snapY: y,
            };
            lines.push(line);
          }

          if (Math.abs(targetY + targetHeight - y) < tolerance) {
            console.log('  horizontal top');
            const line = {
              x1: Math.min(x, targetX) - 20,
              y1: y,
              x2: Math.max(x + width, targetX + targetWidth) + 20,
              y2: y,
              snapX: targetX,
              snapY: y - targetHeight,
            };
            lines.push(line);
          }

          if (Math.abs(targetY + targetHeight / 2 - y) < tolerance) {
            console.log('  horizontal top');
            const line = {
              x1: Math.min(x, targetX) - 20,
              y1: y,
              x2: Math.max(x + width, targetX + targetWidth) + 20,
              y2: y,
              snapX: targetX,
              snapY: y - targetHeight / 2,
            };
            lines.push(line);
          }

          if (Math.abs(targetY - (y + height / 2)) < tolerance) {
            console.log('  horizontal top');
            const line = {
              x1: Math.min(x, targetX) - 20,
              y1: y + height / 2,
              x2: Math.max(x + width, targetX + targetWidth) + 20,
              y2: y + height / 2,
              snapX: targetX,
              snapY: y + height / 2,
            };
            lines.push(line);
          }

          if (Math.abs(targetY + targetHeight / 2 - (y + height / 2)) < tolerance) {
            console.log('  horizontal top');
            const line = {
              x1: Math.min(x, targetX) - 20,
              y1: y + height / 2,
              x2: Math.max(x + width, targetX + targetWidth) + 20,
              y2: y + height / 2,
              snapX: targetX,
              snapY: y + height / 2 - targetHeight / 2,
            };
            lines.push(line);
          }

          if (Math.abs(targetY + targetHeight - (y + height / 2)) < tolerance) {
            console.log('  horizontal top');
            const line = {
              x1: Math.min(x, targetX) - 20,
              y1: y + height / 2,
              x2: Math.max(x + width, targetX + targetWidth) + 20,
              y2: y + height / 2,
              snapX: targetX,
              snapY: y + height / 2 - targetHeight,
            };
            lines.push(line);
          }

          if (Math.abs(targetY + targetHeight - (y + height)) < tolerance) {
            console.log('  horizontal top');
            const line = {
              x1: Math.min(x, targetX) - 20,
              y1: y + height,
              x2: Math.max(x + width, targetX + targetWidth) + 20,
              y2: y + height,
              snapX: targetX,
              snapY: y + height - targetHeight,
            };
            lines.push(line);
          }

          if (Math.abs(targetY + targetHeight / 2 - (y + height)) < tolerance) {
            console.log('  horizontal top');
            const line = {
              x1: Math.min(x, targetX) - 20,
              y1: y + height,
              x2: Math.max(x + width, targetX + targetWidth) + 20,
              y2: y + height,
              snapX: targetX,
              snapY: y + height - targetHeight / 2,
            };
            lines.push(line);
          }

          if (Math.abs(targetY - (y + height)) < tolerance) {
            console.log('  horizontal top');
            const line = {
              x1: Math.min(x, targetX) - 20,
              y1: y + height,
              x2: Math.max(x + width, targetX + targetWidth) + 20,
              y2: y + height,
              snapX: targetX,
              snapY: y + height,
            };
            lines.push(line);
          }

          // // Vertical center lines
          // if (Math.abs(y + height / 2 - targetY - targetHeight / 2) < tolerance) {
          //   console.log('  vertical center');
          //   const line = {
          //     x1: Math.min(x, targetX) - 20,
          //     y1: y + height / 2,
          //     x2: Math.max(x + width, targetX + targetWidth) + 20,
          //     y2: y + height / 2,
          //     snapX: targetX,
          //     snapY: y + height / 2 - targetHeight / 2,
          //   };
          //   lines.push(line);
          // }

          // // Horizontal center lines
          // if (Math.abs(x + width / 2 - targetX - targetWidth / 2) < tolerance) {
          //   console.log('  horizontal center');
          //   const line = {
          //     x1: x + width / 2,
          //     y1: Math.min(y, targetY) - 20,
          //     x2: x + width / 2,
          //     y2: Math.max(y + height, targetY + targetHeight) + 20,
          //     snapX: x + width / 2 - targetWidth / 2,
          //     snapY: targetY,
          //   };
          //   lines.push(line);
          // }
        }
      });
    }

    return lines;
  });

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

  constructor() {
    effect(() => {
      const helpLines = this.helpLines();
    });
  }

  setAll(targets: NgBondContainer[]) {
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

  toggleSelection(target: NgBondContainer) {
    if (this.isSelected(target)) {
      this.unselect(target);
    } else {
      this.select(target);
    }
  }

  dragStart(target: NgBondContainer) {
    console.log('drag start', target);
    this.dragTarget.set(target);
  }

  dragEnd(target: NgBondContainer) {
    if (this.helpLines().length > 0) {
      const snapLine = this.helpLines()[0];
      this.dragTarget()?.x.set(snapLine.snapX);
      this.dragTarget()?.y.set(snapLine.snapY);
    }
    this.dragTarget.set(null);
  }
}
