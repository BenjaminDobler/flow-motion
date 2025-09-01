import { ComponentRef, inject, Injectable, inputBinding, outputBinding, ViewContainerRef } from '@angular/core';
import { NgBondContainer, NGBondItem, NgBondWorld, SelectionManager } from '@richapps/ngx-bond';
import { Subject } from 'rxjs';
import { BackgroundColorPropertyDirective } from '../directives/backgroundColorProperty.directive';
import { TestComponentComponent } from '../components/editables/test-component/test-component.component';
import { ImageComponent } from '../components/editables/image/image.component';
import { TextComponentComponent } from '../components/editables/text-component/text-component.component';

const componentNameToClass = {
  _TestComponentComponent: TestComponentComponent,
  _ImageComponent: ImageComponent,
  _TextComponentComponent: TextComponentComponent,
};

@Injectable()
export class ComponentFactory {
  selectionManager = inject(SelectionManager);
  componentAdded = new Subject<string>();
  propertyChanged = new Subject<{ id: string; property: string; value: any }>();
  componentCount = 0;
  containerElementMap = new Map<NgBondContainer, { instance: any; directives: any[]; propertyDirectiveMap: Map<string, any>; componentRef: any }>();
  world?: NgBondWorld;

  constructor() {
    this.selectionManager.componentFactory = this;
  }

  addComponent(componentClass: { new (...args: any[]): void } = TestComponentComponent, inputs: any = {}, defaultID?: string, host?: any): ComponentRef<any> | undefined {
    let id = 'some-id-' + this.componentCount;
    this.componentCount++;

    if (defaultID) {
      id = defaultID;
    }

    if (!host) {
      host = this.world?.worldHost;
    }

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

    const componentRef = host.createComponent(componentClass, {
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

    const getChildren = (item: NGBondItem, parent: any) => {
      item.children().forEach((child) => {
        const container = this.containerElementMap.get(child as NgBondContainer);

        const el: any = {};
        el.name = container?.instance.constructor.name;
        el.elementProperties = [];
        el.directives = [];
        el.id = child.id();
        el.elements = [];

        container?.instance?.inspectableProperties?.forEach((prop: any) => {
          if (prop.serializable) {
            try {
              if (prop.isSignal) {
                el.elementProperties.push({
                  name: prop.setterName,
                  value: container.instance[prop.setterName](),
                });
              } else {
                el.elementProperties.push({
                  name: prop.setterName,
                  value: container.instance[prop.setterName],
                });
              }
            } catch (error) {
              console.error('Error serializing property:', prop.setterName, error);
            }
          }
        });

        // Serialize the directives if needed
        container?.directives.forEach((directive: any) => {
          el.directives.push({
            name: directive.constructor.name,
            properties: [],
          });

          directive.inspectableProperties.forEach((prop: any) => {
            // serialized[key][prop.setterName] = directive[prop.setterName];
            if (prop.serializable) {
              try {
                if (prop.isSignal) {
                  el.directives[el.directives.length - 1].properties.push({
                    name: prop.setterName,
                    value: directive[prop.setterName](),
                  });
                } else {
                  el.directives[el.directives.length - 1].properties.push({
                    name: prop.setterName,
                    value: directive[prop.setterName],
                  });
                }
              } catch (error) {
                console.error('Error serializing property:', prop.setterName, error);
              }
            }
          });
        });
        parent.elements.push(el);
        getChildren(child, el);
      });
    };

    if (this.world) {
      getChildren(this.world, serialized);
    }

    localStorage.setItem('serialized', JSON.stringify(serialized, null, 2));
    return serialized;
  }

  loadSerialized(content?: string) {
    let data: any;
    if (!content) {
      const serialized = localStorage.getItem('serialized');
      if (!serialized) {
        return;
      }
      data = JSON.parse(serialized);

    } else {
      data = content;
    }

    const host = this.world?.worldHost;

    const addChildren = (el: any, componentHost: any) => {
      const componentClass = componentNameToClass[el.name as keyof typeof componentNameToClass];

      let componentProps = el.elementProperties.reduce((acc: any, prop: any) => {
        acc[prop.name] = prop.value;
        return acc;
      }, {});

      el.directives.forEach((dir: any) => {
        const directiveProps = dir.properties.reduce((acc: any, prop: any) => {
          acc[prop.name] = prop.value;
          return acc;
        }, {});

        componentProps = { ...componentProps, ...directiveProps };
      });

      const cHost = this.addComponent(componentClass, componentProps, el.id, componentHost);
      setTimeout(() => {
        el.elements.forEach((child: any) => {
          addChildren(child, cHost?.instance.insertSlot);
        });
      }, 1);
    };

    data.elements.forEach((element: any) => {
      addChildren(element, host);
    });
  }

  groupSelected() {
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;


    this.selectionManager.selectionTargets().forEach((target) => {
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
        colorDirective.bgColor.set('#111111'); // Set a default color for the group
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

  moveToContainer(child: NgBondContainer, target: NgBondContainer) {
    const targetContainer = this.containerElementMap.get(target as NgBondContainer);
    const childContainer = this.containerElementMap.get(child as NgBondContainer);

    const newChildX = child.gX() - target.gX();
    const newChildY = child.gY() - target.gY();

    const compRef: ComponentRef<any> = childContainer?.componentRef;
    const i = this.world?.worldHost.indexOf(compRef.hostView);
    this.world?.worldHost.detach(i);
    this.world?.removeChild(compRef.instance);

    child.parent()?.removeChild(child);

    (targetContainer?.instance as unknown as TestComponentComponent).insertSlot.insert(compRef.hostView);
    //child.parentContainer = target;
    child.parent.set(target);
    target.addChild(child);

    child.x.set(newChildX);
    child.y.set(newChildY);
  }
}
