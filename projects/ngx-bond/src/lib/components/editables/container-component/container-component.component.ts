import { ChangeDetectionStrategy, Component, ComponentRef, computed, effect, ElementRef, inject, input, model, viewChild, ViewChild, ViewContainerRef } from '@angular/core';
import { NgBondProperty } from '../../ng-bond-property/ng-bond-property';
import { FormsModule } from '@angular/forms';
import { ContextMenu } from '@richapps/ui-components';
import { DuplicateService } from '../../dialogs/duplicate-dialog/duplicate.service';
import { InspectableProperty } from '../../../types/types';
import { NgBondContainer, SelectionManager } from '../../../../public-api';

@Component({
  selector: 'editable-container',
  imports: [NgBondProperty, FormsModule],
  templateUrl: './container-component.component.html',
  styleUrl: './container-component.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: ContextMenu,
      outputs: ['contextMenuClosed', 'contextMenuSelected'],
    },
  ],
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
    }
  ];

  contextMenuData = input<any[]>([
    { label: 'Delete', action: () => console.log('delete') },
    { label: 'Advanced Duplicate', action: () => this.duplicateService.openDuplicateDialog(this.container) },
  ]);

  get inspectableProperties() {
    return ContainerComponent.inspectableProperties;
  }

  type = 'container';

  duplicateService = inject(DuplicateService);

  linkScale = computed(() => {
    const scale = this.container.ngBondService?.scale() || 1;
    return 1 / scale;
  });

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

    if (this.container.displayName() === '') {
      this.container.displayName.set('Container ');
    }

    effect(() => {
      const e = this.container.editMode();
      if (e) {
        setTimeout(() => {
          this.focusTextarea();
        });
      } else {
        this.textareaEl()?.nativeElement.blur();
      }
    });

    
    let isFirstOffsetChange = true;
    effect(() => {
      const offset = this.container.connectionOffset();
      if (isFirstOffsetChange) {
        isFirstOffsetChange = false;
        return;
      }
      this.el.nativeElement.style.setProperty('--connector-padding', `${offset}px`);
      this.container.updatePosition();
      this.container.children().forEach(child => {
        if (child.type === 'link-target') {
          (child as NgBondContainer).updatePosition();
          //console.log('link target to update ', child);
        }   
      });
    
    })
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
