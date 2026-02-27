# Puppy Force — Claude Development Notes

Fire Emblem-style browser tactics game. Phaser 3, pure JS, no build step.
Branch: `claude/puppy-force-game-BhoEA`

---

## Deploying the Game

**ALWAYS rebuild the bundle before deploying.** The live game at
`https://granbyknight-spec.github.io/TowerDefense/index-bundle.html`
serves `index-bundle.html` from the `PuppyForce` branch. This file must be
regenerated whenever any `js/pf/` file changes.

```bash
python3 bundle.py          # regenerates index-bundle.html from js/pf/ files
git add index-bundle.html
git commit -m "Rebuild bundle"
git push -u origin claude/puppy-force-game-BhoEA
# Then /deploy to merge into PuppyForce
```

**Deploy is blocked in this environment** — `gh` CLI is not installed and the
git proxy only allows pushing to `claude/` branches. To deploy:
1. Push the bundle to the feature branch (above)
2. Open a PR on GitHub: `claude/puppy-force-game-BhoEA` → `PuppyForce`
3. Merge it — GitHub Pages updates automatically

---

## Token Budget — Stop and Rethink

**Before starting any task that will produce long output, ask: is there a more compact approach?**

### Red flags — stop and reconsider if you see these patterns
- About to enumerate **every item in a large list/grid** one by one (e.g. all 832 cells of a map, every line of a large file)
- Planning to output **>200 lines of analysis** before producing the actual result
- A single agent is about to do **multi-pass reasoning** over a large dataset
- Response is growing very long and the actual edit/output hasn't been written yet

### How to compress
| Instead of...                            | Do this instead                                |
|------------------------------------------|------------------------------------------------|
| Analyzing every cell individually        | Identify zones/regions; default + exceptions   |
| Enumerating all files to find one thing  | Use Grep or Glob directly                      |
| One agent doing everything sequentially  | Split into parallel agents, each with one job  |
| Verbose per-item commentary in output    | Compact format (numbers only, zone ranges)     |
| Reasoning through all cases in prose     | Decision table or rule list, then apply        |

### The rethink trigger
If you catch yourself mid-task doing any of the above, **stop immediately**:
1. Do NOT continue the expensive approach
2. State what you were doing and why it was going to be too large
3. Propose the compressed approach
4. Ask for confirmation if the new approach changes the output format

Use `/rethink` to walk through this structured re-evaluation.

---

## Agent Orchestration Philosophy

**Always use parallel agents.** Any time a task can be split across files or subsystems that don't write to the same files, launch multiple agents in parallel in a single message. Claude Code is always the orchestrator — it assigns work, tracks progress, and integrates results.

### Rules for parallelizing
- Split by **file**: agents editing different files never conflict
- Split by **subsystem**: art generation, pathfinding, UI, audio are independent
- One agent per file that is being written — never two agents editing the same file simultaneously
- Research/Explore agents can always run in parallel with each other and with coding agents
- Always tell each agent exactly which files it owns and which it must NOT touch

### When agent teams become available
> **NOTE FOR FUTURE SESSIONS:** If the Claude Code interface ever shows an "Agent Teams" or multi-agent collaboration feature, flag it immediately to the user and switch to using it. Parallel sub-agents coordinated as a proper team will be faster and more reliable than the current single-orchestrator model. Check for this feature at the start of any session.

---

## Art Generation — AI Horde via GitHub Actions

All pixel art and portrait generation uses **AI Horde** (free distributed Stable Diffusion).
**Never try to call the AI Horde API directly from this server — it is blocked by the proxy.**
Always use the GitHub Actions workflow instead.

### How to trigger art generation

Use the `Generate AI Art Assets` workflow (`generate-assets.yml`):
- Go to GitHub → Actions → "Generate AI Art Assets" → Run workflow
- Pick which asset type to generate from the dropdown:
  - `characters` — player dog portraits → `assets/characters/<ID>_portrait.png`
  - `enemies`    — enemy cat sprites   → `assets/enemies/<id>_v1.png` … `_v4.png`
  - `terrain`    — terrain tiles       → `assets/terrain/<name>_v1.png`
  - `backgrounds`— battle backgrounds  → `assets/backgrounds/chapter_<N>_v1.png`
  - `all`        — regenerate everything

