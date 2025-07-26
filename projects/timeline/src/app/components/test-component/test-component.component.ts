import { Component } from '@angular/core';
import { NgBondContainer } from '@richapps/ngx-bond';

@Component({
  selector: 'app-test-component',
  imports: [],
  templateUrl: './test-component.component.html',
  styleUrl: './test-component.component.scss',
  hostDirectives: [NgBondContainer]
})
export class TestComponentComponent { }
