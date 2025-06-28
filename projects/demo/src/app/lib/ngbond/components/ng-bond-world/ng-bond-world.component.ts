import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  TemplateRef,
} from '@angular/core';
import { Link, NgBondService } from '../../services/ngbond.service';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'ng-bond-world',
  imports: [NgTemplateOutlet],
  templateUrl: './ng-bond-world.component.html',
  styleUrl: './ng-bond-world.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgBondWorld {
  public el: ElementRef<HTMLElement> = inject(ElementRef);
  protected dragService: NgBondService = inject(NgBondService);
  public pathanimation = input<TemplateRef<any>>();

  animationBubbleCount = input<number>(10);
  animationBubbleDuration = input<number>(4);



  onConnectionClick(link: Link) {
    console.log('Connection clicked', link);
  }

  protected countToArray(count: number) {
    return Array(count).fill(0);
  }
}
