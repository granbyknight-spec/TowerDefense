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
    mapGrid: [
      // col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
      [  1,  1,  0,  0,  0,  0,  0,  0,  4,  4,  7,  7,  4,  4,  0,  0,  0,  0,  1,  1,  1,  1,  1,  1,  1,  1 ], // row 0
      [  1,  1,  0,  0,  0,  0,  0,  0,  4,  4,  7,  7,  4,  4,  0,  0,  0,  0,  1,  1,  1,  1,  1,  1,  1,  1 ], // row 1
      [  1,  1,  0,  0,  4,  4,  4,  4,  7,  7,  4,  4,  4,  4,  0,  0,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1 ], // row 2
      [  1,  1,  0,  0,  4,  4,  4,  4,  7,  7,  4,  4,  4,  4,  0,  0,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1 ], // row 3
      [  1,  1,  1,  1,  0,  0,  4,  4, 10, 10,  7,  7, 10, 10,  4,  4,  0,  0,  1,  1,  1,  1,  0,  0,  0,  0 ], // row 4
      [  1,  1,  1,  1,  0,  0,  4,  4, 10, 10,  7,  7, 10, 10,  4,  4,  0,  0,  1,  1,  1,  1,  0,  0,  0,  0 ], // row 5
      [  0,  0,  1,  1,  0,  0,  4,  4,  7,  7,  7,  7,  7,  7,  4,  4,  0,  0,  1,  1,  0,  0,  0,  0,  0,  0 ], // row 6
      [  0,  0,  1,  1,  0,  0,  4,  4,  7,  7,  7,  7,  7,  7,  4,  4,  0,  0,  1,  1,  0,  0,  0,  0,  0,  0 ], // row 7
      [  0,  0,  1,  1, 10, 10,  4,  4,  7,  7,  7,  7,  7,  7,  4,  4, 10, 10,  1,  1,  0,  0,  0,  0,  0,  0 ], // row 8
      [  0,  0,  1,  1, 10, 10,  4,  4,  7,  7,  7,  7,  7,  7,  4,  4, 10, 10,  1,  1,  0,  0,  0,  0,  0,  0 ], // row 9
      [  0,  0,  0,  0, 10, 10,  4,  4,  4,  4,  7,  7,  4,  4,  4,  4, 10, 10,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 10
      [  0,  0,  0,  0, 10, 10,  4,  4,  4,  4,  7,  7,  4,  4,  4,  4, 10, 10,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 11
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 12
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 13
      [  1,  1,  1,  1,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  1,  1,  1,  1,  0,  0,  0,  0 ], // row 14
      [  1,  1,  1,  1,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  1,  1,  1,  1,  0,  0,  0,  0 ], // row 15
      [  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  0,  0,  0,  0 ], // row 16
      [  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  0,  0,  0,  0 ], // row 17
      [  0,  0,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0 ], // row 18
      [  0,  0,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0 ], // row 19
      [  0,  0,  0,  0,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 20
      [  0,  0,  0,  0,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 21
      [  0,  0,  0,  0,  0,  0,  1,  1,  0,  0,  0,  0,  0,  0,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 22
      [  0,  0,  0,  0,  0,  0,  1,  1,  0,  0,  0,  0,  0,  0,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 23
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 24
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 25
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 26
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 27
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 28
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 29
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 30
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 31 - player start
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

    // Dense forest; river spans rows 14-16 full width; bridges at col 6 and col 18 only (doubled from 16x13)
    mapGrid: [
      // col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
      [  1,  1,  1,  1,  1,  1,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1 ], // row 0
      [  1,  1,  1,  1,  1,  1,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1 ], // row 1
      [  1,  1,  1,  1,  4,  4,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  4,  4,  1,  1,  1,  1,  1,  1 ], // row 2
      [  1,  1,  1,  1,  4,  4,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  4,  4,  1,  1,  1,  1,  1,  1 ], // row 3
      [  1,  1,  1,  1,  4,  4,  0,  0,  1,  1,  1,  1,  1,  1,  1,  1,  0,  0,  4,  4,  1,  1,  1,  1,  1,  1 ], // row 4
      [  1,  1,  1,  1,  4,  4,  0,  0,  1,  1,  1,  1,  1,  1,  1,  1,  0,  0,  4,  4,  1,  1,  1,  1,  1,  1 ], // row 5
      [  1,  1,  1,  1,  4,  4,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  4,  4,  1,  1,  1,  1,  1,  1 ], // row 6
      [  1,  1,  1,  1,  4,  4,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  4,  4,  1,  1,  1,  1,  1,  1 ], // row 7
      [ 10, 10,  1,  1,  1,  1,  0,  0,  4,  4,  4,  4,  4,  4,  4,  4,  0,  0,  1,  1,  1,  1, 10, 10,  1,  1 ], // row 8
      [ 10, 10,  1,  1,  1,  1,  0,  0,  4,  4,  4,  4,  4,  4,  4,  4,  0,  0,  1,  1,  1,  1, 10, 10,  1,  1 ], // row 9
      [  1,  1,  1,  1,  1,  1,  4,  4,  1,  1,  4,  4,  4,  4,  1,  1,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1 ], // row 10
      [  1,  1,  1,  1,  1,  1,  4,  4,  1,  1,  4,  4,  4,  4,  1,  1,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1 ], // row 11
      [  1,  1,  1,  1,  4,  4,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  4,  4,  1,  1,  1,  1,  1,  1 ], // row 12
      [  1,  1,  1,  1,  4,  4,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  4,  4,  1,  1,  1,  1,  1,  1 ], // row 13
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 14 - RIVER + bridges
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 15
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 16
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 17
      [  0,  0,  1,  1,  4,  4,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  4,  4,  1,  1,  0,  0,  0,  0 ], // row 18
      [  0,  0,  1,  1,  4,  4,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  4,  4,  1,  1,  0,  0,  0,  0 ], // row 19
      [  0,  0,  0,  0,  4,  4,  0,  0,  4,  4,  4,  4,  4,  4,  4,  4,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0 ], // row 20
      [  0,  0,  0,  0,  4,  4,  0,  0,  4,  4,  4,  4,  4,  4,  4,  4,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0 ], // row 21
      [  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0 ], // row 22
      [  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0 ], // row 23
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 24
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

    // Mountains wall cols 0-4 and cols 20-24; snow tiles upper half; narrow pass center (doubled from 16x13)
    mapGrid: [
      // col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
      [  2,  2,  2,  2,  2,  2,  2,  2,  8,  8,  8,  8,  8,  8,  8,  8,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2 ], // row 0
      [  2,  2,  2,  2,  2,  2,  2,  2,  8,  8,  8,  8,  8,  8,  8,  8,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2 ], // row 1
      [  2,  2,  2,  2,  2,  2,  8,  8,  8,  8,  4,  4,  4,  4,  8,  8,  8,  8,  2,  2,  2,  2,  2,  2,  2,  2 ], // row 2
      [  2,  2,  2,  2,  2,  2,  8,  8,  8,  8,  4,  4,  4,  4,  8,  8,  8,  8,  2,  2,  2,  2,  2,  2,  2,  2 ], // row 3
      [  2,  2,  2,  2,  2,  2,  8,  8,  4,  4,  4,  4,  4,  4,  4,  4,  8,  8,  2,  2,  2,  2,  2,  2,  2,  2 ], // row 4
      [  2,  2,  2,  2,  2,  2,  8,  8,  4,  4,  4,  4,  4,  4,  4,  4,  8,  8,  2,  2,  2,  2,  2,  2,  2,  2 ], // row 5
      [  2,  2,  2,  2,  8,  8,  8,  8,  4,  4,  2,  2,  2,  2,  4,  4,  8,  8,  8,  8,  2,  2,  2,  2,  2,  2 ], // row 6
      [  2,  2,  2,  2,  8,  8,  8,  8,  4,  4,  2,  2,  2,  2,  4,  4,  8,  8,  8,  8,  2,  2,  2,  2,  2,  2 ], // row 7
      [  2,  2,  2,  2,  8,  8,  2,  2,  4,  4,  2,  2,  2,  2,  4,  4,  2,  2,  8,  8,  2,  2,  2,  2,  2,  2 ], // row 8
      [  2,  2,  2,  2,  8,  8,  2,  2,  4,  4,  2,  2,  2,  2,  4,  4,  2,  2,  8,  8,  2,  2,  2,  2,  2,  2 ], // row 9
      [  0,  0,  2,  2,  8,  8,  4,  4,  4,  4,  8,  8,  8,  8,  4,  4,  4,  4,  8,  8,  2,  2,  0,  0,  0,  0 ], // row 10
      [  0,  0,  2,  2,  8,  8,  4,  4,  4,  4,  8,  8,  8,  8,  4,  4,  4,  4,  8,  8,  2,  2,  0,  0,  0,  0 ], // row 11
      [  0,  0,  2,  2,  2,  2,  4,  4,  8,  8,  8,  8,  8,  8,  8,  8,  4,  4,  2,  2,  2,  2,  0,  0,  0,  0 ], // row 12
      [  0,  0,  2,  2,  2,  2,  4,  4,  8,  8,  8,  8,  8,  8,  8,  8,  4,  4,  2,  2,  2,  2,  0,  0,  0,  0 ], // row 13
      [  0,  0,  0,  0,  2,  2,  4,  4,  0,  0,  8,  8,  8,  8,  0,  0,  4,  4,  2,  2,  0,  0,  0,  0,  0,  0 ], // row 14
      [  0,  0,  0,  0,  2,  2,  4,  4,  0,  0,  8,  8,  8,  8,  0,  0,  4,  4,  2,  2,  0,  0,  0,  0,  0,  0 ], // row 15
      [  0,  0,  0,  0,  2,  2,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  2,  2,  0,  0,  0,  0,  0,  0 ], // row 16
      [  0,  0,  0,  0,  2,  2,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  2,  2,  0,  0,  0,  0,  0,  0 ], // row 17
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 18
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 19
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 20
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 21
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 22
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 23
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 24
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 25
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 26
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

    // Water rows 10-16 full width; bridges at col 6 (rows 10-16) and col 18 (rows 10-16) (doubled from 16x13)
    mapGrid: [
      // col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
      [  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  1,  1,  0,  0 ], // row 0
      [  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  1,  1,  0,  0 ], // row 1
      [  1,  1,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  1,  1,  0,  0,  0,  0 ], // row 2
      [  1,  1,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  1,  1,  0,  0,  0,  0 ], // row 3
      [  1,  1,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  1,  1,  1,  1 ], // row 4
      [  1,  1,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  4,  4,  4,  4,  0,  0,  0,  0,  1,  1,  1,  1 ], // row 5
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  1,  1 ], // row 6
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  1,  1 ], // row 7
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 8
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 9
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 10 - RIVER
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 11
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 12
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 13
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 14
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 15 - RIVER (3 wide doubled)
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 16 - south bank
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 17
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 18
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 19
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 20
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 21
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 22
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 23
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 24
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 25
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 26
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

    // Sand dominates; 5 oases provide healing/defense spots; road through center (doubled from 16x13)
    mapGrid: [
      // col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
      [  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 0
      [  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 1
      [  5,  5,  5,  5, 11, 11,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5, 11, 11,  5,  5,  5,  5,  5,  5 ], // row 2 - oasis
      [  5,  5,  5,  5, 11, 11,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5, 11, 11,  5,  5,  5,  5,  5,  5 ], // row 3
      [  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 4
      [  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 5
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  4,  4,  4,  4,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 6 - road begins
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  4,  4,  4,  4,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 7
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 8
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 9
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 10
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 11
      [  5,  5, 11, 11,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5, 11, 11,  5,  5,  5,  5 ], // row 12 - oasis
      [  5,  5, 11, 11,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5, 11, 11,  5,  5,  5,  5 ], // row 13
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  4,  4,  4,  4,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 14
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  4,  4,  4,  4,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 15
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 16
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 17
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 18
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 19
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 20
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 21
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 22
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 23
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4, 11, 11, 11, 11,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 24 - oasis col 10-13
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4, 11, 11, 11, 11,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 25
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  4,  4,  4,  4,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 26
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  4,  4,  4,  4,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 27
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 28
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 29
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 30
      [  5,  5,  5,  5,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  5,  5 ], // row 31 - player start
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

    // Castle exterior walls; interior rooms with corridor chokepoints (doubled from 16x13)
    // Entry gate at bottom center (gap in outer wall rows 28-31)
    mapGrid: [
      // col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
      [ 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 ], // row 0
      [ 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 ], // row 1
      [ 10, 10,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 2
      [ 10, 10,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 3
      [ 10, 10,  6,  6, 10, 10,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6, 10, 10,  6,  6,  6,  6, 10, 10 ], // row 4
      [ 10, 10,  6,  6, 10, 10,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6, 10, 10,  6,  6,  6,  6, 10, 10 ], // row 5
      [ 10, 10,  4,  4,  4,  4,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  4,  4,  4,  4,  4,  4, 10, 10 ], // row 6
      [ 10, 10,  4,  4,  4,  4,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  4,  4,  4,  4,  4,  4, 10, 10 ], // row 7
      [ 10, 10,  6,  6, 10, 10,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4, 10, 10,  6,  6,  6,  6, 10, 10 ], // row 8
      [ 10, 10,  6,  6, 10, 10,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4, 10, 10,  6,  6,  6,  6, 10, 10 ], // row 9
      [ 10, 10,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 10
      [ 10, 10,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 11
      [ 10, 10,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4, 10, 10 ], // row 12 - main corridor
      [ 10, 10,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4, 10, 10 ], // row 13
      [ 10, 10,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 14
      [ 10, 10,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 15
      [ 10, 10,  6,  6, 10, 10,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4, 10, 10,  6,  6,  6,  6, 10, 10 ], // row 16
      [ 10, 10,  6,  6, 10, 10,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4, 10, 10,  6,  6,  6,  6, 10, 10 ], // row 17
      [ 10, 10,  4,  4,  4,  4,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  4,  4,  4,  4,  4,  4, 10, 10 ], // row 18 - corridor
      [ 10, 10,  4,  4,  4,  4,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  4,  4,  4,  4,  4,  4, 10, 10 ], // row 19
      [ 10, 10,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 20
      [ 10, 10,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 21
      [ 10, 10,  6,  6, 10, 10,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4, 10, 10,  6,  6,  6,  6, 10, 10 ], // row 22
      [ 10, 10,  6,  6, 10, 10,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4, 10, 10,  6,  6,  6,  6, 10, 10 ], // row 23
      [ 10, 10,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4, 10, 10 ], // row 24 - lower corridor
      [ 10, 10,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4, 10, 10 ], // row 25
      [ 10, 10,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 26
      [ 10, 10,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6, 10, 10 ], // row 27
      [ 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,  4,  4,  4,  4, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 ], // row 28 - gate
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

    // Castle platform top 8 rows; water moat rows 8-11 with bridges; mixed terrain below (doubled from 16x13)
    mapGrid: [
      // col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
      [  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6 ], // row 0
      [  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6,  6 ], // row 1
      [  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6 ], // row 2
      [  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6 ], // row 3
      [  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6 ], // row 4
      [  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6,  4,  4,  6,  6,  6,  6,  6,  6,  6,  6 ], // row 5
      [  2,  2,  6,  6,  6,  6,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  6,  6,  6,  6,  6,  6,  2,  2 ], // row 6
      [  2,  2,  6,  6,  6,  6,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  6,  6,  6,  6,  6,  6,  2,  2 ], // row 7
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 8 - MOAT
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 9
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 10
      [  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  9,  9,  3,  3,  3,  3,  3,  3 ], // row 11
      [  2,  2,  2,  2,  0,  0,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  0,  0,  2,  2,  2,  2,  2,  2 ], // row 12
      [  2,  2,  2,  2,  0,  0,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  0,  0,  2,  2,  2,  2,  2,  2 ], // row 13
      [  2,  2,  0,  0,  0,  0,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  0,  0,  0,  0,  2,  2,  2,  2 ], // row 14
      [  2,  2,  0,  0,  0,  0,  4,  4,  1,  1,  1,  1,  1,  1,  1,  1,  4,  4,  0,  0,  0,  0,  2,  2,  2,  2 ], // row 15
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  2,  2 ], // row 16
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  2,  2 ], // row 17
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 18
      [  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 19
      [  1,  1,  1,  1,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  1,  1,  1,  1,  0,  0 ], // row 20
      [  1,  1,  1,  1,  0,  0,  4,  4,  0,  0,  0,  0,  0,  0,  0,  0,  4,  4,  0,  0,  1,  1,  1,  1,  0,  0 ], // row 21
      [  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  0,  0 ], // row 22
      [  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  0,  0 ], // row 23
      [  0,  0,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  0,  0,  0,  0 ], // row 24
      [  0,  0,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  0,  0,  0,  0 ], // row 25
      [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ], // row 26
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
