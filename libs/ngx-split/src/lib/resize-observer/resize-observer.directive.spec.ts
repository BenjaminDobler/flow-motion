import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ResizeObserverDirective } from './resize-observer.directive';
import { ResizeObserverService } from './resize-observer.service';

describe('AppComponent', () => {
  @Component({
    imports: [ResizeObserverDirective],
    template: `<div
      id="resize_element"
      [appResizeObserver]
      (size)="sizeChanged($event)"
    ></div>`,
  })
  class TestComponent {
    sizeChanged = jasmine.createSpy('sizeChanged');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResizeObserverDirective, TestComponent],
      providers: [ResizeObserverService],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(TestComponent);
    const testComponent = fixture.componentInstance;
    expect(testComponent).toBeTruthy();
  });

  it('should emit size when resized', (done) => {
    const fixture = TestBed.createComponent(TestComponent);
    const testComponent = fixture.componentInstance;
    fixture.detectChanges();
    const el = document.querySelector('#resize_element') as HTMLDivElement;
    el.style.width = '200px';
    el.style.height = '200px';


    fixture.detectChanges();

    setTimeout(() => {
      expect(testComponent.sizeChanged).toHaveBeenCalled();
      expect(testComponent.sizeChanged).toHaveBeenCalledWith({width: 200, height: 200})
      fixture.detectChanges();
      done();
    }, 100);
  });
});
