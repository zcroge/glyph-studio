// The compose sandbox -- "experimenting with the larger syllable-block
// system." No placement rules are enforced (00-laws.md defines vowel
// ligatures and consonant+mark adjacency compounds, but no true 2D
// Hangul-style block yet) -- this is free-form drag/scale/rotate
// exploration space, not an algorithm. A named draft is just an array
// of placements: which already-drawn glyph, where, how big, how turned.
import { UPM } from "./grid.js";
import { strokeToOutline } from "./vectorPen.js";

// Renders one placement's strokes into ctx, transformed by its own
// x/y/scale/rotationDeg -- the SAME outline geometry the letter studio
// itself draws (via strokeToOutline), just under an extra transform.
export function drawPlacement(ctx, placement, strokes, baseWidth, { highlight = false } = {}) {
  ctx.save();
  ctx.translate(placement.x, placement.y);
  ctx.rotate((placement.rotationDeg * Math.PI) / 180);
  ctx.scale(placement.scale, placement.scale);
  ctx.translate(-600, -600); // glyphs are authored around the grid's own center
  ctx.fillStyle = highlight ? "#1a5fb4" : "#111111";
  for (const stroke of strokes) {
    const outline = strokeToOutline(stroke, baseWidth);
    if (outline.length < 3) continue;
    ctx.beginPath();
    ctx.moveTo(outline[0].x, outline[0].y);
    for (let i = 1; i < outline.length; i++) ctx.lineTo(outline[i].x, outline[i].y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// Rough hit-test: is (x,y) within this placement's own bounding radius
// (computed from its strokes' extents around the glyph's own 600,600
// center, then scaled)? Good enough for click-to-select/drag in a
// sandbox -- not pixel-perfect path hit-testing.
export function placementRadius(strokes) {
  let maxDist = 60; // floor, so even a bare dot/short stroke stays grabbable
  for (const stroke of strokes) {
    for (const p of stroke) {
      const d = Math.hypot(p.x - 600, p.y - 600);
      if (d > maxDist) maxDist = d;
    }
  }
  return maxDist;
}
export function hitTest(x, y, placement, radius) {
  const dx = x - placement.x, dy = y - placement.y;
  return Math.hypot(dx, dy) <= radius * placement.scale;
}

export function newPlacement(token) {
  return { token, x: UPM / 2, y: UPM / 2, scale: 0.5, rotationDeg: 0 };
}
