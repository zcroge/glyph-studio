import { CENSUS, findGlyph, ringColor } from "./census.js";
import { drawGrid } from "./grid.js";
import { attachPen, renderStroke, strokeToOutline } from "./vectorPen.js";
import { PIXEL_SIZES, DEFAULT_PIXEL_SIZE, emptyGrid, drawPixelGrid, pointToCell, rasterizeStrokesToGrid } from "./pixelGrid.js";
import * as store from "./store.js";
import { downloadGlyphSVG, downloadGlyphGlif, downloadPixelGrid } from "./exportGlyph.js";
import { drawPlacement, placementRadius, hitTest, newPlacement } from "./compose.js";

const $ = (id) => document.getElementById(id);
const PEN_WIDTH = 24; // base stroke width, in grid units -- a medium nib on the 1200-UPM grid

// ---------- tabs ----------
document.querySelectorAll("nav.tabs button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("nav.tabs button").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    $(`panel-${btn.dataset.tab}`).classList.add("active");
    if (btn.dataset.tab === "export") renderExportList();
    if (btn.dataset.tab === "compose") { renderPalette(); renderDraftList(); renderCompose(); }
  });
});

// ================== LETTER STUDIO ==================
let currentToken = CENSUS[0].token;
let currentMode = "vector"; // "vector" | "pixel"
let currentStrokes = [];
let currentPixelGrid = emptyGrid(DEFAULT_PIXEL_SIZE);
let currentPixelSize = DEFAULT_PIXEL_SIZE;
let history = []; // undo stack for whichever mode is active, snapshots taken before each change
let assist = { rotate180: false, flipVertical: false, mirrorLateral: false, twinGhost: true };

function loadTokenIntoState(token) {
  const rec = store.loadGlyphRecord(token);
  currentStrokes = rec?.vectorStrokes ? JSON.parse(JSON.stringify(rec.vectorStrokes)) : [];
  currentPixelSize = rec?.pixelSize || DEFAULT_PIXEL_SIZE;
  currentPixelGrid = rec?.pixelGrid ? JSON.parse(JSON.stringify(rec.pixelGrid)) : emptyGrid(currentPixelSize);
  history = [];
}
function persistCurrent() {
  store.saveGlyphRecord(currentToken, { vectorStrokes: currentStrokes, pixelGrid: currentPixelGrid, pixelSize: currentPixelSize });
}
function hasData(token) {
  const rec = store.loadGlyphRecord(token);
  if (!rec) return false;
  const hasStrokes = Array.isArray(rec.vectorStrokes) && rec.vectorStrokes.length > 0;
  const hasPixels = Array.isArray(rec.pixelGrid) && rec.pixelGrid.some((row) => row.some(Boolean));
  return hasStrokes || hasPixels;
}

function snapshot() {
  history.push(currentMode === "vector" ? JSON.stringify(currentStrokes) : JSON.stringify(currentPixelGrid));
  if (history.length > 40) history.shift();
}
function undo() {
  const prev = history.pop();
  if (prev === undefined) return;
  if (currentMode === "vector") currentStrokes = JSON.parse(prev);
  else currentPixelGrid = JSON.parse(prev);
  persistCurrent();
  renderStudioCanvas();
}

function buildLetterList() {
  const container = $("letter-list");
  container.innerHTML = "";
  const byRing = { given: [], received: [], made: [] };
  for (const g of CENSUS) (byRing[g.ring] || byRing.made).push(g);
  for (const ring of ["given", "received", "made"]) {
    const label = document.createElement("div");
    label.className = "letter-group-label";
    label.style.color = ringColor(ring);
    label.textContent = ring;
    container.appendChild(label);
    for (const g of byRing[ring]) {
      const btn = document.createElement("button");
      btn.className = "letter-btn" + (g.token === currentToken ? " active" : "");
      btn.dataset.token = g.token;
      btn.innerHTML = `<span class="dot ${hasData(g.token) ? "filled" : "empty"}"></span>${g.token}`;
      btn.addEventListener("click", () => selectToken(g.token));
      container.appendChild(btn);
    }
  }
}

function selectToken(token) {
  persistCurrent();
  currentToken = token;
  loadTokenIntoState(token);
  buildLetterList();
  renderMetaPanel();
  renderStudioCanvas();
}

