import { afterEveryRender, ChangeDetectionStrategy, Component, effect, ElementRef, forwardRef, inject, input, ViewChild, ViewContainerRef } from '@angular/core';
import { NgBondContainerHost } from '../../../types/types'
import { NgBondProperty } from "../../ng-bond-property/ng-bond-property";
import { NgBondContainer } from '@richapps/ngx-bond';
@Component({
  selector: 'app-test-component',
  imports: [NgBondProperty],
  templateUrl: './test-component.component.html',
  styleUrl: './test-component.component.scss',
  providers: [{ provide: NgBondContainerHost, useExisting: forwardRef(() => TestComponentComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestComponentComponent extends NgBondContainerHost {
  // backgroundColor = input('#00ff00');


  type = 'container';

  el = inject(ElementRef);
  @ViewChild('insert_slot', { read: ViewContainerRef })
  insertSlot!: ViewContainerRef;




  rand = Math.floor(Math.random() * 1000);

  constructor() {
    super();
  }
}
