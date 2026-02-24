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

const STYLE = 'anime landscape, jRPG battle background, Fire Emblem style, detailed environment, soft lighting, vibrant colors, no characters, no text, tactical RPG battlefield, ';
const NEG_BASE = 'characters, people, animals, cats, dogs, text, watermark, signature, ui elements, hud, blurry, low quality, bad anatomy, cropped, jpeg artifacts, deformed';

const CHAPTERS = [
  { id: 1, file: 'chapter_1', model: 'Anything Diffusion',
    prompt: STYLE + 'wide isometric countryside view, grassy meadow, dirt roads crossing through village center, thatched-roof wooden houses, stone well, garden fences, tall oak trees at field edges, rolling green hills, smoke rising in background sky, dawn golden hour lighting, warm amber and green palette, peaceful village under siege atmosphere',
    neg: NEG_BASE + ', urban, cars, futuristic, dark, gloomy' },
  { id: 2, file: 'chapter_2', model: 'Anything Diffusion',
    prompt: STYLE + 'ancient dense forest, enormous oak and pine trees, twisted roots, thick canopy overhead, shafts of dappled light through leaves, winding dirt path disappearing into darkness, low ground mist, ferns and undergrowth, mossy stones, dusk lighting, blue-green shadow palette with gold light rays, mysterious atmospheric forest',
    neg: NEG_BASE + ', open fields, bright sunny, urban, buildings' },
  { id: 3, file: 'chapter_3', model: 'Deliberate',
    prompt: STYLE + 'high mountain pass, alpine scenery, snow-covered rocky peaks, dramatic cliff faces, narrow stone path winding upward, white snow patches on rock ledges, distant mountain range horizon, crisp cold winter atmosphere, grey-blue and white palette, pale sunlight on snow, sparse pine trees on lower slopes, rocky outcrops, epic vertical scale',
    neg: NEG_BASE + ', desert, tropical, warm colors, green jungle' },
  { id: 4, file: 'chapter_4', model: 'Anything Diffusion',
    prompt: STYLE + 'wide river valley view, broad rushing river cutting through green landscape, grassy riverbanks, wooden plank bridges spanning the water, forest edges on both shores, cloud reflections shimmering on river surface, sparkling clear water, bright midday sunlight, lush green and blue palette, tall reeds at water edge, gentle current',
    neg: NEG_BASE + ', desert, snow, mountains, castle, dark, stormy' },
  { id: 5, file: 'chapter_5', model: 'Deliberate',
    prompt: STYLE + 'vast golden desert landscape, rolling sand dunes stretching to horizon, dry sandy road winding through dunes, palm tree oasis with turquoise water pool, ancient sandstone ruins and columns, harsh noon sunlight, shimmering heat haze on horizon, amber gold and burnt orange palette, deep blue sky, bleached rock formations',
    neg: NEG_BASE + ', forest, snow, mountains, dark, night, urban' },
  { id: 6, file: 'chapter_6', model: 'Deliberate',
    prompt: STYLE + 'dark stone fortress interior, massive castle corridors and halls, grey stone-block walls, iron gates and portcullises, burning wall torches casting warm orange light, narrow slit windows, battlements visible beyond, imposing stone pillars, dark purple and grey palette, dramatic torch shadows, gothic architecture, stone-tiled floor',
    neg: NEG_BASE + ', outdoor, nature, desert, forest, bright sunlight, cheerful' },
  { id: 7, file: 'chapter_7', model: 'Anything Diffusion',
    prompt: STYLE + 'epic final boss throne room, vast ancient throne room with towering stone columns, ornate golden throne on raised dais, magical moat channels with glowing water, giant stained-glass windows depicting forests mountains rivers desert, stone floor with mosaic patterns, magical floating lights, dramatic dark purple and gold palette, ethereal light shafts from above, overwhelming grand scale',
    neg: NEG_BASE + ', small scale, mundane, plain, outdoor, photorealistic' },
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
      width:  ch.id === 'title_bg' ? 512 : 768,
      height: ch.id === 'title_bg' ? 768 : (ch.id === 'title_art' ? 384 : 512),
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
