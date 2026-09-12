// The studio's own master letter list -- transcribed directly from
// `01-alphabet/00-laws.md`'s CENSUS table and the real `.glif` files
// already sitting (empty) in `01-alphabet/letters/TheCodex-Draft.ufo/`.
// Deliberately independent of orphograph's own `src/letters.js` -- two
// separately-versioned repos, linked by shared token names and the
// shared 1200-UPM grid convention (see grid.js), not by live code
// sharing. If 00-laws.md is ever amended, re-transcribe here by hand;
// this file is not generated.
//
// Every `unicodeHex` below was read directly out of the real glif files
// (`<unicode hex="...">`), so a `.glif` this studio exports lands on the
// EXACT same PUA codepoint the existing empty slot already reserves.
//
// `twin` describes this token's one governing transform relationship
// per 00-laws.md L1/L3/L4 (the base x transform x mark generator):
//   - {type:"rotation", token} -- 180deg rotation is this pair's shared
//     voicing (or, for N/M, place-assimilation) relationship. Both
//     tokens must be POINT-asymmetric for the twin to read as distinct
//     at rest (L4).
//   - {type:"flip", token} -- vertical flip is this pair's relationship
//     (L3's "second seam," Y/H only, so far). Both tokens must be
//     VERTICALLY asymmetric.
//   - {type:"mark", token} -- this token IS the other token plus a
//     small added stroke (a place-shift mark, or F's second fold from
//     V) -- not a geometric transform of the whole shape, so the
//     transform-assist overlay traces the BASE unchanged rather than
//     rotating/flipping it.
// `chirality` is a short human-readable note on what asymmetry this
// token's own drawn form needs to satisfy, when it needs one at all.
export const CENSUS = [
  { token: "I", unicodeHex: "F0000", object: "ice / plumb -- vertical vowel-prime (L8)", sound: "i", class: "invariant", ring: "made", twin: null, chirality: null, note: "Pole. Form already fixed by its object (plumb), not by character design." },
  { token: "O", unicodeHex: "F0001", object: "eye / witness", sound: "o", class: "invariant", ring: "made", twin: null, chirality: null, note: "Pole. Form already fixed by its object (circle), not by character design." },
  { token: "K", unicodeHex: "F0002", object: "key", sound: "k", class: "free", ring: "given", twin: { type: "rotation", token: "G" }, chirality: "Must be point-asymmetric -- owns rotation-twin G (voicing, L4)." },
  { token: "G", unicodeHex: "F0003", object: "K's rotation-twin", sound: "g", class: "free", ring: "received", twin: { type: "rotation", token: "K" }, chirality: "The executed (formal-mode) rotation of K -- draw by rotating K's own strokes 180deg, or author informally as K + a voicing mark." },
  { token: "V", unicodeHex: "F0004", object: "single vertical fold -- prime", sound: "v", class: "invariant", ring: "received", twin: { type: "mark", token: "F" }, chirality: null, note: "C2 resolution. Rotation unused for this pair -- V owes no rotation-twin." },
  { token: "F", unicodeHex: "F0005", object: "fold / folio -- V plus an added horizontal stroke (the second fold)", sound: "f", class: "invariant", ring: "given", twin: { type: "mark", token: "V" }, chirality: "F's vertical stroke extends asymmetrically below the horizontal (breaks symmetry, keeps bare V from collapsing into I)." },
  { token: "S", unicodeHex: "F0006", object: "string / sign -- pin at the tied end", sound: "s", class: "free", ring: "given", twin: { type: "rotation", token: "Z" }, chirality: "Must be point-asymmetric -- owns rotation-twin Z. A bare string has no inherent orientation; the pin (a taut string is anchored at one end) supplies it (C3)." },
  { token: "Z", unicodeHex: "F0007", object: "S's rotation-twin -- pin-down", sound: "z", class: "free", ring: "received", twin: { type: "rotation", token: "S" }, chirality: "The executed rotation of S -- pin-down." },
  { token: "L", unicodeHex: "F0008", object: "Leo -- couchant silhouette (leads-back)", sound: "l", class: "free", ring: "made", twin: { type: "rotation", token: "R" }, chirality: "Must be point-asymmetric -- owns rotation-twin R (C4, couchant/sejant silhouettes, <=3 strokes)." },
  { token: "R", unicodeHex: "F0009", object: "Rocko -- sejant-erect silhouette", sound: "r", class: "free", ring: "made", twin: { type: "rotation", token: "L" }, chirality: "The executed rotation of L -- sejant-erect (returns)." },
  { token: "T", unicodeHex: "F000A", object: "mark-bearer", sound: "t", class: "half-stable", ring: "given", twin: { type: "rotation", token: "D" }, chirality: "Must be LATERALLY asymmetric (not just point-asymmetric) -- owns rotation-twin D AND carries flip-semantics (attitude: staff/otter), so L4 requires both (C1)." },
  { token: "D", unicodeHex: "F000B", object: "T's rotation-twin", sound: "d", class: "half-stable", ring: "received", twin: { type: "rotation", token: "T" }, chirality: "The executed rotation of T." },
  { token: "N", unicodeHex: "F000C", object: "nail", sound: "n", class: "half-stable", ring: "made", twin: { type: "rotation", token: "M" }, chirality: "Must be point-asymmetric -- owns rotation-twin M, extending the voicing channel to nasal place-assimilation (not a voicing pair itself). Point-down/point-up are attitude readings of this SAME glyph, not separate slots.", note: "Extends L3's liquid-pair precedent beyond voicing." },
  { token: "Y", unicodeHex: "F000D", object: "yellow / fork", sound: "j", class: "half-stable", ring: "made", twin: { type: "flip", token: "H" }, chirality: "Must be VERTICALLY asymmetric -- owns flip-twin H (L3's second seam: the first time vertical flip produces a genuinely distinct letter, not just a within-letter attitude reading)." },
  { token: "E", unicodeHex: "F000E", object: "door", sound: "e", class: "reversal-active", ring: "made", twin: null, chirality: null, note: "Grandfathered exception (L3): E's open/barred rides the LATERAL channel as semantics (doors swing sideways) -- the doctrine's one seam. Open/barred are attitude readings of this same glyph, not separate slots." },
  { token: "A", unicodeHex: "F000F", object: "axe", sound: "a", class: "free", ring: "made", twin: null, chirality: null, note: "Oath/interred are vertical-flip ATTITUDE readings of this same glyph, not a twin relationship." },
  { token: "B", unicodeHex: "F0010", object: "bed / beth, the shelter (acrophon: LB, the Living Bed)", sound: "b", class: "free", ring: "given", twin: { type: "rotation", token: "P" }, chirality: "Must be point-asymmetric -- owns rotation-twin P (same family treatment as K/G, R/L, S/Z)." },
  { token: "P", unicodeHex: "F0011", object: "B's rotation-twin", sound: "p", class: "free", ring: "received", twin: { type: "rotation", token: "B" }, chirality: "The executed rotation of B." },
  { token: "M", unicodeHex: "F0012", object: "square / mouth -- congruent Hangul (ㅁ) borrow", sound: "m", class: "half-stable", ring: "made", twin: { type: "rotation", token: "N" }, chirality: "Must be point-asymmetric -- reclassified from invariant to own N's rotation-twin (L4: invariant bases take mark-twins, never rotation-twins), so the square's own symmetry needs breaking the same way T's C1 resolution required." },
  { token: "H", unicodeHex: "F0013", object: "hook (acrophonic on /h/) -- prime of the breath family", sound: "h", class: "invariant", ring: "given", twin: { type: "flip", token: "Y" }, chirality: "Must be VERTICALLY asymmetric -- owns flip-twin Y. Family split (h/ç/x) is by marks on this base (H.c, H.x), not twins." },
  { token: "H.c", unicodeHex: "F0014", object: "H plus a place-mark", sound: "ç (ich-laut)", class: "mark-of-H", ring: "given", twin: { type: "mark", token: "H" }, chirality: null },
  { token: "H.x", unicodeHex: "F0015", object: "H plus a place-mark", sound: "x (velar fricative)", class: "mark-of-H", ring: "given", twin: { type: "mark", token: "H" }, chirality: null },
  { token: "SH", unicodeHex: "F0016", object: "shore (field-forced by Djyash)", sound: "ʃ", class: "free", ring: "given", twin: { type: "rotation", token: "ZH" }, chirality: "Must be point-asymmetric -- owns rotation-twin ZH. Angular per the hiss-law (L6).", note: "Base for the affricate compound (CH = SH + stop-mark)." },
  { token: "ZH", unicodeHex: "F0017", object: "SH's rotation-twin", sound: "ʒ", class: "free", ring: "received", twin: { type: "rotation", token: "SH" }, chirality: "The executed rotation of SH." },
  { token: "CH", unicodeHex: "F0018", object: "SH's base plus a stop-mark (affricate compound)", sound: "tʃ", class: "compound", ring: "given", twin: { type: "rotation", token: "JH" }, chirality: "Must be point-asymmetric -- owns rotation-twin JH. Compound = adjacency (SH's base fused to a stop-mark, ligature-fashion, L1)." },
  { token: "JH", unicodeHex: "F0019", object: "CH's rotation-twin", sound: "dʒ", class: "compound", ring: "received", twin: { type: "rotation", token: "CH" }, chirality: "The executed rotation of the CH compound." },
  { token: "TH", unicodeHex: "F001A", object: "congruent Greek borrow (theta, L5)", sound: "θ", class: "invariant", ring: "given", twin: { type: "mark", token: "DH" }, chirality: null, note: "Rotates to itself (invariant) -- so DH is a MARK-twin, not a rotation-twin (invariant bases take mark-twins, never rotation-twins, L4)." },
  { token: "DH", unicodeHex: "F001B", object: "TH's mark-twin", sound: "ð", class: "invariant", ring: "received", twin: { type: "mark", token: "TH" }, chirality: null },
  { token: "W", unicodeHex: "F001C", object: "wave", sound: "w", class: "free", ring: "made", twin: null, chirality: null, note: "Rounded per the bop-law (L6). No twin owed." },
  { token: "vowel.horizontal", unicodeHex: "F001D", object: "earth prime (L8) -- naming still open", sound: "(vowel prime)", class: "prime", ring: "made", twin: null, chirality: null },
  { token: "vowel.nub", unicodeHex: "F001E", object: "heaven prime (L8) -- naming still open", sound: "(vowel prime)", class: "prime", ring: "made", twin: null, chirality: null },
  { token: "IO", unicodeHex: "F001F", object: "compound vowel: I+O conjoined (G-A2)", sound: "io / yo", class: "ligature", ring: "made", twin: null, chirality: null, note: "Authored as its own coherent glyph -- NOT the two primes mechanically overlaid." },
  { token: "AE", unicodeHex: "F0020", object: "compound vowel: A+E conjoined (G-A2)", sound: "ae", class: "ligature", ring: "made", twin: null, chirality: null, note: "Authored as its own coherent glyph -- NOT the two primes mechanically overlaid." },
];

export function findGlyph(token) {
  return CENSUS.find((g) => g.token === token) || null;
}

export function ringColor(ring) {
  // Same three colors _templates/glyph-grid.svg already uses per tier.
  return { given: "#8a7a2a", received: "#2a5a8a", made: "#2a7a3a" }[ring] || "#555";
}
