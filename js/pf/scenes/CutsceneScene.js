'use strict';
// =============================================================================
// Puppy Force — CutsceneScene.js
// Animated inter-chapter cutscene with Fire Emblem-style portrait dialogue bars
// =============================================================================

class CutsceneScene extends Phaser.Scene {
  constructor() { super({ key: 'CutsceneScene' }); }

  init(data) {
    this.nextChapter = data.chapter;        // chapter to load after cutscene
    this.currentChap = data.currentChap;    // chapter that was just won
    this.saveData    = data.saveData;
    this.hasSkipped  = false;
  }

  // ---------------------------------------------------------------------------
  // Improvement 1: Preload portrait PNGs (graceful — same pattern as BattleScene)
  preload() {
    AudioManager.preloadMusic(this);

    // Enemy portrait PNGs — v1 through v4 variants
    // File naming: assets/enemies/<lowercase_id>_v1.png
    const ENEMY_PNG_IDS = [
      'ALLEY_CAT',
      'SIAMESE_ASSASSIN',
      'LYNX_RANGER',
      'SNOW_LEOPARD',
      'RIVER_PANTHER',
      'SAND_CAT_KING',
      'PERSIAN_QUEEN',
      'CAT_EMPEROR',
      'TIGER_GENERAL',
      'PERSIAN_SORCERER',
      'SCOUT_CAT',
    ];
    ENEMY_PNG_IDS.forEach(id => {
      // Load v1–v4 variants for each enemy
      for (let v = 1; v <= 4; v++) {
        const pngKey = v === 1 ? `enemy_png_${id}` : `enemy_png_${id}_v${v}`;
        if (!this.textures.exists(pngKey)) {
          try {
            const fileName = id.toLowerCase() + `_v${v}.png`;
            this.load.image(pngKey, `assets/enemies/${fileName}`);
          } catch (e) {
            // silently skip — emoji fallback will be used
          }
        }
      }
    });

    // Player chibi PNGs
    // File naming: assets/characters/<id>_chibi_v1.png
    const PLAYER_PNG_IDS = [
      'PUPPY_KNIGHT', 'CORGI_HEALER', 'LABRADOR_SCOUT', 'BEAGLE_ARCHER',
      'BULLDOG_TANK', 'POODLE_MAGE', 'HUSKY_RIDER', 'TERRIER_THIEF',
      'DOG_PALADIN', 'OTTER_ALLY',
    ];
    PLAYER_PNG_IDS.forEach(id => {
      const pngKey = `player_png_${id}`;
      if (!this.textures.exists(pngKey)) {
        try {
          this.load.image(pngKey, `assets/characters/${id.toLowerCase()}_chibi_v1.png`);
        } catch (e) {
          // silently skip — emoji fallback will be used
        }
      }
    });
  }

  create() {
    const W = GAME_W, H = GAME_H;

    AudioManager.playMusic(this, 'overworld', 0.4);

    this._buildBackground(W, H);
    this._buildParticles(W, H);
    this._buildSkipButton(W);
    this._playSequence(W, H);
  }

  // ---------------------------------------------------------------------------
  _buildBackground(W, H) {
    // Gradient background — use next chapter's bgColor if available
    const nextChap = CHAPTERS[this.nextChapter - 1] || CHAPTERS[0];
    const bg = this.add.graphics();
    bg.fillGradientStyle(
      0x0a0f1a, 0x0a0f1a,
      nextChap.bgColor || 0x1a2a10, nextChap.bgColor || 0x1a2a10,
      1
    );
    bg.fillRect(0, 0, W, H);

    // Subtle horizontal rule lines for cinematic feel
    for (let i = 0; i < 6; i++) {
      const line = this.add.graphics();
      line.lineStyle(1, 0x334466, 0.15);
      line.lineBetween(0, i * (H / 5), W, i * (H / 5));
    }

    // Top and bottom letterbox bars (cinematic black bars)
    this.add.rectangle(W / 2, 22, W, 44, 0x000000, 1).setDepth(10);
    this.add.rectangle(W / 2, H - 22, W, 44, 0x000000, 1).setDepth(10);
  }

  _buildParticles(W, H) {
    // Falling stars / sparkles for atmosphere
    for (let i = 0; i < 18; i++) {
      const sym = Phaser.Math.RND.pick(['✦', '·', '✧', '⭑']);
      const p = this.add.text(
        Phaser.Math.Between(0, W),
        Phaser.Math.Between(-60, H),
        sym,
        { fontSize: '14px', color: '#aabbcc', alpha: 0.4 }
      ).setAlpha(Phaser.Math.FloatBetween(0.15, 0.5));

      this.tweens.add({
        targets: p,
        y: p.y + H + 80,
        alpha: 0,
        duration: Phaser.Math.Between(5000, 10000),
        ease: 'Linear',
        repeat: -1,
        delay: Phaser.Math.Between(0, 4000),
      });
    }
  }

