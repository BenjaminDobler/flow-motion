import { CdkMenu, CdkMenuTrigger } from '@angular/cdk/menu';
import { Component, inject, input, TemplateRef, ViewChild } from '@angular/core';
import { CONTEXT_CLOSE, CONTEXT_INIT_DATA, CONTEXT_MENU_DATA, CONTEXT_SELECTED } from '../context-menu';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'context-menu-dialog',
  imports: [CdkMenu, CdkMenuTrigger, NgTemplateOutlet],
  templateUrl: './context-menu-dialog.html',
  styleUrl: './context-menu-dialog.scss',
})
export class ContextMenuDialog {
  @ViewChild('subMenuTemplate', { static: true }) subMenuTemplate!: TemplateRef<any>;

  data: any = inject(CONTEXT_MENU_DATA);
  close: any = inject(CONTEXT_CLOSE);
  init: any = inject(CONTEXT_INIT_DATA);
  selected: any = inject(CONTEXT_SELECTED);

  subMenuData = input<any>();

  overTrigger(trigger: any) {
    console.log('over trigger', trigger);
    trigger.trigger();
  }

  opened?: CdkMenuTrigger;
  hover(t?: CdkMenuTrigger) {
    if (this.opened) {
      this.opened.close();
      this.opened = undefined;
    }
    if (t) {
      t.open();
      this.opened = t;
    }
  }

  clicked(item: any) {
    console.log('clicked', item);
    if (item.action) {
      item.action(this.init);
    }
    this.selected(item);
    this.close(item);
  }

  closed(e: any) {
    console.log('closed', e);
  }
}
