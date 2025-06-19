import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
} from '@angular/core';
import { Link, NgBondService } from '../../services/ngbond.service';

@Component({
  selector: 'ng-bond-world',
  imports: [],
  templateUrl: './ng-bond-world.component.html',
  styleUrl: './ng-bond-world.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgBondWorld {
  public el: ElementRef<HTMLElement> = inject(ElementRef);
  protected dragService: NgBondService = inject(NgBondService);

  onConnectionClick(link: Link) {
    console.log('Connection clicked', link);
  }
}
