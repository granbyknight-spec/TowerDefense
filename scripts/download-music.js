#!/usr/bin/env node
'use strict';

// Download background music tracks from OpenGameArt.org.
//
// All tracks are released under CC0 / CC-BY 3.0 (see ATTRIBUTION below).
// Run manually:
//   node scripts/download-music.js
// Or via the "Generate Audio SFX" GitHub Actions workflow (triggered automatically).
//
// ATTRIBUTION (include in your credits / README):
//   "5 Chiptunes (Adventure)" by Eric Matyas — soundimage.org
//     CC0 1.0 Universal — no attribution required, but appreciated.
//   https://opengameart.org/content/5-chiptunes-adventure

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

// ---------------------------------------------------------------------------
// Config — direct OGG download URLs from OpenGameArt CDN
// ---------------------------------------------------------------------------
// To swap a track: replace its `src` with any OGA direct-download URL.
// OGA direct links follow the pattern:
//   https://opengameart.org/sites/default/files/<filename>
// Find them by clicking the filename link on an OGA asset page.
// ---------------------------------------------------------------------------

const MUSIC_LIST = [
  {
    key: 'battle',
    file: 'battle.ogg',
    src: 'https://opengameart.org/sites/default/files/Chiptune_Adventures-Battle.ogg',
    title: '5 Chiptunes (Adventure) — Battle',
    author: 'Eric Matyas / soundimage.org',
    license: 'CC0',
  },
  {
    key: 'title',
    file: 'title.ogg',
    src: 'https://opengameart.org/sites/default/files/Chiptune_Adventures-Overworld.ogg',
    title: '5 Chiptunes (Adventure) — Overworld (used as title)',
    author: 'Eric Matyas / soundimage.org',
    license: 'CC0',
  },
  {
    key: 'overworld',
    file: 'overworld.ogg',
    src: 'https://opengameart.org/sites/default/files/Chiptune_Adventures-Town.ogg',
    title: '5 Chiptunes (Adventure) — Town',
    author: 'Eric Matyas / soundimage.org',
    license: 'CC0',
  },
  {
    key: 'victory',
    file: 'victory.ogg',
    src: 'https://opengameart.org/sites/default/files/Chiptune_Adventures-Victory.ogg',
    title: '5 Chiptunes (Adventure) — Victory',
    author: 'Eric Matyas / soundimage.org',
    license: 'CC0',
  },
];

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'audio', 'music');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function download(srcUrl, destPath) {
  return new Promise((resolve, reject) => {
    const parsed   = url.parse(srcUrl);
    const protocol = parsed.protocol === 'https:' ? https : http;

    const req = protocol.get(srcUrl, (res) => {
      // Follow a single redirect (OGA sometimes redirects to CDN)
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        if (!redirectUrl) return reject(new Error('Redirect with no Location header'));
        return download(redirectUrl, destPath).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${srcUrl}`));
      }

      const contentType = res.headers['content-type'] || '';
      if (!contentType.includes('audio') && !contentType.includes('octet-stream') && !contentType.includes('ogg')) {
        // Likely got an HTML error page — surface it clearly
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8').slice(0, 200);
          reject(new Error(`Unexpected content-type "${contentType}". Response: ${body}`));
        });
        return;
      }

      const tmp = destPath + '.tmp';
      const out = fs.createWriteStream(tmp);
      res.pipe(out);
      out.on('finish', () => {
        out.close(() => {
          fs.renameSync(tmp, destPath);
          resolve();
        });
      });
      out.on('error', err => {
        fs.unlink(tmp, () => reject(err));
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy(new Error(`Timeout downloading ${srcUrl}`));
    });
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let ok = 0;
  let failed = 0;

  for (const track of MUSIC_LIST) {
    const dest = path.join(OUTPUT_DIR, track.file);

    if (fs.existsSync(dest)) {
      console.log(`[${track.key}] Skipping (already exists)`);
      ok++;
      continue;
    }

    process.stdout.write(`[${track.key}] Downloading "${track.title}"...`);
    try {
      await download(track.src, dest);
      console.log(' ✓ Saved');
      ok++;
    } catch (err) {
      console.log(` ✗ Error: ${err.message}`);
      console.log(`         Source URL: ${track.src}`);
      console.log(`         Update MUSIC_LIST in scripts/download-music.js with a working OGA direct-download link.`);
      failed++;
    }
  }

  console.log(`\nDone: ${ok} ok, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
