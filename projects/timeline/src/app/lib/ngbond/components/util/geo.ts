export const getDistance = (p1: Point, p2: Point) => {
  const { x: x1, y: y1 } = p1;
  const { x: x2, y: y2 } = p2;
  const y = x2 - x1;
  const x = y2 - y1;
  return Math.sqrt(x * x + y * y);
};


export interface Rect { x: number; y: number; height: number; width: number }
export interface Point { x: number; y: number; adjacent?: Point[]; gridX?: number; gridY?: number }
export interface Line { from: Point; to: Point }