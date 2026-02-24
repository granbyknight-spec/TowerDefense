#!/usr/bin/env node
'use strict';

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const API_KEY      = process.env.AIHORDE_API_KEY || '0000000000';
const BASE_URL     = 'https://aihorde.net';
const POLL_INTERVAL_MS = 8000;
const TIMEOUT_MS   = 600000;
const OUTPUT_DIR   = path.join(__dirname, '..', 'assets', 'terrain');
const VARIANTS     = 4;

const MODELS = ['AIO Pixel Art', 'PixelArt XL', 'Anything Diffusion', 'Deliberate'];

// DESIGN GOAL: Terrain tiles are BACKGROUND — they must be flat, muted, and low-detail
// so player and enemy unit sprites stand out clearly on top of them.
// Prompts emphasize: solid flat color, minimal internal contrast, subtle uniform texture.

const STYLE_SUFFIX = [
  'flat top-down game tile, Fire Emblem GBA style, simple solid fill',
  'muted desaturated colors, very low contrast, minimal detail',
  'seamless tileable, no characters, no units, no border, no text',
  'pixel art, 16-bit SNES tactical RPG tile, clean and simple',
  'background tile, not foreground art'
].join(', ');

const NEGATIVE_PROMPT = [
  'characters, people, animals, units, text, watermark, signature',
  'border, frame, vignette, outline, edge',
  'high contrast, busy, complex, detailed, intricate, ornate',
  '3d render, photorealistic, hyperrealistic, painterly',
  'isometric, perspective, side view, depth',
  'modern, urban, sci-fi, bright, vivid, saturated, neon'
].join(', ');

const TERRAIN_PROMPTS = {
  // Each prompt: flat, muted, low-detail — good background, not foreground
  grass:    { core: 'flat muted olive green ground tile, simple uniform short grass, very low contrast, subtle dark green texture, dark earthy background, tactical RPG map tile', extraNeg: 'flowers, wildflowers, bright green, vivid, lush, detailed blades' },
  forest:   { core: 'flat very dark green forest tile, simple dark canopy overhead view, near-black deep green, minimal leaf detail, uniform dark forest floor, shadowy woodland tile', extraNeg: 'bright, detailed trees, individual leaves, flowers, water' },
  mountain: { core: 'flat dark grey-brown rocky tile, simple uniform stone surface, muted earthy grey, minimal rock detail, subtle cracked stone pattern, dark mountain ground tile', extraNeg: 'bright, green, water, high contrast rock formations, detailed rubble' },
  water:    { core: 'flat dark navy blue water tile, simple subtle ripple pattern, very low contrast wave lines, deep dark river tile, minimal water detail, muted blue background', extraNeg: 'bright blue, sparkle, reflections, fish, shore, land, light blue' },
  road:     { core: 'flat muted dark tan road tile, simple packed dirt path, low contrast earthy brown, subtle worn earth texture, dark sandy-brown road tile, uniform ground', extraNeg: 'bright, pebbles, detailed ruts, grass, gray, asphalt, cobblestone' },
  sand:     { core: 'flat muted dark golden sand tile, simple uniform desert floor, very low contrast, subtle dark sand texture, muted gold-brown background, minimal detail', extraNeg: 'bright, dunes, flowers, cactus, water, vivid yellow, high contrast patterns' },
  castle:   { core: 'flat dark blue-grey stone tile, simple uniform castle floor, muted cool grey flagstone, very low contrast mortar lines, dark stone courtyard tile', extraNeg: 'bright, warm, towers, walls, sky, elaborate detail, high contrast' },
  village:  { core: 'flat muted dark terracotta dirt tile, simple uniform packed clay ground, very low contrast, dark earthy brown-red, subtle ground texture, minimal worn earth detail', extraNeg: 'buildings, roofs, cobblestones, bright, grass, ornate, detailed patterns' },
  snow:     { core: 'flat muted grey-blue snow tile, simple uniform frozen ground, dark icy surface, very low contrast, subtle dark blue snow shadows, no bright white', extraNeg: 'bright white, sparkle, snowflakes, high contrast, vivid, crystal detail' },
  bridge:   { core: 'flat dark brown wooden plank tile, simple parallel board lines, muted dark timber, very low contrast, subtle wood grain only, dark aged wood bridge tile', extraNeg: 'bright, ropes, nails, water below, high contrast grain, ornate' },
  wall:     { core: 'flat near-black dark stone tile, simple uniform impenetrable rock, almost solid very dark charcoal, near-black background, minimal subtle texture', extraNeg: 'bright, light, colorful, wood, windows, detailed carving, high contrast' },
  oasis:    { core: 'flat muted dark teal-green oasis tile, simple dark green vegetation on dark sand, very low contrast, subtle dark green and brown mix, shadowy oasis floor', extraNeg: 'bright vivid, water pool highlight, individual palm fronds, high contrast, flowers' },
};

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
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(text)); } catch (e) { resolve(text); }
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
        file.close();
        fs.unlink(destPath, () => {});
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(destPath); });
    }).on('error', (err) => { fs.unlink(destPath, () => {}); reject(err); });
  });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function submitJob(terrainType) {
  const def = TERRAIN_PROMPTS[terrainType];
  const fullPrompt = def.core + ', ' + STYLE_SUFFIX;
  const fullNeg = NEGATIVE_PROMPT + ', ' + (def.extraNeg || '');
  const payload = {
    prompt: fullPrompt + ' ### ' + fullNeg,
    params: { width: 512, height: 512, steps: 40, cfg_scale: 7, sampler_name: 'k_euler', n: VARIANTS, tiling: true },
    models: MODELS, nsfw: false, slow_workers: true
  };
  console.log('  Submitting: ' + terrainType + ' (' + VARIANTS + ' variants)...');
  const result = await request('POST', BASE_URL + '/api/v2/generate/async', {}, payload);
  if (!result.id) throw new Error('No job ID for ' + terrainType + ': ' + JSON.stringify(result));
  console.log('  Job ID: ' + result.id);
  return result.id;
}

