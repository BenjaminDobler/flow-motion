import { Component, computed, effect, inject } from '@angular/core';
import { ComponentFactory } from '../../../services/component.factory';
import { FormsModule } from '@angular/forms';
import { EdSelectComponent, EdSelectOptionComponent, InputComponent, ColorComponent } from '@richapps/ui-components';
import { InspectableProperty, SelectionManager } from '../../../../public-api';

function groupBy(list: any[], keyGetter: (item: any) => string) {
  const map = new Map();
  list.forEach((item) => {
    const key = keyGetter(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  return map;
}

@Component({
  selector: 'element-property-inspector',
  imports: [FormsModule, InputComponent, EdSelectComponent, EdSelectOptionComponent, ColorComponent],
  templateUrl: './element-property-inspector.component.html',
  styleUrl: './element-property-inspector.component.scss',
})
export class ElementPropertyInspectorComponent {
  componentFactory: ComponentFactory = inject(ComponentFactory);
  selectionManager = inject(SelectionManager);

  categories = computed(() => {
    const categories: any[] = [];

    const elements = this.selectionManager.selectionTargets();

    const world = this.componentFactory.world;
    let worldInspectableProps: any[] = [];
    if (world) {
      worldInspectableProps = world.inspectableProperties.map((prop: InspectableProperty) => ({ ...prop, target: world }));
    }

    let allInspectableProperties: any[] = [];
    allInspectableProperties.push(...worldInspectableProps);

    if (elements.length > 0) {
      const componentInstance = this.getComponentInstance(elements[0]);
      const directiveInstances = this.getDirectives(elements[0]);

      allInspectableProperties.push(...(componentInstance?.inspectableProperties.map((prop: InspectableProperty) => ({ ...prop, target: componentInstance })) || []));
      allInspectableProperties.push(...(directiveInstances?.flatMap((dir) => dir.inspectableProperties.map((prop: InspectableProperty) => ({ ...prop, target: dir }))) || []));
    }

    const categoryMap = groupBy(allInspectableProperties, (prop) => prop.category || 'ungrouped');

    categories.push(
      ...Array.from(categoryMap, ([name, value]) => {
        const groupMap = groupBy(value, (prop) => prop.group?.name || 'ungrouped');

        const groups = Array.from(groupMap, ([name, value]) => {
          return {
            name,
            props: value,
          };
        });
        return {
          name,
          groups,
        };
      })
    );

    return categories;
  });

  private getDirectives(element: any) {
    return this.componentFactory.containerElementMap.get(element)?.directives;
  }

  private getComponentInstance(element: any) {
    return this.componentFactory.containerElementMap.get(element)?.instance;
  }

  constructor() {
  }
}
