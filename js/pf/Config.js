'use strict';
// MP_REGEN_RATE = 0.10 — change BattleScene.js _beginPlayerTurn
// =============================================================================
// Puppy Force — Config.js
// Game constants, terrain data, and unit definitions
// =============================================================================

const TILE = 36;
const GCOLS = 13;
const GROWS = 16;
const GW = GCOLS * TILE;   // 468
const GH = GROWS * TILE;   // 576
const GAME_W = 480;
const GAME_H = 720;
const GRID_X = (GAME_W - GW) / 2;  // 6
const GRID_Y = 8;
const UI_Y = GRID_Y + GH + 4;      // 588
const UI_H = GAME_H - UI_Y;        // 132

// Terrain IDs
const T = {
  GRASS:0, FOREST:1, MOUNTAIN:2, WATER:3, ROAD:4,
  SAND:5, CASTLE:6, VILLAGE:7, SNOW:8, BRIDGE:9,
  WALL:10, OASIS:11
};

const TERRAIN = [
  { name:'Grass',    color:0x88a828, hi:0xa0c030, movCost:1,  def:0 }, // 0 — GBA olive-yellow-green
  { name:'Forest',   color:0x1a5010, hi:0x286018, movCost:2,  def:1 }, // 1 — dark forest green (tree canopy base)
  { name:'Mountain', color:0x706050, hi:0x908070, movCost:3,  def:2 }, // 2 — grey-brown rock
  { name:'Water',    color:0x2878c0, hi:0x3898d8, movCost:99, def:0 }, // 3 — clear GBA blue (impassable)
  { name:'Road',     color:0xc8a040, hi:0xdcb850, movCost:1,  def:0 }, // 4 — sandy tan path
  { name:'Sand',     color:0xd4b448, hi:0xe8c860, movCost:2,  def:0 }, // 5 — golden desert sand
  { name:'Castle',   color:0x7c8090, hi:0x909aa8, movCost:1,  def:2 }, // 6 — blue-grey stone floor
  { name:'Village',  color:0xb07040, hi:0xc88858, movCost:1,  def:0 }, // 7 — warm terracotta
  { name:'Snow',     color:0xb8d0e0, hi:0xd0e4f0, movCost:2,  def:0 }, // 8 — pale ice blue
  { name:'Bridge',   color:0xa87030, hi:0xbc8840, movCost:1,  def:0 }, // 9 — dark wood brown
  { name:'Wall',     color:0x6878a0, hi:0x909aa8, movCost:99, def:3 }, // 10 — stone grey (3D detail drawn on top)
  { name:'Oasis',    color:0x30884a, hi:0x48a860, movCost:1,  def:1 }, // 11 — oasis green
];

// Palette for nice rendering
const PAL = {
  BG:      0x0a0a1a,
  PANEL:   0x111128,
  BORDER:  0x334466,
  GOLD:    0xf8d030,
  WHITE:   0xffffff,
  HP_G:    0x38c864,
  HP_Y:    0xf8d030,
  HP_R:    0xc83030,
  MOVE_HL: 0x4488ff,
  ATK_HL:  0xff4444,
  SEL_HL:  0xffff44,
  HEAL_HL: 0x44ff88,
  PLAYER_GLOW: 0x4499ff,
  ENEMY_GLOW:  0xff4422,
  TEXT:    0xeeeeff,
  DIM:     0x8899aa,
};

