#!/usr/bin/env node
'use strict';

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const API_KEY    = process.env.AIHORDE_API_KEY || '0000000000';
const BASE_URL   = 'https://aihorde.net';
const POLL_MS    = 8000;
const TIMEOUT_MS = 600000;
const OUT_DIR    = path.join(__dirname, '..', 'assets', 'enemies');

const STYLE_SUFFIX = 'anthropomorphic cat warrior, pixel art, retro Shining Force style, 1990s Sega Genesis sprite, chibi proportions, game sprite, transparent background, clean outlines, flat shading';
const NEG = 'blurry, low quality, realistic, photorealistic, 3d render, human, dog, wolf, multiple characters, text, watermark, signature, background scenery, gradient background, noise, extra limbs, deformed';

const ENEMIES = [
  { id: 'SCOUT_CAT',        n: 4, prompt: 'anthropomorphic orange tabby cat scout warrior, light leather armor, dagger on belt, tabby stripes on fur, green slit eyes, alert expression, red bandana around neck, standing pose, ' + STYLE_SUFFIX },
  { id: 'ALLEY_CAT',        n: 4, prompt: 'anthropomorphic grey alley cat boss fighter, boss character imposing detailed armor, dark grey fur, red scar across left eye, red crown on head, sharp claw weapons, torn battle cloak, fierce menacing expression, powerful stance, ' + STYLE_SUFFIX },
  { id: 'SIAMESE_ASSASSIN', n: 4, prompt: 'anthropomorphic Siamese cat assassin, cream and dark brown fur, blue eyes, black ninja mask covering lower face, dark leather armor, hidden blade at side, stealthy crouching pose, shadow cloak, ' + STYLE_SUFFIX },
  { id: 'PERSIAN_SORCERER', n: 4, prompt: 'anthropomorphic Persian cat sorcerer mage, wizard robes, magical staff, glowing purple eyes, grey and white fluffy fur, jewel gem on forehead, magical sparkles around hands, robe with arcane symbols, standing casting pose, ' + STYLE_SUFFIX },
  { id: 'TIGER_GENERAL',    n: 4, prompt: 'anthropomorphic tiger cat general soldier, orange fur with black tiger stripes, olive green military helmet with red plume, heavy armor, spear in hand, stern commanding expression, authoritative standing pose, ' + STYLE_SUFFIX },
  { id: 'LYNX_RANGER',      n: 4, prompt: 'anthropomorphic lynx cat ranger boss, boss character imposing detailed armor, beige and grey spotted fur, tufted ear tips, green ranger crown with arrow motif, bow and quiver, ranger leather armor, sharp focused eyes, ready-to-shoot pose, ' + STYLE_SUFFIX },
  { id: 'SNOW_LEOPARD',     n: 4, prompt: 'anthropomorphic snow leopard cat knight boss, boss character imposing detailed armor, white and grey fur with rosette spots, ice crystal crown, silver plate armor, sword raised, cold blue eyes, regal imposing pose, frost and ice crystal effects, ' + STYLE_SUFFIX },
  { id: 'RIVER_PANTHER',    n: 4, prompt: 'anthropomorphic dark panther cat swimmer boss, boss character imposing detailed armor, dark navy blue and black fur, teal glowing eyes, wave-pattern crown, water droplets on fur, aquatic armor with wave motifs, claws bared, powerful aquatic warrior pose, ' + STYLE_SUFFIX },
  { id: 'SAND_CAT_KING',    n: 4, prompt: 'anthropomorphic sand cat king boss, boss character imposing detailed armor, sandy golden fur, Egyptian pharaoh headdress with blue and gold stripes, cobra uraeus serpent on crown, golden blade sword, ornate Egyptian armor, amber slit eyes, regal commanding desert king pose, ' + STYLE_SUFFIX },
  { id: 'PERSIAN_QUEEN',    n: 4, prompt: 'anthropomorphic Persian cat queen sorceress boss, boss character imposing detailed armor, wizard robes, magical staff, glowing eyes, white cream fur, elaborate gold queen crown with pink gems, fluffy neck ruff, magical stave with glowing orb, imperious regal pose, pink magical aura, ' + STYLE_SUFFIX },
  { id: 'CAT_EMPEROR',      n: 4, prompt: 'anthropomorphic cat emperor final boss, boss character imposing detailed armor, dark purple fur, enormous ornate purple crown with 5 glowing gems, glowing red slit eyes, majestic dark emperor robes, dark mageblade sword radiating dark energy, evil purple aura surrounding, ominous triangle marking on forehead, final boss supreme villain pose, ' + STYLE_SUFFIX },
];

function request(method, urlStr, headers, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    const options = {
      hostname: url.hostname, port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search, method,
      headers: { 'Content-Type': 'application/json', 'apikey': API_KEY, ...headers }
    };
    const req = lib.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(text)); } catch(e) { resolve(text); }
        } else { reject(new Error('HTTP ' + res.statusCode + ': ' + text)); }
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
        file.close(); fs.unlink(destPath, () => {});
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(destPath); });
    }).on('error', err => { fs.unlink(destPath, () => {}); reject(err); });
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function generateEnemy(enemy) {
  // Check if all variants exist
  const allExist = Array.from({length: enemy.n}, (_, i) =>
    fs.existsSync(path.join(OUT_DIR, enemy.id.toLowerCase() + '_v' + (i+1) + '.png'))
  ).every(Boolean);
  if (allExist) { console.log('  [SKIP] ' + enemy.id + ' already done'); return; }

  console.log('\n[' + enemy.id + '] Generating ' + enemy.n + ' variants...');
  const payload = {
    prompt: enemy.prompt + ' ### ' + NEG,
    models: ['AIO Pixel Art', 'PixelArt XL', 'Anything Diffusion'],
    params: { width: 256, height: 256, steps: 40, cfg_scale: 7, sampler_name: 'k_euler', n: enemy.n },
    nsfw: false, slow_workers: true
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
    console.log('  queue:' + (status.queue_position||'?') + ' elapsed:' + Math.round((Date.now()-startTime)/1000) + 's');
    if (status.done) { gens = status.generations; break; }
    if (status.faulted) throw new Error('Job faulted');
  }

  for (let i = 0; i < gens.length; i++) {
    const g = gens[i];
    const outPath = path.join(OUT_DIR, enemy.id.toLowerCase() + '_v' + (i+1) + '.png');
    if (g.img && g.img.startsWith('http')) {
      await downloadFile(g.img, outPath);
    } else if (g.img) {
      const b64 = g.img.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
    }
    console.log('  Saved: ' + path.basename(outPath));
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('Puppy Force Enemy Sprite Generator');
  console.log('API: ' + (API_KEY === '0000000000' ? 'ANONYMOUS' : 'Authenticated'));
  console.log('Output: ' + OUT_DIR);

  let ok = 0, fail = 0;
  for (const enemy of ENEMIES) {
    try { await generateEnemy(enemy); ok++; }
    catch (err) { console.error('  ERROR ' + enemy.id + ': ' + err.message); fail++; }
    await sleep(2000);
  }
  console.log('\nDone: ' + ok + ' ok, ' + fail + ' failed');
  console.log('Next: review variants, copy best to canonical name:');
  console.log('  cp assets/enemies/scout_cat_v1.png assets/enemies/scout_cat.png');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
