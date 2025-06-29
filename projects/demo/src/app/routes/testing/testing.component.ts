import { Component, effect, signal, viewChild } from '@angular/core';
import { NgBondContainer } from '../../lib/ngbond/components/ng-bond-container/ng-bond-container';
import { getDistance, Line, Point, Rect } from '../../lib/ngbond/components/util/geo';





const key = (point: Point) => {
  return point.x + '_' + point.y;
};

const clonePoint = (p: Point): Point => {
  return {
    x: p.x,
    y: p.y,
    adjacent: p.adjacent,
  };
};

const getAllXYValues = (rect: Rect) => {
  const allX = [];
  allX.push(rect.x);
  allX.push(rect.x + rect.width);
  allX.push(rect.x + rect.width / 2);

  const allY = [];
  allY.push(rect.y);
  allY.push(rect.y + rect.height);
  allY.push(rect.y + rect.height / 2);

  return [allX, allY];
};

const expandRect = (rect: Rect, margin: number) => {
  const r: Rect = {
    x: rect.x - margin / 2,
    y: rect.y - margin / 2,
    height: rect.height + margin,
    width: rect.width + margin,
  };
  return r;
};

const rectToPointArray = (rect: Rect) => {
  const points: Point[] = [];

  // draw edges
  points.push({ x: rect.x, y: rect.y });
  points.push({ x: rect.x + rect.width, y: rect.y });
  points.push({
    x: rect.x + rect.width,
    y: rect.y + rect.height,
  });
  points.push({ x: rect.x, y: rect.y + rect.height });

  // draw middle points
  points.push({ x: rect.x + rect.width / 2, y: rect.y });
  points.push({ x: rect.x, y: rect.y + rect.height / 2 });
  points.push({ x: rect.x + rect.width, y: rect.y + rect.height / 2 });
  points.push({ x: rect.x + rect.width / 2, y: rect.y + rect.height });

  return points;
};

@Component({
  selector: 'app-testing',
  imports: [NgBondContainer],
  templateUrl: './testing.component.html',
  styleUrl: './testing.component.scss',
})
export class TestingComponent {
  p1 = viewChild<NgBondContainer>('p1');
  p2 = viewChild<NgBondContainer>('p2');
  rectMargin = signal(80);
  protected points = signal<Point[]>([]);
  protected horizontalLines = signal<Line[]>([]);
  protected verticalLines = signal<Line[]>([]);
  protected activePoint?: Point;
  protected startPoint?: Point;
  protected endPoint?: Point;

  resultPath = signal('');

  pointMap: Map<string, Point> = new Map<string, Point>();

  constructor() {
    effect(() => {
      const rect1 = {
        x: this.p1()?.gX() || 0,
        y: this.p1()?.gY() || 0,
        width: this.p1()?.width() || 0,
        height: this.p1()?.height() || 0,
      };

      const rect2 = {
        x: this.p2()?.gX() || 0,
        y: this.p2()?.gY() || 0,
        width: this.p2()?.width() || 0,
        height: this.p2()?.height() || 0,
      };

      console.log('same? ', this.p1() === this.p2());

      this.rectsChanged(rect1, rect2, this.rectMargin());
    });
  }

  rectsChanged(r1: Rect, r2: Rect, rectMargin: number) {
    console.log('rects changed ', rectMargin);
    const outerRect1 = expandRect(r1, rectMargin);
    const outerRect2 = expandRect(r2, rectMargin);

    const [xs1, ys1] = getAllXYValues(outerRect1);
    const [xs2, ys2] = getAllXYValues(outerRect2);
    const allX = [...xs1, ...xs2];
    const allY = [...ys1, ...ys2];

    let allPoints: Point[] = [];

    const xMin = Math.min(outerRect1.x, outerRect2.x);
    const xMax = Math.max(outerRect1.x + outerRect1.width, outerRect2.x + outerRect2.width);

    const yMin = Math.min(outerRect1.y, outerRect2.y);
    const yMax = Math.max(outerRect1.y + outerRect1.height, outerRect2.y + outerRect2.height);

    allX.push(xMin + (xMax - xMin) / 2);
    allY.push(yMin + (yMax - yMin) / 2);

    for (let x = 0; x < allX.length; x++) {
      for (let y = 0; y < allY.length; y++) {
        allPoints.push({ x: allX[x], y: allY[y] });
      }
    }

    // draw points between rects

    const allXMinPoints = allPoints.filter((p) => p.x === xMin);
    const horizontalLines = allXMinPoints.map((p) => ({
      from: { x: xMin, y: p.y },
      to: { x: xMax, y: p.y },
    }));

    const allXMaxPoints = allPoints.filter((p) => p.x === xMax);
    const horizontalLines2 = allXMaxPoints.map((p) => ({
      from: { x: xMin, y: p.y },
      to: { x: xMax, y: p.y },
    }));
    this.horizontalLines.set([...horizontalLines, ...horizontalLines2]);

    const allYLines = allPoints.filter((p) => p.y === yMin || p.y === yMax);
    const verticalLines = allYLines.map((p) => ({
      from: { x: p.x, y: yMin },
      to: { x: p.x, y: yMax },
    }));
    this.verticalLines.set(verticalLines);

    allPoints.sort((a, b) => {
      return a.y - b.y;
    });

    let sortedPoints: Point[] = [];
    for (let y = 0; y < 7; y++) {
      const row = allPoints.slice(y * 7, y * 7 + 7);
      row.sort((a, b) => {
        return a.x - b.x;
      });
      sortedPoints = [...sortedPoints, ...row];
    }

    allPoints = sortedPoints;
    const uniquePoints = allPoints;

    const rows: Point[][] = [];

    this.pointMap = new Map();

    for (let y = 0; y < 7; y++) {
      const col: Point[] = [];
      rows.push(col);
      for (let x = 0; x < 7; x++) {
        const index = y * 7 + x;
        const p = uniquePoints[index];
        this.pointMap.set(key(p), p);
        p.gridX = x;
        p.gridY = y;

        if (!p.adjacent) {
          p.adjacent = [];
        }
        if (x > 0) {
          p.adjacent.push(uniquePoints[index - 1]);
        }
        if (x < 7 - 1) {
          p.adjacent.push(uniquePoints[index + 1]);
        }
        if (y > 0) {
          p.adjacent.push(uniquePoints[index - 7]);
        }
        if (y < 7 - 1) {
          p.adjacent.push(uniquePoints[index + 7]);
        }
        col.push(p);
      }
    }

    const updatePoint = (p: Point | undefined, level = 0) => {
      if (p && typeof p.gridX !== 'undefined' && typeof p.gridY !== 'undefined') {
        const updatedPoint = rows[p.gridY][p.gridX];
        p.x = updatedPoint.x;
        p.y = updatedPoint.y;
        if (level === 0) {
          p.adjacent?.forEach((ap) => {
            updatePoint(ap, level + 1);
          });
        }
      }
    };

    updatePoint(this.activePoint);
    updatePoint(this.startPoint);
    updatePoint(this.endPoint);

    this.points.set(uniquePoints);

    if (this.startPoint && this.endPoint) {
      this.startFromNode(this.startPoint);
    }
  }

