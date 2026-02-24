# Puppy Force — Game State Reference

> **Intended audience:** An AI design partner (ChatGPT, Gemini, etc.) who wants to understand the current state of the game in order to brainstorm design ideas, mechanics, and next steps. All data is drawn directly from the source code — numbers are exact.

---

## 1. Game Concept

| Field | Value |
|---|---|
| **Genre** | Turn-based tactical RPG (TRPG) — think Fire Emblem / Shining Force |
| **Platform** | Browser (desktop + mobile), portrait orientation |
| **Tone** | Cute/whimsical anime — heroic dog knights vs. villainous cat empire |
| **Version** | v1.0, advertised as "7 Chapters · Dogs vs Cats" |

### Narrative Premise

The **Cat Empire** has invaded **Barkville**, a peaceful dog village. A squad of dog heroes — knights, healers, mages, archers, cavalry, and thieves — must fight their way through seven chapters: a village siege, a forest ambush, a mountain pass, a river crossing, a desert, a fortress assault, and a final throne-room battle against the **Cat Emperor**. Along the way they recruit additional allies (an otter, a fox) and ultimately liberate all animals.

The game uses a **Dogs are good / Cats are villains** framing purely for fun; the cat units are named things like "Siamese Assassin," "Persian Queen," and "Cat Emperor."

---

## 2. Architecture

### Tech Stack

- **Phaser 3** (WebGL → Canvas fallback, `Phaser.AUTO`)
- **Plain ES5-style JavaScript** (`'use strict'`; no bundler, no TypeScript)
- All code is loaded via `<script>` tags; `bundle.py` exists at the project root to concatenate them
- Game canvas: **480 × 720 px**, scaled with `Phaser.Scale.FIT` + `CENTER_BOTH`
- Mobile support: touch input enabled, iOS double-tap zoom suppressed
- Pixel art mode is **off** (`antialias: false, pixelArt: false`)

### File Structure

```
/home/user/TowerDefense/
├── index.html
├── index-bundle.html
├── bundle.py
├── PLAN.md
├── css/
├── assets/                  ← (empty or placeholder; real art not yet present)
├── scripts/
│   ├── generate-terrain.js     ← AI Horde image generation for 12 terrain types
│   ├── generate-characters.js  ← AI Horde portrait generation for 9 heroes
│   ├── generate-enemies.js     ← AI Horde sprite generation for 11 enemy types
│   └── generate-backgrounds.js ← AI Horde battle background generation (7 scenes)
└── js/pf/
    ├── main.js              ← Phaser game boot, scene list, monkey-patch for chapter title
    ├── Config.js            ← ALL constants: tile size, terrain, palette, hero/enemy/skill defs
    ├── Unit.js              ← Unit class: stats, combat, EXP, level-up, promotion, buff, save
    ├── ChapterData.js       ← 7 chapter maps (12×10 grid arrays), enemy spawns, dialogue
    ├── EnemyAI.js           ← 5 AI behavior types
    ├── Pathfinding.js       ← Flood-fill movement range + A* pathfinding
    ├── SaveManager.js       ← localStorage save/load
    ├── SpriteSheet.js       ← Inline SVG sprites for all 21 units (encoded as data URIs)
    └── scenes/
        ├── BattleScene.js   ← Core battle logic (~1400 lines)
        ├── UIScene.js       ← HUD overlay running parallel to BattleScene
        ├── TitleScene.js    ← Animated title screen
        ├── VictoryScene.js  ← Win/lose results screen
        └── CutsceneScene.js ← Animated inter-chapter story transition
```

### Multi-Scene Setup

Phaser 3 supports running multiple scenes simultaneously. Puppy Force exploits this:

- **BattleScene + UIScene** run **in parallel** — BattleScene handles all game logic and grid rendering; UIScene renders the HUD panel, action menu, dialogue box, and banners on top.
- `BattleScene.create()` launches UIScene via `this.scene.launch('UIScene', { battleScene: this })`.
- UIScene calls back into BattleScene (`this._battle.onActionAttack()`, etc.) via a stored reference.
- **Scene transitions:** TitleScene → BattleScene (+ UIScene) → VictoryScene → CutsceneScene → BattleScene (next chapter)

---

## 3. Hero Roster

All heroes are defined in `Config.js → HERO_DEFS`. Stats shown are base (level 1 unless noted).

### Core Heroes (8 units)

#### PUPPY_KNIGHT
| Stat | Value |
|---|---|
| Class | Knight → **Dog Paladin** (promoted) |
| HP / ATK / DEF / MOV / AGI | 26 / 12 / 10 / 5 / 6 |
| Max MP | 10 |
| Level | 1 |
| Growth (per level) | HP +4 (+0–1 random), ATK +2, DEF +2, AGI +1 |
| Weapon / Range | sword / 1 |
| Starting skills | charge |
| Skill unlocked at Lv 5 | slash |
| Promoted skill at Lv 1 | guard |
| Promotion bonus | +8 HP, +4 ATK, +4 DEF, +1 MOV, +1 AGI |
| Starting items | herb |
| Chapter | 1 |
| SVG sprite | Blue knight visor with red plume, golden fur |

