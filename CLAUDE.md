# CLAUDE.md - Puppy Academy / Puppy Defender

## Project Overview

**Puppy Academy** is a JRPG meta-game built with pure HTML5/CSS/JavaScript and Canvas API. The core mini-game is **Puppy Defender**, an open-map tower defense where dog towers stop waves of cats using A* pathfinding. The project also includes a tactical RPG battle system (Shining Force-style), a story/dialogue engine, FF7-style village exploration, and a DBZ-style cutscene animator.

**Current version:** v0.3.0 (see `GAME_VERSION` in `js/config.js`)

**Zero external dependencies.** No npm, no frameworks, no build tools besides `bundle.py`.

---

## Repository Structure

```
TowerDefense/
├── .claude/
│   └── settings.json          # PostToolUse hook: auto-runs bundle.py on Edit/Write
├── css/
│   └── style.css              # All styling (~1,700 lines), FF7-inspired dark palette
├── js/                        # 22 JavaScript modules (~20,600 lines total)
│   ├── config.js              # Game constants, tower/enemy/level definitions, trivia
│   ├── utils.js               # Math helpers: dist, lerp, clamp, gridToPixel, pixelToGrid
│   ├── audio.js               # Procedural WAV synthesis (22,050 Hz), no external audio files
│   ├── pathfinding.js         # A* algorithm (Manhattan heuristic, 4-directional)
│   ├── grid.js                # Map grid, obstacle loading, tower placement validation
│   ├── enemy.js               # Enemy classes, path following, status effects
│   ├── tower.js               # Tower classes, upgrades, targeting, abilities
│   ├── projectile.js          # Projectile logic, chain lightning, splash, trails
│   ├── wave.js                # Wave spawning, enemy composition per level
│   ├── renderer.js            # Canvas 2D rendering engine (map, entities, effects)
│   ├── ui.js                  # HUD, tower selection, pointer event handling
│   ├── save.js                # Save/load system (base64 "PAv1_" format, localStorage)
│   ├── academy.js             # Dog breeds database, trainer progression, hub logic
│   ├── episodes.js            # Story episode data and dialogue trees
│   ├── story.js               # Story engine: dialogue, choices, exploration triggers
│   ├── hub.js                 # Hub/overworld screen rendering and navigation
│   ├── village.js             # FF7-style village exploration with camera + collision
│   ├── villageMaps.js         # Hand-crafted village map data (30x30 tile layers)
│   ├── tacticsSprites.js      # Pixel art sprite data (text-based character encoding)
│   ├── tacticsEngine.js       # Tactical battle engine: movement, combat, AI, turns
│   ├── cutscene.js            # DBZ-style prologue animation with particle effects
│   ├── tactics.js             # Tactical battle renderer and UI
│   └── game.js                # Main game loop, state machine, core orchestration
├── index.html                 # Entry point HTML (~197 lines), loads scripts in order
├── index-bundle.html          # Auto-generated single-file bundle (do NOT edit directly)
├── bundle.py                  # Python bundler: inlines CSS + JS into one HTML file
└── PLAN.md                    # Original design document
```

---

## Build System

### Bundling

The project uses a simple Python bundler that produces a single self-contained HTML file:

```bash
python3 bundle.py
```

This reads `index.html`, inlines `css/style.css` into a `<style>` tag, concatenates all JS files in dependency order into a single `<script>` tag, and writes `index-bundle.html`.

### Auto-bundling Hook

`.claude/settings.json` configures a PostToolUse hook that automatically runs `bundle.py` after any Edit or Write tool call. This keeps `index-bundle.html` in sync without manual rebuilds.

### JS Load Order (Critical)

Files must be loaded in this exact order (dependencies flow top to bottom):

