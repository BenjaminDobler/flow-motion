import { afterNextRender, Component, effect, ElementRef, inject, input, model, output, signal, viewChild, ViewChild, ViewContainerRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgBondContainer, NgBondContainerHost } from '@richapps/ngx-bond';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'lib-text-component',
  imports: [FormsModule],
  templateUrl: './text-component.component.html',
  styleUrl: './text-component.component.scss',
  host: {
    '[class.editable]': 'editable()',
  },
})
export class TextComponentComponent extends NgBondContainerHost {
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
      type: 'fontWeight',
      setterName: 'fontWeight',
      isSignal: true,
      event: 'fontWeightChanged',
      serializable: true,
    },
  ];

  get inspectableProperties() {
    return TextComponentComponent.inspectableProperties;
  }

  el = inject(ElementRef);
  @ViewChild('insert_slot', { read: ViewContainerRef })
  insertSlot!: ViewContainerRef;


  type = 'text';

  text = model('Hello World');
  textChanged = output<string>();

  fontSize = model('16px');
  fontSizeChanged = output<string>();

  color = model('white');
  colorChanged = output<string>();

  fontWeight = model('normal');
  fontWeightChanged = output<string>();



  textInput = viewChild<ElementRef<HTMLInputElement>>('textInput');

  container = inject(NgBondContainer);

  editable = signal(false);

  constructor() {
    super();
    effect(() => {
      this.textChanged.emit(this.text());
      setTimeout(() => {
        this.measureSize();
      });
    });

    effect(() => {
      this.fontSizeChanged.emit(this.fontSize());
      console.log('Font size changed:', this.fontSize());
      setTimeout(() => {
        this.measureSize();
      });
    });

    effect(() => {
      this.colorChanged.emit(this.color());
      console.log('Color changed:', this.color());
      setTimeout(() => {
        this.measureSize();
      });
    });

    effect(() => {
      this.fontWeightChanged.emit(this.fontWeight());
      setTimeout(() => {
        this.measureSize();
      });
    });

    this.container.onInitialized.subscribe(() => {
      console.log('Container initialized in text component', this.textInput()?.nativeElement);

      setTimeout(() => {
        this.measureSize();
      }, 2000);
    });

    const dbl$ = fromEvent(this.el.nativeElement, 'dblclick');
    dbl$.subscribe(() => {
      console.log('Double clicked');
      this.editable.set(!this.editable());
    });

    effect(() => {
      const editable = this.editable();
      console.log('Editable state changed:', editable);
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
}
