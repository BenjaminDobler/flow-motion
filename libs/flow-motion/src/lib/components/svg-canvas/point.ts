import { Subject } from 'rxjs';
import { Path } from './path';

let pointCount = 0;

export class Point {
  id = pointCount++;

  private _x: number = 0;
  public get x(): number {
    return this._x;
  }
  public set x(value: number) {
    this._x = value;
    this.update();
  }
  private _y: number = 0;
  public get y(): number {
    return this._y;
  }
  public set y(value: number) {
    this._y = value;
    this.update();
  }

  controlPoint1?: Point;
  controlPoint2?: Point;
  opposite?: Point;
  centerPoint?: Point;

  positionChanged = new Subject<{x: number, y: number}>();

  //ref: SVGCircleElement;


  destroy$ = new Subject<void>();

  constructor(
    private path: Path,
    public type: 'point' | 'control' | 'nearest-point' | 'curve'
  ) {
  }

  update() {
    // if (this.draw) {
    //   this.draw(undefined, this.path);

    // }
    this.path.draw();
    this.positionChanged.next({x: this.x, y: this.y});
  }

  serialize(): any {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      type: this.type,
      controlPoint1: this.controlPoint1?.serialize(),
      controlPoint2: this.controlPoint2?.serialize(),
      opposite: this.opposite?.serialize(),
      centerPoint: this.centerPoint?.serialize(),
    };
  }
}