// Class ring colors — used as the colored border around each unit sprite
const CLASS_RING_COLOR = {
  'Knight':   0xf8d030, // gold
  'Paladin':  0xffd700, // bright gold
  'Healer':   0x44ff88, // green
  'Cleric':   0x55ffaa, // light green
  'Warrior':  0xff6644, // orange-red
  'Hero':     0xff4422, // red
  'Mage':     0xcc44ff, // purple
  'Wizard':   0xdd66ff, // light purple
  'Archer':   0xff9944, // orange
  'Ranger':   0xffbb66, // light orange
  'Cavalry':  0x44bbff, // sky blue
  'Champion': 0x66ddff, // light sky blue
  'Thief':    0xaa44cc, // dark purple
  'Ninja':    0xcc66dd, // medium purple
  'General':  0xff2222, // bright red
  'Swimmer':  0x22ccff, // cyan
  'Admiral':  0x44eeff, // light cyan
  'Scout':       0x88cc44, // yellow-green
  'Desert Fox':  0xaadd55, // light yellow-green
  'Fighter':     0xff6644, // orange-red
  'Assassin':    0xcc44ff, // purple
  'King':        0xffd700, // gold
  'Sorceress':   0xff44cc, // magenta
  'Emperor':     0xffd700, // gold
};

// Unicode class icons — shown in the badge below each unit's HP bar
const CLASS_ICON = {
  'Knight':   '⚔', 'Paladin':  '⚔',
  'Healer':   '✚', 'Cleric':   '✚',
  'Warrior':  '⚡', 'Hero':     '⚡',
  'Mage':     '✦', 'Wizard':   '✦',
  'Archer':   '➶', 'Ranger':   '➶',
  'Cavalry':  '♞', 'Champion': '♞',
  'Thief':    '◆', 'Ninja':    '◆',
  'General':  '★',
  'Swimmer':  '≈', 'Admiral':  '≈',
  'Scout':      '⚡', 'Desert Fox': '⚡',
  'Fighter':    '✊',
  'Assassin':   '◆',
  'King':       '♚', 'Emperor':   '♚',
  'Sorceress':  '✦',
};

// Maps dialogue speaker names → Phaser texture cache keys for portrait images
// Keys are loaded by BattleScene (enemy_png_* / player_png_*) and by CutsceneScene.preload()
const SPEAKER_PORTRAIT_KEY = {
  // Enemy bosses
  'Alley Cat':        'enemy_png_ALLEY_CAT',
  'Siamese Assassin': 'enemy_png_SIAMESE_ASSASSIN',
  'Lynx Ranger':      'enemy_png_LYNX_RANGER',
  'Snow Leopard':     'enemy_png_SNOW_LEOPARD',
  'River Panther':    'enemy_png_RIVER_PANTHER',
  'Sand Cat King':    'enemy_png_SAND_CAT_KING',
  'Persian Queen':    'enemy_png_PERSIAN_QUEEN',
  'Cat Emperor':      'enemy_png_CAT_EMPEROR',
  'Tiger General':    'enemy_png_TIGER_GENERAL',
  'Persian Sorcerer': 'enemy_png_PERSIAN_SORCERER',
  'Scout Cat':        'enemy_png_SCOUT_CAT',
  // Player heroes
  'Puppy Knight':  'player_png_PUPPY_KNIGHT',
  'Corgi Healer':  'player_png_CORGI_HEALER',
  'Lab Scout':     'player_png_LABRADOR_SCOUT',
  'Beagle Archer': 'player_png_BEAGLE_ARCHER',
  'Bulldog Tank':  'player_png_BULLDOG_TANK',
  'Poodle Mage':   'player_png_POODLE_MAGE',
  'Husky Rider':   'player_png_HUSKY_RIDER',
  'Terrier Thief': 'player_png_TERRIER_THIEF',
  'Dog Paladin':   'player_png_DOG_PALADIN',
  'Otto Otter':    'player_png_OTTER_ALLY',
};

