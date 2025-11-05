import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Component, ElementRef, signal } from '@angular/core';
import { TextComponentComponent } from './text-component.component';
import { Subject } from 'rxjs';
import { NgBondProperty, NgBondContainer, SelectionManager } from '../../../../public-api';

// Mock classes for dependencies
class MockNgBondContainer {
  id = signal('test-id');
  displayName = signal('');
  width = signal(100);
  height = signal(100);
  onInitialized = new Subject<void>();

  disable = jasmine.createSpy('disable');
  enable = jasmine.createSpy('enable');
}

class MockSelectionManager {
  disabled = signal(false);
  unselectAll = jasmine.createSpy('unselectAll');
}

class MockNgBondProperty {}

@Component({
  template: `<lib-text-component></lib-text-component>`,
  imports: [TextComponentComponent],
})
class TestHostComponent {}

describe('TextComponentComponent', () => {
  let component: TextComponentComponent;
  let fixture: ComponentFixture<TextComponentComponent>;
  let mockContainer: MockNgBondContainer;
  let mockSelectionManager: MockSelectionManager;

  beforeEach(async () => {
    mockContainer = new MockNgBondContainer();
    mockSelectionManager = new MockSelectionManager();

    await TestBed.configureTestingModule({
      imports: [TextComponentComponent, FormsModule, TestHostComponent],
      providers: [
        { provide: NgBondContainer, useValue: mockContainer },
        { provide: SelectionManager, useValue: mockSelectionManager },
        { provide: NgBondProperty, useValue: MockNgBondProperty },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TextComponentComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should set default displayName to "Text" when container displayName is empty', () => {
      mockContainer.displayName.set('');
      fixture.detectChanges();

      expect(mockContainer.displayName()).toBe('Text');
    });

    it('should not change displayName when container already has one', () => {
      mockContainer.displayName.set('Custom Name');
      fixture.detectChanges();

      expect(mockContainer.displayName()).toBe('Custom Name');
    });

    it('should have correct type property', () => {
      expect(component.type).toBe('text');
    });

    it('should have default property values', () => {
      expect(component.text()).toBe('Hello World');
      expect(component.fontSize()).toBe('16px');
      expect(component.color()).toBe('white');
      expect(component.fontWeight()).toBe('normal');
      expect(component.editable()).toBe(false);
    });

    it('should have a random number generated', () => {
      expect(component.rand).toBeGreaterThanOrEqual(0);
      expect(component.rand).toBeLessThan(1000);
    });
  });

  describe('Model Properties', () => {
    it('should update text model', () => {
      component.text.set('New Text');
      expect(component.text()).toBe('New Text');
    });

    it('should update fontSize model', () => {
      component.fontSize.set('20px');
      expect(component.fontSize()).toBe('20px');
    });

    it('should update color model', () => {
      component.color.set('red');
      expect(component.color()).toBe('red');
    });

    it('should update fontWeight model', () => {
      component.fontWeight.set('bold');
      expect(component.fontWeight()).toBe('bold');
    });

    it('should trigger measureSize when text changes', (done) => {
      spyOn(component, 'measureSize' as any);

      component.text.set('Changed Text');

      setTimeout(() => {
        expect(component['measureSize']).toHaveBeenCalled();
        done();
      }, 0);
    });

    it('should trigger measureSize when fontSize changes', (done) => {
      spyOn(component, 'measureSize' as any);

      component.fontSize.set('24px');

      setTimeout(() => {
        expect(component['measureSize']).toHaveBeenCalled();
        done();
      }, 0);
    });

    it('should trigger measureSize when fontWeight changes', (done) => {
      spyOn(component, 'measureSize' as any);

      component.fontWeight.set('bold');

      setTimeout(() => {
        expect(component['measureSize']).toHaveBeenCalled();
        done();
      }, 0);
    });
  });

  describe('Editable State Toggle', () => {
    it('should disable container when editable is true', () => {
      component.editable.set(true);
      fixture.detectChanges();

      expect(mockContainer.disable).toHaveBeenCalled();
    });

    it('should enable container when editable is false', () => {
      component.editable.set(true);
      fixture.detectChanges();
      mockContainer.disable.calls.reset();
      mockContainer.enable.calls.reset();

      component.editable.set(false);
      fixture.detectChanges();

      expect(mockContainer.enable).toHaveBeenCalled();
    });

    it('should toggle editable state on double click', () => {
      const initialEditable = component.editable();

      // Simulate double click on element
      const dblClickEvent = new MouseEvent('dblclick', { bubbles: true });
      component.el.nativeElement.dispatchEvent(dblClickEvent);

      expect(component.editable()).toBe(!initialEditable);
    });
  });

  describe('Double Click Handling', () => {
    it('should call onDblClick when double clicked', () => {
      spyOn(component, 'onDblClick');

      const dblClickEvent = new MouseEvent('dblclick', { bubbles: true });
      component.el.nativeElement.dispatchEvent(dblClickEvent);

      expect(component.onDblClick).toHaveBeenCalledWith(dblClickEvent);
    });

    it('should disable selection and unselect all on double click', () => {
      const mockEvent = {
        stopPropagation: jasmine.createSpy('stopPropagation'),
        preventDefault: jasmine.createSpy('preventDefault'),
      } as any;

      component.onDblClick(mockEvent);

      expect(mockSelectionManager.disabled()).toBe(true);
      expect(mockSelectionManager.unselectAll).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Size Measurement', () => {
    it('should update container dimensions when measureSize is called', () => {
      // Create a mock textInput element with getBoundingClientRect
      const mockTextInput = {
        nativeElement: {
          getBoundingClientRect: jasmine.createSpy('getBoundingClientRect').and.returnValue({
            width: 150,
            height: 50,
          }),
        },
      };

      // Mock the textInput viewChild
      spyOn(component, 'textInput').and.returnValue(mockTextInput as any);

      component['measureSize']();

      expect(mockContainer.width()).toBe(150);
      expect(mockContainer.height()).toBe(50);
    });

    it('should use default dimensions when textInput is not available', () => {
      spyOn(component, 'textInput').and.returnValue(undefined);

      component['measureSize']();

      expect(mockContainer.width()).toBe(100);
      expect(mockContainer.height()).toBe(100);
    });

    it('should call measureSize after container initialization', (done) => {
      spyOn(component, 'measureSize' as any);

      mockContainer.onInitialized.next();

      setTimeout(() => {
        expect(component['measureSize']).toHaveBeenCalled();
        done();
      }, 2100); // Slightly more than the 2000ms timeout in the component
    });
  });
});
