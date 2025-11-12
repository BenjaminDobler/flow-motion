import { ComponentRef, effect, inject, Injectable, Injector, inputBinding, outputBinding, runInInjectionContext, ViewContainerRef } from '@angular/core';

import { Subject } from 'rxjs';
import { BackgroundColorPropertyDirective } from '../directives/backgroundColorProperty.directive';
import { ContainerComponent } from '../components/editables/container-component/container-component.component';
import { ImageComponent } from '../components/editables/image/image.component';
import { TextComponentComponent } from '../components/editables/text-component/text-component.component';
import { NodeTableComponent } from '../components/editables/node-table/node-table.component';
import { SelectionManager } from './selection.manager';
import { FMService, inspectableLinkProperties } from './fm.service';
import { ConnectionDirective, FMContainer, FMItem, FMWorld, InspectableProperty, Link, Path, PathDirectiveDirective, ShapeComponent, SVGCanvas } from '../../public-api';
import { toObservable } from '@angular/core/rxjs-interop';

const componentNameToClass = {
  _ContainerComponent: ContainerComponent,
  _ImageComponent: ImageComponent,
  _TextComponentComponent: TextComponentComponent,
  _NodeTableComponent: NodeTableComponent,
  _ShapeComponent: ShapeComponent,
};

@Injectable()
export class ComponentFactory {
  selectionManager = inject(SelectionManager);
  fmService = inject(FMService);
  componentAdded = new Subject<{ id: string; displayName: string }>();
  componentRemoved = new Subject<string>();
  propertyChanged = new Subject<{ id: string; property: string; value: any }>();
  componentCount = 0;
  containerElementMap = new Map<FMContainer, { instance: any; directives: any[]; propertyDirectiveMap: Map<string, any>; componentRef: any }>();
  world?: FMWorld;
  svgCanvas = inject(SVGCanvas);

  injector = inject(Injector);

  clipboard: any[] = [];

  changes$ = new Subject<void>();

  constructor() {
    this.selectionManager.components = this;
  }

  clearAll() {
    this.containerElementMap.forEach((value, key) => {
      this.removeComponent(key);
    });
    this.containerElementMap.clear();
    this.componentCount = 0;
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

    const directives = [FMContainer, BackgroundColorPropertyDirective];

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

    const bondContainerInstance = componentRef.injector.get(FMContainer);

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
              this.changes$.next();
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

    componentRef.setInput('fm-container', id);
    componentRef.setInput('positioning', 'transform');

    for (const key in inputs) {
      componentRef.setInput(key, inputs[key]);
    }

    const name = bondContainerInstance.displayName();

    this.componentAdded.next({ id, displayName: name });
    return componentRef;
  }

  deserializeComponent() {}

