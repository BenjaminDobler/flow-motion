import { ComponentRef, inject, Injectable, inputBinding, outputBinding, ViewContainerRef } from '@angular/core';
import { NgBondContainer, NgBondWorld, SelectionManager } from '@richapps/ngx-bond';
import { Subject } from 'rxjs';
import { BackgroundColorPropertyDirective } from '../directives/backgroundColorProperty.directive';
import { TestComponentComponent } from '../components/editables/test-component/test-component.component';
import { ImageComponent } from '../components/editables/image/image.component';




const componentNameToClass = {
  '_TestComponentComponent': TestComponentComponent,
  '_ImageComponent': ImageComponent
};



@Injectable()
export class ComponentFactory {
  selectionManager = inject(SelectionManager);
  componentAdded = new Subject<string>();
  propertyChanged = new Subject<{ id: string; property: string; value: any }>();
  componentCount = 0;
  containerElementMap = new Map<NgBondContainer, { instance: any; directives: any[]; propertyDirectiveMap: Map<string, any>; componentRef: any }>();
  world?: NgBondWorld;

  addComponent(componentClass: { new (...args: any[]): void } = TestComponentComponent, inputs: any = {}, additionalDirectives: any[] = []): ComponentRef<any> | undefined {
    const id = 'some-id-' + this.componentCount;
    this.componentCount++;

    const directives = [NgBondContainer, BackgroundColorPropertyDirective];

    const directiveSetup = directives.map((d) => {
      const bindings = d.inspectableProperties
        .filter((p) => p.event)
        .map((p) => {
          return outputBinding(p.event as string, (evt: any) => {
            this.propertyChanged.next({
              id,
              property: p.setterName,
              value: evt,
            });
          });
        });

      return {
        type: d,
        bindings,
      };
    });

    if (!this.world) {
      console.error('World is not set. Cannot add component.');
      return;
    }

    const componentRef = this.world?.worldHost.createComponent(componentClass, {
      directives: directiveSetup,
    });

    if ((componentRef.instance as any).inspectableProperties) {
      for (const prop of (componentRef.instance as any).inspectableProperties) {
        (componentRef.instance as any)[prop.event].subscribe((evt: any) => {
          this.propertyChanged.next({
            id,
            property: prop.setterName,
            value: evt,
          });
        });
      }
    }

    const bondContainerInstance = componentRef.injector.get(NgBondContainer);
    // const backgroundColorDirectiveInstance = componentRef.injector.get(BackgroundColorPropertyDirective);

    const directiveInstances = directives.map((d) => componentRef.injector.get(d as any));

    this.containerElementMap.set(bondContainerInstance, {
      instance: componentRef.instance,
      propertyDirectiveMap: new Map<string, any>(),
      directives: directiveInstances,
      componentRef,
    });

    directiveInstances.forEach((dInstance: any) => {
      dInstance.inspectableProperties.forEach((p: any) => {
        this.containerElementMap.get(bondContainerInstance)?.propertyDirectiveMap.set(p.setterName, dInstance);
      });
    });

    if ((componentClass as any).inspectableProperties) {
      (componentClass as any).inspectableProperties.forEach((p: any) => {
        this.containerElementMap.get(bondContainerInstance)?.propertyDirectiveMap.set(p.setterName, componentRef.instance);
      });
    }

    componentRef.setInput('bondcontainer', id);
    componentRef.setInput('positioning', 'transform');


    // additionalDirectives.forEach((dir) => {   
    //   dir.properties.forEach(()=>{

    //   });
    // });


    for (const key in inputs) {
      componentRef.setInput(key, inputs[key]);
    }

    this.componentAdded.next(id);
    return componentRef;
  }

