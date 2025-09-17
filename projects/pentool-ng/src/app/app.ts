import { Component, inject, signal, viewChild } from '@angular/core';
import {
  ComponentFactory,
  ElementPropertyInspectorComponent,
  ElementTreeComponent,
  KeyManager,
  NgBondContainer,
  NgBondService,
  NgBondWorld,
  Path,
  PathDirectiveDirective,
  SelectionManager,
  SVGCanvas,
  SvgCanvasComponent,
} from '@richapps/ngx-bond';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [SvgCanvasComponent, ElementTreeComponent, NgBondWorld, FormsModule, ElementPropertyInspectorComponent],
  providers: [NgBondService, SelectionManager, KeyManager, ComponentFactory, SVGCanvas],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: {
    '(dblclick)': 'this.onDoubleClick($event)',
  },
})
export class App {
  selection = inject(SelectionManager);
  svg = inject(SVGCanvas);

  svgCanvas = viewChild(SvgCanvasComponent);
  componentFactory = inject(ComponentFactory);

  ngAfterViewInit() {
    this.svg.modeChange.subscribe((m) => {
      if (!this.svg.selectedPathElement && m === 'pen') {
        this.selection.disabled.set(true);
      }
    });
  }

  onDoubleClick(event: MouseEvent) {
    console.log('double click', event);
    const canvas = this.svgCanvas();
    if (canvas) {
      if (this.svg.selectedPathElement && this.selection.disabled()) {
        this.selection.disabled.set(false);
        this.svg.mode.set('select');
        const path = this.svg.selectedPathElement;
        this.svg.unselectPath();
        // this.selection.select(canvas.selectedPathElement);
        console.log('children', this.componentFactory.containerElementMap);

        this.componentFactory.containerElementMap.forEach((container: any, key: NgBondContainer) => {
          console.log(key, container);
          container.directives.forEach((dir: any) => {
            console.log('dir', typeof dir);
            if (dir.type === 'path-directive') {
              console.log('found path directive', dir);
              if ((dir as PathDirectiveDirective).path() === path) {
                this.selection.select(key);
              }
            }
          });
        });
      }
    }
  }

  serializePath(path: Path | undefined) {
    if (path) {
      const data = JSON.stringify(path.serialize());
      localStorage.setItem('path-data', data);
      console.log(data);
    }
  }

  deserializePath() {
    const data = localStorage.getItem('path-data');
    if (data) {
      const obj = JSON.parse(data);
      const path = Path.deserialize(obj, this.svg);
      const canvas = this.svgCanvas();

      if (canvas) {
        this.svg.paths.update((paths) => {
          return [...paths, path];
        });

        path.draw();
        //canvas.selectedPathElement = path;

        //canvas.createNewPath(obj.d);
      }
    }
  }

  setMotionPath() {
    const path = Path.deserialize({ d: 'M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80', fill: 'none', stroke: '#ffffff' }, this.svg);
    this.svg.paths.update((paths) => {
      return [...paths, path];
    });

    path.draw();
  }
}
