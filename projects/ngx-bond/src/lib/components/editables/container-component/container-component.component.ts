import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  ElementRef,
  inject,
  input,
  model,
  viewChild,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { NgBondProperty } from '../../ng-bond-property/ng-bond-property';
import { InspectableProperty, NgBondContainer, SelectionManager } from '@richapps/ngx-bond';
import { FormsModule } from '@angular/forms';
import { ContextMenu } from '@richapps/ui-components';
import { DuplicateService } from '../../dialogs/duplicate-dialog/duplicate.service';
@Component({
  selector: 'container-component',
  imports: [NgBondProperty, FormsModule],
  templateUrl: './container-component.component.html',
  styleUrl: './container-component.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(dblclick)': 'onDblClick($event)',
  },
  hostDirectives: [{
    directive: ContextMenu,
    outputs: ['contextMenuClosed', 'contextMenuSelected']
  }]
})
export class ContainerComponent {
  static inspectableProperties: InspectableProperty[] = [
    {
      category: 'Typography',
      name: 'text',
      type: 'string',
    },
    {
      category: 'Typography',
      name: 'fontSize',
      type: 'number',
      suffix: 'px',
      group: {
        name: 'fontSizeWeight',
      },
    },
    {
      category: 'Typography',
      name: 'color',
      type: 'color',
    },
    {
      category: 'Typography',
      name: 'fontWeight',
      type: 'select',
      group: {
        name: 'fontSizeWeight',
      },
      options: ['normal', 'bold', 'bolder', 'lighter', 100, 200, 300, 400, 500, 600, 700, 800, 900],
    },
  ];


  contextMenuData = input<any[]>([
    { label: 'Delete', action: () => console.log('delete') },
    { label: 'Advanced Duplicate', action: () => this.duplicateService.openDuplicateDialog(this.container) }
  ]);

  get inspectableProperties() {
    return ContainerComponent.inspectableProperties;
  }

  type = 'container';

  duplicateService = inject(DuplicateService);

  el = inject(ElementRef);
  @ViewChild('insert_slot', { read: ViewContainerRef })
  insertSlot!: ViewContainerRef;

  rand = Math.floor(Math.random() * 1000);

  selection = inject(SelectionManager);

  textareaEl = viewChild<ElementRef<HTMLTextAreaElement>>('textArea');

  text = model('');
  fontSize = model(16);
  color = model('white');
  fontWeight = model<'normal' | 'bold' | 'bolder' | 'lighter' | number>('normal');
  container = inject(NgBondContainer);

  contextMenu = inject(ContextMenu);

  constructor() {
    this.contextMenu.contextMenu = this.contextMenuData;
  }

  onDblClick(evt: MouseEvent) {
    this.selection.disabled.set(true);

    //this.selection.unselectAll();
    evt.stopPropagation();
    evt.preventDefault();
    this.focusTextarea();
  }

  detachChild(viewRef: ComponentRef<any>) {
    const index = this.insertSlot.indexOf(viewRef.hostView);
    this.insertSlot.detach(index);
  }

  private focusTextarea() {
    const textareaEl = this.textareaEl();

    if (textareaEl) {
      textareaEl.nativeElement.focus();
      textareaEl.nativeElement.selectionStart = textareaEl.nativeElement.value.length;
    }
  }
}
