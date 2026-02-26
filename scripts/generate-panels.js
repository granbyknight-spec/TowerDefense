#!/usr/bin/env node
'use strict';
// =============================================================================
// Puppy Force — generate-panels.js
// Generates manga-style atmospheric panel backgrounds for ComicScene.
// One image per panel slot (hero / ally / villain) per chapter.
// Output: assets/panels/ch<N>_<slot>_v1.png
//
// Usage: AIHORDE_API_KEY=xxx node scripts/generate-panels.js
// Or via GitHub Actions: Generate AI Art Assets → panels
// =============================================================================

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const API_KEY    = process.env.AIHORDE_API_KEY || '0000000000';
const BASE_URL   = 'https://aihorde.net';
const POLL_MS    = 8000;
const TIMEOUT_MS = 480000;
const OUT_DIR    = path.join(__dirname, '..', 'assets', 'panels');

// Base style — manga ink, screentone, no characters or text
const M  = 'manga panel background, black and white ink illustration, screentone halftone shading, clean lineart ink, dramatic lighting, no characters, no text, no speech bubbles, ';
// Speed-line style for villain panels
const SL = 'manga speed lines, radiating action lines, dynamic burst, dramatic ink, high contrast black and white, monochrome, ';
// Shared negative
const NEG = 'color photograph, cats, dogs, animals, people, characters, text, speech bubbles, watermark, signature, blurry, low quality, 3d render, realistic photo, nsfw';

// 7 chapters × 3 slots (hero=full-width, ally=half-left, villain=half-right)
const PANELS = [
  // ── Chapter 1: Barkville Siege ─────────────────────────────────────────────
  { ch:1, slot:'hero',    w:512, h:256, model:'Anything Diffusion',
    prompt: M + 'village street at sunset, dirt cobblestone path, wooden fence, thatched rooftop edge, scattered autumn leaves, warm raking side-light, ink crosshatching, peaceful village under siege atmosphere' },
  { ch:1, slot:'ally',    w:256, h:256, model:'Anything Diffusion',
    prompt: M + 'village square backdrop, simple thatched houses, stacked wooden crates, soft warm afternoon light, hopeful atmosphere, clean screentone stippling' },
  { ch:1, slot:'villain', w:256, h:256, model:'Anything Diffusion',
    prompt: SL + 'dark alley stone wall, menacing crack lines in brick, jagged ink bursting outward, dark vignette edges, threat and malice' },

  // ── Chapter 2: Howling Woods ───────────────────────────────────────────────
  { ch:2, slot:'hero',    w:512, h:256, model:'Anything Diffusion',
    prompt: M + 'dense forest clearing, shafts of god-rays through tree canopy, ancient twisted oak silhouettes, deep shadow ink hatching, dappled leaf-light pattern, ominous quiet' },
  { ch:2, slot:'ally',    w:256, h:256, model:'Anything Diffusion',
    prompt: M + 'forest path between tall trees, soft diffuse backlight, bark texture ink detail, hopeful atmosphere, gentle screentone, path leading forward' },
  { ch:2, slot:'villain', w:256, h:256, model:'Anything Diffusion',
    prompt: SL + 'dark forest burst, tree silhouettes around jagged speed-line explosion, shadow ambush, high contrast ink vortex, ominous forest dark' },

  // ── Chapter 3: Peak Paws ───────────────────────────────────────────────────
  { ch:3, slot:'hero',    w:512, h:256, model:'Deliberate',
    prompt: M + 'snowy mountain pass, narrow stone path between sheer rock walls, white snow on grey rock, cold crisp lineart, grey-white screentone, overcast sky, heroic climb atmosphere' },
  { ch:3, slot:'ally',    w:256, h:256, model:'Deliberate',
    prompt: M + 'rocky mountain ledge, jagged stone texture, sparse ice crystals, rugged ink hatching, overcast light, determination and resolve atmosphere' },
  { ch:3, slot:'villain', w:256, h:256, model:'Deliberate',
    prompt: SL + 'blizzard vortex speed lines, white-on-dark ink swirl, mountain peak silhouette in storm, howling wind drama, ice and fury' },

  // ── Chapter 4: River Fetch ─────────────────────────────────────────────────
  { ch:4, slot:'hero',    w:512, h:256, model:'Anything Diffusion',
    prompt: M + 'wide river viewed from bank, two wooden bridges in middle-distance, water ripple lineart, cloud reflections on water surface, horizontal dramatic composition, manga ink style' },
  { ch:4, slot:'ally',    w:256, h:256, model:'Anything Diffusion',
    prompt: M + 'grassy riverbank, gentle water lapping at reeds, bridge pillar in soft background, calm screentone, open sky hope, peaceful moment' },
  { ch:4, slot:'villain', w:256, h:256, model:'Anything Diffusion',
    prompt: SL + 'water explosion burst, splashing speed lines radiating from river surface, dark turbulent water, aquatic action drama, soaking impact lines' },

  // ── Chapter 5: Desert Scratch ──────────────────────────────────────────────
  { ch:5, slot:'hero',    w:512, h:256, model:'Deliberate',
    prompt: M + 'vast sand dunes landscape, heat shimmer rendered as wavy horizontal lines, minimal stark lineart, harsh sun disc silhouette above, sand ripple texture, oppressive desert atmosphere' },
  { ch:5, slot:'ally',    w:256, h:256, model:'Deliberate',
    prompt: M + 'desert oasis, palm tree silhouettes, still water pool with ripple circles, cool shaded screentone, serene despite harsh desert surround' },
  { ch:5, slot:'villain', w:256, h:256, model:'Deliberate',
    prompt: SL + 'sandstorm vortex, swirling sand speed lines radiating outward, dune silhouette in darkness, menacing desert wind burst, grit and shadow' },

  // ── Chapter 6: Meow Fortress ───────────────────────────────────────────────
  { ch:6, slot:'hero',    w:512, h:256, model:'Deliberate',
    prompt: M + 'massive stone fortress gate, iron-studded heavy door, towering walls receding to vanishing point, dramatic low-angle perspective upward, gothic stonework ink detail, imposing scale' },
  { ch:6, slot:'ally',    w:256, h:256, model:'Deliberate',
    prompt: M + 'castle stone corridor, wall-mounted torch sconce, flickering warm glow rendered in ink halftone, dark stone block texture, determined resolute atmosphere' },
  { ch:6, slot:'villain', w:256, h:256, model:'Deliberate',
    prompt: SL + 'view from castle parapet looking down, downward speed lines, gothic spire silhouettes, imperious height power burst, throne room dark energy' },

  // ── Chapter 7: Ultimate Woof ───────────────────────────────────────────────
  { ch:7, slot:'hero',    w:512, h:256, model:'Anything Diffusion',
    prompt: M + 'grand ornate throne room interior, marble columns lining long hall, intricate floor mosaic tile pattern, dramatic forced perspective, epic scale ink illustration, climax atmosphere, final battle setting' },
  { ch:7, slot:'ally',    w:256, h:256, model:'Anything Diffusion',
    prompt: M + 'castle hall interior, warm backlight glow, camaraderie moment backdrop, soft warm ink halftone, hope and friendship light, detailed architectural ink' },
  { ch:7, slot:'villain', w:256, h:256, model:'Anything Diffusion',
    prompt: SL + 'ultimate power explosion, massive radiating speed-line burst, dark energy vortex, throne silhouette at center, maximum drama ink, full-page spread energy, final boss menace' },
];

