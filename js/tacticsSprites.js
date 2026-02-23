// tacticsSprites.js
// Pixel art sprite data for Shining Force / Dragon Warrior style tactical RPG
// Dog vs Cat themed JRPG battle system
// Each sprite is a compact string array where each character maps to a palette color

'use strict';

// ---------------------------------------------------------------------------
// COLOR PALETTE
// ---------------------------------------------------------------------------
const TACTICS_PALETTE = {
    '.': null,           // transparent
    'k': '#1a1a2e',      // dark outline
    'K': '#000000',      // pure black
    // Dog colors
    'b': '#8b5e3c',      // brown fur
    'B': '#6b3a1a',      // dark brown
    't': '#d4a574',      // tan/light fur
    'T': '#f0d8b0',      // cream
    'w': '#ffffff',      // white
    'W': '#e0e0e0',      // light gray
    // Cat colors
    'g': '#808080',      // gray cat
    'G': '#505050',      // dark gray cat
    'o': '#d08030',      // orange cat
    'O': '#a06020',      // dark orange
    'n': '#2a2a2a',      // ninja black
    // Equipment/clothing
    'r': '#c83030',      // red (armor/cape)
    'R': '#882020',      // dark red
    'l': '#3060c8',      // blue (mage robe)
    'L': '#1a3a80',      // dark blue
    's': '#c0c0c0',      // silver (armor)
    'S': '#808080',      // dark silver
    // Nature/terrain
    'e': '#38b764',      // green (grass)
    'E': '#1e6e2e',      // dark green
    'd': '#c8956c',      // dirt/path
    'D': '#a07040',      // dark dirt
    'a': '#3978a8',      // water blue
    'A': '#2d5e85',      // dark water
    'y': '#f8d830',      // yellow (selection highlight)
    'Y': '#c8a020',      // dark yellow
    'p': '#f07898',      // pink (heal)
    'P': '#c05070',      // dark pink
    'm': '#90d0e0',      // light blue (ice/magic)
    'M': '#60a0b8',      // med blue
    'c': '#f0a830',      // gold/coin
    'C': '#c08020',      // dark gold
};

// ---------------------------------------------------------------------------
// SPRITE DEFINITIONS
// ---------------------------------------------------------------------------
// Each sprite is a 16x16 (or 8x8 for fx) array of strings.
// Characters map to TACTICS_PALETTE colors.
// Animated sprites are arrays of frames, each frame being a string array.
// ---------------------------------------------------------------------------

