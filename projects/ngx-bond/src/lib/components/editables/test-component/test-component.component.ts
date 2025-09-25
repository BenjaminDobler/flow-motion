import { afterEveryRender, ChangeDetectionStrategy, Component, effect, ElementRef, forwardRef, inject, input, output, signal, viewChild, ViewChild, ViewContainerRef } from '@angular/core';
import { NgBondContainerHost } from '../../../types/types';
import { NgBondProperty } from '../../ng-bond-property/ng-bond-property';
import { NgBondContainer, SelectionManager } from '@richapps/ngx-bond';
@Component({
  selector: 'app-test-component',
  imports: [NgBondProperty],
  templateUrl: './test-component.component.html',
  styleUrl: './test-component.component.scss',
  providers: [{ provide: NgBondContainerHost, useExisting: forwardRef(() => TestComponentComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(dblclick)': 'onDblClick($event)',
  },
})
export class TestComponentComponent extends NgBondContainerHost {
  // backgroundColor = input('#00ff00');

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
    return TestComponentComponent.inspectableProperties;
  }

  type = 'container';

  el = inject(ElementRef);
  @ViewChild('insert_slot', { read: ViewContainerRef })
  insertSlot!: ViewContainerRef;

  rand = Math.floor(Math.random() * 1000);

  selection = inject(SelectionManager);

  textareaEl = viewChild<ElementRef<HTMLTextAreaElement>>('textArea');

  text = signal('');
  textChanged = output<string>();
  fontSize = signal('16px');
  fontSizeChanged = output<string>();
  color = signal('white');
  colorChanged = output<string>();
  fontWeight = signal<'normal' | 'bold' | 'bolder' | 'lighter' | number>('normal');
  fontWeightChanged = output<'normal' | 'bold' | 'bolder' | 'lighter' | number>();

  constructor() {
    super();

    effect(() => {
      const text = this.text();
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
    this.selection.unselectAll();
    evt.stopPropagation();
    evt.preventDefault();
    this.focusTextarea();
  }

  private focusTextarea() {
    const textareaEl = this.textareaEl();

    if (textareaEl) {
      textareaEl.nativeElement.focus();
      textareaEl.nativeElement.selectionStart = textareaEl.nativeElement.value.length;
    }
  }
}
