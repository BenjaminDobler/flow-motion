import { Component, ElementRef, viewChild } from '@angular/core';
import { SVGEdit } from '@richapps/ngx-pentool';

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

  setPath() {
    if (this.svgEdit) {
      this.svgEdit.setPath('M 10 10 L 100 100 L 200 50');
    }
  }

  clearAll() {
    if (this.svgEdit) {
      this.svgEdit.clearAll();
    }
  }
}
