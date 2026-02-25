#!/usr/bin/env node
'use strict';

// =============================================================================
// Puppy Force — generate-inn-styles.js
// Generates dark fantasy and chibi style portraits for the InnScene character
// cards. Outputs to assets/characters/<id_lowercase>_dark_v1.png etc. and
// assets/enemies/<id_lowercase>_dark_v1.png etc.
//
// Usage:
//   node scripts/generate-inn-styles.js
//   node scripts/generate-inn-styles.js --style dark
//   node scripts/generate-inn-styles.js --style chibi
//   node scripts/generate-inn-styles.js --style dark --type characters
//   node scripts/generate-inn-styles.js --style chibi --type enemies
// =============================================================================

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const API_KEY    = process.env.AIHORDE_API_KEY || '0000000000';
const BASE_URL   = 'https://aihorde.net';
const POLL_MS    = 8000;
const TIMEOUT_MS = 600000;

const CHAR_DIR   = path.join(__dirname, '..', 'assets', 'characters');
const ENEMY_DIR  = path.join(__dirname, '..', 'assets', 'enemies');

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

const styleArg = getArg('--style');   // 'dark' | 'chibi' | null (both)
const typeArg  = getArg('--type');    // 'characters' | 'enemies' | null (both)

const STYLES = (styleArg === 'dark' || styleArg === 'chibi') ? [styleArg] : ['dark', 'chibi'];
const TYPES  = (typeArg === 'characters' || typeArg === 'enemies') ? [typeArg] : ['characters', 'enemies'];

// ---------------------------------------------------------------------------
// Style definitions
// ---------------------------------------------------------------------------
const STYLE_DEFS = {
  dark: {
    models:  ['Deliberate', 'Anything Diffusion', 'Animagine XL 3.1'],
    params:  { width: 512, height: 512, steps: 30, cfg_scale: 7.5, sampler_name: 'k_euler_a', karras: true, clip_skip: 2, n: 1 },
    promptWrapper: (subject) =>
      'dark fantasy portrait of ' + subject +
      ', dramatic lighting, epic fantasy art, highly detailed, digital painting, moody atmosphere, dark background, cinematic, masterpiece',
    neg: 'nsfw, nude, chibi, kawaii, cute, pixel art, cartoon, low quality, blurry, watermark, text, signature, deformed, extra limbs, bad anatomy, 3d render, photorealistic',
  },
  chibi: {
    suffix:  'chibi_v1.png',
    models:  ['AIO Pixel Art', 'PixelArt XL', 'Anything Diffusion'],
    params:  { width: 512, height: 512, steps: 30, cfg_scale: 7, sampler_name: 'k_euler_a', n: 1 },
    promptWrapper: (subject) =>
      'cute chibi pixel art of ' + subject +
      ', vibrant colors, kawaii style, game sprite, adorable expression, simple clean background, bright palette, flat shading, clean outlines',
    neg: 'nsfw, nude, realistic, photorealistic, dark, gory, violent, low quality, blurry, watermark, text, signature, deformed, extra limbs, bad anatomy, 3d render',
  },
};

