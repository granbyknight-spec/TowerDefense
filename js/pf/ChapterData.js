'use strict';
// =============================================================================
// Puppy Force — ChapterData.js
// All 7 chapter maps, enemy placements, story dialogue, objectives
// Maps are GROWS x GCOLS arrays (row-major): mapGrid[row][col]
// Terrain IDs: 0=GRASS 1=FOREST 2=MOUNTAIN 3=WATER 4=ROAD 5=SAND
//              6=CASTLE 7=VILLAGE 8=SNOW 9=BRIDGE 10=WALL 11=OASIS
// Grid size: 32 rows x 26 cols
// =============================================================================

const CHAPTERS = [

  // ===========================================================================
  // Chapter 1: Barkville Siege — Defend the village. Boss: Alley Cat
  // Village cluster at rows 3-5 cols 5-7; wall barriers flank it
  // Forest on east and west flanks; road corridors through center
  // ===========================================================================
  {
    id: 1,
    title: 'Barkville Siege',
    subtitle: 'Defend the village from the cat invaders!',
    objective: 'defeat_boss',
    bossId: 'ALLEY_CAT',
    bgColor: 0x1a2a10,

    intro: [
      { speaker: 'Puppy Knight', portrait: '🐶', text: "Cats are attacking Barkville! We must defend our home!" },
      { speaker: 'Corgi Healer', portrait: '🐕', text: "I'll keep everyone healed. Don't let them reach the village!" },
      { speaker: 'Alley Cat',   portrait: '🐈', text: "Surrender, dogs! Barkville belongs to the Cat Empire now!" },
    ],
    victory: [
      { speaker: 'Puppy Knight', portrait: '🐶', text: "The village is safe! But this is only the beginning..." },
      { speaker: 'Lab Scout',    portrait: '🦮', text: "Reports say they've retreated to the Howling Woods." },
    ],

    // 32 rows x 26 cols (doubled from 16x13)
    // Terrain: village (7) center top; walls (10) flanking village; forests (1) on east/west flanks
    // Road (4) corridors running north-south through center toward village
    // Image-accurate zones (derived from chapter_1_bg.png):
    // DEFAULT grass; forest top corners; cross-road (H: rows 8-9, V: cols 10-11);
    // wall barrier rows 11-12 with left gate (cols 7-8) and center road gap (cols 10-11)
    mapGrid: [
      // col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
      /* r0  */ [ 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
      /* r1  */ [ 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
      /* r2  */ [ 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
      /* r3  */ [ 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
      /* r4  */ [ 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
      /* r5  */ [ 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
      /* r6  */ [ 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
      /* r7  */ [ 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
      /* r8  */ [ 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      /* r9  */ [ 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      /* r10 */ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      /* r11 */ [10,10,10,10,10,10,10, 4, 4,10, 4, 4,10,10,10,10,10,10,10,10,10,10,10,10,10,10],
      /* r12 */ [10,10,10,10,10,10,10, 4, 4,10, 4, 4,10,10,10,10,10,10,10,10,10,10,10,10,10,10],
      /* r13 */ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      /* r14 */ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      /* r15 */ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      /* r16 */ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      /* r17 */ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      /* r18 */ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      /* r19 */ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      /* r20 */ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      /* r21 */ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      /* r22 */ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      /* r23 */ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      /* r24 */ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      /* r25 */ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      /* r26 */ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      /* r27 */ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      /* r28 */ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      /* r29 */ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      /* r30 */ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      /* r31 */ [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],

    playerStart: [
      { unitId:'PUPPY_KNIGHT',   col:10, row:22 },
      { unitId:'CORGI_HEALER',   col:12, row:22 },
      { unitId:'LABRADOR_SCOUT', col:8,  row:20 },
      { unitId:'POODLE_MAGE',    col:14, row:20 },
      { unitId:'HUSKY_RIDER',    col:6,  row:22 },
      { unitId:'BEAGLE_ARCHER',  col:16, row:22 },
    ],

    enemies: [
      { defId:'SCOUT_CAT',  col:2,  row:0,  level:1 },
      { defId:'SCOUT_CAT',  col:22, row:0,  level:1 },
      { defId:'SCOUT_CAT',  col:6,  row:2,  level:1 },
      { defId:'SCOUT_CAT',  col:18, row:2,  level:1 },
      { defId:'SCOUT_CAT',  col:0,  row:4,  level:1 },
      { defId:'SCOUT_CAT',  col:24, row:4,  level:1 },
      { defId:'ALLEY_CAT',  col:10, row:0,  level:3 },
    ],

    recruitable: [],
  },

  // ===========================================================================
  // Chapter 2: Howling Woods — Ambush path. Recruit Beagle Archer. Boss: Lynx
  // Dense forest; wide river at rows 7-8; bridges only at col 3 and col 9
  // ===========================================================================
  {
    id: 2,
    title: 'Howling Woods',
    subtitle: 'Ambush in the forest! Find the archer!',
    objective: 'defeat_boss',
    bossId: 'LYNX_RANGER',
    bgColor: 0x0d1a08,

    intro: [
      { speaker: 'Lab Scout',        portrait: '🦮', text: "Something's wrong. This forest is too quiet..." },
      { speaker: 'Siamese Assassin', portrait: '🐈', text: "NOW! Attack from all sides!" },
      { speaker: 'Puppy Knight',     portrait: '🐶', text: "Ambush! Stay together, don't let them surround us!" },
    ],
    victory: [
      { speaker: 'Beagle Archer', portrait: '🐩', text: "You saved me! I'll join your force. My arrows will serve Barkville!" },
      { speaker: 'Puppy Knight',  portrait: '🐶', text: "Welcome, Beagle! We head for Peak Paws next." },
    ],

    // Improved Ch2: Howling Woods
    // Dense forest north bank with clearings; river rows 14-17 with bridges at cols 6-7 and 18-19
    // South bank: forest flanks + villages + road chokepoint funneling to bridges
    // Villages at (r12,c10) and (r20,c8); wall ambush barricades at edges; mountain outcrop NE corner
    mapGrid: [
      // col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  2,  2,  2,  2 ], // row 0
      [  1,  1,  1,  1,  1,  1,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  2,  2,  2,  2 ], // row 1
      [  1,  1,  1,  1,  1,  1,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  1,  1,  1,  1,  2,  2 ], // row 2
      [ 10, 10,  1,  1,  1,  1,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  1,  1,  1,  1,  1,  1 ], // row 3
      [ 10, 10,  1,  1,  0,  0,  4,  4,  0,  0,  1,  1,  1,  1,  1,  1,  0,  0,  4,  4,  0,  0,  1,  1,  1,  1 ], // row 4
      [  1,  1,  1,  1,  0,  0,  4,  4,  0,  0,  1,  1,  1,  1,  1,  1,  0,  0,  4,  4,  0,  0,  1,  1,  1,  1 ], // row 5
      [  1,  1,  1,  1,  1,  1,  4,  4,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  4,  4,  1,  1,  1,  1,  1,  1 ], // row 6
      [  1,  1,  1,  1,  1,  1,  4,  4,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  4,  4,  1,  1,  1,  1,  1,  1 ], // row 7
      [  2,  2,  1,  1,  1,  1,  4,  4,  1,  1,  4,  4,  4,  4,  4,  4,  1,  1,  4,  4,  1,  1,  2,  2,  1,  1 ], // row 8
      [  2,  2,  1,  1,  1,  1,  4,  4,  1,  1,  4,  4,  4,  4,  4,  4,  1,  1,  4,  4,  1,  1,  2,  2,  1,  1 ], // row 9
      [  1,  1,  1,  1,  1,  1,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  1,  1,  1,  1,  1,  1 ], // row 10
      [  1,  1,  1,  1,  1,  1,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  1,  1,  1,  1,  1,  1 ], // row 11
      [  1,  1,  1,  1,  1,  1,  4,  4,  1,  1,  7,  7,  1,  1,  1,  1,  1,  1,  4,  4,  1,  1,  1,  1,  1,  1 ], // row 12 - village at c10
      [  1,  1,  1,  1,  1,  1,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  1,  1,  1,  1,  1,  1 ], // row 13
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 14 - RIVER + bridges
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 15
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 16
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 17
      [  1,  1,  1,  1,  4,  4,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  4,  4,  1,  1,  1,  1,  0,  0 ], // row 18 - south bank
      [  1,  1,  1,  1,  4,  4,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  4,  4,  1,  1,  1,  1,  0,  0 ], // row 19
      [  0,  0,  1,  1,  4,  4,  7,  7,  4,  4,  4,  4,  4,  4,  4,  4,  7,  7,  4,  4,  1,  1,  0,  0,  0,  0 ], // row 20 - villages c6,c16
      [  0,  0,  1,  1,  4,  4,  0,  0,  4,  4,  4,  4,  4,  4,  4,  4,  0,  0,  4,  4,  1,  1,  0,  0,  0,  0 ], // row 21
      [  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0 ], // row 22
      [  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0 ], // row 23
      [  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  0,  0 ], // row 24
      [  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  0,  0 ], // row 25
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 26
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 27
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 28
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 29
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 30
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 31 - player start
    ],

    playerStart: [
      { unitId:'PUPPY_KNIGHT',   col:10, row:22 },
      { unitId:'CORGI_HEALER',   col:12, row:22 },
      { unitId:'LABRADOR_SCOUT', col:8,  row:20 },
      { unitId:'POODLE_MAGE',    col:14, row:20 },
      { unitId:'HUSKY_RIDER',    col:6,  row:22 },
      // Beagle Archer is captured — wait near bridge for rescue
    ],

    enemies: [
      { defId:'SCOUT_CAT',        col:2,  row:0,  level:2 },
      { defId:'SCOUT_CAT',        col:22, row:0,  level:2 },
      { defId:'SIAMESE_ASSASSIN', col:0,  row:6,  level:1 },
      { defId:'SIAMESE_ASSASSIN', col:24, row:6,  level:1 },
      { defId:'PERSIAN_SORCERER', col:10, row:2,  level:2 },
      { defId:'LYNX_RANGER',      col:12, row:0,  level:3 },
    ],

    recruitable: [
      { unitId:'BEAGLE_ARCHER', col:6, row:14, rescueMsg:'Beagle Archer joins your force!' },
    ],
  },

  // ===========================================================================
  // Chapter 3: Peak Paws — Mountain climb. Recruit Bulldog Tank. Boss: Snow Leopard
  // Mountains block cols 0-2 and cols 10-12; snow in upper half
  // Narrow road pass through center cols 5-7; grass deployment area at bottom
  // ===========================================================================
  {
    id: 3,
    title: 'Peak Paws',
    subtitle: 'Scale the mountain to reach the pass!',
    objective: 'defeat_boss',
    bossId: 'SNOW_LEOPARD',
    bgColor: 0x1a1a2a,

    intro: [
      { speaker: 'Puppy Knight', portrait: '🐶',    text: "The mountain pass is the only way through. We climb!" },
      { speaker: 'Bulldog Tank', portrait: '🐕‍🦺', text: "Wait—I know this mountain. I used to guard it. I'll help you." },
      { speaker: 'Snow Leopard', portrait: '🐆',    text: "Foolish dogs. This peak belongs to the Cat Empire. You'll fall here!" },
    ],
    victory: [
      { speaker: 'Bulldog Tank',  portrait: '🐕‍🦺', text: "The pass is ours! My shield will serve your cause, commander." },
      { speaker: 'Beagle Archer', portrait: '🐩',   text: "With Tank guarding our flank, we're unstoppable!" },
    ],

    // Improved Ch3: Peak Paws
    // Deep mountain walls flanking entire map; snow upper half; narrow SINGLE-TILE-WIDE pass at cols 10-11
    // Mountain ridges create S-curve chokepoint through rows 4-13; villages at base camps (r16,c8) & (r16,c14)
    // Foothills with scattered snow + grass mid; wide grass deployment zone rows 22-31 with forest cover patches
    mapGrid: [
      // col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  8,  8,  8,  8,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2 ], // row 0
      [  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  8,  8,  8,  8,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2 ], // row 1
      [  2,  2,  2,  2,  2,  2,  2,  2,  8,  8,  4,  4,  8,  8,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2 ], // row 2
      [  2,  2,  2,  2,  2,  2,  2,  2,  8,  8,  4,  4,  8,  8,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2 ], // row 3
      [  2,  2,  2,  2,  2,  2,  8,  8,  8,  8,  4,  4,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2 ], // row 4 - hard left wall
      [  2,  2,  2,  2,  2,  2,  8,  8,  8,  8,  4,  4,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2 ], // row 5
      [  2,  2,  2,  2,  8,  8,  2,  2,  8,  8,  4,  4,  8,  8,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2 ], // row 6
      [  2,  2,  2,  2,  8,  8,  2,  2,  8,  8,  4,  4,  8,  8,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2 ], // row 7
      [  2,  2,  2,  2,  2,  2,  2,  2,  4,  4,  4,  4,  4,  4,  8,  8,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2 ], // row 8 - pass widens briefly
      [  2,  2,  2,  2,  2,  2,  2,  2,  4,  4,  4,  4,  4,  4,  8,  8,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2 ], // row 9
      [  2,  2,  2,  2,  8,  8,  4,  4,  4,  4,  8,  8,  8,  8,  4,  4,  4,  4,  8,  8,  2,  2,  2,  2,  2,  2 ], // row 10
      [  2,  2,  2,  2,  8,  8,  4,  4,  4,  4,  8,  8,  8,  8,  4,  4,  4,  4,  8,  8,  2,  2,  2,  2,  2,  2 ], // row 11
      [  0,  0,  2,  2,  2,  2,  4,  4,  8,  8,  8,  8,  8,  8,  8,  8,  4,  4,  2,  2,  2,  2,  0,  0,  0,  0 ], // row 12
      [  0,  0,  2,  2,  2,  2,  4,  4,  8,  8,  8,  8,  8,  8,  8,  8,  4,  4,  2,  2,  2,  2,  0,  0,  0,  0 ], // row 13
      [  0,  0,  0,  0,  2,  2,  4,  4,  8,  8,  8,  8,  8,  8,  8,  8,  4,  4,  2,  2,  0,  0,  0,  0,  0,  0 ], // row 14
      [  0,  0,  0,  0,  2,  2,  4,  4,  8,  8,  8,  8,  8,  8,  8,  8,  4,  4,  2,  2,  0,  0,  0,  0,  0,  0 ], // row 15
      [  0,  0,  0,  0,  2,  2,  4,  4,  7,  7,  0,  0,  0,  0,  7,  7,  4,  4,  2,  2,  0,  0,  0,  0,  0,  0 ], // row 16 - base camp villages
      [  0,  0,  0,  0,  2,  2,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  2,  2,  0,  0,  0,  0,  0,  0 ], // row 17
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 18
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  8,  8,  8,  8,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 19 - snow remnant
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 20
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 21
      [  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1 ], // row 22 - forest flanks deployment
      [  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1 ], // row 23
      [  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  1,  1 ], // row 24
      [  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  1,  1 ], // row 25
      [  0,  0,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  0,  0,  0,  0 ], // row 26
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 27
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 28
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 29
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 30
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 31 - player start
    ],

    playerStart: [
      { unitId:'PUPPY_KNIGHT',   col:10, row:22 },
      { unitId:'CORGI_HEALER',   col:12, row:22 },
      { unitId:'BEAGLE_ARCHER',  col:8,  row:22 },
      { unitId:'LABRADOR_SCOUT', col:14, row:22 },
      { unitId:'POODLE_MAGE',    col:10, row:20 },
      { unitId:'HUSKY_RIDER',    col:12, row:20 },
    ],

    enemies: [
      { defId:'TIGER_GENERAL',    col:10, row:16, level:3 },
      { defId:'TIGER_GENERAL',    col:12, row:16, level:3 },
      { defId:'SCOUT_CAT',        col:8,  row:12, level:3 },
      { defId:'SCOUT_CAT',        col:14, row:12, level:3 },
      { defId:'SCOUT_CAT',        col:6,  row:8,  level:3 },
      { defId:'SCOUT_CAT',        col:16, row:8,  level:3 },
      { defId:'PERSIAN_SORCERER', col:8,  row:4,  level:3 },
      { defId:'PERSIAN_SORCERER', col:14, row:4,  level:3 },
      { defId:'SNOW_LEOPARD',     col:10, row:0,  level:5 },
    ],

    recruitable: [
      { unitId:'BULLDOG_TANK', col:4, row:14, rescueMsg:'Bulldog Tank joins the force!' },
    ],
  },

  // ===========================================================================
  // Chapter 4: River Fetch — Water crossing. Otter ally. Boss: River Panther
  // Large water spans rows 5-8 full width; two narrow bridge crossings
  // Forest clusters on north bank; open grass on south bank (player side)
  // ===========================================================================
  {
    id: 4,
    title: 'River Fetch',
    subtitle: 'Cross the river to reach the far shore!',
    objective: 'defeat_boss',
    bossId: 'RIVER_PANTHER',
    bgColor: 0x0a1a2a,

    intro: [
      { speaker: 'Lab Scout',     portrait: '🦮', text: "The river's too wide to swim. We need those bridges!" },
      { speaker: 'Otto Otter',    portrait: '🦦', text: "I can cross the water! Let me join your force!" },
      { speaker: 'River Panther', portrait: '🐆', text: "The bridges are mine! And I swim faster than any dog!" },
    ],
    victory: [
      { speaker: 'Otto Otter',   portrait: '🦦', text: "The river crossing is ours! I know all the waterways ahead." },
      { speaker: 'Puppy Knight', portrait: '🐶', text: "Great work, Otto! The Desert lies ahead..." },
    ],

    // Improved Ch4: River Fetch
    // North bank: deep forest with mountain flanks; villages at (r2,c3) and (r5,c21)
    // River rows 10-15: full-width water, bridges at cols 6-7 and 18-19
    // Bridge approach forced through forest/road chokepoints — cannot flank wide
    // South bank: forest clusters (archer cover); road funnels to bridge approaches
    // Villages at (r18,c3) and (r18,c21) mark landing-zone towns
    mapGrid: [
      // col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
      [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  1,  1,  1,  1,  2,  2 ], // row 0
      [  1,  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  1,  1,  2,  2 ], // row 1
      [  1,  1,  1,  7,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  1,  1 ], // row 2 - north village c3
      [  1,  1,  1,  1,  1,  1,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  1,  1,  1,  1,  1,  1 ], // row 3
      [  1,  1,  0,  0,  1,  1,  4,  4,  0,  0,  1,  1,  1,  1,  1,  1,  0,  0,  4,  4,  0,  0,  1,  1,  1,  1 ], // row 4
      [  2,  2,  0,  0,  0,  0,  4,  4,  0,  0,  1,  1,  1,  1,  1,  1,  0,  0,  4,  4,  0,  7,  0,  0,  2,  2 ], // row 5 - mountain flanks + village c21
      [  2,  2,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  2,  2 ], // row 6
      [  2,  2,  1,  1,  0,  0,  4,  4,  1,  1,  0,  0,  0,  0,  0,  0,  1,  1,  4,  4,  0,  0,  1,  1,  2,  2 ], // row 7
      [  1,  1,  1,  1,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  1,  1,  1,  1 ], // row 8
      [  0,  0,  1,  1,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  1,  1,  0,  0,  0,  0 ], // row 9
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 10 - RIVER
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 11
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 12
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 13
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 14
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 15 - RIVER end
      [  1,  1,  1,  1,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  1,  1,  1,  1 ], // row 16 - south bank
      [  1,  1,  1,  1,  0,  0,  4,  4,  1,  1,  0,  0,  0,  0,  0,  0,  1,  1,  4,  4,  0,  0,  1,  1,  1,  1 ], // row 17
      [  0,  0,  7,  7,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  7,  7,  0,  0,  0,  0 ], // row 18 - landing villages
      [  0,  0,  0,  0,  1,  1,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  1,  1,  0,  0,  0,  0 ], // row 19
      [  0,  0,  0,  0,  1,  1,  4,  4,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  4,  4,  1,  1,  0,  0,  0,  0 ], // row 20
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0 ], // row 21
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 22
      [  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1 ], // row 23
      [  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1 ], // row 24
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 25
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 26
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 27
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 28
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 29
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 30
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 31 - player start
    ],

    playerStart: [
      { unitId:'PUPPY_KNIGHT',   col:10, row:22 },
      { unitId:'CORGI_HEALER',   col:12, row:22 },
      { unitId:'BEAGLE_ARCHER',  col:8,  row:22 },
      { unitId:'BULLDOG_TANK',   col:14, row:22 },
      { unitId:'LABRADOR_SCOUT', col:10, row:20 },
      { unitId:'POODLE_MAGE',    col:12, row:20 },
    ],

    enemies: [
      { defId:'SCOUT_CAT',        col:4,  row:0,  level:4 },
      { defId:'SCOUT_CAT',        col:20, row:0,  level:4 },
      { defId:'SIAMESE_ASSASSIN', col:8,  row:2,  level:4 },
      { defId:'SIAMESE_ASSASSIN', col:16, row:2,  level:4 },
      { defId:'TIGER_GENERAL',    col:2,  row:0,  level:4 },
      { defId:'TIGER_GENERAL',    col:22, row:0,  level:4 },
      { defId:'PERSIAN_SORCERER', col:10, row:0,  level:4 },
      { defId:'RIVER_PANTHER',    col:10, row:0,  level:5 },
    ],

    recruitable: [
      { unitId:'OTTER_ALLY', col:6, row:10, rescueMsg:'Otto Otter joins your force!' },
    ],
  },

  // ===========================================================================
  // Chapter 5: Desert Scratch — Sand + oases. Fox Scout. Boss: Sand Cat King
  // Sand (5) covers 70%+; oases at 5 spots; road corridor through center
  // No water — different tactical challenge (sand slows movement)
  // ===========================================================================
  {
    id: 5,
    title: 'Desert Scratch',
    subtitle: 'Navigate the desert sands! Watch out for traps!',
    objective: 'defeat_boss',
    bossId: 'SAND_CAT_KING',
    bgColor: 0x2a1a00,

    intro: [
      { speaker: 'Puppy Knight',  portrait: '🐶', text: "The desert heat is brutal. Stay hydrated at the oases!" },
      { speaker: 'Foxy Scout',    portrait: '🦊', text: "I know this desert! Let me guide you through the sand traps!" },
      { speaker: 'Sand Cat King', portrait: '🐅', text: "The sands will swallow you, dogs! This is MY kingdom!" },
    ],
    victory: [
      { speaker: 'Foxy Scout',   portrait: '🦊', text: "We did it! I know a shortcut to the Meow Fortress." },
      { speaker: 'Corgi Healer', portrait: '🐕', text: "Rest at the oasis. The fortress battle will be our toughest yet." },
    ],

    // Improved Ch5: Desert Scratch
    // Rocky outcroppings (MOUNTAIN) break up sand monotony; wall ruins scattered mid-map
    // Road widens to 4 tiles across open sections; oases expanded to 2x4 pools
    // Three oasis clusters on flanks for cover; ruins create tactical chokepoints cols 4-5 and 20-21
    // Sand is ~55% of tiles; road 15%; mountain/wall/oasis ~30%
    mapGrid: [
      // col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
      [  5,  5,  5,  5,  2,  2,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  2,  2,  5,  5,  5,  5 ], // row 0 - rocky peaks
      [  5,  5,  5,  5,  2,  2,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  2,  2,  5,  5,  5,  5 ], // row 1
      [  5,  5, 11, 11, 11,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5, 11, 11, 11,  5,  5,  5,  5 ], // row 2 - wide oasis NW+NE
      [  5,  5, 11, 11, 11,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5, 11, 11, 11,  5,  5,  5,  5 ], // row 3
      [  5,  5, 11, 11,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5, 11, 11,  5,  5,  5,  5,  5 ], // row 4
      [  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 5
      [  5,  5,  5,  5,  5,  5,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 6 - wide road begins
      [  5,  5,  5,  5,  5,  5,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 7
      [  5,  5,  5,  5, 10, 10,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  4,  4, 10, 10,  5,  5,  5,  5,  5,  5 ], // row 8 - ruin walls
      [  5,  5,  5,  5, 10, 10,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  4,  4, 10, 10,  5,  5,  5,  5,  5,  5 ], // row 9
      [  5,  5,  2,  2,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  2,  2,  5,  5,  5,  5 ], // row 10 - rocky outcrops
      [  5,  5,  2,  2,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  2,  2,  5,  5,  5,  5 ], // row 11
      [  5, 11, 11, 11,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5, 11, 11, 11,  5,  5,  5 ], // row 12 - mid oases
      [  5, 11, 11, 11,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5, 11, 11, 11,  5,  5,  5 ], // row 13
      [  5,  5,  5,  5,  5,  5,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 14 - road widens
      [  5,  5,  5,  5,  5,  5,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 15
      [ 10, 10,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5, 10, 10,  5,  5 ], // row 16 - flanking ruins
      [ 10, 10,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5, 10, 10,  5,  5 ], // row 17
      [  5,  5,  5,  5,  2,  2,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  2,  2,  5,  5,  5,  5,  5,  5 ], // row 18 - rock blocks
      [  5,  5,  5,  5,  2,  2,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  2,  2,  5,  5,  5,  5,  5,  5 ], // row 19
      [  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 20
      [  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 21
      [  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 22
      [  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 23
      [  5,  5,  5,  5,  5,  5,  4,  4, 11, 11, 11, 11, 11, 11,  4,  4,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 24 - large central oasis
      [  5,  5,  5,  5,  5,  5,  4,  4, 11, 11, 11, 11, 11, 11,  4,  4,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 25
      [  5,  5,  5,  5,  5,  5,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 26 - road junction
      [  5,  5,  5,  5,  5,  5,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 27
      [  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 28
      [  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 29
      [  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 30
      [  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 31 - player start
    ],

    playerStart: [
      { unitId:'PUPPY_KNIGHT',   col:10, row:22 },
      { unitId:'CORGI_HEALER',   col:12, row:22 },
      { unitId:'BEAGLE_ARCHER',  col:8,  row:22 },
      { unitId:'BULLDOG_TANK',   col:14, row:22 },
      { unitId:'LABRADOR_SCOUT', col:10, row:20 },
      { unitId:'HUSKY_RIDER',    col:12, row:20 },
    ],

    enemies: [
      { defId:'SCOUT_CAT',        col:0,  row:0,  level:5 },
      { defId:'SCOUT_CAT',        col:24, row:0,  level:5 },
      { defId:'SCOUT_CAT',        col:4,  row:4,  level:5 },
      { defId:'SCOUT_CAT',        col:20, row:4,  level:5 },
      { defId:'SIAMESE_ASSASSIN', col:6,  row:6,  level:5 },
      { defId:'SIAMESE_ASSASSIN', col:16, row:6,  level:5 },
      { defId:'PERSIAN_SORCERER', col:6,  row:2,  level:5 },
      { defId:'PERSIAN_SORCERER', col:18, row:2,  level:5 },
      { defId:'TIGER_GENERAL',    col:10, row:8,  level:5 },
      { defId:'SAND_CAT_KING',    col:10, row:0,  level:6 },
    ],

    recruitable: [
      { unitId:'FOX_SCOUT',     col:2,  row:12, rescueMsg:'Foxy Scout joins your force!' },
      { unitId:'TERRIER_THIEF', col:22, row:12, rescueMsg:'Terrier Thief joins your force!' },
    ],
  },

  // ===========================================================================
  // Chapter 6: Meow Fortress — Castle interior. Boss: Persian Queen
  // Wall outer perimeter + interior pillars; castle floor throughout
  // Road corridors connecting chambers; entry from bottom through gate
  // ===========================================================================
  {
    id: 6,
    title: 'Meow Fortress',
    subtitle: 'Storm the fortress and dethrone the Persian Queen!',
    objective: 'defeat_boss',
    bossId: 'PERSIAN_QUEEN',
    bgColor: 0x0a0a1a,

    intro: [
      { speaker: 'Puppy Knight',  portrait: '🐶', text: "The Meow Fortress. This is their stronghold. We must break through!" },
      { speaker: 'Terrier Thief', portrait: '🦊', text: "Leave the doors to me. I'll find a way in." },
      { speaker: 'Persian Queen', portrait: '😺', text: "Impudent mutts! Your bones will decorate my throne room!" },
    ],
    victory: [
      { speaker: 'Puppy Knight',  portrait: '🐶', text: "The fortress falls! But the Emperor himself awaits..." },
      { speaker: 'Persian Queen', portrait: '😺', text: "You... you cannot stop the Emperor. He will destroy you all!" },
    ],

    // Improved Ch6: Meow Fortress
    // Outer wall perimeter; inner courtyard with water pools (WATER) in throne room flanks
    // Three distinct zones: outer courtyard (rows 26-27), main keep (rows 14-25), throne room (rows 2-13)
    // Villages mark barracks rooms; narrow side corridors + wide center road; wall pillars stagger rooms
    // Gate chokepoint at south (rows 28-31) — only 4 tiles wide entrance forces column play
    mapGrid: [
      // col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
      [ 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 ], // row 0 - outer wall
      [ 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 ], // row 1
      [ 10, 10,  6,  6,  6,  6,  3,  3,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  3,  3,  6,  6,  6,  6, 10, 10 ], // row 2 - throne room + water pools
      [ 10, 10,  6,  6,  6,  6,  3,  3,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  3,  3,  6,  6,  6,  6, 10, 10 ], // row 3
      [ 10, 10,  6,  6, 10, 10,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6, 10, 10,  6,  6,  6,  6, 10, 10 ], // row 4
      [ 10, 10,  6,  6, 10, 10,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6, 10, 10,  6,  6,  6,  6, 10, 10 ], // row 5
      [ 10, 10,  4,  4,  4,  4,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  4,  4,  4,  4,  4,  4, 10, 10 ], // row 6 - throne approach corridor
      [ 10, 10,  4,  4,  4,  4,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  4,  4,  4,  4,  4,  4, 10, 10 ], // row 7
      [ 10, 10,  6,  6, 10, 10,  4,  4,  6,  6,  3,  3,  3,  3,  6,  6,  4,  4, 10, 10,  6,  6,  6,  6, 10, 10 ], // row 8 - center pool flanking hall
      [ 10, 10,  6,  6, 10, 10,  4,  4,  6,  6,  3,  3,  3,  3,  6,  6,  4,  4, 10, 10,  6,  6,  6,  6, 10, 10 ], // row 9
      [ 10, 10,  7,  7,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  7,  7,  6,  6, 10, 10 ], // row 10 - barracks villages
      [ 10, 10,  7,  7,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  7,  7,  6,  6, 10, 10 ], // row 11
      [ 10, 10,  4,  4,  4,  4,  4,  4,  4,  4,  6,  6,  6,  6,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4, 10, 10 ], // row 12 - keep entry corridor (split)
      [ 10, 10,  4,  4,  4,  4,  4,  4,  4,  4,  6,  6,  6,  6,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4, 10, 10 ], // row 13
      [ 10, 10,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 14 - main keep rooms
      [ 10, 10,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 15
      [ 10, 10,  6,  6, 10, 10,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4, 10, 10,  6,  6,  6,  6, 10, 10 ], // row 16 - guard pillars
      [ 10, 10,  6,  6, 10, 10,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4, 10, 10,  6,  6,  6,  6, 10, 10 ], // row 17
      [ 10, 10,  4,  4,  4,  4,  4,  4,  6,  6,  3,  3,  3,  3,  6,  6,  4,  4,  4,  4,  4,  4,  4,  4, 10, 10 ], // row 18 - mid water hazard corridor
      [ 10, 10,  4,  4,  4,  4,  4,  4,  6,  6,  3,  3,  3,  3,  6,  6,  4,  4,  4,  4,  4,  4,  4,  4, 10, 10 ], // row 19
      [ 10, 10,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 20 - south keep rooms
      [ 10, 10,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 21
      [ 10, 10,  6,  6, 10, 10,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4, 10, 10,  6,  6,  6,  6, 10, 10 ], // row 22
      [ 10, 10,  6,  6, 10, 10,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4, 10, 10,  6,  6,  6,  6, 10, 10 ], // row 23
      [ 10, 10,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4, 10, 10 ], // row 24 - lower corridor
      [ 10, 10,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4, 10, 10 ], // row 25
      [ 10, 10,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 26 - outer courtyard
      [ 10, 10,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 27
      [ 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,  4,  4,  4,  4, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 ], // row 28 - gate chokepoint
      [ 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,  4,  4,  4,  4, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 ], // row 29
      [ 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,  4,  4,  4,  4, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 ], // row 30
      [ 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,  4,  4,  4,  4, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 ], // row 31 - gate entrance
    ],

    playerStart: [
      { unitId:'PUPPY_KNIGHT',   col:10, row:22 },
      { unitId:'CORGI_HEALER',   col:12, row:22 },
      { unitId:'BEAGLE_ARCHER',  col:10, row:20 },
      { unitId:'BULLDOG_TANK',   col:12, row:20 },
      { unitId:'LABRADOR_SCOUT', col:8,  row:22 },
      { unitId:'TERRIER_THIEF',  col:14, row:22 },
    ],

    enemies: [
      { defId:'TIGER_GENERAL',    col:2,  row:14, level:6 },
      { defId:'TIGER_GENERAL',    col:22, row:14, level:6 },
      { defId:'SIAMESE_ASSASSIN', col:6,  row:12, level:6 },
      { defId:'SIAMESE_ASSASSIN', col:16, row:12, level:6 },
      { defId:'PERSIAN_SORCERER', col:8,  row:8,  level:6 },
      { defId:'PERSIAN_SORCERER', col:14, row:8,  level:6 },
      { defId:'SCOUT_CAT',        col:2,  row:18, level:6 },
      { defId:'SCOUT_CAT',        col:22, row:18, level:6 },
      { defId:'PERSIAN_QUEEN',    col:10, row:2,  level:7 },
    ],

    recruitable: [],
  },

  // ===========================================================================
  // Chapter 7: Ultimate Woof — Final mixed battle. Boss: Cat Emperor
  // Castle platform top (rows 0-3); water moat rows 4-5 with bridges col 3 & 9
  // Mixed grass/forest/mountain in lower half; road corridor through center
  // ===========================================================================
  {
    id: 7,
    title: 'Ultimate Woof',
    subtitle: 'The final battle! Defeat the Cat Emperor!',
    objective: 'defeat_boss',
    bossId: 'CAT_EMPEROR',
    bgColor: 0x1a0a2a,

    intro: [
      { speaker: 'Puppy Knight', portrait: '🐶', text: "This is it. The Cat Emperor's throne room. For Barkville!" },
      { speaker: 'Otto Otter',   portrait: '🦦', text: "We've come so far together. For all animals, free and proud!" },
      { speaker: 'Cat Emperor',  portrait: '👑', text: "You dare challenge ME?! I will end your pitiful rebellion HERE AND NOW!" },
    ],
    victory: [
      { speaker: 'Cat Emperor',  portrait: '👑', text: "Im-possible... defeated by... dogs..." },
      { speaker: 'Puppy Knight', portrait: '🐶', text: "It's over. The Cat Empire is finished. All animals are free!" },
      { speaker: 'All',          portrait: '🐾', text: "PUPPY FORCE FOREVER! WOOF WOOF WOOF!" },
    ],

    // Improved Ch7: Ultimate Woof — Final battle
    // Castle platform rows 0-7: throne dais + flanking wall towers + 2 road corridors
    // Moat rows 8-11: water full width, bridges at cols 6-7 and 18-19 (tight dual-bridge chokepoint)
    // Post-moat rows 12-17: mountain + forest flanks force battle toward road — no easy wide flanking
    // Mid-field rows 18-25: road expands to open grass with forest pockets for archer cover
    // Deployment rows 26-31: open grass with slight forest corners + road artery to center
    mapGrid: [
      // col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
      [ 10, 10,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 0 - throne room + wall towers
      [ 10, 10,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 1
      [ 10, 10,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 2
      [ 10, 10,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 3
      [ 10, 10,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 4
      [ 10, 10,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 5
      [  2,  2,  6,  6,  6,  6,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  6,  6,  6,  6,  6,  6,  2,  2 ], // row 6 - castle plaza meets road
      [  2,  2,  6,  6,  6,  6,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  6,  6,  6,  6,  6,  6,  2,  2 ], // row 7
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 8 - MOAT
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 9
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 10
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 11
      [  2,  2,  2,  2,  0,  0,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  0,  0,  2,  2,  2,  2,  2,  2 ], // row 12 - bridge exits: mountain + forest flanks
      [  2,  2,  2,  2,  0,  0,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  0,  0,  2,  2,  2,  2,  2,  2 ], // row 13
      [  2,  2,  1,  1,  0,  0,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  0,  0,  1,  1,  2,  2,  2,  2 ], // row 14
      [  2,  2,  1,  1,  0,  0,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  0,  0,  1,  1,  2,  2,  2,  2 ], // row 15
      [  0,  0,  1,  1,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  1,  1,  0,  0,  2,  2 ], // row 16 - road opens to grass
      [  0,  0,  1,  1,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  1,  1,  0,  0,  2,  2 ], // row 17
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 18
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 19
      [  1,  1,  1,  1,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  1,  1,  1,  1,  0,  0 ], // row 20 - archer forest flanks
      [  1,  1,  1,  1,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  1,  1,  1,  1,  0,  0 ], // row 21
      [  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  0,  0 ], // row 22 - road spur center
      [  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  0,  0 ], // row 23
      [  0,  0,  1,  1,  1,  1,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  1,  1,  1,  1,  0,  0,  0,  0 ], // row 24
      [  0,  0,  1,  1,  1,  1,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  1,  1,  1,  1,  0,  0,  0,  0 ], // row 25
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 26 - deployment approach
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 27
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 28
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 29
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 30
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 31 - player start
    ],

    playerStart: [
      { unitId:'PUPPY_KNIGHT',   col:10, row:22 },
      { unitId:'CORGI_HEALER',   col:12, row:22 },
      { unitId:'BEAGLE_ARCHER',  col:8,  row:22 },
      { unitId:'BULLDOG_TANK',   col:14, row:22 },
      { unitId:'LABRADOR_SCOUT', col:6,  row:22 },
      { unitId:'POODLE_MAGE',    col:16, row:22 },
      { unitId:'HUSKY_RIDER',    col:8,  row:20 },
      { unitId:'TERRIER_THIEF',  col:14, row:20 },
    ],

    enemies: [
      { defId:'TIGER_GENERAL',    col:6,  row:6,  level:8 },
      { defId:'TIGER_GENERAL',    col:16, row:6,  level:8 },
      { defId:'SIAMESE_ASSASSIN', col:4,  row:8,  level:8 },
      { defId:'SIAMESE_ASSASSIN', col:20, row:8,  level:8 },
      { defId:'PERSIAN_SORCERER', col:6,  row:2,  level:8 },
      { defId:'PERSIAN_SORCERER', col:18, row:2,  level:8 },
      { defId:'SIAMESE_ASSASSIN', col:2,  row:12, level:8 },
      { defId:'SIAMESE_ASSASSIN', col:22, row:12, level:8 },
      { defId:'TIGER_GENERAL',    col:8,  row:6,  level:8 },
      { defId:'TIGER_GENERAL',    col:14, row:6,  level:8 },
      { defId:'CAT_EMPEROR',      col:12, row:0,  level:10 },
    ],

    recruitable: [],
  },
];

// Helper: build a Unit from an enemy spawn definition
function buildEnemyUnit(spawnDef, allUnits) {
  const def = ENEMY_DEFS[spawnDef.defId];
  if (!def) { console.warn('Unknown enemy def:', spawnDef.defId); return null; }

  // Clone the def so we can scale stats by level
  const scaledDef = JSON.parse(JSON.stringify(def));
  const baseLevel  = scaledDef.baseStats.level;
  const levelDiff  = Math.max(0, (spawnDef.level || baseLevel) - baseLevel);
  const g = scaledDef.growth || { hp:2, atk:1, def:1, agi:1 };

  scaledDef.baseStats.level  = spawnDef.level || baseLevel;
  scaledDef.baseStats.maxHp += g.hp  * levelDiff;
  scaledDef.baseStats.atk   += g.atk * levelDiff;
  scaledDef.baseStats.def   += g.def * levelDiff;
  scaledDef.baseStats.agi   += (g.agi || 0) * levelDiff;

  const unit = new Unit(scaledDef, spawnDef.col, spawnDef.row);
  return unit;
}
