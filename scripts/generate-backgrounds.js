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
const OUT_DIR    = path.join(__dirname, '..', 'assets', 'backgrounds');

const STYLE = 'anime tactical RPG map, overhead top-down aerial view, Fire Emblem GBA map style, isometric battlefield texture, detailed terrain top view, soft lighting, vibrant colors, no characters, no text, no UI, ';
const NEG_BASE = 'characters, people, animals, cats, dogs, text, watermark, signature, ui elements, hud, blurry, low quality, bad anatomy, cropped, jpeg artifacts, deformed';

const CHAPTERS = [
  { id: 1, file: 'chapter_1', model: 'Anything Diffusion',
    prompt: STYLE + 'bird\'s eye top-down view of village countryside, grassy meadow fields viewed from directly above, dirt crossroads visible below, small thatched-roof houses seen from top, garden fences and stone walls, tall oak tree canopies, rolling green hills texture, warm amber and green color palette, peaceful village under siege, tactical map texture',
    neg: NEG_BASE + ', urban, cars, futuristic, dark, gloomy, horizon, sky, perspective, 3d' },
  { id: 2, file: 'chapter_2', model: 'Anything Diffusion',
    prompt: STYLE + 'bird\'s eye top-down aerial view of ancient dense forest, tree canopy viewed from above, green forest treetops covering most of map, winding dirt path visible through gaps in canopy, low ground mist between trees, mossy stones on forest floor, dusk lighting through leaves, blue-green and gold palette, mysterious forest map texture',
    neg: NEG_BASE + ', open fields, bright sunny, urban, buildings, ground level, horizon, sky' },
  { id: 3, file: 'chapter_3', model: 'Deliberate',
    prompt: STYLE + 'bird\'s eye top-down view of snowy mountain pass, aerial view of snow-covered rocky terrain, white snow patches on grey rock, narrow stone path winding through mountain ridge seen from above, sparse pine tree tops visible below, crisp cold winter terrain texture, grey-blue and white palette, icy rocky ground texture, tactical map overhead',
    neg: NEG_BASE + ', desert, tropical, warm colors, green jungle, ground level, horizon, sky, perspective' },
  { id: 4, file: 'chapter_4', model: 'Anything Diffusion',
    prompt: STYLE + 'bird\'s eye top-down aerial view of river crossing, broad blue river seen from directly above, grassy riverbanks on both sides, wooden plank bridge spanning the water viewed from top, forest edges on both shores visible as treetops, cloud reflections on river surface, lush green and blue map texture, midday lighting, tactical overhead battlefield',
    neg: NEG_BASE + ', desert, snow, mountains, castle, dark, stormy, ground level, horizon, sky' },
  { id: 5, file: 'chapter_5', model: 'Deliberate',
    prompt: STYLE + 'bird\'s eye top-down aerial view of desert landscape, vast sandy dunes viewed from directly above, dry sandy road winding through dunes seen from top, circular palm tree oasis with turquoise water pool visible below, ancient sandstone ruins seen from overhead, amber gold and burnt orange sand texture, deep shadows in dune valleys, desert tactical map',
    neg: NEG_BASE + ', forest, snow, mountains, dark, night, urban, ground level, horizon, sky, perspective' },
  { id: 6, file: 'chapter_6', model: 'Deliberate',
    prompt: STYLE + 'bird\'s eye top-down view of dark stone fortress interior, castle floor plan seen from directly above, grey stone-block walls and corridors viewed from top, stone-tiled floor with iron gate outlines, burning torches casting warm orange glow on stone floor, castle room layout visible from overhead, dark purple and grey stone texture, gothic castle tactical map',
    neg: NEG_BASE + ', outdoor, nature, desert, forest, bright sunlight, cheerful, ground level, horizon, perspective' },
  { id: 7, file: 'chapter_7', model: 'Anything Diffusion',
    prompt: STYLE + 'bird\'s eye top-down view of epic throne room and castle grounds, aerial overhead view of final castle battlefield, ornate stone-tiled throne room floor seen from above, magical glowing moat channels forming cross pattern, castle courtyard stone floor texture, mosaic patterns on floor, magical floating lights casting purple and gold glow, grand castle tactical map seen from directly above',
    neg: NEG_BASE + ', small scale, mundane, plain, outdoor, photorealistic, ground level, horizon, sky, perspective' },
  { id: 'title_bg', file: 'title_bg', model: 'Anything Diffusion',
    prompt: STYLE + 'atmospheric night sky anime landscape, ancient castle silhouette on distant hill, moonlit battlefield clearing, dark rolling hills with pine tree silhouettes, stars and moon, drifting mist near ground, faint camp lights in valley, deep midnight blue and navy palette, very dark and moody, no foreground subjects, simple open composition for text overlay, cinematic wide shot, JRPG title screen atmosphere',
    neg: NEG_BASE + ', bright day, cheerful, crowded, busy details, foreground clutter, high contrast, cats, dogs, characters' },
  { id: 'title_art', file: 'title', model: 'Anything Diffusion',
    prompt: 'kemono, anthro dogs, furry art, group of anime dog warriors assembled for battle, golden retriever knight in armor, corgi healer in white robes, husky cavalry on horseback, beagle archer with bow, poodle mage with staff, chibi-adjacent cel shaded, Fire Emblem GBA character art style, detailed anime RPG heroes, warm epic lighting, dramatic poses, horizontal banner composition, dogs vs cats tactical RPG, vibrant colors, white background',
    neg: 'nsfw, human face, human ears, human nose, human skin, no fur, cat, feline, realistic, 3d render, blurry, watermark, dark background, text' },
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

async function generateChapter(ch) {
  const out1 = path.join(OUT_DIR, ch.file + '_v1.png');
  const out2 = path.join(OUT_DIR, ch.file + '_v2.png');
  if (fs.existsSync(out1) && fs.existsSync(out2)) { console.log('  [SKIP] Chapter ' + ch.id + ' already done'); return; }

  console.log('\n[CHAPTER ' + ch.id + '] ' + ch.file);
  const payload = {
    prompt: ch.prompt + ' ### ' + ch.neg,
    models: [ch.model, 'Anything Diffusion', 'Deliberate'],
    params: {
      // Chapter maps are portrait 26×32 tiles (0.8125 ratio) → 512×640 fits perfectly.
      // Title bg is portrait 512×768; title art is landscape 768×384.
      width:  ch.id === 'title_bg' ? 512 : (ch.id === 'title_art' ? 768 : 512),
      height: ch.id === 'title_bg' ? 768 : (ch.id === 'title_art' ? 384 : 640),
      steps: 35, cfg_scale: 7, sampler_name: 'k_euler', karras: true, n: 2
    },
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
    console.log('  queue:' + (status.queue_position||'?') + ' elapsed:' + Math.round((Date.now()-startTime)/1000) + 's done:' + status.done);
    if (status.done) { gens = status.generations; break; }
    if (status.faulted) throw new Error('Job faulted');
  }

  for (let i = 0; i < gens.length; i++) {
    const g = gens[i];
    const outPath = path.join(OUT_DIR, ch.file + '_v' + (i+1) + '.png');
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
  console.log('Puppy Force Background Generator');
  console.log('API: ' + (API_KEY === '0000000000' ? 'ANONYMOUS' : 'Authenticated'));
  console.log('Output: ' + OUT_DIR);

  let ok = 0, fail = 0;
  for (const ch of CHAPTERS) {
    try { await generateChapter(ch); ok++; }
    catch (err) { console.error('  ERROR ch' + ch.id + ': ' + err.message); fail++; }
    await sleep(2000);
  }
  console.log('\nDone: ' + ok + ' ok, ' + fail + ' failed');
  console.log('Next: review variants, copy best: cp assets/backgrounds/chapter_1_v1.png assets/backgrounds/chapter_1.png');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
