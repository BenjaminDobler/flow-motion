import { Component, effect, ElementRef, forwardRef, inject, input, ViewChild, ViewContainerRef } from '@angular/core';
import { NgBondContainerHost } from '@richapps/ngx-bond';

@Component({
  selector: 'app-test-component',
  imports: [],
  templateUrl: './test-component.component.html',
  styleUrl: './test-component.component.scss',
  providers: [{ provide: NgBondContainerHost, useExisting: forwardRef(() => TestComponentComponent) }],
})
export class TestComponentComponent extends NgBondContainerHost {
  // backgroundColor = input('#00ff00');



  el = inject(ElementRef);
  @ViewChild('insert_slot', { read: ViewContainerRef })
  insertSlot!: ViewContainerRef;

  constructor() {
    super();
    effect(() => {
      // console.log('Background color changed:', this.backgroundColor());
      //this.el.nativeElement.style.backgroundColor = this.backgroundColor();
    });
  }
}