  startFromNode(startNode: Point | undefined) {
    if (!startNode) {
      return;
    }
    console.log('START NODE', startNode === this.pointMap.get(key(startNode)));
    const realStartNode = this.pointMap.get(key(startNode));
    if (realStartNode) {
      startNode = realStartNode;
    }

    // visit points neigbours
    const visited: Map<string, Point> = new Map<string, Point>();
    const unvisited: Map<string, Point> = new Map(this.pointMap);
    const shortestDistances = new Map<string, { previous?: Point; distance: number }>();

    this.pointMap.forEach((p, key) => {
      shortestDistances.set(key, { distance: Number.POSITIVE_INFINITY });
    });

    shortestDistances.set(key(startNode), { distance: 0 });
    visited.set(key(startNode), startNode);
    unvisited.delete(key(startNode));

    let current = startNode;

    console.log('entries ', unvisited.size);
    while (unvisited.size > 0) {
      console.log('do ', unvisited.size);
      let pointWithSmallestDist!: Point | null;

      let smallestDist = Number.POSITIVE_INFINITY;
      const currentDistEntry = shortestDistances.get(key(current));

      let currentDistance = 0;
      if (currentDistEntry) {
        currentDistance = currentDistEntry.distance;
      } else {
        throw Error('no distance for ' + key(current));
      }
      console.log('current distance ', currentDistance);
      current.adjacent?.forEach((adjacentPoint) => {
        if (!visited.has(key(adjacentPoint))) {
          const adjacentDistance = getDistance(current, adjacentPoint);
          const dist = currentDistance + adjacentDistance;
          const existingSmallestDistPoint = shortestDistances.get(key(adjacentPoint));

          if (!existingSmallestDistPoint || existingSmallestDistPoint.distance > dist) {
            shortestDistances.set(key(adjacentPoint), { distance: dist, previous: current });
          }
          console.log(dist, smallestDist);
          if (dist < smallestDist) {
            smallestDist = dist;
            pointWithSmallestDist = adjacentPoint;
            console.log('point with smallest ', key(adjacentPoint));
          }
        } else {
          console.log('has already been visited!');
        }
      });
      visited.set(key(current), current);
      unvisited.delete(key(current));

      if (!pointWithSmallestDist) {
        console.log('What now? All adjatents have already been visited!?');
        const next = unvisited.values().next().value;
        if (next) {
          current = next;
        } else {
          console.log('no next');
        }
      } else {
        current = pointWithSmallestDist as Point;
      }
    }

    shortestDistances.forEach((a, k) => {
      if (a && a.previous) {
        console.log(k, key(a.previous), a.distance);
      } else {
        console.log(k, a);
      }
    });

    let resultPath = '';
    if (this.endPoint) {
      let currentP: Point | undefined = this.endPoint;
      resultPath = `M ${currentP.x} ${currentP.y}`;
      while (currentP && currentP !== this.startPoint) {
        const p = shortestDistances.get(key(currentP));
        console.log('p ', p);
        currentP = p?.previous;
        if (currentP) {
          console.log(currentP);
          resultPath += `L ${currentP.x} ${currentP.y}`;
        }
      }
    }
    console.log(resultPath);

    this.resultPath.set(resultPath);
  }

  updateMargin(m: number) {
    this.rectMargin.set(m);
  }

  setActivePoint(p: Point) {
    if (this.activePoint === p) {
      this.activePoint = undefined;
    } else {
      this.activePoint = p;
    }
  }

  setStartPoint(p: Point) {
    this.startPoint = p; //clonePoint(p)
  }

  setEndPoint(p: Point) {
    this.endPoint = p; //clonePoint(p)
  }
}
