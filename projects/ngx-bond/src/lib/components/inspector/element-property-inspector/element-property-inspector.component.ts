import { Component, computed, effect, inject } from '@angular/core';
import { ComponentFactory } from '../../../services/component.factory';
import { FormsModule } from '@angular/forms';
import { InspectableProperty, SelectionManager } from '@richapps/ngx-bond';
import { EdSelectComponent, EdSelectOptionComponent, InputComponent, ColorComponent } from '@richapps/ui-components';

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
    if (elements.length > 0) {
      const componentInstance = this.getComponentInstance(elements[0]);
      const directiveInstances = this.getDirectives(elements[0]);

      const allInspectableProperties = [
        ...(componentInstance?.inspectableProperties.map((prop: InspectableProperty) => ({ ...prop, target: componentInstance })) || []),
        ...(directiveInstances?.flatMap((dir) => dir.inspectableProperties.map((prop: InspectableProperty) => ({ ...prop, target: dir }))) || []),
      ];

      const categoryMap = groupBy(allInspectableProperties, (prop) => prop.category || 'ungrouped');
      
      categories.push(...Array.from(categoryMap, ([name, value]) => {
        const groupMap = groupBy(value, (prop) => prop.group?.name || 'ungrouped');

        const groups = Array.from(groupMap, ([name, value]) => {
          console.log('group', name, value);
          return {
            name,
            props: value,
            // component: instance
          };
        });
        return {
          name,
          groups
        };
      }));

    }

    return categories;


  });

  componentGroups = computed(() => {
    let groups: any[] = [];
    const elements = this.selectionManager.selectionTargets();
    if (elements.length > 0) {
      const element = elements[0];
      const instance = this.getComponentInstance(element);
      if (instance && instance.inspectableProperties) {
        const instanceGroups = groupBy(instance.inspectableProperties, (prop) => {
          return prop.group?.name || 'ungrouped';
        });
        groups = Array.from(instanceGroups, ([name, value]) => {
          return {
            name,
            props: value,
            component: instance
          };
        });
      }
    }
    return groups;
  });


  directiveGroups = computed(()=>{
    let groups: any[] = [];
    const elements = this.selectionManager.selectionTargets();
    if (elements.length > 0) {
      const element = elements[0];
      const directives = this.getDirectives(element);
      if (directives) {

        directives.forEach((dir)=>{
          const dirGroups = groupBy(dir.inspectableProperties, (prop) => {
            return prop.group?.name || 'ungrouped';
          });
          groups.push(...Array.from(dirGroups, ([name, value]) => {
            return {
              name,
              directive: dir,
              props: value,
            };
          }));
        });
        
      }
    }
    return groups;
  });

  getDirectives(element: any) {
    return this.componentFactory.containerElementMap.get(element)?.directives;
  }

  getComponentInstance(element: any) {
    return this.componentFactory.containerElementMap.get(element)?.instance;
  }


  constructor() {
    effect(()=>{
      console.log('categories', this.categories());
    })
  }


  onSelectChanged(e: any) {
    console.log('select changed', e);
  }
  
}
