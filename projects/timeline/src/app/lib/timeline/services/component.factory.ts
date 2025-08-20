import { ComponentRef, inject, Injectable, outputBinding, ViewContainerRef } from '@angular/core';
import { NgBondContainer, SelectionManager } from '@richapps/ngx-bond';
import { BackgroundColorPropertyDirective } from '../directives/backgroundColorProperty.directive';
import { TestComponentComponent } from '../../../components/test-component/test-component.component';
import { Subject } from 'rxjs';

export class ComponentFactory {
  selectionManager = inject(SelectionManager);
  componentAdded = new Subject<string>();
  propertyChanged = new Subject<{ id: string; property: string; value: any }>();

  worldHost!: ViewContainerRef;

  componentCount = 0;
  containerElementMap = new Map<NgBondContainer, { instance: any; directives: any[]; propertyDirectiveMap: Map<string, any>; componentRef: any }>();
  setWorldHost(worldHost: any) {
    this.worldHost = worldHost;
  }
  addComponent(componentClass: { new (...args: any[]): void } = TestComponentComponent, inputs: any = {}) {
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

    const componentRef = this.worldHost.createComponent(componentClass, {
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
      console.log('yes it has inspectable properties');
      (componentClass as any).inspectableProperties.forEach((p: any) => {
        this.containerElementMap.get(bondContainerInstance)?.propertyDirectiveMap.set(p.setterName, componentRef.instance);
      });
    }

    componentRef.setInput('bondcontainer', id);
    componentRef.setInput('positioning', 'transform');

    for (const key in inputs) {
      componentRef.setInput(key, inputs[key]);
    }

    this.componentAdded.next(id);
    return componentRef;
  }

  serializeComponents() {
    // console.log(BackgroundColorPropertyDirective);
    // console.log(new window['BackgroundColorPropertyDirective']);

    const serialized: any = {};
    this.containerElementMap.forEach((value, key) => {
      // serialized[key] = {
      //   instance: value.instance,
      //   propertyDirectiveMap: Array.from(value.propertyDirectiveMap.entries()),
      //   directives: value.directives,
      // };

      console.log('directives: ', value.directives);

      // Serialize the directives if needed
      value.directives.forEach((directive: any) => {
        console.log('directive: ', directive);
        directive.inspectableProperties.forEach((prop: any) => {
          // serialized[key][prop.setterName] = directive[prop.setterName];
          try {
            if (prop.isSignal) {
              console.log('prop', prop.setterName, directive[prop.setterName]());
            } else {
              console.log('prop', prop.setterName, directive[prop.setterName]);
            }
          } catch (error) {
            console.error('Error serializing property:', prop.setterName, error);
          }
        });
      });
    });
    return serialized;
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
    });

    const group = this.addComponent();
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
      console.log('set width ', maxX - minX);
      console.log('set height ', maxY - minY);

      this.selectionManager.selectionTargets().forEach((target) => {
        console.log('groupSelected target: ', target);
        const container = this.containerElementMap.get(target as NgBondContainer);
        if (container) {
          console.log(container.componentRef);

          const compRef: ComponentRef<any> = container.componentRef;
          const i = this.worldHost.indexOf(compRef.hostView);
          this.worldHost.detach(i);
          console.log(group.instance);

          (group.instance as unknown as TestComponentComponent).insertSlot.insert(compRef.hostView);

          target.x.set(target.x() - minX);
          target.y.set(target.y() - minY);

          //target.width();

          // const directives = container.directives;
          // directives.forEach((directive: any) => {
          //   directive.groupSelected();
          // });
        }
      });
    }, 100);
  }
}
