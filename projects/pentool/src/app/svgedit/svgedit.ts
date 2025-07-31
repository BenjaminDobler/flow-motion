import { filter, finalize, from, fromEvent, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { Point } from './point';
import { bringToTopofSVG, distance, findNearestPointOnLine, getAngle, insertAt, isInWhichSegment } from './util';

export class SVGEdit {
  points: Point[] = [];
  private _svg?: SVGElement | undefined;

  history: any[] = [];

  onNewPathAdded?: (path: SVGPathElement) => void;

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

  pathClosed = false;

  onPathChanged?: (d: string, path: SVGPathElement) => void;

  private controlLinesPath?: SVGPathElement;

  pointsToSegment: any = [];

  nearestPoint: Point | undefined;

  previewPath?: SVGPathElement;

  curveCenterPoint?: Point;

  public get svg(): SVGElement | undefined {
    return this._svg;
  }
  public set svg(value: SVGElement | undefined) {
    this._svg = value;

    if (this._svg) {
      const controlLines = this.svg?.querySelector('.control_lines');

      const existingPaths = this._svg.querySelectorAll('path');
      console.log('existing paths', existingPaths);
      existingPaths.forEach((path) => {
        this.initializeExistingPath(path as SVGPathElement);
      });

      if (!this.svg?.querySelector('.editorControls')) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.classList.add('editorControls');

        const controlLines = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.controlLinesPath = controlLines;
        controlLines.classList.add('control_lines');
        group.appendChild(controlLines);

        const newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        newPath.setAttribute('fill', 'none');
        newPath.setAttribute('stroke', '#fff');
        newPath.setAttribute('stroke-width', '1');
        newPath.setAttribute('stroke-dasharray', '5 5');
        this.previewPath = newPath;

        group.appendChild(newPath);

        this.svg?.appendChild(group);

        this.nearestPoint = new Point(
          this.svg,
          'nearest-point',
          () => this.draw(),
          this.positionUpdated.bind(this),
          () => {
            console.log('nearest point clicked');
          }
        );

        this.curveCenterPoint = new Point(
          this.svg,
          'point',
          () => this.draw(),
          this.positionUpdated.bind(this),
          () => {
            console.log('split curve');
          }
        );
      } else {
        if (controlLines) {
          this.controlLinesPath = controlLines as SVGPathElement;
        }
      }

      fromEvent(this.svg as any, 'mousedown').subscribe((evt) => {
        this.onCanvas(evt);
      });
    }
  }
  dragging = false;
  mode$ = new Subject<string>();

  private _mode = 'select';
  public get mode() {
    return this._mode;
  }
  public set mode(value) {
    this._mode = value;
    if (this.mode === 'pen') {
      this.svg?.classList.add('pen-cursor');
    } else {
      this.svg?.classList.remove('pen-cursor');
    }
  }


  initializeExistingPath(path: SVGPathElement) {
    fromEvent(path, 'mousedown').subscribe(($event) => {
      this.onPathClick($event);
    });

    fromEvent(path, 'mouseover').subscribe(($event) => {
      this.mouseOverPath($event);
    });

    fromEvent(path, 'mouseout').subscribe(($event) => {
      this.mouseOutPath($event);
    });
  }

  connectionD = '';

  isOverLine = false;
  isOverPoint = false;

  isCurveDragging = false;

  keyAltDown = false;
  keyMetaDown = false;

  private _selectedPathElement?: SVGPathElement | undefined;
  public get selectedPathElement(): SVGPathElement | undefined {
    return this._selectedPathElement;
  }
  public set selectedPathElement(value: SVGPathElement | undefined) {
    if (value !== this._selectedPathElement && value) {
      this.generatePointsFromPath(value);
      this.selectedPathElement$.next(value);
      const editorGroup = this.svg?.querySelector('.editorControls') as SVGElement;
      if (editorGroup) {
        bringToTopofSVG(editorGroup);
      }
    } else if (!value) {
      console.log('destroy points', this.points);
      this.points.forEach((p) => {
        p.destroy();
      });
      this.points = [];
    }

    this._selectedPathElement = value;
    this.draw();
  }

  selectedPathElement$: Subject<SVGPathElement> = new Subject<SVGPathElement>();

  constructor() {}

  init() {
    this.initKeyboard();
    this.initMouseGuestures();
  }

  initKeyboard() {
    fromEvent(window, 'keydown').subscribe((event: any) => {
      if (event.code === 'Escape') {
      }

      if (event.key === 's') {
        this.mode = 'select';
      }

      if (event.key === 'p') {
        this.mode = 'pen';
      }

      this.keyAltDown = event.altKey;
      if (this.keyAltDown) {
        this.svg?.classList.add('alt-down');
      }
      if (event.key === 'Meta') {
        this.keyMetaDown = true;
      }
    });

    fromEvent(window, 'keyup').subscribe((event: any) => {
      this.svg?.classList.remove('alt-down');
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
            const dist = distance(p, { x: event.clientX - parentRect.left, y: event.clientY - parentRect.top });
            if (dist < smallestDistance) {
              smallestDistance = dist;
              n = p;
              targetSegment = segment;
            }
          });
        } else if (segment.type === 'L') {
          const toP = segment.points[1];
          const fromP = segment.points[0];
          const nearestPoint = findNearestPointOnLine(event.clientX - parentRect.left, event.clientY - parentRect.top, fromP.x, fromP.y, toP.x, toP.y);

          const dist = distance(nearestPoint, { x: event.clientX - parentRect.left, y: event.clientY - parentRect.top });
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
      if (this.mode === 'pen') {
        this.draw({ x: evt.clientX - parentRect.left, y: evt.clientY - parentRect.top });
      }
    });

    mouseDown$
      .pipe(
        filter((x: any) => {
          return !this.insertionPointActive && this.mode === 'pen' && !x.target.classList.contains('point');
        }),
        tap((downEvent: MouseEvent) => {
          const lastPoint = this.points[this.points.length - 1];
          moves = 0;
          downPoint = new Point(this.svg, 'point', () => this.draw(), this.positionUpdated.bind(this), this.onPointClick.bind(this));
          downPoint.x = downEvent.clientX - parentRect.left;
          downPoint.y = downEvent.clientY - parentRect.top;

          if (lastPoint && lastPoint.controlPoint2) {
            downPoint.controlPoint1 = new Point(this.svg, 'control', () => this.draw(), this.positionUpdated.bind(this), this.onPointClick.bind(this));
            downPoint.controlPoint1.x = downPoint.x;
            downPoint.controlPoint1.y = downPoint.y;

            downPoint.controlPoint2 = new Point(this.svg, 'control', () => this.draw(), this.positionUpdated.bind(this), this.onPointClick.bind(this));
            downPoint.controlPoint2.x = downPoint.x;
            downPoint.controlPoint2.y = downPoint.y;
          }

          this.points.push(downPoint);
          this.addToHistory();
          this.draw();
        }),
        switchMap(() => {
          return mouseMove$.pipe(
            tap((dragMoveEvent) => {
              if (moves === 3) {
                const previousPoint = this.points[this.points.length - 2];
                if (!previousPoint.controlPoint1) {
                  previousPoint.controlPoint2 = new Point(this.svg, 'control', () => this.draw(), this.positionUpdated.bind(this), this.onPointClick.bind(this));
                  previousPoint.controlPoint2.x = previousPoint.x;
                  previousPoint.controlPoint2.y = previousPoint.y;
                }

                const controlPoint1 = new Point(this.svg, 'control', () => this.draw(), this.positionUpdated.bind(this), this.onPointClick.bind(this));
                controlPoint1.x = downPoint.x;
                controlPoint1.y = downPoint.y;
                controlPoint1.centerPoint = downPoint;

                const controlPoint2 = new Point(this.svg, 'control', () => this.draw(), this.positionUpdated.bind(this), this.onPointClick.bind(this));
                controlPoint2.x = downPoint.x;
                controlPoint2.y = downPoint.y;
                controlPoint2.centerPoint = downPoint;
                controlPoint2.opposite = controlPoint1;

                controlPoint1.opposite = controlPoint2;

                if (downPoint.controlPoint1) {
                  downPoint.controlPoint1.destroy(false);
                }
                if (downPoint.controlPoint2) {
                  downPoint.controlPoint2.destroy(false);
                }

                downPoint.controlPoint1 = controlPoint1;
                downPoint.controlPoint2 = controlPoint2;
              } else if (moves > 3) {
                this.dragging = true;
                if (downPoint.controlPoint1) {
                  const diffX = dragMoveEvent.clientX - parentRect.left - downPoint.x;
                  const diffY = dragMoveEvent.clientY - parentRect.top - downPoint.y;

                  downPoint.controlPoint1.x = downPoint.x + -1 * diffX;
                  downPoint.controlPoint1.y = downPoint.y + -1 * diffY;
                }

                if (downPoint.controlPoint2) {
                  downPoint.controlPoint2.x = dragMoveEvent.clientX - parentRect.left;
                  downPoint.controlPoint2.y = dragMoveEvent.clientY - parentRect.top;
                }
              }

              moves++;
              this.draw();
            }),
            finalize(() => {
              this.dragging = false;
              this.draw();
              this.calculatePointsOnPath(this.selectedPathElement as SVGPathElement);
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
      this.selectedPathElement.setAttribute('d', d);
    }
  }

  createNewPath() {
    if (!this.svg) {
      console.error('SVG element is not set');
      return;
    }
    console.log('create new Path', this.points);
    const newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    newPath.setAttribute('fill', 'none');
    newPath.setAttribute('stroke', '#fff');
    const pointsBefore = [...this.points];
    this.selectedPathElement = newPath;
    this.points = pointsBefore;

    if (this.points.length > 0) {
      // this.updatePath(`M${(this.points[0].x, this.points[0].y)}`);
    }

    fromEvent(newPath, 'mousedown')
      //.pipe(takeUntil(this.pathUnselected$))
      .subscribe(($event) => {
        this.onPathClick($event);
      });

    fromEvent(newPath, 'mouseover')
      //.pipe(takeUntil(this.pathUnselected$))
      .subscribe(($event) => {
        this.mouseOverPath($event);
      });

    fromEvent(newPath, 'mouseout')
      //.pipe(takeUntil(this.pathUnselected$))
      .subscribe(($event) => {
        this.mouseOutPath($event);
      });

    this.svg.appendChild(newPath);
    if (this.onNewPathAdded) {
      this.onNewPathAdded(newPath);
    }
  }

  draw(movePoint?: { x: number; y: number }) {
    if (this.svg && this.points.length > 0 && !this.selectedPathElement) {
      this.createNewPath();
    }

    let d = '';
    let connectionD = '';

    const points = [...this.points];

    let i = 0;
    while (i < points.length) {
      const p = points[i];

      if (p.controlPoint2) {
        connectionD += `M${p.x} ${p.y} L${p.controlPoint2.x} ${p.controlPoint2.y}`;
      }
      if (p.controlPoint1) {
        connectionD += `M${p.x} ${p.y} L${p.controlPoint1.x} ${p.controlPoint1.y}`;
      }

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

    if (this.pathClosed) {
      d += ' Z';
    }

    // Draw preview path
    if (!this.pathClosed) {
      let previewD = '';
      const lastPoint = points[points.length - 1];
      if (lastPoint && movePoint && !lastPoint.controlPoint2) {
        previewD = `M${lastPoint.x} ${lastPoint.y} L${movePoint.x} ${movePoint.y}`;
      } else if (lastPoint && movePoint && lastPoint.controlPoint2) {
        previewD = `M${lastPoint.x} ${lastPoint.y} C${lastPoint.controlPoint2.x} ${lastPoint.controlPoint2.y} ${movePoint.x} ${movePoint.y} ${movePoint.x} ${movePoint.y}`;
      }
      this.previewPath?.setAttribute('d', previewD);
    } else {
      this.previewPath?.setAttribute('d', '');
    }

    this.connectionD = connectionD;

    if (this.controlLinesPath) {
      this.controlLinesPath.setAttribute('d', connectionD);
    }
    if (this.selectedPathElement) {
      this.updatePath(d);
    }
  }

  generatePointsFromPath(path: SVGPathElement) {
    const segments = (path as any).getPathData();

    const points: Point[] = [];

    segments.forEach((seg: any, index: number) => {
      const previousPoint = points[points.length - 1];
      if (seg.type === 'M') {
        const p = new Point(this.svg, 'point', () => this.draw(), this.positionUpdated.bind(this), this.onPointClick.bind(this));
        p.x = seg.values[0];
        p.y = seg.values[1];
        points.push(p);
      }
      if (seg.type === 'L') {
        const p = new Point(this.svg, 'point', () => this.draw(), this.positionUpdated.bind(this), this.onPointClick.bind(this));
        p.x = seg.values[0];
        p.y = seg.values[1];
        points.push(p);
      }
      if (seg.type === 'C') {
        const p = new Point(this.svg, 'point', () => this.draw(), this.positionUpdated.bind(this), this.onPointClick.bind(this));
        p.x = seg.values[4];
        p.y = seg.values[5];

        const controlPoint1 = new Point(this.svg, 'control', () => this.draw(), this.positionUpdated.bind(this), this.onPointClick.bind(this));

        controlPoint1.x = seg.values[0];
        controlPoint1.y = seg.values[1];
        controlPoint1.centerPoint = previousPoint;

        const controlPoint2 = new Point(this.svg, 'control', () => this.draw(), this.positionUpdated.bind(this), this.onPointClick.bind(this));
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

    this.points = points;

    // this.draw();
  }

  onPathClick(evt: any) {
    console.log('selecting path 1', evt.target);

    if (this.selectedPathElement !== evt.target) {
      console.log('selecting path', evt.target);
      this.selectedPathElement = evt.target;
      return;
    }

    let parentRect = { left: 0, top: 0 };
    if (this.svg) {
      parentRect = this.svg.getBoundingClientRect();
    }
    const segIndex = isInWhichSegment(evt.target, evt.clientX - parentRect.left, evt.clientY - parentRect.top);
    const segment = evt.target.getPathData()[segIndex];

    if (segment.type === 'L') {
      const p = this.points.find((p) => p.x === segment.values[0] && p.y === segment.values[1]);
      if (p) {
        const pointIndex = this.points.indexOf(p);
        const mouseUp$ = fromEvent<MouseEvent>(window, 'mouseup');
        const mouseMove$ = fromEvent<MouseEvent>(window, 'mousemove');
        const previousPoint = this.points[pointIndex - 1];
        let moveCount = 0;
        this.isCurveDragging = true;

        mouseMove$
          .pipe(
            takeUntil(mouseUp$),
            finalize(() => {
              if (moveCount < 3) {
                const p = new Point(this.svg, 'point', () => this.draw(), this.positionUpdated.bind(this), this.onPointClick.bind(this));
                p.x = evt.clientX - parentRect.left;
                p.y = evt.clientY - parentRect.top;
                this.points = insertAt(this.points, pointIndex, p);
              }
              this.isCurveDragging = false;
            })
          )
          .subscribe((evt: MouseEvent) => {
            moveCount++;

            const mousePoint = {
              x: evt.clientX - parentRect.left,
              y: evt.clientY - parentRect.top,
            };

            if (moveCount > 3) {
              // Convert line to curve

              if (!previousPoint.controlPoint2) {
                previousPoint.controlPoint2 = new Point(this.svg, 'curve', () => this.draw(), this.positionUpdated.bind(this), this.onPointClick.bind(this));
                previousPoint.centerPoint = previousPoint;

                if (previousPoint.controlPoint1) {
                  previousPoint.controlPoint2.opposite = previousPoint.controlPoint1;
                  previousPoint.controlPoint1.opposite = previousPoint.controlPoint2;
                }
              }

              if (!p.controlPoint1) {
                p.controlPoint1 = new Point(this.svg, 'curve', () => this.draw(), this.positionUpdated.bind(this), this.onPointClick.bind(this));
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
      const p = this.points.find((p) => p.x === segment.values[0] && p.y === segment.values[1]);
      if (p) {
        const pointIndex = this.points.indexOf(p as Point);
      }
    }
  }

  mouseOverPath(evt: any) {
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

      // Define the four control points for cubic Bézier
      const p0 = { x: currentX, y: currentY }; // Start point
      const p1 = { x: parseFloat(values[0]), y: parseFloat(values[1]) }; // First control point
      const p2 = { x: parseFloat(values[2]), y: parseFloat(values[3]) }; // Second control point
      const p3 = { x: parseFloat(values[4]), y: parseFloat(values[5]) }; // End point

      // Calculate point at t=0.5 using cubic Bézier formula
      const t = 0.5;
      const oneMinusT = 1 - t;
      const oneMinusTSquared = oneMinusT * oneMinusT;
      const oneMinusTCubed = oneMinusTSquared * oneMinusT;
      const tSquared = t * t;
      const tCubed = tSquared * t;

      const x = oneMinusTCubed * p0.x + 3 * oneMinusTSquared * t * p1.x + 3 * oneMinusT * tSquared * p2.x + tCubed * p3.x;

      const y = oneMinusTCubed * p0.y + 3 * oneMinusTSquared * t * p1.y + 3 * oneMinusT * tSquared * p2.y + tCubed * p3.y;

      if (this.curveCenterPoint) {
        this.curveCenterPoint.x = x;
        this.curveCenterPoint.y = y;
      }
    }

    if (segment.type === 'L') {
      this.isOverLine = true;
    }
  }

  mouseOutPath($event: any) {
    this.isOverLine = false;
  }

  onPointClick(point: Point) {
    if (this.keyAltDown) {
      this.points = this.points.filter((p) => p !== point);
      point.destroy();
      this.draw();
    } else if (this.mode === 'pen' && this.points[0] === point) {
      console.log('close the path!');
      this.pathClosed = true;
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

  onCanvas(evt: any) {
    if (this.mode === 'select' && (evt.target === this.svg || evt.target.getAttribute('id') === 'canvas_bg')) {
      console.log('unselect path');
      this.selectedPathElement = undefined;
      this.pathUnselected$.next();
      this.pathClosed = false;
      this.draw();
    }
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
    this.calculatePointsOnPath(this.selectedPathElement as SVGPathElement);
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
    const state = this.points.map((p) => p.serialize());
    this.history.push(state);
  }

  fromHistory() {
    const state = this.history.pop();

    this.points.forEach((p) => {
      p.destroy();
    });

    if (state) {
      this.points = state.map((p: any) => {
        const point = new Point(this.svg, p.type, () => this.draw(), this.positionUpdated.bind(this), this.onPointClick.bind(this));
        point.x = p.x;
        point.y = p.y;
        if (p.controlPoint1) {
          point.controlPoint1 = new Point(this.svg, 'control', () => this.draw(), this.positionUpdated.bind(this), this.onPointClick.bind(this));
          point.controlPoint1.x = p.controlPoint1.x;
          point.controlPoint1.y = p.controlPoint1.y;
        }
        if (p.controlPoint2) {
          point.controlPoint2 = new Point(this.svg, 'control', () => this.draw(), this.positionUpdated.bind(this), this.onPointClick.bind(this));
          point.controlPoint2.x = p.controlPoint2.x;
          point.controlPoint2.y = p.controlPoint2.y;
        }
        return point;
      });
      this.draw();
    }
  }
}
