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
// Set ROTATE=true to generate 8 directional views after the base sprite.
// Directional outputs: assets/enemies/<id>_dir_S.png … _dir_NW.png
// These are ready for BattleScene to swap in during movement animation.
const DO_ROTATE     = process.env.ROTATE === 'true';
// STYLE_MODE: 'dark' | 'chibi' | 'both'  (default: 'both')
const STYLE_MODE    = process.env.STYLE_MODE || 'both';
const OUT_DIR       = path.join(__dirname, '..', 'assets', 'enemies');
const VARIANTS      = 4;

// 8 compass directions in PixelLab's output order (starting south, clockwise)
const DIRECTIONS = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];

// ── Shared style tags ───────────────────────────────────────────────────────
// Visual target: muscular dark fantasy warrior cats — think WoW / FFXIV
// character art. NOT chibi. Fierce, detailed, imposing.

const STYLE_NORMAL = [
  'anthropomorphic cat warrior character',
  'dark fantasy pixel art game sprite',
  'muscular athletic build',
  'fierce expression glowing eyes',
  'detailed fantasy equipment and armor',
  'dynamic battle-ready pose',
  'dramatic pixel art shading',
  'game character sprite sheet style',
  'transparent background',
  'clean bold pixel outlines',
  '64x64 pixel art',
].join(', ');

const STYLE_BOSS = [
  'anthropomorphic cat boss villain character',
  'dark fantasy pixel art game sprite',
  'massive imposing muscular build',
  'snarling bared fangs ferocious expression',
  'glowing malevolent eyes',
  'highly detailed ornate fantasy armor with engravings',
  'weapon radiating magical energy aura and light effects',
  'powerful dynamic commanding stance',
  'dramatic high contrast lighting with deep shadows',
  'epic game boss character sprite',
  'transparent background',
  'clean bold pixel outlines',
  'detailed pixel shading with bright highlights',
  '128x128 pixel art',
].join(', ');

// ── Chibi style variants ─────────────────────────────────────────────────────
// Cute, kawaii, super-deformed proportions — for comparison in the Inn gallery.

const STYLE_NORMAL_CHIBI = [
  'anthropomorphic cat warrior character',
  'cute chibi pixel art game sprite',
  'super deformed chibi proportions, big head small body',
  'adorable kawaii expression',
  'colorful fantasy equipment',
  'friendly cheerful pose',
  'clean bold pixel outlines',
  'transparent background',
  '64x64 pixel art',
].join(', ');

const STYLE_BOSS_CHIBI = [
  'anthropomorphic cat boss character',
  'cute chibi pixel art game sprite',
  'super deformed chibi big head tiny body',
  'comically adorable attempting to look fierce',
  'colorful detailed ornate fantasy armor',
  'oversized weapon prop',
  'round sparkly eyes',
  'clean bold pixel outlines',
  'transparent background',
  '128x128 pixel art',
].join(', ');

const NEG = [
  'blurry', 'low quality', 'low detail', 'simple', 'flat', 'cute', 'kawaii',
  'chibi', 'super deformed', 'cartoonish soft style',
  'realistic', 'photorealistic', '3d render',
  'human', 'dog', 'wolf', 'multiple characters',
  'text', 'watermark', 'signature', 'background scenery',
  'gradient background', 'noise', 'extra limbs', 'deformed',
].join(', ');

// ── Enemy definitions ────────────────────────────────────────────────────────
// Visual inspiration: muscular anthropomorphic cat warriors with rich
// dark fantasy designs — detailed armor, glowing weapons, fierce poses.
// isBoss: true  → 128×128, massive build, dramatic magical effects
// isBoss: false → 64×64, athletic build, strong but not overwhelming