  _buildSkipButton(W) {
    const skipTxt = this.add.text(W - 14, 14, 'SKIP ▶▶', {
      fontSize: '12px', color: '#778899',
      fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
      backgroundColor: '#00000066',
      padding: { x: 6, y: 3 },
    }).setOrigin(1, 0).setDepth(20).setInteractive({ useHandCursor: true });

    skipTxt.on('pointerover', () => skipTxt.setColor('#aabbff'));
    skipTxt.on('pointerout',  () => skipTxt.setColor('#778899'));
    skipTxt.on('pointerdown', () => {
      if (!this.hasSkipped) {
        this.hasSkipped = true;
        this._fadeToNextChapter();
      }
    });
  }

  // ---------------------------------------------------------------------------
  _playSequence(W, H) {
    // Build beats from ChapterData story
    const beats = this._buildBeats();

    beats.forEach(beat => {
      this.time.delayedCall(beat.t, () => {
        if (this.hasSkipped) return;
        switch (beat.type) {
          case 'enter':    this._beatEnter(beat, W, H);    break;
          case 'caption':  this._beatCaption(beat, W, H);  break;
          case 'shake':    this.cameras.main.shake(350, 0.018); break;
          case 'end':      this._fadeToNextChapter();       break;
        }
      });
    });
  }

  _buildBeats() {
    const cur  = CHAPTERS[(this.currentChap  || 1) - 1] || {};
    const next = CHAPTERS[(this.nextChapter  || 2) - 1] || {};
    const vict = cur.victory  || [];
    const intr = next.intro   || [];

    const beats = [];
    let t = 200;

    // Victory lines — heroes reflect on the win
    vict.forEach((line, i) => {
      const side = i % 2 === 0 ? 'left' : 'right';
      beats.push({ type: 'enter', t, portrait: line.portrait || '🐶', text: line.text || '', speaker: line.speaker || '', side, hold: 2800 });
      t += 3200;
    });

    // Transition pause
    t += 400;

    // Villain intro from next chapter — dramatic entrance
    const villainLine = intr.find(l => l.speaker && (l.speaker.includes('Cat') || l.speaker.includes('Boss') || l.speaker.includes('Assassin') || l.speaker.includes('General') || l.speaker.includes('Queen') || l.speaker.includes('Emperor') || l.portrait === '🐱' || l.portrait === '😾' || l.portrait === '🐈'));
    if (villainLine) {
      beats.push({ type: 'shake', t: t - 100 });
      beats.push({ type: 'enter', t, portrait: villainLine.portrait || '😾', text: villainLine.text || '', speaker: villainLine.speaker || '', side: 'top', hold: 2800, villain: true });
      t += 3400;
    }

    // Chapter title card
    const nextTitle = next.title || `Chapter ${this.nextChapter}`;
    beats.push({ type: 'caption', t, text: `Chapter ${this.nextChapter}`, subtitle: nextTitle, hold: 2000 });
    t += 2600;

    // End
    beats.push({ type: 'end', t });

    return beats;
  }

  // ---------------------------------------------------------------------------
  // Improvement 2 & 3 & 4: _beatEnter with portrait images, bottom dialogue bar,
  // villain v2 variant, and villain entrance flash
  _beatEnter(beat, W, H) {
    const isVillain = beat.villain || false;

    // Determine portrait texture keys
    const baseKey     = SPEAKER_PORTRAIT_KEY[beat.speaker] || null;
    const isEnemyKey  = baseKey && baseKey.startsWith('enemy_png_');

    // Improvement 3: villain "reveal" — use _v2 variant for the large upper portrait
    let largeKey = baseKey;
    if (isEnemyKey && baseKey) {
      const v2Key = baseKey + '_v2';
      if (this.textures.exists(v2Key)) {
        largeKey = v2Key;
      }
    }

    // Improvement 4: villain entrance flash + camera shake
    if (isVillain && isEnemyKey) {
      const flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff)
        .setAlpha(0)
        .setDepth(20);
      this.tweens.add({
        targets: flash,
        alpha: 0.5,
        duration: 150,
        yoyo: true,
        hold: 0,
        ease: 'Linear',
        onComplete: () => flash.destroy(),
      });
      this.cameras.main.shake(200, 0.01);
    }

    // -------------------------------------------------------------------------
    // Upper large portrait (slides in from off-screen — kept but reduced in size)
    const centerY = H * 0.42;

    let startX, startY, targetX, targetY;
    if (beat.side === 'top') {
      startX = W / 2;  startY = -140;
      targetX = W / 2; targetY = centerY - 40;
    } else if (beat.side === 'left') {
      startX = -130;   startY = centerY;
      targetX = W * 0.28; targetY = centerY;
    } else {
      startX = W + 130; startY = centerY;
      targetX = W * 0.72; targetY = centerY;
    }

    // Try to use portrait PNG for large upper portrait (120x120), else emoji at 52px
    let largePortraitObj;
    const hasLargePng = largeKey && this.textures.exists(largeKey);
    if (hasLargePng) {
      largePortraitObj = this.add.image(startX, startY, largeKey)
        .setDisplaySize(120, 120)
        .setOrigin(0.5)
        .setDepth(5);
    } else {
      largePortraitObj = this.add.text(startX, startY, beat.portrait, {
        fontSize: '52px',
      }).setOrigin(0.5).setDepth(5);
    }

