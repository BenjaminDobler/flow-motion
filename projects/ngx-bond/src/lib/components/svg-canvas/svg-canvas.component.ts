import { afterNextRender, ChangeDetectionStrategy, Component, effect, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { PathDirectiveDirective } from './path-directive.directive';
import { PathPointComponent } from './path-point/path-point.component';
import { SVGCanvas } from './svgcanvas';

@Component({
  selector: 'svg-canvas',
  imports: [PathDirectiveDirective, PathPointComponent],
  templateUrl: './svg-canvas.component.html',
  styleUrl: './svg-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SvgCanvasComponent {
  svg = inject(SVGCanvas);
  drawSvg = viewChild<ElementRef<SVGElement>>('drawSvg');

  scale = input(1);

  constructor() {
    afterNextRender(() => {
      if (this.drawSvg()?.nativeElement) {
        this.svg.init(this.drawSvg()?.nativeElement as SVGAElement);
      }
    });

    effect(() => {
      this.svg.scale = this.scale();
    }); 
  }
}
