export function getSimpleBezierPath(x1: number, y1: number, x2: number, y2: number) {
  return `M ${x1} ${y1} C ${x2} ${y1} ${x1} ${y2} ${x2} ${y2}`;
}
