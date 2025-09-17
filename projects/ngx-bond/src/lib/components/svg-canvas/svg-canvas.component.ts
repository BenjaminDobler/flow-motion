import { afterNextRender, Component, effect, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { Point } from './point';
import { filter, finalize, fromEvent, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { bringToTopofSVG, distance, findNearestPointOnLine, getAngle, getSnappedAnglePoint, insertAt, isInWhichSegment } from './util';
import { PathDirectiveDirective } from './path-directive.directive';
import { Path } from './path';
import { PathPointComponent } from './path-point/path-point.component';
import { KeyManager } from '@richapps/ngx-bond';
import { SVGCanvas } from './svgcanvas';

@Component({
  selector: 'svg-canvas',
  imports: [PathDirectiveDirective, PathPointComponent],
  templateUrl: './svg-canvas.component.html',
  styleUrl: './svg-canvas.component.scss',
})
export class SvgCanvasComponent {
  svg = inject(SVGCanvas);
  drawSvg = viewChild<ElementRef<SVGElement>>('drawSvg');

  constructor() {
    afterNextRender(() => {
      if (this.drawSvg()?.nativeElement) {
        this.svg.init(this.drawSvg()?.nativeElement as SVGAElement);
      }
    });
  }
}
