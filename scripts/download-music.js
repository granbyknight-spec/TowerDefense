#!/usr/bin/env node
'use strict';

// Download background music from https://github.com/SoundSafari/CC0-1.0-Music
// All tracks are CC0-1.0 (public domain) — no attribution required.
//
// Strategy: query the GitHub API to list files in the repo, then pick
// the best match for each game track by keyword search on the filename.
// This means the script stays working even as the repo evolves.
//
// Run manually:
//   node scripts/download-music.js
// Or triggered automatically by the "Generate Audio SFX" GitHub Actions workflow.

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'audio', 'music');

// ---------------------------------------------------------------------------
// What we want — keyword sets in priority order (first match wins)
// ---------------------------------------------------------------------------
const TRACKS = [
  {
    file: 'battle.ogg',
    keywords: ['battle', 'combat', 'fight', 'boss', 'action', 'intense', 'war'],
  },
  {
    file: 'title.ogg',
    keywords: ['title', 'menu', 'intro', 'theme', 'main', 'opening'],
  },
  {
    file: 'overworld.ogg',
    keywords: ['overworld', 'world', 'town', 'village', 'field', 'explore', 'adventure', 'journey'],
  },
  {
    file: 'victory.ogg',
    keywords: ['victory', 'win', 'fanfare', 'triumph', 'success', 'jingle'],
  },
];

// ---------------------------------------------------------------------------
// GitHub repo config
// ---------------------------------------------------------------------------
const REPO_OWNER = 'SoundSafari';
const REPO_NAME  = 'CC0-1.0-Music';
const BRANCH     = 'main';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const opts = {
      headers: {
        'User-Agent': 'puppy-force-asset-downloader/1.0',
        'Accept': 'application/vnd.github.v3+json',
      },
    };
    const req = https.get(url, opts, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpsGet(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('Timeout')));
  });
}

async function listRepoContents(pathInRepo) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${pathInRepo}?ref=${BRANCH}`;
  const res = await httpsGet(url);
  if (res.status !== 200) throw new Error(`GitHub API ${res.status} for ${url}`);
  return JSON.parse(res.body.toString('utf8'));
}

async function downloadFile(rawUrl, destPath) {
  const res = await httpsGet(rawUrl);
  if (res.status !== 200) throw new Error(`HTTP ${res.status} for ${rawUrl}`);
  fs.writeFileSync(destPath, res.body);
}

// ---------------------------------------------------------------------------
// Score a filename against a keyword list (higher = better match)
// ---------------------------------------------------------------------------
function score(filename, keywords) {
  const lower = filename.toLowerCase();
  for (let i = 0; i < keywords.length; i++) {
    if (lower.includes(keywords[i])) return keywords.length - i; // earlier keyword = higher score
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Walk the repo tree via GitHub API and collect all audio files
// ---------------------------------------------------------------------------
async function collectAudioFiles(dirPath = '') {
  let entries;
  try {
    entries = await listRepoContents(dirPath);
  } catch (e) {
    console.warn(`  [warn] Could not list ${dirPath}: ${e.message}`);
    return [];
  }

  const results = [];
  for (const entry of entries) {
    if (entry.type === 'file') {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.ogg', '.mp3', '.wav'].includes(ext)) {
        results.push({
          name:       entry.name,
          path:       entry.path,
          download_url: entry.download_url,
        });
      }
    } else if (entry.type === 'dir') {
      // Recurse — but skip folders that look like metadata/docs
      if (!['LICENSE', '.git', 'docs'].includes(entry.name)) {
        const sub = await collectAudioFiles(entry.path);
        results.push(...sub);
      }
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const needed = TRACKS.filter(t => !fs.existsSync(path.join(OUTPUT_DIR, t.file)));
  if (needed.length === 0) {
    console.log('All music tracks already downloaded — nothing to do.');
    return;
  }

  console.log(`Scanning ${REPO_OWNER}/${REPO_NAME} for ${needed.length} track(s)...`);
  const allFiles = await collectAudioFiles('');
  console.log(`  Found ${allFiles.length} audio files in repo.`);

  let ok = 0, failed = 0;

  for (const track of needed) {
    // Pick the best-scoring file for this track
    let best = null, bestScore = 0;
    for (const f of allFiles) {
      const s = score(f.name, track.keywords);
      if (s > bestScore) { bestScore = s; best = f; }
    }

    const dest = path.join(OUTPUT_DIR, track.file);
    if (!best) {
      console.log(`[${track.file}] ✗ No matching file found (keywords: ${track.keywords.slice(0, 3).join(', ')})`);
      failed++;
      continue;
    }

    process.stdout.write(`[${track.file}] Downloading "${best.name}"...`);
    try {
      await downloadFile(best.download_url, dest);
      console.log(' ✓ Saved');
      ok++;
      // Remove the used file so we don't pick the same track for two slots
      allFiles.splice(allFiles.indexOf(best), 1);
    } catch (e) {
      console.log(` ✗ Error: ${e.message}`);
      failed++;
    }
  }

  const skipped = TRACKS.length - needed.length;
  console.log(`\nDone: ${ok} downloaded, ${skipped} skipped (already exist), ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
