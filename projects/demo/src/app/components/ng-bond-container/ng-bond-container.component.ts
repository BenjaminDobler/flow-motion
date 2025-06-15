import { ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { NgBondService } from '../../services/ngbond.service';

@Component({
  selector: 'ng-bond-container',
  imports: [],
  templateUrl: './ng-bond-container.component.html',
  styleUrl: './ng-bond-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgBondContainerComponent {
  public el: ElementRef<HTMLElement> = inject(ElementRef);
  protected dragService: NgBondService = inject(NgBondService);
}