1. `config.js` - Constants and definitions (no dependencies)
2. `utils.js` - Math helpers (no dependencies)
3. `audio.js` - Sound synthesis
4. `pathfinding.js` - A* algorithm
5. `grid.js` - Uses pathfinding
6. `enemy.js` - Uses grid, config
7. `tower.js` - Uses config, utils
8. `projectile.js` - Uses utils
9. `wave.js` - Uses config, enemy
10. `renderer.js` - Uses grid, tower, enemy, utils
11. `ui.js` - Uses renderer, grid, tower
12. `save.js` - Uses academy
13. `academy.js` - Uses config, save
14. `episodes.js` - Story data
15. `story.js` - Uses episodes
16. `village.js` - Uses config
17. `villageMaps.js` - Village map data
18. `hub.js` - Uses academy, save, story, village
19. `tacticsSprites.js` - Sprite data
20. `tacticsEngine.js` - Battle engine
21. `cutscene.js` - Animation system
22. `tactics.js` - Uses tacticsEngine, tacticsSprites, cutscene
23. `game.js` - Main loop (loaded last, orchestrates everything)

When adding a new JS file, add it to both `index.html` (as a `<script>` tag) and to the `JS_FILES` list in `bundle.py` in the correct dependency position.

---

## Running the Game

Open `index.html` in any modern browser (Chrome, Firefox, Safari, Edge). No server required — file:// protocol works. Alternatively, open the bundled `index-bundle.html` for a single-file version.

There is no test suite, linter, or type checker. Testing is manual via browser dev tools.

---

## Architecture

### Game State Machine

```
Title Screen → Hub/Academy → Battle Selection → Tower Defense Battle
                   ├→ Dog Roster Management       ├→ Planning Phase
                   ├→ Story Episodes               ├→ Combat Phase
                   ├→ Tactical Battles             ├→ Trivia (between waves)
                   ├→ Village Exploration           └→ Victory/Defeat
                   └→ Save/Load
```

The `Game` class (`js/game.js`) drives the main `requestAnimationFrame` loop and manages state transitions. Game state is stored in `game.state` with values: `title`, `playing`, `level_complete`, `won`, `lost`.

### Core Systems

| System | Key Files | Description |
|--------|-----------|-------------|
| Tower Defense | `grid.js`, `tower.js`, `enemy.js`, `projectile.js`, `wave.js` | 12x18 grid, A* pathfinding, 8 tower types, 6 enemy types |
| Rendering | `renderer.js`, `ui.js` | Canvas 2D, procedural grass, particles, floating damage |
| Academy/Hub | `academy.js`, `hub.js` | Dog roster, trainer progression, meta-game |
| Story | `story.js`, `episodes.js` | Dialogue engine with typing effect, choices, branching |
| Tactical Battle | `tacticsEngine.js`, `tactics.js`, `tacticsSprites.js` | Shining Force-style grid combat, turn-based |
| Village | `village.js`, `villageMaps.js` | FF7-style exploration with collision, NPCs |
| Cutscenes | `cutscene.js` | DBZ-style anime cutscene with particle effects |
| Audio | `audio.js` | Procedural WAV synthesis, no external audio files |
| Save/Load | `save.js` | Base64-encoded JSON, localStorage persistence |

### Design Patterns

- **ES6 classes** for all major systems (`Game`, `Grid`, `Tower`, `Enemy`, `Renderer`, `UI`, etc.)
- **Singleton objects** for `GameAudio` and `SaveSystem`
- **Central config object** (`CONFIG` in `config.js`) for all game constants and balance values
- **State machine** for game flow and story progression
- **Delta-time animation** — all updates use `dt` (seconds) from the game loop
- **Event-driven input** via pointer events on the canvas

---

## Coding Conventions

### JavaScript

- **ES6 classes** with `const`/`let` (no `var`)
- **4-space indentation**
- Template literals for HTML string construction
- Arrow functions in callbacks
- `UPPER_SNAKE_CASE` for constants (`GRID_COLS`, `MAX_TOWER_LEVEL`)
- `camelCase` for variables, functions, and methods
- `PascalCase` for class names
- Each file starts with a one-line comment describing its purpose
- All game balance values live in `CONFIG` — never hardcode magic numbers in game logic
- Coordinate helpers: use `gridToPixel()` and `pixelToGrid()` from `utils.js`

### CSS

