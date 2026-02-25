'use strict';
// =============================================================================
// Puppy Force — SpriteSheet.js
// Full-body chibi sprites (Shining Force style)
// Dogs: heroic, cute, bright armour — Cats: fangs bared, glowing eyes, scary
// Each sprite is a 64×64 SVG encoded as a base64 data URI
// =============================================================================

function svgToDataURI(svgStr) {
  const b64 = btoa(unescape(encodeURIComponent(svgStr)));
  return 'data:image/svg+xml;base64,' + b64;
}

const S = 64;
function makeSVG(c) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${c}</svg>`;
}

// =============================================================================
// DOG BODY — heroic chibi, full body front-facing
// Layout (64×64):
//   y 0–4   : hat/plume tops (headExtra rendered last, on top)
//   y 4–30  : HEAD (big chibi head with floppy ears)
//   y 27–50 : BODY + ARMS
//   y 47–62 : LEGS
//   y 62    : drop shadow
// =============================================================================
function dogBodySVG({
  furColor   = '#e8c88a', furStroke = '#8b5e3c',
  earFill    = '#d4a873', noseFill  = '#3a1a08',
  eyeColor   = '#2a4a8a', cheekColor = '#f5a0a0',
  bodyColor  = '#5578cc', bodyStroke = '#223388',
  legColor   = '#3a4888',
  headExtra  = '', // rendered on top of everything (helmets, hats)
  faceExtra  = '', // overlays on face (masks, markings)
  bodyExtra  = '', // overlays on torso (emblems)
  leftArm    = '', // shield / left arm override
  rightArm   = '', // weapon in right hand
} = {}) {
  return makeSVG(`
  <ellipse cx="32" cy="62" rx="13" ry="4" fill="#000" opacity="0.25"/>
  <rect x="19" y="47" width="10" height="14" rx="3" fill="${legColor}" stroke="${bodyStroke}" stroke-width="1.5"/>
  <rect x="35" y="47" width="10" height="14" rx="3" fill="${legColor}" stroke="${bodyStroke}" stroke-width="1.5"/>
  <rect x="20" y="48" width="3" height="10" rx="1" fill="#fff" opacity="0.15"/>
  <rect x="36" y="48" width="3" height="10" rx="1" fill="#fff" opacity="0.15"/>
  <rect x="6" y="29" width="13" height="17" rx="4" fill="${bodyColor}" stroke="${bodyStroke}" stroke-width="1.5"/>
  ${leftArm}
  <rect x="17" y="27" width="30" height="23" rx="5" fill="${bodyColor}" stroke="${bodyStroke}" stroke-width="1.5"/>
  <rect x="21" y="29" width="9" height="5" rx="2" fill="#fff" opacity="0.2"/>
  <rect x="17" y="44" width="30" height="5" rx="2" fill="${bodyStroke}" opacity="0.45"/>
  <rect x="29" y="45" width="6" height="3" rx="1" fill="#f8d030" opacity="0.85"/>
  ${bodyExtra}
  <rect x="45" y="29" width="13" height="17" rx="4" fill="${bodyColor}" stroke="${bodyStroke}" stroke-width="1.5"/>
  ${rightArm}
  <rect x="26" y="25" width="12" height="6" rx="3" fill="${furColor}" stroke="${furStroke}" stroke-width="1"/>
  <ellipse cx="15" cy="12" rx="7" ry="11" fill="${earFill}" stroke="${furStroke}" stroke-width="1.5" transform="rotate(-15 15 12)"/>
  <ellipse cx="15" cy="13" rx="3.5" ry="6.5" fill="#f0b0b0" opacity="0.7" transform="rotate(-15 15 13)"/>
  <ellipse cx="49" cy="12" rx="7" ry="11" fill="${earFill}" stroke="${furStroke}" stroke-width="1.5" transform="rotate(15 49 12)"/>
  <ellipse cx="49" cy="13" rx="3.5" ry="6.5" fill="#f0b0b0" opacity="0.7" transform="rotate(15 49 13)"/>
  <ellipse cx="32" cy="17" rx="18" ry="15" fill="${furColor}" stroke="${furStroke}" stroke-width="1.5"/>
  <ellipse cx="24" cy="16" rx="6" ry="6.5" fill="#fff" stroke="${furStroke}" stroke-width="1"/>
  <ellipse cx="40" cy="16" rx="6" ry="6.5" fill="#fff" stroke="${furStroke}" stroke-width="1"/>
  <circle cx="25" cy="16" r="4" fill="${eyeColor}"/>
  <circle cx="41" cy="16" r="4" fill="${eyeColor}"/>
  <circle cx="25" cy="16" r="2.2" fill="#000"/>
  <circle cx="41" cy="16" r="2.2" fill="#000"/>
  <circle cx="26.5" cy="14" r="1.4" fill="#fff"/>
  <circle cx="42.5" cy="14" r="1.4" fill="#fff"/>
  <ellipse cx="32" cy="23" rx="9" ry="7" fill="#f5dcb0" stroke="${furStroke}" stroke-width="1"/>
  <ellipse cx="32" cy="20" rx="3.5" ry="2.5" fill="${noseFill}"/>
  <path d="M 28 24 Q 32 28 36 24" stroke="${furStroke}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="17" cy="21" rx="4" ry="2.5" fill="${cheekColor}" opacity="0.5"/>
  <ellipse cx="47" cy="21" rx="4" ry="2.5" fill="${cheekColor}" opacity="0.5"/>
  ${faceExtra}
  ${headExtra}
  `);
}

// =============================================================================
// CAT BODY — menacing chibi, pointed ears, slit eyes, FANGS
// =============================================================================
function catBodySVG({
  furColor   = '#b0a898', furStroke = '#504840',
  earFill    = '#d0c0b0', noseFill  = '#6a2244',
  eyeColor   = '#22aa22', glowColor = '#00ff00',
  bodyColor  = '#884422', bodyStroke = '#441111',
  legColor   = '#5a2a10',
  headExtra  = '', faceExtra = '', bodyExtra = '',
  leftArm   = '', rightArm  = '',
  aura      = '',
} = {}) {
  return makeSVG(`
  ${aura}
  <ellipse cx="32" cy="62" rx="13" ry="4" fill="#000" opacity="0.35"/>
  <rect x="19" y="47" width="10" height="14" rx="3" fill="${legColor}" stroke="${bodyStroke}" stroke-width="1.5"/>
  <rect x="35" y="47" width="10" height="14" rx="3" fill="${legColor}" stroke="${bodyStroke}" stroke-width="1.5"/>
  <rect x="6" y="29" width="13" height="17" rx="4" fill="${bodyColor}" stroke="${bodyStroke}" stroke-width="1.5"/>
  ${leftArm}
  <rect x="17" y="27" width="30" height="23" rx="5" fill="${bodyColor}" stroke="${bodyStroke}" stroke-width="1.5"/>
  <line x1="24" y1="30" x2="28" y2="39" stroke="#fff" stroke-width="1" opacity="0.18"/>
  <line x1="27" y1="29" x2="31" y2="38" stroke="#fff" stroke-width="1" opacity="0.1"/>
  ${bodyExtra}
  <rect x="45" y="29" width="13" height="17" rx="4" fill="${bodyColor}" stroke="${bodyStroke}" stroke-width="1.5"/>
  ${rightArm}
  <rect x="26" y="25" width="12" height="5" rx="2" fill="${furColor}" stroke="${furStroke}" stroke-width="1"/>
  <polygon points="12,24 7,3 22,18" fill="${earFill}" stroke="${furStroke}" stroke-width="1.5"/>
  <polygon points="13,22 9,7 20,17" fill="#e08080" opacity="0.45"/>
  <polygon points="52,24 57,3 42,18" fill="${earFill}" stroke="${furStroke}" stroke-width="1.5"/>
  <polygon points="51,22 55,7 44,17" fill="#e08080" opacity="0.45"/>
  <ellipse cx="32" cy="17" rx="18" ry="15" fill="${furColor}" stroke="${furStroke}" stroke-width="1.5"/>
  <line x1="16" y1="9" x2="27" y2="14" stroke="${furStroke}" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="48" y1="9" x2="37" y2="14" stroke="${furStroke}" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="24" cy="16" r="8" fill="${glowColor}" opacity="0.18"/>
  <circle cx="40" cy="16" r="8" fill="${glowColor}" opacity="0.18"/>
  <ellipse cx="24" cy="16" rx="6" ry="6" fill="${eyeColor}" stroke="${furStroke}" stroke-width="1"/>
  <ellipse cx="40" cy="16" rx="6" ry="6" fill="${eyeColor}" stroke="${furStroke}" stroke-width="1"/>
  <ellipse cx="24" cy="16" rx="2" ry="5" fill="#000"/>
  <ellipse cx="40" cy="16" rx="2" ry="5" fill="#000"/>
  <circle cx="22" cy="12.5" r="1.4" fill="#fff" opacity="0.8"/>
  <circle cx="38" cy="12.5" r="1.4" fill="#fff" opacity="0.8"/>
  <ellipse cx="32" cy="23" rx="8.5" ry="6" fill="#d8c8b8" stroke="${furStroke}" stroke-width="1"/>
  <polygon points="32,20 29,23 35,23" fill="${noseFill}"/>
  <polygon points="26,25 24,32 28,25" fill="#fff" stroke="${furStroke}" stroke-width="0.8"/>
  <polygon points="38,25 36,32 40,25" fill="#fff" stroke="${furStroke}" stroke-width="0.8"/>
  <path d="M 25 26 Q 32 23 39 26" stroke="${furStroke}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <line x1="7"  y1="22" x2="24" y2="23" stroke="${furStroke}" stroke-width="1" opacity="0.45"/>
  <line x1="7"  y1="25" x2="24" y2="24" stroke="${furStroke}" stroke-width="1" opacity="0.35"/>
  <line x1="57" y1="22" x2="40" y2="23" stroke="${furStroke}" stroke-width="1" opacity="0.45"/>
  <line x1="57" y1="25" x2="40" y2="24" stroke="${furStroke}" stroke-width="1" opacity="0.35"/>
  ${faceExtra}
  ${headExtra}
  `);
}

// =============================================================================
// SHARED WEAPON / EQUIPMENT FRAGMENTS
// =============================================================================
const W = {
  // ── Dog weapons (heroic colours) ──────────────────────────────────────────
  sword: `
    <rect x="49" y="32" width="4" height="20" rx="1" fill="#d8d8e0" stroke="#909098" stroke-width="1" transform="rotate(10 51 42)"/>
    <rect x="43" y="40" width="14" height="3.5" rx="1" fill="#aa8844" stroke="#776622" stroke-width="1"/>
    <rect x="49" y="43" width="4" height="8" rx="1.5" fill="#8b5e3c" stroke="#5a3a20" stroke-width="1"/>`,
  holy_sword: `
    <rect x="49" y="28" width="4" height="22" rx="1" fill="#f0f0ff" stroke="#aaaaee" stroke-width="1" transform="rotate(10 51 39)"/>
    <rect x="43" y="37" width="14" height="3.5" rx="1" fill="#f8d030" stroke="#cc9900" stroke-width="1"/>
    <rect x="49" y="40" width="4" height="8" rx="1.5" fill="#f8d030" stroke="#cc9900" stroke-width="1"/>
    <circle cx="51" cy="27" r="3" fill="#fff" opacity="0.7"/>`,
  shield: `
    <path d="M 4 30 Q 1 40 5 51 Q 8 56 16 54 L 16 30 Z" fill="#5578cc" stroke="#223388" stroke-width="1.5"/>
    <line x1="10" y1="34" x2="10" y2="50" stroke="#fff" stroke-width="1" opacity="0.3"/>
    <line x1="6" y1="42" x2="15" y2="42" stroke="#fff" stroke-width="1" opacity="0.3"/>`,
  holy_shield: `
    <path d="M 4 30 Q 1 40 5 51 Q 8 56 16 54 L 16 30 Z" fill="#f8d030" stroke="#cc9900" stroke-width="1.5"/>
    <rect x="8" y="36" width="6" height="11" rx="1" fill="#fff" opacity="0.55"/>
    <rect x="6" y="40" width="10" height="4" rx="1" fill="#fff" opacity="0.55"/>`,
  staff_heal: `
    <rect x="52" y="16" width="3" height="42" rx="1" fill="#7a5020" stroke="#4a3010" stroke-width="1"/>
    <circle cx="53" cy="12" r="7" fill="#44cc66" stroke="#228844" stroke-width="1.5"/>
    <rect x="50" y="8" width="6" height="2" rx="1" fill="#88ffaa"/>
    <rect x="52" y="7" width="2" height="6" rx="1" fill="#88ffaa"/>
    <circle cx="53" cy="12" r="3" fill="#ccffdd" opacity="0.5"/>`,
  bow: `
    <path d="M 54 18 Q 64 37 54 56" stroke="#8b6030" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <line x1="54" y1="18" x2="54" y2="56" stroke="#e8d880" stroke-width="1.2"/>
    <line x1="40" y1="37" x2="62" y2="37" stroke="#8b5a20" stroke-width="1.5"/>
    <polygon points="40,35 33,37 40,39" fill="#cc6633" stroke="#8b3a10" stroke-width="0.8"/>`,
  wand: `
    <rect x="52" y="20" width="3" height="38" rx="1" fill="#9966cc" stroke="#663399" stroke-width="1"/>
    <circle cx="53" cy="15" r="6" fill="#f8d030" stroke="#cc8800" stroke-width="1.5"/>
    <circle cx="53" cy="15" r="3" fill="#fff" opacity="0.5"/>
    <polygon points="53,9 51,14 55,14" fill="#ffee88" opacity="0.8"/>`,
  daggers: `
    <rect x="50" y="27" width="3.5" height="17" rx="1" fill="#d8d8e0" stroke="#909098" stroke-width="1" transform="rotate(-12 51 35)"/>
    <rect x="44" y="32" width="3.5" height="16" rx="1" fill="#d8d8e0" stroke="#909098" stroke-width="1" transform="rotate(18 45 40)"/>`,
  lance: `
    <rect x="51" y="8" width="3" height="50" rx="1" fill="#8b6030" stroke="#5a3a20" stroke-width="1"/>
    <polygon points="51,6 54,6 52.5,0" fill="#d8d8e0" stroke="#909098" stroke-width="1"/>
    <rect x="49" y="12" width="7" height="3" rx="1" fill="#8b6030"/>`,
  heavy_shield: `
    <path d="M 2 28 Q -1 40 3 52 Q 7 58 16 56 L 16 28 Z" fill="#3a3a3a" stroke="#1a1a1a" stroke-width="2"/>
    <circle cx="9" cy="42" r="5" fill="#880000" opacity="0.7"/>
    <line x1="4" y1="32" x2="4" y2="52" stroke="#666" stroke-width="1" opacity="0.3"/>`,
  // ── Cat weapons (darker, menacing) ────────────────────────────────────────
  cat_sword: `
    <rect x="49" y="32" width="3.5" height="22" rx="1" fill="#b0b0b8" stroke="#606068" stroke-width="1" transform="rotate(12 50 43)"/>
    <rect x="43" y="40" width="13" height="3" rx="1" fill="#505058" stroke="#303038" stroke-width="1"/>
    <rect x="49" y="43" width="3.5" height="8" rx="1" fill="#2a1a0a"/>`,
  cat_dark_sword: `
    <rect x="49" y="28" width="3.5" height="26" rx="1" fill="#4a3a5a" stroke="#1a0a2a" stroke-width="1" transform="rotate(10 50 41)"/>
    <rect x="43" y="38" width="13" height="3" rx="1" fill="#aa0033" stroke="#660011" stroke-width="1"/>
    <rect x="49" y="41" width="3.5" height="8" rx="1" fill="#1a0a0a"/>
    <circle cx="51" cy="27" r="3" fill="#ff0044" opacity="0.5"/>`,
  cat_shield: `
    <path d="M 4 30 Q 1 40 4 51 Q 8 56 16 54 L 16 30 Z" fill="#444444" stroke="#222" stroke-width="1.5"/>
    <circle cx="10" cy="42" r="4" fill="#880000" opacity="0.6"/>`,
  cat_staff: `
    <rect x="52" y="16" width="3" height="42" rx="1" fill="#2a0a2a" stroke="#1a0018" stroke-width="1"/>
    <circle cx="53" cy="11" r="7" fill="#8800cc" stroke="#440088" stroke-width="1.5"/>
    <circle cx="53" cy="11" r="3.5" fill="#ff44ff" opacity="0.55"/>`,
  cat_axe: `
    <rect x="51" y="18" width="3" height="44" rx="1" fill="#3a2010" stroke="#201008" stroke-width="1"/>
    <path d="M 54 20 Q 63 14 63 28 Q 63 36 54 34 Z" fill="#909098" stroke="#505058" stroke-width="1.5"/>
    <line x1="58" y1="18" x2="58" y2="34" stroke="#fff" stroke-width="0.8" opacity="0.25"/>`,
  katana: `
    <rect x="49" y="24" width="2.5" height="30" rx="1" fill="#e0e0e8" stroke="#888890" stroke-width="0.8" transform="rotate(8 50 39)"/>
    <rect x="44" y="34" width="12" height="2.5" rx="1" fill="#3a2a1a"/>
    <rect x="49" y="37" width="2.5" height="10" rx="1" fill="#cc0000" opacity="0.7"/>`,
  cat_bow: `
    <path d="M 53 20 Q 63 37 53 54" stroke="#5a3010" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <line x1="53" y1="20" x2="53" y2="54" stroke="#c0a000" stroke-width="1.2"/>
    <line x1="42" y1="37" x2="61" y2="37" stroke="#664400" stroke-width="1.5"/>
    <polygon points="42,35 36,37 42,39" fill="#884400"/>`,
};

// =============================================================================
// PLAYER DOGS — heroic, cute, class-identifiable
// =============================================================================

// PUPPY_KNIGHT: golden fur, blue knight armour, sword + shield, plumed helm
const PUPPY_KNIGHT_SVG = dogBodySVG({
  furColor: '#e8c060', furStroke: '#8b5a20',
  earFill:  '#d0a840', noseFill:  '#3a1a08',
  eyeColor: '#1a4a8a', cheekColor: '#f8a050',
  bodyColor: '#4466cc', bodyStroke: '#1a2e88',
  legColor:  '#2a3a88',
  leftArm: W.shield,
  rightArm: W.sword,
  headExtra: `
    <rect x="13" y="3" width="38" height="15" rx="5" fill="#4466cc" stroke="#1a2e88" stroke-width="1.5"/>
    <rect x="15" y="6" width="34" height="2.5" rx="1" fill="#1a2e88" opacity="0.7"/>
    <rect x="15" y="10" width="34" height="2.5" rx="1" fill="#1a2e88" opacity="0.7"/>
    <path d="M 24 3 Q 32 -3 40 3" stroke="#cc3344" stroke-width="5" fill="none" stroke-linecap="round"/>`,
});

// CORGI_HEALER: cream/orange corgi, green healer robes, healing staff
const CORGI_HEALER_SVG = dogBodySVG({
  furColor: '#f8e4b0', furStroke: '#c09040',
  earFill:  '#e8c060', noseFill:  '#3a1a08',
  eyeColor: '#1a7a3a', cheekColor: '#f0b0c0',
  bodyColor: '#3a9944', bodyStroke: '#1a6030',
  legColor:  '#1a6a30',
  rightArm: W.staff_heal,
  bodyExtra: `
    <rect x="19" y="38" width="26" height="10" rx="3" fill="#2a7838" stroke="#1a5028" stroke-width="1" opacity="0.8"/>`,
  headExtra: `
    <ellipse cx="32" cy="8" rx="20" ry="9" fill="#2a8840" stroke="#1a6030" stroke-width="1.5"/>
    <rect x="29" y="2" width="6" height="13" rx="2" fill="#55ee88" stroke="#22cc66" stroke-width="1"/>
    <rect x="23" y="6" width="18" height="5" rx="2" fill="#55ee88" stroke="#22cc66" stroke-width="1"/>
    <circle cx="18" cy="7" r="2" fill="#88ffaa" opacity="0.8"/>
    <circle cx="46" cy="7" r="2" fill="#88ffaa" opacity="0.8"/>`,
});

// LABRADOR_SCOUT: golden lab, leather armour, daggers, red bandana
const LABRADOR_SCOUT_SVG = dogBodySVG({
  furColor: '#c8a040', furStroke: '#7a5020',
  earFill:  '#b09030', noseFill:  '#2a0e04',
  eyeColor: '#7a3810', cheekColor: '#e8a060',
  bodyColor: '#8a5a2a', bodyStroke: '#5a3018',
  legColor:  '#5a3818',
  rightArm: W.daggers,
  faceExtra: `
    <path d="M 8 14 Q 32 6 56 14 L 56 20 Q 32 12 8 20 Z" fill="#cc4422" stroke="#882211" stroke-width="1" opacity="0.9"/>
    <ellipse cx="55" cy="17" rx="5" ry="3" fill="#cc4422" stroke="#882211" stroke-width="1" transform="rotate(30 55 17)"/>`,
});

// BEAGLE_ARCHER: tricolor beagle, green ranger gear, bow
const BEAGLE_ARCHER_SVG = dogBodySVG({
  furColor: '#e8d0a0', furStroke: '#6a4020',
  earFill:  '#3a2a1a', noseFill:  '#2a1408',
  eyeColor: '#5a2a0a', cheekColor: '#e09070',
  bodyColor: '#3a6018', bodyStroke: '#1a3a08',
  legColor:  '#2a4010',
  rightArm: W.bow,
  faceExtra: `
    <ellipse cx="32" cy="13" rx="18" ry="9" fill="#2a2010" opacity="0.8"/>`,
  headExtra: `
    <path d="M 14 12 Q 32 2 50 12 L 50 18 Q 32 9 14 18 Z" fill="#3a6018" stroke="#1a3a08" stroke-width="1" opacity="0.9"/>
    <ellipse cx="32" cy="4" rx="10" ry="6" fill="#2a4a10" stroke="#1a3008" stroke-width="1.5"/>`,
});

// POODLE_MAGE: white poodle, purple robes, wand, poodle puff curls
const POODLE_MAGE_SVG = dogBodySVG({
  furColor: '#ecdcf0', furStroke: '#8844aa',
  earFill:  '#cc99ee', noseFill:  '#441155',
  eyeColor: '#6622aa', cheekColor: '#f0a0d0',
  bodyColor: '#7744aa', bodyStroke: '#442277',
  legColor:  '#4a2a6a',
  rightArm: W.wand,
  headExtra: `
    <circle cx="18" cy="12" r="8" fill="#cc88dd" stroke="#8844aa" stroke-width="1.5"/>
    <circle cx="32" cy="8" r="9" fill="#cc88dd" stroke="#8844aa" stroke-width="1.5"/>
    <circle cx="46" cy="12" r="8" fill="#cc88dd" stroke="#8844aa" stroke-width="1.5"/>
    <polygon points="32,12 34,17 39,17 35,20 37,25 32,22 27,25 29,20 25,17 30,17" fill="#f8d030" stroke="#cc8800" stroke-width="1" opacity="0.95"/>`,
});

// BULLDOG_TANK: grey stocky bulldog, heavy iron armour, big shield + axe
const BULLDOG_TANK_SVG = dogBodySVG({
  furColor: '#b8aaa0', furStroke: '#686058',
  earFill:  '#a09088', noseFill:  '#201810',
  eyeColor: '#3a2a18', cheekColor: '#c09080',
  bodyColor: '#3a3a3a', bodyStroke: '#1a1a1a',
  legColor:  '#252525',
  leftArm: W.heavy_shield,
  rightArm: `
    <rect x="51" y="18" width="3" height="44" rx="1" fill="#3a2010" stroke="#201008" stroke-width="1"/>
    <path d="M 54 20 Q 63 14 63 28 Q 63 36 54 34 Z" fill="#909098" stroke="#505058" stroke-width="1.5"/>`,
  faceExtra: `
    <rect x="16" y="20" width="12" height="3" rx="1" fill="#404040" transform="rotate(-10 22 21)"/>
    <rect x="36" y="20" width="12" height="3" rx="1" fill="#404040" transform="rotate(10 42 21)"/>
    <line x1="26" y1="14" x2="38" y2="14" stroke="#808080" stroke-width="1.5" opacity="0.6"/>`,
  headExtra: `
    <rect x="10" y="3" width="44" height="14" rx="5" fill="#3a3a3a" stroke="#1a1a1a" stroke-width="1.5"/>
    <polygon points="20,3 22,-3 24,3" fill="#888"/>
    <polygon points="30,3 32,-3 34,3" fill="#888"/>
    <polygon points="40,3 42,-3 44,3" fill="#888"/>`,
  bodyExtra: `
    <rect x="17" y="27" width="30" height="4" rx="2" fill="#555" opacity="0.5"/>
    <rect x="8" y="44" width="48" height="6" rx="2" fill="#1a1a1a" stroke="#333" stroke-width="1"/>
    <polygon points="14,44 16,38 18,44" fill="#888"/>
    <polygon points="22,44 24,38 26,44" fill="#888"/>
    <polygon points="30,44 32,38 34,44" fill="#888"/>
    <polygon points="38,44 40,38 42,44" fill="#888"/>
    <polygon points="46,44 48,38 50,44" fill="#888"/>`,
});

// HUSKY_RIDER: grey/white husky, blue cavalry armour, lance
const HUSKY_RIDER_SVG = dogBodySVG({
  furColor: '#d8d0c8', furStroke: '#585050',
  earFill:  '#3a3a3a', noseFill:  '#201010',
  eyeColor: '#2266cc', cheekColor: '#e8e0d8',
  bodyColor: '#2255aa', bodyStroke: '#113377',
  legColor:  '#1a3a88',
  rightArm: W.lance,
  faceExtra: `
    <ellipse cx="32" cy="15" rx="20" ry="11" fill="#3a3a3a" opacity="0.65"/>
    <ellipse cx="32" cy="22" rx="8" ry="5" fill="#f0ece8" opacity="0.85"/>
    <circle cx="25" cy="16" r="2" fill="#aaccff" opacity="0.5"/>
    <circle cx="41" cy="16" r="2" fill="#aaccff" opacity="0.5"/>`,
  headExtra: `
    <rect x="12" y="3" width="40" height="13" rx="5" fill="#2255aa" stroke="#113377" stroke-width="1.5"/>
    <path d="M 22 3 Q 32 -4 42 3" stroke="#88aaff" stroke-width="4" fill="none" stroke-linecap="round"/>`,
});

// TERRIER_THIEF: rust terrier, dark thief clothes, bandit mask, daggers
const TERRIER_THIEF_SVG = dogBodySVG({
  furColor: '#c87040', furStroke: '#8a4020',
  earFill:  '#b05030', noseFill:  '#2a1008',
  eyeColor: '#aa4400', cheekColor: '#e08060',
  bodyColor: '#242424', bodyStroke: '#111111',
  legColor:  '#181818',
  rightArm: W.daggers,
  faceExtra: `
    <rect x="12" y="12" width="40" height="9" rx="4" fill="#1a1a1a" opacity="0.88"/>`,
  headExtra: `
    <polygon points="48,4 52,14 44,14" fill="#ccc" stroke="#666" stroke-width="1"/>
    <path d="M 10 47 Q 32 43 54 47 L 56 52 Q 32 49 8 52 Z" fill="#cc2244" stroke="#881122" stroke-width="1"/>`,
});

// DOG_PALADIN: gold-armoured promoted knight, holy sword + holy shield, wings
const DOG_PALADIN_SVG = dogBodySVG({
  furColor: '#f0c840', furStroke: '#886600',
  earFill:  '#d8a820', noseFill:  '#3a1a08',
  eyeColor: '#1a3a88', cheekColor: '#f8b050',
  bodyColor: '#d4a820', bodyStroke: '#886600',
  legColor:  '#a07818',
  leftArm: W.holy_shield,
  rightArm: W.holy_sword,
  headExtra: `
    <rect x="8" y="3" width="48" height="16" rx="6" fill="#f0c840" stroke="#886600" stroke-width="1.5"/>
    <ellipse cx="32" cy="2" rx="10" ry="6" fill="#4466ff" opacity="0.9"/>
    <rect x="29" y="5" width="6" height="12" rx="1" fill="#fff" opacity="0.8"/>
    <rect x="23" y="9" width="18" height="5" rx="1" fill="#fff" opacity="0.8"/>
    <path d="M 6 16 Q 1 8 10 5 Q 8 12 12 18 Z" fill="#f8f8ff" stroke="#ccc" stroke-width="1"/>
    <path d="M 58 16 Q 63 8 54 5 Q 56 12 52 18 Z" fill="#f8f8ff" stroke="#ccc" stroke-width="1"/>`,
});

// =============================================================================
// ENEMY CATS — menacing, glowing eyes, fangs, class-appropriate dark gear
// =============================================================================

// SCOUT_CAT: orange tabby, leather armour, sword
const SCOUT_CAT_SVG = catBodySVG({
  furColor: '#e8a040', furStroke: '#884400',
  earFill:  '#cc8030', noseFill:  '#aa2244',
  eyeColor: '#22aa44', glowColor: '#00ff88',
  bodyColor: '#6a3a18', bodyStroke: '#3a1a08',
  legColor:  '#4a2810',
  rightArm: W.cat_sword,
  faceExtra: `
    <line x1="26" y1="10" x2="26" y2="17" stroke="#aa5500" stroke-width="2" opacity="0.6"/>
    <line x1="32" y1="8"  x2="32" y2="15" stroke="#aa5500" stroke-width="2" opacity="0.6"/>
    <line x1="38" y1="10" x2="38" y2="17" stroke="#aa5500" stroke-width="2" opacity="0.6"/>`,
});

// ALLEY_CAT (boss): dark grey, scar, boss crown, sword
const ALLEY_CAT_SVG = catBodySVG({
  furColor: '#888880', furStroke: '#333330',
  earFill:  '#606058', noseFill:  '#881122',
  eyeColor: '#cc4400', glowColor: '#ff2200',
  bodyColor: '#333330', bodyStroke: '#111110',
  legColor:  '#222220',
  rightArm: W.cat_dark_sword,
  faceExtra: `
    <line x1="17" y1="10" x2="30" y2="22" stroke="#cc2222" stroke-width="2.5" opacity="0.9" stroke-linecap="round"/>`,
  headExtra: `
    <polygon points="18,10 24,2 30,8 36,2 42,8 48,2 54,10" fill="#cc2222" stroke="#881111" stroke-width="1.5"/>
    <circle cx="24" cy="5" r="2.5" fill="#ff8888"/>
    <circle cx="36" cy="3" r="3" fill="#ffaa00"/>
    <circle cx="48" cy="5" r="2.5" fill="#ff8888"/>`,
});

// SIAMESE_ASSASSIN: cream/dark siamese, ninja black, katana
const SIAMESE_ASSASSIN_SVG = catBodySVG({
  furColor: '#e8dcc8', furStroke: '#604030',
  earFill:  '#8a6040', noseFill:  '#aa2244',
  eyeColor: '#0088cc', glowColor: '#00aaff',
  bodyColor: '#1a1a1a', bodyStroke: '#080808',
  legColor:  '#111111',
  rightArm: W.katana,
  faceExtra: `
    <ellipse cx="32" cy="14" rx="14" ry="8" fill="#7a5030" opacity="0.7"/>
    <rect x="8" y="22" width="48" height="7" rx="3" fill="#1a1a1a" opacity="0.88"/>`,
});

// PERSIAN_SORCERER: grey persian, purple robes, dark staff, gem on forehead
const PERSIAN_SORCERER_SVG = catBodySVG({
  furColor: '#d8d0c8', furStroke: '#605850',
  earFill:  '#c0b8b0', noseFill:  '#883366',
  eyeColor: '#aa00cc', glowColor: '#cc44ff',
  bodyColor: '#4a1a5a', bodyStroke: '#2a0a3a',
  legColor:  '#3a1048',
  rightArm: W.cat_staff,
  faceExtra: `
    <polygon points="32,8 36,14 32,18 28,14" fill="#aa00ff" stroke="#660099" stroke-width="1"/>
    <circle cx="32" cy="13" r="3" fill="#ff44ff" opacity="0.6"/>`,
  headExtra: `
    <ellipse cx="32" cy="55" rx="24" ry="9" fill="#e8e0d8" stroke="#a09088" stroke-width="1.5"/>`,
});

// TIGER_GENERAL: orange/black tiger, military armour, axe, general helm
const TIGER_GENERAL_SVG = catBodySVG({
  furColor: '#e88030', furStroke: '#884400',
  earFill:  '#cc6020', noseFill:  '#aa2244',
  eyeColor: '#cc8800', glowColor: '#ffaa00',
  bodyColor: '#665500', bodyStroke: '#3a3000',
  legColor:  '#4a3a00',
  rightArm: W.cat_axe,
  faceExtra: `
    <line x1="10" y1="14" x2="22" y2="22" stroke="#333300" stroke-width="2.5" opacity="0.7" stroke-linecap="round"/>
    <line x1="8"  y1="20" x2="20" y2="24" stroke="#333300" stroke-width="1.5" opacity="0.5" stroke-linecap="round"/>
    <line x1="54" y1="14" x2="42" y2="22" stroke="#333300" stroke-width="2.5" opacity="0.7" stroke-linecap="round"/>
    <line x1="56" y1="20" x2="44" y2="24" stroke="#333300" stroke-width="1.5" opacity="0.5" stroke-linecap="round"/>`,
  headExtra: `
    <rect x="10" y="3" width="44" height="14" rx="5" fill="#665500" stroke="#3a3000" stroke-width="1.5"/>
    <rect x="14" y="3" width="36" height="5" rx="3" fill="#888800" stroke="#555500" stroke-width="1"/>
    <ellipse cx="32" cy="1" rx="8" ry="5" fill="#ff4400" opacity="0.9"/>`,
});

// LYNX_RANGER (boss): spotted lynx, forest gear, dark bow
const LYNX_RANGER_SVG = catBodySVG({
  furColor: '#c8b898', furStroke: '#706050',
  earFill:  '#a89070', noseFill:  '#882244',
  eyeColor: '#226688', glowColor: '#00aaaa',
  bodyColor: '#2a4a22', bodyStroke: '#142a10',
  legColor:  '#1a3018',
  rightArm: W.cat_bow,
  faceExtra: `
    <circle cx="20" cy="15" r="3" fill="#907060" opacity="0.6"/>
    <circle cx="26" cy="12" r="2" fill="#907060" opacity="0.5"/>
    <circle cx="44" cy="15" r="3" fill="#907060" opacity="0.6"/>
    <circle cx="38" cy="12" r="2" fill="#907060" opacity="0.5"/>`,
  headExtra: `
    <polygon points="18,10 24,2 30,8 36,2 42,8 48,2 54,10" fill="#228866" stroke="#115533" stroke-width="1.5"/>
    <line x1="36" y1="2" x2="36" y2="10" stroke="#88ffaa" stroke-width="1.5"/>
    <line x1="8" y1="4"  x2="13" y2="-1" stroke="#706050" stroke-width="2"/>
    <line x1="56" y1="4" x2="51" y2="-1" stroke="#706050" stroke-width="2"/>`,
});

// SNOW_LEOPARD (boss): white spotted, ice crown, sword
const SNOW_LEOPARD_SVG = catBodySVG({
  furColor: '#e8e8f0', furStroke: '#607080',
  earFill:  '#d0d0e0', noseFill:  '#664488',
  eyeColor: '#4488cc', glowColor: '#88ccff',
  bodyColor: '#3a6888', bodyStroke: '#1a3a55',
  legColor:  '#2a4a66',
  rightArm: W.cat_sword,
  faceExtra: `
    <circle cx="20" cy="15" r="4" fill="#aaaacc" opacity="0.5"/>
    <circle cx="20" cy="15" r="2" fill="#8888aa" opacity="0.7"/>
    <circle cx="44" cy="15" r="4" fill="#aaaacc" opacity="0.5"/>
    <circle cx="44" cy="15" r="2" fill="#8888aa" opacity="0.7"/>`,
  headExtra: `
    <polygon points="18,12 24,2 30,10 36,2 42,10 48,2 54,12" fill="#88ccff" stroke="#4488cc" stroke-width="1.5" opacity="0.9"/>
    <polygon points="32,2 30,8 34,8" fill="#cceeff" opacity="0.9"/>
    <polygon points="24,4 22,10 26,10" fill="#cceeff" opacity="0.7"/>
    <polygon points="40,4 38,10 42,10" fill="#cceeff" opacity="0.7"/>`,
});

// RIVER_PANTHER (boss): dark blue-black, teal glow, katana, water aura
const RIVER_PANTHER_SVG = catBodySVG({
  furColor: '#303050', furStroke: '#101020',
  earFill:  '#202040', noseFill:  '#000080',
  eyeColor: '#00aacc', glowColor: '#00ffff',
  bodyColor: '#1a1a2a', bodyStroke: '#080810',
  legColor:  '#111118',
  rightArm: W.katana,
  aura: `
    <ellipse cx="32" cy="35" rx="30" ry="28" fill="#0044aa" opacity="0.15"/>
    <ellipse cx="32" cy="40" rx="26" ry="22" fill="#00aacc" opacity="0.1"/>`,
  faceExtra: `
    <circle cx="22" cy="20" r="5" fill="#202040" opacity="0.7"/>
    <circle cx="42" cy="20" r="5" fill="#202040" opacity="0.7"/>`,
  headExtra: `
    <path d="M 14 12 Q 18 5 24 9 Q 30 3 36 9 Q 42 5 48 12" stroke="#00aacc" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="28" cy="58" rx="2.5" ry="5" fill="#0088cc" opacity="0.6"/>
    <ellipse cx="36" cy="60" rx="2.5" ry="4" fill="#0088cc" opacity="0.5"/>`,
});

// SAND_CAT_KING (boss): sandy, pharaoh headdress, axe
const SAND_CAT_KING_SVG = catBodySVG({
  furColor: '#d8b870', furStroke: '#886630',
  earFill:  '#c8a050', noseFill:  '#882200',
  eyeColor: '#cc6600', glowColor: '#ffaa00',
  bodyColor: '#aa7a20', bodyStroke: '#664400',
  legColor:  '#7a5a10',
  rightArm: W.cat_axe,
  headExtra: `
    <rect x="8" y="3" width="48" height="22" rx="4" fill="#d4a030" stroke="#886620" stroke-width="1.5"/>
    <rect x="8" y="6"  width="48" height="3" fill="#2244aa" opacity="0.7"/>
    <rect x="8" y="12" width="48" height="3" fill="#2244aa" opacity="0.7"/>
    <rect x="8" y="18" width="48" height="3" fill="#2244aa" opacity="0.7"/>
    <path d="M 32 3 Q 32 -1 36 -1 Q 40 -1 40 3 Q 40 6 36 6" stroke="#44aa44" stroke-width="2" fill="none"/>
    <circle cx="36" cy="0" r="2.5" fill="#44aa44"/>`,
});

// PERSIAN_QUEEN (boss): white persian, queen crown, dark staff, pink robes
const PERSIAN_QUEEN_SVG = catBodySVG({
  furColor: '#f0e8e0', furStroke: '#886688',
  earFill:  '#e0d0d8', noseFill:  '#cc2266',
  eyeColor: '#cc44aa', glowColor: '#ff88dd',
  bodyColor: '#cc44aa', bodyStroke: '#882266',
  legColor:  '#993388',
  rightArm: W.cat_staff,
  headExtra: `
    <ellipse cx="32" cy="58" rx="26" ry="10" fill="#f0e0f0" stroke="#cc88cc" stroke-width="1.5"/>
    <polygon points="12,14 18,4 24,10 32,2 40,10 46,4 52,14" fill="#f8d030" stroke="#cc9900" stroke-width="2"/>
    <circle cx="18" cy="8"  r="3" fill="#ff44aa"/>
    <circle cx="32" cy="4"  r="3.5" fill="#ff44aa"/>
    <circle cx="46" cy="8"  r="3" fill="#ff44aa"/>`,
});

// CAT_EMPEROR (final boss): dark purple, enormous crown, dark sword, evil aura
const CAT_EMPEROR_SVG = catBodySVG({
  furColor: '#4a2060', furStroke: '#1a0030',
  earFill:  '#3a1050', noseFill:  '#cc0044',
  eyeColor: '#ff2200', glowColor: '#ff0000',
  bodyColor: '#661188', bodyStroke: '#330044',
  legColor:  '#440066',
  rightArm: W.cat_dark_sword,
  aura: `
    <ellipse cx="32" cy="36" rx="32" ry="30" fill="#440044" opacity="0.3"/>
    <ellipse cx="32" cy="38" rx="28" ry="25" fill="#880000" opacity="0.2"/>
    <ellipse cx="32" cy="40" rx="22" ry="20" fill="#cc0000" opacity="0.1"/>`,
  headExtra: `
    <polygon points="6,18 12,3 20,11 32,0 44,11 52,3 58,18" fill="#8800cc" stroke="#440088" stroke-width="2"/>
    <circle cx="12" cy="7"  r="3.5" fill="#ff00ff"/>
    <circle cx="20" cy="10" r="2.5" fill="#ffaa00"/>
    <circle cx="32" cy="2"  r="4.5" fill="#ff2200"/>
    <circle cx="44" cy="10" r="2.5" fill="#ffaa00"/>
    <circle cx="52" cy="7"  r="3.5" fill="#ff00ff"/>
    <polygon points="32,0 30,6 34,6" fill="#ffccff" opacity="0.5"/>
    <circle cx="24" cy="16" r="9" fill="#ff0000" opacity="0.12"/>
    <circle cx="40" cy="16" r="9" fill="#ff0000" opacity="0.12"/>`,
});

// =============================================================================
// NEUTRAL / ALLY SPRITES
// =============================================================================

const OTTER_ALLY_SVG = dogBodySVG({
  furColor: '#8a6040', furStroke: '#5a3020',
  earFill:  '#7a5030', noseFill:  '#2a1008',
  eyeColor: '#3a2010', cheekColor: '#c08060',
  bodyColor: '#2266aa', bodyStroke: '#114488',
  legColor:  '#1a4a88',
  faceExtra: `
    <ellipse cx="20" cy="21" rx="7" ry="5" fill="#f0e8d8" opacity="0.8"/>
    <ellipse cx="44" cy="21" rx="7" ry="5" fill="#f0e8d8" opacity="0.8"/>`,
  headExtra: `
    <rect x="17" y="2" width="30" height="12" rx="4" fill="#2266aa" stroke="#114488" stroke-width="1.5"/>
    <rect x="13" y="12" width="38" height="5" rx="2" fill="#2266aa" stroke="#114488" stroke-width="1"/>`,
});

const FOX_SCOUT_SVG = dogBodySVG({
  furColor: '#d46030', furStroke: '#8a3010',
  earFill:  '#c05020', noseFill:  '#2a1008',
  eyeColor: '#aa6600', cheekColor: '#e08060',
  bodyColor: '#446622', bodyStroke: '#223311',
  legColor:  '#2a4418',
  rightArm: W.daggers,
  faceExtra: `
    <ellipse cx="32" cy="25" rx="11" ry="8" fill="#f0ece8" opacity="0.85"/>
    <polygon points="14,24 7,4 20,14" fill="#1a1a1a" opacity="0.7"/>
    <polygon points="50,24 57,4 44,14" fill="#1a1a1a" opacity="0.7"/>`,
  headExtra: `
    <ellipse cx="56" cy="50" rx="8" ry="12" fill="#d46030" stroke="#8a3010" stroke-width="1" transform="rotate(-20 56 50)"/>
    <ellipse cx="57" cy="49" rx="4" ry="6" fill="#f0ece8" opacity="0.7" transform="rotate(-20 57 49)"/>`,
});

// =============================================================================
// FALLBACK SPRITES
// =============================================================================
const FALLBACK_PLAYER_SVG  = dogBodySVG();
const FALLBACK_ENEMY_SVG   = catBodySVG();
const FALLBACK_NEUTRAL_SVG = dogBodySVG({
  furColor: '#88aa66', earFill: '#668844',
  eyeColor: '#2a5a1a', bodyColor: '#5a8840', bodyStroke: '#3a5828', legColor: '#3a5820',
});

// =============================================================================
// SPRITE REGISTRY
// =============================================================================
const UNIT_SPRITES = {
  PUPPY_KNIGHT:     { key: 'spr_puppy_knight',     svg: PUPPY_KNIGHT_SVG    },
  CORGI_HEALER:     { key: 'spr_corgi_healer',     svg: CORGI_HEALER_SVG    },
  LABRADOR_SCOUT:   { key: 'spr_labrador_scout',   svg: LABRADOR_SCOUT_SVG  },
  BEAGLE_ARCHER:    { key: 'spr_beagle_archer',    svg: BEAGLE_ARCHER_SVG   },
  POODLE_MAGE:      { key: 'spr_poodle_mage',      svg: POODLE_MAGE_SVG     },
  BULLDOG_TANK:     { key: 'spr_bulldog_tank',     svg: BULLDOG_TANK_SVG    },
  HUSKY_RIDER:      { key: 'spr_husky_rider',      svg: HUSKY_RIDER_SVG     },
  TERRIER_THIEF:    { key: 'spr_terrier_thief',    svg: TERRIER_THIEF_SVG   },
  DOG_PALADIN:      { key: 'spr_dog_paladin',      svg: DOG_PALADIN_SVG     },
  OTTER_ALLY:       { key: 'spr_otter_ally',       svg: OTTER_ALLY_SVG      },
  FOX_SCOUT:        { key: 'spr_fox_scout',        svg: FOX_SCOUT_SVG       },
  SCOUT_CAT:        { key: 'spr_scout_cat',        svg: SCOUT_CAT_SVG       },
  ALLEY_CAT:        { key: 'spr_alley_cat',        svg: ALLEY_CAT_SVG       },
  SIAMESE_ASSASSIN: { key: 'spr_siamese_assassin', svg: SIAMESE_ASSASSIN_SVG },
  PERSIAN_SORCERER: { key: 'spr_persian_sorcerer', svg: PERSIAN_SORCERER_SVG },
  TIGER_GENERAL:    { key: 'spr_tiger_general',    svg: TIGER_GENERAL_SVG   },
  LYNX_RANGER:      { key: 'spr_lynx_ranger',      svg: LYNX_RANGER_SVG     },
  SNOW_LEOPARD:     { key: 'spr_snow_leopard',     svg: SNOW_LEOPARD_SVG    },
  RIVER_PANTHER:    { key: 'spr_river_panther',    svg: RIVER_PANTHER_SVG   },
  SAND_CAT_KING:    { key: 'spr_sand_cat_king',    svg: SAND_CAT_KING_SVG   },
  PERSIAN_QUEEN:    { key: 'spr_persian_queen',    svg: PERSIAN_QUEEN_SVG   },
  CAT_EMPEROR:      { key: 'spr_cat_emperor',      svg: CAT_EMPEROR_SVG     },
};

const FALLBACK_SPRITES = {
  player:  { key: 'spr_fallback_player',  svg: FALLBACK_PLAYER_SVG  },
  enemy:   { key: 'spr_fallback_enemy',   svg: FALLBACK_ENEMY_SVG   },
  neutral: { key: 'spr_fallback_neutral', svg: FALLBACK_NEUTRAL_SVG },
};

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Register all SVG textures as Phaser canvas textures.
 * Call in BattleScene.preload().
 */
function preloadUnitSprites(scene) {
  const all = [...Object.entries(UNIT_SPRITES), ...Object.entries(FALLBACK_SPRITES)];
  for (const [, info] of all) {
    if (scene.textures.exists(info.key)) continue;
    const ct  = scene.textures.createCanvas(info.key, 64, 64);
    const uri = svgToDataURI(info.svg);
    const img = new Image();
    img.onload  = () => { ct.getContext().drawImage(img, 0, 0, 64, 64); ct.refresh(); };
    img.onerror = () => console.warn('[SpriteSheet] failed:', info.key);
    img.src = uri;
  }
}

/**
 * Returns the Phaser texture key for a given unit.
 */
function getSpriteKey(unit, scene) {
  // Check saved art style preference
  if (scene && typeof SaveManager !== 'undefined') {
    const style = SaveManager.getUnitStyle(unit.id);
    if (style === 'dark' || style === 'chibi') {
      const innKey = `inn_${style}_${unit.id}`;
      if (scene.textures && scene.textures.exists(innKey)) return innKey;
    }
  }
  if (unit.promoted && unit.id === 'PUPPY_KNIGHT') return UNIT_SPRITES['DOG_PALADIN'].key;
  const info = UNIT_SPRITES[unit.id];
  if (info) return info.key;
  return (FALLBACK_SPRITES[unit.team] || FALLBACK_SPRITES['neutral']).key;
}
