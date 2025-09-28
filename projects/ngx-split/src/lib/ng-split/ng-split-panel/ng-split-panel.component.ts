import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { NgSplitComponent } from '@richapps/ngx-split';

@Component({
  selector: 'ng-split-panel',
  templateUrl: './ng-split-panel.component.html',
  styleUrl: './ng-split-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.width]': "width() + 'px'",
    '[style.height]': "height() + 'px'",
    '[style.transform]': '`translate(${this.x()}px, ${this.y()}px)`',
  },
})
export class NgSplitPanelComponent {
  resize = signal<'flex' | 'fixed>'>('flex');

  width = signal<number>(0);
  height = signal<number>(0);
  x = signal<number>(0);
  y = signal<number>(0);
  el = inject(ElementRef);
  flex = model<number | string>(1);

  minWidth = input<number>(-1);

  split = inject(NgSplitComponent);

  closeToNext() {
    const index = this.split.panels().indexOf(this);
    const divider = this.split.dividers[index - 1];
    if (this.split.direction() === 'horizontal') {
      const maxPos = divider.maxX;
      this.split.onDividerUpdated({ x: maxPos, y: 0 }, index - 1);
    }
  }

  closePrev() {
    const index = this.split.panels().indexOf(this);
    const divider = this.split.dividers[index - 1];
    if (this.split.direction() === 'horizontal') {
      const maxPos = divider.minX;
      this.split.onDividerUpdated({ x: maxPos, y: 0 }, index - 1);
    }
  }
}
