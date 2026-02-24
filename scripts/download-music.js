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

// Use GITHUB_TOKEN when available (CI provides it; raises rate limit from 60 to 5000/hr)
const AUTH_HEADER = process.env.GITHUB_TOKEN
  ? { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` }
  : {};

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const opts = {
      headers: {
        'User-Agent': 'puppy-force-asset-downloader/1.0',
        'Accept': 'application/vnd.github.v3+json',
        ...AUTH_HEADER,
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
// Fetch the full repo tree in one API call (Git Trees API, recursive)
// ---------------------------------------------------------------------------
async function collectAudioFiles() {
  // Get the HEAD commit SHA first
  const branchRes = await httpsGet(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/branches/${BRANCH}`
  );
  if (branchRes.status !== 200) throw new Error(`GitHub API ${branchRes.status} fetching branch`);
  const sha = JSON.parse(branchRes.body.toString('utf8')).commit.sha;

  // Fetch the full tree recursively (one request, may be truncated for huge repos)
  const treeRes = await httpsGet(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${sha}?recursive=1`
  );
  if (treeRes.status !== 200) throw new Error(`GitHub API ${treeRes.status} fetching tree`);
  const treeData = JSON.parse(treeRes.body.toString('utf8'));

  if (treeData.truncated) {
    console.warn('  [warn] Tree response was truncated — very large repo; results may be incomplete.');
  }

  const AUDIO_EXTS = new Set(['.ogg', '.mp3', '.wav']);
  return (treeData.tree || [])
    .filter(item => item.type === 'blob' && AUDIO_EXTS.has(path.extname(item.path).toLowerCase()))
    .map(item => {
      const name = path.basename(item.path);
      return {
        name,
        path: item.path,
        download_url: `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${item.path}`,
      };
    });
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
  const allFiles = await collectAudioFiles();
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
