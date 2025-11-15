import {
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  effect,
  HostListener,
  input,
  signal,
} from '@angular/core';
import { NgSplitPanelComponent } from '../ng-split-panel/ng-split-panel.component';
import { DraggerDirective } from '@richapps/ngx-drag';
import { ResizeObserverDirective } from '../../resize-observer/resize-observer.directive';

class Divider {
  position = 0;
  height = 0;
  width = 0;
  x = signal(0);
  y = signal(0);
  maxX = 0;
  minX = 0;
  maxY = 0;
  minY = 0;
}

@Component({
  selector: 'ng-split',
  imports: [DraggerDirective],
  templateUrl: './ng-split.component.html',
  styleUrl: './ng-split.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: ResizeObserverDirective,
      outputs: ['size'],
    },
  ],
})
export class NgSplitComponent {
  panels = contentChildren<NgSplitPanelComponent>(NgSplitPanelComponent, {
    descendants: false,
  });
  dividers: Divider[] = [];
  height = signal(500);
  width = signal(800);
  sizes: number[] = [];
  direction = input<'vertical' | 'horizontal'>('horizontal');
  dividerSize = input(1);

  constructor() {
    effect(() => {
      const p = this.panels();
      p.forEach((panel) => {
        const height = panel.height();
      });
      this.updateLayout();
    });
  }

  contentWidth() {
    return this.width() - (this.panels().length - 1) * this.dividerSize();
  }

  contentHeight() {
    return this.height() - (this.panels().length - 1) * this.dividerSize();
  }

  initialLayout = true;
  previousContentWidth = 0;
  previousContentHeight = 0;

  previousFlexSize = 0;
  updateLayout() {
    const p = this.panels();
    const widthWithoutDivider = this.contentWidth();
    const heightWithoutDivider = this.contentHeight();

    const sizeWithoutDivider =
      this.direction() === 'horizontal'
        ? widthWithoutDivider
        : heightWithoutDivider;

    const sizeProp = this.direction() === 'horizontal' ? 'width' : 'height';
    const oppositeSizeProp =
      this.direction() === 'horizontal' ? 'height' : 'width';
    const posProp = this.direction() === 'horizontal' ? 'x' : 'y';
    const maxProp = this.direction() === 'horizontal' ? 'maxX' : 'maxY';
    const minProp = this.direction() === 'horizontal' ? 'minX' : 'minY';

    const dividerWidth =
      this.direction() === 'horizontal' ? this.dividerSize() : this.width();
    const dividerHeight =
      this.direction() === 'horizontal' ? this.height() : this.dividerSize();

    const previousContentProp =
      this.direction() === 'horizontal'
        ? 'previousContentWidth'
        : 'previousContentHeight';

    this.dividers = [];
    this.sizes = [];

    // layout dividers
    for (let i = 0; i < p.length - 1; i++) {
      const d = new Divider();
      d.height = dividerHeight;
      d.width = dividerWidth;
      this.dividers.push(d);
    }

    let pos = 0;
    const flexSum = p.reduce((prev, curr) => {
      if (typeof curr.flex() === 'number') {
        return prev + (curr.flex() as number);
      }
      return prev + 0;
    }, 0);

    const fixedWidth = p.reduce((prev, curr) => {
      if (typeof curr.flex() === 'string') {
        let valueStr = curr.flex() as string;
        let value = 0;
        if (valueStr.endsWith('px')) {
          value = parseFloat(valueStr.replace('px', ''));
        } else {
          value = parseFloat(valueStr);
        }

        return prev + value;
      }
      return prev + 0;
    }, 0);

    const currentFlexSize = p.reduce((prev, curr) => {
      return prev + curr[sizeProp]();
    }, 0);


    p.forEach((panel, i) => {
      let w = 0;
      if (typeof panel.flex() === 'number') {
        let childPercentage = (panel.flex() as number) / flexSum;

        w = (sizeWithoutDivider - fixedWidth) * childPercentage;
      } else {
        let valueStr = panel.flex() as string;

        if (valueStr.endsWith('px')) {
          w = parseFloat(valueStr.replace('px', ''));
        } else {
          w = parseFloat(valueStr);
        }
      }

      const panelX = pos + i * this.dividerSize();

      panel[sizeProp].set(w);
      panel[oppositeSizeProp].set(this[oppositeSizeProp]());
      panel[posProp].set(panelX);
      if (i < p.length - 1) {
        this.dividers[i][posProp].set(panelX + w);
        if (i > 0) {
          this.dividers[i - 1][maxProp] =
            this.dividers[i][posProp]() - this.dividerSize();
          this.dividers[i][minProp] =
            this.dividers[i - 1][posProp]() + this.dividerSize();
          this.dividers[i][maxProp] = this[sizeProp]() - this.dividerSize();
        } else {
          this.dividers[i][minProp] = 0;
          this.dividers[i][maxProp] = this[sizeProp]() - this.dividerSize();
        }
      }

      pos += w;
    });

    this.previousContentWidth = widthWithoutDivider;
    this.previousContentHeight = heightWithoutDivider;
    this.previousFlexSize = currentFlexSize;

    this.initialLayout = false;
  }

