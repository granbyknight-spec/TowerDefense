# /analyze-map

Analyzes a generated pixel art battle map image and produces the terrain obstacle
grid (mapGrid) for that chapter, then writes it directly into ChapterData.js.

**Usage:** `/analyze-map <chapter_number>`
**Example:** `/analyze-map 1`

---

## What this skill does

1. Reads the chapter map image using vision
2. Identifies terrain **zones** (regions, not individual cells) — much more token-efficient
3. Builds the 32×26 mapGrid by starting from a default and patching exception zones
4. Validates against ChapterData.js spawn positions
5. Writes the mapGrid and reports

---

## Terrain ID reference

| ID | Name     | Visual cue                                     | movCost |
|----|----------|------------------------------------------------|---------|
|  0 | GRASS    | Open green field, meadow                       | 1       |
|  1 | FOREST   | Dark green tree canopy, woods                  | 2       |
|  2 | MOUNTAIN | Rocky brown/grey peaks, cliffs                 | 3       |
|  3 | WATER    | Blue river, lake, moat — **IMPASSABLE**        | 99      |
|  4 | ROAD     | Tan/brown dirt path, trail                     | 1       |
|  5 | SAND     | Golden yellow sand, desert                     | 2       |
|  6 | CASTLE   | Grey stone floor, courtyard, flagstone         | 1       |
|  7 | VILLAGE  | Buildings, houses, structures                  | 1       |
|  8 | SNOW     | Pale white/blue snow-covered ground            | 2       |
|  9 | BRIDGE   | Wooden planks crossing over water              | 1       |
| 10 | WALL     | Dark stone walls, fortress walls — **IMPASSABLE** | 99   |
| 11 | OASIS    | Small pool + palm trees amid desert            | 1       |

---

## Instructions

### Step 0 — Parallel setup (launch both in one message)

Launch **two agents in parallel**:
- **Agent A (image):** Read `assets/maps/chapter_$ARGUMENTS_bg.png` and return terrain zone descriptions (see Step 1)
- **Agent B (data):** Read `js/pf/ChapterData.js` and return: (a) existing mapGrid for chapter $ARGUMENTS, (b) all playerStart positions, (c) all enemy spawn positions

Do NOT proceed to Step 2 until both return.

### Step 1 — Zone identification (Agent A's job)

**Do NOT analyze cell-by-cell.** Instead, identify terrain **zones** — contiguous rectangles or strips of the same terrain type.

Grid layout:
- **32 rows** (row 0 = top, row 31 = bottom) × **26 cols** (col 0 = left, col 25 = right)
- Image is ~512×640 px → each cell ≈ 19.7 px wide × 20 px tall
- Style: 3/4 top-down oblique (like Shining Force) — rectangular tiles, no grid lines
- Color is the primary cue: blue=water, dark green=forest, brown=road, grey=wall/castle

**Zone format to return** (compact text, NOT a grid):
```
DEFAULT: 0 (GRASS)
ZONES:
  FOREST   rows 0-6,   cols 0-5
  WALL     rows 11-12, cols 0-6
  WALL     rows 11-12, col 9
  WALL     rows 11-12, cols 12-25
  ROAD     rows 0-31,  cols 10-11   (vertical road)
  ROAD     rows 8-9,   cols 0-25    (horizontal road)
  WATER    rows 14-18, cols 3-8
  BRIDGE   rows 16-17, cols 10-11
  ...
```

Rules for zones:
- Err toward WATER/WALL for anything impassable — blocking too much beats letting units walk through walls
- A BRIDGE zone must be adjacent to WATER zones
- Where road and another terrain meet, ROAD takes priority (it's a passable corridor)
- List zones in order from top to bottom, left to right
- If a zone is a single cell, write `row X, col Y`
- If uncertain about exact row/col boundaries, give your best estimate and mark it `[?]`

Agent A returns ONLY the zone list and a brief visual description of the map. No grid output.

### Step 2 — Build the mapGrid

From Agent A's zone list, mechanically construct the 32×26 grid:

1. Fill all 32×26 cells with the DEFAULT value
2. Apply each zone in order (later zones overwrite earlier ones)
3. For irregular zones marked `[?]`, use the given estimate — it will be reviewed

Output the complete grid as a JavaScript array. **Keep comments minimal** — one comment per row with just the row number:

```javascript
mapGrid: [
  /* r0  */ [0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  /* r1  */ [1,1,1,1,1,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ...
],
```

Do NOT add column-by-column comments or per-cell reasoning inside the array — just numbers.

### Step 3 — Validate

Using Agent B's data, verify:
- Exactly 32 rows, each with exactly 26 values, all integers 0–11
- No BRIDGE (9) cell without an adjacent WATER (3) cell
- No playerStart position falls on WATER (3) or WALL (10)
- No enemy spawn position falls on WATER (3) or WALL (10)

If any spawn is on an impassable cell, flag it and suggest the nearest passable neighbor.

### Step 4 — Confirm with user before writing

**Before writing to ChapterData.js**, output a brief summary:
```
ZONE SUMMARY for chapter $ARGUMENTS:
  Dominant: GRASS (~X%), FOREST (~X%)
  Obstacles: WALL at [list zones], WATER at [list zones]
  Roads: [list zones]
  Uncertain cells: [list any [?] zones]
  Spawn check: all clear / [any conflicts]

Ready to write mapGrid — confirm? (or adjust zones above)
```

Wait for user confirmation before proceeding to Step 5.

### Step 5 — Write to ChapterData.js

Read `js/pf/ChapterData.js` (if Agent B hasn't already returned it). Find the chapter
with `id: $ARGUMENTS`. Replace its `mapGrid:` array entirely with the new one.

Use the Edit tool — match from the `mapGrid: [` line through the closing `],` of that
chapter's mapGrid only.

### Step 6 — Report

After writing:
- Confirm the write succeeded
- List WALL and WATER zones (the critical obstacle cells)
- Note any uncertain cells that may need manual review
- Note any spawn conflicts that were found (even if passable, flag close calls)

---

## Token budget guidance

This skill is designed to stay well under token limits:
- Agent A returns a zone list (~20-40 lines), NOT a 832-cell analysis
- The grid is generated mechanically from zones — no per-cell reasoning
- Grid output is numbers only (~700 chars), not commented prose
- If the zone list exceeds ~50 zones, look for opportunities to merge adjacent same-type zones

---

## Notes

- The image has **no grid lines** — estimate cell boundaries from image dimensions
- When uncertain between two terrain types, always pick the one that most affects gameplay
- The existing mapGrid in ChapterData.js is the REFERENCE design; the new one should match the actual generated image
- After writing, the user may adjust individual cells manually by editing ChapterData.js directly
