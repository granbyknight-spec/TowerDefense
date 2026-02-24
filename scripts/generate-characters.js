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
const OUT_DIR    = path.join(__dirname, '..', 'assets', 'characters');

const STYLE_PREFIX = 'score_9, score_8_up, masterpiece, best quality, ultra-detailed, anime jRPG character portrait, Fire Emblem aesthetic, Shining Force style, cute chibi-adjacent anime, warm cel shading, vibrant color palette, game card illustration style';
const NEG = 'nsfw, nude, suggestive, realistic photograph, 3d render, ugly, deformed, bad anatomy, extra limbs, blurry, low quality, watermark, signature, text overlay, human face, cat, feline features, washed out, overexposed, monochrome';

const HEROES = [
  { id: 'PUPPY_KNIGHT',   portrait: 'cute golden retriever puppy knight, blue knight visor helmet with red plume, silver armor pauldrons, sapphire blue eyes, heroic determined expression, warm golden fur, cel shaded, dark blue gradient background, bust shot, vibrant colors, thick clean outlines' },
  { id: 'CORGI_HEALER',   portrait: 'cute pembroke welsh corgi puppy healer, white and green healer robes, green cross symbol on forehead, emerald green eyes, gentle kind smile, cream fur, magical sparkles, cel shaded, dark teal gradient background, bust shot' },
  { id: 'LABRADOR_SCOUT', portrait: 'cute yellow labrador puppy warrior, red bandana headband, amber brown eyes, grinning confident expression, golden-brown fur, leather armor, scout look, cel shaded, dark brown gradient background, bust shot' },
  { id: 'BEAGLE_ARCHER',  portrait: 'cute tricolor beagle puppy archer, green ranger hood, arrow quiver strap, dark saddle patch on head, focused sharp eyes, dark brown eyes, black tan white fur markings, archery visor, cel shaded, dark forest green gradient background, bust shot' },
  { id: 'POODLE_MAGE',    portrait: 'cute lavender standard poodle puppy mage, purple mage robes, gold star on forehead, poodle pompom curls, violet amethyst eyes, mysterious smile, magical purple sparkles, wand tip, cel shaded, dark purple gradient background, bust shot' },
  { id: 'BULLDOG_TANK',   portrait: 'cute grey english bulldog puppy tank, heavy dark iron armor, spiked collar, stern furrowed brows, small fierce eyes, stocky wrinkled face, cute fang, shield emblem, cel shaded, dramatic dark grey background, bust shot' },
  { id: 'HUSKY_RIDER',    portrait: 'cute siberian husky puppy cavalry, leather harness gold buckles, blue heterochromia eyes, black white husky mask markings, confident dashing smile, lance visible, grey white fur, cel shaded, dark navy blue gradient background, bust shot' },
  { id: 'TERRIER_THIEF',  portrait: 'cute rust-red jack russell terrier puppy thief, black eye mask, red scarf, dagger earring, mischievous grin, amber orange eyes, tan rust fur, nimble look, cel shaded, dramatic side lighting dark red background, bust shot' },
  { id: 'DOG_PALADIN',    portrait: 'majestic golden retriever paladin, gold full plate armor, white holy wings, ornate gold blue helm, white cross breastplate, radiant royal blue eyes, noble expression, holy light glow, divine background gold particles, bust shot' },
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

async function generate(hero) {
  const outputPath = path.join(OUT_DIR, hero.id + '_portrait.png');
  if (fs.existsSync(outputPath)) { console.log('  [SKIP] ' + hero.id + ' already exists'); return outputPath; }

  console.log('\n[' + hero.id + '] Generating portrait...');
  const fullPrompt = STYLE_PREFIX + ', ' + hero.portrait;
  const payload = {
    prompt: fullPrompt + ' ### ' + NEG,
    models: ['Animagine XL 3.1', 'Anything Diffusion', 'Deliberate'],
    params: { width: 512, height: 512, steps: 28, cfg_scale: 7, sampler_name: 'k_euler_a', karras: true, clip_skip: 2, n: 1 },
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

  const gen = gens[0];
  if (gen.img && gen.img.startsWith('http')) {
    await downloadFile(gen.img, outputPath);
  } else if (gen.img) {
    const b64 = gen.img.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(outputPath, Buffer.from(b64, 'base64'));
  }
  console.log('  Saved: ' + path.basename(outputPath));
  return outputPath;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('Puppy Force Character Portrait Generator');
  console.log('API: ' + (API_KEY === '0000000000' ? 'ANONYMOUS' : 'Authenticated'));
  console.log('Output: ' + OUT_DIR);

  let ok = 0, fail = 0;
  for (const hero of HEROES) {
    try {
      await generate(hero);
      ok++;
    } catch (err) {
      console.error('  ERROR ' + hero.id + ': ' + err.message);
      fail++;
    }
    await sleep(1500);
  }
  console.log('\nDone: ' + ok + ' ok, ' + fail + ' failed');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
