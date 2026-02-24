#!/usr/bin/env node
/**
 * generate-pixellab-sprites.js
 *
 * Generates enemy cat sprite art using the PixelLab API (BitForge model).
 * Bosses are generated at 128×128 with extra-dramatic prompts and glowing effects.
 * Regular cats are generated at 64×64.
 *
 * Environment variables:
 *   PIXELLAB_SECRET  — your PixelLab API key (store as repo secret PIXELLAB_API_KEY)
 *   SPRITE_SET       — 'enemies' | 'bosses' | 'all'  (default: 'all')
 *   SKIP_EXISTING    — 'true' | 'false'               (default: 'true')
 *
 * Output: assets/enemies/<id_lowercase>_pl_v1.png … _pl_v4.png
 * After review, copy best variant:
 *   cp assets/enemies/scout_cat_pl_v1.png assets/enemies/scout_cat_v1.png
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const SPRITE_SET    = process.env.SPRITE_SET    || 'all';
const SKIP_EXISTING = process.env.SKIP_EXISTING !== 'false';
const OUT_DIR       = path.join(__dirname, '..', 'assets', 'enemies');
const VARIANTS      = 4;

// ── Shared style tags ───────────────────────────────────────────────────────
const STYLE_NORMAL = [
  'anthropomorphic cat warrior',
  'isometric pixel art',
  'Shining Force GBA style',
  'retro 16-bit Sega Genesis sprite',
  'chibi proportions',
  'game overworld sprite',
  'transparent background',
  'clean pixel outlines',
  'flat shading',
  '64x64 canvas',
].join(', ');

const STYLE_BOSS = [
  'anthropomorphic cat boss villain',
  'isometric pixel art',
  'Shining Force GBA boss sprite',
  'retro 16-bit Sega Genesis sprite',
  'imposing and dramatic',
  'detailed ornate armor',
  'glowing magical aura',
  'dramatic lighting effects',
  'game overworld boss sprite',
  'transparent background',
  'clean pixel outlines',
  'flat shading with highlights',
  '128x128 canvas',
].join(', ');

const NEG = [
  'blurry', 'low quality', 'realistic', 'photorealistic',
  '3d render', 'human', 'dog', 'wolf', 'multiple characters',
  'text', 'watermark', 'signature', 'background scenery',
  'gradient background', 'noise', 'extra limbs', 'deformed',
].join(', ');

// ── Enemy definitions ────────────────────────────────────────────────────────
// isBoss: true  → generates 128×128, dramatically styled
// isBoss: false → generates 64×64, standard chibi style

const ENEMIES = [
  // ── Regular cats ───────────────────────────────────────────────────────────
  {
    id: 'SCOUT_CAT',
    isBoss: false,
    prompt: `orange tabby cat scout warrior, light leather armor, dagger on belt, green slit eyes, red bandana around neck, alert ready stance, ${STYLE_NORMAL}`,
  },
  {
    id: 'SIAMESE_ASSASSIN',
    isBoss: false,
    prompt: `Siamese cat assassin, cream and dark brown fur, blue eyes, black ninja mask, dark leather armor, hidden blade, stealthy crouching pose, shadow cloak trailing behind, ${STYLE_NORMAL}`,
  },
  {
    id: 'PERSIAN_SORCERER',
    isBoss: false,
    prompt: `Persian cat sorcerer mage, wizard robes, magical glowing staff, glowing purple eyes, grey and white fluffy fur, jewel gem on forehead, arcane sparkles, casting pose, ${STYLE_NORMAL}`,
  },
  {
    id: 'TIGER_GENERAL',
    isBoss: false,
    prompt: `tiger cat general soldier, orange fur with bold black tiger stripes, olive military helmet with red plume, heavy armor, spear in hand, stern commanding expression, authoritative pose, ${STYLE_NORMAL}`,
  },

  // ── Boss cats — bigger canvas, elaborate prompts, dramatic effects ──────────
  {
    id: 'ALLEY_CAT',
    isBoss: true,
    prompt: `grey alley cat crime boss fighter, battle-scarred grey fur, deep red scar across left eye, jagged claw gauntlets, dark iron plate armor with gold studs, torn battle cloak, red crown, menacing grin showing fangs, energy crackling from claws, ${STYLE_BOSS}`,
  },
  {
    id: 'LYNX_RANGER',
    isBoss: true,
    prompt: `lynx ranger captain boss, beige and grey spotted fur, tufted black ear tips, green ranger crown with crossed-arrow emblem, ornate leather ranger armor, large enchanted bow glowing at tips, quiver of glowing arrows, steely focused expression, wind whipping around cloak, ${STYLE_BOSS}`,
  },
  {
    id: 'SNOW_LEOPARD',
    isBoss: true,
    prompt: `snow leopard ice knight boss, white and grey fur covered in dark rosette spots, elaborate ice-crystal crown with five spikes, full silver plate armor etched with frost runes, broadsword held aloft radiating cold blue aura, frost particles swirling, imperious regal pose, ${STYLE_BOSS}`,
  },
  {
    id: 'RIVER_PANTHER',
    isBoss: true,
    prompt: `dark navy panther aquatic warlord boss, sleek dark navy and black fur, teal bioluminescent glowing eyes, wave-crest crown, deep-sea aquatic plate armor with wave and scale motifs, twin claw blades dripping water, water droplets and ripple aura surrounding, powerful coiled stance, ${STYLE_BOSS}`,
  },
  {
    id: 'SAND_CAT_KING',
    isBoss: true,
    prompt: `sand cat desert pharaoh king boss, sandy golden fur, ornate Egyptian pharaoh double-crown in blue and gold, cobra uraeus with glowing gem on forehead, golden ankh-emblazoned armor, ceremonial khopesh sword radiating solar energy, golden aura and sand vortex effects, commanding pharaoh pose, ${STYLE_BOSS}`,
  },
  {
    id: 'PERSIAN_QUEEN',
    isBoss: true,
    prompt: `white Persian cat sorceress queen boss, creamy white fluffy fur, extravagant gold and jeweled queen crown with pink heart gems, flowing arcane robes of purple and gold, magical staff topped with pulsing pink orb, pink and violet magical energy storm, ruff collar of glowing arcane feathers, imperious outstretched arm casting spell, ${STYLE_BOSS}`,
  },
  {
    id: 'CAT_EMPEROR',
    isBoss: true,
    prompt: `dark purple cat supreme emperor final boss, dark purple fur, enormous ornate dark crown with five massive glowing blood-red gems, glowing malevolent red slit eyes, dark emperor robes with void-pattern trim, dark mageblade sword wreathed in purple void energy, evil triangle insignia on forehead, shadowy black aura radiating chaos, ultimate villain supreme commanding pose, ${STYLE_BOSS}`,
  },
];

// ── PixelLab API client (manual REST — avoids ESM-only SDK issues in CI) ────
const https = require('https');

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
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
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

// ── Generate one enemy (VARIANTS variants) ───────────────────────────────────
async function generateEnemy(enemy) {
  const size  = enemy.isBoss ? 128 : 64;
  const label = enemy.isBoss ? '[BOSS]' : '[cat] ';
  console.log(`\n${label} ${enemy.id}  (${size}×${size}, ${VARIANTS} variants)`);

  for (let v = 1; v <= VARIANTS; v++) {
    const outPath = path.join(OUT_DIR, `${enemy.id.toLowerCase()}_pl_v${v}.png`);

    if (SKIP_EXISTING && fs.existsSync(outPath)) {
      console.log(`  v${v}: SKIP (exists)`);
      continue;
    }

    try {
      console.log(`  v${v}: requesting…`);
      const result = await pixellabRequest('generate-image', {
        description:    `${enemy.prompt} ### NEG: ${NEG}`,
        image_size:     { width: size, height: size },
        no_background:  true,
        // BitForge pixel art model — best for isometric sprites
        text_guidance_scale: 7.5,
        // Slight variation seed per variant (PixelLab ignores exact seed but this
        // documents intent; API uses internal random if seed is omitted)
      });

      // Response: { image: { base64: "…" } } or { image_url: "…" }
      let b64;
      if (result.image && result.image.base64) {
        b64 = result.image.base64;
      } else if (result.image && typeof result.image === 'string') {
        b64 = result.image;
      } else if (result.base64) {
        b64 = result.base64;
      } else {
        console.warn(`  v${v}: unexpected response shape:`, JSON.stringify(result).slice(0, 200));
        continue;
      }

      const clean = b64.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(outPath, Buffer.from(clean, 'base64'));
      console.log(`  v${v}: saved → ${path.basename(outPath)}`);

      // Rate-limit: ~200ms between requests
      await sleep(250);

    } catch (err) {
      console.error(`  v${v}: ERROR — ${err.message}`);
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   Puppy Force — PixelLab Sprite Generator            ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`Set: ${SPRITE_SET}  |  Skip existing: ${SKIP_EXISTING}`);
  console.log(`Output: ${OUT_DIR}\n`);

  // Filter by SPRITE_SET
  const toGenerate = ENEMIES.filter(e => {
    if (SPRITE_SET === 'all')     return true;
    if (SPRITE_SET === 'bosses')  return e.isBoss;
    if (SPRITE_SET === 'enemies') return !e.isBoss;
    return true;
  });

  console.log(`Generating ${toGenerate.length} enemies (${VARIANTS} variants each)…`);

  let ok = 0, fail = 0;
  for (const enemy of toGenerate) {
    try {
      await generateEnemy(enemy);
      ok++;
    } catch (err) {
      console.error(`\nFATAL ${enemy.id}: ${err.message}`);
      fail++;
    }
    await sleep(500);
  }

  console.log('\n──────────────────────────────────────────────────────');
  console.log(`Done: ${ok} ok, ${fail} failed`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Review variants (_pl_v1 … _pl_v4)');
  console.log('  2. Copy best to canonical name:');
  console.log('       cp assets/enemies/scout_cat_pl_v2.png assets/enemies/scout_cat_v1.png');
  console.log('  3. For boss cats, the game will render them 60% larger automatically.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