function renderMetaPanel() {
  const g = findGlyph(currentToken);
  const panel = $("meta-panel");
  const twinHtml = g.twin
    ? `<p><b>Twin:</b> ${g.twin.type} of <b>${g.twin.token}</b></p>`
    : `<p><b>Twin:</b> none</p>`;
  panel.innerHTML = `
    <div class="meta-box">
      <h3>${g.token}</h3>
      <p><b>Object:</b> ${g.object}</p>
      <p><b>Sound:</b> ${g.sound} &nbsp; <b>Class:</b> ${g.class} &nbsp; <b>Ring:</b> ${g.ring}</p>
      ${twinHtml}
      ${g.chirality ? `<p><b>Chirality:</b> ${g.chirality}</p>` : ""}
      ${g.note ? `<p><i>${g.note}</i></p>` : ""}
    </div>
    <div class="meta-box">
      <h3>Transform assist</h3>
      <label class="check-row"><input type="checkbox" id="assist-rotate" ${assist.rotate180 ? "checked" : ""}/> ghost: 180&deg; rotation (phonology/voicing, L3)</label>
      <label class="check-row"><input type="checkbox" id="assist-flip" ${assist.flipVertical ? "checked" : ""}/> ghost: vertical flip (semantics/attitude, L3)</label>
      <label class="check-row"><input type="checkbox" id="assist-mirror" ${assist.mirrorLateral ? "checked" : ""}/> ghost: lateral mirror (notation/retrograde, L3)</label>
      ${g.twin ? `<label class="check-row"><input type="checkbox" id="assist-twin" ${assist.twinGhost ? "checked" : ""}/> ghost: ${g.twin.token}'s own strokes, transformed</label>` : ""}
      <p style="color:#888;">If a ghost looks identical to your own strokes, that's a live L4 chirality violation -- the transform wouldn't read as a distinct letter.</p>
    </div>
  `;
  $("assist-rotate")?.addEventListener("change", (e) => { assist.rotate180 = e.target.checked; renderStudioCanvas(); });
  $("assist-flip")?.addEventListener("change", (e) => { assist.flipVertical = e.target.checked; renderStudioCanvas(); });
  $("assist-mirror")?.addEventListener("change", (e) => { assist.mirrorLateral = e.target.checked; renderStudioCanvas(); });
  $("assist-twin")?.addEventListener("change", (e) => { assist.twinGhost = e.target.checked; renderStudioCanvas(); });
}

function transformOutline(outline, kind) {
  // All transforms pivot around the grid's own center (600,600) -- the
  // hub/baseline-center convention the whole grid is built around.
  return outline.map((p) => {
    const dx = p.x - 600, dy = p.y - 600;
    if (kind === "rotate180") return { x: 600 - dx, y: 600 - dy };
    if (kind === "flipVertical") return { x: p.x, y: 600 - dy };
    if (kind === "mirrorLateral") return { x: 600 - dx, y: p.y };
    return p;
  });
}
function drawGhostOutline(ctx, outline, color) {
  if (outline.length < 3) return;
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(outline[0].x, outline[0].y);
  for (let i = 1; i < outline.length; i++) ctx.lineTo(outline[i].x, outline[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function renderStudioCanvas() {
  const canvas = $("canvas");
  const ctx = canvas.getContext("2d");
  drawGrid(ctx);

  if (currentMode === "pixel") {
    drawPixelGrid(ctx, currentPixelGrid);
  } else {
    for (const stroke of currentStrokes) renderStroke(ctx, stroke, PEN_WIDTH);
  }

  for (const kind of ["rotate180", "flipVertical", "mirrorLateral"]) {
    if (!assist[kind]) continue;
    for (const stroke of currentStrokes) {
      const outline = strokeToOutline(stroke, PEN_WIDTH);
      drawGhostOutline(ctx, transformOutline(outline, kind), "#c0392b");
    }
  }
  const g = findGlyph(currentToken);
  if (assist.twinGhost && g.twin) {
    const twinRec = store.loadGlyphRecord(g.twin.token);
    if (twinRec?.vectorStrokes) {
      const kind = g.twin.type === "rotation" ? "rotate180" : g.twin.type === "flip" ? "flipVertical" : null;
      for (const stroke of twinRec.vectorStrokes) {
        const outline = strokeToOutline(stroke, PEN_WIDTH);
        drawGhostOutline(ctx, kind ? transformOutline(outline, kind) : outline, "#1a5fb4");
      }
    }
  }
}

// Vector pen wiring
attachPen($("canvas"), {
  onStrokeStart: () => { if (currentMode === "vector") snapshot(); },
  onStrokeMove: (pts) => {
    if (currentMode !== "vector") return;
    const ctx = $("canvas").getContext("2d");
    renderStudioCanvas();
    renderStroke(ctx, pts, PEN_WIDTH);
  },
  onStrokeEnd: (pts) => {
    if (currentMode !== "vector" || pts.length === 0) return;
    currentStrokes.push(pts);
    persistCurrent();
    buildLetterList();
    renderStudioCanvas();
  },
});

// Pixel paint wiring (separate pointer handling -- direct cell toggling,
// not a pressure stroke).
(function wirePixelPaint() {
  const canvas = $("canvas");
  let painting = false;
  let paintValue = true;
  const paintAt = (e) => {
    if (currentMode !== "pixel") return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    const cell = pointToCell(x, y, currentPixelSize);
    if (!cell) return;
    currentPixelGrid[cell.row][cell.col] = paintValue;
    renderStudioCanvas();
  };
  canvas.addEventListener("pointerdown", (e) => {
    if (currentMode !== "pixel") return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    const cell = pointToCell(x, y, currentPixelSize);
    if (!cell) return;
    snapshot();
    painting = true;
    paintValue = !currentPixelGrid[cell.row][cell.col];
    paintAt(e);
  });
  canvas.addEventListener("pointermove", (e) => { if (painting) paintAt(e); });
  const stop = () => { if (painting) { painting = false; persistCurrent(); buildLetterList(); } };
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointerleave", stop);
})();

$("mode-vector").addEventListener("click", () => setMode("vector"));
$("mode-pixel").addEventListener("click", () => setMode("pixel"));
function setMode(mode) {
  currentMode = mode;
  history = [];
  $("mode-vector").classList.toggle("active", mode === "vector");
  $("mode-pixel").classList.toggle("active", mode === "pixel");
  renderStudioCanvas();
}

$("undo").addEventListener("click", undo);
$("clear").addEventListener("click", () => {
  snapshot();
  if (currentMode === "vector") currentStrokes = [];
  else currentPixelGrid = emptyGrid(currentPixelSize);
  persistCurrent();
  buildLetterList();
  renderStudioCanvas();
});

(function wirePixelSize() {
  const select = $("pixel-size");
  select.innerHTML = PIXEL_SIZES.map((n) => `<option value="${n}" ${n === DEFAULT_PIXEL_SIZE ? "selected" : ""}>${n}x${n}</option>`).join("");
  select.addEventListener("change", (e) => {
    const size = Number(e.target.value);
    if (size === currentPixelSize) return;
    snapshot();
    currentPixelSize = size;
    currentPixelGrid = emptyGrid(size);
    persistCurrent();
    renderStudioCanvas();
  });
})();

$("derive-pixels").addEventListener("click", () => {
  if (currentStrokes.length === 0) {
    $("status").textContent = "Nothing to derive from -- draw some vector strokes first.";
    return;
  }
  snapshot();
  currentPixelGrid = rasterizeStrokesToGrid(currentStrokes, currentPixelSize, PEN_WIDTH);
  persistCurrent();
  buildLetterList();
  if (currentMode === "pixel") renderStudioCanvas();
  $("status").textContent = `Derived a ${currentPixelSize}x${currentPixelSize} bitmap from ${currentStrokes.length} stroke(s). Switch to pixel paint to see/edit it.`;
});

// ================== COMPOSE SANDBOX ==================
let placements = [];
let selectedIndex = -1;

function renderPalette() {
  const container = $("compose-palette");
  container.innerHTML = "";
  for (const g of CENSUS) {
    if (!hasData(g.token)) continue;
    const btn = document.createElement("button");
    btn.textContent = g.token;
    btn.addEventListener("click", () => {
      placements.push(newPlacement(g.token));
      selectedIndex = placements.length - 1;
      renderCompose();
      renderSelectedPanel();
    });
    container.appendChild(btn);
  }
  if (!container.children.length) container.innerHTML = "<p style='font-size:12px;color:#888;'>Draw at least one letter in Letter Studio first.</p>";
}

function renderCompose() {
  const canvas = $("compose-canvas");
  const ctx = canvas.getContext("2d");
  drawGrid(ctx);
  placements.forEach((p, i) => {
    const rec = store.loadGlyphRecord(p.token);
    if (!rec?.vectorStrokes) return;
    drawPlacement(ctx, p, rec.vectorStrokes, PEN_WIDTH, { highlight: i === selectedIndex });
  });
}

function renderSelectedPanel() {
  const box = $("compose-selected");
  if (selectedIndex < 0 || !placements[selectedIndex]) {
    box.innerHTML = "<p>Click a letter above to add it, then click a placed letter on the canvas to select it.</p>";
    return;
  }
  const p = placements[selectedIndex];
  box.innerHTML = `
    <p><b>${p.token}</b></p>
    <label class="check-row">scale <input type="range" id="sel-scale" min="0.1" max="1.5" step="0.01" value="${p.scale}" /></label>
    <label class="check-row">rotation <input type="range" id="sel-rot" min="-180" max="180" step="1" value="${p.rotationDeg}" /></label>
    <button id="sel-delete">delete</button>
  `;
  $("sel-scale").addEventListener("input", (e) => { p.scale = Number(e.target.value); renderCompose(); });
  $("sel-rot").addEventListener("input", (e) => { p.rotationDeg = Number(e.target.value); renderCompose(); });
  $("sel-delete").addEventListener("click", () => {
    placements.splice(selectedIndex, 1);
    selectedIndex = -1;
    renderCompose();
    renderSelectedPanel();
  });
}

(function wireComposeDrag() {
  const canvas = $("compose-canvas");
  let dragging = -1;
  const toGrid = (e) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };
  canvas.addEventListener("pointerdown", (e) => {
    const { x, y } = toGrid(e);
    dragging = -1;
    for (let i = placements.length - 1; i >= 0; i--) {
      const rec = store.loadGlyphRecord(placements[i].token);
      const radius = rec?.vectorStrokes ? placementRadius(rec.vectorStrokes) : 60;
      if (hitTest(x, y, placements[i], radius)) { dragging = i; break; }
    }
    selectedIndex = dragging;
    renderCompose();
    renderSelectedPanel();
    if (dragging >= 0) canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragging < 0) return;
    const { x, y } = toGrid(e);
    placements[dragging].x = x;
    placements[dragging].y = y;
    renderCompose();
  });
  canvas.addEventListener("pointerup", () => { dragging = -1; });
})();

$("draft-save").addEventListener("click", () => {
  const name = $("draft-name").value.trim();
  if (!name) return;
  store.saveComposeDraft(name, placements);
  renderDraftList();
});
function renderDraftList() {
  const drafts = store.loadAllComposeDrafts();
  const container = $("draft-list");
  container.innerHTML = "";
  for (const name of Object.keys(drafts)) {
    const row = document.createElement("div");
    row.className = "draft-row";
    row.innerHTML = `<button data-load="${name}">${name}</button><button data-del="${name}">x</button>`;
    container.appendChild(row);
  }
  container.querySelectorAll("[data-load]").forEach((btn) => btn.addEventListener("click", () => {
    placements = JSON.parse(JSON.stringify(drafts[btn.dataset.load].placements));
    selectedIndex = -1;
    renderCompose();
    renderSelectedPanel();
  }));
  container.querySelectorAll("[data-del]").forEach((btn) => btn.addEventListener("click", () => {
    store.deleteComposeDraft(btn.dataset.del);
    renderDraftList();
  }));
}

// ================== EXPORT ==================
function renderExportList() {
  const container = $("export-list");
  container.innerHTML = "";
  for (const g of CENSUS) {
    const rec = store.loadGlyphRecord(g.token);
    const hasVec = !!rec?.vectorStrokes?.length;
    const hasPix = !!rec?.pixelGrid?.some((row) => row.some(Boolean));
    const row = document.createElement("div");
    row.className = "export-row";
    row.innerHTML = `
      <span class="tok">${g.token}</span>
      <button ${hasVec ? "" : "disabled"} data-svg="${g.token}">SVG</button>
      <button ${hasVec ? "" : "disabled"} data-glif="${g.token}">.glif</button>
      <button ${hasPix ? "" : "disabled"} data-pixel="${g.token}">pixel JSON</button>
      <span style="color:#888;">${hasVec ? "vector drawn" : ""}${hasVec && hasPix ? " + " : ""}${hasPix ? "pixels drawn" : ""}${!hasVec && !hasPix ? "empty" : ""}</span>
    `;
    container.appendChild(row);
  }
  container.querySelectorAll("[data-svg]").forEach((b) => b.addEventListener("click", () => {
    const rec = store.loadGlyphRecord(b.dataset.svg);
    downloadGlyphSVG(b.dataset.svg, rec.vectorStrokes, PEN_WIDTH);
  }));
  container.querySelectorAll("[data-glif]").forEach((b) => b.addEventListener("click", () => {
    const rec = store.loadGlyphRecord(b.dataset.glif);
    downloadGlyphGlif(b.dataset.glif, rec.vectorStrokes, PEN_WIDTH);
  }));
  container.querySelectorAll("[data-pixel]").forEach((b) => b.addEventListener("click", () => {
    const rec = store.loadGlyphRecord(b.dataset.pixel);
    downloadPixelGrid(b.dataset.pixel, rec.pixelGrid);
  }));
}

$("export-all").addEventListener("click", () => {
  store.downloadTextFile("glyph-studio-backup.json", store.exportAllAsJSON());
});
$("import-all").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    store.importAllFromJSON(await file.text());
    loadTokenIntoState(currentToken);
    buildLetterList();
    renderStudioCanvas();
    renderExportList();
  } catch (err) {
    alert("Couldn't read that backup file: " + err.message);
  }
  e.target.value = "";
});

// ================== init ==================
loadTokenIntoState(currentToken);
buildLetterList();
renderMetaPanel();
renderStudioCanvas();
