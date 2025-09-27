import { afterEveryRender, ChangeDetectionStrategy, Component, ComponentRef, effect, ElementRef, forwardRef, inject, input, model, output, signal, viewChild, ViewChild, ViewContainerRef } from '@angular/core';
import { NgBondProperty } from '../../ng-bond-property/ng-bond-property';
import { NgBondContainer, SelectionManager } from '@richapps/ngx-bond';
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

  static inspectableProperties = [
    {
      name: 'text',
      type: 'string',
      setterName: 'text',
      isSignal: true,
      event: 'textChanged',
      serializable: true,
    },
    {
      name: 'fontSize',
      type: 'string',
      setterName: 'fontSize',
      isSignal: true,
      event: 'fontSizeChanged',
      serializable: true,
    },
    {
      name: 'color',
      type: 'color',
      setterName: 'color',
      isSignal: true,
      event: 'colorChanged',
      serializable: true,
    },
    {
      name: 'fontWeight',
      type: 'select',
      setterName: 'fontWeight',
      isSignal: true,
      event: 'fontWeightChanged',
      serializable: true,
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
  textChanged = output<string>();
  fontSize = model('16px');
  fontSizeChanged = output<string>();
  color = model('white');
  colorChanged = output<string>();
  fontWeight = model<'normal' | 'bold' | 'bolder' | 'lighter' | number>('normal');
  fontWeightChanged = output<'normal' | 'bold' | 'bolder' | 'lighter' | number>();
  container = inject(NgBondContainer);

  constructor() {
    effect(() => {
      const text = this.text();
      console.log('Text changed:', text);
      this.textChanged.emit(text);
    });

    effect(() => {
      const fontSize = this.fontSize();
      this.fontSizeChanged.emit(fontSize);
    });

    effect(() => {
      const color = this.color();
      this.colorChanged.emit(color);
    });

    effect(() => {
      const fontWeight = this.fontWeight();
      this.fontWeightChanged.emit(fontWeight);
    });
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
