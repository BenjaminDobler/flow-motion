import { NgBondContainer } from "../../public-api";

export function getAlignmentHelpLines(dragTarget: NgBondContainer, root: NgBondContainer, tolerance: number = 5) {
  const lines: { x1: number; y1: number; x2: number; y2: number; snapX: number; snapY: number }[] = [];

  const targetX = dragTarget.gX();
  const targetY = dragTarget.gY();
  const targetWidth = dragTarget.width();
  const targetHeight = dragTarget.height();
  const x = root.gX();
  const y = root.gY();
  const width = root.width();
  const height = root.height();
  if (root !== dragTarget) {
    // Vertical lines
  }

  if (Math.abs(x - targetX) < tolerance) {
    const line = {
      x1: x,
      y1: Math.min(y, targetY) - 20,
      x2: x,
      y2: Math.max(y + height, targetY + targetHeight) + 20,
      snapX: x,
      snapY: targetY,
    };
    lines.push(line);
  }

  if (Math.abs(targetX + targetWidth - x) < tolerance) {
    const line = {
      x1: x,
      y1: Math.min(y, targetY) - 20,
      x2: x,
      y2: Math.max(y + height, targetY + targetHeight) + 20,
      snapX: x - targetWidth,
      snapY: targetY,
    };
    lines.push(line);
  }

  if (Math.abs(targetX + targetWidth / 2 - x) < tolerance) {
    const line = {
      x1: x,
      y1: Math.min(y, targetY) - 20,
      x2: x,
      y2: Math.max(y + height, targetY + targetHeight) + 20,
      snapX: x - targetWidth / 2,
      snapY: targetY,
    };
    lines.push(line);
  }

  if (Math.abs(targetX + targetWidth - (x + width / 2)) < tolerance) {
    const line = {
      x1: x + width / 2,
      y1: Math.min(y, targetY) - 20,
      x2: x + width / 2,
      y2: Math.max(y + height, targetY + targetHeight) + 20,
      snapX: x + width / 2 - targetWidth,
      snapY: targetY,
    };
    lines.push(line);
  }

  if (Math.abs(targetX + targetWidth / 2 - (x + width / 2)) < tolerance) {
    const line = {
      x1: x + width / 2,
      y1: Math.min(y, targetY) - 20,
      x2: x + width / 2,
      y2: Math.max(y + height, targetY + targetHeight) + 20,
      snapX: x + width / 2 - targetWidth / 2,
      snapY: targetY,
    };
    lines.push(line);
  }

  if (Math.abs(targetX - (x + width / 2)) < tolerance) {
    const line = {
      x1: x + width / 2,
      y1: Math.min(y, targetY) - 20,
      x2: x + width / 2,
      y2: Math.max(y + height, targetY + targetHeight) + 20,
      snapX: x + width / 2,
      snapY: targetY,
    };
    lines.push(line);
  }

  if (Math.abs(targetX + targetWidth - (x + width)) < tolerance) {
    const line = {
      x1: x + width,
      y1: Math.min(y, targetY) - 20,
      x2: x + width,
      y2: Math.max(y + height, targetY + targetHeight) + 20,
      snapX: x + width - targetWidth,
      snapY: targetY,
    };
    lines.push(line);
  }

  if (Math.abs(targetX + targetWidth / 2 - (x + width)) < tolerance) {
    const line = {
      x1: x + width,
      y1: Math.min(y, targetY) - 20,
      x2: x + width,
      y2: Math.max(y + height, targetY + targetHeight) + 20,
      snapX: x + width - targetWidth / 2,
      snapY: targetY,
    };
    lines.push(line);
  }

  if (Math.abs(targetX - (x + width)) < tolerance) {
    const line = {
      x1: x + width,
      y1: Math.min(y, targetY) - 20,
      x2: x + width,
      y2: Math.max(y + height, targetY + targetHeight) + 20,
      snapX: x + width,
      snapY: targetY,
    };
    lines.push(line);
  }

  // Horizontal lines
  if (Math.abs(y - targetY) < tolerance) {
    const line = {
      x1: Math.min(x, targetX) - 20,
      y1: y,
      x2: Math.max(x + width, targetX + targetWidth) + 20,
      y2: y,
      snapX: targetX,
      snapY: y,
    };
    lines.push(line);
  }

  if (Math.abs(targetY + targetHeight - y) < tolerance) {
    const line = {
      x1: Math.min(x, targetX) - 20,
      y1: y,
      x2: Math.max(x + width, targetX + targetWidth) + 20,
      y2: y,
      snapX: targetX,
      snapY: y - targetHeight,
    };
    lines.push(line);
  }

  if (Math.abs(targetY + targetHeight / 2 - y) < tolerance) {
    const line = {
      x1: Math.min(x, targetX) - 20,
      y1: y,
      x2: Math.max(x + width, targetX + targetWidth) + 20,
      y2: y,
      snapX: targetX,
      snapY: y - targetHeight / 2,
    };
    lines.push(line);
  }

  if (Math.abs(targetY - (y + height / 2)) < tolerance) {
    const line = {
      x1: Math.min(x, targetX) - 20,
      y1: y + height / 2,
      x2: Math.max(x + width, targetX + targetWidth) + 20,
      y2: y + height / 2,
      snapX: targetX,
      snapY: y + height / 2,
    };
    lines.push(line);
  }

  if (Math.abs(targetY + targetHeight / 2 - (y + height / 2)) < tolerance) {
    const line = {
      x1: Math.min(x, targetX) - 20,
      y1: y + height / 2,
      x2: Math.max(x + width, targetX + targetWidth) + 20,
      y2: y + height / 2,
      snapX: targetX,
      snapY: y + height / 2 - targetHeight / 2,
    };
    lines.push(line);
  }

  if (Math.abs(targetY + targetHeight - (y + height / 2)) < tolerance) {
    const line = {
      x1: Math.min(x, targetX) - 20,
      y1: y + height / 2,
      x2: Math.max(x + width, targetX + targetWidth) + 20,
      y2: y + height / 2,
      snapX: targetX,
      snapY: y + height / 2 - targetHeight,
    };
    lines.push(line);
  }

  if (Math.abs(targetY + targetHeight - (y + height)) < tolerance) {
    const line = {
      x1: Math.min(x, targetX) - 20,
      y1: y + height,
      x2: Math.max(x + width, targetX + targetWidth) + 20,
      y2: y + height,
      snapX: targetX,
      snapY: y + height - targetHeight,
    };
    lines.push(line);
  }

  if (Math.abs(targetY + targetHeight / 2 - (y + height)) < tolerance) {
    const line = {
      x1: Math.min(x, targetX) - 20,
      y1: y + height,
      x2: Math.max(x + width, targetX + targetWidth) + 20,
      y2: y + height,
      snapX: targetX,
      snapY: y + height - targetHeight / 2,
    };
    lines.push(line);
  }

  if (Math.abs(targetY - (y + height)) < tolerance) {
    const line = {
      x1: Math.min(x, targetX) - 20,
      y1: y + height,
      x2: Math.max(x + width, targetX + targetWidth) + 20,
      y2: y + height,
      snapX: targetX,
      snapY: y + height,
    };
    lines.push(line);
  }

  return lines;
}
