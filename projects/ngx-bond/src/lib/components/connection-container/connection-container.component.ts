import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, input, TemplateRef } from '@angular/core';
import { ConnectionDirective } from '../editables/connection.directive';
import { NgBondService } from '../../services/ngbond.service';

@Component({
  selector: 'connection-container',
  imports: [NgTemplateOutlet, ConnectionDirective],
  templateUrl: './connection-container.component.html',
  styleUrl: './connection-container.component.scss',
})
export class ConnectionContainerComponent {
  protected dragService: NgBondService = inject(NgBondService);
  public pathanimation = input<TemplateRef<unknown>>();

  animationBubbleCount = input<number>(10);
  animationBubbleDuration = input<number>(4);

  protected countToArray(count: number) {
    count = count * 1;
    const a = Array(count).fill(0);
    return a;
  }
}