  serializeComponents() {
    const serialized: any = {
      elements: [],
    };
    this.containerElementMap.forEach((value, key) => {
      // serialized[key] = {
      //   instance: value.instance,
      //   propertyDirectiveMap: Array.from(value.propertyDirectiveMap.entries()),
      //   directives: value.directives,
      // };

      const el: any = {};
      el.name = value.instance.constructor.name;
      el.elementProperties = [];
      el.directives = [];
      el.id = key.id();

      console.log('value: ', value.instance.constructor.name);

      console.log('directives: ', value.directives);

      value.instance?.inspectableProperties?.forEach((prop: any) => {
        console.log('prop', prop.setterName);
        if (prop.serializable) {
          try {
            if (prop.isSignal) {
              console.log('prop', prop.setterName, value.instance[prop.setterName]());
              el.elementProperties.push({
                name: prop.setterName,
                value: value.instance[prop.setterName](),
              });
            } else {
              console.log('prop', prop.setterName, value.instance[prop.setterName]);
              el.elementProperties.push({
                name: prop.setterName,
                value: value.instance[prop.setterName],
              });
            }
          } catch (error) {
            console.error('Error serializing property:', prop.setterName, error);
          }
        }
      });

      // Serialize the directives if needed
      value.directives.forEach((directive: any) => {
        console.log('directive: ', directive.constructor.name);
        el.directives.push({
          name: directive.constructor.name,
          properties: [],
        });

        directive.inspectableProperties.forEach((prop: any) => {
          // serialized[key][prop.setterName] = directive[prop.setterName];
          console.log('prop', prop.setterName);
          if (prop.serializable) {
            try {
              if (prop.isSignal) {
                el.directives[el.directives.length - 1].properties.push({
                  name: prop.setterName,
                  value: directive[prop.setterName](),
                });
                console.log('prop', prop.setterName, directive[prop.setterName]());
              } else {
                el.directives[el.directives.length - 1].properties.push({
                  name: prop.setterName,
                  value: directive[prop.setterName],
                });
                console.log('prop', prop.setterName, directive[prop.setterName]);
              }
            } catch (error) {
              console.error('Error serializing property:', prop.setterName, error);
            }
          }
        });
      });
      serialized.elements.push(el);
    });
    console.log('serialized: ', JSON.stringify(serialized, null, 2));

    localStorage.setItem('serialized', JSON.stringify(serialized, null, 2));
    return serialized;
  }

  loadSerialized() {
    const serialized = localStorage.getItem('serialized');
    if (!serialized) {
      return;
    }
    const data = JSON.parse(serialized);

    console.log(data);

    data.elements.forEach((element: any)=>{
      console.log('add component ', element.name);
      const componentClass = componentNameToClass[element.name as keyof typeof componentNameToClass];

      let componentProps = element.elementProperties.reduce((acc: any, prop: any) => {
        acc[prop.name] = prop.value;
        return acc;
      }, {});

      element.directives.forEach((dir: any)=>{
        const directiveProps = dir.properties.reduce((acc: any, prop: any) => {
          acc[prop.name] = prop.value;
          return acc;
        }, {});

        componentProps = { ...componentProps, ...directiveProps };
      });

      this.addComponent(componentClass, componentProps);
    });

  }

  groupSelected() {
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;

    console.log('selection targets ', this.selectionManager.selectionTargets());

    this.selectionManager.selectionTargets().forEach((target) => {
      console.log('target position: ', target.x(), target.y(), target.width(), target.height());
      minX = Math.min(minX, target.x());
      minY = Math.min(minY, target.y());
      maxX = Math.max(maxX, target.x() + target.width());
      maxY = Math.max(maxY, target.y() + target.height());

      target.parent()?.removeChild(target);
    });

    const group = this.addComponent();
    if (!group) {
      console.error('Failed to create group component');
      return;
    }
    const bondContainerInstance = group.injector.get(NgBondContainer);

    bondContainerInstance.x.set(minX);
    bondContainerInstance.y.set(minY);
    bondContainerInstance.width.set(maxX - minX);
    bondContainerInstance.height.set(maxY - minY);

    const container = this.containerElementMap.get(bondContainerInstance as NgBondContainer);

    if (container) {
      const colorDirective = container.directives.find((d: any) => d instanceof BackgroundColorPropertyDirective);
      if (colorDirective) {
        colorDirective.backgroundColor = '#111111'; // Set a default color for the group
        colorDirective.borderRadius.set(0); // Set a default border radius
      }
    }

    setTimeout(() => {
      this.selectionManager.selectionTargets().forEach((target) => {
        const container = this.containerElementMap.get(target as NgBondContainer);
        if (container) {
          const compRef: ComponentRef<any> = container.componentRef;
          const i = this.world?.worldHost.indexOf(compRef.hostView);
          this.world?.worldHost.detach(i);
          this.world?.removeChild(compRef.instance);

          (group.instance as unknown as TestComponentComponent).insertSlot.insert(compRef.hostView);
          target.parentContainer = bondContainerInstance;
          target.parent.set(bondContainerInstance);
          bondContainerInstance.addChild(target);
          target.x.set(target.x() - minX);
          target.y.set(target.y() - minY);
        }
      });
    }, 100);
  }
}
