// Mouse and keyboard input for EMBERFALL. The canvas is drawn at a fixed
// 1280x720 and scaled by CSS, so every pointer position is mapped back into
// table coordinates before any hit test runs.

import { TABLE_HEIGHT, TABLE_WIDTH } from './config.js';

// Convert a pointer event to table coordinates (0..1280, 0..720).
export function toTablePoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * TABLE_WIDTH;
  const y = ((event.clientY - rect.top) / rect.height) * TABLE_HEIGHT;
  return { x, y };
}

export function pointInRect(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w
    && point.y >= rect.y && point.y <= rect.y + rect.h;
}

// A fanned hand: each card sits at an angle around a pivot below the table.
// Returns the card's rectangle and rotation for slot `index` of `count`.
export function fanSlot(index, count, centerX, baseY, spacing, lift) {
  const middle = (count - 1) / 2;
  const offset = index - middle;
  return {
    x: centerX + offset * spacing - 70,
    y: baseY - Math.abs(offset) * (lift || 0) - Math.abs(offset) * 6,
    angle: offset * 0.045,
  };
}

// Wire the canvas to a handler object:
//   onMove(point), onClick(point), onKey(key)
// Returns an unbind function.
export function bindInput(canvas, handlers) {
  const move = (event) => {
    if (handlers.onMove) handlers.onMove(toTablePoint(canvas, event));
  };
  const click = (event) => {
    if (handlers.onClick) handlers.onClick(toTablePoint(canvas, event));
  };
  const key = (event) => {
    if (handlers.onKey) handlers.onKey(event.key);
    if (event.key === ' ' || event.key.startsWith('Arrow')) event.preventDefault();
  };
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerdown', click);
  window.addEventListener('keydown', key);
  return () => {
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerdown', click);
    window.removeEventListener('keydown', key);
  };
}
