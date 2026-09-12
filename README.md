# Glyph Studio

A browser-based, tablet-friendly authoring tool for a constructed script's
letterforms and syllable-block experiments. Zero-dependency, static,
no build step -- open `index.html` directly, or visit the hosted copy.

Companion to [Orphograph](https://github.com/zcroge/orphograph), which
plays the same alphabet's letters as sound on a 12-spoke wheel. The two
are deliberately separate, independently-versioned tools linked by a
shared vocabulary (the same 33 letter tokens, the same generator law)
rather than shared code.

## What's here

- **Letter Studio** -- draw any of the alphabet's 33 settled letters
  with a pressure-sensitive pen (a real tablet gives variable-width
  strokes; a mouse falls back to a flat medium width) on a shared
  1200-unit-per-em grid, or paint a low-resolution pixel version
  directly. A "derive pixels from vector" button rasterizes one from
  the other when you don't want to draw both by hand.
- **Transform assist** -- the script's own generator law is *base x
  transform x mark*: every letter pair related by a 180-degree rotation
  (voicing twins), a vertical flip (attitude/semantic twins), or a
  lateral mirror is governed by one rule. The studio overlays a ghost
  of the relevant transform on your own strokes live, so you can see
  whether the two twins actually read as distinct shapes as you draw --
  not just after the fact.
- **Compose Sandbox** -- a free-form canvas for arranging multiple
  drawn letters together in one space, for experimenting with
  syllable-block ideas ahead of any settled spatial rule.
- **Export** -- per-letter SVG, UFO `.glif` XML (matching the real
  codepoints already reserved for each letter), and pixel-grid JSON,
  plus a whole-project JSON backup/restore.

## Persistence

Everything you draw is saved to your browser's own local storage as you
go. Use the Export tab's "download everything" button periodically to
back up your work to a file -- local storage can be cleared by browser
settings, a different browser, or a different machine.
