import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgBondService } from '@richapps/ngx-bond';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [NgBondService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(drop)': 'onDrop($event)',
    '(dragover)': '$event.preventDefault()',
    '(dragenter)': '$event.preventDefault()',
    '(dragleave)': '$event.preventDefault()',
    '(dragend)': '$event.preventDefault()',
    '(dragstart)': '$event.preventDefault()',
    '(drag)': '$event.preventDefault()',
  },
})
export class AppComponent {
  title = 'demo';

  protected ngBondService: NgBondService = inject(NgBondService);

  onDrop(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer?.files.length === 0) {
      return;
    }
    const reader = new FileReader();
    if (!e.dataTransfer?.files[0]) {
      return;
    }
    reader.readAsDataURL(e.dataTransfer?.files[0]);
    reader.onload = () => {
      const image = new Image();
      image.src = reader.result as string;
      image.onload = () => {
        console.log('Image loaded', image);
      };
    };

    // reader.onload = () => {
    //   const image = new Image();
    //   image.src = reader.result;
    //   image.onload = () => {
    //     const canvas = document.querySelector('canvas');
    //     canvas.width = image.width;
    //     canvas.height = image.height;
    //     const context = canvas.getContext('2d');
    //     context.filter = 'blur(10px)';
    //     context.drawImage(image, 0, 0);
    //   };
    // };
  }
}
