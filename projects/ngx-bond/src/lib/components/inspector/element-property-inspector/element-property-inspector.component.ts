import { Component, computed, inject } from '@angular/core';
import { ComponentFactory } from '../../../services/component.factory';
import { FormsModule } from '@angular/forms';
import { SelectionManager } from '@richapps/ngx-bond';

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
  imports: [FormsModule],
  templateUrl: './element-property-inspector.component.html',
  styleUrl: './element-property-inspector.component.scss',
})
export class ElementPropertyInspectorComponent {
  componentFactory: ComponentFactory = inject(ComponentFactory);
  selectionManager = inject(SelectionManager);

  componentGroups = computed(() => {
    let groups: any[] = [];
    const elements = this.selectionManager.selectionTargets();
    if (elements.length > 0) {
      const element = elements[0];
      const instance = this.getComponentInstance(element);
      console.log('instance', instance);
      if (instance.inspectableProperties) {
        const instanceGroups = groupBy(instance.inspectableProperties, (prop) => {
          return prop.group?.name || 'ungrouped';
        });
        groups = Array.from(instanceGroups, ([name, value]) => {
          return {
            name,
            props: value,
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
    console.log('groups');
    console.log(groups);
    return groups;
  });

  getDirectives(element: any) {
    return this.componentFactory.containerElementMap.get(element)?.directives;
  }

  getComponentInstance(element: any) {
    return this.componentFactory.containerElementMap.get(element)?.instance;
  }
}
