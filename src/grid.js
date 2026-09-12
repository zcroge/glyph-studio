// The shared coordinate system every letter is drawn against -- pixel-
// for-pixel the same layout as `01-alphabet/letters/_templates/glyph-grid.svg`,
// so hand/eye calibration carries over 1:1 between Krita/Inkscape and
// this tool. See `01-alphabet/letters/README.md`'s own "The grid"
// section for the source of every number below -- nothing here is
// invented, it's a direct transcription.

export const UPM = 1200; // units-per-em; also this canvas's own pixel size (1 unit = 1px at 1x)
export const CELL = 100; // 12x12 grid -> 100 units per cell

// Screen-space (y-down, 0 at top) tier boundaries -- matches the SVG
// template's own rects exactly.
export const TIERS = [
  { ring: "given", yFrom: 0, yTo: 300, fill: "#f5e6a8", label: "given" },
  { ring: "received", yFrom: 300, yTo: 900, fill: "#a8c8f0", label: "received" },
  { ring: "made", yFrom: 900, yTo: 1200, fill: "#a8d8ab", label: "made" },
];

export const HUB_X = 600;
export const I_POLE = { x: 600, y: 0 };   // screen-space top
export const O_POLE = { x: 600, y: 1200 }; // screen-space bottom

// Font-space (y-up, baseline at 0) is what `letters/README.md`'s own
// table and every `.glif`'s outline coordinates actually use: given =
// ascender 600-900, received = body 0-600, made = descender -300-0.
// Screen y=0 (top) is font y=900 (top of ascender); screen y=1200
// (bottom) is font y=-300 (bottom of descender).
export function screenToFontY(screenY) {
  return 900 - screenY;
}
export function fontToScreenY(fontY) {
  return 900 - fontY;
}

// Draws the reference grid (fine 100-unit lines, tier bands, tier
// dividers, hub spine, poles) into a 1200x1200 canvas context. Callers
// draw their own strokes/ghosts on top of this.
export function drawGrid(ctx) {
  ctx.save();
  ctx.clearRect(0, 0, UPM, UPM);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, UPM, UPM);

  for (const tier of TIERS) {
    ctx.fillStyle = tier.fill;
    ctx.globalAlpha = 0.32;
    ctx.fillRect(0, tier.yFrom, UPM, tier.yTo - tier.yFrom);
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "#c9c9c9";
  ctx.lineWidth = 1;
  for (let u = 0; u <= UPM; u += CELL) {
    ctx.beginPath();
    ctx.moveTo(u, 0);
    ctx.lineTo(u, UPM);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, u);
    ctx.lineTo(UPM, u);
    ctx.stroke();
  }

  ctx.strokeStyle = "#555555";
  ctx.lineWidth = 2.5;
  for (const y of [0, 300, 900, 1200]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(UPM, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(HUB_X, 0);
  ctx.lineTo(HUB_X, UPM);
  ctx.stroke();

  ctx.fillStyle = "#333333";
  for (const p of [I_POLE, O_POLE]) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = "20px sans-serif";
  ctx.fillStyle = "#333333";
  ctx.fillText("I-pole", 614, 18);
  ctx.fillText("O-pole", 614, 1192);
  ctx.fillStyle = "#8a7a2a";
  ctx.fillText("given", 10, 26);
  ctx.fillStyle = "#2a5a8a";
  ctx.fillText("received", 10, 596);
  ctx.fillStyle = "#2a7a3a";
  ctx.fillText("made", 10, 1186);

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, UPM, UPM);
  ctx.restore();
}