#### CORGI_HEALER
| Stat | Value |
|---|---|
| Class | Healer → **Corgi Cleric** |
| HP / ATK / DEF / MOV / AGI | 16 / 4 / 4 / 5 / 8 |
| Max MP | 12 |
| Level | 1 |
| Growth | HP +2, ATK +1, DEF +1, AGI +2 |
| Weapon / Range | staff / 1 |
| Starting skills | heal |
| Skill at Lv 5 | guard |
| Promoted skill at Lv 10 | healall |
| Promotion bonus | +6 HP, +2 ATK, +3 DEF, +1 MOV, +2 AGI |
| Starting items | herb |
| Chapter | 1 |
| SVG sprite | Cream fur, green healer cross on forehead |

#### LABRADOR_SCOUT (displayed as "Lab Warrior")
| Stat | Value |
|---|---|
| Class | Warrior → **Lab Hero** |
| HP / ATK / DEF / MOV / AGI | 20 / 11 / 7 / 6 / 9 |
| Max MP | 8 |
| Level | 1 |
| Growth | HP +3, ATK +2, DEF +2, AGI +1 |
| Weapon / Range | sword / 1 |
| Starting skills | dash |
| Skill at Lv 5 | slash |
| Promoted skill at Lv 1 | charge |
| Promotion bonus | +8 HP, +4 ATK, +3 DEF, +1 MOV, +2 AGI |
| Chapter | 1 |
| SVG sprite | Dark gold fur, red scout bandana |

#### BEAGLE_ARCHER
| Stat | Value |
|---|---|
| Class | Archer → **Beagle Ranger** |
| HP / ATK / DEF / MOV / AGI | 18 / 13 / 5 / 5 / 9 |
| Max MP | 8 |
| Level | **2** |
| Growth | HP +2, ATK +3, DEF +1, AGI +2 |
| Weapon / Range | bow / **2** |
| Starting skills | shoot |
| Skill at Lv 5 | guard |
| Promoted skill at Lv 1 | fireball |
| Promotion bonus | +6 HP, +4 ATK, +2 DEF, +1 MOV, +2 AGI |
| Chapter | Joins in Chapter 2 (recruitable) |
| SVG sprite | Tricolor beagle, dark saddle patch, archery visor |

#### POODLE_MAGE
| Stat | Value |
|---|---|
| Class | Mage → **Poodle Wizard** |
| HP / ATK / DEF / MOV / AGI | 14 / 15 / 3 / 5 / 8 |
| Max MP | **14** (highest of core heroes) |
| Level | 1 |
| Growth | HP +2, ATK +3, DEF +1, AGI +2 |
| Weapon / Range | wand / 2 |
| Starting skills | fireball |
| Skill at Lv 5 | guard |
| Promoted skill at Lv 1 | heal |
| Promotion bonus | +5 HP, +5 ATK, +2 DEF, +1 MOV, +2 AGI |
| Starting items | herb |
| Chapter | 1 |
| SVG sprite | Lavender poodle curls, gold star on forehead |

#### BULLDOG_TANK
| Stat | Value |
|---|---|
| Class | Knight → **Bulldog General** |
| HP / ATK / DEF / MOV / AGI | **36** / 10 / **15** / 4 / 4 |
| Max MP | 6 (lowest of all heroes) |
| Level | **3** |
| Growth | HP +6, ATK +2, DEF +3, AGI +1 |
| Weapon / Range | axe / 1 |
| Starting skills | guard |
| Skill at Lv 5 | slash |
| Promoted skill at Lv 1 | charge |
| Promotion bonus | +10 HP, +3 ATK, +5 DEF, +0 MOV, +1 AGI |
| Starting items | bread |
| Chapter | Joins in Chapter 3 (recruitable) |
| SVG sprite | Grey stocky face, spiked collar, angry brows |

#### HUSKY_RIDER
| Stat | Value |
|---|---|
| Class | Cavalry → **Husky Champion** |
| HP / ATK / DEF / MOV / AGI | 22 / 14 / 8 / **8** / 7 |
| Max MP | 8 |
| Level | 1 |
| Growth | HP +3, ATK +3, DEF +2, AGI +1 |
| Weapon / Range | lance / 1 |
| Starting skills | charge |
| Skill at Lv 5 | dash |
| Promoted skill at Lv 1 | slash |
| Promotion bonus | +8 HP, +4 ATK, +3 DEF, +1 MOV, +2 AGI |
| Chapter | 1 |
| SVG sprite | Blue eyes, husky mask pattern, harness straps |

#### TERRIER_THIEF
| Stat | Value |
|---|---|
| Class | Thief → **Terrier Ninja** |
| HP / ATK / DEF / MOV / AGI | 16 / 11 / 5 / 6 / **12** (highest AGI of core heroes) |
| Max MP | 10 |
| Level | 1 |
| Growth | HP +2, ATK +2, DEF +1, AGI +3 |
| Weapon / Range | dagger / 1 |
| Starting skills | shoot |
| Skill at Lv 5 | dash |
| Promoted skill at Lv 1 | slash |
| Promotion bonus | +5 HP, +3 ATK, +2 DEF, +1 MOV, +3 AGI |
| Chapter | 1 |
| SVG sprite | Rust fur, thief eye mask, red scarf, dagger ear |

