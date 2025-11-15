import { inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { DuplicateDialogComponent } from './duplicate-dialog.component';
import { ComponentFactory, FMContainer } from '../../../../index';

export class DuplicateService {
  dialog = inject(Dialog);
  components = inject(ComponentFactory);


  
  openDuplicateDialog(container: FMContainer) {
    const dialogRef = this.dialog.open<{x: number, y: number, copies: number}>(DuplicateDialogComponent, {
      width: '250px',
    });

    dialogRef.closed.subscribe((result) => {
      for(let i=0; i < (Number(result?.copies) || 1); i++) {
        this.components.copySelected([container]);
        const c = this.components.paste();
        if (c.length > 0) {
          const el = c[0];
          el.x.set(el.x() + (Number(result?.x) || 0) * (i+1));
          el.y.set(el.y() + (Number(result?.y) || 0) * (i+1));
        }
      }
    });
  }
}