// =============================================================================
// HERO DEFINITIONS
// =============================================================================
const HERO_DEFS = {

  PUPPY_KNIGHT: {
    id:'PUPPY_KNIGHT', name:'Puppy Knight', emoji:'🐶',
    unitClass:'Knight', team:'player',
    baseStats:{ maxHp:26, atk:12, def:10, mov:5, agi:6, level:1, exp:0 },
    growth:{ hp:4, atk:2, def:2, agi:1 },
    weapon:'sword', range:1, skills:['charge'],
    items:['herb'],
    promotedData:{ name:'Dog Paladin', emoji:'🦮', unitClass:'Paladin',
      bonus:{ hp:8, atk:4, def:4, mov:1, agi:1 } },
    maxMp: 10,
    skillsAtLevel: [{ level: 5, skill: 'slash' }],
    promotedSkillsAtLevel: [{ level: 1, skill: 'guard' }],
    expReward:30, chapter:1,
  },

  CORGI_HEALER: {
    id:'CORGI_HEALER', name:'Corgi Healer', emoji:'🐕',
    unitClass:'Healer', team:'player',
    baseStats:{ maxHp:16, atk:4, def:4, mov:5, agi:8, level:1, exp:0 },
    growth:{ hp:2, atk:1, def:1, agi:2 },
    weapon:'staff', range:1, skills:['heal'],
    items:['herb'],
    promotedData:{ name:'Corgi Cleric', emoji:'🐕', unitClass:'Cleric',
      bonus:{ hp:6, atk:2, def:3, mov:1, agi:2 } },
    maxMp: 12,
    skillsAtLevel: [{ level: 5, skill: 'guard' }],
    promotedSkillsAtLevel: [{ level: 10, skill: 'healall' }],
    expReward:30, chapter:1,
  },

  LABRADOR_SCOUT: {
    id:'LABRADOR_SCOUT', name:'Lab Warrior', emoji:'🦮',
    unitClass:'Warrior', team:'player',
    baseStats:{ maxHp:20, atk:11, def:7, mov:6, agi:9, level:1, exp:0 },
    growth:{ hp:3, atk:2, def:2, agi:1 },
    weapon:'sword', range:1, skills:['dash'],
    items:[],
    promotedData:{ name:'Lab Hero', emoji:'🦮', unitClass:'Hero',
      bonus:{ hp:8, atk:4, def:3, mov:1, agi:2 } },
    maxMp: 8,
    skillsAtLevel: [{ level: 5, skill: 'slash' }],
    promotedSkillsAtLevel: [{ level: 1, skill: 'charge' }],
    expReward:30, chapter:1,
  },

  BEAGLE_ARCHER: {
    id:'BEAGLE_ARCHER', name:'Beagle Archer', emoji:'🐩',
    unitClass:'Archer', team:'player',
    baseStats:{ maxHp:18, atk:13, def:5, mov:5, agi:9, level:2, exp:0 },
    growth:{ hp:2, atk:3, def:1, agi:2 },
    weapon:'bow', range:2, skills:['shoot'],
    items:[],
    promotedData:{ name:'Beagle Ranger', emoji:'🐩', unitClass:'Ranger',
      bonus:{ hp:6, atk:4, def:2, mov:1, agi:2 } },
    maxMp: 8,
    skillsAtLevel: [{ level: 5, skill: 'guard' }],
    promotedSkillsAtLevel: [{ level: 1, skill: 'fireball' }],
    expReward:35, chapter:2,
  },

  POODLE_MAGE: {
    id:'POODLE_MAGE', name:'Poodle Mage', emoji:'🐾',
    unitClass:'Mage', team:'player',
    baseStats:{ maxHp:14, atk:11, def:3, mov:5, agi:8, level:1, exp:0 },
    growth:{ hp:2, atk:3, def:1, agi:2 },
    weapon:'wand', range:2, skills:['blaze'],
    items:['herb'],
    promotedData:{ name:'Poodle Wizard', emoji:'🐾', unitClass:'Wizard',
      bonus:{ hp:5, atk:5, def:2, mov:1, agi:2 } },
    maxMp: 14,
    skillsAtLevel: [{ level: 5, skill: 'fireball' }, { level: 8, skill: 'guard' }],
    promotedSkillsAtLevel: [{ level: 1, skill: 'heal' }],
    expReward:35, chapter:1,
  },

  BULLDOG_TANK: {
    id:'BULLDOG_TANK', name:'Bulldog Tank', emoji:'🐕‍🦺',
    unitClass:'Knight', team:'player',
    baseStats:{ maxHp:36, atk:10, def:15, mov:4, agi:4, level:3, exp:0 },
    growth:{ hp:6, atk:2, def:3, agi:1 },
    weapon:'axe', range:1, skills:['guard'],
    items:['bread'],
    promotedData:{ name:'Bulldog General', emoji:'🐕‍🦺', unitClass:'General',
      bonus:{ hp:10, atk:3, def:5, mov:0, agi:1 } },
    maxMp: 6,
    skillsAtLevel: [{ level: 5, skill: 'slash' }],
    promotedSkillsAtLevel: [{ level: 1, skill: 'charge' }],
    expReward:40, chapter:3,
  },

  HUSKY_RIDER: {
    id:'HUSKY_RIDER', name:'Husky Rider', emoji:'🐺',
    unitClass:'Cavalry', team:'player',
    baseStats:{ maxHp:22, atk:14, def:8, mov:8, agi:7, level:1, exp:0 },
    growth:{ hp:3, atk:3, def:2, agi:1 },
    weapon:'lance', range:1, skills:['charge'],
    items:[],
    promotedData:{ name:'Husky Champion', emoji:'🐺', unitClass:'Champion',
      bonus:{ hp:8, atk:4, def:3, mov:1, agi:2 } },
    maxMp: 8,
    skillsAtLevel: [{ level: 5, skill: 'dash' }],
    promotedSkillsAtLevel: [{ level: 1, skill: 'slash' }],
    expReward:35, chapter:1,
  },

  TERRIER_THIEF: {
    id:'TERRIER_THIEF', name:'Terrier Thief', emoji:'🦊',
    unitClass:'Thief', team:'player',
    baseStats:{ maxHp:16, atk:11, def:5, mov:6, agi:12, level:1, exp:0 },
    growth:{ hp:2, atk:2, def:1, agi:3 },
    weapon:'dagger', range:1, skills:['shoot'],
    items:[],
    promotedData:{ name:'Terrier Ninja', emoji:'🦊', unitClass:'Ninja',
      bonus:{ hp:5, atk:3, def:2, mov:1, agi:3 } },
    maxMp: 10,
    skillsAtLevel: [{ level: 5, skill: 'dash' }],
    promotedSkillsAtLevel: [{ level: 1, skill: 'slash' }],
    expReward:35, chapter:1,
  },
};