### Recruitable Allies (2 units, defined in `ALLY_DEFS`)

#### OTTER_ALLY ("Otto Otter")
| Stat | Value |
|---|---|
| Class | Swimmer → **Otter Admiral** |
| HP / ATK / DEF / MOV / AGI | 20 / 11 / 7 / 6 / 9 |
| Max MP | 8 |
| Level | 4 |
| Special Movement | Can traverse Water and Bridge tiles (mov cost 2 instead of 99) |
| Weapon / Range | spear / 1 |
| Starting skills | dash |
| Skill at Lv 5 | slash |
| Promoted skill at Lv 1 | charge |
| Chapter | Joins in Chapter 4 |

#### FOX_SCOUT ("Foxy Scout")
| Stat | Value |
|---|---|
| Class | Scout → **Desert Fox** |
| HP / ATK / DEF / MOV / AGI | 17 / 10 / 6 / 7 / 11 |
| Max MP | 8 |
| Level | 5 |
| Special Movement | Sand tiles cost 1 instead of 2 |
| Weapon / Range | bow / 2 |
| Starting skills | shoot |
| Skill at Lv 5 | guard |
| Promoted skill at Lv 1 | fireball |
| Chapter | Joins in Chapter 5 |

### Default Starting Roster (new game)

`SaveManager.newGame()` pre-populates 6 heroes: PUPPY_KNIGHT, CORGI_HEALER, LABRADOR_SCOUT, POODLE_MAGE, HUSKY_RIDER, BEAGLE_ARCHER.

> Note: TERRIER_THIEF and BULLDOG_TANK are defined in HERO_DEFS but **not in the default roster**. TERRIER_THIEF appears in Chapter 6's intro dialogue but has no recruitable entry in any chapter data — this is a **known gap** (see Section 11).

---

## 4. Enemy Roster

All defined in `Config.js → ENEMY_DEFS`. Enemies are **scaled by level** at spawn time using `buildEnemyUnit()` in `ChapterData.js` — growth stats are applied for each level above the base.

| ID | Name | Class | HP | ATK | DEF | MOV | AGI | Level | Weapon | Range | AI Type | Boss? | EXP Reward |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SCOUT_CAT | Scout Cat | Scout | 14 | 8 | 4 | 6 | 9 | 1 | dagger | 1 | aggressive | No | 20 |
| ALLEY_CAT | Alley Cat | Fighter | 30 | 14 | 8 | 5 | 7 | 3 | claw | 1 | boss | Yes | 80 |
| SIAMESE_ASSASSIN | Siamese | Assassin | 16 | 14 | 6 | 6 | 13 | 2 | blade | 1 | flanker | No | 30 |
| PERSIAN_SORCERER | Persian Sorc | Mage | 14 | 16 | 4 | 4 | 7 | 2 | wand | 2 | ranged | No | 35 |
| TIGER_GENERAL | Tiger General | General | 28 | 13 | 12 | 4 | 5 | 3 | spear | 1 | defensive | No | 50 |
| LYNX_RANGER | Lynx Ranger | Ranger | 28 | 15 | 7 | 5 | 10 | 4 | bow | 2 | boss | Yes | 90 |
| SNOW_LEOPARD | Snow Leopard | Knight | 34 | 16 | 11 | 5 | 8 | 5 | sword | 1 | boss | Yes | 100 |
| RIVER_PANTHER | River Panther | Swimmer | 36 | 17 | 10 | 6 | 9 | 5 | claws | 1 | boss | Yes | 110 |
| SAND_CAT_KING | Sand Cat King | King | 40 | 18 | 12 | 6 | 10 | 6 | blade | 1 | boss | Yes | 120 |
| PERSIAN_QUEEN | Persian Queen | Sorceress | 42 | 22 | 10 | 5 | 11 | 7 | staff | 2 | boss | Yes | 140 |
| CAT_EMPEROR | Cat Emperor | Emperor | **62** | **25** | **18** | 5 | 12 | **10** | mageblade | 2 | boss | Yes | 200 |

**Enemy growth rates (per level above base):**
- SCOUT_CAT: HP+1, ATK+1, DEF+1, AGI+1
- SIAMESE_ASSASSIN: HP+1, ATK+2, DEF+1, AGI+2
- TIGER_GENERAL: HP+2, ATK+1, DEF+2, AGI+0
- Most bosses: HP+3, ATK+2, DEF+2, AGI+1

**Special movement:** RIVER_PANTHER can traverse Water tiles.

---

## 5. Battle System

### Grid

- **10 columns × 12 rows** of 44×44px tiles
- Grid starts at pixel (20, 8); UI panel below at y=540 (180px tall)

### Turn Structure

1. **Player turn:** All player units may act in any order. Each unit has `hasMoved` and `hasActed` flags — both must be set to end that unit's participation for the turn. A unit can: Move then Act, Act then Move (attack/magic before moving is supported), or Wait.
2. **End Turn button:** Player manually ends the turn (or all units are exhausted).
3. **Enemy turn:** All living enemy units act sequentially (processed via `_enemyQueue`). Each enemy moves and optionally attacks per its AI type.
4. **New player turn begins:** All player units `resetTurn()` (flags cleared, buffs ticked). Each player unit recovers **+2 MP**. Guard buffs from the previous player turn are cleared at the start of the enemy turn.

