import { effect, signal, untracked } from '@angular/core';
import { Point } from './point';
import { SvgCanvasComponent } from './svg-canvas.component';
import { svgPathBbox } from 'svg-path-bbox';
import { SVGCanvas } from './svgcanvas';

let idCount = 0;
export class Path {
  d = signal<string>('');
  previewPathD = signal<string>('');
  points = signal<Point[]>([]);
  id = signal<string>('');
  isClosed = signal<boolean>(false);

  pointCount = 0;

  constructor(public canvas: SVGCanvas) {
    this.id.set('path-' + idCount++);
  }

  inspectableProperties = [
    {
      name: 'point-position-' + this.id,
      type: 'position',
      setterName: 'point-position',
      isSignal: false,
      event: 'point-position-changed-' + this.id,
      serializable: false,
    },
  ];

  moveBy(dx: number, dy: number) {
    this.points().forEach((p) => {
      p.x += dx;
      p.y += dy;

      if (p.controlPoint1) {
        p.controlPoint1.x += dx;
        p.controlPoint1.y += dy;
      }
      if (p.controlPoint2) {
        p.controlPoint2.x += dx;
        p.controlPoint2.y += dy;
      }
    });
  }

  draw(movePoint?: { x: number; y: number }, path?: Path) {
    let d = '';

    const points = [...this.points()];
    let i = 0;
    while (i < points.length) {
      const p = points[i];

      if (i === 0) {
        d += 'M' + p.x + ' ' + p.y;
      } else {
        const previousPoint = points[i - 1];
        if ((!previousPoint.controlPoint1 && !previousPoint.controlPoint2) || !p.controlPoint1) {
          d += ' L' + p.x + ' ' + p.y;
        } else {
          d += ' C' + previousPoint.controlPoint2?.x + ' ' + previousPoint.controlPoint2?.y + ' ' + p.controlPoint1?.x + ' ' + p.controlPoint1?.y + ' ' + p.x + ' ' + p.y;
        }
      }

      i++;
    }

    if (this.isClosed()) {
      d += ' Z';
    }

    if (!this.isClosed()) {
      let previewD = '';
      const lastPoint = points[points.length - 1];
      if (lastPoint && movePoint && !lastPoint.controlPoint2) {
        previewD = `M${lastPoint.x} ${lastPoint.y} L${movePoint.x} ${movePoint.y}`;
      } else if (lastPoint && movePoint && lastPoint.controlPoint2) {
        previewD = `M${lastPoint.x} ${lastPoint.y} C${lastPoint.controlPoint2.x} ${lastPoint.controlPoint2.y} ${movePoint.x} ${movePoint.y} ${movePoint.x} ${movePoint.y}`;
      }
      this.previewPathD.set(previewD);
    } else {
      this.previewPathD.set('');
    }

    this.d.set(d);
  }

  fill = signal<string>('none');
  stroke = signal<string>('#ffffff');
  strokeWidth = signal<number>(1);

  strokeDasharray = signal<string>(''); // e.g. "5,5"
  strokeDashoffset = signal<number>(0); // e.g. 5

  strokeLineJoint = signal<'miter' | 'round' | 'bevel'>('miter');

  strokeLineCap = signal<'butt' | 'round' | 'square'>('butt');

  boundingBox() {
    // const points = this.points();
    // if (points.length === 0) {
    //   return { x: 0, y: 0, width: 0, height: 0 };
    // }
    // let minX = points[0].x;
    // let minY = points[0].y;
    // let maxX = points[0].x;
    // let maxY = points[0].y;

    // points.forEach((p) => {
    //   if (p.x < minX) {
    //     minX = p.x;
    //   }
    //   if (p.y < minY) {
    //     minY = p.y;
    //   }
    //   if (p.x > maxX) {
    //     maxX = p.x;
    //   }
    //   if (p.y > maxY) {
    //     maxY = p.y;
    //   }
    // });

    // return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    const bbox = svgPathBbox(this.d());
    const rect = { x: bbox[0], y: bbox[1], width: bbox[2] - bbox[0], height: bbox[3] - bbox[1] };
    return rect;
  }

  serialize(): any {
    return {
      id: this.id(),
      isClosed: this.isClosed(),
      d: this.d(),
      fill: this.fill(),
      stroke: this.stroke(),
      strokeWidth: this.strokeWidth(),
      strokeDasharray: this.strokeDasharray(),
      strokeDashoffset: this.strokeDashoffset(),
      strokeLineJoint: this.strokeLineJoint(),
      strokeLineCap: this.strokeLineCap(),
    };
  }

  delete() {
    this.canvas.deletePath(this);
  }

  static deserialize(data: any, canvas: SVGCanvas): Path {
    const path = new Path(canvas);
    path.id.set(data.id);
    path.isClosed.set(data.isClosed);
    path.fill.set(data.fill);
    path.stroke.set(data.stroke);
    path.strokeWidth.set(data.strokeWidth);
    path.strokeDasharray.set(data.strokeDasharray);
    path.strokeDashoffset.set(data.strokeDashoffset);
    path.strokeLineJoint.set(data.strokeLineJoint);
    path.strokeLineCap.set(data.strokeLineCap);

    const svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svgPath.setAttribute('d', data.d);
    generatePointsFromPath(path, svgPath);

    return path;
  }
}

function generatePointsFromPath(selectedPathElement: Path, path: SVGPathElement) {
  const segments = (path as any).getPathData();

  const points: Point[] = [];

  segments.forEach((seg: any, index: number) => {
    const previousPoint = points[points.length - 1];
    if (seg.type === 'M') {
      const p = new Point(selectedPathElement as Path, 'point');
      p.x = seg.values[0];
      p.y = seg.values[1];
      points.push(p);
    }
    if (seg.type === 'L') {
      const p = new Point(selectedPathElement as Path, 'point');
      p.x = seg.values[0];
      p.y = seg.values[1];
      points.push(p);
    }
    if (seg.type === 'C') {
      const p = new Point(selectedPathElement as Path, 'point');
      p.x = seg.values[4];
      p.y = seg.values[5];

      const controlPoint1 = new Point(selectedPathElement as Path, 'control');

      controlPoint1.x = seg.values[0];
      controlPoint1.y = seg.values[1];
      controlPoint1.centerPoint = previousPoint;

      const controlPoint2 = new Point(selectedPathElement as Path, 'control');
      controlPoint2.x = seg.values[2];
      controlPoint2.y = seg.values[3];
      controlPoint2.centerPoint = p;

      p.controlPoint1 = controlPoint2;
      previousPoint.controlPoint2 = controlPoint1;

      if (previousPoint.controlPoint1 && previousPoint.controlPoint2) {
        previousPoint.controlPoint1.opposite = previousPoint.controlPoint2;
        previousPoint.controlPoint2.opposite = previousPoint.controlPoint1;
      }

      points.push(p);
    }
  });

  selectedPathElement?.points.set(points);

  // this.draw();
}
