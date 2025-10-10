import { Component, computed, contentChildren, effect, ElementRef, forwardRef, inject, model, output, viewChild } from '@angular/core';
import { EdSelectOptionComponent } from './ed-select-option/ed-select-option.component';
import { CdkPortal } from '@angular/cdk/portal';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ed-select',
  imports: [CdkPortal],
  templateUrl: './ed-select.component.html',
  styleUrl: './ed-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EdSelectComponent),
      multi: true,
    },
  ],
})
export class EdSelectComponent implements ControlValueAccessor {
  selected = model<any>();
  options = contentChildren<EdSelectOptionComponent>(EdSelectOptionComponent);

  contentTemplate = viewChild<CdkPortal>(CdkPortal);

  writeValue(value: any): void {
    this.selected.set(value);
  }

  registerOnChange(fn: any): void {
    this.selected.subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  private onTouched: any = () => {};
  private overlayRef: OverlayRef | null = null;

  private elementRef = inject<any>(ElementRef);

  change = output<any>();

  overlay = inject(Overlay);

  label = computed(() => {
    const selected = this.selected();
    return selected ? selected : 'Select...';
  });

  selectedOption = computed(() => {
    return this.options().find((o) => o.value === this.selected());
  });

  constructor() {

    effect(() => {
      const selected = this.selected();
      this.change.emit(selected ? selected.value : null);
      this.hide();
    });
  }

  toggleDropdown() {
    this.showDropdown();
  }

  public showDropdown(): void {
    this.overlayRef = this.overlay.create(this.getOverlayConfig());
    this.overlayRef.attach(this.contentTemplate());
    this.overlayRef.backdropClick().subscribe(() => this.hide());
  }

  hide() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  private getOverlayConfig(): OverlayConfig {
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.elementRef.nativeElement)
      .withPush(true)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 4,
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
          offsetY: -4,
        },
      ]);

    const scrollStrategy = this.overlay.scrollStrategies.reposition();
    return new OverlayConfig({
      positionStrategy: positionStrategy,
      scrollStrategy: scrollStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
    });
  }
}
