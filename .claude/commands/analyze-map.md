# /analyze-map

Analyzes a generated pixel art battle map image and produces the terrain obstacle
grid (mapGrid) for that chapter, then writes it directly into ChapterData.js.

**Usage:** `/analyze-map <chapter_number>`
**Example:** `/analyze-map 1`

---

## What this skill does

1. Reads `assets/maps/chapter_$ARGUMENTS_bg.png` using vision
2. Analyzes each cell of the 32-row × 26-col logical grid
3. Classifies every cell with a terrain type ID (0-11)
4. Pays special attention to IMPASSABLE terrain: rivers/water (ID 3) and walls (ID 10)
5. Writes the resulting mapGrid into ChapterData.js for the specified chapter
6. Reports what was found and any uncertain cells for human review

---

## Instructions

When this skill is invoked with a chapter number argument ($ARGUMENTS):

### Step 1 — Read the image

Read the file `assets/maps/chapter_$ARGUMENTS_bg.png` using the Read tool (it supports
image files). Look at the full image carefully before starting cell-by-cell analysis.

### Step 2 — Understand the grid layout

The logical game grid maps onto the image like this:
- **Grid size:** 32 rows (top to bottom) × 26 cols (left to right)
- **Image size:** 512×640 px (generated) — stretched to ~936×1152 in-game
- **Each cell occupies:** approximately (512/26) ≈ 19.7 px wide × (640/32) = 20 px tall in the raw image
- Row 0 is at the TOP of the image; row 31 is at the BOTTOM
- Col 0 is at the LEFT; col 25 is at the RIGHT

### Step 3 — Terrain classification rules

Classify each cell using these IDs. When in doubt between two types, pick the one
that most affects gameplay (always classify rivers as WATER, walls as WALL):

| ID | Name     | Visual cue                                     | movCost | Notes              |
|----|----------|------------------------------------------------|---------|--------------------|
|  0 | GRASS    | Open green field, meadow                       | 1       | Default open terrain |
|  1 | FOREST   | Dark green tree canopy, woods                  | 2       | Slows movement     |
|  2 | MOUNTAIN | Rocky brown/grey peaks, cliffs, high terrain   | 3       | Very slow          |
|  3 | WATER    | Blue river, lake, moat, any body of water      | 99      | **IMPASSABLE**     |
|  4 | ROAD     | Tan/brown dirt path, road, trail               | 1       | Fast movement      |
|  5 | SAND     | Golden yellow sand, desert floor               | 2       | Slows movement     |
|  6 | CASTLE   | Grey stone floor, courtyard interior, flagstone| 1       | Bonus defense      |
|  7 | VILLAGE  | Buildings, houses, thatched roofs, structures  | 1       | Bonus defense      |
|  8 | SNOW     | Pale white/blue snow-covered ground            | 2       | Slows movement     |
|  9 | BRIDGE   | Wooden planks or stone arch crossing over water| 1       | Passable over water|
| 10 | WALL     | Dark stone walls, fortress walls, cliff faces  | 99      | **IMPASSABLE**     |
| 11 | OASIS    | Small pool + palm trees, green amid desert     | 1       | Bonus              |

**Critical rules:**
- A BRIDGE (9) cell must be adjacent to or surrounded by WATER (3) cells
- WALL (10) should be used for any barrier that a unit clearly could not walk through
- When a cell is on the boundary between two terrain types, use whichever covers more than half
- Err toward WATER/WALL for anything that looks impassable — it's better to block too much than to let units walk through rivers

### Step 4 — Analyze the image systematically

Work through the image in horizontal strips:
- **Strip A:** rows 0-7   (top of image, where enemies typically start)
- **Strip B:** rows 8-15  (upper middle)
- **Strip C:** rows 16-23 (lower middle)
- **Strip D:** rows 24-31 (bottom, where player typically deploys)

For each strip, describe what terrain features you see, then assign IDs row by row.

### Step 5 — Output the mapGrid

Output the complete 32×26 array in this exact JavaScript format:

```javascript
mapGrid: [
  // col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
  [/* row 0  */ 0, 0, 0, ...],
  [/* row 1  */ 0, 0, 0, ...],
  // ... all 32 rows
],
```

### Step 6 — Validate

Before writing to ChapterData.js, verify:
- Exactly 32 rows
- Each row has exactly 26 values
- All values are integers 0-11
- No BRIDGE (9) cells exist without adjacent WATER (3) cells
- playerStart positions from ChapterData.js are NOT on WATER or WALL cells
- Enemy spawn positions from ChapterData.js are NOT on WATER or WALL cells

If any playerStart or enemy position falls on an impassable cell, flag it clearly
and suggest the nearest passable alternative.

### Step 7 — Write to ChapterData.js

Read `/home/user/TowerDefense/js/pf/ChapterData.js` and find the chapter with
`id: $ARGUMENTS`. Replace its existing `mapGrid:` array entirely with the new one.

Use the Edit tool to make the replacement — match from the `mapGrid: [` line through
the closing `],` of that chapter's mapGrid.

### Step 8 — Report

After writing, report:
- Summary of terrain distribution (e.g. "60% grass, 20% forest, 8% water...")
- Any cells you were uncertain about and why
- Which WATER and WALL cells were found (these are the critical obstacle cells)
- Confirmation that playerStart and enemy positions are all on passable terrain

---

## Notes for this project

- The map image is **3/4 top-down oblique** style (like classic Shining Force, NOT true isometric)
- Tiles are rectangular in the image — there are no diagonal diamond tiles
- The image has **no grid lines** — you must estimate cell boundaries from the image dimensions
- Color is the primary indicator: blue = water, dark green = forest, brown = road, grey = castle/wall
- When unsure, check ChapterData.js for the chapter title and description — it gives terrain hints
- The existing mapGrid in ChapterData.js for that chapter is the REFERENCE design; the new one
  should match the visual content of the actual generated image
