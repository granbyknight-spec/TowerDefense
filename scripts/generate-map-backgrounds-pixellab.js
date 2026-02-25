#!/usr/bin/env node
/**
 * generate-map-backgrounds-pixellab.js
 *
 * Generates full battle-map background images using the PixelLab API.
 * Each image is a clean 3/4 top-down oblique pixel art battlefield scene —
 * NO grid lines, NO characters, NO UI.  The game draws its logical grid on
 * top at runtime; the image is pure visual backdrop.
 *
 * Art style: Shining Force / classic 16-bit JRPG tactical RPG maps.
 * Projection: 3/4 oblique top-down (rectangular tiles, slight depth cues)
 *             NOT true isometric diamonds — keeps the flat grid compatible.
 *
 * Environment variables:
 *   PIXELLAB_SECRET  — PixelLab API key (repo secret PIXELLAB_API_KEY)
 *   CHAPTER          — '1'…'7' or 'all'  (default: 'all')
 *   VARIANTS         — number of variants to generate per chapter (default: 2)
 *   SKIP_EXISTING    — 'true' | 'false'  (default: 'true')
 *
 * Output: assets/maps/chapter_N_bg_v1.png … _vN.png
 *
 * After reviewing variants, promote best to canonical name:
 *   cp assets/maps/chapter_1_bg_v2.png assets/maps/chapter_1_bg.png
 *
 * Image dimensions: 512×640 px (portrait, ratio ≈ 0.8 matching 26-col × 32-row map)
 * BattleScene will call setDisplaySize(mapW, mapH) to fill the exact tile grid.
 *
 * NOTE: If PixelLab returns a size error, try reducing to 512×512 and let the
 * game scale it — pixel art upscaling still looks correct with nearest-neighbor.
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const https = require('https');

const CHAPTER       = process.env.CHAPTER       || 'all';
const VARIANTS      = parseInt(process.env.VARIANTS || '2', 10);
const SKIP_EXISTING = process.env.SKIP_EXISTING !== 'false';
const OUT_DIR       = path.join(__dirname, '..', 'assets', 'maps');

// Map pixel dimensions at 32px per tile (PixelLab-friendly portrait size)
// 26 cols × 32 = 832 wide,  32 rows × 32 = 1024 tall
// Closest clean PixelLab size: 512×640 (ratio 0.8 ≈ 26/32 = 0.8125)
const IMG_W = 512;
const IMG_H = 640;

// ── Shared style suffix ─────────────────────────────────────────────────────
// Applied to every chapter prompt to enforce visual coherence.
const STYLE = [
  'Shining Force JRPG battle map background',
  '16-bit retro pixel art',
  '3/4 top-down oblique perspective',
  'rectangular grid-aligned terrain tiles',
  'clean distinct terrain zones',
  'vibrant nostalgic color palette',
  'subtle depth shading on terrain edges',
  'no characters, no units, no sprites',
  'no text, no UI, no grid lines, no overlays',
  'full battlefield view ready for game overlay',
  'classic SNES / Genesis era tactics RPG aesthetic',
].join(', ');

const NEG = [
  'isometric diamond tiles',
  'first-person',
  'perspective vanishing point',
  'characters',
  'people',
  'animals',
  'units',
  'sprites',
  'text',
  'watermark',
  'UI elements',
  'grid lines',
  'HUD',
  'photorealistic',
  '3D render',
  'blurry',
  'low quality',
  'modern buildings',
  'cars',
  'vehicles',
].join(', ');

// ── Chapter map definitions ─────────────────────────────────────────────────
// Each prompt describes the terrain layout matching the mapGrid in ChapterData.js.
// Player deploys at south (bottom rows), enemies start at north (top rows).
// Key impassable terrain: WATER (rivers, lakes) and WALL (stone barriers) must
// be visually distinct so the AI terrain-analysis step can correctly classify them.

const CHAPTERS = [
  // ── Chapter 1: Barkville Siege ──────────────────────────────────────────────
  // Village center-north; walls flanking village; forest on east/west; road N-S
  // Player deploys at south rows 20-22, enemies at north rows 0-4
  {
    id: 1,
    title: 'Barkville Siege',
    prompt: `medieval village under siege, cluster of thatched-roof stone cottages in center-north of map, solid stone defensive walls flanking east and west sides of village block, two dirt road corridors running north-south through the center toward village gates, dense dark green forest treeline packed along far east and west map edges, wide open grassy deployment meadow at the southern third of the map, early morning golden light, long diagonal shadows, warm amber and green color palette, ${STYLE}`,
  },

  // ── Chapter 2: Howling Woods ─────────────────────────────────────────────────
  // Dense forest, wide river at rows 7-8, two narrow bridges at cols 3 and 9
  // Forest ambush; bridges are the only safe crossing
  {
    id: 2,
    title: 'Howling Woods',
    prompt: `dense ancient dark green forest ambush path, towering thick-canopied trees covering most of the map, wide blue-green river running horizontally across the middle of the battlefield, two narrow wooden plank bridges crossing the river at the left-center and right-center, dirt path winding between the trees north and south of the river, murky shadowed forest floor, dappled light through the canopy, moody mysterious green and brown palette, ${STYLE}`,
  },

  // ── Chapter 3: Peak Paws ──────────────────────────────────────────────────────
  // Mountain pass, snow terrain, narrow winding trail, high altitude
  {
    id: 3,
    title: 'Peak Paws',
    prompt: `high mountain pass tactical battlefield, pale blue-white snow covering most of the terrain, jagged rocky mountain peaks rising at the north edge, narrow winding rocky dirt trail running north-south through center of the pass, rocky grey cliff outcroppings on both flanks providing cover, frozen patches of ice on the ground, alpine tundra sparse scrub brush, cold crisp blue and white color palette, overcast mountain sky, ${STYLE}`,
  },

  // ── Chapter 4: River Fetch ────────────────────────────────────────────────────
  // Wide river crossing, forests on banks, ford point, open meadow
  {
    id: 4,
    title: 'River Fetch',
    prompt: `wide river ford crossing battlefield, broad blue river running diagonally through the center of the map, shallow rocky ford crossing point in the center, dense forest on both river banks providing flanking cover, open grassy meadow at the south for player deployment, open terrain at the north for enemy positions, distant green rolling hills at the horizon, bright afternoon sunlight glinting off the water, green and blue color palette, ${STYLE}`,
  },

  // ── Chapter 5: Desert Scratch ────────────────────────────────────────────────
  // Sand dominates, scattered palm oases, dusty road, ancient ruins
  {
    id: 5,
    title: 'Desert Scratch',
    prompt: `vast arid desert battlefield, golden sandy dunes rolling across most of the map, ancient crumbling stone ruins and columns scattered mid-map, dusty dirt road running through the center, three small lush palm-tree oasis pools dotting the landscape, bleached stone rubble debris, shimmering heat haze, dry riverbed cutting through eastern side, scorching midday sun, vivid golden yellow and sandy brown color palette, ${STYLE}`,
  },

  // ── Chapter 6: Meow Fortress ──────────────────────────────────────────────────
  // Castle interior courtyard, massive stone walls, narrow corridors, gate
  {
    id: 6,
    title: 'Meow Fortress',
    prompt: `dark stone castle fortress interior battlefield, massive thick grey stone walls forming the map border with interior corridors and chokepoints, central stone-flagged courtyard with cracked paving, narrow passages between towers and wall sections, imposing iron portcullis gate at the north, torch-lit battlements, dark dungeon-like atmosphere, mossy stones, scattered broken armor and debris, cold grey and dark blue stone color palette, torchlight orange accents, ${STYLE}`,
  },

  // ── Chapter 7: Ultimate Woof ──────────────────────────────────────────────────
  // Epic finale: castle with moat, forest flanks, river, mountain backdrop
  {
    id: 7,
    title: 'Ultimate Woof',
    prompt: `epic final battle fortress map, dark imposing castle citadel at the north center surrounded by a wide deep blue water moat, two narrow stone bridges crossing the moat at left-center and right-center, dense dark forest on east and west flanks, wide river cutting across the south of the map, rocky mountain peaks looming in the far north background behind the castle, open blasted terrain in the center approaches, dramatic storm clouds, dark and epic color palette of deep blue, grey stone and dark green, ${STYLE}`,
  },
];

// ── PixelLab API client ──────────────────────────────────────────────────────
function pixellabRequest(endpoint, body) {
  const apiKey = process.env.PIXELLAB_SECRET;
  if (!apiKey) throw new Error('PIXELLAB_SECRET env var is not set');

  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      hostname: 'api.pixellab.ai',
      path: `/v1/${endpoint}`,
      method: 'POST',
      headers: {
        'Content-Type':   'application/json',
        'Authorization':  `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    };
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(text)); }
          catch (e) { resolve(text); }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${text}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

function extractB64(result) {
  if (result.image && result.image.base64) return result.image.base64;
  if (result.image && typeof result.image === 'string') return result.image;
  if (result.base64) return result.base64;
  return null;
}

function saveB64(b64, outPath) {
  const clean = b64.replace(/^data:image\/\w+;base64,/, '');
  fs.writeFileSync(outPath, Buffer.from(clean, 'base64'));
}

// ── Generate one chapter map ─────────────────────────────────────────────────
async function generateChapter(chapter) {
  console.log(`\n[Ch${chapter.id}] ${chapter.title}  (${VARIANTS} variants)`);

  for (let v = 1; v <= VARIANTS; v++) {
    const outPath = path.join(OUT_DIR, `chapter_${chapter.id}_bg_v${v}.png`);

    if (SKIP_EXISTING && fs.existsSync(outPath)) {
      console.log(`  v${v}: SKIP (exists → ${path.basename(outPath)})`);
      continue;
    }

    try {
      console.log(`  v${v}: requesting ${IMG_W}×${IMG_H}…`);
      const result = await pixellabRequest('generate-image-pixflux', {
        description:          chapter.prompt,
        image_size:           { width: IMG_W, height: IMG_H },
        no_background:        false,
        negative_description: NEG,
        // No outline — this is a background scene, not a sprite
      });

      const b64 = extractB64(result);
      if (!b64) {
        console.warn(`  v${v}: unexpected response:`, JSON.stringify(result).slice(0, 200));
        continue;
      }

      saveB64(b64, outPath);
      console.log(`  v${v}: saved → ${path.basename(outPath)}`);

      await sleep(4000); // respectful rate limiting between variants
    } catch (err) {
      console.error(`  v${v}: ERROR — ${err.message}`);
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   Puppy Force — Map Background Generator (PixelLab)  ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`Chapter: ${CHAPTER}  |  Variants: ${VARIANTS}  |  Skip existing: ${SKIP_EXISTING}`);
  console.log(`Output:  ${OUT_DIR}`);
  console.log(`Size:    ${IMG_W}×${IMG_H}px (game scales to 936×1152 at runtime)\n`);

  const toGenerate = CHAPTER === 'all'
    ? CHAPTERS
    : CHAPTERS.filter(c => String(c.id) === CHAPTER);

  if (toGenerate.length === 0) {
    console.error(`No chapter found for CHAPTER="${CHAPTER}". Use 1-7 or 'all'.`);
    process.exit(1);
  }

  let ok = 0, fail = 0;
  for (const chapter of toGenerate) {
    try {
      await generateChapter(chapter);
      ok++;
    } catch (err) {
      console.error(`\nFATAL Ch${chapter.id}: ${err.message}`);
      fail++;
    }
    await sleep(1000);
  }

  console.log('\n──────────────────────────────────────────────────────');
  console.log(`Done: ${ok} chapters ok, ${fail} failed`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Review variants: chapter_N_bg_v1.png, _v2.png');
  console.log('  2. Promote best variant to canonical name:');
  console.log('       cp assets/maps/chapter_1_bg_v1.png assets/maps/chapter_1_bg.png');
  console.log('  3. Run /analyze-map <N> in Claude Code to generate the terrain grid');
  console.log('     (Claude reads the image and writes the mapGrid to ChapterData.js)');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
