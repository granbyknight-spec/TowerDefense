'use strict';
// =============================================================================
// Puppy Force — SpriteSheet.js
// Inline SVG sprite definitions for all unit archetypes.
// Each sprite is a 64x64 SVG encoded as a data URI so Phaser can load it
// as a texture with no external network requests.
// =============================================================================

// ---------------------------------------------------------------------------
// Helper: convert an SVG string to a data URI Phaser can use with
//   this.load.image(key, svgDataURI)
// ---------------------------------------------------------------------------
function svgToDataURI(svgStr) {
  // Use base64 encoding to avoid any UTF-8 / special-char issues in data URIs
  const b64 = btoa(unescape(encodeURIComponent(svgStr)));
  return 'data:image/svg+xml;base64,' + b64;
}

// ---------------------------------------------------------------------------
// SVG builder helpers (all sprites are 64×64 px)
// ---------------------------------------------------------------------------
const S = 64; // sprite size

function makeSVG(content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
${content}
</svg>`;
}

// ============================================================================
// PLAYER (DOG) SPRITES — heroic / cute anime style
// ============================================================================

// Generic dog head with ears — accepts colour options
function dogFaceSVG({
  bodyFill   = '#e8c88a',  // fur colour
  bodyStroke = '#8b5e3c',  // outline
  earFill    = '#d4a873',  // ear fill
  noseFill   = '#4a2a1a',  // nose
  eyeColor   = '#2a1a0a',  // iris
  eyeShine   = '#ffffff',
  cheekColor = '#f5a0a0',  // blush
  accessory  = '',         // extra SVG element string
} = {}) {
  return makeSVG(`
  <!-- head -->
  <ellipse cx="32" cy="35" rx="22" ry="20" fill="${bodyFill}" stroke="${bodyStroke}" stroke-width="2"/>
  <!-- left ear -->
  <ellipse cx="14" cy="20" rx="8" ry="12" fill="${earFill}" stroke="${bodyStroke}" stroke-width="2" transform="rotate(-15 14 20)"/>
  <!-- right ear -->
  <ellipse cx="50" cy="20" rx="8" ry="12" fill="${earFill}" stroke="${bodyStroke}" stroke-width="2" transform="rotate(15 50 20)"/>
  <!-- inner ear left -->
  <ellipse cx="14" cy="21" rx="4" ry="7" fill="#f0b0b0" transform="rotate(-15 14 21)"/>
  <!-- inner ear right -->
  <ellipse cx="50" cy="21" rx="4" ry="7" fill="#f0b0b0" transform="rotate(15 50 21)"/>
  <!-- left eye white -->
  <ellipse cx="24" cy="33" rx="7" ry="7.5" fill="#ffffff" stroke="${bodyStroke}" stroke-width="1.5"/>
  <!-- right eye white -->
  <ellipse cx="40" cy="33" rx="7" ry="7.5" fill="#ffffff" stroke="${bodyStroke}" stroke-width="1.5"/>
  <!-- left iris -->
  <circle cx="25" cy="34" r="4.5" fill="${eyeColor}"/>
  <!-- right iris -->
  <circle cx="41" cy="34" r="4.5" fill="${eyeColor}"/>
  <!-- left pupil -->
  <circle cx="25" cy="34" r="2.5" fill="#000000"/>
  <!-- right pupil -->
  <circle cx="41" cy="34" r="2.5" fill="#000000"/>
  <!-- eye shine left -->
  <circle cx="27" cy="32" r="1.5" fill="${eyeShine}"/>
  <!-- eye shine right -->
  <circle cx="43" cy="32" r="1.5" fill="${eyeShine}"/>
  <!-- muzzle -->
  <ellipse cx="32" cy="43" rx="10" ry="7" fill="#f5dcb0" stroke="${bodyStroke}" stroke-width="1.5"/>
  <!-- nose -->
  <ellipse cx="32" cy="40" rx="4" ry="3" fill="${noseFill}"/>
  <!-- mouth -->
  <path d="M 29 44 Q 32 47 35 44" stroke="${bodyStroke}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <!-- left cheek blush -->
  <ellipse cx="18" cy="40" rx="5" ry="3" fill="${cheekColor}" opacity="0.6"/>
  <!-- right cheek blush -->
  <ellipse cx="46" cy="40" rx="5" ry="3" fill="${cheekColor}" opacity="0.6"/>
  ${accessory}
`);
}

// --- PUPPY_KNIGHT: golden fur, blue knight helmet visor on forehead ---
const PUPPY_KNIGHT_SVG = dogFaceSVG({
  bodyFill: '#e8c060',
  bodyStroke: '#7a5020',
  earFill: '#c8a050',
  noseFill: '#3a1a08',
  eyeColor: '#1a4a8a',
  cheekColor: '#f8a050',
  accessory: `
  <!-- knight visor band -->
  <rect x="10" y="14" width="44" height="9" rx="4" fill="#5578cc" stroke="#223388" stroke-width="1.5" opacity="0.9"/>
  <!-- visor slots -->
  <rect x="18" y="15" width="6" height="7" rx="1" fill="#1a2255" opacity="0.8"/>
  <rect x="27" y="15" width="6" height="7" rx="1" fill="#1a2255" opacity="0.8"/>
  <rect x="36" y="15" width="6" height="7" rx="1" fill="#1a2255" opacity="0.8"/>
  <!-- plume -->
  <ellipse cx="32" cy="9" rx="7" ry="5" fill="#cc3344" opacity="0.95"/>
  `,
});

// --- CORGI_HEALER: cream/white fur, green healer cross on forehead ---
const CORGI_HEALER_SVG = dogFaceSVG({
  bodyFill: '#f8e8c0',
  bodyStroke: '#c09040',
  earFill: '#e8c880',
  noseFill: '#3a1a08',
  eyeColor: '#228844',
  cheekColor: '#f0b0c0',
  accessory: `
  <!-- staff / healer cross on head -->
  <rect x="29" y="4" width="6" height="14" rx="2" fill="#44cc66" stroke="#228844" stroke-width="1"/>
  <rect x="24" y="7" width="16" height="5" rx="2" fill="#44cc66" stroke="#228844" stroke-width="1"/>
  <!-- sparkle dots -->
  <circle cx="18" cy="8" r="2" fill="#88ffaa" opacity="0.8"/>
  <circle cx="46" cy="8" r="2" fill="#88ffaa" opacity="0.8"/>
  `,
});

// --- LABRADOR_SCOUT: dark gold, bandana around head ---
const LABRADOR_SCOUT_SVG = dogFaceSVG({
  bodyFill: '#c8a040',
  bodyStroke: '#7a5020',
  earFill: '#b89030',
  noseFill: '#2a0e04',
  eyeColor: '#8b4513',
  cheekColor: '#e8a060',
  accessory: `
  <!-- scout bandana -->
  <path d="M 8 18 Q 32 8 56 18 L 56 24 Q 32 15 8 24 Z" fill="#cc4422" stroke="#882211" stroke-width="1" opacity="0.9"/>
  <!-- bandana knot right -->
  <ellipse cx="55" cy="21" rx="5" ry="3" fill="#cc4422" stroke="#882211" stroke-width="1" transform="rotate(30 55 21)"/>
  `,
});

// --- BEAGLE_ARCHER: tricolor (black/white/brown), quiver hint on side ---
const BEAGLE_ARCHER_SVG = dogFaceSVG({
  bodyFill: '#e8d0a0',
  bodyStroke: '#6a4020',
  earFill: '#3a2a1a',
  noseFill: '#2a1408',
  eyeColor: '#5a2a0a',
  cheekColor: '#e09070',
  accessory: `
  <!-- dark saddle patch on top of head -->
  <ellipse cx="32" cy="17" rx="18" ry="9" fill="#3a2a1a" opacity="0.85"/>
  <!-- archery scope / visor line -->
  <rect x="22" y="13" width="20" height="5" rx="2" fill="#557722" stroke="#334411" stroke-width="1" opacity="0.9"/>
  <!-- arrow fletching on side -->
  <line x1="54" y1="14" x2="54" y2="28" stroke="#885522" stroke-width="2"/>
  <path d="M 51 15 L 54 12 L 57 15" fill="#cc6633"/>
  `,
});

// --- POODLE_MAGE: lavender/pink poodle curls, star on forehead ---
const POODLE_MAGE_SVG = dogFaceSVG({
  bodyFill: '#e0c8e8',
  bodyStroke: '#8855aa',
  earFill: '#cc99dd',
  noseFill: '#441155',
  eyeColor: '#6622aa',
  cheekColor: '#f0a0d0',
  accessory: `
  <!-- poodle puff curls on head -->
  <circle cx="20" cy="13" r="7" fill="#cc88dd" stroke="#8855aa" stroke-width="1.5"/>
  <circle cx="32" cy="9" r="8" fill="#cc88dd" stroke="#8855aa" stroke-width="1.5"/>
  <circle cx="44" cy="13" r="7" fill="#cc88dd" stroke="#8855aa" stroke-width="1.5"/>
  <!-- magic star on forehead -->
  <polygon points="32,13 34,18 39,18 35,21 37,26 32,23 27,26 29,21 25,18 30,18" fill="#f8d030" stroke="#cc8800" stroke-width="1" opacity="0.95"/>
  `,
});

// --- BULLDOG_TANK: grey stocky face, spiked collar, stern brows ---
const BULLDOG_TANK_SVG = dogFaceSVG({
  bodyFill: '#b0a898',
  bodyStroke: '#605850',
  earFill: '#989088',
  noseFill: '#201810',
  eyeColor: '#2a1a08',
  cheekColor: '#c09080',
  accessory: `
  <!-- stern angry eyebrows -->
  <rect x="16" y="25" width="12" height="3" rx="1" fill="#404040" transform="rotate(-10 22 26)"/>
  <rect x="36" y="25" width="12" height="3" rx="1" fill="#404040" transform="rotate(10 42 26)"/>
  <!-- spiked collar -->
  <rect x="8" y="50" width="48" height="7" rx="2" fill="#2a2a2a" stroke="#444444" stroke-width="1"/>
  <polygon points="14,50 16,44 18,50" fill="#888888"/>
  <polygon points="22,50 24,44 26,50" fill="#888888"/>
  <polygon points="30,50 32,44 34,50" fill="#888888"/>
  <polygon points="38,50 40,44 42,50" fill="#888888"/>
  <polygon points="46,50 48,44 50,50" fill="#888888"/>
  <!-- wrinkle lines on forehead -->
  <line x1="28" y1="19" x2="36" y2="19" stroke="#808080" stroke-width="1.5" opacity="0.7"/>
  <line x1="26" y1="22" x2="38" y2="22" stroke="#808080" stroke-width="1" opacity="0.5"/>
  `,
});

// --- HUSKY_RIDER: husky blue eyes, mask pattern, sled harness ---
const HUSKY_RIDER_SVG = dogFaceSVG({
  bodyFill: '#d8d0c8',
  bodyStroke: '#585050',
  earFill: '#404040',
  noseFill: '#201010',
  eyeColor: '#2266cc',
  cheekColor: '#e8e0d8',
  accessory: `
  <!-- husky mask markings (dark saddle) -->
  <ellipse cx="32" cy="20" rx="20" ry="12" fill="#3a3a3a" opacity="0.7"/>
  <!-- white face stripe -->
  <ellipse cx="32" cy="28" rx="8" ry="6" fill="#f0ece8" opacity="0.9"/>
  <!-- harness straps -->
  <path d="M 10 46 Q 32 42 54 46" stroke="#cc8822" stroke-width="3" fill="none" stroke-linecap="round"/>
  <line x1="32" y1="42" x2="32" y2="52" stroke="#cc8822" stroke-width="3"/>
  <!-- blue eye highlight (husky trait) -->
  <circle cx="25" cy="32" r="2" fill="#aaccff" opacity="0.5"/>
  <circle cx="41" cy="32" r="2" fill="#aaccff" opacity="0.5"/>
  `,
});

// --- TERRIER_THIEF: rust/red fur, eye mask like a thief ---
const TERRIER_THIEF_SVG = dogFaceSVG({
  bodyFill: '#c8704a',
  bodyStroke: '#8a4020',
  earFill: '#b05030',
  noseFill: '#2a1008',
  eyeColor: '#aa4400',
  cheekColor: '#e08060',
  accessory: `
  <!-- eye mask -->
  <rect x="13" y="28" width="38" height="10" rx="5" fill="#1a1a1a" opacity="0.85"/>
  <!-- mask eye cutouts -->
  <ellipse cx="24" cy="33" rx="7" ry="6" fill="none" stroke="#333333" stroke-width="0"/>
  <ellipse cx="40" cy="33" rx="7" ry="6" fill="none" stroke="#333333" stroke-width="0"/>
  <!-- dagger ear accessory -->
  <polygon points="48,4 52,14 44,14" fill="#cccccc" stroke="#666666" stroke-width="1"/>
  <!-- jaunty scarf -->
  <path d="M 10 50 Q 32 46 54 50 L 56 55 Q 32 52 8 55 Z" fill="#cc2244" stroke="#881122" stroke-width="1"/>
  `,
});

// --- DOG PALADIN (promoted PUPPY_KNIGHT): gold armour, wings ---
const DOG_PALADIN_SVG = dogFaceSVG({
  bodyFill: '#f0c840',
  bodyStroke: '#886600',
  earFill: '#d8a820',
  noseFill: '#3a1a08',
  eyeColor: '#1a3a88',
  cheekColor: '#f8b050',
  accessory: `
  <!-- gold helm -->
  <rect x="8" y="8" width="48" height="16" rx="6" fill="#f0c840" stroke="#886600" stroke-width="2"/>
  <!-- helm plume -->
  <ellipse cx="32" cy="6" rx="10" ry="6" fill="#4466ff" opacity="0.9"/>
  <!-- cross on helm -->
  <rect x="29" y="10" width="6" height="12" rx="1" fill="#ffffff" opacity="0.8"/>
  <rect x="23" y="13" width="18" height="5" rx="1" fill="#ffffff" opacity="0.8"/>
  <!-- wing hints -->
  <path d="M 6 22 Q 2 12 10 10 Q 8 18 12 22 Z" fill="#f8f8ff" stroke="#cccccc" stroke-width="1"/>
  <path d="M 58 22 Q 62 12 54 10 Q 56 18 52 22 Z" fill="#f8f8ff" stroke="#cccccc" stroke-width="1"/>
  `,
});

// ============================================================================
// ENEMY (CAT) SPRITES — menacing / anime villain style
// ============================================================================

function catFaceSVG({
  bodyFill   = '#b0a898',
  bodyStroke = '#504840',
  earFill    = '#d0c0b0',
  noseFill   = '#6a2244',
  eyeColor   = '#228822',
  pupilColor = '#000000',
  cheekColor = '#cc6688',
  accessory  = '',
} = {}) {
  return makeSVG(`
  <!-- head — cats have more angular heads -->
  <ellipse cx="32" cy="36" rx="21" ry="19" fill="${bodyFill}" stroke="${bodyStroke}" stroke-width="2"/>
  <!-- left pointed ear -->
  <polygon points="12,24 8,6 22,18" fill="${earFill}" stroke="${bodyStroke}" stroke-width="2"/>
  <!-- right pointed ear -->
  <polygon points="52,24 56,6 42,18" fill="${earFill}" stroke="${bodyStroke}" stroke-width="2"/>
  <!-- inner ear left -->
  <polygon points="14,22 11,10 21,19" fill="#f0a0a0" opacity="0.7"/>
  <!-- inner ear right -->
  <polygon points="50,22 53,10 43,19" fill="#f0a0a0" opacity="0.7"/>
  <!-- angular brow lines (menacing) -->
  <line x1="16" y1="27" x2="27" y2="30" stroke="${bodyStroke}" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="48" y1="27" x2="37" y2="30" stroke="${bodyStroke}" stroke-width="2.5" stroke-linecap="round"/>
  <!-- left eye (slit pupil) -->
  <ellipse cx="24" cy="34" rx="7" ry="7" fill="${eyeColor}" stroke="${bodyStroke}" stroke-width="1.5"/>
  <!-- right eye (slit pupil) -->
  <ellipse cx="40" cy="34" rx="7" ry="7" fill="${eyeColor}" stroke="${bodyStroke}" stroke-width="1.5"/>
  <!-- slit pupils -->
  <ellipse cx="24" cy="34" rx="2" ry="5.5" fill="${pupilColor}"/>
  <ellipse cx="40" cy="34" rx="2" ry="5.5" fill="${pupilColor}"/>
  <!-- eye shine left -->
  <circle cx="22" cy="31" r="1.5" fill="#ffffff" opacity="0.8"/>
  <!-- eye shine right -->
  <circle cx="38" cy="31" r="1.5" fill="#ffffff" opacity="0.8"/>
  <!-- muzzle -->
  <ellipse cx="32" cy="43" rx="9" ry="6" fill="#d8c8b8" stroke="${bodyStroke}" stroke-width="1"/>
  <!-- nose (small, cat-like) -->
  <polygon points="32,40 29,43 35,43" fill="${noseFill}"/>
  <!-- whiskers left -->
  <line x1="8"  y1="41" x2="24" y2="43" stroke="${bodyStroke}" stroke-width="1" opacity="0.6"/>
  <line x1="8"  y1="44" x2="24" y2="44" stroke="${bodyStroke}" stroke-width="1" opacity="0.6"/>
  <line x1="8"  y1="47" x2="24" y2="45" stroke="${bodyStroke}" stroke-width="1" opacity="0.6"/>
  <!-- whiskers right -->
  <line x1="56" y1="41" x2="40" y2="43" stroke="${bodyStroke}" stroke-width="1" opacity="0.6"/>
  <line x1="56" y1="44" x2="40" y2="44" stroke="${bodyStroke}" stroke-width="1" opacity="0.6"/>
  <line x1="56" y1="47" x2="40" y2="45" stroke="${bodyStroke}" stroke-width="1" opacity="0.6"/>
  <!-- mouth frown -->
  <path d="M 29 47 Q 32 44 35 47" stroke="${bodyStroke}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  ${accessory}
`);
}

// --- SCOUT_CAT: orange tabby, simple ---
const SCOUT_CAT_SVG = catFaceSVG({
  bodyFill: '#e8a040',
  bodyStroke: '#884400',
  earFill: '#cc8030',
  noseFill: '#aa2244',
  eyeColor: '#22aa44',
  accessory: `
  <!-- tabby stripes on head -->
  <line x1="26" y1="17" x2="26" y2="24" stroke="#aa5500" stroke-width="2" opacity="0.6"/>
  <line x1="32" y1="15" x2="32" y2="22" stroke="#aa5500" stroke-width="2" opacity="0.6"/>
  <line x1="38" y1="17" x2="38" y2="24" stroke="#aa5500" stroke-width="2" opacity="0.6"/>
  `,
});

// --- ALLEY_CAT (boss): dark grey, scar over eye, tough look ---
const ALLEY_CAT_SVG = catFaceSVG({
  bodyFill: '#888880',
  bodyStroke: '#333330',
  earFill: '#606058',
  noseFill: '#881122',
  eyeColor: '#cc4400',
  pupilColor: '#1a0000',
  accessory: `
  <!-- scar over left eye -->
  <line x1="18" y1="28" x2="30" y2="40" stroke="#cc2222" stroke-width="2.5" opacity="0.9" stroke-linecap="round"/>
  <!-- boss crown -->
  <polygon points="20,12 26,4 32,10 38,4 44,12" fill="#cc2222" stroke="#881111" stroke-width="1.5"/>
  <!-- crown gems -->
  <circle cx="26" cy="8" r="2" fill="#ff8888"/>
  <circle cx="32" cy="6" r="2.5" fill="#ffaa00"/>
  <circle cx="38" cy="8" r="2" fill="#ff8888"/>
  `,
});

// --- SIAMESE_ASSASSIN: cream/dark siamese, ninja mask ---
const SIAMESE_ASSASSIN_SVG = catFaceSVG({
  bodyFill: '#e8dcc8',
  bodyStroke: '#604030',
  earFill: '#8a6040',
  noseFill: '#aa2244',
  eyeColor: '#0088cc',
  accessory: `
  <!-- dark siamese points on face -->
  <ellipse cx="32" cy="18" rx="14" ry="8" fill="#7a5030" opacity="0.7"/>
  <!-- ninja mask (lower half) -->
  <rect x="10" y="42" width="44" height="14" rx="4" fill="#1a1a1a" opacity="0.85"/>
  <!-- slitted eye glow -->
  <ellipse cx="24" cy="34" rx="7" ry="2" fill="#00ccff" opacity="0.3"/>
  <ellipse cx="40" cy="34" rx="7" ry="2" fill="#00ccff" opacity="0.3"/>
  `,
});

// --- PERSIAN_SORCERER: grey/white persian, fancy gem on forehead ---
const PERSIAN_SORCERER_SVG = catFaceSVG({
  bodyFill: '#d8d0c8',
  bodyStroke: '#605850',
  earFill: '#c0b8b0',
  noseFill: '#883366',
  eyeColor: '#aa00cc',
  accessory: `
  <!-- persian fluffy ruff (neck fur) -->
  <ellipse cx="32" cy="54" rx="22" ry="8" fill="#e8e0d8" stroke="#a09088" stroke-width="1.5"/>
  <!-- fancy gem on forehead -->
  <polygon points="32,12 36,18 32,22 28,18" fill="#aa00ff" stroke="#660099" stroke-width="1"/>
  <circle cx="32" cy="17" r="3" fill="#ff44ff" opacity="0.6"/>
  <!-- magical eye glow -->
  <ellipse cx="24" cy="34" rx="8" ry="8" fill="#8800cc" opacity="0.25"/>
  <ellipse cx="40" cy="34" rx="8" ry="8" fill="#8800cc" opacity="0.25"/>
  `,
});

// --- TIGER_GENERAL: orange/black tiger, military helmet ---
const TIGER_GENERAL_SVG = catFaceSVG({
  bodyFill: '#e88030',
  bodyStroke: '#884400',
  earFill: '#cc6020',
  noseFill: '#aa2244',
  eyeColor: '#cc8800',
  accessory: `
  <!-- tiger stripes on face -->
  <line x1="12" y1="30" x2="22" y2="38" stroke="#333300" stroke-width="3" opacity="0.7" stroke-linecap="round"/>
  <line x1="10" y1="37" x2="20" y2="40" stroke="#333300" stroke-width="2" opacity="0.5" stroke-linecap="round"/>
  <line x1="54" y1="30" x2="44" y2="38" stroke="#333300" stroke-width="3" opacity="0.7" stroke-linecap="round"/>
  <line x1="56" y1="37" x2="46" y2="40" stroke="#333300" stroke-width="2" opacity="0.5" stroke-linecap="round"/>
  <!-- general helmet -->
  <rect x="10" y="8" width="44" height="15" rx="5" fill="#666600" stroke="#444400" stroke-width="2"/>
  <rect x="14" y="8" width="36" height="6" rx="3" fill="#888800" stroke="#555500" stroke-width="1"/>
  <!-- plume -->
  <ellipse cx="32" cy="5" rx="8" ry="5" fill="#ff4400" opacity="0.9"/>
  `,
});

// --- LYNX_RANGER (boss): spotted grey/beige, ranger hat ---
const LYNX_RANGER_SVG = catFaceSVG({
  bodyFill: '#c8b898',
  bodyStroke: '#706050',
  earFill: '#a89070',
  noseFill: '#882244',
  eyeColor: '#226688',
  accessory: `
  <!-- lynx spots -->
  <circle cx="20" cy="22" r="3" fill="#907060" opacity="0.6"/>
  <circle cx="26" cy="19" r="2.5" fill="#907060" opacity="0.5"/>
  <circle cx="44" cy="22" r="3" fill="#907060" opacity="0.6"/>
  <circle cx="38" cy="19" r="2.5" fill="#907060" opacity="0.5"/>
  <!-- boss crown with arrow motif -->
  <polygon points="20,13 26,5 32,11 38,5 44,13" fill="#228866" stroke="#115533" stroke-width="1.5"/>
  <line x1="32" y1="5" x2="32" y2="13" stroke="#88ffaa" stroke-width="1.5"/>
  <!-- tufted ear tips (lynx trait) -->
  <line x1="9" y1="7" x2="13" y2="2" stroke="${'#706050'}" stroke-width="2"/>
  <line x1="55" y1="7" x2="51" y2="2" stroke="${'#706050'}" stroke-width="2"/>
  `,
});

// --- SNOW_LEOPARD (boss): white/grey spots, ice crown ---
const SNOW_LEOPARD_SVG = catFaceSVG({
  bodyFill: '#e8e8f0',
  bodyStroke: '#607080',
  earFill: '#d0d0e0',
  noseFill: '#664488',
  eyeColor: '#4488cc',
  accessory: `
  <!-- leopard rosette spots -->
  <circle cx="20" cy="22" r="4" fill="#aaaacc" opacity="0.5"/>
  <circle cx="20" cy="22" r="2" fill="#8888aa" opacity="0.7"/>
  <circle cx="44" cy="22" r="4" fill="#aaaacc" opacity="0.5"/>
  <circle cx="44" cy="22" r="2" fill="#8888aa" opacity="0.7"/>
  <!-- ice crown -->
  <polygon points="20,14 26,4 32,12 38,4 44,14" fill="#88ccff" stroke="#4488cc" stroke-width="1.5" opacity="0.9"/>
  <!-- ice crystal shards -->
  <polygon points="32,4 30,10 34,10" fill="#cceeFF" opacity="0.9"/>
  <polygon points="26,6 24,12 28,12" fill="#cceeFF" opacity="0.7"/>
  <polygon points="38,6 36,12 40,12" fill="#cceeFF" opacity="0.7"/>
  `,
});

// --- RIVER_PANTHER (boss): black/dark blue, wave markings ---
const RIVER_PANTHER_SVG = catFaceSVG({
  bodyFill: '#303050',
  bodyStroke: '#101020',
  earFill: '#202040',
  noseFill: '#000080',
  eyeColor: '#00aacc',
  accessory: `
  <!-- dark with subtle spots -->
  <circle cx="22" cy="26" r="4" fill="#202040" opacity="0.7"/>
  <circle cx="42" cy="26" r="4" fill="#202040" opacity="0.7"/>
  <!-- wave crown -->
  <path d="M 16 14 Q 20 8 26 12 Q 32 6 38 12 Q 44 8 48 14" stroke="#00aacc" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- teal eye glow -->
  <ellipse cx="24" cy="34" rx="8" ry="8" fill="#00aacc" opacity="0.2"/>
  <ellipse cx="40" cy="34" rx="8" ry="8" fill="#00aacc" opacity="0.2"/>
  <!-- water drips down chin -->
  <ellipse cx="28" cy="54" rx="2" ry="4" fill="#0088cc" opacity="0.6"/>
  <ellipse cx="36" cy="56" rx="2" ry="3" fill="#0088cc" opacity="0.5"/>
  `,
});

// --- SAND_CAT_KING (boss): sandy yellow, pharaoh headdress ---
const SAND_CAT_KING_SVG = catFaceSVG({
  bodyFill: '#d8b870',
  bodyStroke: '#886630',
  earFill: '#c8a050',
  noseFill: '#882200',
  eyeColor: '#cc6600',
  accessory: `
  <!-- pharaoh headdress -->
  <rect x="10" y="6" width="44" height="20" rx="4" fill="#d4a030" stroke="#886620" stroke-width="1.5"/>
  <!-- stripes on headdress -->
  <rect x="10" y="9"  width="44" height="3" fill="#2244aa" opacity="0.7"/>
  <rect x="10" y="15" width="44" height="3" fill="#2244aa" opacity="0.7"/>
  <rect x="10" y="21" width="44" height="3" fill="#2244aa" opacity="0.7"/>
  <!-- uraeus serpent -->
  <path d="M 32 6 Q 32 2 36 2 Q 40 2 40 6 Q 40 8 36 8" stroke="#44aa44" stroke-width="2" fill="none"/>
  <circle cx="36" cy="3" r="2" fill="#44aa44"/>
  `,
});

// --- PERSIAN_QUEEN (boss): white/cream, queen crown, gem eyes ---
const PERSIAN_QUEEN_SVG = catFaceSVG({
  bodyFill: '#f0e8e0',
  bodyStroke: '#886688',
  earFill: '#e0d0d8',
  noseFill: '#cc2266',
  eyeColor: '#cc44aa',
  accessory: `
  <!-- persian ruff -->
  <ellipse cx="32" cy="56" rx="26" ry="10" fill="#f0e0f0" stroke="#cc88cc" stroke-width="1.5"/>
  <!-- queen crown -->
  <polygon points="14,18 20,6 26,14 32,4 38,14 44,6 50,18" fill="#f8d030" stroke="#cc9900" stroke-width="2"/>
  <!-- crown gems -->
  <circle cx="20" cy="10" r="2.5" fill="#ff44aa"/>
  <circle cx="32" cy="6" r="3" fill="#ff44aa"/>
  <circle cx="44" cy="10" r="2.5" fill="#ff44aa"/>
  <!-- jewel teardrop under eye right -->
  <polygon points="40,43 38,48 42,48" fill="#ff44aa" opacity="0.7"/>
  `,
});

// --- CAT_EMPEROR (final boss): dark purple, enormous crown ---
const CAT_EMPEROR_SVG = catFaceSVG({
  bodyFill: '#4a2060',
  bodyStroke: '#1a0030',
  earFill: '#3a1050',
  noseFill: '#cc0044',
  eyeColor: '#ff2200',
  pupilColor: '#440000',
  cheekColor: '#880044',
  accessory: `
  <!-- emperor crown (huge) -->
  <polygon points="8,20 14,4 22,14 32,2 42,14 50,4 56,20" fill="#8800cc" stroke="#440088" stroke-width="2"/>
  <!-- crown gems row -->
  <circle cx="14" cy="8"  r="3" fill="#ff00ff"/>
  <circle cx="22" cy="12" r="2" fill="#ffaa00"/>
  <circle cx="32" cy="4"  r="4" fill="#ff2200"/>
  <circle cx="42" cy="12" r="2" fill="#ffaa00"/>
  <circle cx="50" cy="8"  r="3" fill="#ff00ff"/>
  <!-- crown highlights -->
  <polygon points="32,2 30,8 34,8" fill="#ffccff" opacity="0.5"/>
  <!-- evil aura glow circles -->
  <circle cx="24" cy="34" r="9" fill="#ff0000" opacity="0.15"/>
  <circle cx="40" cy="34" r="9" fill="#ff0000" opacity="0.15"/>
  <!-- ominous marking between eyes -->
  <polygon points="32,26 30,30 34,30" fill="#ff4400" opacity="0.6"/>
  `,
});

// ============================================================================
// NEUTRAL / ALLY SPRITES
// ============================================================================

// --- OTTER_ALLY: cute otter face ---
const OTTER_ALLY_SVG = dogFaceSVG({
  bodyFill: '#8a6040',
  bodyStroke: '#5a3020',
  earFill: '#7a5030',
  noseFill: '#2a1008',
  eyeColor: '#3a2010',
  cheekColor: '#c08060',
  accessory: `
  <!-- otter white cheek patches -->
  <ellipse cx="20" cy="38" rx="7" ry="5" fill="#f0e8d8" opacity="0.8"/>
  <ellipse cx="44" cy="38" rx="7" ry="5" fill="#f0e8d8" opacity="0.8"/>
  <!-- friendly wave / greeting hat -->
  <rect x="18" y="4" width="28" height="12" rx="4" fill="#2266aa" stroke="#114488" stroke-width="1.5"/>
  <rect x="14" y="13" width="36" height="5" rx="2" fill="#2266aa" stroke="#114488" stroke-width="1"/>
  `,
});

// --- FOX_SCOUT ally: fox face ---
const FOX_SCOUT_SVG = dogFaceSVG({
  bodyFill: '#d46030',
  bodyStroke: '#8a3010',
  earFill: '#c05020',
  noseFill: '#2a1008',
  eyeColor: '#aa6600',
  cheekColor: '#e08060',
  accessory: `
  <!-- white muzzle extension (fox trait) -->
  <ellipse cx="32" cy="44" rx="11" ry="8" fill="#f0ece8" opacity="0.9"/>
  <!-- black ear tips -->
  <polygon points="14,24 8,6 20,16" fill="#1a1a1a" opacity="0.7"/>
  <polygon points="50,24 56,6 44,16" fill="#1a1a1a" opacity="0.7"/>
  <!-- bushy tail hint -->
  <ellipse cx="56" cy="50" rx="8" ry="12" fill="#d46030" stroke="#8a3010" stroke-width="1" transform="rotate(-20 56 50)"/>
  <ellipse cx="57" cy="49" rx="4" ry="6" fill="#f0ece8" opacity="0.7" transform="rotate(-20 57 49)"/>
  `,
});

// ============================================================================
// SPRITE REGISTRY — maps unit IDs to { key, dataURI }
// ============================================================================

const UNIT_SPRITES = {
  // Player heroes
  PUPPY_KNIGHT:    { key: 'spr_puppy_knight',    svg: PUPPY_KNIGHT_SVG    },
  CORGI_HEALER:    { key: 'spr_corgi_healer',    svg: CORGI_HEALER_SVG    },
  LABRADOR_SCOUT:  { key: 'spr_labrador_scout',  svg: LABRADOR_SCOUT_SVG  },
  BEAGLE_ARCHER:   { key: 'spr_beagle_archer',   svg: BEAGLE_ARCHER_SVG   },
  POODLE_MAGE:     { key: 'spr_poodle_mage',     svg: POODLE_MAGE_SVG     },
  BULLDOG_TANK:    { key: 'spr_bulldog_tank',     svg: BULLDOG_TANK_SVG    },
  HUSKY_RIDER:     { key: 'spr_husky_rider',     svg: HUSKY_RIDER_SVG     },
  TERRIER_THIEF:   { key: 'spr_terrier_thief',   svg: TERRIER_THIEF_SVG   },
  // Promoted forms
  DOG_PALADIN:     { key: 'spr_dog_paladin',     svg: DOG_PALADIN_SVG     },
  // Allies / neutral
  OTTER_ALLY:      { key: 'spr_otter_ally',      svg: OTTER_ALLY_SVG      },
  FOX_SCOUT:       { key: 'spr_fox_scout',       svg: FOX_SCOUT_SVG       },
  // Enemies
  SCOUT_CAT:       { key: 'spr_scout_cat',       svg: SCOUT_CAT_SVG       },
  ALLEY_CAT:       { key: 'spr_alley_cat',       svg: ALLEY_CAT_SVG       },
  SIAMESE_ASSASSIN:{ key: 'spr_siamese_assassin',svg: SIAMESE_ASSASSIN_SVG},
  PERSIAN_SORCERER:{ key: 'spr_persian_sorcerer',svg: PERSIAN_SORCERER_SVG},
  TIGER_GENERAL:   { key: 'spr_tiger_general',   svg: TIGER_GENERAL_SVG   },
  LYNX_RANGER:     { key: 'spr_lynx_ranger',     svg: LYNX_RANGER_SVG     },
  SNOW_LEOPARD:    { key: 'spr_snow_leopard',    svg: SNOW_LEOPARD_SVG    },
  RIVER_PANTHER:   { key: 'spr_river_panther',   svg: RIVER_PANTHER_SVG   },
  SAND_CAT_KING:   { key: 'spr_sand_cat_king',   svg: SAND_CAT_KING_SVG   },
  PERSIAN_QUEEN:   { key: 'spr_persian_queen',   svg: PERSIAN_QUEEN_SVG   },
  CAT_EMPEROR:     { key: 'spr_cat_emperor',     svg: CAT_EMPEROR_SVG     },
};

// Fallback sprites for unknown unit IDs
const FALLBACK_PLAYER_SVG = dogFaceSVG();
const FALLBACK_ENEMY_SVG  = catFaceSVG();
const FALLBACK_NEUTRAL_SVG= dogFaceSVG({ bodyFill:'#88aa66', earFill:'#668844', eyeColor:'#2a5a1a' });

const FALLBACK_SPRITES = {
  player:  { key: 'spr_fallback_player',  svg: FALLBACK_PLAYER_SVG  },
  enemy:   { key: 'spr_fallback_enemy',   svg: FALLBACK_ENEMY_SVG   },
  neutral: { key: 'spr_fallback_neutral', svg: FALLBACK_NEUTRAL_SVG },
};

// ---------------------------------------------------------------------------
// Public API used by BattleScene
// ---------------------------------------------------------------------------

/**
 * Call this in BattleScene.preload() to queue all SVG textures.
 * @param {Phaser.Scene} scene
 */
function preloadUnitSprites(scene) {
  // Load individual unit sprites
  for (const [id, info] of Object.entries(UNIT_SPRITES)) {
    scene.load.image(info.key, svgToDataURI(info.svg));
  }
  // Load fallbacks
  for (const [team, info] of Object.entries(FALLBACK_SPRITES)) {
    scene.load.image(info.key, svgToDataURI(info.svg));
  }
}

/**
 * Returns the Phaser texture key for a given unit.
 * @param {Unit} unit
 * @returns {string} texture key
 */
function getSpriteKey(unit) {
  // Check if this unit has a known promoted sprite
  if (unit.promoted && unit.id === 'PUPPY_KNIGHT') {
    return UNIT_SPRITES['DOG_PALADIN'].key;
  }
  const info = UNIT_SPRITES[unit.id];
  if (info) return info.key;
  // Use fallback based on team
  return (FALLBACK_SPRITES[unit.team] || FALLBACK_SPRITES['neutral']).key;
}