// Recruitable ally units
const ALLY_DEFS = {
  OTTER_ALLY: {
    id:'OTTER_ALLY', name:'Otto Otter', emoji:'🦦',
    unitClass:'Swimmer', team:'player',
    baseStats:{ maxHp:20, atk:11, def:7, mov:6, agi:9, level:4, exp:0 },
    growth:{ hp:3, atk:2, def:1, agi:2 },
    weapon:'spear', range:1, skills:['dash'],
    items:[],
    specialMovement:['Water','Bridge'],
    promotedData:{ name:'Otter Admiral', emoji:'🦦', unitClass:'Admiral',
      bonus:{ hp:6, atk:3, def:2, mov:1, agi:2 } },
    maxMp: 8,
    skillsAtLevel: [{ level: 5, skill: 'slash' }],
    promotedSkillsAtLevel: [{ level: 1, skill: 'charge' }],
    expReward:40, chapter:4,
  },
  FOX_SCOUT: {
    id:'FOX_SCOUT', name:'Foxy Scout', emoji:'🦊',
    unitClass:'Scout', team:'player',
    baseStats:{ maxHp:17, atk:10, def:6, mov:7, agi:11, level:5, exp:0 },
    growth:{ hp:2, atk:2, def:1, agi:3 },
    weapon:'bow', range:2, skills:['shoot'],
    items:[],
    specialMovement:['Sand'],
    promotedData:{ name:'Desert Fox', emoji:'🦊', unitClass:'Desert Fox',
      bonus:{ hp:5, atk:3, def:2, mov:1, agi:3 } },
    maxMp: 8,
    skillsAtLevel: [{ level: 5, skill: 'guard' }],
    promotedSkillsAtLevel: [{ level: 1, skill: 'fireball' }],
    expReward:40, chapter:5,
  },
};

