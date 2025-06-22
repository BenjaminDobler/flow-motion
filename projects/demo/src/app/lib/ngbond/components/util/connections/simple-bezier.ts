import { DragPoint } from '../../../services/ngbond.service';
import {
  LinkPosition,
  NgBondProperty,
} from '../../ng-bond-property/ng-bond-property';

export function getSimpleBezierPath(
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
  const yOffset = 7;
  return `M ${x1} ${y1} C ${x2} ${y1 + yOffset} ${x1} ${y2 + yOffset} ${x2} ${y2 + yOffset}`;
}
