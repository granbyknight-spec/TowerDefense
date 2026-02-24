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

const STYLE_SUFFIX = [
  'pixel art, retro Shining Force style, 1990s Sega Genesis tactical RPG',
  '16-bit retro color palette, blocky pixels',
  'seamless tile, tileable texture, top-down view',
  'no characters, no units, no border, no text',
  'masterpiece, best quality'
].join(', ');

const NEGATIVE_PROMPT = [
  'characters, people, animals, units, text, watermark, signature',
  'border, frame, vignette, edge darkening, outline',
  'gradient, blur, noise, grain',
  '3d render, photorealistic, hyperrealistic',
  'isometric view, side view, perspective',
  'modern, urban, sci-fi'
].join(', ');

const TERRAIN_PROMPTS = {
  grass:    { core: 'bright green grass plains, short grass blades, scattered tiny wildflowers, light green highlights on blades, dark green shadows, lush summer meadow', extraNeg: 'dark, gloomy, snow, sand, stone, water' },
  forest:   { core: 'dense forest canopy seen from above, dark green tree tops, circular tree crowns, dappled shadows between trees, mossy ground, deep forest green palette', extraNeg: 'bright, desert, snow, buildings, water' },
  mountain: { core: 'rocky mountain terrain seen from above, gray and brown stone, angular rock formations, stone rubble patches, earthy brown-gray stone surface', extraNeg: 'green grass, water, sand, buildings, snow only, perspective' },
  water:    { core: 'deep blue river water, small ripple wave patterns, light blue highlights on water surface, dark navy wave shadows, subtle sparkle reflections, clean river surface', extraNeg: 'shore, land, grass, boats, fish, bridges, brown' },
  road:     { core: 'dirt path road, packed earth trail, tan and light brown soil, subtle wheel rut marks in dirt, small pebbles scattered on path, warm sandy-brown ground', extraNeg: 'asphalt, modern road, cobblestone, bricks, grass, water, gray' },
  sand:     { core: 'desert sand terrain, golden sandy surface, small dune ripple patterns, wind-swept sand texture, warm yellow-orange highlights, subtle shadows between dune ridges, dry desert floor', extraNeg: 'water, grass, rocks, cactus, buildings, green, dark' },
  castle:   { core: 'stone castle floor tile, gray cobblestone courtyard, fortress interior flagstone, smooth cut stone blocks with mortar lines, cool gray palette with slight blue tint', extraNeg: 'exterior walls, towers, sky, grass, sand, warm colors, wood' },
  village:  { core: 'village ground tile, warm earth-toned packed dirt floor, rustic brown clay soil, small flat stepping stones, worn earth texture, cozy settlement ground', extraNeg: 'buildings, houses, roofs, grass, stone, cobblestone, gray, dark' },
  snow:     { core: 'snow-covered frozen ground, pure white snow surface, light blue shadows in snow, faint snowflake crystal patterns, icy blue-white palette, wintry battlefield floor', extraNeg: 'grass, dirt, sand, water, rocks, warm colors, brown, green' },
  bridge:   { core: 'wooden bridge planks seen from directly above, dark brown worn wooden boards, parallel plank grain lines, aged timber bridge surface, narrow gaps between planks', extraNeg: 'water below, rope, stone, metal, grass, gray, bright' },
  wall:     { core: 'solid stone fortress wall cross-section top-down view, very dark charcoal gray stone, dense impenetrable stone mass, near-black dark gray, thick battlement surface', extraNeg: 'light, bright, colorful, windows, doors, grass, wood, warm colors' },
  oasis:    { core: 'desert oasis ground tile, lush green vegetation patches on sandy ground, small blue water pool, vivid green palm fronds seen from above, contrast of green and gold sand', extraNeg: 'dark, urban, buildings, rocks, cold, snow, gray' },
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
