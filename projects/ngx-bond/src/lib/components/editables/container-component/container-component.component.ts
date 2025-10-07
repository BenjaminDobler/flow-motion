import {
  afterEveryRender,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { NgBondProperty } from '../../ng-bond-property/ng-bond-property';
import { InspectableProperty, NgBondContainer, SelectionManager } from '@richapps/ngx-bond';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'container-component',
  imports: [NgBondProperty, FormsModule],
  templateUrl: './container-component.component.html',
  styleUrl: './container-component.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(dblclick)': 'onDblClick($event)',
  },
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

  get inspectableProperties() {
    return ContainerComponent.inspectableProperties;
  }

  type = 'container';

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

  constructor() {}

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
