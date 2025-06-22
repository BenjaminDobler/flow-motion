import { DragPoint } from '../../../services/ngbond.service';
import {
  LinkPosition,
  NgBondProperty,
} from '../../ng-bond-property/ng-bond-property';

export function getLinePath(
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
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}
