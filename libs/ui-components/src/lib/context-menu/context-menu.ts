import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { Directive, inject, InjectionToken, Injector, input, output, ViewContainerRef } from '@angular/core';
import { filter, fromEvent, Subscription, take } from 'rxjs';
import { ContextMenuDialog } from './context-menu-dialog/context-menu-dialog';

export const CONTEXT_MENU_DATA = new InjectionToken<string>('CONTEXT_MENU_DATA');
export const CONTEXT_CLOSE = new InjectionToken<string>('CONTEXT_CLOSE');
export const CONTEXT_INIT_DATA = new InjectionToken<string>('CONTEXT_INIT_DATA');
export const CONTEXT_SELECTED = new InjectionToken<string>('CONTEXT_SELECTED');

@Directive({
  selector: '[contextMenu]',
  host: {
    '(contextmenu)': 'open($event)',
    '(click)': 'onClick($event)',
  },
})
export class ContextMenu {
  contextMenu = input<any>();

  contextMenuType = input<'menu' | 'context'>('context');

  contextMenuClosed = output<void>();
  contextMenuSelected = output<any>();

  overlayRef: OverlayRef | null = null;

  overlay = inject(Overlay);
  viewContainerRef = inject(ViewContainerRef);
  sub: Subscription | null = null;

  open(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    console.log('open context menu', this.contextMenu, event);

    this.close();
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo({ x: event.x, y: event.y })
      .withPositions([
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
        },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });

    const contextMenuPortal = new ComponentPortal(
      ContextMenuDialog,
      null,
      Injector.create({
        providers: [
          { provide: CONTEXT_MENU_DATA, useValue: this.contextMenu() },
          { provide: CONTEXT_CLOSE, useValue: () => this.close() },
          { provide: CONTEXT_INIT_DATA, useValue: event },
          { provide: CONTEXT_SELECTED, useValue: (item: any) => this.contextMenuSelected.emit({ data: item, initEvent: event }) },
        ],
      })
    );
    this.overlayRef.attach(contextMenuPortal);

    this.sub = fromEvent<MouseEvent>(document, 'click')
      .pipe(
        filter((event) => {
          const clickTarget = event.target as HTMLElement;
          return !!this.overlayRef && !this.overlayRef.overlayElement.contains(clickTarget);
        }),
        take(1)
      )
      .subscribe(() => this.close());
  }

  onClick(event: MouseEvent) {
    if (this.contextMenuType() === 'menu') {
      this.open(event);
    }
  } 

  close(selectedItem?: any) {
    console.log('close context menu', selectedItem);
    this.contextMenuClosed.emit();
    this.sub && this.sub.unsubscribe();
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
}
