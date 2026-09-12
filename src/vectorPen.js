// A pressure-sensitive pen -- captures one stroke as raw Pointer Events
// samples, then turns it into a filled ribbon outline (a closed polygon
// whose width varies with recorded pressure) instead of a fixed-width
// canvas line. `event.pressure` is part of the Pointer Events spec: a
// real tablet reports 0-1, a plain mouse reports a flat 0.5 while a
// button is held (per spec, "if the device doesn't support pressure") --
// so this degrades gracefully to a uniform medium-width line with no
// tablet at all, and comes alive with one.

// Smooths a raw point list a little (simple moving average over 3
// samples) -- tablets sample fast enough that raw points are often
// slightly jittery; this is cheap and keeps real corners recognizable
// (light smoothing, not a full curve fit).
function smoothPoints(points) {
  if (points.length < 3) return points;
  const out = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1], b = points[i], c = points[i + 1];
    out.push({
      x: (a.x + b.x + c.x) / 3,
      y: (a.y + b.y + c.y) / 3,
      pressure: b.pressure,
    });
  }
  out.push(points[points.length - 1]);
  return out;
}

// Converts one stroke (points with pressure) into a single closed
// polygon outline -- offsets each segment perpendicular to its own
// direction by that point's own half-width, walking down one side and
// back up the other, with a simple rounded cap at each end. Shared by
// on-canvas rendering AND every export path (SVG/UFO), so the drawn
// shape and the exported shape are always the exact same geometry.
export function strokeToOutline(points, baseWidth = 18, minWidthFrac = 0.25) {
  const pts = smoothPoints(points);
  if (pts.length === 0) return [];
  if (pts.length === 1) {
    // A tap with no drag -- a small dot, drawn as an octagon.
    const r = Math.max(2, baseWidth * (minWidthFrac + (1 - minWidthFrac) * pts[0].pressure) / 2);
    const c = pts[0];
    const dot = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      dot.push({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r });
    }
    return dot;
  }

  const halfWidthAt = (p) => Math.max(1, (baseWidth * (minWidthFrac + (1 - minWidthFrac) * p.pressure)) / 2);
  const left = [];
  const right = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const prev = pts[i - 1] || p;
    const next = pts[i + 1] || p;
    // Direction is the average of the incoming/outgoing segment so the
    // offset doesn't kink hard at each sample.
    let dx = next.x - prev.x, dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const nx = -dy, ny = dx; // perpendicular
    const hw = halfWidthAt(p);
    left.push({ x: p.x + nx * hw, y: p.y + ny * hw });
    right.push({ x: p.x - nx * hw, y: p.y - ny * hw });
  }
  return [...left, ...right.reverse()];
}

export function renderStroke(ctx, points, baseWidth, color = "#111111") {
  const outline = strokeToOutline(points, baseWidth);
  if (outline.length < 3) return;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(outline[0].x, outline[0].y);
  for (let i = 1; i < outline.length; i++) ctx.lineTo(outline[i].x, outline[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Attaches pointer capture to `canvas` (expects the canvas's own pixel
// size to already equal the grid's UPM square, see grid.js -- so
// offsetX/offsetY land directly in grid units, no separate scaling).
// `onStrokeEnd(points)` fires once per completed stroke.
export function attachPen(canvas, { onStrokeStart, onStrokeMove, onStrokeEnd }) {
  let active = null;
  const toPoint = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: e.pressure > 0 ? e.pressure : 0.5,
    };
  };
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    active = [toPoint(e)];
    onStrokeStart?.(active);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!active) return;
    active.push(toPoint(e));
    onStrokeMove?.(active);
  });
  const finish = (e) => {
    if (!active) return;
    const finished = active;
    active = null;
    onStrokeEnd?.(finished);
  };
  canvas.addEventListener("pointerup", finish);
  canvas.addEventListener("pointercancel", finish);
  canvas.addEventListener("pointerleave", (e) => { if (active) finish(e); });
}
