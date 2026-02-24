#!/usr/bin/env node
'use strict';

// Download background music from https://github.com/SoundSafari/CC0-1.0-Music
// All tracks are CC0-1.0 (public domain) — no attribution required.
//
// Strategy: partial-clone the repo (tree objects only, zero blobs) so we can
// enumerate all 7000+ filenames with git-ls-tree, then git-checkout only the
// 4 individual files we actually need.  Total blob data downloaded: ~4 tracks.
//
// Run manually:
//   node scripts/download-music.js
// Or triggered automatically by the "Generate Audio SFX" GitHub Actions workflow.

const { execSync } = require('child_process');
const fs   = require('fs');
const os   = require('os');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'audio', 'music');

const REPO_OWNER = 'SoundSafari';
const REPO_NAME  = 'CC0-1.0-Music';

// ---------------------------------------------------------------------------
// What we want — keyword sets in priority order (higher index = lower score)
// ---------------------------------------------------------------------------
const TRACKS = [
  {
    file:     'battle.ogg',
    keywords: ['battle', 'combat', 'fight', 'boss', 'action', 'intense', 'war'],
  },
  {
    file:     'title.ogg',
    keywords: ['title', 'menu', 'intro', 'theme', 'main', 'opening'],
  },
  {
    file:     'overworld.ogg',
    keywords: ['overworld', 'world', 'town', 'village', 'field', 'explore', 'adventure', 'journey'],
  },
  {
    file:     'victory.ogg',
    keywords: ['victory', 'win', 'fanfare', 'triumph', 'success', 'jingle'],
  },
];

// ---------------------------------------------------------------------------
// Score a filename against a keyword list
// ---------------------------------------------------------------------------
function score(filename, keywords) {
  const lower = filename.toLowerCase();
  for (let i = 0; i < keywords.length; i++) {
    if (lower.includes(keywords[i])) return keywords.length - i;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const needed = TRACKS.filter(t => !fs.existsSync(path.join(OUTPUT_DIR, t.file)));
  if (needed.length === 0) {
    console.log('All music tracks already downloaded — nothing to do.');
    return;
  }
  console.log(`Need ${needed.length} track(s): ${needed.map(t => t.file).join(', ')}`);

  // Build authenticated clone URL (GITHUB_TOKEN from CI, avoids rate limits)
  const token   = process.env.GITHUB_TOKEN;
  const repoUrl = token
    ? `https://x-access-token:${token}@github.com/${REPO_OWNER}/${REPO_NAME}.git`
    : `https://github.com/${REPO_OWNER}/${REPO_NAME}.git`;

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'music-'));
  try {
    // --filter=blob:none  → download tree objects but NOT file blobs
    // --no-checkout       → don't materialise any files yet
    // --depth=1           → only latest commit
    console.log('Cloning repo tree (no blobs)...');
    execSync(
      `git clone --depth=1 --filter=blob:none --no-checkout "${repoUrl}" "${tmpDir}"`,
      { stdio: 'inherit', timeout: 120_000 }
    );

    // List every file path in the HEAD tree (uses tree objects — no blobs)
    console.log('Listing audio files...');
    const AUDIO_EXTS = new Set(['.ogg', '.mp3', '.wav']);
    const allFiles = execSync('git ls-tree -r --name-only HEAD', {
      cwd:      tmpDir,
      encoding: 'utf8',
      timeout:  30_000,
    })
      .split('\n')
      .map(f => f.trim())
      .filter(f => f && AUDIO_EXTS.has(path.extname(f).toLowerCase()));

    console.log(`  Found ${allFiles.length} audio files.`);

    let ok = 0, failed = 0;

    for (const track of needed) {
      // Pick best-scoring file (deduplication: once used, remove from pool)
      let best = null, bestScore = 0;
      for (const f of allFiles) {
        const s = score(path.basename(f), track.keywords);
        if (s > bestScore) { bestScore = s; best = f; }
      }

      if (!best) {
        // Fallback: first OGG in the list
        best = allFiles.find(f => path.extname(f).toLowerCase() === '.ogg') || allFiles[0];
      }

      if (!best) {
        console.warn(`  [${track.file}] No audio file found — skipping`);
        failed++;
        continue;
      }

      console.log(`  [${track.file}] <- ${best} (score: ${bestScore})`);

      // Checkout only this one file → git fetches its blob on demand
      execSync(`git checkout HEAD -- "${best}"`, {
        cwd:     tmpDir,
        stdio:   'inherit',
        timeout: 60_000,
      });

      const srcPath  = path.join(tmpDir, best);
      const destPath = path.join(OUTPUT_DIR, track.file);
      fs.copyFileSync(srcPath, destPath);
      console.log(`    Saved -> ${destPath}`);
      fs.unlinkSync(srcPath); // free tmpdir space

      // Remove from pool so another slot doesn't reuse the same track
      allFiles.splice(allFiles.indexOf(best), 1);
      ok++;
    }

    const skipped = TRACKS.length - needed.length;
    console.log(`\nDone: ${ok} downloaded, ${skipped} skipped (already exist), ${failed} failed`);
    if (failed > 0) process.exit(1);

  } finally {
    execSync(`rm -rf "${tmpDir}"`);
  }
}

main();
