import { Component, ElementRef, viewChild } from '@angular/core';
import { SVGEdit } from './svgedit/svgedit';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  title = 'pentool';

  svgCanvas = viewChild<ElementRef>('svg_canvas');

  svgEdit?: SVGEdit;

  ngAfterViewInit() {
    if (this.svgCanvas()) {
      this.svgEdit = new SVGEdit();
      this.svgEdit.svg = this.svgCanvas()?.nativeElement;
      this.svgEdit.init();
    }
  }

  calculatePoints() {
    if (this.svgEdit?.selectedPathElement) {
      this.svgEdit.calculatePointsOnPath(this.svgEdit.selectedPathElement);
    }
  }

  fromHistory() {
    if (this.svgEdit) {
      this.svgEdit.fromHistory();
    }
  }
}