// =============================================================================

function request(method, urlStr, headers, body) {
  return new Promise((resolve, reject) => {
    const url    = new URL(urlStr);
    const isHttps = url.protocol === 'https:';
    const lib    = isHttps ? https : http;
    const options = {
      hostname: url.hostname, port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search, method,
      headers: { 'Content-Type': 'application/json', 'apikey': API_KEY, ...headers },
    };
    const req = lib.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
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
    const lib  = url.startsWith('https') ? https : http;
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

async function generatePanel(p) {
  const outPath = path.join(OUT_DIR, `ch${p.ch}_${p.slot}_v1.png`);
  if (fs.existsSync(outPath)) {
    console.log(`  [SKIP] ch${p.ch}_${p.slot} already exists`);
    return;
  }

  console.log(`\n[Ch${p.ch} ${p.slot}]`);
  const payload = {
    prompt: p.prompt + ' ### ' + NEG,
    models: [p.model, 'Anything Diffusion', 'Deliberate'],
    params: {
      width: p.w, height: p.h,
      steps: 30, cfg_scale: 7.5, sampler_name: 'k_euler_a', karras: true,
      n: 1,
    },
    nsfw: false, slow_workers: true,
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
    console.log(`  queue:${status.queue_position ?? '?'} elapsed:${Math.round((Date.now() - startTime) / 1000)}s done:${status.done}`);
    if (status.done) { gens = status.generations; break; }
    if (status.faulted) throw new Error('Job faulted');
  }

  const g = gens[0];
  if (!g) throw new Error('No generation returned');
  if (g.img && g.img.startsWith('http')) {
    await downloadFile(g.img, outPath);
  } else if (g.img) {
    const b64 = g.img.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
  }
  console.log('  Saved: ' + path.basename(outPath));
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('Puppy Force Panel Background Generator');
  console.log(`API: ${API_KEY === '0000000000' ? 'ANONYMOUS' : 'Authenticated'}`);
  console.log(`Output: ${OUT_DIR}`);
  console.log(`Panels to generate: ${PANELS.length}`);

  let ok = 0, fail = 0, skip = 0;
  for (const p of PANELS) {
    const outPath = path.join(OUT_DIR, `ch${p.ch}_${p.slot}_v1.png`);
    if (fs.existsSync(outPath)) { skip++; continue; }
    try { await generatePanel(p); ok++; }
    catch (err) { console.error(`  ERROR ch${p.ch} ${p.slot}: ${err.message}`); fail++; }
    await sleep(1500);
  }
  console.log(`\nDone: ${ok} generated, ${skip} skipped, ${fail} failed`);
  console.log('Game will use these automatically — ComicScene loads assets/panels/ch<N>_<slot>_v1.png');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