// =============================================================================
// ENEMY DEFINITIONS
// =============================================================================
const ENEMY_DEFS = {

  SCOUT_CAT: {
    id:'SCOUT_CAT', name:'Scout Cat', emoji:'🐱',
    unitClass:'Scout', team:'enemy',
    baseStats:{ maxHp:14, atk:8, def:4, mov:6, agi:9, level:1 },
    growth:{ hp:1, atk:1, def:1, agi:1 },
    weapon:'dagger', range:1, ai:'aggressive', expReward:38,  // grunt
  },
  ALLEY_CAT: {
    id:'ALLEY_CAT', name:'Alley Cat', emoji:'🐈', isBoss:true,
    tileSize: 2,
    unitClass:'Fighter', team:'enemy',
    baseStats:{ maxHp:30, atk:14, def:8, mov:5, agi:7, level:3 },
    growth:{ hp:2, atk:2, def:1, agi:1 },
    weapon:'claw', range:1, ai:'boss', expReward:95, // chapter boss
  },
  SIAMESE_ASSASSIN: {
    id:'SIAMESE_ASSASSIN', name:'Siamese', emoji:'🐈',
    unitClass:'Assassin', team:'enemy',
    baseStats:{ maxHp:16, atk:14, def:6, mov:6, agi:13, level:2 },
    growth:{ hp:1, atk:2, def:1, agi:2 },
    weapon:'blade', range:1, ai:'flanker', expReward:52,
  },
  PERSIAN_SORCERER: {
    id:'PERSIAN_SORCERER', name:'Persian Sorc', emoji:'😸',
    unitClass:'Mage', team:'enemy',
    baseStats:{ maxHp:14, atk:16, def:4, mov:4, agi:7, level:2 },
    growth:{ hp:1, atk:2, def:0, agi:1 },
    weapon:'wand', range:2, ai:'ranged', expReward:52,
  },
  TIGER_GENERAL: {
    id:'TIGER_GENERAL', name:'Tiger General', emoji:'🐯',
    unitClass:'General', team:'enemy',
    baseStats:{ maxHp:28, atk:13, def:12, mov:4, agi:5, level:3 },
    growth:{ hp:2, atk:1, def:2, agi:0 },
    weapon:'spear', range:1, ai:'defensive', expReward:70,
  },
  LYNX_RANGER: {
    id:'LYNX_RANGER', name:'Lynx Ranger', emoji:'🦁', isBoss:true,
    tileSize: 2,
    unitClass:'Ranger', team:'enemy',
    baseStats:{ maxHp:28, atk:15, def:7, mov:5, agi:10, level:4 },
    growth:{ hp:2, atk:2, def:1, agi:1 },
    weapon:'bow', range:2, ai:'boss', expReward:70, // sub-boss
  },
  SNOW_LEOPARD: {
    id:'SNOW_LEOPARD', name:'Snow Leopard', emoji:'🐆', isBoss:true,
    tileSize: 2,
    unitClass:'Knight', team:'enemy',
    baseStats:{ maxHp:34, atk:16, def:11, mov:5, agi:8, level:5 },
    growth:{ hp:3, atk:2, def:2, agi:1 },
    weapon:'sword', range:1, ai:'boss', expReward:70,
  },
  RIVER_PANTHER: {
    id:'RIVER_PANTHER', name:'River Panther', emoji:'🐆', isBoss:true,
    tileSize: 2,
    unitClass:'Swimmer', team:'enemy',
    baseStats:{ maxHp:36, atk:17, def:10, mov:6, agi:9, level:5 },
    growth:{ hp:3, atk:2, def:1, agi:1 },
    weapon:'claws', range:1, ai:'boss', expReward:70,
    specialMovement:['Water'],
  },
  SAND_CAT_KING: {
    id:'SAND_CAT_KING', name:'Sand Cat King', emoji:'🐅', isBoss:true,
    tileSize: 2,
    unitClass:'King', team:'enemy',
    baseStats:{ maxHp:40, atk:18, def:12, mov:6, agi:10, level:6 },
    growth:{ hp:3, atk:2, def:2, agi:1 },
    weapon:'blade', range:1, ai:'boss', expReward:70,
  },
  PERSIAN_QUEEN: {
    id:'PERSIAN_QUEEN', name:'Persian Queen', emoji:'😺', isBoss:true,
    tileSize: 2,
    unitClass:'Sorceress', team:'enemy',
    baseStats:{ maxHp:42, atk:22, def:10, mov:5, agi:11, level:7 },
    growth:{ hp:3, atk:3, def:1, agi:1 },
    weapon:'staff', range:2, ai:'boss', expReward:70,
  },
  HEALER_CAT: {
    id: 'HEALER_CAT', name: 'Healer Cat', emoji: '😸',
    unitClass: 'Cleric', team: 'enemy',
    baseStats: { maxHp: 20, atk: 4, def: 3, mov: 4, agi: 4, level: 1 },
    growth: { hp: 2, atk: 1, def: 1, agi: 1 },
    weapon: 'staff', range: 2, ai: 'healer', expReward: 45,
  },
  CAT_EMPEROR: {
    id:'CAT_EMPEROR', name:'Cat Emperor', emoji:'👑', isBoss:true,
    tileSize: 2,
    unitClass:'Emperor', team:'enemy',
    baseStats:{ maxHp:62, atk:25, def:18, mov:5, agi:12, level:10 },
    growth:{ hp:4, atk:3, def:2, agi:1 },
    weapon:'mageblade', range:2, ai:'boss', expReward:95, // chapter boss
  },
};

