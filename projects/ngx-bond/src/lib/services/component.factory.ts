import { ComponentRef, inject, Injectable, inputBinding, outputBinding, ViewContainerRef } from '@angular/core';

import { Subject } from 'rxjs';
import { BackgroundColorPropertyDirective } from '../directives/backgroundColorProperty.directive';
import { ContainerComponent } from '../components/editables/container-component/container-component.component';
import { ImageComponent } from '../components/editables/image/image.component';
import { TextComponentComponent } from '../components/editables/text-component/text-component.component';
import { SelectionManager } from './selection.manager';
import { NgBondService, inspectableLinkProperties } from './ngbond.service';
import { InspectableProperty, NgBondContainer, NGBondItem, NgBondWorld, NodeTableComponent, Path, SVGCanvas } from '../../public-api';
import { PathDirectiveDirective } from '../components/editables/path-directive.directive';

const componentNameToClass = {
  _ContainerComponent: ContainerComponent,
  _ImageComponent: ImageComponent,
  _TextComponentComponent: TextComponentComponent,
  _NodeTableComponent: NodeTableComponent
};

@Injectable()
export class ComponentFactory {
  selectionManager = inject(SelectionManager);
  bondService = inject(NgBondService);
  componentAdded = new Subject<{ id: string; displayName: string }>();
  componentRemoved = new Subject<string>();
  propertyChanged = new Subject<{ id: string; property: string; value: any }>();
  componentCount = 0;
  containerElementMap = new Map<NgBondContainer, { instance: any; directives: any[]; propertyDirectiveMap: Map<string, any>; componentRef: any }>();
  world?: NgBondWorld;
  svgCanvas = inject(SVGCanvas);

  clipboard: any[] = [];

