export interface XYPosition {
  x: number;
  y: number;
}

function distance(a: XYPosition, b: XYPosition): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
export function getBend(
  a: XYPosition,
  b: XYPosition,
  c: XYPosition,
  size: number,
): string {
  const bendSize = Math.min(distance(a, b) / 2, distance(b, c) / 2, size);
  const { x, y } = b;

  // no bend
  if ((a.x === x && x === c.x) || (a.y === y && y === c.y)) {
    return `L${x} ${y}`;
  }

  // first segment is horizontal
  if (a.y === y) {
    const xDir = a.x < c.x ? -1 : 1;
    const yDir = a.y < c.y ? 1 : -1;
    return `L ${x + bendSize * xDir},${y}Q ${x},${y} ${x},${y + bendSize * yDir}`;
  }

  const xDir = a.x < c.x ? 1 : -1;
  const yDir = a.y < c.y ? -1 : 1;
  return `L ${x},${y + bendSize * yDir}Q ${x},${y} ${x + bendSize * xDir},${y}`;
}

export function pointToPath(
  points: { x: number; y: number }[],
  curveRadius: number = 0,
) {
  const segments: any[] = [];

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

  const path = segments.join(' ');
  return path;
}