// ---------------------------------------------------------------------------
// Character (hero + ally) definitions — all player-side units from Config.js
// ---------------------------------------------------------------------------
const CHARACTERS = [
  {
    id: 'PUPPY_KNIGHT',
    subject: 'a golden retriever dog knight warrior, fluffy golden fur, floppy ears, blue knight armor with red plume, heroic determined expression',
  },
  {
    id: 'CORGI_HEALER',
    subject: 'a pembroke welsh corgi dog healer cleric, orange and white fur, pointy corgi ears, white and green healer robes, gentle kind expression',
  },
  {
    id: 'LABRADOR_SCOUT',
    subject: 'a yellow labrador dog warrior scout, golden fur, floppy ears, red bandana headband, leather armor, confident grin',
  },
  {
    id: 'BEAGLE_ARCHER',
    subject: 'a tricolor beagle dog archer ranger, black tan white fur, long floppy ears, green ranger hood, bow and quiver, focused sharp eyes',
  },
  {
    id: 'POODLE_MAGE',
    subject: 'a white poodle dog mage wizard, fluffy curly white fur, purple mage robes with gold stars, magical wand, mysterious expression',
  },
  {
    id: 'BULLDOG_TANK',
    subject: 'a grey english bulldog dog tank knight, wrinkled stocky face, heavy spiked iron armor, spiked collar, fierce expression with underbite fang',
  },
  {
    id: 'HUSKY_RIDER',
    subject: 'a siberian husky dog cavalry rider, grey and white fur, pointed ears, heterochromia blue and brown eyes, blue silver armor, confident expression',
  },
  {
    id: 'TERRIER_THIEF',
    subject: 'a jack russell terrier dog thief ninja, tan and white fur, black bandit eye mask, red scarf, dagger, mischievous grin',
  },
  {
    id: 'OTTER_ALLY',
    subject: 'a brown river otter swimmer warrior ally, sleek brown fur, small rounded ears, blue water-resistant tunic, swim goggles, cheerful friendly expression',
  },
  {
    id: 'FOX_SCOUT',
    subject: 'a red fox scout ranger, orange and white fox fur, pointed ears with black tips, amber eyes, green ranger cloak, leather scout armor, cunning smirk',
  },
];

// ---------------------------------------------------------------------------
// Enemy definitions — all enemies from Config.js
// ---------------------------------------------------------------------------
const ENEMIES = [
  {
    id: 'SCOUT_CAT',
    subject: 'an orange tabby cat scout warrior, tabby stripes, light leather armor, dagger, alert expression, red bandana',
  },
  {
    id: 'ALLEY_CAT',
    subject: 'a grey alley cat boss fighter, dark grey fur, red scar across eye, imposing spiked armor, sharp claw weapons, fierce menacing expression',
  },
  {
    id: 'SIAMESE_ASSASSIN',
    subject: 'a Siamese cat assassin, cream and dark brown fur, blue eyes, ninja mask, dark leather armor, hidden blade, stealthy expression',
  },
  {
    id: 'PERSIAN_SORCERER',
    subject: 'a Persian cat sorcerer mage, fluffy grey and white fur, jewel on forehead, wizard robes with arcane symbols, glowing magical staff',
  },
  {
    id: 'TIGER_GENERAL',
    subject: 'a tiger cat general warrior, orange fur with black stripes, military helmet with red plume, heavy armor, spear, stern commanding expression',
  },
  {
    id: 'LYNX_RANGER',
    subject: 'a lynx cat ranger boss, beige and grey spotted fur, tufted ear tips, ranger armor, bow and quiver, sharp focused eyes',
  },
  {
    id: 'SNOW_LEOPARD',
    subject: 'a snow leopard cat knight boss, white and grey fur with rosette spots, silver plate armor, ice crystal crown, sword raised, cold regal expression',
  },
  {
    id: 'RIVER_PANTHER',
    subject: 'a dark panther cat swimmer boss, dark navy and black fur, teal glowing eyes, aquatic armor with wave motifs, claws bared, powerful expression',
  },
  {
    id: 'SAND_CAT_KING',
    subject: 'a sand cat king boss, sandy golden fur, Egyptian pharaoh headdress, golden sword, ornate Egyptian armor, amber slit eyes, regal commanding expression',
  },
  {
    id: 'PERSIAN_QUEEN',
    subject: 'a Persian cat queen sorceress boss, white cream fluffy fur, elaborate gold crown with pink gems, magical staff with glowing orb, imperious regal expression',
  },
  {
    id: 'CAT_EMPEROR',
    subject: 'a cat emperor final boss, dark purple fur, enormous ornate purple crown with glowing gems, glowing red eyes, dark emperor robes, mageblade radiating dark energy, supreme villain expression',
  },
];