const TACTICS_SPRITES = {

    // -----------------------------------------------------------------------
    // DOG CHARACTERS
    // -----------------------------------------------------------------------

    // Buddy the Beagle Knight
    // Brown/tan beagle, red cape, silver helmet
    // Directions: down, left, right, up
    // 2 frames each (standing, step)
    dog_knight_down: [
        // Frame 0: standing facing down
        [
            '................',
            '................',
            '....kkkkkkk.....',
            '...ksssssssk....',
            '...kstsstssk....',  // helmet with visor
            '...ksssssssk....',
            '..kttttttttk....',
            '..kttKKttKKtk...',  // big round eyes
            '..kttttkttttk...',
            '..kttKtttttttk..',  // nose
            '..kkttttttttk...',
            '...krrkkrrk.....',  // cape start
            '...krrttrrk.....',
            '...ktk..ktk.....',  // stubby legs
            '...kbk..kbk.....',
            '................',
        ],
        // Frame 1: one step forward
        [
            '................',
            '................',
            '....kkkkkkk.....',
            '...ksssssssk....',
            '...kstsstssk....',
            '...ksssssssk....',
            '..kttttttttk....',
            '..kttKKttKKtk...',
            '..kttttkttttk...',
            '..kttKtttttttk..',
            '..kkttttttttk...',
            '...krrkkrrk.....',
            '...krrttrrk.....',
            '..ktk....kk.....',  // legs shifted
            '...kbk..kb......',
            '................',
        ],
    ],

    dog_knight_left: [
        // Frame 0: facing left
        [
            '................',
            '................',
            '...kkkkkkk......',
            '..kssssssk......',
            '..kstssssk......',  // helmet
            '..kssssssk......',
            '.kttttttttk.....',
            '.ktttKtttttk....',  // one visible eye
            '.kttttktttttk...',
            '.ktKtttttttttk..',  // nose to left side
            '.kkbttttttttk...',
            '..krrkkrrk......',
            '..krrttrrrk.....',  // cape behind
            '..kkt...........',
            '..kbk...........',
            '................',
        ],
        // Frame 1: step
        [
            '................',
            '................',
            '...kkkkkkk......',
            '..kssssssk......',
            '..kstssssk......',
            '..kssssssk......',
            '.kttttttttk.....',
            '.ktttKtttttk....',
            '.kttttktttttk...',
            '.ktKtttttttttk..',
            '.kkbttttttttk...',
            '..krrkkrrk......',
            '..krrttrrrk.....',
            '.kkt............',
            '..kbk...........',
            '................',
        ],
    ],

    dog_knight_right: [
        // Frame 0: facing right
        [
            '................',
            '................',
            '......kkkkkkk...',
            '......kssssssk..',
            '......ksssstssk.',
            '......kssssssk..',
            '.....kttttttttk.',
            '....ktttttKtttk.',
            '...ktttttktttttk',
            '..ktKtttttttttk.',
            '...ktttttttttkk.',
            '......krrkkkrk..',
            '.....krrrttrrk..',
            '...........tkk..',
            '...........kbk..',
            '................',
        ],
        // Frame 1: step
        [
            '................',
            '................',
            '......kkkkkkk...',
            '......kssssssk..',
            '......ksssstssk.',
            '......kssssssk..',
            '.....kttttttttk.',
            '....ktttttKtttk.',
            '...ktttttktttttk',
            '..ktKtttttttttk.',
            '...ktttttttttkk.',
            '......krrkkkrk..',
            '.....krrrttrrk..',
            '..........tkk...',
            '..........kbk...',
            '................',
        ],
    ],

    dog_knight_up: [
        // Frame 0: facing up (back view)
        [
            '................',
            '................',
            '....kkkkkkk.....',
            '...ksssssssk....',
            '...ksssssssk....',
            '...ksssssssk....',
            '..kttttttttk....',
            '..kttttttttk....',
            '..kttttttttk....',
            '..kbbbbbbbbbk...',  // back of neck/collar
            '..kktttttttkk...',
            '...krrkkrrk.....',
            '...krrrrrrrk....',  // cape from behind
            '...ktk..ktk.....',
            '...kbk..kbk.....',
            '................',
        ],
        // Frame 1: step
        [
            '................',
            '................',
            '....kkkkkkk.....',
            '...ksssssssk....',
            '...ksssssssk....',
            '...ksssssssk....',
            '..kttttttttk....',
            '..kttttttttk....',
            '..kttttttttk....',
            '..kbbbbbbbbbk...',
            '..kktttttttkk...',
            '...krrkkrrk.....',
            '...krrrrrrrk....',
            '..ktk....kk.....',
            '...kbk..kb......',
            '................',
        ],
    ],

    // Luna the Poodle Mage - White/cream poodle with blue mage robe and staff
    dog_mage_down: [
        // Frame 0: standing
        [
            '................',
            '....kwwwwwwk....',
            '...kwwwwwwwwk...',
            '..kwwwwwwwwwwk..',
            '..kwwKkkKkwwwk..',  // poofy head with eyes
            '..kwwwkkwwwwwk..',  // nose area
            '..kwkwwwwwwkwk..',  // poofy sides
            '...kwwwwwwwwk...',
            '...kllllllllk...',  // blue robe
            '...klllllllllk..',
            '...kllclllllk...',  // staff glow
            '...kllllllllk...',
            '...kllkk.kklk...',
            '...ktk...kck....',  // legs + staff tip
            '....kk....kk....',
            '................',
        ],
        // Frame 1: step
        [
            '................',
            '....kwwwwwwk....',
            '...kwwwwwwwwk...',
            '..kwwwwwwwwwwk..',
            '..kwwKkkKkwwwk..',
            '..kwwwkkwwwwwk..',
            '..kwkwwwwwwkwk..',
            '...kwwwwwwwwk...',
            '...kllllllllk...',
            '...klllllllllk..',
            '...kllclllllk...',
            '...kllllllllk...',
            '...kllkk.kklk...',
            '..ktk....kck....',  // step
            '....kk....kk....',
            '................',
        ],
    ],

    dog_mage_left: [
        [
            '................',
            '...kwwwwwwk.....',
            '..kwwwwwwwwk....',
            '.kwwwwwwwwwwk...',
            '.kwwKkwwwwwwk...',
            '.kwwwkkwwwwwk...',
            '.kwkwwwwwwwwk...',
            '..kwwwwwwwwk....',
            '..kllllllllk....',
            '..kllllllllk....',
            '.kclllllllk.....',  // staff on left
            '..kllllllllk....',
            '..kllkk.kklk....',
            '.kck..ktk.......',
            '..kk...kk.......',
            '................',
        ],
        [
            '................',
            '...kwwwwwwk.....',
            '..kwwwwwwwwk....',
            '.kwwwwwwwwwwk...',
            '.kwwKkwwwwwwk...',
            '.kwwwkkwwwwwk...',
            '.kwkwwwwwwwwk...',
            '..kwwwwwwwwk....',
            '..kllllllllk....',
            '..kllllllllk....',
            '.kclllllllk.....',
            '..kllllllllk....',
            '..kllkk.kklk....',
            'kck...ktk.......',
            '..kk...kk.......',
            '................',
        ],
    ],

    dog_mage_right: [
        [
            '................',
            '.....kwwwwwwk...',
            '....kwwwwwwwwk..',
            '...kwwwwwwwwwwk.',
            '...kwwwwwwwkKwk.',
            '...kwwwwwwwkkwk.',
            '...kwwwwwwwwkwk.',
            '....kwwwwwwwwk..',
            '....kllllllllk..',
            '....kllllllllk..',
            '.....klllllllkc.',  // staff on right
            '....kllllllllk..',
            '....kllk.kkllk..',
            '.......ktk..kck.',
            '.......kk....kk.',
            '................',
        ],
        [
            '................',
            '.....kwwwwwwk...',
            '....kwwwwwwwwk..',
            '...kwwwwwwwwwwk.',
            '...kwwwwwwwkKwk.',
            '...kwwwwwwwkkwk.',
            '...kwwwwwwwwkwk.',
            '....kwwwwwwwwk..',
            '....kllllllllk..',
            '....kllllllllk..',
            '.....klllllllkc.',
            '....kllllllllk..',
            '....kllk.kkllk..',
            '......ktk...kck.',
            '.......kk....kk.',
            '................',
        ],
    ],

    dog_mage_up: [
        [
            '................',
            '....kwwwwwwk....',
            '...kwwwwwwwwk...',
            '..kwwwwwwwwwwk..',
            '..kwwwwwwwwwwk..',
            '..kwwwwwwwwwwk..',
            '..kwkwwwwwwkwk..',
            '...kwwwwwwwwk...',
            '...kllllllllk...',
            '...kllllllllk...',
            '...kllclllllk...',
            '...kllllllllk...',
            '...kllkk.kklk...',
            '...ktk...kck....',
            '....kk....kk....',
            '................',
        ],
        [
            '................',
            '....kwwwwwwk....',
            '...kwwwwwwwwk...',
            '..kwwwwwwwwwwk..',
            '..kwwwwwwwwwwk..',
            '..kwwwwwwwwwwk..',
            '..kwkwwwwwwkwk..',
            '...kwwwwwwwwk...',
            '...kllllllllk...',
            '...kllllllllk...',
            '...kllclllllk...',
            '...kllllllllk...',
            '...kllkk.kklk...',
            '..ktk....kck....',
            '....kk....kk....',
            '................',
        ],
    ],

    // Rex the Husky Warrior - Gray/white husky, bulky, no armor
    dog_warrior_down: [
        [
            '................',
            '...kkkkkkkk.....',
            '..kwwwwwwwwk....',
            '.kwwwwwwwwwwk...',
            '.kwwKKkwKKwwk...',  // striking two-toned eyes
            '.kwwwkwwwkwwk...',
            '.kWWwwwwwwWWk...',  // white markings on sides
            '.kwWWwwwwWWwk...',
            '.kWwwwKwwwwWk...',  // nose
            '.kkWwwwwwwWkk...',
            '..kWwwwwwwWk....',
            '..kWWkkkkkWk....',  // shoulder/collar
            '..kwwkWWkwwk....',
            '..kwk...kwk.....',  // legs
            '..kWk...kWk.....',
            '................',
        ],
        [
            '................',
            '...kkkkkkkk.....',
            '..kwwwwwwwwk....',
            '.kwwwwwwwwwwk...',
            '.kwwKKkwKKwwk...',
            '.kwwwkwwwkwwk...',
            '.kWWwwwwwwWWk...',
            '.kwWWwwwwWWwk...',
            '.kWwwwKwwwwWk...',
            '.kkWwwwwwwWkk...',
            '..kWwwwwwwWk....',
            '..kWWkkkkkWk....',
            '..kwwkWWkwwk....',
            '.kwk....kwk.....',  // step
            '..kWk...kWk.....',
            '................',
        ],
    ],

    dog_warrior_left: [
        [
            '................',
            '..kkkkkkkk......',
            '.kwwwwwwwwk.....',
            'kwwwwwwwwwwk....',
            'kwwKKkwwwwwk....',
            'kwwwkwwwwwwk....',
            'kWWwwwwwwWWk....',
            'kwWWwwwwWWwk....',
            'kWwwwKwwwwWk....',
            'kkWwwwwwwWkk....',
            '.kWwwwwwwWk.....',
            '.kWWkkkkkWk.....',
            '.kwwkWWkwwk.....',
            '.kwk...........k',
            '.kWk............',
            '................',
        ],
        [
            '................',
            '..kkkkkkkk......',
            '.kwwwwwwwwk.....',
            'kwwwwwwwwwwk....',
            'kwwKKkwwwwwk....',
            'kwwwkwwwwwwk....',
            'kWWwwwwwwWWk....',
            'kwWWwwwwWWwk....',
            'kWwwwKwwwwWk....',
            'kkWwwwwwwWkk....',
            '.kWwwwwwwWk.....',
            '.kWWkkkkkWk.....',
            '.kwwkWWkwwk.....',
            'kwk.............',
            '.kWk............',
            '................',
        ],
    ],

    dog_warrior_right: [
        [
            '................',
            '......kkkkkkkkk.',
            '.....kwwwwwwwwk.',
            '....kwwwwwwwwwwk',
            '....kwwwwwwkKKwk',
            '....kwwwwwwwkwwk',
            '....kWWwwwwwwWWk',
            '....kwWWwwwwWWwk',
            '....kWwwwwKwwwWk',
            '....kkWwwwwwwWkk',
            '.....kWwwwwwwWk.',
            '.....kWkkkkkWWk.',
            '.....kwwkWWkwwk.',
            'k..........kwk..',
            '............kWk.',
            '................',
        ],
        [
            '................',
            '......kkkkkkkkk.',
            '.....kwwwwwwwwk.',
            '....kwwwwwwwwwwk',
            '....kwwwwwwkKKwk',
            '....kwwwwwwwkwwk',
            '....kWWwwwwwwWWk',
            '....kwWWwwwwWWwk',
            '....kWwwwwKwwwWk',
            '....kkWwwwwwwWkk',
            '.....kWwwwwwwWk.',
            '.....kWkkkkkWWk.',
            '.....kwwkWWkwwk.',
            '...........kwk..',
            '............kWk.',
            '................',
        ],
    ],

    dog_warrior_up: [
        [
            '................',
            '...kkkkkkkk.....',
            '..kwwwwwwwwk....',
            '.kwwwwwwwwwwk...',
            '.kwwwwwwwwwwk...',
            '.kwwwwwwwwwwk...',
            '.kWWwwwwwwWWk...',
            '.kwWWwwwwWWwk...',
            '.kWwwwwwwwwWk...',
            '.kkWwwwwwwWkk...',
            '..kWwwwwwwWk....',
            '..kWWkkkkkWk....',
            '..kwwkWWkwwk....',
            '..kwk...kwk.....',
            '..kWk...kWk.....',
            '................',
        ],
        [
            '................',
            '...kkkkkkkk.....',
            '..kwwwwwwwwk....',
            '.kwwwwwwwwwwk...',
            '.kwwwwwwwwwwk...',
            '.kwwwwwwwwwwk...',
            '.kWWwwwwwwWWk...',
            '.kwWWwwwwWWwk...',
            '.kWwwwwwwwwWk...',
            '.kkWwwwwwwWkk...',
            '..kWwwwwwwWk....',
            '..kWWkkkkkWk....',
            '..kwwkWWkwwk....',
            '.kwk....kwk.....',
            '..kWk...kWk.....',
            '................',
        ],
    ],

    // Daisy the Golden Retriever Healer - Golden/cream with pink bandana
    dog_healer_down: [
        [
            '................',
            '....kkkkkkkk....',
            '...ktttttttttk..',
            '...kttttttttttk.',
            '...ktppppptttk..',  // pink bandana
            '...ktttttttttk..',
            '..kttttttttttk..',
            '..kttKktKktttk..',  // gentle eyes
            '..kttttktttttk..',
            '..kttKtttttttk..',  // nose
            '..kkttttttttk...',
            '...kttttttttk...',
            '...kttkEEkttk...',  // herb pouch (green)
            '...ktk....ktk...',
            '...kbk....kbk...',
            '................',
        ],
        [
            '................',
            '....kkkkkkkk....',
            '...ktttttttttk..',
            '...kttttttttttk.',
            '...ktppppptttk..',
            '...ktttttttttk..',
            '..kttttttttttk..',
            '..kttKktKktttk..',
            '..kttttktttttk..',
            '..kttKtttttttk..',
            '..kkttttttttk...',
            '...kttttttttk...',
            '...kttkEEkttk...',
            '..ktk.....ktk...',
            '...kbk....kbk...',
            '................',
        ],
    ],

    dog_healer_left: [
        [
            '................',
            '...kkkkkkkk.....',
            '..ktttttttttk...',
            '..kttttttttttk..',
            '..ktpppppttttk..',
            '..ktttttttttttk.',
            '.kttttttttttttk.',
            '.kttKktttttttk..',
            '.kttttktttttttk.',
            '.ktttKttttttttk.',
            '.kkttttttttttk..',
            '..kttttttttttk..',
            '..kttttEEkttk...',
            '..ktk...........',
            '..kbk...........',
            '................',
        ],
        [
            '................',
            '...kkkkkkkk.....',
            '..ktttttttttk...',
            '..kttttttttttk..',
            '..ktpppppttttk..',
            '..ktttttttttttk.',
            '.kttttttttttttk.',
            '.kttKktttttttk..',
            '.kttttktttttttk.',
            '.ktttKttttttttk.',
            '.kkttttttttttk..',
            '..kttttttttttk..',
            '..kttttEEkttk...',
            '.ktk............',
            '..kbk...........',
            '................',
        ],
    ],

    dog_healer_right: [
        [
            '................',
            '.....kkkkkkkk...',
            '...ktttttttttk..',
            '..kttttttttttk..',
            '..kttttppppptk..',
            '.ktttttttttttk..',
            '.ktttttttttttttk',
            '..ktttttttttKktk',
            '.kttttttttttktttk',
            '.ktttttttttttKttk',
            '..ktttttttttttkkk',
            '..kttttttttttttk.',
            '...ktttkEEttttk..',
            '...........ktk..',
            '...........kbk..',
            '................',
        ],
        [
            '................',
            '.....kkkkkkkk...',
            '...ktttttttttk..',
            '..kttttttttttk..',
            '..kttttppppptk..',
            '.ktttttttttttk..',
            '.ktttttttttttttk',
            '..ktttttttttKktk',
            '.kttttttttttktttk',
            '.ktttttttttttKttk',
            '..ktttttttttttkkk',
            '..kttttttttttttk.',
            '...ktttkEEttttk..',
            '..........ktk...',
            '...........kbk..',
            '................',
        ],
    ],

    dog_healer_up: [
        [
            '................',
            '....kkkkkkkk....',
            '...ktttttttttk..',
            '...kttttttttttk.',
            '...kpppppppptttk',  // bandana from behind
            '...ktttttttttk..',
            '..kttttttttttk..',
            '..kttttttttttk..',
            '..kttttttttttk..',
            '..kbbbbbbbbbttk.',
            '..kkttttttttk...',
            '...kttttttttk...',
            '...kttkEEkttk...',
            '...ktk....ktk...',
            '...kbk....kbk...',
            '................',
        ],
        [
            '................',
            '....kkkkkkkk....',
            '...ktttttttttk..',
            '...kttttttttttk.',
            '...kpppppppptttk',
            '...ktttttttttk..',
            '..kttttttttttk..',
            '..kttttttttttk..',
            '..kttttttttttk..',
            '..kbbbbbbbbbttk.',
            '..kkttttttttk...',
            '...kttttttttk...',
            '...kttkEEkttk...',
            '..ktk.....ktk...',
            '...kbk....kbk...',
            '................',
        ],
    ],

    // -----------------------------------------------------------------------
    // CAT ENEMIES
    // -----------------------------------------------------------------------

    // Kitten Scout - small gray kitten, menacing slit eyes, whiskers
    cat_scout_down: [
        [
            '................',
            '................',
            '....kkkkkkkk....',
            '...kggggggggk...',
            '..kGkggggkGkk...',  // pointed ears
            '..kggggggggggk..',
            '..kggKgggKggggk.',  // slit eyes
            '..kggggggggggk..',
            '..kGgkgggkgGgk..',  // whiskers
            '..kgggkgkgggk...',  // nose
            '..kkggggggggk...',
            '...kggggggggk...',
            '...kgGkkkGgk....',
            '...kgk...kgk....',
            '...kGk...kGk....',
            '................',
        ],
        [
            '................',
            '................',
            '....kkkkkkkk....',
            '...kggggggggk...',
            '..kGkggggkGkk...',
            '..kggggggggggk..',
            '..kggKgggKggggk.',
            '..kggggggggggk..',
            '..kGgkgggkgGgk..',
            '..kgggkgkgggk...',
            '..kkggggggggk...',
            '...kggggggggk...',
            '...kgGkkkGgk....',
            '..kgk....kgk....',
            '...kGk...kGk....',
            '................',
        ],
    ],

    cat_scout_left: [
        [
            '................',
            '................',
            '...kkkkkkkk.....',
            '..kggggggggk....',
            '.kGkggggkggk....',  // ear on left
            '.kggggggggggk...',
            '.kggKgggggggk...',  // one slit eye
            '.kggggggggggk...',
            '.kGgkgggkgGgk...',
            '.kgggkgkgggk....',
            '.kkggggggggk....',
            '..kggggggggk....',
            '..kgGkkkGgk.....',
            '..kgk...........',
            '..kGk...........',
            '................',
        ],
        [
            '................',
            '................',
            '...kkkkkkkk.....',
            '..kggggggggk....',
            '.kGkggggkggk....',
            '.kggggggggggk...',
            '.kggKgggggggk...',
            '.kggggggggggk...',
            '.kGgkgggkgGgk...',
            '.kgggkgkgggk....',
            '.kkggggggggk....',
            '..kggggggggk....',
            '..kgGkkkGgk.....',
            '.kgk............',
            '..kGk...........',
            '................',
        ],
    ],

    // Tabby Soldier - orange/brown tabby, darker stripe markings, chest plate
    cat_soldier_down: [
        [
            '................',
            '....kkkkkkkk....',
            '...kooooooook...',
            '..kOkooooookOk..',  // pointed ears
            '..koooooooooook.',
            '..koKoooKoooook.',  // eyes
            '..kooooooooook..',
            '..kOokoookokOk..',  // whiskers + stripes
            '..koookokooook..',
            '..kkooooooook...',
            '...kooooooook...',
            '...kSSSSSSSk....',  // chest plate
            '...koSSSSook....',
            '...kok...kok....',
            '...kOk...kOk....',
            '................',
        ],
        [
            '................',
            '....kkkkkkkk....',
            '...kooooooook...',
            '..kOkooooookOk..',
            '..koooooooooook.',
            '..koKoooKoooook.',
            '..kooooooooook..',
            '..kOokoookokOk..',
            '..koookokooook..',
            '..kkooooooook...',
            '...kooooooook...',
            '...kSSSSSSSk....',
            '...koSSSSook....',
            '..kok....kok....',
            '...kOk...kOk....',
            '................',
        ],
    ],

    cat_soldier_left: [
        [
            '................',
            '...kkkkkkkk.....',
            '..kooooooook....',
            '.kOkooooooook...',
            '.koooooooooook..',
            '.koKoooooooook..',
            '.kooooooooook...',
            '.kOokoookokOk...',
            '.koookokooook...',
            '.kkooooooook....',
            '..kooooooook....',
            '..kSSSSSSSk.....',
            '..koSSSSook.....',
            '..kok...........',
            '..kOk...........',
            '................',
        ],
        [
            '................',
            '...kkkkkkkk.....',
            '..kooooooook....',
            '.kOkooooooook...',
            '.koooooooooook..',
            '.koKoooooooook..',
            '.kooooooooook...',
            '.kOokoookokOk...',
            '.koookokooook...',
            '.kkooooooook....',
            '..kooooooook....',
            '..kSSSSSSSk.....',
            '..koSSSSook.....',
            '.kok............',
            '..kOk...........',
            '................',
        ],
    ],

    // Fat Cat - large rotund orange cat, fills most of 16x16
    cat_heavy_down: [
        [
            '................',
            '...kkkkkkkkk....',
            '..kooooooooook..',
            '.kOkooooooooOkk.',  // pointed ears, fills wide
            '.kooooooooooook.',
            '.koKKooooKKoook.',  // beady eyes
            '.kooooooooooook.',
            '.kOokooookOookk.',  // whiskers
            '.koooKoooooooook',  // nose
            '.kooooooooooook.',
            '.kkooooooooookk.',
            '..kooooooooook..',
            '..kooooooooook..',  // big rotund belly
            '..koooooooook...',
            '..kok.....kok...',  // short stubby legs
            '..kOk.....kOk...',
        ],
        [
            '................',
            '...kkkkkkkkk....',
            '..kooooooooook..',
            '.kOkooooooooOkk.',
            '.kooooooooooook.',
            '.koKKooooKKoook.',
            '.kooooooooooook.',
            '.kOokooookOookk.',
            '.koooKoooooooook',
            '.kooooooooooook.',
            '.kkooooooooookk.',
            '..kooooooooook..',
            '..kooooooooook..',
            '.koooooooooook..',  // shifted legs
            '..kok.....kok...',
            '..kOk.....kOk...',
        ],
    ],

    cat_heavy_left: [
        [
            '................',
            '..kkkkkkkkk.....',
            '.kooooooooook...',
            'kOkooooooooook..',
            'kooooooooooook..',
            'koKKooooooooook.',
            'kooooooooooook..',
            'kOokooookooookk.',
            'koooKooooooooook',
            'kooooooooooooook',
            'kkooooooooooookk',
            '.kooooooooooook.',
            '.kooooooooooook.',
            '.koooooooooook..',
            '.kok.....kok....',
            '.kOk.....kOk....',
        ],
        [
            '................',
            '..kkkkkkkkk.....',
            '.kooooooooook...',
            'kOkooooooooook..',
            'kooooooooooook..',
            'koKKooooooooook.',
            'kooooooooooook..',
            'kOokooookooookk.',
            'koooKooooooooook',
            'kooooooooooooook',
            'kkooooooooooookk',
            '.kooooooooooook.',
            '.kooooooooooook.',
            'koooooooooooook.',
            '.kok.....kok....',
            '.kOk.....kOk....',
        ],
    ],

    // Ninja Cat - black cat with red eyes, red headband, sleek angular
    cat_boss_down: [
        [
            '................',
            '....knkknkk.....',
            '...knnnnnnnnk...',
            '..knknnnnnnknk..',  // angular pointed ears
            '..knnnnnnnnnnk..',
            '..knnrnnnnrnnk..',  // red eyes
            '..knnnnnnnnnnnk.',
            '..knnknnnnknnk..',  // whiskers (subtle)
            '..knnnRnnnnnk...',  // red nose dot
            '..kknnnnnnnnk...',
            '...knnnnnnnnk...',
            '...knnRkkknnk...',  // red headband around body
            '...knnnnnnnnk...',
            '...knk....knk...',
            '...knk....knk...',  // dark legs
            '................',
        ],
        [
            '................',
            '....knkknkk.....',
            '...knnnnnnnnk...',
            '..knknnnnnnknk..',
            '..knnnnnnnnnnk..',
            '..knnrnnnnrnnk..',
            '..knnnnnnnnnnnk.',
            '..knnknnnnknnk..',
            '..knnnRnnnnnk...',
            '..kknnnnnnnnk...',
            '...knnnnnnnnk...',
            '...knnRkkknnk...',
            '...knnnnnnnnk...',
            '..knk.....knk...',
            '...knk....knk...',
            '................',
        ],
    ],

    cat_boss_left: [
        [
            '................',
            '...knkknkk......',
            '..knnnnnnnnk....',
            '.knknnnnnnnnk...',
            '.knnnnnnnnnnk...',
            '.knnrnnnnnnnnk..',
            '.knnnnnnnnnnnk..',
            '.knnknnnnknnkk..',
            '.knnnRnnnnnk....',
            '.kknnnnnnnnk....',
            '..knnnnnnnnk....',
            '..knnRkkknnk....',
            '..knnnnnnnnk....',
            '..knk...........',
            '..knk...........',
            '................',
        ],
        [
            '................',
            '...knkknkk......',
            '..knnnnnnnnk....',
            '.knknnnnnnnnk...',
            '.knnnnnnnnnnk...',
            '.knnrnnnnnnnnk..',
            '.knnnnnnnnnnnk..',
            '.knnknnnnknnkk..',
            '.knnnRnnnnnk....',
            '.kknnnnnnnnk....',
            '..knnnnnnnnk....',
            '..knnRkkknnk....',
            '..knnnnnnnnk....',
            '.knk............',
            '..knk...........',
            '................',
        ],
    ],

    // -----------------------------------------------------------------------
    // TERRAIN TILES
    // -----------------------------------------------------------------------

    tile_grass: [
        // Variant 1
        [
            'eeeeeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eeEeeeeeeeeeeeee',
            'eeeeeeeeeeEeeeee',
            'eeeeeeeeeeeeeeee',
            'eeeeeEeeeeeeeEee',
            'eeeeeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eEeeeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eeeeeeEeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eeeeeeeeeeeEeeee',
            'eeeeeeeeeeeeeeee',
            'eeEeeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
        ],
        // Variant 2
        [
            'eeeeeeeeeeeeeeee',
            'eeeEeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eeeeeeeeeeeeeeEe',
            'eeeeEeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eeeeeeeeEeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eEeeeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eeeeeeeeeeEeeeee',
            'eeeeeeeeeeeeeeee',
            'eeeEeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eeeeeeeeeeeeEeee',
        ],
        // Variant 3 (with a flower)
        [
            'eeeeeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eeEeeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eeeeeppeeeeeeeee',  // pink flower petals
            'eeeeepypeeeeeEee',  // yellow center
            'eeeeeppeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eEeeeeeeeeeeeeee',
            'eeeeeeeeeeEeeeee',
            'eeeeeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eeeeEeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
        ],
    ],

    tile_forest: [
        // Variant 1
        [
            'eeeeEEEEEEeeeeee',
            'eeeeEEEEEEEeeeee',
            'eeeEEEEEEEEEeeee',
            'eeeEEEEEEEEEEeee',
            'eeeEEEEEEEEEEeee',
            'eeeeEEEEEEEEeeee',
            'eeeeeEEEEEeEeeee',
            'eeeeeeeEEeeeeeee',
            'eeeeeeedDeeeeeee',  // trunk
            'eeeeeedDDDeeeeee',
            'eeeeeeeeeeeeEEEE',
            'eeeeeeeeeeeeEEEE',
            'eeeeeeeeeeeeEEEE',
            'eeeeeeeeeeeeeEEE',
            'eeeeeeeeeeedDeee',
            'eeeeeeeeeeedDeee',
        ],
        // Variant 2 (two trees)
        [
            'eEEEEEeeeeeEEEee',
            'eEEEEEEeeEEEEEEe',
            'eEEEEEEEEEEEEEEe',
            'eeEEEEEEEEEEEEee',
            'eeeeEEEEEEEEeeee',
            'eeeeedDeeeeEeeee',
            'eeeeedDeeeeEEeee',
            'eeeeedDeeeeEEEee',
            'eeeeeeeeeeeEEEee',
            'eeeeeeeeeeeEEeee',
            'eeeeeeeeeeeedDeee',
            'eeeeeeeeeeedDeee',
            'eeeeeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eeeeEeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
        ],
    ],

    tile_road: [
        // Variant 1 (horizontal path)
        [
            'eeeeeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'DDDDDDDDDDDDDDdd',
            'ddddddddddddddDD',
            'ddDddddddddddddd',
            'ddddDdddddddDddd',
            'dddddddddddddDdd',
            'DdddddDddddddddd',
            'ddddddddddDddddd',
            'DDDDDDDDDDDDDDdd',
            'eeeeeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
        ],
        // Variant 2 (vertical path)
        [
            'eeeeDDddDeeeeeee',
            'eeeeDddddDeeeeeee',
            'eeeeDdDdddeeeeee',
            'eeeeDddddDeeeeeee',
            'eeeeDdddddeeeeee',
            'eeeeDddDddeeeeee',
            'eeeeDdddddeeeeee',
            'eeeeDddddDeeeeeee',
            'eeeeDdddddeeeeee',
            'eeeeDDddddeeeeee',
            'eeeeDddddDeeeeeee',
            'eeeeDdDdddeeeeee',
            'eeeeDddddDeeeeeee',
            'eeeeDdddddeeeeee',
            'eeeeDddDddeeeeee',
            'eeeeDdddddeeeeee',
        ],
    ],

    tile_water: [
        // Frame 1
        [
            'aaaaaaaaaaaaaaaa',
            'aAaaaaaaaaAaaaaa',
            'aaaAaaaaaaaaaaaa',
            'aaaaaaaaaaaAaaaa',
            'mmmmmmmmmmmmmmm.',  // wave highlight
            'aaaaaaaaaaaaaaaa',
            'aAaaaaaaaaAaaaaa',
            'aaaaaaaaaaaaaaaa',
            'aaaAaaaaaaaaaaaa',
            'mmmmmmmmmmmmmmm.',
            'aaaaaaaaaaaaaaaa',
            'aAaaaaaaaaAaaaaa',
            'aaaaaaaaaaaaaaaa',
            'aaaAaaaaaaaaaaaa',
            'mmmmmmmmmmmmmmm.',
            'aaaaaaaaaaaaaaaa',
        ],
        // Frame 2
        [
            'aaaaaaaaaaaaaaaa',
            'aaaaaAaaaaAaaaaa',
            'aaaaaaaaaaaaaaAa',
            'aAaaaaaaaaaaaaa.',
            'aaaaaaaaaaaaaaaa',
            '.mmmmmmmmmmmmmmm',
            'aaaaaaaaaaaaaaaa',
            'aaaaaAaaaaAaaaaa',
            'aaaaaaaaaaaaaaAa',
            'aAaaaaaaaaaaaaa.',
            'aaaaaaaaaaaaaaaa',
            '.mmmmmmmmmmmmmmm',
            'aaaaaaaaaaaaaaaa',
            'aaaaaAaaaaAaaaaa',
            'aaaaaaaaaaaaaaAa',
            'aAaaaaaaaaaaaaa.',
        ],
        // Frame 3
        [
            'aaaaaAaaaaAaaaaa',
            'aaaaaaaaaaaaaaaa',
            'aAaaaaaaaaaaAaaa',
            'aaaaaaaaaaaaaaaa',
            'aaaaaaaaaaaaaaaa',
            'mmmmmmmmmmmmmmm.',
            'aaaaaAaaaaAaaaaa',
            'aaaaaaaaaaaaaaaa',
            'aAaaaaaaaaaaAaaa',
            'aaaaaaaaaaaaaaaa',
            'aaaaaaaaaaaaaaaa',
            '.mmmmmmmmmmmmmmm',
            'aaaaaAaaaaAaaaaa',
            'aaaaaaaaaaaaaaaa',
            'aAaaaaaaaaaaAaaa',
            'aaaaaaaaaaaaaaaa',
        ],
    ],

    tile_mountain: [
        [
            'eeeeeeeeeeeeeeee',
            'eeeeeekkeeeeeee.',
            'eeeeeksskeeeeeee',
            'eeeeksssskeeeeee',
            'eeekssWsssk.eeee',
            'eekssWWWssskeeee',
            'ekssWWsssssskee.',
            'ekssssssssssskeee',
            'ksssssDDsssssskee',
            'kssssDDDDsssssske',
            'ksDDDDDDDDDssksse',
            'kDDDDDDDDDDDssske',
            'DDDDDDDDDDDDDDDk',
            'eeeeeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
            'eeeeeeeeeeeeeeee',
        ],
    ],

    tile_bridge: [
        [
            'aaaaaaaaaaaaaaaa',
            'aaaaaaaaaaaaaaaa',
            'kkkkkkkkkkkkkkkk',
            'DBBBBBBBBBBBBBDk',  // bridge planks
            'DbbbbbbbbbbbbDDk',
            'DBBBBBBBBBBBBBDk',
            'DbbbbbbbbbbbbDDk',
            'DBBBBBBBBBBBBBDk',
            'DbbbbbbbbbbbbDDk',
            'DBBBBBBBBBBBBBDk',
            'kkkkkkkkkkkkkkkk',
            'aaaaaaaaaaaaaaaa',
            'aaaaaaaaaaaaaaaa',
            'aaaaaaaaaaaaaaaa',
            'aaaaaaaaaaaaaaaa',
            'aaaaaaaaaaaaaaaa',
        ],
    ],

    tile_wall: [
        [
            'kkkkkkkkkkkkkkkk',
            'kSSSSSSkkSSSSSSk',  // stone blocks
            'kSSSSSSkkSSSSSSk',
            'kSSSSSSkkSSSSSSk',
            'kkkkkkkkkkkkkkkk',
            'kkSSSSSSkkSSSSSk',
            'kkSSSSSSkkSSSSSk',
            'kkSSSSSSkkSSSSSk',
            'kkkkkkkkkkkkkkkk',
            'kSSSSSSkkSSSSSSk',
            'kSSSSSSkkSSSSSSk',
            'kSSSSSSkkSSSSSSk',
            'kkkkkkkkkkkkkkkk',
            'kkSSSSSSkkSSSSSk',
            'kkSSSSSSkkSSSSSk',
            'kkkkkkkkkkkkkkkk',
        ],
    ],

    // -----------------------------------------------------------------------
    // UI SPRITES
    // -----------------------------------------------------------------------

    cursor: [
        // Frame 0 (bright)
        [
            'yyyyyyyyyyyyyyyY',
            'yk............Yy',
            'yk...........kYy',
            'yk...........kYy',
            'yk...........kYy',
            'yk...........kYy',
            'yk...........kYy',
            'yk...........kYy',
            'yk...........kYy',
            'yk...........kYy',
            'yk...........kYy',
            'yk...........kYy',
            'yk...........kYy',
            'yk...........kYy',
            'yYYYYYYYYYYYYYyY',
            'YYYYYYYYYYYYYYY.',
        ],
        // Frame 1 (dim pulse)
        [
            'YYYYYYYYYYYYYYYy',
            'Yk............yY',
            'Yk...........kyY',
            'Yk...........kyY',
            'Yk...........kyY',
            'Yk...........kyY',
            'Yk...........kyY',
            'Yk...........kyY',
            'Yk...........kyY',
            'Yk...........kyY',
            'Yk...........kyY',
            'Yk...........kyY',
            'Yk...........kyY',
            'Yk...........kyY',
            'YyyyyyyyyyyyyYyY',
            'yyyyyyyyyyyyyyy.',
        ],
    ],

    move_highlight: [
        [
            'llllllllllllllll',
            'l..............l',
            'l..............l',
            'l..............l',
            'l..............l',
            'l..............l',
            'l..............l',
            'l..............l',
            'l..............l',
            'l..............l',
            'l..............l',
            'l..............l',
            'l..............l',
            'l..............l',
            'l..............l',
            'llllllllllllllll',
        ],
    ],

    attack_highlight: [
        [
            'rrrrrrrrrrrrrrrr',
            'r..............r',
            'r..............r',
            'r..............r',
            'r..............r',
            'r..............r',
            'r..............r',
            'r..............r',
            'r..............r',
            'r..............r',
            'r..............r',
            'r..............r',
            'r..............r',
            'r..............r',
            'r..............r',
            'rrrrrrrrrrrrrrrr',
        ],
    ],

    heal_highlight: [
        [
            'eeeeeeeeeeeeeeee',
            'e..............e',
            'e..............e',
            'e..............e',
            'e..............e',
            'e..............e',
            'e..............e',
            'e..............e',
            'e..............e',
            'e..............e',
            'e..............e',
            'e..............e',
            'e..............e',
            'e..............e',
            'e..............e',
            'eeeeeeeeeeeeeeee',
        ],
    ],

    // -----------------------------------------------------------------------
    // BATTLE EFFECT SPRITES (8x8)
    // -----------------------------------------------------------------------

    fx_hit: [
        // Frame 0
        [
            '........',
            '...ww...',
            '..wWww..',
            '.wWKWww.',
            '..wWww..',
            '...ww...',
            '........',
            '........',
        ],
        // Frame 1
        [
            '..w.....',
            '.wWw...w',
            'wWKWw.wW',
            '.wWwwwWK',
            '..wwwwWw',
            '...www.w',
            '....w...',
            '........',
        ],
        // Frame 2 (fading)
        [
            '........',
            '.W......',
            '..W..W..',
            '...W....',
            '..W..W..',
            '........',
            '....W...',
            '........',
        ],
    ],

    fx_magic: [
        // Frame 0
        [
            '........',
            '...mm...',
            '..mMMm..',
            '.mMMMMm.',
            '..mMMm..',
            '...mm...',
            '........',
            '........',
        ],
        // Frame 1
        [
            '.m......',
            'mMm.m...',
            '.mMmMm..',
            '..mMMm.m',
            '.mMMmMm.',
            'mMm.mMm.',
            '..m..m..',
            '........',
        ],
        // Frame 2 (burst)
        [
            'm..m..m.',
            '.m....m.',
            '..mMm...',
            'm.MMM..m',
            '..mMm...',
            '.m....m.',
            'm..m..m.',
            '........',
        ],
    ],

    fx_heal: [
        // Frame 0
        [
            '........',
            '...pp...',
            '..pPpp..',
            '.pPepPp.',
            '..pPpp..',
            '...pp...',
            '........',
            '........',
        ],
        // Frame 1 (rising)
        [
            '...p....',
            '..pPp...',
            '.pPepPp.',
            '..ppp...',
            '...p.pp.',
            '....pPp.',
            '....pp..',
            '........',
        ],
        // Frame 2 (dispersing)
        [
            '.p..p...',
            'pPp..p..',
            '.p..pPp.',
            '......p.',
            '.p......',
            'p.p.....',
            '..p.....',
            '........',
        ],
    ],

};

