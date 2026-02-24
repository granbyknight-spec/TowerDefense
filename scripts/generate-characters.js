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

// KEY: Standard anime models generate humans by default.
// Fix: lead every prompt with strong kemono/furry/anthro dog keywords,
// use models known for animal characters, and hard-negative human anatomy.
const STYLE_PREFIX = 'kemono, anthro dog, furry art, anthropomorphic canine, animal ears, dog snout, dog nose, dog face, non-human face, anime RPG character portrait, chibi-adjacent, cel shaded, vibrant colors, game card art';
const NEG = 'nsfw, nude, human, human face, human nose, human ears, human skin, no fur, hairless face, realistic human, 3d render, ugly, deformed, bad anatomy, extra limbs, blurry, low quality, watermark, cat, feline';

const HEROES = [
  { id: 'PUPPY_KNIGHT',   portrait: 'golden retriever dog knight, fluffy golden fur face, floppy dog ears, wet black dog nose, big brown puppy eyes, blue knight helmet with red plume, silver plate armor, heroic determined expression, dark blue background, bust portrait' },
  { id: 'CORGI_HEALER',   portrait: 'pembroke welsh corgi dog healer, orange and white fur face, pointy corgi ears, black dog nose, white and green healer robes, green cross emblem, gentle kind smile, magical sparkles, dark teal background, bust portrait' },
  { id: 'LABRADOR_SCOUT', portrait: 'yellow labrador dog warrior, golden fur face, floppy lab ears, black dog nose, red bandana headband, leather armor, wide grin, confident expression, dark brown background, bust portrait' },
  { id: 'BEAGLE_ARCHER',  portrait: 'tricolor beagle dog archer, black tan white fur face, long floppy beagle ears, brown dog nose, green ranger hood, arrow quiver strap, focused sharp eyes, dark forest green background, bust portrait' },
  { id: 'POODLE_MAGE',    portrait: 'white poodle dog mage, fluffy curly white fur face, poodle pompom ears, pink dog nose, purple mage robes with gold stars, magical sparkles, wand, mysterious smile, dark purple background, bust portrait' },
  { id: 'BULLDOG_TANK',   portrait: 'grey english bulldog dog tank, wrinkled stocky bulldog face, small rose ears, pushed-in black nose, heavy spiked iron armor, spiked collar, fierce furrowed brows, cute underbite fang, dark grey background, bust portrait' },
  { id: 'HUSKY_RIDER',    portrait: 'siberian husky dog cavalry, grey white fur face, pointed husky ears with black tips, blue and brown heterochromia eyes, black nose, blue silver armor, confident smile, dark navy background, bust portrait' },
  { id: 'TERRIER_THIEF',  portrait: 'jack russell terrier dog thief, tan white fur face, v-shaped terrier ears, black nose, black bandit eye mask, red scarf, dagger earring, mischievous grin, dark red background, bust portrait' },
  { id: 'DOG_PALADIN',    portrait: 'golden retriever dog paladin, fluffy golden fur face, floppy ears, black nose, gold full plate armor, white holy wings, ornate helm, noble expression, holy light glow, gold particles background, bust portrait' },
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