// ---------------------------------------------------------------------------
// HTTP helpers (identical pattern to generate-characters.js)
// ---------------------------------------------------------------------------
function request(method, urlStr, headers, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json', 'apikey': API_KEY, ...headers },
    };
    const req = lib.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(text)); } catch (e) { resolve(text); }
        } else {
          reject(new Error('HTTP ' + res.statusCode + ': ' + text));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const lib = isHttps ? https : http;
    const file = fs.createWriteStream(destPath);
    lib.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlink(destPath, () => {});
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(destPath); });
    }).on('error', err => { fs.unlink(destPath, () => {}); reject(err); });
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Core generation
// ---------------------------------------------------------------------------
async function generateOne(unitId, subject, style, outDir) {
  const styleDef   = STYLE_DEFS[style];
  let filename;
  if (style === 'chibi') {
    filename = unitId.toLowerCase() + '_chibi_v1.png';
  } else if (outDir === CHAR_DIR) {
    filename = unitId.toLowerCase() + '_sprite_v1.png';
  } else {
    filename = unitId.toLowerCase() + '_pl_v1.png';
  }
  const outputPath = path.join(outDir, filename);

  if (fs.existsSync(outputPath)) {
    console.log('  [SKIP] ' + filename + ' already exists');
    return outputPath;
  }

  console.log('\n[' + unitId + ' / ' + style + '] Generating...');

  const fullPrompt = styleDef.promptWrapper(subject);
  const payload = {
    prompt: fullPrompt + ' ### ' + styleDef.neg,
    models: styleDef.models,
    params: styleDef.params,
    nsfw: false,
    slow_workers: true,
  };

  const sub = await request('POST', BASE_URL + '/api/v2/generate/async', {}, payload);
  if (!sub.id) throw new Error('No job ID: ' + JSON.stringify(sub));
  console.log('  Job: ' + sub.id);

  const startTime = Date.now();
  let gens;
  while (true) {
    if (Date.now() - startTime > TIMEOUT_MS) throw new Error('Timeout');
    await sleep(POLL_MS);
    const status = await request('GET', BASE_URL + '/api/v2/generate/status/' + sub.id, {});
    console.log(
      '  queue:' + (status.queue_position || '?') +
      ' elapsed:' + Math.round((Date.now() - startTime) / 1000) + 's'
    );
    if (status.done)    { gens = status.generations; break; }
    if (status.faulted) throw new Error('Job faulted');
  }

  const gen = gens[0];
  if (gen.img && gen.img.startsWith('http')) {
    await downloadFile(gen.img, outputPath);
  } else if (gen.img) {
    const b64 = gen.img.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(outputPath, Buffer.from(b64, 'base64'));
  }
  console.log('  Saved: ' + filename);
  return outputPath;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  fs.mkdirSync(CHAR_DIR,  { recursive: true });
  fs.mkdirSync(ENEMY_DIR, { recursive: true });

  console.log('Puppy Force — Inn Style Portrait Generator');
  console.log('API:    ' + (API_KEY === '0000000000' ? 'ANONYMOUS' : 'Authenticated'));
  console.log('Styles: ' + STYLES.join(', '));
  console.log('Types:  ' + TYPES.join(', '));
  console.log('');

  let ok = 0, fail = 0;

  if (TYPES.includes('characters')) {
    console.log('=== CHARACTERS ===');
    for (const char of CHARACTERS) {
      for (const style of STYLES) {
        try {
          await generateOne(char.id, char.subject, style, CHAR_DIR);
          ok++;
        } catch (err) {
          console.error('  ERROR ' + char.id + ' [' + style + ']: ' + err.message);
          fail++;
        }
        await sleep(1500);
      }
    }
  }

  if (TYPES.includes('enemies')) {
    console.log('\n=== ENEMIES ===');
    for (const enemy of ENEMIES) {
      for (const style of STYLES) {
        try {
          await generateOne(enemy.id, enemy.subject, style, ENEMY_DIR);
          ok++;
        } catch (err) {
          console.error('  ERROR ' + enemy.id + ' [' + style + ']: ' + err.message);
          fail++;
        }
        await sleep(1500);
      }
    }
  }

  console.log('\nDone: ' + ok + ' ok, ' + fail + ' failed');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
