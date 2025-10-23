import { Component, effect, ElementRef, inject, Injectable, output, signal, viewChild } from '@angular/core';
import { Point } from './point';
import { filter, finalize, fromEvent, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { distance, findNearestPointOnLine, getAngle, getSnappedAnglePoint, insertAt, isInWhichSegment } from './util';
import { Path } from './path';
import { PathPointComponent } from './path-point/path-point.component';
import { KeyManager } from '../../services/key.manager';

export class SVGCanvas {
  private _svg?: SVGElement | undefined;

  history: any[] = [];

  paths = signal<any[]>([]);

  scale = 1;

  keys = inject(KeyManager);

  onNewPathAdded?: (path: Path) => void;

  //private _d: string = '';
  insertionPointActive = false;
  //   public get d(): string {
  //     return this._d;
  //   }
  //   public set d(value: string) {
  //     if (value !== this._d && this.onPathChanged && this.selectedPathElement) {
  //       this.onPathChanged(value, this.selectedPathElement);
  //     }
  //     this._d = value;
  //   }

  onPathChanged?: (d: string, path: SVGPathElement) => void;

  pointsToSegment: any = [];

  nearestPoint: Point | undefined;

  // previewPath?: SVGPathElement;

  previewPathD = signal<string>('');

  public get svg(): SVGElement | undefined {
    return this._svg;
  }
  public set svg(value: SVGElement | undefined) {
    this._svg = value;

    if (this._svg) {
      const existingPaths = this._svg.querySelectorAll('path');
      existingPaths.forEach((path) => {
        this.initializeExistingPath(path as SVGPathElement);
      });
    }
  }
  dragging = false;
  mode$ = new Subject<string>();

  pathChanged$ = new Subject<string>();

  mode = signal<string>('select');
  modeChange = new Subject<string>();

  initializeExistingPath(path: SVGPathElement) {
    // fromEvent(path, 'mousedown').subscribe((evt: any) => {
    //   console.log('mouse down path', evt);
    //   evt.preventDefault();
    //   evt.stopPropagation();
    //   this.onPathClick(evt);
    // });
    // fromEvent(path, 'mouseover').subscribe((evt: any) => {
    //   console.log('mouse over path', evt);
    //   this.mouseOverPath(evt);
    // });
    // fromEvent(path, 'mouseout').subscribe((evt: any) => {
    //   console.log('mouse out path', evt);
    //   this.mouseOutPath(evt);
    // });
  }

  // connectionD = '';

  isOverLine = false;
  isOverPoint = false;

  isCurveDragging = false;

  keyAltDown = false;
  keyMetaDown = false;

  private _selectedPathElement?: Path | undefined;
  public get selectedPathElement(): Path | undefined {
    return this._selectedPathElement;
  }
  public set selectedPathElement(value: Path | undefined) {
    if (value !== this._selectedPathElement && value) {
      this._selectedPathElement = undefined;
      // this.points.forEach((p) => {
      //   p.destroy();
      // });
      // this.points = [];
      //this.generatePointsFromPath(value);
      this.selectedPathElement$.next(value);
    } else if (!value) {
      // this.points.forEach((p) => {
      //   p.destroy();
      // });
      // this.points = [];
    }

    this._selectedPathElement = value;
    this.draw();
  }

  selectedPathElement$: Subject<Path> = new Subject<Path>();

  constructor() {
    effect(() => {
      const m = this.mode();
      if (m === 'pen') {
        if (this.svg) {
          this.svg.style.pointerEvents = 'auto';
        }
        document.body.classList.add('pen-cursor');
      } else {
        document.body.classList.remove('pen-cursor');
        if (this.svg) {
          this.svg.style.pointerEvents = 'none';
        }
      }
      this.modeChange.next(m);
    });
  }

  init(svg: SVGElement) {
    this.svg = svg;
    this.initKeyboard();
    this.initMouseGuestures();
  }

  initKeyboard() {
    fromEvent(window, 'keydown').subscribe((event: any) => {
      if (event.code === 'Escape') {
      }

      if (event.key === 's') {
        this.mode.set('select');
      }

      if (event.key === 'p') {
        this.mode.set('pen');
      }

      this.keyAltDown = event.altKey;
      if (this.keyAltDown) {
        document.body.classList.add('alt-down');
      }
      if (event.key === 'Meta') {
        this.keyMetaDown = true;
      }
    });

    fromEvent(window, 'keyup').subscribe((event: any) => {
      document.body.classList.remove('alt-down');
      this.keyAltDown = false;
      this.keyMetaDown = false;
    });
  }

  initMouseGuestures() {
    const mouseDown$ = fromEvent<MouseEvent>(window, 'mousedown');
    const mouseUp$ = fromEvent<MouseEvent>(window, 'mouseup');
    const mouseMove$ = fromEvent<MouseEvent>(window, 'mousemove');

    let moves = 0;
    let downPoint: Point;
    let parentRect = { left: 0, top: 0 };
    if (this.svg) {
      parentRect = this.svg.getBoundingClientRect();
    }

    mouseMove$.subscribe((event) => {
      let n: any;
      let smallestDistance = 1000000;
      let targetSegment: any;

      this.pointsToSegment.forEach((segment: any) => {
        if (segment.type === 'C') {
          segment.points.forEach((p: any) => {
            const dist = distance(p, { x: (event.clientX - parentRect.left) / this.scale, y: (event.clientY - parentRect.top) / this.scale });
            if (dist < smallestDistance) {
              smallestDistance = dist;
              n = p;
              targetSegment = segment;
            }
          });
        } else if (segment.type === 'L') {
          const toP = segment.points[1];
          const fromP = segment.points[0];
          const nearestPoint = findNearestPointOnLine((event.clientX - parentRect.left) / this.scale, (event.clientY - parentRect.top) / this.scale, fromP.x, fromP.y, toP.x, toP.y);

          const dist = distance(nearestPoint, { x: (event.clientX - parentRect.left) / this.scale, y: (event.clientY - parentRect.top) / this.scale });
          if (dist < smallestDistance) {
            smallestDistance = dist;
            n = nearestPoint;
            targetSegment = segment;
          }
          // this.nearestPoint.draw();
        }
      });

      if (this.nearestPoint && n && smallestDistance < 10) {
        this.setHighlightedSegment(n, targetSegment);
      } else {
        this.setHighlightedSegment(undefined, undefined);
      }
    });

    mouseMove$.pipe(filter((x) => !this.dragging)).subscribe((evt: MouseEvent) => {
      if (this.mode() === 'pen') {
        let nextPoint = { x: (evt.clientX - parentRect.left) / this.scale, y: (evt.clientY - parentRect.top) / this.scale };

        if (this.keys.isKeyDown('Shift') && this.selectedPathElement) {
          nextPoint = getSnappedAnglePoint(nextPoint, this.selectedPathElement.points()[this.selectedPathElement.points().length - 1]);
        }
        this.draw(nextPoint);
      }
    });

    mouseDown$
      .pipe(
        filter((x: any) => {
          return !this.insertionPointActive && this.mode() === 'pen' && !x.target.classList.contains('point');
        }),
        tap((downEvent: MouseEvent) => {
          let nextPoint = { x: (downEvent.clientX - parentRect.left) / this.scale, y: (downEvent.clientY - parentRect.top) / this.scale };

          if (this.keys.isKeyDown('Shift') && this.selectedPathElement) {
            nextPoint = getSnappedAnglePoint(nextPoint, this.selectedPathElement.points()[this.selectedPathElement.points().length - 1]);
          }

          if (this.svg && !this.selectedPathElement) {
            this.createNewPath();
          }

          const lastPoint = this.selectedPathElement?.points()[this.selectedPathElement?.points().length - 1];
          moves = 0;
          if (this.svg) {
            parentRect = this.svg?.getBoundingClientRect();
          }
          downPoint = new Point(this.selectedPathElement as Path, 'point');
          downPoint.x = nextPoint.x;
          downPoint.y = nextPoint.y;

          if (lastPoint && lastPoint.controlPoint2) {
            downPoint.controlPoint1 = new Point(this.selectedPathElement as Path, 'control');
            downPoint.controlPoint1.x = downPoint.x;
            downPoint.controlPoint1.y = downPoint.y;

            downPoint.controlPoint2 = new Point(this.selectedPathElement as Path, 'control');
            downPoint.controlPoint2.x = downPoint.x;
            downPoint.controlPoint2.y = downPoint.y;
          }

          this.selectedPathElement?.points.update((p) => [...p, downPoint]);
          this.addToHistory();

          this.draw({ x: downPoint.x, y: downPoint.y });
        }),
        switchMap(() => {
          return mouseMove$.pipe(
            tap((dragMoveEvent) => {
              if (moves === 3) {
                const previousPoint = this.selectedPathElement?.points()[this.selectedPathElement?.points().length - 2];
                if (previousPoint && !previousPoint.controlPoint1) {
                  previousPoint.controlPoint2 = new Point(this.selectedPathElement as Path, 'control');
                  previousPoint.controlPoint2.x = previousPoint.x;
                  previousPoint.controlPoint2.y = previousPoint.y;
                }

                const controlPoint1 = new Point(this.selectedPathElement as Path, 'control');
                controlPoint1.x = downPoint.x;
                controlPoint1.y = downPoint.y;
                controlPoint1.centerPoint = downPoint;

                const controlPoint2 = new Point(this.selectedPathElement as Path, 'control');
                controlPoint2.x = downPoint.x;
                controlPoint2.y = downPoint.y;
                controlPoint2.centerPoint = downPoint;
                controlPoint2.opposite = controlPoint1;

                controlPoint1.opposite = controlPoint2;

                if (downPoint.controlPoint1) {
                  //downPoint.controlPoint1.destroy(false);
                }
                if (downPoint.controlPoint2) {
                  //downPoint.controlPoint2.destroy(false);
                }

                downPoint.controlPoint1 = controlPoint1;
                downPoint.controlPoint2 = controlPoint2;
              } else if (moves > 3) {
                this.dragging = true;
                if (downPoint.controlPoint1) {
                  let nextPoint = { x: (dragMoveEvent.clientX - parentRect.left) / this.scale, y: (dragMoveEvent.clientY - parentRect.top) / this.scale };
                  if (this.keys.isKeyDown('Shift') && this.selectedPathElement) {
                    nextPoint = getSnappedAnglePoint(nextPoint, this.selectedPathElement.points()[this.selectedPathElement.points().length - 1]);
                  }
                  const diffX = nextPoint.x - downPoint.x;
                  const diffY = nextPoint.y - downPoint.y;

                  downPoint.controlPoint1.x = downPoint.x + -1 * diffX;
                  downPoint.controlPoint1.y = downPoint.y + -1 * diffY;
                }

                if (downPoint.controlPoint2) {
                  let nextPoint = { x: (dragMoveEvent.clientX - parentRect.left) / this.scale, y: (dragMoveEvent.clientY - parentRect.top) / this.scale };
                  if (this.keys.isKeyDown('Shift') && this.selectedPathElement) {
                    nextPoint = getSnappedAnglePoint(nextPoint, this.selectedPathElement.points()[this.selectedPathElement.points().length - 1]);
                  }
                  downPoint.controlPoint2.x = nextPoint.x;
                  downPoint.controlPoint2.y = nextPoint.y;
                }
              }

              moves++;
              this.draw();
            }),
            finalize(() => {
              this.dragging = false;
              this.draw();
              // this.calculatePointsOnPath(this.selectedPathElement as SVGPathElement);
            }),
            takeUntil(mouseUp$)
          );
        })
      )
      .subscribe();
  }

  // What is the type of segment?
  setHighlightedSegment(n: { x: number; y: number; t: number } | undefined, segment: any) {
    if (n && this.nearestPoint) {
      this.insertionPointActive = true;
      this.nearestPoint.x = n.x;
      this.nearestPoint.y = n.y;
      // Todo: highlight segment in different color
    } else if (this.nearestPoint) {
      this.nearestPoint.x = -100;
      this.insertionPointActive = false;
    }
  }

  updatePath(d: string) {
    if (this.selectedPathElement) {
      this.selectedPathElement.d.set(d);
      this.pathChanged$.next(d);
    }
  }

  createNewPath(d?: string) {
    if (!this.svg || !this.mode || this.mode() !== 'pen') {
      return;
    }
    const newPath = new Path(this);
    this.paths.set([...this.paths(), newPath]);
    if (d) {
      newPath.d.set(d);
    }

    this.selectedPathElement = newPath;

    // if (startX && startY) {
    //   const p = new Point(this.selectedPathElement as Path, 'point', () => this.draw());
    //   p.x = startX;
    //   p.y = startY;
    //   // this.points = [p];
    //   newPath.points.set([p]);
    // }

    if (this.selectedPathElement?.points().length > 0) {
      // this.updatePath(`M${(this.points[0].x, this.points[0].y)}`);
    }

    if (this.onNewPathAdded) {
      this.onNewPathAdded(newPath);
    }
    //this.draw();
  }

  draw(movePoint?: { x: number; y: number }, path?: Path) {
    if (this.selectedPathElement) {
      this.selectedPathElement.draw(movePoint, path);
    }
  }

  generatePointsFromPath(path: SVGPathElement) {
    const segments = (path as any).getPathData();

    const points: Point[] = [];

    segments.forEach((seg: any, index: number) => {
      const previousPoint = points[points.length - 1];
      if (seg.type === 'M') {
        const p = new Point(this.selectedPathElement as Path, 'point');
        p.x = seg.values[0];
        p.y = seg.values[1];
        points.push(p);
      }
      if (seg.type === 'L') {
        const p = new Point(this.selectedPathElement as Path, 'point');
        p.x = seg.values[0];
        p.y = seg.values[1];
        points.push(p);
      }
      if (seg.type === 'C') {
        const p = new Point(this.selectedPathElement as Path, 'point');
        p.x = seg.values[4];
        p.y = seg.values[5];

        const controlPoint1 = new Point(this.selectedPathElement as Path, 'control');

        controlPoint1.x = seg.values[0];
        controlPoint1.y = seg.values[1];
        controlPoint1.centerPoint = previousPoint;

        const controlPoint2 = new Point(this.selectedPathElement as Path, 'control');
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

    this.selectedPathElement?.points.set(points);

    // this.draw();
  }

  onPathClick(path: Path, clickEvent: MouseEvent) {
    const target = clickEvent.target as any;

    if (this.selectedPathElement !== path) {
      this.selectedPathElement = path;
      return;
    }

    let parentRect = { left: 0, top: 0 };
    if (this.svg) {
      parentRect = this.svg.getBoundingClientRect();
    }
    const segIndex = isInWhichSegment(target, (clickEvent.clientX - parentRect.left) / this.scale, (clickEvent.clientY - parentRect.top) / this.scale);
    const segment = target.getPathData()[segIndex];

    let points = this.selectedPathElement?.points() || [];

    if (segment.type === 'L') {
      const p = points.find((p) => p.x === segment.values[0] && p.y === segment.values[1]);
      if (p) {
        const pointIndex = points.indexOf(p);
        const mouseUp$ = fromEvent<MouseEvent>(window, 'mouseup');
        const mouseMove$ = fromEvent<MouseEvent>(window, 'mousemove');
        const previousPoint = points[pointIndex - 1];
        let moveCount = 0;
        this.isCurveDragging = true;

        mouseMove$
          .pipe(
            takeUntil(mouseUp$),
            finalize(() => {
              if (moveCount < 3) {
                const p = new Point(this.selectedPathElement as Path, 'point');
                p.x = (clickEvent.clientX - parentRect.left) / this.scale;
                p.y = (clickEvent.clientY - parentRect.top) / this.scale;
                points = insertAt(points, pointIndex, p);
              }
              this.isCurveDragging = false;
            })
          )
          .subscribe((evt: MouseEvent) => {
            moveCount++;

            const mousePoint = {
              x: (evt.clientX - parentRect.left) / this.scale,
              y: (evt.clientY - parentRect.top) / this.scale,
            };

            if (moveCount > 3) {
              // Convert line to curve

              if (!previousPoint.controlPoint2) {
                previousPoint.controlPoint2 = new Point(this.selectedPathElement as Path, 'curve');
                previousPoint.centerPoint = previousPoint;

                if (previousPoint.controlPoint1) {
                  previousPoint.controlPoint2.opposite = previousPoint.controlPoint1;
                  previousPoint.controlPoint1.opposite = previousPoint.controlPoint2;
                }
              }

              if (!p.controlPoint1) {
                p.controlPoint1 = new Point(this.selectedPathElement as Path, 'curve');
                p.controlPoint1.centerPoint = p;
                if (p.controlPoint2) {
                  p.controlPoint2.opposite = p.controlPoint1;
                  p.controlPoint1.opposite = p.controlPoint2;
                }
              }

              const c1 = previousPoint.controlPoint2;
              const c2 = p.controlPoint1;

              let angle1 = getAngle(mousePoint, previousPoint);
              const distance1 = distance(previousPoint, mousePoint);
              const radius1 = distance1 * 0.7;
              c1.x = previousPoint.x + Math.cos(angle1) * radius1;
              c1.y = previousPoint.y + Math.sin(angle1) * radius1;

              let angle2 = getAngle(mousePoint, p);
              const distance2 = distance(p, mousePoint);
              const radius2 = distance2 * 0.7;
              c2.x = p.x + Math.cos(angle2) * radius2;
              c2.y = p.y + Math.sin(angle2) * radius2;
            }
            this.draw();
          });
      }
    }

    if (segment.type === 'C') {
      const p = this.selectedPathElement?.points().find((p) => p.x === segment.values[0] && p.y === segment.values[1]);
      if (p) {
        const pointIndex = this.selectedPathElement?.points().indexOf(p as Point);
      }
    }
  }

  mouseOverPath(path: Path, evt: any) {
    let parentRect = { left: 0, top: 0 };
    if (this.svg) {
      parentRect = this.svg.getBoundingClientRect();
    }
    const segIndex = isInWhichSegment(evt.target, evt.clientX - parentRect.left, evt.clientY - parentRect.top);
    const segment = evt.target.getPathData()[segIndex];

    if (segment.type === 'C') {
      // find the point for t=0.5 for the given cubic bezier segment
      const values = segment.values;

      // Get the previous segment to find the start point (p0)
      let prevSegment;
      let currentX = 0;
      let currentY = 0;
      if (segIndex > 0) {
        prevSegment = evt.target.getPathData()[segIndex - 1];
        currentX = prevSegment.values[prevSegment.values.length - 2];
        currentY = prevSegment.values[prevSegment.values.length - 1];
      }
    }

    if (segment.type === 'L') {
      this.isOverLine = true;
    }
  }

  mouseOutPath(path: Path, $event: any) {
    this.isOverLine = false;
  }

  onPointClick(point: Point) {
    if (this.keyAltDown) {

      this.selectedPathElement?.points.update((points) => {
        return points.filter((p) => p !== point);
      });
      //this.selectedPathElement?.points().filter((p) => p !== point);

      //point.destroy();
      this.draw();
    } else if (this.mode() === 'pen' && this.selectedPathElement?.points()[0] === point) {
      this.selectedPathElement.isClosed.set(true);
      this.draw();
    }
  }

  overPoint(event: MouseEvent) {
    this.isOverPoint = true;
  }

  outPoint(event: MouseEvent) {
    this.isOverPoint = false;
  }

  pathUnselected$ = new Subject<void>();

  unselectPath() {
    this.selectedPathElement = undefined;
    this.pathUnselected$.next();
    this.draw();
  }

  // Split a cubic Bézier curve at parameter t into two curve segments
  // Returns {leftCurve: {p0, p1, p2, p3}, rightCurve: {p0, p1, p2, p3}}
  splitCubicBezier(t: number, p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }): { leftCurve: any; rightCurve: any } {
    // Helper function to linearly interpolate between two points
    const lerp = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) => ({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    });

    // First level of interpolation
    const p01 = lerp(p0, p1, t);
    const p12 = lerp(p1, p2, t);
    const p23 = lerp(p2, p3, t);

    // Second level of interpolation
    const p012 = lerp(p01, p12, t);
    const p123 = lerp(p12, p23, t);

    // Third level of interpolation - this gives us the split point
    const splitPoint = lerp(p012, p123, t);

    // Left curve (from 0 to t)
    const leftCurve = {
      p0: p0, // Start point stays the same
      p1: p01, // New control point 1
      p2: p012, // New control point 2
      p3: splitPoint, // End point is the split point
    };

    // Right curve (from t to 1)
    const rightCurve = {
      p0: splitPoint, // Start point is the split point
      p1: p123, // New control point 1
      p2: p23, // New control point 2
      p3: p3, // End point stays the same
    };

    return { leftCurve, rightCurve };
  }

  // Example: Split a curve segment at a specific point for path editing
  splitCurveSegmentAt(segmentIndex: number, t: number): boolean {
    if (!this.selectedPathElement) return false;

    const segments = (this.selectedPathElement as any).getPathData();
    const segment = segments[segmentIndex];

    if (segment.type !== 'C') return false; // Only works with cubic curves

    // Get the start point from previous segment
    let currentX = 0,
      currentY = 0;
    if (segmentIndex > 0) {
      const prevSegment = segments[segmentIndex - 1];
      currentX = prevSegment.values[prevSegment.values.length - 2];
      currentY = prevSegment.values[prevSegment.values.length - 1];
    }

    // Define the original curve control points
    const p0 = { x: currentX, y: currentY };
    const p1 = { x: segment.values[0], y: segment.values[1] };
    const p2 = { x: segment.values[2], y: segment.values[3] };
    const p3 = { x: segment.values[4], y: segment.values[5] };

    // Split the curve
    const { leftCurve, rightCurve } = this.splitCubicBezier(t, p0, p1, p2, p3);

    // Create new segments array with the split curves
    const newSegments = [...segments];

    // Replace the original curve with two new curves
    newSegments[segmentIndex] = {
      type: 'C',
      values: [leftCurve.p1.x, leftCurve.p1.y, leftCurve.p2.x, leftCurve.p2.y, leftCurve.p3.x, leftCurve.p3.y],
    };

    // Insert the second curve after the first
    newSegments.splice(segmentIndex + 1, 0, {
      type: 'C',
      values: [rightCurve.p1.x, rightCurve.p1.y, rightCurve.p2.x, rightCurve.p2.y, rightCurve.p3.x, rightCurve.p3.y],
    });

    // Update the path with new segments (you'd need to convert back to d string)
    // This is a simplified example - you'd need proper path reconstruction
    console.log('Split curve into two segments:', { leftCurve, rightCurve });

    return true;
  }

  positionUpdated(point: Point, diffX: number, diffY: number) {
    if (point.controlPoint1) {
      point.controlPoint1.x += diffX;
      point.controlPoint1.y += diffY;
    }

    if (point.controlPoint2) {
      point.controlPoint2.x += diffX;
      point.controlPoint2.y += diffY;
    }

    if (point.opposite && point.centerPoint) {
      const diffX = point.x - point.centerPoint.x;
      const diffY = point.y - point.centerPoint.y;

      point.opposite.x = point.centerPoint.x + -1 * diffX;
      point.opposite.y = point.centerPoint.y + -1 * diffY;
    }
    this.draw();
    // this.calculatePointsOnPath(this.selectedPathElement as SVGPathElement);
  }

  calculatePointsOnPath(path: SVGPathElement) {
    this.pointsToSegment = [];
    if (!path) {
      return;
    }
    const segments = (path as any).getPathData();

    const NUMBER_OF_STEPS = 50;
    let step = 1 / NUMBER_OF_STEPS;

    segments.forEach((seg: any, index: number) => {
      let prevSegment;
      let currentX = 0;
      let currentY = 0;
      if (index > 0) {
        prevSegment = segments[index - 1];
        currentX = prevSegment.values[prevSegment.values.length - 2];
        currentY = prevSegment.values[prevSegment.values.length - 1];
      }

      if (seg.type === 'C') {
        const point: any = {
          type: 'C',
          segmentIndex: index,
          points: [],
        };
        const values = seg.values;
        let x1 = parseFloat(values[0]);
        let y1 = parseFloat(values[1]);
        let x2 = parseFloat(values[2]);
        let y2 = parseFloat(values[3]);
        let x = parseFloat(values[4]);
        let y = parseFloat(values[5]);

        // Approximate the curve using line segments
        let t = 0;
        while (t < 1) {
          let xT = currentX * (1 - t) * (1 - t) * (1 - t) + 3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + x * t * t * t;
          let yT = currentY * (1 - t) * (1 - t) * (1 - t) + 3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + y * t * t * t;
          // points.push({ x: xT, y: yT });
          //   console.log('points on curve', xT, yT);
          //   const p = new Point(this.svg, 'point', () => this.draw(), this.positionUpdated.bind(this), this.onPointClick.bind(this));
          // p.x = xT;
          // p.y = yT;
          point.points.push({ x: xT, y: yT, t: t });
          this.pointsToSegment.push(point);

          t += step;
        }
      } else if (seg.type === 'L') {
        const toP = { x: seg.values[0], y: seg.values[1] };
        const fromP = { x: prevSegment.values[prevSegment.values.length - 2], y: prevSegment.values[prevSegment.values.length - 1] };
        this.pointsToSegment.push({ type: 'L', segmentIndex: index, points: [fromP, toP] });
      }
    });
  }

  addToHistory() {
    // const state = this.selectedPathElement?.points().map((p) => p.serialize());
    // this.history.push(state);
  }

  fromHistory() {
    const state = this.history.pop();

    // this.selectedPathElement?.points().forEach((p) => {
    //   p.destroy();
    // });

    if (state && this.selectedPathElement) {
      if (this.selectedPathElement) {
        const path = this.selectedPathElement as Path;
        const p = state.map((p: any) => {
          const point = new Point(path, p.type);
          point.x = p.x;
          point.y = p.y;
          if (p.controlPoint1) {
            point.controlPoint1 = new Point(path, 'control');
            point.controlPoint1.x = p.controlPoint1.x;
            point.controlPoint1.y = p.controlPoint1.y;
          }
          if (p.controlPoint2) {
            point.controlPoint2 = new Point(path, 'control');
            point.controlPoint2.x = p.controlPoint2.x;
            point.controlPoint2.y = p.controlPoint2.y;
          }

          return point;
        });
        this.selectedPathElement?.points.set(p);
        this.draw();
      }
    }
  }

  deletePath(p: Path) {
    if (this.selectedPathElement === p) {
      this.unselectPath();
    }
    this.paths.update((paths) => {
      return paths.filter((path) => path !== p);
    });
  }

  setPath(d: string) {
    this.createNewPath(d);
  }
}
