import { DragPoint } from '../../../services/ngbond.service';
import { LinkPosition, NgBondProperty } from '../../ng-bond-property/ng-bond-property';
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
  p2: NgBondProperty | DragPoint
) {
  const rect1 = p1.container?.bounds;

  let distance1 = 0;
  let distance2 = 0;
  if (p1Position === 'bottom' || p1Position === 'top') {
    distance1 = (p1.x() + p1.width() / 2) / rect1?.width;
  }

  if (p1Position === 'left' || p1Position === 'right') {
    distance1 = (p1.y() + p1.height() / 2) / rect1?.height;
  }
  let rect2 = { width: 20, height: 20, left: x2, top: y2 };

  if ('container' in p2) {
    rect2 = (p2 as NgBondProperty).container?.bounds as any;

    if (p2Position === 'bottom' || p2Position === 'top') {
      distance2 = ((p2 as NgBondProperty).x() + (p2 as NgBondProperty).width() / 2) / rect2?.width;
    }

    if (p2Position === 'left' || p2Position === 'right') {
      distance2 = ((p2 as NgBondProperty).y() + p2.height() / 2) / rect2?.height;
    }
  }

  const path = OrthogonalConnector.route({
    pointA: { shape: rect1 as any, side: p1Position, distance: distance1 },
    pointB: { shape: rect2 as any, side: p2Position, distance: distance2 },
    shapeMargin: 10,
    globalBoundsMargin: 10,
    globalBounds: { left: 0, top: 0, width: 2000, height: 2000 },
  });
  const orthoPath = pointToPath(path, curveRadius);
  return orthoPath;
}
