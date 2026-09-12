// Turns a glyph record (vector strokes and/or a pixel grid) into real
// downloadable files -- SVG (the vector ribbon as real path data), UFO
// `.glif` XML (matching the EXACT empty-slot shape already sitting in
// `TheCodex-Draft.ufo/glyphs/`, so a drawn letter can replace its
// matching slot directly), and the pixel grid as plain JSON. Straight-
// line polygon contours only for now (no curve fitting) -- a real,
// usable first pass; smoothing into true bezier contours is a later
// refinement, the same "digitize" step the existing Krita->Inkscape->
// FontForge workflow already names as its own stage.
import { strokeToOutline } from "./vectorPen.js";
import { screenToFontY } from "./grid.js";
import { findGlyph } from "./census.js";
import { downloadTextFile } from "./store.js";

function outlinesFor(strokes, baseWidth) {
  return strokes.map((s) => strokeToOutline(s, baseWidth)).filter((o) => o.length >= 3);
}

export function glyphToSVG(token, strokes, baseWidth) {
  const outlines = outlinesFor(strokes, baseWidth);
  const paths = outlines.map((outline) => {
    const d = outline.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
    return `  <path d="${d}" fill="#000000"/>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">\n${paths}\n</svg>\n`;
}

export function glyphToGlif(token, strokes, baseWidth) {
  const meta = findGlyph(token);
  const outlines = outlinesFor(strokes, baseWidth);
  const contours = outlines.map((outline) => {
    const points = outline.map((p) => `      <point x="${Math.round(p.x)}" y="${Math.round(screenToFontY(p.y))}" type="line"/>`).join("\n");
    return `    <contour>\n${points}\n    </contour>`;
  }).join("\n");
  const glyphName = token.replace(/\./g, "_");
  const unicodeHex = meta?.unicodeHex || "";
  const note = meta?.object ? `\n  <note>${escapeXML(meta.object)}</note>` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>\n<glyph name="${escapeXML(glyphName)}" format="2">\n  <advance width="1200"/>${unicodeHex ? `\n  <unicode hex="${unicodeHex}"/>` : ""}${note}\n  <outline>\n${contours}\n  </outline>\n</glyph>\n`;
}

function escapeXML(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function pixelGridToJSON(token, grid) {
  return JSON.stringify({ token, size: grid.length, grid }, null, 2);
}

export function downloadGlyphSVG(token, strokes, baseWidth) {
  downloadTextFile(`${token.replace(/\./g, "_")}.svg`, glyphToSVG(token, strokes, baseWidth), "image/svg+xml");
}
export function downloadGlyphGlif(token, strokes, baseWidth) {
  downloadTextFile(`${token.replace(/\./g, "_")}.glif`, glyphToGlif(token, strokes, baseWidth), "application/xml");
}
export function downloadPixelGrid(token, grid) {
  downloadTextFile(`${token.replace(/\./g, "_")}.pixel.json`, pixelGridToJSON(token, grid));
}
