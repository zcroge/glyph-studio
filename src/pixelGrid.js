// The "simplest low-resolution pixel/digital version" -- a small
// boolean grid overlaid on the same 1200x1200 square every vector
// letter is drawn against, so a pixel cell always covers a fixed,
// predictable number of grid units regardless of resolution. Paint it
// by hand directly, or derive it from an already-drawn vector stroke --
// both are real, independent outputs; neither is forced.
import { UPM } from "./grid.js";
import { strokeToOutline } from "./vectorPen.js";

export const PIXEL_SIZES = [12, 16, 24, 32];
export const DEFAULT_PIXEL_SIZE = 16;

export function emptyGrid(size) {
  return Array.from({ length: size }, () => new Array(size).fill(false));
}

export function cellSizeUnits(size) {
  return UPM / size;
}

export function drawPixelGrid(ctx, grid, { showGridLines = true } = {}) {
  const size = grid.length;
  const cell = cellSizeUnits(size);
  ctx.save();
  ctx.fillStyle = "#111111";
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (grid[row][col]) ctx.fillRect(col * cell, row * cell, cell, cell);
    }
  }
  if (showGridLines) {
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= size; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, UPM);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cell);
      ctx.lineTo(UPM, i * cell);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// Cell (row, col) from a grid-unit point, or null if outside the grid.
export function pointToCell(x, y, size) {
  const cell = cellSizeUnits(size);
  const col = Math.floor(x / cell);
  const row = Math.floor(y / cell);
  if (row < 0 || row >= size || col < 0 || col >= size) return null;
  return { row, col };
}

// Rasterizes a set of already-drawn vector strokes down to a pixel grid
// of the given size -- draws each stroke's real outline (the exact same
// geometry the vector layer renders) into an offscreen 1200x1200 canvas,
// then samples the center of each cell: a cell is "on" if its center
// pixel is more than half covered by ink, checked over the cell's own
// area (a small supersample grid per cell) rather than a single point,
// so a thin stroke crossing a cell's corner isn't missed or overcounted.
export function rasterizeStrokesToGrid(strokes, size, baseWidth) {
  const off = document.createElement("canvas");
  off.width = UPM;
  off.height = UPM;
  const octx = off.getContext("2d");
  octx.clearRect(0, 0, UPM, UPM);
  octx.fillStyle = "#000000";
  for (const stroke of strokes) {
    const outline = strokeToOutline(stroke, baseWidth);
    if (outline.length < 3) continue;
    octx.beginPath();
    octx.moveTo(outline[0].x, outline[0].y);
    for (let i = 1; i < outline.length; i++) octx.lineTo(outline[i].x, outline[i].y);
    octx.closePath();
    octx.fill();
  }
  const cell = cellSizeUnits(size);
  const grid = emptyGrid(size);
  const SAMPLE = 3; // 3x3 supersample per cell
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      let covered = 0;
      for (let sy = 0; sy < SAMPLE; sy++) {
        for (let sx = 0; sx < SAMPLE; sx++) {
          const px = Math.min(UPM - 1, Math.floor(col * cell + ((sx + 0.5) / SAMPLE) * cell));
          const py = Math.min(UPM - 1, Math.floor(row * cell + ((sy + 0.5) / SAMPLE) * cell));
          const alpha = octx.getImageData(px, py, 1, 1).data[3];
          if (alpha > 127) covered++;
        }
      }
      // ANY real coverage marks the cell on, not a majority -- a normal
      // pen-width stroke is almost always thinner than a low-res cell
      // (measured: a diagonal stroke through a 75-unit cell at 16x16
      // only ever lights 1-3 of 9 supersamples, never a majority), so a
      // majority threshold silently lost every thin stroke entirely.
      // Bolder-than-the-vector-original is the right failure direction
      // for a low-res derivation -- losing the stroke isn't.
      grid[row][col] = covered > 0;
    }
  }
  return grid;
}
