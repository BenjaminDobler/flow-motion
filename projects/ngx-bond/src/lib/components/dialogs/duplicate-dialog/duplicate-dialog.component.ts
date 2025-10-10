import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '@richapps/ui-components';

@Component({
  selector: 'lib-duplicate-dialog',
  imports: [InputComponent, FormsModule],
  templateUrl: './duplicate-dialog.component.html',
  styleUrl: './duplicate-dialog.component.scss',
})
export class DuplicateDialogComponent {
  dialogRef = inject<DialogRef<{x: number, y: number, copies: number}>>(DialogRef<{x: number, y: number, copies: number }>);


  y = model(0);
  x = model(0);
  copies = model(1);

  apply() {
    this.dialogRef.close({x: this.x(), y: this.y(), copies: this.copies()});
  }
}
