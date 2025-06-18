import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgBondService } from './lib/ngbond/services/ngbond.service';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [NgBondService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'demo';

  protected ngBondService: NgBondService = inject(NgBondService);
}