The workflow commits the generated files directly to the branch. Refresh/pull after it completes.

### Generation scripts (in `scripts/`)

| Script | Output | Notes |
|--------|--------|-------|
| `generate-characters.js` | `assets/characters/<ID>_portrait.png` | 1 image per hero, anime dog style |
| `generate-enemies.js`    | `assets/enemies/<id>_v1…v4.png`      | 4 variants per enemy, pixel art style |
| `generate-terrain.js`    | `assets/terrain/<name>_v1.png`       | 1 per terrain type |
| `generate-backgrounds.js`| `assets/backgrounds/chapter_N_v1.png`| 1 per chapter |

Scripts skip files that already exist — safe to re-run to fill in failures.

### Adding new art assets

1. **New player character**: Add entry to `HEROES` array in `scripts/generate-characters.js`
   - id must match the unit's `id` field in `Config.js`
   - Output file: `assets/characters/<ID>_portrait.png`
   - BattleScene loads it automatically via `player_png_<ID>` texture key

2. **New enemy**: Add entry to `ENEMIES` array in `scripts/generate-enemies.js`
   - Output file: `assets/enemies/<id_lowercase>_v1.png`
   - BattleScene loads it automatically via `enemy_png_<ID>` texture key
   - Review 4 variants; copy best to `_v1.png` (the game always loads `_v1`)

3. **Cutscene portraits**: Same files as above — CutsceneScene uses them for dialogue art

### Model choices (as of 2026)
- Characters: `Animagine XL 3.1`, `Anything Diffusion`, `Deliberate` (anime portrait style)
- Enemies: `AIO Pixel Art`, `PixelArt XL`, `Anything Diffusion` (pixel art / chibi style)
- The workflow tries models in order; AI Horde picks the first available worker

---

## Project Structure

```
js/pf/
  Config.js          — tile constants, terrain, PAL colors, CLASS_RING_COLOR, CLASS_ICON, HERO_DEFS, ENEMY_DEFS
  Unit.js            — Unit class (stats, gainExp, levelUp, toSave/fromSave)
  SaveManager.js     — localStorage save/load, serializeRoster/deserializeRoster
  ChapterData.js     — map grids, enemy spawns, dialogue, player start positions
  Pathfinding.js     — A* pathfinding + flood-fill reachability
  SpriteSheet.js     — SVG sprite generation for all units (fallback when no PNG)
  scenes/
    TitleScene.js    — title screen; debug chapter-jump buttons (localhost only)
    BattleScene.js   — main battle logic and state machine
    UIScene.js       — HUD overlay (HP, buttons, unit info panel)
    VictoryScene.js  — post-battle results and level-up display
    CutsceneScene.js — dialogue cutscenes with portrait art
assets/
  characters/        — player portrait PNGs (generated by generate-characters.js)
  enemies/           — enemy sprite PNGs (generated by generate-enemies.js)
  backgrounds/       — chapter battle backgrounds
  terrain/           — terrain tile PNGs
scripts/             — Node.js art generation scripts (run via GitHub Actions)
.github/workflows/   — CI: generate-assets.yml, generate-sfx.yml
```

## Battle State Machine (BattleScene)

`BS.IDLE → UNIT_SEL → UNIT_MOVED → TARGET_ATK/TARGET_HEAL → ANIMATING → ENEMY_TURN → IDLE`

Victory/Defeat states: always guard `_processNextEnemy` and `onEndTurn` against these.
`_battleEnded` latch: prevents `_endBattle` firing twice.

## XP System

- Kill XP: attacker gains `enemy.expReward` on kill (~88-95 for normals, 160-250 for bosses)
- Hit XP: `10 + floor(dmg/2)` per attack (both sides)
- Heal XP: 25 per heal (healer only)
- Level curve: ~100 XP per level → 1 kill in Ch1 ≈ 1 level up

## Terrain

WALL(10) and WATER(3) have `movCost:99` (impassable). BRIDGE(9) is passable.
Already implemented in pathfinding — only `mapGrid` arrays in ChapterData.js need updating.
