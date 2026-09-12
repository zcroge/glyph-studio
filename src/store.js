// Persistence -- same `{project}.{feature}.v{n}` localStorage
// namespacing convention orphograph's own `timbrePresets.js` already
// established, plus a whole-project JSON export/import (mirrors
// orphograph's own settings-export idiom) so work survives a browser-
// data wipe or moves to a different machine.
const GLYPHS_KEY = "codex.glyphStudio.v1";
const COMPOSE_KEY = "codex.glyphStudio.compose.v1";

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// { [token]: { vectorStrokes: [[{x,y,pressure}, ...], ...], pixelGrid: bool[][] | null, pixelSize: number, updatedAt: number } }
export function loadAllGlyphs() {
  return readJSON(GLYPHS_KEY, {});
}
export function saveGlyphRecord(token, record) {
  const all = loadAllGlyphs();
  all[token] = { ...record, updatedAt: Date.now() };
  writeJSON(GLYPHS_KEY, all);
}
export function loadGlyphRecord(token) {
  return loadAllGlyphs()[token] || null;
}

// { [draftName]: { placements: [{token, x, y, scale, rotationDeg}, ...], updatedAt } }
export function loadAllComposeDrafts() {
  return readJSON(COMPOSE_KEY, {});
}
export function saveComposeDraft(name, placements) {
  const all = loadAllComposeDrafts();
  all[name] = { placements, updatedAt: Date.now() };
  writeJSON(COMPOSE_KEY, all);
}
export function deleteComposeDraft(name) {
  const all = loadAllComposeDrafts();
  delete all[name];
  writeJSON(COMPOSE_KEY, all);
}

export function exportAllAsJSON() {
  return JSON.stringify({ glyphs: loadAllGlyphs(), compose: loadAllComposeDrafts() }, null, 2);
}
export function importAllFromJSON(jsonText) {
  const data = JSON.parse(jsonText);
  if (data.glyphs) writeJSON(GLYPHS_KEY, data.glyphs);
  if (data.compose) writeJSON(COMPOSE_KEY, data.compose);
}

export function downloadTextFile(filename, text, mime = "application/json") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
