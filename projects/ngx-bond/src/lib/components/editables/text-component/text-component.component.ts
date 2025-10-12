import { afterNextRender, Component, effect, ElementRef, inject, input, model, output, signal, viewChild, ViewChild, ViewContainerRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgBondContainer, NgBondProperty, SelectionManager } from '@richapps/ngx-bond';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'lib-text-component',
  imports: [FormsModule, NgBondProperty],
  templateUrl: './text-component.component.html',
  styleUrl: './text-component.component.scss',
  host: {
    '(dblclick)': 'onDblClick($event)',
    '[class.editable]': 'editable()',
  },
})
export class TextComponentComponent {
  selection = inject(SelectionManager);
  static inspectableProperties = [
    {
      name: 'text',
      type: 'string'
    },
    {
      name: 'fontSize',
      type: 'string'
    },
    {
      name: 'color',
      type: 'color'
    },
    {
      name: 'fontWeight',
      type: 'fontWeight'
    },
  ];

  get inspectableProperties() {
    return TextComponentComponent.inspectableProperties;
  }

  el = inject(ElementRef);
  @ViewChild('insert_slot', { read: ViewContainerRef })
  insertSlot!: ViewContainerRef;

  rand = Math.floor(Math.random() * 1000);

  type = 'text';

  text = model('Hello World');

  fontSize = model('16px');

  color = model('white');

  fontWeight = model('normal');

  textInput = viewChild<ElementRef<HTMLInputElement>>('textInput');

  container = inject(NgBondContainer);

  editable = signal(false);

  constructor() {

    if (this.container.displayName() === '') {
      this.container.displayName.set('Text');
    }

    effect(() => {
      const t = this.text();
      const s = this.fontSize();
      const w = this.fontWeight();
      setTimeout(() => {
        this.measureSize();
      });
    });

    this.container.onInitialized.subscribe(() => {
      setTimeout(() => {
        this.measureSize();
      }, 2000);
    });

    const dbl$ = fromEvent(this.el.nativeElement, 'dblclick');
    dbl$.subscribe(() => {
      this.editable.set(!this.editable());
    });

    effect(() => {
      const editable = this.editable();
      if (editable) {
        this.container.disable();
        //this.textInput()?.nativeElement.setAttribute('disabled', 'true');
      } else {
        this.container.enable();
        //this.textInput()?.nativeElement.removeAttribute('disabled');
      }
    });
  }

  private measureSize() {
    const rect = this.textInput()?.nativeElement.getBoundingClientRect();
    this.container.width.set(rect?.width || 100);
    this.container.height.set(rect?.height || 100);
  }

  afterViewInit() {
    // const rect = this.textInput()?.nativeElement.getBoundingClientRect();
    // this.container.width.set(rect?.width || 100);
    // this.container.height.set(rect?.height || 100);
  }

  onDblClick(evt: MouseEvent) {
    this.selection.disabled.set(true);
    this.selection.unselectAll();
    evt.stopPropagation();
    evt.preventDefault();
    // if (this.path()) {
    //   const path = this.path();
    //   path.canvas.selectedPathElement = path;
    //   this.selection.unselectAll();
    //   evt.stopPropagation();
    //   evt.preventDefault();
    // }
  }
}
