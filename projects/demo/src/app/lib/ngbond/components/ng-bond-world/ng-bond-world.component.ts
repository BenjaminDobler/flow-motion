import { ChangeDetectionStrategy, Component, ElementRef, inject, input, TemplateRef } from '@angular/core';
import { Link, NgBondService } from '../../services/ngbond.service';
import { NgTemplateOutlet } from '@angular/common';
import { SelectionManager } from '../../services/selection.manager';
import { KeyManager } from '../../services/key.manager';

@Component({
  selector: 'ng-bond-world',
  imports: [NgTemplateOutlet],
  templateUrl: './ng-bond-world.component.html',
  styleUrl: './ng-bond-world.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [],
})
export class NgBondWorld {
  public el: ElementRef<HTMLElement> = inject(ElementRef);
  protected dragService: NgBondService = inject(NgBondService);
  protected selectionManager: SelectionManager = inject(SelectionManager);
  public pathanimation = input<TemplateRef<unknown>>();
  private keymanager: KeyManager = inject(KeyManager);

  animationBubbleCount = input<number>(10);
  animationBubbleDuration = input<number>(4);

  onConnectionClick(link: Link) {
    console.log('Connection clicked', link);
  }

  protected countToArray(count: number) {
    return Array(count).fill(0);
  }
}
