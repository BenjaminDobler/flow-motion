import { computed, effect, inject, signal, untracked } from '@angular/core';
import { KeyManager } from './key.manager';
import { NgBondContainer } from '../components/ng-bond-container/ng-bond-container';
import { ComponentFactory } from './component.factory';
import { getAlignmentHelpLines } from './alignment';
import { GeometryUtils } from '../utils/geo.utils';

export class SelectionManager {
  readonly disabled = signal(false);

  keyManager: KeyManager = inject(KeyManager);
  selectionTargets = signal<NgBondContainer[]>([]);
  selectionMap = new Map<NgBondContainer, boolean>();

  dragTarget = signal<NgBondContainer | null>(null);

  components?: ComponentFactory;

  rootChildren = signal<NgBondContainer[]>([]);

  helpLines = computed(() => {
    const dragTarget = this.dragTarget();
    let lines: { x1: number; y1: number; x2: number; y2: number; snapX: number; snapY: number }[] = [];
    if (dragTarget && dragTarget.ignoreSelectionManagement() !== true) {
      const roots = this.rootChildren().filter((c) => c.ignoreSelectionManagement() !== true);
      roots.forEach((root) => {
        if (root !== dragTarget) {
          lines = getAlignmentHelpLines(dragTarget, root, 10);
        }
      });
    }

    return lines;
  });

  isIntersecting(a: NgBondContainer, b: NgBondContainer) {
    const aBounds = a.globalBounds();
    const bBounds = b.globalBounds();

    return aBounds.left < bBounds.left + bBounds.width && aBounds.left + aBounds.width > bBounds.left && aBounds.top < bBounds.top + bBounds.height && aBounds.top + aBounds.height > bBounds.top;
  }

  isChildOf(child: NgBondContainer, target: NgBondContainer): boolean {
    return target.children().find((c) => c === child) !== undefined;
  }

  dropTargets = computed(() => {
    const dropTargets: NgBondContainer[] = [];
    const dragTarget = this.dragTarget();
    if (dragTarget && dragTarget.ignoreSelectionManagement() !== true) {
      const roots = this.rootChildren().filter((c) => c.ignoreSelectionManagement() !== true);

      roots.forEach((root) => {
        // check if root intersects with dragTarget
        if (!this.isChildOf(dragTarget, root) && !this.isChildOf(root, dragTarget) && root !== dragTarget && this.isIntersecting(root, dragTarget)) {
          dropTargets.push(root);
        }
      });
    }
    return dropTargets;
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

    effect(() => {
      const disabled = this.disabled();
      // let children: any[] = [];
      // untracked(()=>{
      //   children = this.rootChildren();
      // })
      const children = this.rootChildren();
      if (disabled) {
        children.forEach((t) => {
          t.disable();
        });
      } else {
        children.forEach((t) => {
          t.enable();
        });
      }
    });

    this.keyManager.keyDown$.subscribe((evt) => {
      if (this.keyManager.keydownMap.has('Escape')) {
        this.unselectAll();
      } else if (evt.key === 'ArrowRight') {
        const xBy = this.keyManager.isKeyDown('Shift') ? 10 : 1;
        this.moveBy(xBy, 0, this.dragTarget() as NgBondContainer);
      } else if (evt.key === 'ArrowLeft') {
        const xBy = this.keyManager.isKeyDown('Shift') ? -10 : -1;
        this.moveBy(xBy, 0, this.dragTarget() as NgBondContainer);
      } else if (evt.key === 'ArrowUp') {
        const yBy = this.keyManager.isKeyDown('Shift') ? -10 : -1;
        this.moveBy(0, yBy, this.dragTarget() as NgBondContainer);
      } else if (evt.key === 'ArrowDown') {
        const yBy = this.keyManager.isKeyDown('Shift') ? 10 : 1;
        this.moveBy(0, yBy, this.dragTarget() as NgBondContainer);
      } else if (evt.key === 'Backspace' && (this.keyManager.isKeyDown('Meta') || this.keyManager.isKeyDown('Control'))) {
        this.selectionTargets().forEach((t) => {
          this.components?.removeComponent(t);
        });
      } else if (evt.key === 'g' && (this.keyManager.isKeyDown('Meta') || this.keyManager.isKeyDown('Control'))) {
        this.components?.groupSelected();
      } else if (this.components && evt.key === 'c' && (this.keyManager.isKeyDown('Meta') || this.keyManager.isKeyDown('Control'))) {
        this.components.copySelected(this.selectionTargets());
      } else if (this.components && evt.key === 'v' && (this.keyManager.isKeyDown('Meta') || this.keyManager.isKeyDown('Control'))) {
        this.components.paste();
      }
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
        target.selected(true);
      } else {
        this.unselect(target);
        target.selected(false);
      }
    } else if (this.keyManager.keydownMap.has('Shift')) {
      this.selectionMap.set(target, true);
      this.selectionTargets.update((selections) => [...selections, target]);
      target.selected(true);
    } else {
      if (this.selectionTargets().length > 0) {
        this.selectionTargets().forEach((t) => {
          this.selectionMap.delete(t);
          t.selected(false);
        });
      }
      this.selectionMap.set(target, true);
      this.selectionTargets.set([target]);
      target.selected(true);
    }
  }

  unselect(target: NgBondContainer) {
    if (this.selectionMap.has(target)) {
      this.selectionMap.delete(target);
      this.selectionTargets.update((targets) => targets.filter((x) => x !== target));
      target.selected(false);
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
    this.dragTarget.set(target);
    if (this.keyManager.isKeyDown('Alt')) {
      this.components?.copyInPlace([target]);
    }
  }

  dragEnd(target: NgBondContainer) {
    // snap to help line
    if (this.helpLines().length > 0) {
      const snapLine = this.helpLines()[0];
      this.dragTarget()?.x.set(snapLine.snapX);
      this.dragTarget()?.y.set(snapLine.snapY);
    }

    if (this.dropTargets().length > 0) {
      this.components?.moveToContainer(target, this.dropTargets()[0]);
    }
    this.dragTarget.set(null);
  }

  disableSelection() {
    this.disabled.set(true);
  }

  enableSelection() {
    this.disabled.set(false);
  }

  mouseMove(x: number, y: number) {
    this.rootChildren().forEach((target) => {
      const dist = GeometryUtils.Distance({ x, y }, target.globalBounds());

      if (dist < 20) {
        target.approached(true);
      } else {
        target.approached(false);
      }
    });
  }
}