// ---------------------------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Render a sprite definition (string array) to a canvas element.
 * @param {string[]} spriteDef - Array of strings, each char is a palette key
 * @param {Object} palette - Color palette mapping chars to CSS color strings
 * @param {number} scale - Pixel scale factor (e.g., 2 for 2x)
 * @returns {HTMLCanvasElement}
 */
function _renderSprite(spriteDef, palette, scale) {
    const h = spriteDef.length;
    const w = spriteDef[0].length;
    const c = document.createElement('canvas');
    c.width = w * scale;
    c.height = h * scale;
    const ctx = c.getContext('2d');
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const ch = spriteDef[y][x];
            if (ch === '.' || !palette[ch]) continue;
            ctx.fillStyle = palette[ch];
            ctx.fillRect(x * scale, y * scale, scale, scale);
        }
    }
    return c;
}

/**
 * Build a complete sprite cache at a given scale factor.
 * Sprites with multiple frames/variants are returned as arrays of canvases.
 * Single sprites are returned as a single canvas.
 * @param {number} scale - Pixel scale factor
 * @returns {Object} - Map of sprite key to canvas or array of canvases
 */
function buildTacticsSpriteCache(scale) {
    const cache = {};
    for (const [key, def] of Object.entries(TACTICS_SPRITES)) {
        if (Array.isArray(def[0])) {
            // Multiple frames/variants (array of string arrays)
            cache[key] = def.map(frame => _renderSprite(frame, TACTICS_PALETTE, scale));
        } else {
            // Single sprite (string array)
            cache[key] = _renderSprite(def, TACTICS_PALETTE, scale);
        }
    }
    return cache;
}

/**
 * Get a specific frame canvas from the cache.
 * @param {Object} cache - Sprite cache from buildTacticsSpriteCache
 * @param {string} key - Sprite key (e.g., 'dog_knight_down')
 * @param {number} [frame=0] - Frame index for animated sprites
 * @returns {HTMLCanvasElement|null}
 */
function getTacticsSprite(cache, key, frame) {
    frame = frame || 0;
    const entry = cache[key];
    if (!entry) return null;
    if (Array.isArray(entry)) {
        return entry[frame % entry.length] || null;
    }
    return entry;
}

// Expose as globals (for non-module use in browser)
if (typeof window !== 'undefined') {
    window.TACTICS_PALETTE = TACTICS_PALETTE;
    window.TACTICS_SPRITES = TACTICS_SPRITES;
    window.buildTacticsSpriteCache = buildTacticsSpriteCache;
    window.getTacticsSprite = getTacticsSprite;
    window._renderSprite = _renderSprite;
}

// CommonJS / module export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TACTICS_PALETTE,
        TACTICS_SPRITES,
        buildTacticsSpriteCache,
        getTacticsSprite,
        _renderSprite,
    };
}