### Initiative

There is **no initiative or speed-based ordering.** Units act in whichever order the player chooses during the player turn. Enemy units act in the order they appear in `this._enemyQueue` (which is the order they were placed into `this.units`).

> AGI (Agility) is tracked as a stat but is **not currently used** in the turn system or combat formula. It may be intended for a future dodge/double-attack system.

### Combat Formula

```
rawDmg   = max(1, attacker.atk − (defender.def + guardBonus + terrainDef))
variance = random(0, floor(attacker.atk × 0.15))
dmg      = max(1, floor(rawDmg × skillPower) + variance)
```

- `terrainDef`: from `TERRAIN[tileId].def` (Forest=1, Mountain=2, Castle=2, Wall=3, Oasis=1, others=0)
- `guardBonus`: `floor(defender.def × 0.5)` if Guard is active on the defender
- `skillPower`: multiplier from the skill used (1.0 for normal attack)

**Counter-attack:** After the attacker hits, the defender can retaliate if:
- The attacker is within the defender's weapon range (`dist <= defender.range`)
- The defender is on the enemy team
- The skill used does not have `noCounter: true` (only `shoot` has this flag)

Counter-attack formula:
```
cRaw = max(1, defender.atk − (attacker.def + terrainDef_of_attacker_tile))
cVar = random(0, floor(defender.atk × 0.1))
cDmg = cRaw + cVar
```

**EXP from attacking:** `10 + floor(dmg / 2)` to attacker.
**EXP from countering:** `floor(cDmg / 3)` to defender.
**EXP from healing:** flat 15 to the healer.

### Level Up

- Max level before promotion: **10**. Max level after promotion: **20**.
- `100 EXP` per level.
- On level-up: HP gains `growth.hp + (0 or 1 random)`, ATK/DEF/AGI increase by growth values.
- Every 4 levels: MOV increases by 1 (capped at 9).
- Skills unlock at defined level milestones.

### Promotion

- Requires: `level >= 10`, `promoted === false`, item with `promote: true` ("Power Stone") in inventory.
- On promotion: name/class/emoji update; bonus stats applied; level resets to 1, EXP resets to 0; new level-cap becomes 20.
- Promoted Lv-1 skills unlock immediately.

### Status Effects

**Guard (`guardActive`):**
- Activated by the `guard` skill (costs 2 MP or 0 if the skill has no mpCost set — currently `guard` in SKILLS has `mpCost: 2`).
- Effect: `floor(unit.def × 0.5)` added to effective DEF when defender is attacked.
- Duration: cleared at the start of the enemy turn (i.e., lasts until the next enemy phase begins).
- UI: shield icon shown in status area if `unit.guardActive`.

**Burn (`burnDamage`):**
- Applied by `fireball` skill: `defender.burnDamage += 3`.
- Triggers at start of enemy turn: deals `burnDamage` damage to the burning unit, then `burnDamage` is reset to 0.
- Applies to any unit (player or enemy).
- UI notes: UIScene checks `unit.burnStacks` for display, but `BattleScene` sets `unit.burnDamage`. The property name mismatch means the burn status icon in the panel **may not render correctly** (see Section 11).

### MP System

- Each hero has a `maxMp` (ranges: 6 for Bulldog_Tank to 14 for Poodle_Mage).
- Skills with `mpCost` deduct MP when used. If `unit.mp < mpCost`, the skill is blocked with "Not enough MP!" message.
- Recovery: **+2 MP per player turn** at the start of each player phase.
- Units start each battle at full MP.

### Movement

- Flood-fill using terrain `movCost` values (Grass/Road=1, Forest/Sand/Snow=2, Mountain=3, Water/Wall=99).
- Friendly units can be passed through but not stopped on.
- Enemy units block movement.
- Special movement overrides: OTTER_ALLY can cross Water/Bridge (cost 2), FOX_SCOUT treats Sand as cost 1.

---

## 6. Skills System

All skills defined in `Config.js → SKILLS`. Each hero has one or more skills; the action menu's "Skill" button always fires `unit.skills[0]` (the first skill). This means multi-skill heroes can only use their first skill through the standard UI — later skills are **display only** unless the UI is extended.

| Skill ID | Name | Type | Power | Range | Min Range | MP Cost | Special Flags |
|---|---|---|---|---|---|---|---|
| `slash` | Slash | physical | 0.8× (×2 hits) | 1 | — | 0 | `hits: 2` — fires two separate combat rolls |
| `shoot` | Shoot | physical | 1.0× | 3 | 2 | 0 | `noCounter: true` — target cannot retaliate; min range 2 means cannot hit adjacent |
| `dash` | Dash | physical | 1.1× | 2 | — | 0 | `dive: true` — attacker repositions adjacent to defender after hit |
| `charge` | Charge | physical | 1.6× | 2 | — | 3 | `knockback: 1` — pushes defender 1 tile away in direction of attack |
| `guard` | Guard | buff | — | — | — | 2 | `defBonus: 0.5` — raises own DEF 50% until next enemy turn |
| `heal` | Heal | magic | −1.2× (healing) | 2 | — | 3 | `targetAlly: true` — heals one ally in range; heal = `floor(atk × 1.2) + random(2,6)` |
| `fireball` | Fireball | magic | 1.3× | 2 | — | 4 | `splash: 0.6` (60% damage to adjacent enemies), `burn: 3` (3 burn DoT next turn) |
| `healall` | Heal All | magic | −0.7× (healing) | 3 | — | 6 | `aoe: true, targetAlly: true` — heals ALL allies within 3 tiles; heal = `floor(atk × 0.7)` each |

