import { NgTemplateOutlet } from '@angular/common';
import { afterNextRender, Component, contentChild, effect, ElementRef, forwardRef, inject, input, model, TemplateRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { makeDraggable } from '@richapps/ngx-bond';
import { IconComponent } from '../icon/icon.component';
@Component({
  selector: 'input-component',
  imports: [FormsModule, NgTemplateOutlet, IconComponent],
  templateUrl: './input-component.component.html',
  styleUrl: './input-component.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
})
export class InputComponent implements ControlValueAccessor {
  prefixIcon = input<string | undefined>();
  suffixIcon = input<string | undefined>();

  private el: ElementRef = inject(ElementRef);

  writeValue(value: any): void {
    this.value.set(value);
  }

  registerOnChange(fn: any): void {
    this.value.subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    // Implement if needed
  }

  value = model<string | number>('');
  type = input<'text' | 'number' | 'password'>('text');
  prefix = input<string>('');
  suffix = input<string>('');

  constructor() {
    afterNextRender(() => {
      this.initDrag();
    });
  }

  initDrag() {
    const { dragStart$, dragMove$, dragEnd$ } = makeDraggable(this.el.nativeElement);

    let startValue = this.value();
    dragStart$.subscribe((event) => {
      startValue = this.value();
    });
    dragMove$.subscribe((event) => {
      this.value.set(Math.round((startValue as number) + event.deltaX));
    });
  }
}
