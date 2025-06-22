import { DragPoint } from '../../../services/ngbond.service';
import {
  LinkPosition,
  NgBondProperty,
} from '../../ng-bond-property/ng-bond-property';
import { pointToPath } from '../connections.util';
import { OrthogonalConnector } from '../orthoconnector';

export function getOrhogonalConnection(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  p1Position: LinkPosition,
  p2Position: LinkPosition,
  curveRadius = 10,
  p1: NgBondProperty,
  p2: NgBondProperty | DragPoint,
) {
  const rect1 = p1.container?.bounds;

  let distance1 = 0;
  let distance2 = 0;
  if (p1Position === 'bottom' || p1Position === 'top') {
    distance1 = p1.x() / rect1?.width;
  }

  if (p1Position === 'left' || p1Position === 'right') {
    distance1 = p1.y() / rect1?.height;
  }
  let rect2 = { width: 20, height: 20, left: x2, top: y2 };

  if (p2.hasOwnProperty('container')) {
    rect2 = (p2 as NgBondProperty).container?.bounds as any;

    if (p2Position === 'bottom' || p2Position === 'top') {
      distance2 = (p2 as NgBondProperty).x() / rect2?.width;
    }

    if (p2Position === 'left' || p2Position === 'right') {
      distance2 = (p2 as NgBondProperty).y() / rect2?.height;
    }
  }

  console.log(rect1, rect2);

  const path = OrthogonalConnector.route({
    pointA: { shape: rect1 as any, side: p1Position, distance: distance1 },
    pointB: { shape: rect2 as any, side: p2Position, distance: distance2 },
    shapeMargin: 10,
    globalBoundsMargin: 100,
    globalBounds: { left: 0, top: 0, width: 2000, height: 2000 },
  });
  console.log('path ', path);

  const orthoPath = pointToPath(path, 6);
  return orthoPath;
}
