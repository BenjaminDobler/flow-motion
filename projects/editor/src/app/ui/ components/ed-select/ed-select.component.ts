import { Component, computed, contentChildren, effect, ElementRef, forwardRef, inject, model, output, viewChild } from '@angular/core';
import { EdSelectOptionComponent } from './ed-select-option/ed-select-option.component';
import { CdkPortal } from '@angular/cdk/portal';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

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
export class EdSelectComponent {
  selected = model<any>();
  options = contentChildren<EdSelectOptionComponent>(EdSelectOptionComponent);

  contentTemplate = viewChild<CdkPortal>(CdkPortal);

  private overlayRef: OverlayRef | null = null;

  private elementRef = inject<any>(ElementRef);

  change = output<any>();

  overlay = inject(Overlay);

  label = computed(() => {
    const selectedOption = this.selectedOption();
    return selectedOption ? selectedOption.elementRef.nativeElement.textContent.trim() : 'Select...';
  });

  selectedOption = computed(() => {
    return this.options().find((o) => o.value === this.selected());
  });

  constructor() {
    effect(() => {
      console.log(this.options());
    });

    effect(() => {
      console.log('selected changed', this.selected());
      const selected = this.selectedOption();
      this.change.emit(selected ? selected.value : null);
      this.hide();
    });
  }

  toggleDropdown() {
    console.log('toggleDropdown');
    this.showDropdown();
  }

  public showDropdown(): void {
    this.overlayRef = this.overlay.create(this.getOverlayConfig());
    this.overlayRef.attach(this.contentTemplate());
    //this.syncWidth();
    this.overlayRef.backdropClick().subscribe(() => this.hide());
    //this.showing = true;
  }

  hide() {
    console.log('hide');
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    //this.showing = false;
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
