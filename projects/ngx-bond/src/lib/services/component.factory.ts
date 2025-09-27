import { ComponentRef, inject, Injectable, inputBinding, outputBinding, ViewContainerRef } from '@angular/core';
import { inspectableLinkProperties, NgBondContainer, NGBondItem, NgBondProperty, NgBondService, NgBondWorld, Path, PathDirectiveDirective, SelectionManager, SVGCanvas } from '@richapps/ngx-bond';
import { Subject } from 'rxjs';
import { BackgroundColorPropertyDirective } from '../directives/backgroundColorProperty.directive';
import { ContainerComponent } from '../components/editables/container-component/container-component.component';
import { ImageComponent } from '../components/editables/image/image.component';
import { TextComponentComponent } from '../components/editables/text-component/text-component.component';

const componentNameToClass = {
  _ContainerComponent: ContainerComponent,
  _ImageComponent: ImageComponent,
  _TextComponentComponent: TextComponentComponent,
};

@Injectable()
export class ComponentFactory {
  selectionManager = inject(SelectionManager);
  bondService = inject(NgBondService);
  componentAdded = new Subject<string>();
  componentRemoved = new Subject<string>();
  propertyChanged = new Subject<{ id: string; property: string; value: any }>();
  componentCount = 0;
  containerElementMap = new Map<NgBondContainer, { instance: any; directives: any[]; propertyDirectiveMap: Map<string, any>; componentRef: any }>();
  world?: NgBondWorld;
  svgCanvas = inject(SVGCanvas);

  constructor() {
    this.selectionManager.componentFactory = this;
  }

  addComponent(componentClass: { new (...args: any[]): void } = ContainerComponent, inputs: any = {}, defaultID?: string, host?: any): ComponentRef<any> | undefined {
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
      item
        .children()
        .filter((child) => {
          const c = child as NgBondContainer;
          return c.type !== 'link' && c.type !== 'link-target';
        })
        .forEach((child) => {
          const container = this.containerElementMap.get(child as NgBondContainer);

          const el: any = {};

          el.elementProperties = [];
          el.directives = [];
          el.id = child.id();
          el.elements = [];

          if (container?.instance) {
            el.name = container?.instance.constructor.name;

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
          } else {
            // No container instance found probably svg path
            console.log('No container instance found for', child);
            console.log(container);
            const pathDirective = container?.directives.find((d: any) => {
              return d instanceof PathDirectiveDirective;
            });

            if (pathDirective) {
              const path = pathDirective.path();
              el.pathData = path.serialize();

              el.name = 'SVGPath';
            }
          }

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

    const links: { inputId: string; outputId: string; props: any }[] = [];
    this.bondService.links().forEach((link) => {
      console.log('Link:', link);

      const props: any = {};
      inspectableLinkProperties.forEach((prop) => {
        if (prop.serializable) {
          console.log('setter name ', prop.setterName);
          props[prop.setterName] = (link.properties as any)[prop.setterName]();
        }
      });

      links.push({ inputId: link.inputId, outputId: link.outputId, props });
    });

    serialized.links = links;

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
      console.log('Adding element', element.name);
      if (element.name === 'SVGPath') {
        // Special handling for SVGPath since it has no component class
        console.log('Adding SVG Path', element);
        const pathDirectiveProps = element.directives.find((d: any) => d.name === '_PathDirectiveDirective')?.properties;
        const pathData = element.pathData;

        const p = Path.deserialize(pathData, this.svgCanvas);
        this.svgCanvas.paths.update((paths) => {
          return [...paths, p];
        });
        console.log(pathDirectiveProps);
        p.draw();
      } else {
        addChildren(element, host);
      }
    });

    setTimeout(() => {
      data.links.forEach((link: any) => {
        this.bondService.createLink(link.inputId, link.outputId, link.props);
      });
    }, 200);
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
        colorDirective.backgroundColor.set('#111111'); // Set a default color for the group
        colorDirective.borderRadius.set(0); // Set a default border radius
      }
    }

    setTimeout(() => {
      this.selectionManager.selectionTargets().forEach((target) => {
        console.log('Moving target to group', target);
        const container = this.containerElementMap.get(target as NgBondContainer);
        if (container) {
          const x = target.gX() - minX;
          const y = target.gY() - minY;

          const parent = target.parent();
          if (parent && parent.detachChild) {
            parent.detachChild(container.componentRef);
            parent.removeChild(target);
          }
          // const compRef: ComponentRef<any> = container.componentRef;
          // const i = this.world?.worldHost.indexOf(compRef.hostView);
          // this.world?.worldHost.detach(i);
          // this.world?.removeChild(compRef.instance);

          (group.instance as unknown as ContainerComponent).insertSlot.insert(container.componentRef.hostView);
          target.parentContainer = bondContainerInstance;
          target.parent.set(bondContainerInstance);
          bondContainerInstance.addChild(target);

          console.log('New local position:', x, y);
          target.x.set(x);
          target.y.set(y);
        }
      });
    }, 100);
  }

  moveToContainer(child: NgBondContainer, target: NgBondContainer) {
    const targetContainer = this.containerElementMap.get(target as NgBondContainer);
    const childContainer = this.containerElementMap.get(child as NgBondContainer);

    const newChildX = child.gX() - target.gX();
    const newChildY = child.gY() - target.gY();

    const parent = child.parent();
    if (parent && parent.detachChild) {
      parent.detachChild(childContainer?.componentRef);
      parent.removeChild(child);
    }

    (targetContainer?.instance as unknown as ContainerComponent).insertSlot.insert(childContainer?.componentRef.hostView);
    //child.parentContainer = target;
    child.parent.set(target);
    target.addChild(child);

    child.x.set(newChildX);
    child.y.set(newChildY);
  }

  addSvgContainer(container: NgBondContainer, directiveInstances: any[] = []) {
    const pathDirective = container.injector.get(PathDirectiveDirective);

    this.containerElementMap.set(container, {
      instance: null,
      propertyDirectiveMap: new Map<string, any>(),
      directives: [...directiveInstances, container, pathDirective],
      componentRef: null,
    });

    const id = container.id();

    pathDirective.inspectableProperties.forEach((p: any) => {
      this.containerElementMap.get(container)?.propertyDirectiveMap.set(p.setterName, pathDirective);
    });

    container.inspectableProperties.forEach((p: any) => {
      this.containerElementMap.get(container)?.propertyDirectiveMap.set(p.setterName, container);
    });

    container.inspectableProperties
      .filter((p) => p.event)
      .forEach((p) => {
        (container as any)[p.event as any].subscribe((evt: any) => {
          this.propertyChanged.next({
            id,
            property: p.setterName,
            value: evt,
          });
        });
      });

    pathDirective.inspectableProperties
      .filter((p) => p.event)
      .forEach((p) => {
        (pathDirective as any)[p.event as any].subscribe((evt: any) => {
          this.propertyChanged.next({
            id,
            property: p.setterName,
            value: evt,
          });
        });
      });

    this.componentAdded.next(container.id());
  }

  removeComponent(item: NgBondContainer) {
    const container = this.containerElementMap.get(item);
    this.selectionManager.unselect(item);

    item.parent()?.removeChild(item);

    const parent = item.parent();

    if (container && container.componentRef) {
      if (parent) {
        parent.removeChild(item);
        if (parent.detachChild) {
          parent.detachChild(container.componentRef);
        }
        container.componentRef.destroy();
      }
    }
    this.containerElementMap.delete(item);
    this.componentRemoved.next(item.id());
  }
}