### Skill Acquisition Summary by Hero

| Hero | Starts With | Unlocks at Lv5 | Promotes With | Unlocks Post-Promote Lv1 |
|---|---|---|---|---|
| Puppy Knight | charge | slash | (becomes Paladin) | guard |
| Corgi Healer | heal | guard | (becomes Cleric) | healall (at Lv10 promoted) |
| Lab Scout | dash | slash | (becomes Hero) | charge |
| Beagle Archer | shoot | guard | (becomes Ranger) | fireball |
| Poodle Mage | fireball | guard | (becomes Wizard) | heal |
| Bulldog Tank | guard | slash | (becomes General) | charge |
| Husky Rider | charge | dash | (becomes Champion) | slash |
| Terrier Thief | shoot | dash | (becomes Ninja) | slash |

---

## 7. Chapter Map

All chapters use the same **12-row × 10-column grid**. All chapters have objective type `defeat_boss`.

### Chapter 1 — Barkville Siege
| Field | Value |
|---|---|
| Subtitle | "Defend the village from the cat invaders!" |
| bgColor | 0x1a2a10 (dark green) |
| Boss | ALLEY_CAT (lv 3) |
| Terrain features | Village tiles (center), Forest (flanks), Road corridors |
| Player start | 6 units, bottom rows (rows 10–11) |
| Enemies | 6 Scout Cats (lv 1) spread across top, Alley Cat boss at top-center |
| Recruitable | None |
| Intro speakers | Puppy Knight, Corgi Healer, Alley Cat |

### Chapter 2 — Howling Woods
| Field | Value |
|---|---|
| Subtitle | "Ambush in the forest! Find the archer!" |
| bgColor | 0x0d1a08 (very dark green) |
| Boss | LYNX_RANGER (lv 4) |
| Terrain features | Heavy Forest coverage, Road corridors forming a + shape |
| Player start | 6 units, bottom |
| Enemies | 4 Scout Cats (lv 2), 2 Siamese Assassins (lv 2), 1 Persian Sorcerer (lv 2), Lynx Ranger boss |
| Recruitable | BEAGLE_ARCHER at (col 2, row 6) |
| Intro speakers | Lab Scout, Siamese Assassin, Puppy Knight |

### Chapter 3 — Peak Paws
| Field | Value |
|---|---|
| Subtitle | "Scale the mountain to reach the pass!" |
| bgColor | 0x1a1a2a (dark blue-gray) |
| Boss | SNOW_LEOPARD (lv 5) |
| Terrain features | Mountain dominant, Snow at summit, Road path winding up center |
| Player start | 6 units, bottom |
| Enemies | 2 Tiger Generals (lv 3), 4 Scout Cats (lv 3), 2 Persian Sorcerers (lv 3), Snow Leopard boss |
| Recruitable | BULLDOG_TANK at (col 1, row 6) |
| Intro speakers | Puppy Knight, Bulldog Tank, Snow Leopard |

### Chapter 4 — River Fetch
| Field | Value |
|---|---|
| Subtitle | "Cross the river to reach the far shore!" |
| bgColor | 0x0a1a2a (dark navy) |
| Boss | RIVER_PANTHER (lv 5) |
| Terrain features | Wide Water band (rows 4–5) split by two Bridges; Forest flanks north and south |
| Player start | 6 units, bottom |
| Enemies | 2 Scout Cats (lv 4), 2 Siamese Assassins (lv 4), 2 Tiger Generals (lv 4), 1 Persian Sorcerer (lv 4), River Panther boss on a Bridge |
| Recruitable | OTTER_ALLY at (col 3, row 4) — on the water |
| Intro speakers | Lab Scout, Otto Otter, River Panther |

### Chapter 5 — Desert Scratch
| Field | Value |
|---|---|
| Subtitle | "Navigate the desert sands! Watch out for traps!" |
| bgColor | 0x2a1a00 (dark ochre) |
| Boss | SAND_CAT_KING (lv 6) |
| Terrain features | Sand everywhere, 4 Oases, central Road corridor |
| Player start | 6 units, bottom |
| Enemies | 4 Scout Cats (lv 5), 2 Siamese Assassins (lv 5), 2 Persian Sorcerers (lv 5), 1 Tiger General (lv 5), Sand Cat King boss |
| Recruitable | FOX_SCOUT at (col 1, row 6) |
| Intro speakers | Puppy Knight, Foxy Scout, Sand Cat King |

