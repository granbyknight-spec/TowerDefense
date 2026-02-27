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
    objective: 'survive_turns',
    surviveTurns: 5,
    bossId: 'ALLEY_CAT',
    bgColor: 0x1a2a10,

    intro: [
      { speaker: 'Puppy Knight', portrait: '🐶', text: "The bells — they're ringing! Cats are pouring through the north gate. Everyone, to your positions!" },
      { speaker: 'Husky Rider',  portrait: '🐶', text: "Ha! At least it's not another drill. I was getting bored." },
      { speaker: 'Corgi Healer', portrait: '🐕', text: "This isn't a joke, Husky. Look at how many there are. Stay close to me, all of you." },
      { speaker: 'Puppy Knight', portrait: '🐶', text: "We hold the village square. Nobody gets past us — not today, not ever!" },
      { speaker: 'Alley Cat',    portrait: '🐈', text: "Surrender, dogs! Barkville belongs to the Cat Empire now! Lay down your weapons and your lives will be spared!" },
      { speaker: 'Puppy Knight', portrait: '🐶', text: "Barkville has stood for a hundred years. It'll stand a hundred more. CHARGE!" },
    ],
    victory: [
      { speaker: 'Puppy Knight', portrait: '🐶', text: "They're falling back! Hold the line — make sure every last one is gone." },
      { speaker: 'Corgi Healer', portrait: '🐕', text: "Easy, easy... let me see that wound. You're going to be fine. You're all going to be fine." },
      { speaker: 'Lab Scout',    portrait: '🦮', text: "They didn't just retreat — they fell back in formation. Raiders don't do that. Someone was giving orders." },
      { speaker: 'Puppy Knight', portrait: '🐶', text: "Then we follow them. If there's a commander behind this, we find them before they regroup. Move out — we head for the Howling Woods." },
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
      { unitId:'PUPPY_KNIGHT',   col:10, row:16 },
      { unitId:'CORGI_HEALER',   col:12, row:16 },
      { unitId:'LABRADOR_SCOUT', col:8,  row:14 },
      { unitId:'POODLE_MAGE',    col:14, row:14 },
      { unitId:'HUSKY_RIDER',    col:6,  row:16 },
      { unitId:'BEAGLE_ARCHER',  col:16, row:16 },
    ],

    enemies: [
      { defId:'SCOUT_CAT',  col:2,  row:0,  level:1 },
      { defId:'SCOUT_CAT',  col:22, row:0,  level:1 },
      { defId:'SCOUT_CAT',  col:6,  row:2,  level:1 },
      { defId:'SCOUT_CAT',  col:18, row:2,  level:1 },
      { defId:'SCOUT_CAT',  col:0,  row:4,  level:1 },
      { defId:'SCOUT_CAT',  col:24, row:4,  level:1 },
      { defId:'ALLEY_CAT',  col:10, row:0,  level:3, isBoss:true, deathQuote:'Impossible... defeated by mere pups...!' },
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
      { speaker: 'Lab Scout',        portrait: '🦮', text: "Stop. Everyone hold still. This forest is too quiet — no birds, no wind. Something is very wrong." },
      { speaker: 'Husky Rider',      portrait: '🐶', text: "Quiet forests are my favorite kind. Peaceful, you know? Maybe we scared all the cats away already." },
      { speaker: 'Lab Scout',        portrait: '🦮', text: "Husky. Shut. Up. Now." },
      { speaker: 'Beagle Archer',    portrait: '🐩', text: "Help! In the trees — they've got me pinned down at the river crossing!" },
      { speaker: 'Siamese Assassin', portrait: '🐈', text: "NOW! Attack from all sides! Leave none of them standing!" },
      { speaker: 'Puppy Knight',     portrait: '🐶', text: "Ambush! Close ranks, protect your flanks — and someone get to that archer!" },
    ],
    victory: [
      { speaker: 'Beagle Archer', portrait: '🐩', text: "You came for me. I don't forget debts. My bow belongs to this cause now — until the end." },
      { speaker: 'Lab Scout',     portrait: '🦮', text: "Look at how they retreated — covering each other, pulling wounded back. That's not a raid party. That's a military unit." },
      { speaker: 'Beagle Archer', portrait: '🐩', text: "The ambush was planned before we even entered the woods. They knew our route. Someone told them." },
      { speaker: 'Poodle Mage',   portrait: '🐩', text: "I found written orders on the commander. They reference 'Phase One' and 'securing the mountain pass.' This is a campaign." },
      { speaker: 'Puppy Knight',  portrait: '🐶', text: "A campaign means a general. And a general means a plan we have to stop at its source. We move for Peak Paws." },
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
      { unitId:'PUPPY_KNIGHT',   col:10, row:20 },
      { unitId:'CORGI_HEALER',   col:12, row:20 },
      { unitId:'LABRADOR_SCOUT', col:8,  row:19 },
      { unitId:'POODLE_MAGE',    col:14, row:19 },
      { unitId:'HUSKY_RIDER',    col:6,  row:21 },
      // Beagle Archer is captured — wait near bridge for rescue
    ],

    enemies: [
      { defId:'SCOUT_CAT',        col:2,  row:0,  level:2 },
      { defId:'SCOUT_CAT',        col:22, row:0,  level:2 },
      { defId:'SIAMESE_ASSASSIN', col:0,  row:6,  level:1 },
      { defId:'SIAMESE_ASSASSIN', col:24, row:6,  level:1 },
      { defId:'PERSIAN_SORCERER', col:10, row:2,  level:2 },
      { defId:'LYNX_RANGER',      col:12, row:0,  level:3, isBoss:true, deathQuote:'The forest... will remember... my name...' },
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
    objective: 'seize_tile',
    seizeTileCol: 10,
    seizeTileRow: 2,
    bossId: 'SNOW_LEOPARD',
    bgColor: 0x1a1a2a,

    intro: [
      { speaker: 'Puppy Knight', portrait: '🐶',    text: "Three days of climbing and everyone's exhausted. But the pass is the only way through. We don't stop now." },
      { speaker: 'Bulldog Tank', portrait: '🐕‍🦺', text: "Wait. I know this mountain. Every rock, every switchback. I... guarded this pass once. Before." },
      { speaker: 'Lab Scout',    portrait: '🦮',    text: "Before? Before what, exactly? Who were you guarding it for?" },
      { speaker: 'Bulldog Tank', portrait: '🐕‍🦺', text: "That's a conversation for after we're alive. I know where they'll put their archers. Follow me." },
      { speaker: 'Snow Leopard', portrait: '🐆',    text: "Foolish dogs. This peak has claimed better soldiers than you. The Empire does not yield its high ground!" },
      { speaker: 'Puppy Knight', portrait: '🐶',    text: "Then we'll just have to be better. On me — we take that ridge!" },
    ],
    victory: [
      { speaker: 'Bulldog Tank',  portrait: '🐕‍🦺', text: "The pass is ours. My shield is yours, commander. For as long as you'll have me." },
      { speaker: 'Lab Scout',     portrait: '🦮',    text: "You served the Empire, didn't you. That's how you knew the defensive positions." },
      { speaker: 'Bulldog Tank',  portrait: '🐕‍🦺', text: "I did. Ten years as a gate captain. I left when the Emperor changed — became someone I didn't recognize. He found something, out in the eastern ruins. After that... he was different." },
      { speaker: 'Corgi Healer',  portrait: '🐕',    text: "Different how? What did he find?" },
      { speaker: 'Bulldog Tank',  portrait: '🐕‍🦺', text: "I don't know. Only the Queen was there when he touched it. Whatever it was, it hollowed him out." },
      { speaker: 'Puppy Knight',  portrait: '🐶',    text: "Then the Queen is the one who has answers. We head for the desert. We find a way to the fortress." },
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
      { unitId:'PUPPY_KNIGHT',   col:10, row:18 },
      { unitId:'CORGI_HEALER',   col:12, row:18 },
      { unitId:'BEAGLE_ARCHER',  col:8,  row:18 },
      { unitId:'LABRADOR_SCOUT', col:14, row:18 },
      { unitId:'POODLE_MAGE',    col:10, row:17 },
      { unitId:'HUSKY_RIDER',    col:12, row:17 },
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
      { defId: 'HEALER_CAT', col:12, row:14, level:3 },
      { defId:'SNOW_LEOPARD',     col:10, row:0,  level:5, isBoss:true, deathQuote:'The cold... claims us all... eventually...' },
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
    reachRow: 4,
    bossId: 'RIVER_PANTHER',
    bgColor: 0x0a1a2a,

    intro: [
      { speaker: 'Lab Scout',     portrait: '🦮', text: "Both bridges are fortified. The current's too fast to swim across — we need a way through their lines." },
      { speaker: 'Otto Otter',    portrait: '🦦', text: "Ooh, hello! I've been watching from the reeds. You look like you need a river guide — and I happen to be the best one around!" },
      { speaker: 'River Panther', portrait: '🐆', text: "Ah. The rebel dogs, at last. The Emperor's grand design anticipated your arrival. These bridges are the Empire's — and so is your fate." },
      { speaker: 'Otto Otter',    portrait: '🦦', text: "Psst. That's the River Panther — the Empire's finest tactician. If he's here personally, they're worried about you. That's a good sign." },
      { speaker: 'Puppy Knight',  portrait: '🐶', text: "Good. Then let's give them something to really worry about. Otto — show us those crossings." },
    ],
    victory: [
      { speaker: 'River Panther', portrait: '🐆', text: "You fight well... but you don't understand what you're walking into. The Emperor's grip tightens because he FEARS something. You should ask yourself what." },
      { speaker: 'Otto Otter',    portrait: '🦦', text: "I've traveled farther than any dog here — beyond the Empire's borders, to the eastern shores. The Emperor wasn't always like this. Traders who knew him said he was fair, curious. Beloved, even." },
      { speaker: 'Bulldog Tank',  portrait: '🐕‍🦺', text: "That was before the ruins. Before whatever he brought back with him." },
      { speaker: 'Corgi Healer',  portrait: '🐕', text: "Otto, have you heard of it? An artifact — something that changes a person?" },
      { speaker: 'Otto Otter',    portrait: '🦦', text: "The otters call it the Stone of Endless Want. Ancient thing — older than any kingdom. It whispers promises to whoever holds it, and twists them from the inside until there's nothing left but hunger." },
      { speaker: 'Puppy Knight',  portrait: '🐶', text: "Then we don't just have to stop the Emperor. We have to free him. We have to destroy that stone." },
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
      { unitId:'PUPPY_KNIGHT',   col:10, row:18 },
      { unitId:'CORGI_HEALER',   col:12, row:18 },
      { unitId:'BEAGLE_ARCHER',  col:8,  row:17 },
      { unitId:'BULLDOG_TANK',   col:14, row:17 },
      { unitId:'LABRADOR_SCOUT', col:10, row:16 },
      { unitId:'POODLE_MAGE',    col:12, row:16 },
    ],

    enemies: [
      { defId:'SCOUT_CAT',        col:4,  row:0,  level:4 },
      { defId:'SCOUT_CAT',        col:20, row:0,  level:4 },
      { defId:'SIAMESE_ASSASSIN', col:8,  row:2,  level:4 },
      { defId:'SIAMESE_ASSASSIN', col:16, row:2,  level:4 },
      { defId:'TIGER_GENERAL',    col:2,  row:0,  level:4 },
      { defId:'TIGER_GENERAL',    col:22, row:0,  level:4 },
      { defId:'PERSIAN_SORCERER', col:10, row:2,  level:4 },
      { defId:'RIVER_PANTHER',    col:10, row:0,  level:5, isBoss:true, deathQuote:'The river... carries me away...' },
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
      { speaker: 'Husky Rider',   portrait: '🐶', text: "Three days of desert and my paws are done. Someone tell me the fortress has shade." },
      { speaker: 'Beagle Archer', portrait: '🐩', text: "Save it. There's a figure moving along that ridge — not one of ours." },
      { speaker: 'Fox Scout',     portrait: '🦊', text: "Relax. That's me — or it was, before I decided your coin was better than the King's. I know every dune and trap out here. Hire me." },
      { speaker: 'Lab Scout',     portrait: '🦮', text: "A mercenary? Now? We don't even know whose side you're really on." },
      { speaker: 'Sand Cat King', portrait: '🐅', text: "It does not matter which side the fox chooses. The desert answers to me! You will be buried here, dogs — as all trespassers are!" },
      { speaker: 'Fox Scout',     portrait: '🦊', text: "There's a path around his left flank — I know it cold. Your call, Knight. But make it fast." },
    ],
    victory: [
      { speaker: 'Lab Scout',     portrait: '🦮', text: "I saw you hesitate back there, Fox. You had one paw pointed the other direction." },
      { speaker: 'Fox Scout',     portrait: '🦊', text: "...Yeah. Old habit. I stayed. That's what matters." },
      { speaker: 'Sand Cat King', portrait: '🐅', text: "Wait. Do not raise your weapons. This land is mine, yes — but the Empire forced my paw. I had no quarrel with you until they arrived." },
      { speaker: 'Sand Cat King', portrait: '🐅', text: "Hear me: that thing around the Emperor's neck — the Claw of Discord — it will hollow out anyone who holds it. He was once a fair ruler. I traded with his caravans. The artifact ate him from the inside." },
      { speaker: 'Puppy Knight',  portrait: '🐶', text: "Where is it kept? The Claw — where?" },
      { speaker: 'Sand Cat King', portrait: '🐅', text: "The throne room. The Queen knows where it rests. She has been trying to protect him from it — and failing." },
      { speaker: 'Corgi Healer',  portrait: '🐕', text: "Then we go to the fortress. Not to conquer. To finish this." },
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
      { unitId:'PUPPY_KNIGHT',   col:10, row:17 },
      { unitId:'CORGI_HEALER',   col:12, row:17 },
      { unitId:'BEAGLE_ARCHER',  col:8,  row:16 },
      { unitId:'BULLDOG_TANK',   col:14, row:16 },
      { unitId:'LABRADOR_SCOUT', col:10, row:15 },
      { unitId:'HUSKY_RIDER',    col:12, row:15 },
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
      { defId: 'HEALER_CAT', col:12, row:6,  level:5 },
      { defId:'SAND_CAT_KING',    col:10, row:0,  level:6, isBoss:true, deathQuote:'My kingdom... buried in sand...' },
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
    objective: 'escort_vip',
    vipId: 'CORGI_HEALER',
    vipTargetCol: 12,
    vipTargetRow: 2,
    bossId: 'PERSIAN_QUEEN',
    bgColor: 0x0a0a1a,

    intro: [
      { speaker: 'Corgi Healer',  portrait: '🐕', text: "I've been with you every step. I'm not afraid of anything — I told myself that. But standing here... I'm afraid." },
      { speaker: 'Bulldog Tank',  portrait: '🐕‍🦺', text: "Good. Fear means you understand what this is. Hold it close — it'll keep you sharp." },
      { speaker: 'Terrier Thief', portrait: '🦊', text: "Gate's sealed with three bolts and an old chain lock. Give me four minutes. Maybe three." },
      { speaker: 'Lab Scout',     portrait: '🦮', text: "You were paid to be here? By who?" },
      { speaker: 'Terrier Thief', portrait: '🦊', text: "Does it matter? I'm here. Get moving." },
      { speaker: 'Persian Queen', portrait: '😺', text: "You come this far only to fall at my gates. Impudent mutts — your bones will decorate this throne room before morning!" },
      { speaker: 'Puppy Knight',  portrait: '🐶', text: "We're not here to conquer. We're here to set something right. Open the gate, Terrier." },
    ],
    victory: [
      { speaker: 'Puppy Knight',  portrait: '🐶', text: "It's done. Sheathe your weapons — all of you." },
      { speaker: 'Persian Queen', portrait: '😺', text: "Go ahead. Finish it. I won't beg." },
      { speaker: 'Puppy Knight',  portrait: '🐶', text: "We're not here to hurt you." },
      { speaker: 'Persian Queen', portrait: '😺', text: "He used to walk the markets of Meow City before dawn — before anyone was awake — just to know his people. He remembered every name. He was... warm. Curious. Just." },
      { speaker: 'Persian Queen', portrait: '😺', text: "I was there in the ruins when he found it. I begged him not to touch it. He laughed and said it was just a stone. And then his eyes changed, and he was never the same again." },
      { speaker: 'Persian Queen', portrait: '😺', text: "Don't destroy him. Please. Destroy the Claw. What it's made him — that isn't him. That was never him." },
      { speaker: 'Puppy Knight',  portrait: '🐶', text: "We will. I promise you — we will." },
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
      { unitId:'PUPPY_KNIGHT',   col:10, row:26 },
      { unitId:'CORGI_HEALER',   col:12, row:26 },
      { unitId:'BEAGLE_ARCHER',  col:10, row:25 },
      { unitId:'BULLDOG_TANK',   col:12, row:25 },
      { unitId:'LABRADOR_SCOUT', col:8,  row:26 },
      { unitId:'TERRIER_THIEF',  col:14, row:26 },
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
      { defId:'PERSIAN_QUEEN',    col:10, row:2,  level:7, isBoss:true, deathQuote:'You think this changes anything? The Emperor will crush you all!' },
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
      { speaker: 'Husky Rider',   portrait: '🐶', text: "Hey. Before we go in. I just — thanks. All of you. I'm not good at saying that, so I'm only saying it once." },
      { speaker: 'Beagle Archer', portrait: '🐩', text: "You saved me in the Howling Woods. I go where you go. No more words needed." },
      { speaker: 'Bulldog Tank',  portrait: '🐕‍🦺', text: "I served that man for ten years. He was a good ruler. Whatever is in that throne room — it isn't him. Let's bring him back." },
      { speaker: 'Corgi Healer',  portrait: '🐕', text: "May we come through this whole. All of us." },
      { speaker: 'Otto Otter',    portrait: '🦦', text: "I have seen the shores of four seas. Nothing I have seen compares to what this team has done together. Let's finish it." },
      { speaker: 'Puppy Knight',  portrait: '🐶', text: "We're not fighting to conquer. We're fighting to free him. One last push — together." },
      { speaker: 'Cat Emperor',   portrait: '👑', text: "You DARE come before me?! I will grind your bones to dust — the Claw DEMANDS it! You will NOT take it from me — I WON'T LET YOU!" },
    ],
    victory: [
      { speaker: 'Puppy Knight',  portrait: '🐶', text: "Now — the Claw!" },
      { speaker: 'Cat Emperor',   portrait: '👑', text: "No — NO — it's MINE, you can't — aaagh—" },
      { speaker: 'Cat Emperor',   portrait: '👑', text: "What... where am I? What... what have I done?" },
      { speaker: 'Cat Emperor',   portrait: '👑', text: "I remember everything. Every order. Every life. I remember — and I cannot take any of it back." },
      { speaker: 'Persian Queen', portrait: '😺', text: "I'm here. I'm here. It's over." },
      { speaker: 'Cat Emperor',   portrait: '👑', text: "You came not to destroy me, but to save me. I did not deserve that mercy. I do not know if I ever will." },
      { speaker: 'Bulldog Tank',  portrait: '🐕‍🦺', text: "..." },
      { speaker: 'Otto Otter',    portrait: '🦦', text: "A new world starts from here. That's all any of us can do — start from where we are." },
      { speaker: 'Corgi Healer',  portrait: '🐕', text: "And take care of each other along the way." },
      { speaker: 'All',           portrait: '🐾', text: "Puppy Force... and friends. Together." },
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
      { unitId:'PUPPY_KNIGHT',   col:10, row:18 },
      { unitId:'CORGI_HEALER',   col:12, row:18 },
      { unitId:'BEAGLE_ARCHER',  col:8,  row:18 },
      { unitId:'BULLDOG_TANK',   col:14, row:18 },
      { unitId:'LABRADOR_SCOUT', col:6,  row:17 },
      { unitId:'POODLE_MAGE',    col:16, row:17 },
      { unitId:'HUSKY_RIDER',    col:8,  row:16 },
      { unitId:'TERRIER_THIEF',  col:14, row:16 },
    ],

    enemies: [
      { defId:'TIGER_GENERAL',    col:6,  row:6,  level:8 },
      { defId:'TIGER_GENERAL',    col:16, row:6,  level:8 },
      { defId:'SIAMESE_ASSASSIN', col:6,  row:8,  level:8 },  // on left bridge (col 4 was water)
      { defId:'SIAMESE_ASSASSIN', col:18, row:8,  level:8 },  // on right bridge (col 20 was water)
      { defId:'PERSIAN_SORCERER', col:6,  row:2,  level:8 },
      { defId:'PERSIAN_SORCERER', col:18, row:2,  level:8 },
      { defId:'SIAMESE_ASSASSIN', col:2,  row:12, level:8 },
      { defId:'SIAMESE_ASSASSIN', col:22, row:12, level:8 },
      { defId:'TIGER_GENERAL',    col:8,  row:6,  level:8 },
      { defId:'TIGER_GENERAL',    col:14, row:6,  level:8 },
      { defId: 'HEALER_CAT', col:10, row:4,  level:8 },
      { defId:'CAT_EMPEROR',      col:12, row:0,  level:10, isBoss:true, deathQuote:'No... the empire... was supposed to be... eternal...' },
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
  // m8: AGI scales at 50% rate (half of other stats) to prevent high-level enemies being easily double-attacked
  scaledDef.baseStats.agi   += Math.floor((g.agi || 0) * 0.5 * levelDiff);

  const unit = new Unit(scaledDef, spawnDef.col, spawnDef.row);
  return unit;
}
