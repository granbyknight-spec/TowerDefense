'use strict';
// =============================================================================
// Puppy Force — ChapterData.js
// All 7 chapter maps, enemy placements, story dialogue, objectives
// Maps are GROWS x GCOLS arrays (row-major): mapGrid[row][col]
// Terrain IDs: 0=GRASS 1=FOREST 2=MOUNTAIN 3=WATER 4=ROAD 5=SAND
//              6=CASTLE 7=VILLAGE 8=SNOW 9=BRIDGE 10=WALL 11=OASIS
// =============================================================================

const CHAPTERS = [

  // ===========================================================================
  // Chapter 1: Barkville Siege — Defend the village. Boss: Alley Cat
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

    // 12 rows x 10 cols  (10=WALL/rock, impassable)
    mapGrid: [
      [0, 0, 0, 4, 0, 0, 4, 0, 0, 0],
      [1, 0, 0, 4, 0, 0, 4, 0, 0, 1],
      [1, 1, 0, 4, 0, 0, 4, 0, 1, 1],
      [0,10, 0, 0, 0, 0, 0, 0,10, 0],  // rocky outcrops flanking both sides
      [10, 0, 0, 4, 7, 7, 4, 0, 0,10], // rocks hug the village walls
      [10, 0, 4, 4, 7, 7, 4, 4, 0,10], // forcing fights through road corridors
      [10, 0, 0, 4, 7, 7, 4, 0, 0,10],
      [0, 0, 0, 4, 0, 0, 4, 0, 0, 0],
      [1, 0, 0, 4, 0, 0, 4, 0, 0, 1],
      [1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
      [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],

    playerStart: [
      { unitId:'PUPPY_KNIGHT',  col:4, row:11 },
      { unitId:'CORGI_HEALER',  col:5, row:11 },
      { unitId:'LABRADOR_SCOUT',col:3, row:10 },
      { unitId:'POODLE_MAGE',   col:6, row:10 },
      { unitId:'HUSKY_RIDER',   col:2, row:11 },
      { unitId:'BEAGLE_ARCHER', col:7, row:11 },
    ],

    enemies: [
      { defId:'SCOUT_CAT', col:1, row:0, level:1 },
      { defId:'SCOUT_CAT', col:8, row:0, level:1 },
      { defId:'SCOUT_CAT', col:3, row:1, level:1 },
      { defId:'SCOUT_CAT', col:6, row:1, level:1 },
      { defId:'SCOUT_CAT', col:0, row:2, level:1 },
      { defId:'SCOUT_CAT', col:9, row:2, level:1 },
      { defId:'ALLEY_CAT', col:4, row:0, level:3 },
    ],

    recruitable: [],
  },

  // ===========================================================================
  // Chapter 2: Howling Woods — Ambush path. Recruit Beagle Archer. Boss: Lynx
  // ===========================================================================
  {
    id: 2,
    title: 'Howling Woods',
    subtitle: 'Ambush in the forest! Find the archer!',
    objective: 'defeat_boss',
    bossId: 'LYNX_RANGER',
    bgColor: 0x0d1a08,

    intro: [
      { speaker: 'Lab Scout',    portrait: '🦮', text: "Something's wrong. This forest is too quiet..." },
      { speaker: 'Siamese Assassin', portrait: '🐈', text: "NOW! Attack from all sides!" },
      { speaker: 'Puppy Knight', portrait: '🐶', text: "Ambush! Stay together, don't let them surround us!" },
    ],
    victory: [
      { speaker: 'Beagle Archer', portrait: '🐩', text: "You saved me! I'll join your force. My arrows will serve Barkville!" },
      { speaker: 'Puppy Knight',  portrait: '🐶', text: "Welcome, Beagle! We head for Peak Paws next." },
    ],

    // 3=WATER (impassable), 9=BRIDGE (crossable), 10=WALL/rock
    mapGrid: [
      [1, 1, 4, 1, 1, 1, 1, 4, 1, 1],
      [1, 1, 4, 1, 1, 1, 1, 4, 1, 1],
      [1, 1, 4, 4, 4, 4, 4, 4, 1, 1],
      [1, 1, 1, 1, 4, 4, 1, 1, 1, 1],
      [10, 1, 1, 1, 4, 4, 1, 1, 1,10], // rock walls on flanks block enemy rush
      [1, 1, 4, 4, 4, 4, 4, 4, 1, 1],
      [3, 3, 9, 3, 3, 3, 3, 9, 3, 3],  // river! bridges at col 2 & 7; archer waits at bridge
      [0, 1, 4, 1, 1, 1, 1, 4, 1, 0],
      [0, 0, 4, 4, 4, 4, 4, 4, 0, 0],
      [0, 0, 0, 0, 4, 4, 0, 0, 0, 0],
      [0, 0, 0, 0, 4, 4, 0, 0, 0, 0],
      [0, 0, 0, 0, 4, 4, 0, 0, 0, 0],
    ],

    playerStart: [
      { unitId:'PUPPY_KNIGHT',  col:4, row:11 },
      { unitId:'CORGI_HEALER',  col:5, row:11 },
      { unitId:'LABRADOR_SCOUT',col:4, row:10 },
      { unitId:'POODLE_MAGE',   col:5, row:10 },
      { unitId:'HUSKY_RIDER',   col:3, row:11 },
      // Beagle Archer is captured beyond the river — rescue them at col:2,row:6
    ],

    enemies: [
      { defId:'SCOUT_CAT',       col:1, row:0, level:2 },
      { defId:'SCOUT_CAT',       col:8, row:0, level:2 },
      { defId:'SIAMESE_ASSASSIN',col:0, row:3, level:1 },
      { defId:'SIAMESE_ASSASSIN',col:9, row:3, level:1 },
      { defId:'PERSIAN_SORCERER',col:4, row:1, level:2 },
      { defId:'LYNX_RANGER',     col:5, row:0, level:3 },
    ],

    recruitable: [
      { unitId:'BEAGLE_ARCHER', col:2, row:6, rescueMsg:'Beagle Archer joins your force!' },
    ],
  },

  // ===========================================================================
  // Chapter 3: Peak Paws — Mountain climb. Recruit Bulldog Tank. Boss: Snow Leopard
  // ===========================================================================
  {
    id: 3,
    title: 'Peak Paws',
    subtitle: 'Scale the mountain to reach the pass!',
    objective: 'defeat_boss',
    bossId: 'SNOW_LEOPARD',
    bgColor: 0x1a1a2a,

    intro: [
      { speaker: 'Puppy Knight',   portrait: '🐶', text: "The mountain pass is the only way through. We climb!" },
      { speaker: 'Bulldog Tank',   portrait: '🐕‍🦺', text: "Wait—I know this mountain. I used to guard it. I'll help you." },
      { speaker: 'Snow Leopard',   portrait: '🐆', text: "Foolish dogs. This peak belongs to the Cat Empire. You'll fall here!" },
    ],
    victory: [
      { speaker: 'Bulldog Tank',   portrait: '🐕‍🦺', text: "The pass is ours! My shield will serve your cause, commander." },
      { speaker: 'Beagle Archer',  portrait: '🐩', text: "With Tank guarding our flank, we're unstoppable!" },
    ],

    mapGrid: [
      [2, 2, 2, 2, 8, 8, 2, 2, 2, 2],
      [2, 2, 8, 8, 8, 8, 8, 8, 2, 2],
      [2, 2, 8, 2, 4, 4, 2, 8, 2, 2],
      [0, 2, 2, 4, 4, 4, 4, 2, 2, 0],
      [0, 2, 2, 4, 2, 2, 4, 2, 2, 0],
      [0, 0, 2, 4, 2, 2, 4, 2, 0, 0],
      [0, 0, 2, 4, 4, 4, 4, 2, 0, 0],
      [0, 0, 0, 4, 2, 2, 4, 0, 0, 0],
      [0, 0, 0, 4, 2, 2, 4, 0, 0, 0],
      [0, 0, 0, 4, 0, 0, 4, 0, 0, 0],
      [0, 0, 0, 4, 0, 0, 4, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],

    playerStart: [
      { unitId:'PUPPY_KNIGHT',  col:4, row:11 },
      { unitId:'CORGI_HEALER',  col:5, row:11 },
      { unitId:'BEAGLE_ARCHER', col:3, row:11 },
      { unitId:'LABRADOR_SCOUT',col:6, row:11 },
      { unitId:'POODLE_MAGE',   col:4, row:10 },
      { unitId:'HUSKY_RIDER',   col:5, row:10 },
    ],

    enemies: [
      { defId:'TIGER_GENERAL',   col:4, row:7, level:3 },
      { defId:'TIGER_GENERAL',   col:5, row:7, level:3 },
      { defId:'SCOUT_CAT',       col:3, row:5, level:3 },
      { defId:'SCOUT_CAT',       col:6, row:5, level:3 },
      { defId:'SCOUT_CAT',       col:2, row:3, level:3 },
      { defId:'SCOUT_CAT',       col:7, row:3, level:3 },
      { defId:'PERSIAN_SORCERER',col:4, row:2, level:3 },
      { defId:'PERSIAN_SORCERER',col:5, row:2, level:3 },
      { defId:'SNOW_LEOPARD',    col:4, row:0, level:5 },
    ],

    recruitable: [
      { unitId:'BULLDOG_TANK', col:1, row:6, rescueMsg:'Bulldog Tank joins the force!' },
    ],
  },

  // ===========================================================================
  // Chapter 4: River Fetch — Water tiles. Otter ally. Boss: River Panther
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
      { speaker: 'Otto Otter',    portrait: '🦦', text: "The river crossing is ours! I know all the waterways ahead." },
      { speaker: 'Puppy Knight',  portrait: '🐶', text: "Great work, Otto! The Desert lies ahead..." },
    ],

    mapGrid: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [3, 3, 3, 9, 3, 3, 9, 3, 3, 3],
      [3, 3, 3, 9, 3, 3, 9, 3, 3, 3],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],

    playerStart: [
      { unitId:'PUPPY_KNIGHT',  col:4, row:11 },
      { unitId:'CORGI_HEALER',  col:5, row:11 },
      { unitId:'BEAGLE_ARCHER', col:3, row:11 },
      { unitId:'BULLDOG_TANK',  col:6, row:11 },
      { unitId:'LABRADOR_SCOUT',col:4, row:10 },
      { unitId:'POODLE_MAGE',   col:5, row:10 },
    ],

    enemies: [
      { defId:'SCOUT_CAT',       col:2, row:0, level:4 },
      { defId:'SCOUT_CAT',       col:7, row:0, level:4 },
      { defId:'SIAMESE_ASSASSIN',col:4, row:1, level:4 },
      { defId:'SIAMESE_ASSASSIN',col:5, row:1, level:4 },
      { defId:'TIGER_GENERAL',   col:1, row:0, level:4 },
      { defId:'TIGER_GENERAL',   col:8, row:0, level:4 },
      { defId:'PERSIAN_SORCERER',col:4, row:0, level:4 },
      { defId:'RIVER_PANTHER',   col:5, row:4, level:5 },
    ],

    recruitable: [
      { unitId:'OTTER_ALLY', col:3, row:4, rescueMsg:'Otto Otter joins your force!' },
    ],
  },

  // ===========================================================================
  // Chapter 5: Desert Scratch — Sand traps. Fox Scout. Boss: Sand Cat King
  // ===========================================================================
  {
    id: 5,
    title: 'Desert Scratch',
    subtitle: 'Navigate the desert sands! Watch out for traps!',
    objective: 'defeat_boss',
    bossId: 'SAND_CAT_KING',
    bgColor: 0x2a1a00,

    intro: [
      { speaker: 'Puppy Knight',   portrait: '🐶', text: "The desert heat is brutal. Stay hydrated at the oases!" },
      { speaker: 'Foxy Scout',     portrait: '🦊', text: "I know this desert! Let me guide you through the sand traps!" },
      { speaker: 'Sand Cat King',  portrait: '🐅', text: "The sands will swallow you, dogs! This is MY kingdom!" },
    ],
    victory: [
      { speaker: 'Foxy Scout',    portrait: '🦊', text: "We did it! I know a shortcut to the Meow Fortress." },
      { speaker: 'Corgi Healer',  portrait: '🐕', text: "Rest at the oasis. The fortress battle will be our toughest yet." },
    ],

    mapGrid: [
      [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      [5, 5, 11,5, 5, 5, 5, 11,5, 5],
      [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      [5, 5, 5, 5, 4, 4, 5, 5, 5, 5],
      [5, 5, 5, 5, 4, 4, 5, 5, 5, 5],
      [5, 5, 5, 5, 4, 4, 5, 5, 5, 5],
      [5, 5, 11,5, 4, 4, 5, 11,5, 5],
      [5, 5, 5, 5, 4, 4, 5, 5, 5, 5],
      [5, 5, 5, 5, 4, 4, 5, 5, 5, 5],
      [5, 5, 5, 5, 4, 4, 5, 5, 5, 5],
      [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    ],

    playerStart: [
      { unitId:'PUPPY_KNIGHT',  col:4, row:11 },
      { unitId:'CORGI_HEALER',  col:5, row:11 },
      { unitId:'BEAGLE_ARCHER', col:3, row:11 },
      { unitId:'BULLDOG_TANK',  col:6, row:11 },
      { unitId:'LABRADOR_SCOUT',col:4, row:10 },
      { unitId:'HUSKY_RIDER',   col:5, row:10 },
    ],

    enemies: [
      { defId:'SCOUT_CAT',       col:0, row:0, level:5 },
      { defId:'SCOUT_CAT',       col:9, row:0, level:5 },
      { defId:'SCOUT_CAT',       col:1, row:2, level:5 },
      { defId:'SCOUT_CAT',       col:8, row:2, level:5 },
      { defId:'SIAMESE_ASSASSIN',col:3, row:3, level:5 },
      { defId:'SIAMESE_ASSASSIN',col:6, row:3, level:5 },
      { defId:'PERSIAN_SORCERER',col:3, row:1, level:5 },
      { defId:'PERSIAN_SORCERER',col:6, row:1, level:5 },
      { defId:'TIGER_GENERAL',   col:4, row:4, level:5 },
      { defId:'SAND_CAT_KING',   col:4, row:0, level:6 },
    ],

    recruitable: [
      { unitId:'FOX_SCOUT',     col:1, row:6, rescueMsg:'Foxy Scout joins your force!' },
      { unitId:'TERRIER_THIEF', col:8, row:6, rescueMsg:'Terrier Thief joins your force!' },
    ],
  },

  // ===========================================================================
  // Chapter 6: Meow Fortress — Infiltrate the castle. Boss: Persian Queen
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

    mapGrid: [
      [10,10,10,10,10,10,10,10,10,10],
      [10, 6, 6, 6, 6, 6, 6, 6, 6,10],
      [10, 6,10, 6, 6, 6, 6,10, 6,10],
      [10, 4, 4, 4, 6, 6, 4, 4, 4,10],
      [10, 6, 6, 4, 6, 6, 4, 6, 6,10],
      [10, 6,10, 4, 6, 6, 4,10, 6,10],
      [10, 6, 6, 4, 4, 4, 4, 6, 6,10],
      [10, 6, 6, 6, 6, 6, 6, 6, 6,10],
      [10, 4, 4, 4, 6, 6, 4, 4, 4,10],
      [10, 6, 6, 4, 6, 6, 4, 6, 6,10],
      [10, 6, 6, 4, 4, 4, 4, 6, 6,10],
      [10,10, 4, 4,10,10, 4, 4,10,10],
    ],

    playerStart: [
      { unitId:'PUPPY_KNIGHT',  col:4, row:11 },
      { unitId:'CORGI_HEALER',  col:5, row:11 },
      { unitId:'BEAGLE_ARCHER', col:3, row:11 },
      { unitId:'BULLDOG_TANK',  col:6, row:11 },
      { unitId:'LABRADOR_SCOUT',col:2, row:11 },
      { unitId:'TERRIER_THIEF', col:7, row:11 },
    ],

    enemies: [
      { defId:'TIGER_GENERAL',   col:1, row:7, level:6 },
      { defId:'TIGER_GENERAL',   col:8, row:7, level:6 },
      { defId:'SIAMESE_ASSASSIN',col:3, row:6, level:6 },
      { defId:'SIAMESE_ASSASSIN',col:6, row:6, level:6 },
      { defId:'PERSIAN_SORCERER',col:4, row:4, level:6 },
      { defId:'PERSIAN_SORCERER',col:5, row:4, level:6 },
      { defId:'SCOUT_CAT',       col:1, row:9, level:6 },
      { defId:'SCOUT_CAT',       col:8, row:9, level:6 },
      { defId:'PERSIAN_QUEEN',   col:4, row:1, level:7 },
    ],

    recruitable: [],
  },

  // ===========================================================================
  // Chapter 7: Ultimate Woof — Final battle. Boss: Cat Emperor
  // ===========================================================================
  {
    id: 7,
    title: 'Ultimate Woof',
    subtitle: 'The final battle! Defeat the Cat Emperor!',
    objective: 'defeat_boss',
    bossId: 'CAT_EMPEROR',
    bgColor: 0x1a0a2a,

    intro: [
      { speaker: 'Puppy Knight',  portrait: '🐶', text: "This is it. The Cat Emperor's throne room. For Barkville!" },
      { speaker: 'Otto Otter',    portrait: '🦦', text: "We've come so far together. For all animals, free and proud!" },
      { speaker: 'Cat Emperor',   portrait: '👑', text: "You dare challenge ME?! I will end your pitiful rebellion HERE AND NOW!" },
    ],
    victory: [
      { speaker: 'Cat Emperor',   portrait: '👑', text: "Im-possible... defeated by... dogs..." },
      { speaker: 'Puppy Knight',  portrait: '🐶', text: "It's over. The Cat Empire is finished. All animals are free!" },
      { speaker: 'All',           portrait: '🐾', text: "PUPPY FORCE FOREVER! WOOF WOOF WOOF!" },
    ],

    mapGrid: [
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 6, 6, 4, 6, 6, 4, 6, 6, 6],
      [6, 6, 6, 4, 6, 6, 4, 6, 6, 6],
      [2, 6, 6, 4, 4, 4, 4, 6, 6, 2],
      [2, 2, 0, 4, 0, 0, 4, 0, 2, 2],
      [3, 3, 9, 4, 4, 4, 4, 9, 3, 3],
      [0, 0, 0, 4, 1, 1, 4, 0, 0, 0],
      [0, 0, 0, 4, 1, 1, 4, 0, 0, 0],
      [0, 0, 0, 4, 0, 0, 4, 0, 0, 0],
      [5, 5, 0, 0, 0, 0, 0, 0, 5, 5],
      [5, 5, 0, 0, 0, 0, 0, 0, 5, 5],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],

    playerStart: [
      { unitId:'PUPPY_KNIGHT',  col:4, row:11 },
      { unitId:'CORGI_HEALER',  col:5, row:11 },
      { unitId:'BEAGLE_ARCHER', col:3, row:11 },
      { unitId:'BULLDOG_TANK',  col:6, row:11 },
      { unitId:'LABRADOR_SCOUT',col:2, row:11 },
      { unitId:'POODLE_MAGE',   col:7, row:11 },
      { unitId:'HUSKY_RIDER',   col:3, row:10 },
      { unitId:'TERRIER_THIEF', col:6, row:10 },
    ],

    enemies: [
      { defId:'TIGER_GENERAL',   col:3, row:3, level:8 },
      { defId:'TIGER_GENERAL',   col:6, row:3, level:8 },
      { defId:'SIAMESE_ASSASSIN',col:2, row:4, level:8 },
      { defId:'SIAMESE_ASSASSIN',col:7, row:4, level:8 },
      { defId:'PERSIAN_SORCERER',col:3, row:1, level:8 },
      { defId:'PERSIAN_SORCERER',col:6, row:1, level:8 },
      { defId:'SIAMESE_ASSASSIN',col:1, row:6, level:8 },
      { defId:'SIAMESE_ASSASSIN',col:8, row:6, level:8 },
      { defId:'TIGER_GENERAL',   col:4, row:3, level:8 },
      { defId:'TIGER_GENERAL',   col:5, row:3, level:8 },
      { defId:'CAT_EMPEROR',     col:4, row:0, level:10 },
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