  constructor() {
    this.selectionManager.components = this;
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
      // const bindings = d.inspectableProperties
      //   .filter((p) => p.event)
      //   .map((p) => {
      //     return outputBinding(p.event as string, (evt: any) => {
      //       this.propertyChanged.next({
      //         id,
      //         property: p.name,
      //         value: evt,
      //       });
      //     });
      //   });

      return {
        type: d,
        bindings: [],
      };
    });

    if (!this.world) {
      console.error('World is not set. Cannot add component.');
      return;
    }

    const componentRef = host.createComponent(componentClass, {
      directives: directiveSetup,
    });

    // directives.map((d) => {
    //   const bindings = d.inspectableProperties
    //     .filter((p) => p.event)
    //     .forEach((p) => {
    //       console.log('Setting up event binding for', p.name, 'on', d.name);
    //       console.log(componentRef.instance);
    //       (componentRef.instance as any)[p.name].subscribe((evt: any) => {
    //         this.propertyChanged.next({
    //           id,
    //           property: p.name,
    //           value: evt,
    //         });
    //       });
    //     });
    // });

    if ((componentRef.instance as any).inspectableProperties) {
      for (const prop of (componentRef.instance as any).inspectableProperties) {
        if (!prop.noneAnimatable) {
          const eventProp = prop.event ? prop.event : prop.name;
          (componentRef.instance as any)[eventProp].subscribe((evt: any) => {
            this.propertyChanged.next({
              id,
              property: prop.name,
              value: evt,
            });
          });
        }
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

    directiveInstances.forEach((dInstance) => {
      dInstance.inspectableProperties.forEach((prop: any) => {
        if (!prop.noneAnimatable) {
          const eventProp = prop.event ? prop.event : prop.name;
          if ((dInstance as any)[eventProp] && !prop.readonly) {
            (dInstance as any)[eventProp].subscribe((evt: any) => {
              this.propertyChanged.next({
                id,
                property: prop.name,
                value: evt,
              });
            });
          }
        }
      });
    });

    directiveInstances.forEach((dInstance: any) => {
      dInstance.inspectableProperties.forEach((p: any) => {
        this.containerElementMap.get(bondContainerInstance)?.propertyDirectiveMap.set(p.name, dInstance);
      });
    });

    if ((componentClass as any).inspectableProperties) {
      (componentClass as any).inspectableProperties.forEach((p: any) => {
        this.containerElementMap.get(bondContainerInstance)?.propertyDirectiveMap.set(p.name, componentRef.instance);
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

    const name = bondContainerInstance.displayName();

    this.componentAdded.next({id, displayName: name});
    return componentRef;
  }

  deserializeComponent() {}

  serializeComponent(child: NGBondItem) {
    const container = this.containerElementMap.get(child as NgBondContainer);

    const el: any = {};

    el.elementProperties = [];
    el.directives = [];
    el.id = child.id();
    el.elements = [];

    if (container?.instance) {
      el.name = container?.instance.constructor.name;

      container?.instance?.inspectableProperties?.forEach((prop: InspectableProperty) => {
        if (!prop.noneSerializable) {
          try {
            if (!prop.isGetter) {
              el.elementProperties.push({
                name: prop.name,
                value: container.instance[prop.name](),
              });
            } else {
              el.elementProperties.push({
                name: prop.name,
                value: container.instance[prop.name],
              });
            }
          } catch (error) {
            console.error('Error serializing property:', prop.name, error);
          }
        }
      });
    } else {
      // No container instance found probably svg path
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

      directive.inspectableProperties.forEach((prop: InspectableProperty) => {
        // serialized[key][prop.name] = directive[prop.name];
        if (!prop.noneSerializable) {
          try {
            if (!prop.isGetter) {
              el.directives[el.directives.length - 1].properties.push({
                name: prop.name,
                value: directive[prop.name](),
              });
            } else {
              el.directives[el.directives.length - 1].properties.push({
                name: prop.name,
                value: directive[prop.name],
              });
            }
          } catch (error) {
            console.error('Error serializing property:', prop.name, error);
          }
        }
      });
    });
    return el;
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
          const el = this.serializeComponent(child);
          parent.elements.push(el);
          getChildren(child, el);
        });
    };

    if (this.world) {
      getChildren(this.world, serialized);
    }

    const links: { inputId: string; outputId: string; props: any }[] = [];
    this.bondService.links().forEach((link) => {

      const props: any = {};
      inspectableLinkProperties.forEach((prop) => {
        if (!prop.noneSerializable) {
          console.log('setter name ', prop.name);
          props[prop.name] = (link.properties as any)[prop.name]();
        }
      });

      links.push({ inputId: link.inputId, outputId: link.outputId, props });
    });

    serialized.links = links;

    return serialized;
  }

  deserializeElement(element: any, host?: any) {
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
      return cHost?.instance
    };

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
      return null;
    } else {
      return addChildren(element, host);
    }
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

    data.elements.forEach((element: any) => {
      console.log('Adding element', element.name);
      this.deserializeElement(element, host);
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
      this.containerElementMap.get(container)?.propertyDirectiveMap.set(p.name, pathDirective);
    });

    container.inspectableProperties.forEach((p: any) => {
      this.containerElementMap.get(container)?.propertyDirectiveMap.set(p.name, container);
    });

    container.inspectableProperties
      .filter((p) => p.event)
      .forEach((p) => {
        (container as any)[p.event as any].subscribe((evt: any) => {
          this.propertyChanged.next({
            id,
            property: p.name,
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
            property: p.name,
            value: evt,
          });
        });
      });

    this.componentAdded.next({id: container.id(), displayName: container.displayName()});
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

  copySelected(targets: NgBondContainer[]) {
    this.clipboard = [];
    targets.forEach((target) => {
      const el = this.serializeComponent(target);
      this.clipboard.push(el);
    });
    console.log('Copied to clipboard', this.clipboard);
  }

  copyInPlace(targets: NgBondContainer[]) {
    this.copySelected(targets);
    this.paste();

  }

  paste() {
    const host = this.world?.worldHost;
    const els: NgBondContainer[] = [];
    this.clipboard.forEach((element: any) => {
      element.id = element.id + '-copy-' + Math.floor(Math.random() * 1000);
      const c = this.deserializeElement(element, host);
      if (c) {
        els.push(c.container);
      }
    });
    return els;
  }
}