const ENEMIES = [
  // ── Regular enemies — tough soldiers, not bosses ────────────────────────────
  {
    id: 'SCOUT_CAT',
    isBoss: false,
    prompt: `orange tabby cat scout warrior, lean athletic build, worn leather scouting armor with metal buckles, short dagger in hand, amber slit eyes alert and watchful, red bandana tied around neck, crouching ready stance, tabby stripe markings on fur, scarred muzzle, ${STYLE_NORMAL}`,
  },
  {
    id: 'SIAMESE_ASSASSIN',
    isBoss: false,
    prompt: `Siamese cat assassin, slim but muscular build, dark cream and brown fur with Siamese point markings, icy blue glowing eyes, black tactical leather armor, twin curved short blades crackling with blue shadow energy, half-crouching combat-ready pose, dark hood partially concealing face, ${STYLE_NORMAL}`,
  },
  {
    id: 'PERSIAN_SORCERER',
    isBoss: false,
    prompt: `Persian cat battle mage, athletic robed build, grey and white fluffy thick fur, deep purple glowing eyes, dark arcane battle robes with gold trim, gnarled magical staff topped with glowing purple crystal orb, arcane rune circle at feet, hand raised in casting gesture, ${STYLE_NORMAL}`,
  },
  {
    id: 'TIGER_GENERAL',
    isBoss: false,
    prompt: `tiger cat military general, heavily built muscular soldier, vivid orange fur with bold black tiger stripes, battle-worn heavy plate armor, red war plume on iron helmet, war spear gripped in both hands, battle scars across muzzle, stern commanding fierce expression, ${STYLE_NORMAL}`,
  },

  // ── Boss cats — massive builds, spectacular weapons, devastating presence ────
  {
    id: 'ALLEY_CAT',
    isBoss: true,
    // Reference: white armored knight cat from reference image — adapt to grey scarred brawler
    prompt: `grey battle-hardened alley cat warlord, enormous muscular scarred body, cracked dark iron plate armor with gold rivets and red lining, massive spiked claw gauntlets crackling with red energy, deep claw scar across left eye glowing red, fangs bared in a snarl, hunched forward aggressive brawler stance, torn armored cape, ${STYLE_BOSS}`,
  },
  {
    id: 'LYNX_RANGER',
    isBoss: true,
    // Reference: grey archer cat from reference image
    prompt: `lynx cat master ranger, powerful muscular archer build, pale grey and beige spotted lynx fur, black-tufted ears, piercing golden predator eyes, dark green hardened leather ranger armor with pauldrons, enormous ornate war bow fully drawn with glowing nocked arrow, quiver of enchanted arrows across back, cloak whipping in wind, ${STYLE_BOSS}`,
  },
  {
    id: 'SNOW_LEOPARD',
    isBoss: true,
    // Reference: white cat with massive glowing sword from reference image
    prompt: `snow leopard ice champion, hugely muscular white and grey spotted fur body, elaborate silver plate armor with frost rune engravings and blue crystal accents, massive two-handed greatsword held overhead crackling with white ice-lightning energy, blue-white eyes glowing with cold fury, triumphant roaring battle cry pose, swirling ice and lightning particles, ${STYLE_BOSS}`,
  },
  {
    id: 'RIVER_PANTHER',
    isBoss: true,
    // Reference: black cat with dual blades and blue aura from reference image
    prompt: `black panther aquatic warlord, powerfully muscular sleek black fur, teal bioluminescent glowing eyes, twin curved aquatic war blades glowing with teal blue water energy, dark scaled deep-sea plate armor with wave crest motifs, water streaming and rippling around body, low crouching combat stance, menacing wide grin showing fangs, ${STYLE_BOSS}`,
  },
  {
    id: 'SAND_CAT_KING',
    isBoss: true,
    // Desert pharaoh warrior — golden armor, solar energy weapons
    prompt: `sand cat desert pharaoh warlord, massively built golden-furred cat, ornate Egyptian-style plate armor in gold and lapis blue, double pharaoh war crown with cobra uraeus serpent, large khopesh sword radiating blinding golden solar energy, amber eyes glowing like the sun, commanding arm outstretched, golden light and sand vortex aura, ${STYLE_BOSS}`,
  },
  {
    id: 'PERSIAN_QUEEN',
    isBoss: true,
    // Reference: old white wizard cat or the green nature mage — regal and terrifying sorceress
    prompt: `white Persian cat sorceress queen, tall imposing robed figure with muscular presence, pure white thick fluffy fur, elaborate gold and amethyst crown with five tall spires, flowing deep purple arcane battle robes with glowing gold sigils, enormous magical staff with a pulsing violet storm orb, violet and white arcane lightning storm spiraling around her, imperious arm raised commanding the storm, ${STYLE_BOSS}`,
  },
  {
    id: 'CAT_EMPEROR',
    isBoss: true,
    // Reference: huge brown berserker cat from reference image — adapt as dark void emperor
    prompt: `cat emperor supreme final boss, colossal hulking dark purple-black furred muscular body dwarfing all others, enormous ornate void-black crown with five bleeding blood-red gems, malevolent blood-red glowing slit eyes, heavy dark emperor plate armor consumed by shadow runes, massive void greatsword held aloft wreathed in swirling black and purple energy, dark void shadows and corruption aura consuming everything around, evil triangle scar on forehead, earth-shaking power stance, ${STYLE_BOSS}`,
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

// ── Decode PixelLab image response to base64 string ─────────────────────────
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

// ── Generate 8-directional views for a base sprite ──────────────────────────
async function rotateSprite(baseB64, id, size) {
  console.log(`  [ROTATE] Requesting 8-directional views (${size}×${size})…`);

  // Check if all directions already exist
  const allExist = DIRECTIONS.every(dir =>
    !SKIP_EXISTING || !fs.existsSync(path.join(OUT_DIR, `${id.toLowerCase()}_dir_${dir}.png`))
      ? false : true
  );
  if (allExist) { console.log('  [ROTATE] All directions exist — skipping'); return; }

  try {
    const result = await pixellabRequest('rotate', {
      image:        { base64: baseB64 },
      n_directions: 8,
      view:         'low top-down',   // isometric projection
      size:         { width: size, height: size },
      // 'default' proportions gives solid muscular bodies (not chibi)
      proportions:  'default',
    });

    // Response: { images: [ {base64:…}, … ] } — one per direction in DIRECTIONS order
    const images = result.images || result.frames || [];
    if (images.length === 0) {
      console.warn('  [ROTATE] No images in response:', JSON.stringify(result).slice(0, 200));
      return;
    }

    for (let i = 0; i < Math.min(images.length, DIRECTIONS.length); i++) {
      const dir     = DIRECTIONS[i];
      const outPath = path.join(OUT_DIR, `${id.toLowerCase()}_dir_${dir}.png`);
      const b64     = extractB64(images[i]) || (typeof images[i] === 'string' ? images[i] : null);
      if (!b64) { console.warn(`  [ROTATE] No image data for direction ${dir}`); continue; }
      saveB64(b64, outPath);
      console.log(`  [ROTATE] Saved ${dir} → ${path.basename(outPath)}`);
    }

    await sleep(300);
  } catch (err) {
    console.error(`  [ROTATE] ERROR — ${err.message}`);
  }
}

// ── Generate one enemy (VARIANTS variants + optional 8-dir rotation) ─────────
async function generateEnemy(enemy) {
  const size  = enemy.isBoss ? 128 : 64;
  const label = enemy.isBoss ? '[BOSS]' : '[cat] ';
  console.log(`\n${label} ${enemy.id}  (${size}×${size}, ${VARIANTS} variants)`);

  let bestB64 = null; // saved for rotate step

  // Generate for each requested style
  const stylesToGen = [];
  if (STYLE_MODE === 'dark' || STYLE_MODE === 'both') stylesToGen.push('dark');
  if (STYLE_MODE === 'chibi' || STYLE_MODE === 'both') stylesToGen.push('chibi');

  for (const styleMode of stylesToGen) {
    const suffix  = styleMode === 'chibi' ? '_chibi' : '_pl';
    const styleTags = styleMode === 'chibi'
      ? (enemy.isBoss ? STYLE_BOSS_CHIBI : STYLE_NORMAL_CHIBI)
      : (enemy.isBoss ? STYLE_BOSS       : STYLE_NORMAL);

    // For chibi, extract base prompt without the dark style suffix already embedded
    // We use the character-specific part only + the new chibi style
    const basePrompt = enemy.prompt
      .replace(STYLE_BOSS, '').replace(STYLE_NORMAL, '').trim().replace(/,\s*$/, '');
    const fullPrompt = styleMode === 'chibi'
      ? `${basePrompt}, ${styleTags}`
      : enemy.prompt;

    for (let v = 1; v <= VARIANTS; v++) {
      const outPath = path.join(OUT_DIR, `${enemy.id.toLowerCase()}${suffix}_v${v}.png`);

      if (SKIP_EXISTING && fs.existsSync(outPath)) {
        console.log(`  [${styleMode}] v${v}: SKIP (exists)`);
        if (!bestB64 && DO_ROTATE && styleMode === 'dark') {
          bestB64 = fs.readFileSync(outPath).toString('base64');
        }
        continue;
      }

      try {
        console.log(`  [${styleMode}] v${v}: requesting…`);
        const result = await pixellabRequest('generate-image', {
          description:         `${fullPrompt} ### NEG: ${NEG}`,
          image_size:          { width: size, height: size },
          no_background:       true,
          text_guidance_scale: 7.5,
        });

        const b64 = extractB64(result);
        if (!b64) {
          console.warn(`  [${styleMode}] v${v}: unexpected response:`, JSON.stringify(result).slice(0, 200));
          continue;
        }

        saveB64(b64, outPath);
        console.log(`  [${styleMode}] v${v}: saved → ${path.basename(outPath)}`);
        if (!bestB64 && styleMode === 'dark') bestB64 = b64;

        await sleep(250);
      } catch (err) {
        console.error(`  [${styleMode}] v${v}: ERROR — ${err.message}`);
      }
    }
  }

  // ── Optional: generate 8 directional views from the best base sprite ────────
  if (DO_ROTATE && bestB64) {
    await rotateSprite(bestB64, enemy.id, size);
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
