import { Component, Input, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ColorComponent, EdSelectComponent, EdSelectOptionComponent, InputComponent, InputGroupComponent, RadiusIconComponent } from '@richapps/ngx-bond';
import { ContextMenu } from "./components/context-menu/context-menu";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, InputComponent, ColorComponent, EdSelectComponent, EdSelectOptionComponent, InputGroupComponent, RadiusIconComponent, ContextMenu],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('ui-components-demo');

  width = signal(100);

  contextMenuData = [
    { label: 'Option 1', action: (init:any) => console.log('Option 1 selected', init), items: [
      { label: 'Sub-option 1', action: (init:any) => console.log('Sub-option 1 selected', init) },
      { label: 'Sub-option 2', action: (init:any) => console.log('Sub-option 2 selected', init) },
    ] },
    { label: 'Option 2', action: (init:any) => console.log('Option 2 selected', init) },
    { label: 'Option 3', action: (init:any) => console.log('Option 3 selected', init), items: [
      { label: 'Sub-option A', action: (init:any) => console.log('Sub-option A selected', init) },
      { label: 'Sub-option B', action: (init:any) => console.log('Sub-option B selected', init), items: [
        { label: 'Sub-sub-option i', action: (init:any) => console.log('Sub-sub-option i selected', init) },
        { label: 'Sub-sub-option ii', action: (init:any) => console.log('Sub-sub-option ii selected', init) },
      ] },
      { label: 'Sub-option C', action: (init:any) => console.log('Sub-option C selected', init) },
    ] },
  ];

  selectedOption = signal('Option 1');


  onContextMenuSelected(item: any) {
    console.log('Context menu item selected:', item);
  }
}
