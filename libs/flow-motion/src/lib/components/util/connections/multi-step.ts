import { LinkPosition } from '../../fm-property/fm-property';
import { getBend } from '../connections.util';

export function getMultiLinePath(x1: number, y1: number, x2: number, y2: number, p1Position: LinkPosition, p2Position: LinkPosition, curveRadius = 10) {
  let offset = 50;
  let path = `M ${x1} ${y1}`;

  let points: any[] = [];

  const isHorizontalCase1 = p1Position === 'right' && p2Position === 'left' && x2 > x1;
  const isHorizontalCase1Reverse = p2Position === 'right' && p1Position === 'left' && x1 > x2;

  const isHorizontalCase2 = p1Position === 'right' && p2Position === 'left' && x2 < x1;
  const isHorizontalCase2Reverse = p2Position === 'right' && p1Position === 'left' && x1 < x2;

  const getHorizontalCase1Points = (x1: number, y1: number, x2: number, y2: number) => {
    const p = [];
    const dist = x2 - x1;
    offset = dist / 2;

    p.push({ x: x1, y: y1 });
    p.push({ x: x1 + offset, y: y1 });
    p.push({ x: x2 - offset, y: y2 });
    p.push({ x: x2, y: y2 });
    return p;
  };

  const getHorizontalCase2Points = (x1: number, y1: number, x2: number, y2: number) => {
    const p = [];
    const ydist = y1 - y2;
    p.push({ x: x1, y: y1 });
    p.push({ x: x1 + offset, y: y1 });
    p.push({ x: x1 + offset, y: y1 - ydist / 2 });
    p.push({ x: x2 - offset, y: y1 - ydist / 2 });
    p.push({ x: x2 - offset, y: y2 });
    p.push({ x: x2, y: y2 });
    return p;
  };

  if (isHorizontalCase1) {
    points = getHorizontalCase1Points(x1, y1, x2, y2);
  } else if (isHorizontalCase1Reverse) {
    points = getHorizontalCase1Points(x2, y2, x1, y1);
  } else if (isHorizontalCase2) {
    points = getHorizontalCase2Points(x1, y1, x2, y2);
  } else if (isHorizontalCase2Reverse) {
    points = getHorizontalCase2Points(x2, y2, x1, y1);
  } else if (p1Position === 'top' && p2Position === 'left' && x1 < x2 && y1 > y2) {
    points.push({ x: x1, y: y1 });
    points.push({ x: x1, y: y2 });
    points.push({ x: x2, y: y2 });
  } else if (p1Position === 'top' && p2Position === 'left' && x1 > x2 && y1 > y2) {
    const ydist = y2 - y1;
    points.push({ x: x1, y: y1 });
    points.push({ x: x1, y: y1 + ydist / 2 });
    points.push({ x: x2 - offset, y: y1 + ydist / 2 });
    points.push({ x: x2 - offset, y: y2 });
    points.push({ x: x2, y: y2 });
  } else if (p1Position === 'top' && p2Position === 'left' && x1 > x2 && y1 < y2) {
    points.push({ x: x1, y: y1 });
    points.push({ x: x1, y: y1 - offset });
    points.push({ x: x2 - offset, y: y1 - offset });
    points.push({ x: x2 - offset, y: y2 });
    points.push({ x: x2, y: y2 });
  } else if (p1Position === 'top' && p2Position === 'left' && x1 < x2 && y1 < y2) {
    const xdist = x2 - x1;
    points.push({ x: x1, y: y1 });
    points.push({ x: x1, y: y1 - offset });
    points.push({ x: x1 + xdist / 2, y: y1 - offset });
    points.push({ x: x1 + xdist / 2, y: y2 });
    points.push({ x: x2, y: y2 });
  }

  const segments: string[] = [];

  for (let i = 0; i <= points.length - 1; i++) {
    if (i === 0) {
      segments.push(`M ${points[i].x} ${points[i].y}`);
    } else if (i === points.length - 1) {
      segments.push(`L ${points[i].x} ${points[i].y}`);
    } else {
      const prevPoint = points[i - 1];
      const currentPoint = points[i];
      const nextPoint = points[i + 1];
      segments.push(getBend(prevPoint, currentPoint, nextPoint, curveRadius));
    }
  }

  path = segments.join(' ');

  return path;
}