  serializeComponent(child: FMItem) {
    const container = this.containerElementMap.get(child as FMContainer);

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

    const getChildren = (item: FMItem, parent: any) => {
      item
        .children()
        .filter((child) => {
          const c = child as FMContainer;
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
    this.fmService.links().forEach((link) => {
      const props: any = {};
      inspectableLinkProperties.forEach((prop) => {
        if (!prop.noneSerializable) {
          props[prop.name] = (link as any)[prop.name]();
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
      return cHost?.instance;
    };

    if (element.name === 'SVGPath') {
      // Special handling for SVGPath since it has no component class
      const pathDirectiveProps = element.directives.find((d: any) => d.name === '_PathDirectiveDirective')?.properties;
      const pathData = element.pathData;

      const p = Path.deserialize(pathData, this.svgCanvas);
      this.svgCanvas.paths.update((paths) => {
        return [...paths, p];
      });
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
      this.deserializeElement(element, host);
    });

    setTimeout(() => {
      data.links.forEach((link: any) => {
        this.fmService.createLink(link.inputId, link.outputId, link.props);
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
    const bondContainerInstance = group.injector.get(FMContainer);

    bondContainerInstance.x.set(minX);
    bondContainerInstance.y.set(minY);
    bondContainerInstance.width.set(maxX - minX);
    bondContainerInstance.height.set(maxY - minY);

    const container = this.containerElementMap.get(bondContainerInstance as FMContainer);

    if (container) {
      const colorDirective = container.directives.find((d: any) => d instanceof BackgroundColorPropertyDirective);
      if (colorDirective) {
        colorDirective.backgroundColor.set('#111111'); // Set a default color for the group
        colorDirective.borderRadius.set(0); // Set a default border radius
      }
    }

    setTimeout(() => {
      this.selectionManager.selectionTargets().forEach((target) => {
        const container = this.containerElementMap.get(target as FMContainer);
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

          target.x.set(x);
          target.y.set(y);
        }
      });
    }, 100);
  }

  moveToContainer(child: FMContainer, target: FMContainer) {
    const targetContainer = this.containerElementMap.get(target as FMContainer);
    const childContainer = this.containerElementMap.get(child as FMContainer);

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

  addSvgContainer(container: FMContainer, directiveInstances: any[] = [], hidden = false) {

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
          this.changes$.next();
        });
      });

    pathDirective.inspectableProperties.forEach((p) => {
      const eventProp = p.event ? p.event : p.name;
      (pathDirective as any)[eventProp as any].subscribe((evt: any) => {
        this.propertyChanged.next({
          id,
          property: p.name,
          value: evt,
        });
        this.changes$.next();
      });
    });

    this.selectionManager.setContainerForEditing(container);
    if (!hidden) {
      console.log('Adding SVG container', container.id());
      this.componentAdded.next({ id: container.id(), displayName: container.displayName() });
    } else {
      console.log('!!!! hidden');
    }
  }

  addConnectionComponent(container: FMContainer, directiveInstances: any[] = [], link: Link, connectionDirective: ConnectionDirective) {
    const id = 'connection-' + this.componentCount;
    this.componentCount++;
    container.id.set(id);

    this.containerElementMap.set(container, {
      instance: null,
      propertyDirectiveMap: new Map<string, any>(),
      directives: [connectionDirective],
      componentRef: null,
    });

    link.inspectableProperties.forEach((p: any) => {
      this.containerElementMap.get(container)?.propertyDirectiveMap.set(p.name, connectionDirective);
    });

    link.inspectableProperties.forEach((p: any) => {
      const eventProp = p.event ? p.event : p.name;

      if ((connectionDirective as any)[`${eventProp}Changed`] !== undefined) {
        (connectionDirective as any)[`${eventProp}Changed`].subscribe((evt: any) => {
          this.propertyChanged.next({
            id,
            property: p.name,
            value: evt,
          });
          this.changes$.next();
        });
      }
    });

    runInInjectionContext(connectionDirective.injector, () => {
      link.inspectableProperties
        //.filter((p) => p.event)
        .forEach((p: any) => {
          const eventProp = p.event ? p.event : p.name;

          console.log('Setting up link property subscription for', p.name, eventProp);

          toObservable((link as any)[eventProp]).subscribe((value) => {
            console.log('---- Link property changed:', p.name, value);
            this.propertyChanged.next({
              id,
              property: p.name,
              value: value,
            });
            this.changes$.next();
          });
        });

      this.changes$.next();
    });

    this.componentAdded.next({ id: container.id(), displayName: id });
  }

  removeComponent(item: FMContainer) {
    console.log('Removing component', item.id());
    const container = this.containerElementMap.get(item);

    container?.directives.forEach((d: any) => {
      if (d.beforeRemove) {
        d.beforeRemove();
      }
    });
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
    this.changes$.next();
  }

  copySelected(targets: FMContainer[]) {
    this.clipboard = [];
    targets.forEach((target) => {
      const el = this.serializeComponent(target);
      this.clipboard.push(el);
    });
  }

  copyInPlace(targets: FMContainer[]) {
    this.copySelected(targets);
    this.paste();
  }

  paste() {
    const host = this.world?.worldHost;
    const els: FMContainer[] = [];
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