### Chapter 6 — Meow Fortress
| Field | Value |
|---|---|
| Subtitle | "Storm the fortress and dethrone the Persian Queen!" |
| bgColor | 0x0a0a1a (near black) |
| Boss | PERSIAN_QUEEN (lv 7) |
| Terrain features | Wall exterior, Castle interior rooms, Road corridors; dense indoors layout |
| Player start | 6 units, bottom — NOTE: playerStart lists BEAGLE_ARCHER twice and no TERRIER_THIEF or POODLE_MAGE (likely a copy-paste error) |
| Enemies | 2 Tiger Generals (lv 6), 2 Siamese Assassins (lv 6), 2 Persian Sorcerers (lv 6), 2 Scout Cats (lv 6), Persian Queen boss |
| Recruitable | None |
| Intro speakers | Puppy Knight, Terrier Thief, Persian Queen |

### Chapter 7 — Ultimate Woof (Final)
| Field | Value |
|---|---|
| Subtitle | "The final battle! Defeat the Cat Emperor!" |
| bgColor | 0x1a0a2a (dark purple) |
| Boss | CAT_EMPEROR (lv 10) |
| Terrain features | Castle (main floor), Mountain flanks, Water with Bridges (row 5), Forest (rows 6–7), Sand bottom edges — most varied chapter |
| Player start | **8 units** (largest deployment) |
| Enemies | 4 Tiger Generals (lv 8), 4 Siamese Assassins (lv 8), 2 Persian Sorcerers (lv 8), Cat Emperor boss at top-center |
| Recruitable | None |
| Intro speakers | Puppy Knight, Otto Otter, Cat Emperor |

---

## 8. Scenes

### TitleScene
Animated title screen. Features: gradient background, 60 twinkling stars, crescent moon, landscape silhouette with house/tree silhouettes, bouncing hero emoji row. Buttons: **New Game** (always visible), **Continue** (only if save exists), **Erase Data**. A small debug button labeled "Preview Cutscene" is also rendered but not intended for players. Version line: "v1.0 · 7 Chapters · Dogs vs Cats".

### BattleScene
The core scene (~1400 lines). Responsibilities:
- Loads chapter from `CHAPTERS` array; deserializes hero roster from save data
- Renders 12×10 grid with terrain color + procedural detail icons (trees, mountains, water ripples, village rooftops, etc.)
- Manages 5 highlight graphics layers (move=blue, attack=red, heal=green, selected=yellow, cursor=white)
- Runs a state machine: `IDLE → UNIT_SEL → UNIT_MOVED → TARGET_ATK/TARGET_HEAL → ANIMATING → ENEMY_TURN → DIALOGUE → VICTORY/DEFEAT`
- Handles unit sprite creation (SVG images or emoji fallback), HP bars, class badges, idle bob animations, paw-print movement trail particles
- Executes combat (hit animation, flash, float text, counter-attack, post-effects)
- Runs enemy AI turn sequentially with 150–200ms delays between enemies
- Checks win/loss conditions after every state change
- Launches UIScene in parallel; communicates back via stored reference

### UIScene
Parallel HUD overlay. Contains:
- **Bottom panel** (y=540 to 720): turn number, phase label, selected unit name/stats/HP/MP bar, skill list, status icons
- **Action menu**: 4 buttons (Attack, Skill, Item, Wait) — Attack/Skill disabled (dimmed + non-interactive) if unit has already acted
- **End Turn button** (top-right of panel)
- **Turn banner**: full-width "Your Turn / Enemy Turn" overlay that fades in/out
- **Dialogue box**: speaker portrait (emoji), speaker name, typewriter text effect, tap-to-advance
- **Chapter title card**: `showChapterTitle()` fades in chapter number, title, subtitle text then fades out after 2.2 seconds
- **Message toast**: short messages (e.g., "No enemies in range!") appear above panel, auto-fade after 2 seconds
- **Skill info popup**: tap the skill text in the panel to open a full-screen overlay listing all of the unit's skills with stats and descriptions

### VictoryScene
Handles three outcomes: `'victory'` (chapter clear), `'defeat'` (all units dead), or `'gameover'` (referenced in code but never actually triggered — `_endBattle()` only passes `'victory'` or `'defeat'`). Victory: confetti particles, chapter title, hero emoji row, level-up summary (up to 5), new recruits list, "Next Chapter" or final victory message. Defeat: rain effect, "DEFEATED..." text, retry/title buttons. Plays chapter victory dialogue before showing stats.

### CutsceneScene
Inter-chapter animated story bridge. Uses a beat timeline system. Beats: `enter` (character slides in from offscreen with emoji portrait, speech bubble, typewriter text), `caption` (chapter title card), `shake` (camera shake), `end` (fade to next chapter). Sources content from `chapter.victory` lines of the current chapter and the villain intro line from the next chapter's `intro`. Includes a **SKIP** button. Cinematic letterbox bars (top and bottom black rectangles) are always shown.

### SaveManager
Not a scene — a utility object. Manages `localStorage` under key `'puppy_force_save_v1'`. See Section 9.

---

## 9. Save System

**Storage:** `localStorage`, key `puppy_force_save_v1`.

**Save schema:**
```json
{
  "currentChapter": 3,
  "completedChapters": [1, 2],
  "roster": [
    {
      "id": "PUPPY_KNIGHT",
      "name": "Puppy Knight",
      "emoji": "🐶",
      "hp": 28,
      "maxHp": 34,
      "atk": 14,
      "def": 12,
      "mov": 5,
      "agi": 7,
      "level": 4,
      "exp": 60,
      "promoted": false,
      "items": ["herb"],
      "skills": ["charge", "slash"],
      "mp": 8,
      "maxMp": 10
    }
  ]
}
```

