#!/usr/bin/env node
'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

// --- Config ---

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('Error: ELEVENLABS_API_KEY environment variable is not set.');
  console.error('Please export ELEVENLABS_API_KEY=<your key> before running this script.');
  process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'audio', 'sfx');

const SFX_LIST = [
  { name: 'attack_slash',    text: 'sword slash attack sound, retro 16-bit chiptune game, sharp metallic swipe',              duration_seconds: 0.8 },
  { name: 'magic_cast',      text: 'magic spell cast, 8-bit chiptune RPG, sparkling energy burst, retro video game',           duration_seconds: 1.2 },
  { name: 'heal',            text: 'healing magic sound effect, sparkle chime, soft glow, retro 8-bit JRPG game',              duration_seconds: 1.5 },
  { name: 'level_up',        text: 'level up fanfare, 8-bit chiptune, joyful ascending arpeggio, retro JRPG victory',         duration_seconds: 2.5 },
  { name: 'cursor_move',     text: 'menu cursor move blip, short retro 8-bit beep, UI navigation sound',                       duration_seconds: 0.5 },
  { name: 'unit_death',      text: 'character defeat sound, retro 8-bit game, low thud with descending tone, sad',             duration_seconds: 1.0 },
  { name: 'burn_crackle',    text: 'fire crackle damage sound, retro 8-bit, short flame burst, burning effect',                duration_seconds: 0.6 },
  { name: 'victory_fanfare', text: 'victory fanfare jingle, 8-bit chiptune, triumphant ascending melody, JRPG win',            duration_seconds: 3.0 },
  { name: 'defeat_sting',    text: 'game over sting, 8-bit chiptune, sad descending notes, retro RPG defeat',                  duration_seconds: 2.5 },
  { name: 'dog_bark',        text: 'small dog bark yelp, cartoon, short, playful attack sound',                                duration_seconds: 0.5 },
];

const DELAY_MS = 600;

// --- Helpers ---

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateSfx(text, duration_seconds) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      text,
      duration_seconds,
      prompt_influence: 0.5,
      model_id: 'eleven_text_to_sound_v2',
      output_format: 'mp3_44100_128',
    });

    const options = {
      hostname: 'api.elevenlabs.io',
      path: '/v1/sound-generation',
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const data = Buffer.concat(chunks);
        if (res.statusCode !== 200) {
          let message;
          try {
            message = JSON.parse(data.toString()).detail || data.toString();
          } catch {
            message = data.toString();
          }
          reject(new Error(`HTTP ${res.statusCode}: ${message}`));
        } else {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy(new Error('Request timed out after 30s'));
    });
    req.write(body);
    req.end();
  });
}

// --- Main ---

async function main() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let ok = 0;
  let failed = 0;

  for (let i = 0; i < SFX_LIST.length; i++) {
    const { name, text, duration_seconds } = SFX_LIST[i];
    const outPath = path.join(OUTPUT_DIR, `${name}.mp3`);

    if (fs.existsSync(outPath)) {
      console.log(`[${name}] Skipping (already exists)`);
      ok++;
      continue;
    }

    process.stdout.write(`[${name}] Generating...`);
    try {
      const mp3 = await generateSfx(text, duration_seconds);
      fs.writeFileSync(outPath, mp3);
      console.log(` ✓ Saved (${duration_seconds}s)`);
      ok++;
    } catch (err) {
      console.log(` ✗ Error: ${err.message}`);
      failed++;
    }

    // Rate-limit delay between requests (skip after last item)
    if (i < SFX_LIST.length - 1) {
      await delay(DELAY_MS);
    }
  }

  console.log(`\nDone: ${ok} ok, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main();
