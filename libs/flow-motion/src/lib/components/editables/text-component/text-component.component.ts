import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, model, signal, viewChild, ViewChild, ViewContainerRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectionManager } from '../../../services/selection.manager';
import { FMProperty } from '../../fm-property/fm-property';
import { FMContainer } from '../../fm-container/fm-container';
import { EditableComponent } from '../editable.component';
@Component({
  selector: 'editable-text-component',
  imports: [FormsModule, FMProperty],
  templateUrl: './text-component.component.html',
  styleUrl: './text-component.component.scss',
  host: {
    '[class.editable]': 'editable()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextComponentComponent implements EditableComponent {
  selection = inject(SelectionManager);
  container = inject(FMContainer);
  static inspectableProperties = [
    {
      name: 'text',
      type: 'string',
    },
    {
      name: 'fontSize',
      type: 'string',
    },
    {
      name: 'color',
      type: 'color',
    },
    {
      name: 'fontWeight',
      type: 'fontWeight',
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

  bgColor = model('transparent');

  textInput = viewChild<ElementRef<HTMLInputElement>>('textInput');

  editable = computed(() => {
    return this.container.editMode();
  });

  linkScale = computed(() => {
    const scale = this.container.ngBondService?.scale() || 1;
    return 1 / scale;
  });

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
  }

  private measureSize() {
    const rect = this.textInput()?.nativeElement.getBoundingClientRect();
    this.container.width.set(rect?.width || 100);
    this.container.height.set(rect?.height || 100);
  }
}