  @HostListener('size', ['$event'])
  onSizeChanged(size: { width: number; height: number }) {
    this.width.set(size.width);
    this.height.set(size.height);
    this.updateLayout();
  }

  onDividerUpdated(pos: { x: number; y: number }, dividerIndex: number) {
    const numDivider = this.panels().length - 1;

    const minProp = this.direction() === 'horizontal' ? 'minX' : 'minY';
    const maxProp = this.direction() === 'horizontal' ? 'maxX' : 'maxY';
    const sizeProp = this.direction() === 'horizontal' ? 'width' : 'height';
    const posProp = this.direction() === 'horizontal' ? 'x' : 'y';

    this.dividers[dividerIndex][posProp].set(pos[posProp]);

    if (dividerIndex < numDivider - 1) {
      const nextDivider = this.dividers[dividerIndex + 1];

      nextDivider[minProp] = pos[posProp] + this.dividerSize();
      if (dividerIndex !== 0) {
        const prevDivider = this.dividers[dividerIndex - 1];
        prevDivider[maxProp] = pos[posProp] - this.dividerSize();
      }
    } else if (dividerIndex !== 0) {
      const prevDivider = this.dividers[dividerIndex - 1];
      prevDivider[maxProp] = pos[posProp] - this.dividerSize();
    }

    this.dividers[dividerIndex][posProp].set(pos[posProp]);

    let nextX = this[sizeProp]();
    if (dividerIndex < this.dividers.length - 1) {
      const nextDivider = this.dividers[dividerIndex + 1];
      nextX = nextDivider[posProp]();
    }
    const prev = this.panels()[dividerIndex];
    const next = this.panels()[dividerIndex + 1];

    const prevSize = pos[posProp] - prev[posProp]();
    const nextSize = nextX - pos[posProp] - this.dividerSize();

    if (typeof prev.flex() === 'string') {
      prev.flex.set(pos[posProp] - prev[posProp]() + 'px');
    }

    if (typeof next.flex() === 'string') {
      next.flex.set(nextX - pos[posProp] - this.dividerSize() + 'px');
    }

    prev[sizeProp].set(prevSize);
    next[posProp].set(pos[posProp] + this.dividerSize());
    next[sizeProp].set(nextSize);

    const contentWidth = this.contentWidth();
    let flexWidth = contentWidth;

    this.panels().forEach((p) => {
      if (typeof p.flex() === 'string') {
        const value = parseFloat((p.flex() as string).replace('px', ''));
        flexWidth -= value;
      }
    });

    this.panels().forEach((p) => {
      if (typeof p.flex() === 'number') {
        var val = p[sizeProp]();
        const perc = val / flexWidth;
        p.flex.set(perc);
      }
    });

    this.updateLayout();
  }
}