**What persists:**
- Current chapter pointer
- List of completed chapter IDs
- Full roster: all leveled-up stats, current HP, MP, items, skills, promoted flag, level, EXP

**What does NOT persist:**
- Turn number
- Unit positions (re-placed from `chapter.playerStart` on each load)
- Buffs/burn/guard state (cleared on re-entry)

**Dead units are dropped** from the roster after a battle victory (`units.filter(u => !u.dead && u.team === 'player')`). There is no permadeath mitigation — if a unit dies, they are gone from the save permanently.

**Failure behavior:** On defeat, `_endBattle(false)` does not update the save — the save retains the last good state. On retry, the player replays the chapter with the stats they had when they entered it (since saves are written only on victory).

---

## 10. Asset Pipeline

### Current Visual State

All in-game unit visuals are **procedurally generated SVG portraits** created at runtime in `SpriteSheet.js`. These are NOT raster sprites — they are SVG strings assembled from geometric primitives (ellipses, polygons, paths, lines) and registered as 64×64 Phaser canvas textures asynchronously on load.

**SVG sprites exist for all 21 unit IDs:**

| Category | Units |
|---|---|
| Player heroes | PUPPY_KNIGHT, CORGI_HEALER, LABRADOR_SCOUT, BEAGLE_ARCHER, POODLE_MAGE, BULLDOG_TANK, HUSKY_RIDER, TERRIER_THIEF |
| Promoted forms | DOG_PALADIN (only PUPPY_KNIGHT's promotion has a dedicated sprite; others reuse base SVG) |
| Allies | OTTER_ALLY, FOX_SCOUT |
| Enemies | SCOUT_CAT, ALLEY_CAT, SIAMESE_ASSASSIN, PERSIAN_SORCERER, TIGER_GENERAL, LYNX_RANGER, SNOW_LEOPARD, RIVER_PANTHER, SAND_CAT_KING, PERSIAN_QUEEN, CAT_EMPEROR |

Dog sprites use a `dogFaceSVG()` helper with rounded ears; cat sprites use a `catFaceSVG()` helper with pointed triangular ears and slit pupils. Each unit gets unique colors, accessories (helmets, crowns, masks, bandanas, eye scars), and the bosses get elaborate crowns and aura effects.

Terrain is rendered as colored rectangles with `_drawTerrainDetail()` procedural icons (tree circles for Forest, triangles for Mountain, ellipses for Water waves, etc.).

### AI Horde Generation Scripts (not yet run)

Four Node.js scripts exist in `/home/user/TowerDefense/scripts/` that would generate raster art via the AI Horde API (`https://aihorde.net`) given an API key in `AIHORDE_API_KEY` env var:

| Script | Output | Count |
|---|---|---|
| `generate-terrain.js` | 12 terrain tile types × 4 variants each = 48 images → `assets/terrain/` | 48 |
| `generate-characters.js` | 9 hero portraits → `assets/characters/` | 9 |
| `generate-enemies.js` | 11 enemy types × 4 variants each → `assets/enemies/` | 44 |
| `generate-backgrounds.js` | Battle backgrounds for each chapter → `assets/backgrounds/` | ~7 |

Style targets: Fire Emblem / Shining Force 16-bit pixel art for terrain/enemies; anime jRPG bust portraits (Fire Emblem aesthetic) for heroes. These scripts are ready but require an active internet connection and a valid AI Horde API key.

### Planned (Not Integrated)

- Kenney UI asset packs (mentioned in comments / PLAN.md intent) — not yet wired up
- Audio: no sound system exists anywhere in the codebase

---

## 11. Known Issues / Limitations

1. **TERRIER_THIEF missing from roster and chapters:** Defined in `HERO_DEFS` and appears in Chapter 6's intro dialogue ("Leave the doors to me"), but is NOT in `SaveManager._buildDefaultRoster()` and has no `recruitable` entry in any chapter. Players never actually get this unit.

2. **Chapter 6 playerStart bug:** `playerStart` for Meow Fortress lists `BEAGLE_ARCHER` at two different positions (col 3 and col 7) and has no TERRIER_THIEF slot. Both are likely copy-paste errors from an earlier chapter.

3. **Burn status display mismatch:** `UIScene.showUnitInfo()` checks `unit.burnStacks` for the burn icon, but `BattleScene._applyPostCombatEffects()` sets `unit.burnDamage`. The property names differ, so the fire icon in the HUD panel will never render (it always reads `undefined`).

4. **Only first skill usable via menu:** `onActionMagic()` always uses `unit.skills[0]`. Multi-skill heroes (any that gained a second skill via level-up) cannot access their secondary skill through gameplay. The skill info popup shows all skills but there's no selector.

5. **AGI stat is unused in combat:** All heroes and enemies have AGI but it plays no role in turn order, dodge chance, double attacks, or any formula. It appears to be a placeholder for future mechanics.

6. **No chapter select screen:** TitleScene's "Continue" loads directly to `data.currentChapter`. There is no way to replay earlier chapters or skip to a later chapter through normal UI (only the debug "Preview Cutscene" button exists for developer testing).

7. **Promoted sprites missing for 7 of 8 heroes:** `getSpriteKey()` only has a special case for PUPPY_KNIGHT → DOG_PALADIN. All other promoted units continue to use their base SVG sprite. Promoted class names and emojis update correctly but the portrait stays the same.

8. **Defeat does not trigger VictoryScene with `'gameover'` result:** The code path `result: 'gameover'` exists in `VictoryScene.init()` but `BattleScene._endBattle()` only ever passes `'victory'` or `'defeat'`. The gameover branch is dead code.

9. **Terrain passability check in knockback uses wrong property:** `_applyPostCombatEffects()` checks `TERRAIN[...].passable !== false` for knockback destination, but the TERRAIN array has no `passable` property — it uses `movCost`. This means the `passable` check always passes (undefined !== false), so knockback can push units into Wall or Water tiles.

10. **No audio whatsoever:** No sound effects, no music. There is no audio manager or Phaser audio preloading anywhere.

11. **`_makeSmallDebugBtn` ("Preview Cutscene") visible to players:** The debug button is rendered on the TitleScene at `y = H - 58` and is accessible to all users. It should be hidden or removed before a public release.

12. **MP recovery is flat:** All heroes recover exactly 2 MP per turn regardless of their max MP pool. A Poodle Mage (maxMp 14) and a Bulldog Tank (maxMp 6) both recover the same amount, meaning the mage's larger pool is a relative disadvantage.

---

## 12. Potential Next Steps (for ideation)

The following are concrete areas where a design partner could help brainstorm, refine, or spec out improvements:

### New Content

1. **Additional hero classes:** The game has Knights, Healers, Warriors, Archers, Mages, Cavalry, and Thieves, but is missing common TRPG archetypes like a Bard/support unit, a Monk/martial artist, a Siege unit (limited mobility, high range), or an Engineer. What would a "Dachshund Digger" (earthworks/terrain manipulation) look like?

2. **Chapter 8 and beyond / post-game content:** The story ends cleanly at Chapter 7. Is there a post-game dungeon? A "New Game+" mode where enemies scale higher? A side-story featuring the cats from their own perspective?

3. **More enemy variety:** There are only 5 enemy types that appear as regular troops (Scout Cat, Siamese Assassin, Persian Sorcerer, Tiger General, and boss-only variants). New mid-tier enemies could add tactical variety — a cat cavalry that moves 7 tiles, a cat archer with counter-immune shots, or a cat medic that heals adjacent enemies.

4. **More skills per hero and a skill selection UI:** The infrastructure for multiple skills exists but the action menu only fires `skills[0]`. Designing a skill selector (radial menu? scrollable list?) and adding 2–4 skills per hero would dramatically increase tactical depth.

### Mechanics

5. **AGI / speed system:** AGI is tracked but unused. Options: (a) double-attack if attacker's AGI exceeds defender's AGI by a threshold (Fire Emblem style), (b) initiative-based turn order within the player phase, (c) dodge chance. Each has very different feel.

6. **Pair-up / support system:** Adjacent friendly units could grant bonuses (extra hit chance, shared DEF). Pairs of units with narrative bonds (Puppy Knight + Corgi Healer, Husky Rider + Terrier Thief) could get unique bonuses.

7. **Terrain interaction abilities:** Currently terrain is purely passive defense/movement cost. Active terrain use (archers gaining +range from high ground, mages channeling Water tiles for power boosts, forest units getting stealth) would reward map awareness.

8. **Weapon triangle:** Sword > Axe > Lance > Sword (standard Fire Emblem). Adding +ATK/+HIT bonuses/penalties based on weapon matchups would make unit composition more strategic.

9. **Objective diversity:** All 7 chapters are `defeat_boss`. Alternative objectives: Survive X turns, Escort a VIP, Seize a tile, Rout all enemies, Protect a structure (village HP). These would reuse existing systems with small additions.

### Narrative & Presentation

10. **Story beats and character arcs:** Currently dialogue is minimal (3 lines per chapter intro, 2 lines per victory). Expanding with mid-battle events (a unit's old rival appears, a betrayal, a sacrifice moment) would add emotional weight without requiring new mechanics.

11. **A reformed-cat ally:** Narrative irony — a cat who defects to Puppy Force. Could use a cat sprite/catFaceSVG with `team: 'player'` and special abilities (can pass through Wall tiles, extended vision range).

12. **Chapter select and replay:** Adding a chapter select screen on the title (showing stars earned, objectives completed) would extend replayability and let players grind earlier chapters to level heroes.

### Technical / Quality of Life

13. **Proper save slots / autosave confirmation:** Currently one save slot, no autosave prompt, silent overwrite. Multiple save slots, manual save in camp/between chapters, or at least a save confirmation dialog would prevent accidental data loss.

14. **Audio integration:** No sounds exist. Even basic feedback — a "clang" on hit, a chime on level-up, chapter-specific ambient music loops — would dramatically improve feel. Phaser 3's WebAudio system is already available.

15. **Map generation / procedural chapters:** The framework (terrain IDs, grid array, enemy spawn defs) is clean enough that a procedural map generator could create random skirmish maps for infinite replayability, or a "dungeon mode" with random floor layouts.