- FF7-inspired dark palette (`#000011` to `#0d1040`) with gold accents (`#FFD700`)
- Cinzel serif font for titles
- Mobile-first responsive design
- Flexbox layouts
- Keyframe animations for UI effects (shimmer, pulse, glow, float)

### HTML

- Single canvas element (`#game-canvas`) for all game rendering
- DOM overlays for UI screens (title, hub, HUD, game-over, etc.)
- `data-*` attributes for state binding (`data-level`, `data-dog-id`)

---

## Key Implementation Details

### Grid & Pathfinding

- Grid is 12 columns x 18 rows. Cell types: 0=empty, 1=tower, 2=water, 3=rock, 4=tree, 5=bridge
- Entry point: `(0, 9)`, Exit point: `(11, 9)`
- A* uses Manhattan heuristic, 4-directional movement
- Walkable cells: 0 (empty) and 5 (bridge). Everything else blocks.
- Tower placement is rejected if it would block all paths from entry to exit
- Path recalculates whenever towers are placed or sold

### Tower System

- 8 tower types defined in `CONFIG.TOWERS`
- Max upgrade level: 4 (each level: +40% stats, cost = base cost)
- Sell refund: 50% of total invested
- Global abilities activate for all towers of a type (cooldown 40-60s)
- Super towers: merge 3-in-a-line for powered-up forms

### Economy

- Start: 600 gold, 20 lives
- Kill gold varies by enemy type (10-200g)
- Wave income: 25g/wave, Send Early bonus: 30g
- Combo system: kill streaks within 1.5s window earn bonus gold

### Save Format

- Base64-encoded JSON with `"PAv1_"` prefix
- Stored in `localStorage` key `"puppy_academy_save"`
- Contains: player name, rank, XP, currency, dog roster, completed levels, story progress

---

## Common Tasks

### Adding a New Tower Type

1. Add tower definition to `CONFIG.TOWERS` in `config.js` (name, emoji, cost, range, damage, fireRate, special properties)
2. Add corresponding dog breed to `DOG_BREEDS` in `academy.js`
3. If it has a super tower form, add to `CONFIG.SUPER_TOWERS` in `config.js`
4. Tower rendering and targeting logic in `tower.js` will pick up the config automatically

### Adding a New Enemy Type

1. Add enemy definition to `CONFIG.ENEMIES` in `config.js` (name, emoji, hp, speed, gold, special traits)
2. If it has special behavior (like dodge or armor), implement in `enemy.js`
3. Add to wave compositions in `wave.js`

### Adding a New Level

1. Add level definition to `CONFIG.LEVELS` in `config.js` (name, waves, hpScale, speedScale)
2. Add corresponding map layout to `CONFIG.MAP_LAYOUTS` (obstacle positions)
3. Add trivia questions to `CONFIG.TRIVIA` for the new level index

### Adding a New Story Episode

1. Add episode object to `EPISODES` in `episodes.js`
2. Define scenes with dialogue, characters, decorations, and choices
3. Hook trigger points in `hub.js` or `story.js`

### Adding a New JS Module

1. Create the file in `js/`
2. Add a `<script src="js/yourfile.js"></script>` tag in `index.html` in the correct dependency position
3. Add `"js/yourfile.js"` to the `JS_FILES` list in `bundle.py` at the matching position
4. The PostToolUse hook will auto-rebuild the bundle

---

## Important Warnings

- **Do NOT edit `index-bundle.html` directly.** It is auto-generated by `bundle.py`. All changes go in the source files (`js/`, `css/`, `index.html`).
- **JS load order matters.** Scripts execute in sequence and depend on globals defined by earlier scripts. Misordering will cause `ReferenceError` at runtime.
- **All graphics are procedural.** There are no image assets. Sprites are drawn via Canvas API or encoded as text-based pixel art (`tacticsSprites.js`).
- **All audio is procedural.** Sound effects are synthesized as WAV data at runtime. No audio files exist.
- **Mobile-first design.** The game targets portrait mobile screens (max-width 500px). Touch input via Pointer Events API. Test on mobile viewports.
- **No module system.** All JS files define globals (classes, objects, functions). There are no `import`/`export` statements.