    // Slide / drop in
    const ease = beat.side === 'top' ? 'Bounce.out' : 'Power2.out';
    this.tweens.add({ targets: largePortraitObj, x: targetX, y: targetY, duration: 700, ease });

    // Bounce idle animation
    this.tweens.add({
      targets: largePortraitObj,
      y: targetY - (isVillain ? 14 : 8),
      duration: isVillain ? 500 : 700,
      yoyo: true, repeat: -1,
      ease: 'Sine.inOut',
      delay: 750,
    });

    // -------------------------------------------------------------------------
    // Improvement 2: Fire Emblem bottom dialogue bar
    // Bar sits at y = H*0.70, height ~110px (above the 44px bottom letterbox)
    const barY      = H * 0.70;
    const barH      = 110;
    const barBgCol  = 0x0a1a2e;
    const barBorder = isVillain ? 0xdd2222 : 0x4488ff;

    // Background panel
    const barBg = this.add.graphics().setDepth(7);
    barBg.fillStyle(barBgCol, 0.92);
    barBg.fillRect(0, barY, W, barH);
    barBg.lineStyle(2, barBorder, 0.9);
    barBg.strokeRect(0, barY, W, barH);

    // --- Portrait thumbnail (left side of bar) ---
    // v1 key for the bottom bar (always use v1 for consistency)
    const barPortraitKey = baseKey;
    const hasBarPng = barPortraitKey && this.textures.exists(barPortraitKey);

    let barPortraitObj = null;
    if (hasBarPng) {
      // Circular mask for portrait image
      const maskShape = this.make.graphics({ x: 16, y: barY + 15, add: false });
      maskShape.fillStyle(0xffffff);
      maskShape.fillCircle(40, 40, 40);
      const mask = maskShape.createGeometryMask();

      barPortraitObj = this.add.image(16 + 40, barY + 15 + 40, barPortraitKey)
        .setDisplaySize(80, 80)
        .setOrigin(0.5)
        .setDepth(8)
        .setMask(mask);
    } else {
      // Fallback: emoji at 36px
      barPortraitObj = this.add.text(16 + 18, barY + 15 + 18, beat.portrait, {
        fontSize: '36px',
      }).setOrigin(0.5).setDepth(8);
    }

    // Speaker name label (bold, gold for ally / red for villain)
    const nameColor = isVillain ? '#ff8888' : '#f8d030';
    const nameLabel = this.add.text(108, barY + 12, beat.speaker, {
      fontSize: '14px',
      color: nameColor,
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setDepth(8).setOrigin(0, 0);

    // Dialogue typewriter text
    const dialogueText = this.add.text(108, barY + 34, '', {
      fontSize: '13px',
      color: isVillain ? '#ffcccc' : '#ddeeff',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      wordWrap: { width: W - 120 },
    }).setDepth(8).setOrigin(0, 0);

    // Typewriter effect
    const full = beat.text;
    let ci = 0;
    this.time.addEvent({
      delay: 30, repeat: full.length - 1,
      callback: () => { dialogueText.setText(full.slice(0, ++ci)); },
    });

    // Fade bar in
    const barObjects = [barBg, nameLabel, dialogueText];
    if (barPortraitObj) barObjects.push(barPortraitObj);
    barObjects.forEach(o => o.setAlpha(0));
    this.tweens.add({ targets: barObjects, alpha: 1, duration: 300, delay: 400 });

    // -------------------------------------------------------------------------
    // Fade everything out before next beat
    this.time.delayedCall(beat.hold, () => {
      const allObjects = [largePortraitObj, ...barObjects];
      this.tweens.add({
        targets: allObjects,
        alpha: 0, duration: 400,
        onComplete: () => {
          allObjects.forEach(o => { if (o && o.destroy) o.destroy(); });
        },
      });
    });
  }

  // ---------------------------------------------------------------------------
  _beatCaption(beat, W, H) {
    const label = this.add.text(W / 2, H * 0.44, beat.text.toUpperCase(), {
      fontSize: '13px', color: '#aabbcc', letterSpacing: 6,
      fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0).setDepth(8);

    const title = this.add.text(W / 2, H * 0.44 + 28, beat.subtitle, {
      fontSize: '28px', color: '#f8d030',
      fontFamily: 'Nunito, Georgia, serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0).setDepth(8);

    this.tweens.add({ targets: [label, title], alpha: 1, duration: 400 });

    this.time.delayedCall(beat.hold, () => {
      this.tweens.add({
        targets: [label, title], alpha: 0, duration: 400,
        onComplete: () => { label.destroy(); title.destroy(); },
      });
    });
  }

  // ---------------------------------------------------------------------------
  _fadeToNextChapter() {
    if (this._fading) return;
    this._fading = true;
    this.tweens.killAll();

    const W = GAME_W, H = GAME_H;
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(50);
    this.tweens.add({
      targets: overlay, alpha: 1, duration: 600,
      onComplete: () => {
        this.scene.start('PrepScene', {
          chapter:  this.nextChapter,
          saveData: this.saveData,
        });
      },
    });
  }
}