async function pollUntilDone(jobId, terrainType) {
  const startTime = Date.now();
  while (true) {
    if (Date.now() - startTime > TIMEOUT_MS) throw new Error('Timeout for ' + terrainType);
    await sleep(POLL_INTERVAL_MS);
    const status = await request('GET', BASE_URL + '/api/v2/generate/status/' + jobId, {});
    const done = status.done === true;
    const queued = status.queue_position || '?';
    const finished = (status.generations || []).length;
    console.log('  [' + terrainType + '] queue:' + queued + ' finished:' + finished + '/' + VARIANTS + ' elapsed:' + Math.round((Date.now()-startTime)/1000) + 's');
    if (done) {
      if (!status.generations || status.generations.length === 0) throw new Error('Done but no generations');
      return status.generations;
    }
  }
}

async function saveGenerations(terrainType, generations) {
  const saved = [];
  for (let i = 0; i < generations.length; i++) {
    const gen = generations[i];
    const filename = terrainType + '_v' + (i+1) + '.png';
    const filepath = path.join(OUTPUT_DIR, filename);
    if (gen.img && gen.img.startsWith('http')) {
      await downloadFile(gen.img, filepath);
      console.log('  Saved: ' + filename + ' (from URL)');
    } else if (gen.img && gen.img.length > 100) {
      const b64 = gen.img.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(filepath, Buffer.from(b64, 'base64'));
      console.log('  Saved: ' + filename);
    } else {
      console.warn('  No image data for variant ' + (i+1));
      continue;
    }
    saved.push(filepath);
  }
  return saved;
}

async function generateTerrain(terrainType) {
  console.log('\n[' + terrainType.toUpperCase() + ']');
  // Skip if all variants already exist
  const allExist = [1,2,3,4].every(i => fs.existsSync(path.join(OUTPUT_DIR, terrainType + '_v' + i + '.png')));
  if (allExist) { console.log('  Already generated, skipping.'); return { terrainType, success: true, skipped: true }; }
  try {
    const jobId = await submitJob(terrainType);
    const generations = await pollUntilDone(jobId, terrainType);
    const files = await saveGenerations(terrainType, generations);
    return { terrainType, success: true, files };
  } catch (err) {
    console.error('  ERROR for ' + terrainType + ': ' + err.message);
    return { terrainType, success: false, error: err.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const typesArg = args.find(a => a.startsWith('--types='));
  const typesList = typesArg ? typesArg.replace('--types=', '').split(',') : Object.keys(TERRAIN_PROMPTS);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('='.repeat(50));
  console.log('Puppy Force Terrain Generator');
  console.log('API Key: ' + (API_KEY === '0000000000' ? 'ANONYMOUS' : 'Authenticated'));
  console.log('Types: ' + typesList.join(', '));
  console.log('Output: ' + OUTPUT_DIR);
  console.log('='.repeat(50));

  const results = [];
  for (const t of typesList) {
    if (!TERRAIN_PROMPTS[t]) { console.warn('Unknown terrain type: ' + t); continue; }
    results.push(await generateTerrain(t));
    await sleep(2000);
  }

  const ok = results.filter(r => r.success);
  const fail = results.filter(r => !r.success);
  console.log('\nDone: ' + ok.length + ' ok, ' + fail.length + ' failed');
  if (fail.length > 0) fail.forEach(r => console.log('  FAIL: ' + r.terrainType + ' - ' + r.error));
  console.log('Next: review variants in ' + OUTPUT_DIR);
  console.log('Then: cp assets/terrain/grass_v1.png assets/terrain/grass.png (for each type)');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
