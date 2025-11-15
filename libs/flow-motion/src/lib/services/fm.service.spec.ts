import { FMService } from './fm.service';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, Component, inject } from '@angular/core';

import { beforeEach, describe, expect, it } from 'vitest';
import { FMContainer } from '../components/fm-container/fm-container';
import { SelectionManager } from './selection.manager';
import { KeyManager } from './key.manager';
import { FMProperty } from '../components/fm-property/fm-property';

@Component({
  selector: 'fm-test-host',
  template: `<div [fm-property]></div>`,
  imports: [FMProperty],
  hostDirectives: [FMProperty],
})
class TestHostComponent {
  container = inject(FMContainer);
}

describe('FlowMotionService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, FMContainer, FMProperty],
      providers: [
        provideZonelessChangeDetection(),
        FMService,
        SelectionManager,
        KeyManager
      ],
    });
  });

  it('should create', () => {
    console.log('Creating component');
    const fixture = TestBed.createComponent(TestHostComponent);
    const component = fixture.componentInstance;
    expect(component).toBeDefined();
  });

  it('should correctly register new containers', () => {
    console.log('Testing container registration');
    const service = TestBed.inject(FMService);
    const fixture = TestBed.createComponent(TestHostComponent);
    const component = fixture.componentInstance;
    const container = component.container;

    service.registerDraggableElement(container);
    const found = service
      .dragElements()
      .find((c) => c.id() === container.id());
    expect(found).toBeDefined();
  });

  it('should correctly unregister containers', () => {
    console.log('Testing container removal');
    const service = TestBed.inject(FMService);
    const fixture = TestBed.createComponent(TestHostComponent);
    const component = fixture.componentInstance;
    const container = component.container;

    service.registerDraggableElement(container);
    service.unregisterDraggableElement(container);
    const found = service
      .dragElements()
      .find((c) => c.id() === container.id());
    expect(found).toBeUndefined();
  });


  it('should find containers by id', () => {
    console.log('Testing container lookup by ID');
    const service = TestBed.inject(FMService);
    const fixture = TestBed.createComponent(TestHostComponent);
    const component = fixture.componentInstance;
    const container = component.container;

    service.registerDraggableElement(container);
    const found = service.getDraggableElementById(container.id());
    expect(found).toBeDefined();
    expect(found?.id()).toBe(container.id());
  });

  it('should return undefined for unknown id', () => {
    console.log('Testing unknown container ID lookup');
    const service = TestBed.inject(FMService);
    const found = service.getDraggableElementById('unknown-id');
    expect(found).toBeUndefined();
  });

  it('should correctly handle multiple containers', () => {
    console.log('Testing multiple container registration');
    const service = TestBed.inject(FMService);
    const fixture1 = TestBed.createComponent(TestHostComponent);
    const component1 = fixture1.componentInstance;
    const container1 = component1.container;

    const fixture2 = TestBed.createComponent(TestHostComponent);
    const component2 = fixture2.componentInstance;
    const container2 = component2.container;

    service.registerDraggableElement(container1);
    service.registerDraggableElement(container2);

    const allContainers = service.dragElements();
    expect(allContainers.length).toBeGreaterThanOrEqual(2);
    expect(allContainers.find((c) => c.id() === container1.id())).toBeDefined();
    expect(allContainers.find((c) => c.id() === container2.id())).toBeDefined();
  });

  it('should correctly create a link between containers', () => {
    console.log('Testing container linking');
    const service = TestBed.inject(FMService);

    const fixture1 = TestBed.createComponent(TestHostComponent);
    const component1 = fixture1.componentInstance;
    const container1 = component1.container;
    service.registerDraggableElement(container1);

    const fixture2 = TestBed.createComponent(TestHostComponent);
    const component2 = fixture2.componentInstance;
    const container2 = component2.container;
    service.registerDraggableElement(container2);

    const link = service.createLink(container1.id(), container2.id());
    expect(link).toBeDefined();
  });

  it('should create a link with default properties', () => {
    console.log('Testing link creation with default properties');
    const service = TestBed.inject(FMService);

    const fixture1 = TestBed.createComponent(TestHostComponent);
    const component1 = fixture1.componentInstance;
    const container1 = component1.container;
    service.registerDraggableElement(container1);

    const fixture2 = TestBed.createComponent(TestHostComponent);
    const component2 = fixture2.componentInstance;
    const container2 = component2.container;
    service.registerDraggableElement(container2);

    const link = service.createLink(container1.id(), container2.id());
    expect(link?.color()).toBe('#000000');
    expect(link?.animate()).toBe(false);
    expect(link?.curveRadius()).toBe(10);
  });


  it('should create a link with custom properties', () => {
    console.log('Testing link creation with custom properties');
    const service = TestBed.inject(FMService);

    const fixture1 = TestBed.createComponent(TestHostComponent);
    const component1 = fixture1.componentInstance;
    const container1 = component1.container;
    service.registerDraggableElement(container1);

    const fixture2 = TestBed.createComponent(TestHostComponent);
    const component2 = fixture2.componentInstance;
    const container2 = component2.container;
    service.registerDraggableElement(container2);

    const link = service.createLink(container1.id(), container2.id(), {
      color: '#ff0000',
      animate: true,
      curveRadius: 20,
    });
    expect(link?.color()).toBe('#ff0000');
    expect(link?.animate()).toBe(true);
    expect(link?.curveRadius()).toBe(20);
  });
  
  
  it('should add preview link correctly', () => {
    console.log('Testing preview link addition');
    const service = TestBed.inject(FMService);

    const fixture1 = TestBed.createComponent(TestHostComponent);
    const component1 = fixture1.componentInstance;
    const container1 = component1.container;
    service.registerDraggableElement(container1);

    const fixture2 = TestBed.createComponent(TestHostComponent);
    const component2 = fixture2.componentInstance;
    const container2 = component2.container;
    service.registerDraggableElement(container2);

    const property1 = container2.injector.get(FMProperty);
    service.startDragPreview(property1);


    expect(service.currentDragSource).toBeDefined();
  });

  it('should remove preview link correctly', () => {
    console.log('Testing preview link removal');
    const service = TestBed.inject(FMService);

    const fixture1 = TestBed.createComponent(TestHostComponent);
    const component1 = fixture1.componentInstance;
    const container1 = component1.container;
    service.registerDraggableElement(container1);

    const fixture2 = TestBed.createComponent(TestHostComponent);
    const component2 = fixture2.componentInstance;
    const container2 = component2.container;
    service.registerDraggableElement(container2);

    const property1 = container2.injector.get(FMProperty);
    service.startDragPreview(property1);

    const link = service.snapLink();

    expect(link).toBeDefined();

    if (link) {
      service.removePreview(link);
    }

    expect(service.snapLink()).toBeNull();
  }); 


  it('should return null if one of the link containers is missing', () => {
    const service = TestBed.inject(FMService);

    const fixture1 = TestBed.createComponent(TestHostComponent);
    const component1 = fixture1.componentInstance;
    const container1 = component1.container;
    service.registerDraggableElement(container1);

    

    const link = service.createLink('none-existing-id', container1.id());
    expect(link).toBeNull();
  });


});
