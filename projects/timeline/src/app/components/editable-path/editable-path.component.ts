import { afterNextRender, Component, effect, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { NgBondContainer } from '@richapps/ngx-bond';
import { SVGEdit } from '@richapps/ngx-pentool';
import { distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-editable-path',
  imports: [],
  templateUrl: './editable-path.component.html',
  styleUrl: './editable-path.component.scss',
})
export class EditablePathComponent {
  static inspectableProperties = [
    {
      name: 'pathPosition',
      type: 'number',
      setterName: 'pathPosition',
      isSignal: true,
      event: 'pathPositionChanged',
    },
    {
      name: 'strokeWidth',
      type: 'number',
      setterName: 'strokeWidth',
      isSignal: true,
      event: 'strokeWidthChanged',
    },
  ];

  get inspectableProperties() {
    return EditablePathComponent.inspectableProperties;
  }

  svgCanvas = viewChild<ElementRef>('svg_canvas');

  el = inject(ElementRef);
  svgEdit?: SVGEdit;

  drag = inject(NgBondContainer);

  pathPosition = signal(0);
  pathPositionChanged = output<number>();

  strokeWidth = signal(1);
  strokeWidthChanged = output<number>();

  constructor() {
    afterNextRender(() => {
      if (this.svgCanvas()) {
        console.log('SVG Canvas initialized:', this.svgCanvas()?.nativeElement);
        this.svgEdit = new SVGEdit();
        this.svgEdit.svg = this.svgCanvas()?.nativeElement;
        this.svgEdit.init();

        this.svgEdit.pathChanged$.pipe(distinctUntilChanged()).subscribe((d) => {
          this.calculatePathLength();
        });

        this.calculatePathLength();
      }
    });

    effect(() => {
      this.pathPositionChanged.emit(this.pathPosition());
    });

    effect(() => {
      this.strokeWidthChanged.emit(this.strokeWidth());
    });
  }

  debug() {
    console.log(this.drag);
    this.drag.disable();
    this.el.nativeElement.setAttribute('preventselection', 'true');
    this.svgCanvas()?.nativeElement.setAttribute('preventselection', 'true');
  }

  enable() {
    console.log(this.drag);
    this.drag.enable();
    this.el.nativeElement.removeAttribute('preventselection');
    this.svgCanvas()?.nativeElement.removeAttribute('preventselection');
  }

  calculatePathLength() {
    // const pathElement = document.getElementById('path' + this.paths.indexOf(path)) as unknown as SVGPathElement;
    // path.totalLength = pathElement.getTotalLength();
    // path.strokeDashArray = path.totalLength;

    const paths = this.getAllpaths();
    const path = paths[0] as SVGPathElement;
    if (!path) {
      console.warn('No path found to calculate length');
      return;
    }
    const length = path.getTotalLength();
    console.log('Path length:', length);
  }

  getAllpaths() {
    const controlPaths = this.svgCanvas()?.nativeElement?.querySelectorAll('.editorControls > path');
    const existingPaths = this.svgCanvas()?.nativeElement?.querySelectorAll('path');

    const userPaths: SVGPathElement[] = [];
    existingPaths.forEach((path: SVGPathElement) => {
      console.log('path removed', path);
      const isControlPath = controlPaths && Array.from(controlPaths).includes(path);
      if (!isControlPath) {
        userPaths.push(path);
      }
      // path.remove();
    });

    return userPaths;
  }
}
