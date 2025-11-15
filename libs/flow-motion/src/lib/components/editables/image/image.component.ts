import { ChangeDetectionStrategy, Component, computed, inject, model } from '@angular/core';
import { FMProperty } from '../../fm-property/fm-property';
import { FMContainer } from '../../fm-container/fm-container';
import { EditableComponent } from '../editable.component';


@Component({
  selector: 'editable-image',
  imports: [FMProperty],
  templateUrl: './image.component.html',
  styleUrl: './image.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageComponent implements EditableComponent {
  static inspectableProperties = [
    {
      name: 'src',
      type: 'string',
    },
  ];
  src = model<string>('');

  type = 'image';

  rand = Math.floor(Math.random() * 1000);

  container = inject(FMContainer);

  linkScale = computed(() => {
    const scale = this.container.ngBondService?.scale() || 1;
    return 1 / scale;
  });

  get inspectableProperties() {
    return ImageComponent.inspectableProperties;
  }

  constructor() {
    if (this.container.displayName() === '') {
      this.container.displayName.set('Image ');
    }
  }
}
