'use strict';
// =============================================================================
// Puppy Force — AudioManager.js
// Static utility class wrapping Phaser 3's sound system.
// All audio files are OPTIONAL — gracefully skipped if not yet present.
// =============================================================================

class AudioManager {
  // --------------------------------------------------------------------------
  // PRELOAD helpers (call from each scene's preload())
  // --------------------------------------------------------------------------

  static preloadMusic(scene) {
    const tracks = [
      { key: 'battle',    path: 'assets/audio/music/battle.mp3'    },
      { key: 'title',     path: 'assets/audio/music/title.mp3'     },
      { key: 'victory',   path: 'assets/audio/music/victory.mp3'   },
      { key: 'overworld', path: 'assets/audio/music/overworld.mp3' },
    ];
    tracks.forEach(({ key, path }) => {
      // Skip if already cached (prevents duplicate-load warnings on scene restart)
      if (scene.cache && scene.cache.audio && scene.cache.audio.exists(key)) return;
      try {
        scene.load.audio(key, path);
      } catch (e) {
        // File not yet generated — silently skip
      }
    });
  }

  static preloadSFX(scene) {
    const sfx = [
      { key: 'attack_slash',   path: 'assets/audio/sfx/attack_slash.mp3'   },
      { key: 'magic_cast',     path: 'assets/audio/sfx/magic_cast.mp3'     },
      { key: 'heal',           path: 'assets/audio/sfx/heal.mp3'           },
      { key: 'level_up',       path: 'assets/audio/sfx/level_up.mp3'       },
      { key: 'cursor_move',    path: 'assets/audio/sfx/cursor_move.mp3'    },
      { key: 'unit_death',     path: 'assets/audio/sfx/unit_death.mp3'     },
      { key: 'burn_crackle',   path: 'assets/audio/sfx/burn_crackle.mp3'   },
      { key: 'victory_fanfare',path: 'assets/audio/sfx/victory_fanfare.mp3'},
      { key: 'defeat_sting',   path: 'assets/audio/sfx/defeat_sting.mp3'   },
      { key: 'dog_bark',       path: 'assets/audio/sfx/dog_bark.mp3'       },
    ];
    sfx.forEach(({ key, path }) => {
      if (scene.cache && scene.cache.audio && scene.cache.audio.exists(key)) return;
      try {
        scene.load.audio(key, path);
      } catch (e) {
        // File not yet generated — silently skip
      }
    });
  }

  // --------------------------------------------------------------------------
  // MUSIC (looping background tracks)
  // --------------------------------------------------------------------------

  // Play a looping music track. Replaces the currently playing track.
  // Skips gracefully if the audio key is not loaded.
  static playMusic(scene, key, volume = 0.5) {
    // Avoid restarting the same track if it is already playing
    if (AudioManager._currentMusicKey === key && AudioManager._currentMusic && AudioManager._currentMusic.isPlaying) {
      return;
    }

    // Stop whatever is currently playing
    AudioManager.stopMusic(scene);

    // Guard: audio not loaded yet
    if (!scene.cache || !scene.cache.audio || !scene.cache.audio.exists(key)) return;

    try {
      const music = scene.sound.add(key, { loop: true, volume });
      music.play();
      AudioManager._currentMusic    = music;
      AudioManager._currentMusicKey = key;
    } catch (e) {
      // Silently swallow any Web Audio errors (e.g. context not started)
    }
  }

  // Stop current background music
  static stopMusic(scene) {
    if (AudioManager._currentMusic) {
      try {
        AudioManager._currentMusic.stop();
        AudioManager._currentMusic.destroy();
      } catch (e) {
        // Ignore — music object may already be destroyed if scene was restarted
      }
      AudioManager._currentMusic    = null;
      AudioManager._currentMusicKey = null;
    }
  }

  // --------------------------------------------------------------------------
  // SFX (one-shot sounds)
  // --------------------------------------------------------------------------

  // Play a one-shot sound effect. Silently skips if key is not loaded.
  static play(scene, key, volume = 1.0) {
    if (!scene.cache || !scene.cache.audio || !scene.cache.audio.exists(key)) return;
    try {
      scene.sound.play(key, { volume });
    } catch (e) {
      // Silently swallow
    }
  }
}

// Static state — shared across all scenes
AudioManager._currentMusic    = null;
AudioManager._currentMusicKey = null;