// Items
const ITEMS = {
  herb:  { name:'Herb',  emoji:'🌿', heal:12, description:'Restores 12 HP' },
  bread: { name:'Bread', emoji:'🍞', heal:20, description:'Restores 20 HP' },
  tonic: { name:'Tonic', emoji:'🧪', heal:8,  description:'Restores 8 HP'  },
  stone: { name:'Power Stone', emoji:'💎', promote:true, description:'Promotes unit to advanced class' },
};

// Skills
const SKILLS = {
  slash:    { name:'Slash',    type:'physical', power:0.8, range:1, hits:2,        description:'Strike twice for 80% ATK each hit (two separate rolls)' },
  shoot:    { name:'Shoot',    type:'physical', power:1.0, range:3, minRange:2, noCounter:true, description:'Long-range shot 2-3 tiles away — target cannot retaliate' },
  dash:     { name:'Dash',     type:'physical', power:1.1, range:2, dive:true,      description:'Leap to strike an enemy 2 tiles away, then reposition adjacent' },
  charge:   { name:'Charge',   type:'physical', power:1.6, range:2, knockback:1, mpCost:3, description:'Powerful charge that pushes target 1 tile away (180% ATK)' },
  guard:    { name:'Guard',    type:'buff',      mpCost:2, defBonus:0.5,             description:'Raise DEF by 50% until next turn' },
  heal:     { name:'Heal',     type:'magic',     power:-1.2, range:2, mpCost:3, targetAlly:true, description:'Restore ally HP within 2 tiles (120% ATK)' },
  blaze:    { name:'Blaze',    type:'magic',     power:0.85, range:1, mpCost:2, description:'Weak fire attack. No splash.' },
  fireball: { name:'Fireball', type:'magic',     power:1.3, range:2, mpCost:4, splash:0.6, burn:3, description:'Fire blast: full damage + splash to adjacent enemies + 3 burn DoT' },
  healall:  { name:'Heal All',  type:'magic', power:-0.7, range:3, mpCost:6, aoe:true, targetAlly:true, description:'Restore HP to all allies within 3 tiles (70% ATK)' },
};
