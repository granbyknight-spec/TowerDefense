'use strict';
// =============================================================================
// Puppy Force — TitleScene.js
// Animated title screen with stars and paw prints
// =============================================================================

// Target character levels for each chapter's debug jump (min level to win)
const DEBUG_CHAPTER_LEVELS = { 1:1, 2:3, 3:4, 4:5, 5:6, 6:7, 7:9 };

class TitleScene extends Phaser.Scene {
  constructor() { super({ key: 'TitleScene' }); }

  preload() {
    AudioManager.preloadMusic(this);
    // Background image (may not exist yet — graceful)
    this.load.image('title_bg', 'assets/backgrounds/chapter_1_v1.png');
    // Title key art banner (generated via AI Horde — may not exist yet)
    this.load.image('title_art', 'assets/backgrounds/title_v1.png');
    // Available portrait PNGs (graceful)
    ['CORGI_HEALER', 'HUSKY_RIDER', 'PUPPY_KNIGHT', 'LABRADOR_SCOUT',
     'BEAGLE_ARCHER', 'POODLE_MAGE', 'BULLDOG_TANK', 'TERRIER_THIEF', 'DOG_PALADIN'].forEach(id => {
      this.load.image('player_png_' + id, 'assets/characters/' + id + '_portrait.png');
    });
  }

  create() {
    const W = GAME_W, H = GAME_H;
    this._stars = [];
    this._paws  = [];

    // ── Title music ──────────────────────────────────────────────────────────
    AudioManager.playMusic(this, 'title');

    // ── Background: image if loaded, else procedural gradient ───────────────
    if (this.textures.exists('title_bg') && this.textures.get('title_bg').key !== '__MISSING') {
      this.add.image(W / 2, H / 2, 'title_bg').setDisplaySize(W, H).setAlpha(0.55);
    } else {
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x0d1535, 0x0d1535, 1);
      bg.fillRect(0, 0, W, H);
      // Landscape silhouette (only when no background image)
      const land = this.add.graphics();
      land.fillStyle(0x050510, 1);
      land.fillRect(0, H * 0.62, W, H * 0.38);
      land.fillStyle(0x0a0a20, 1);
      land.fillEllipse(80, H * 0.62, 220, 80);
      land.fillEllipse(W - 80, H * 0.62, 200, 70);
      land.fillEllipse(W / 2, H * 0.60, 300, 90);
      this._drawHouseSilhouette(land, W / 2 - 60, H * 0.58);
      this._drawHouseSilhouette(land, W / 2 + 20, H * 0.57);
      this._drawTreeSilhouette(land, 30, H * 0.59);
      this._drawTreeSilhouette(land, W - 50, H * 0.59);
    }

    // Dark vignette overlay (always — keeps text readable over any background)
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.45);

    // ── Twinkling stars ──────────────────────────────────────────────────────
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H * 0.65);
      const r = Math.random() > 0.7 ? 2 : 1;
      const star = this.add.circle(x, y, r, 0xffffff, Phaser.Math.FloatBetween(0.3, 1));
      this._stars.push(star);
      this.tweens.add({
        targets: star, alpha: { from: 0.1, to: 1 },
        duration: Phaser.Math.Between(800, 2000),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }

    // ── Moon ─────────────────────────────────────────────────────────────────
    this.add.circle(W - 60, 60, 28, 0xfff4cc, 0.9);
    this.add.circle(W - 48, 55, 24, 0x0d1535, 0.85);

    // ── Title key art banner (if available) ──────────────────────────────────
    const titleArtY = 110;
    if (this.textures.exists('title_art') && this.textures.get('title_art').key !== '__MISSING') {
      const art = this.add.image(W / 2, titleArtY, 'title_art').setDisplaySize(W, 200);
      // Slow horizontal drift
      this.tweens.add({ targets: art, x: W / 2 + 4, duration: 6000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // ── Decorative title banner frame ─────────────────────────────────────────
    const bannerY = 210;
    // Dark backing panel
    this.add.rectangle(W / 2, bannerY, W - 16, 74, 0x04060f, 0.92);
    // Double-line gold border — outer thick + inner hairline (SF-style)
    this.add.rectangle(W / 2, bannerY - 37, W - 16, 3, 0xf8d030).setAlpha(0.95);
    this.add.rectangle(W / 2, bannerY - 33, W - 16, 1, 0xffeeaa).setAlpha(0.35);
    this.add.rectangle(W / 2, bannerY + 33, W - 16, 1, 0xffeeaa).setAlpha(0.35);
    this.add.rectangle(W / 2, bannerY + 37, W - 16, 3, 0xf8d030).setAlpha(0.95);
    // Corner diamond ornaments
    this.add.text(14,     bannerY, '✦', { fontSize: '16px', color: '#f8d030', fontFamily: 'serif' }).setOrigin(0.5).setAlpha(0.85);
    this.add.text(W - 14, bannerY, '✦', { fontSize: '16px', color: '#f8d030', fontFamily: 'serif' }).setOrigin(0.5).setAlpha(0.85);

    // ── Title text — 4-layer SF-style depth ──────────────────────────────────
    const titleY = bannerY - 10;

    // Layer 1: pulsing blue-white outer aura
    const glow = this.add.text(W / 2, titleY, 'PUPPY FORCE', {
      fontFamily: 'Georgia, serif', fontSize: '50px', fontStyle: 'bold',
      color: '#88aaff', stroke: '#001166', strokeThickness: 22,
    }).setOrigin(0.5).setAlpha(0.3);
    this.tweens.add({ targets: glow, alpha: { from: 0.12, to: 0.45 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Layer 2: shadow / depth offset (gives the SF carved-stone 3D feel)
    this.add.text(W / 2 + 4, titleY + 4, 'PUPPY FORCE', {
      fontFamily: 'Georgia, serif', fontSize: '50px', fontStyle: 'bold',
      color: '#1a0800', stroke: '#0d0500', strokeThickness: 12,
    }).setOrigin(0.5).setAlpha(0.85);

    // Layer 3: main title — amber-gold fill, thick dark-amber stroke like SF2
    this.add.text(W / 2, titleY, 'PUPPY FORCE', {
      fontFamily: 'Georgia, serif', fontSize: '50px', fontStyle: 'bold',
      color: '#ffe040', stroke: '#6b2d00', strokeThickness: 10,
      shadow: { offsetX: 1, offsetY: 2, color: '#000000', blur: 4, stroke: false, fill: true },
    }).setOrigin(0.5);

    // Layer 4: gloss sheen (faint white shifted up — simulates metallic shine)
    this.add.text(W / 2, titleY - 2, 'PUPPY FORCE', {
      fontFamily: 'Georgia, serif', fontSize: '50px', fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0.08);

    // Subtitle — warm gold serif, dark stroke, SF-cohesive palette
    this.add.text(W / 2, bannerY + 21, '✦  A TACTICAL DOG ADVENTURE  ✦', {
      fontFamily: 'Georgia, serif', fontSize: '13px', fontStyle: 'bold',
      color: '#d4a820', stroke: '#1a0800', strokeThickness: 4,
    }).setOrigin(0.5);

    // ── Portrait showcase ─────────────────────────────────────────────────────
    // Show whichever hero portrait PNGs are actually loaded, up to 9 slots
    const portraitIds = ['CORGI_HEALER','HUSKY_RIDER','PUPPY_KNIGHT','LABRADOR_SCOUT',
                         'BEAGLE_ARCHER','POODLE_MAGE','BULLDOG_TANK','TERRIER_THIEF','DOG_PALADIN'];
    const portraitColors = {
      CORGI_HEALER:   0x33bb55, HUSKY_RIDER:    0x4488ff, PUPPY_KNIGHT:   0xf8d030,
      LABRADOR_SCOUT: 0xff8800, BEAGLE_ARCHER:  0x44ccaa, POODLE_MAGE:    0xaa44ff,
      BULLDOG_TANK:   0xcc4444, TERRIER_THIEF:  0x888800, DOG_PALADIN:    0xffffff,
    };
    const availIds = portraitIds.filter(id =>
      this.textures.exists('player_png_' + id) &&
      this.textures.get('player_png_' + id).key !== '__MISSING'
    );
    const showcaseY = 270;
    const slotSize  = 48;
    const total     = availIds.length;
    if (total > 0) {
      const step = Math.min(54, Math.floor((W - 20) / total));
      const startX = W / 2 - ((total - 1) * step) / 2;
      availIds.forEach((id, idx) => {
        const px = startX + idx * step;
        const borderColor = portraitColors[id] || 0x4488ff;
        // Border frame
        this.add.rectangle(px, showcaseY, slotSize + 4, slotSize + 4, borderColor, 0.8);
        // Portrait image
        this.add.image(px, showcaseY, 'player_png_' + id).setDisplaySize(slotSize, slotSize);
      });
    } else {
      // Fallback: bouncing dog emojis
      const heroes = ['🐶','🐕','🦮','🐩','🐾','🐕‍🦺','🐺','🦊'];
      heroes.forEach((e, i) => {
        const x = 30 + i * 54;
        const t = this.add.text(x, showcaseY, e, { fontSize: '28px' }).setOrigin(0.5);
        this.tweens.add({ targets: t, y: showcaseY - 8, duration: 600, yoyo: true, repeat: -1, delay: i * 120 });
      });
    }

    // ── FE-style menu ─────────────────────────────────────────────────────────
    const hasSave   = SaveManager.hasSave();
    const menuItems = [
      { label: 'NEW GAME',   cb: () => {
          const data = SaveManager.newGame();
          SaveManager.save(data);
          this.scene.start('BattleScene', { chapter: 1, saveData: data });
        }
      },
    ];
    if (hasSave) {
      menuItems.push({ label: 'CONTINUE', cb: () => {
          const data = SaveManager.load();
          this.scene.start('BattleScene', { chapter: data.currentChapter, saveData: data });
        }
      });
    }
    menuItems.push({ label: 'ERASE DATA', cb: () => { SaveManager.deleteSave(); this.scene.restart(); } });

    const menuPanelW = 260;
    const menuItemH  = 44;
    const menuPanelH = menuItems.length * menuItemH + 24;
    const menuTopY   = 320;
    const menuCenterX = W / 2;

    // Dark panel background
    this.add.rectangle(menuCenterX, menuTopY + menuPanelH / 2, menuPanelW, menuPanelH, 0x000011, 0.78);
    // Gold border lines top + bottom
    this.add.rectangle(menuCenterX, menuTopY,                  menuPanelW, 2, 0xf8d030).setAlpha(0.7);
    this.add.rectangle(menuCenterX, menuTopY + menuPanelH,     menuPanelW, 2, 0xf8d030).setAlpha(0.7);

    menuItems.forEach((item, idx) => {
      const iy = menuTopY + 12 + menuItemH / 2 + idx * menuItemH;
      const labelX = menuCenterX - menuPanelW / 2 + 36;

      // Gold cursor triangle (hidden by default)
      const cursor = this.add.text(menuCenterX - menuPanelW / 2 + 12, iy, '▶', {
        fontSize: '16px', color: '#f8d030', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0, 0.5).setAlpha(0);

      // Menu item label text
      const txt = this.add.text(labelX, iy, item.label, {
        fontSize: '20px', color: '#ccddee',
        fontFamily: 'Nunito, Courier New, monospace', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0, 0.5);

      // Invisible hit zone
      const zone = this.add.zone(menuCenterX, iy, menuPanelW, menuItemH).setInteractive({ useHandCursor: true });

      // Cursor bounce tween (plays while hovered)
      let cursorTween = null;

      zone.on('pointerover', () => {
        txt.setColor('#f8d030');
        txt.setScale(1.04);
        cursor.setAlpha(1);
        cursorTween = this.tweens.add({ targets: cursor, x: cursor.x + 4, duration: 300, yoyo: true, repeat: -1 });
      });

      zone.on('pointerout', () => {
        txt.setColor('#ccddee');
        txt.setScale(1);
        cursor.setAlpha(0);
        if (cursorTween) { cursorTween.stop(); cursorTween = null; }
        cursor.setX(menuCenterX - menuPanelW / 2 + 12);
      });

      zone.on('pointerdown', () => {
        if (cursorTween) { cursorTween.stop(); }
        this.tweens.add({ targets: txt, scaleX: 0.92, scaleY: 0.92, duration: 80, yoyo: true });
        setTimeout(item.cb, 120);
      });
    });

    // ── Chapter-select panel — always visible TODO: remove before release ─────
    this.add.text(W / 2, 496, '── DEV: JUMP TO CHAPTER ──', {
      fontSize: '11px', color: '#ccaa22',
      fontFamily: 'Nunito, Courier New, monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    const chapBtnX = [28, 92, 156, 220, 284, 348, 412];
    for (let ch = 1; ch <= 7; ch++) {
      this._makeChapterDebugBtn(chapBtnX[ch - 1], 526, ch, () => {
        const data = _buildDebugSaveData(ch);
        SaveManager.save(data);
        this.scene.start('BattleScene', { chapter: ch, saveData: data });
      });
    }


    // ── Inn button (character gallery) ────────────────────────────────────────
    const innY    = menuTopY + menuPanelH + 28;
    const innW    = 180;
    const innH    = 38;
    const innGfx  = this.add.graphics();
    const innTxt  = this.add.text(menuCenterX, innY, '🏠  THE INN', {
      fontSize: '17px', color: '#f8d030',
      fontFamily: 'Nunito, Courier New, monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);
    const innZone = this.add.zone(menuCenterX, innY, innW, innH).setInteractive({ useHandCursor: true });

    const drawInn = (hover) => {
      innGfx.clear();
      innGfx.lineStyle(2, 0xf8d030, hover ? 1.0 : 0.55);
      innGfx.strokeRoundedRect(menuCenterX - innW / 2, innY - innH / 2, innW, innH, 6);
      if (hover) innGfx.fillStyle(0xf8d030, 0.12), innGfx.fillRoundedRect(menuCenterX - innW / 2, innY - innH / 2, innW, innH, 6);
    };
    drawInn(false);
    innZone.on('pointerover',  () => { drawInn(true);  innTxt.setColor('#ffffff'); });
    innZone.on('pointerout',   () => { drawInn(false); innTxt.setColor('#f8d030'); });
    innZone.on('pointerdown',  () => this.scene.start('InnScene'));

    // ── Debug-only extras (localhost / ?debug) ────────────────────────────────
    const _debugOn = window.location.hostname === 'localhost'
                  || window.location.hostname === '127.0.0.1'
                  || new URLSearchParams(window.location.search).has('debug');
    if (_debugOn) {
      this._makeSmallDebugBtn(W / 2, 562, '🎬 Preview Cutscene [Debug]', () => {
        this.scene.start('CutsceneScene', {
          currentChap: 1, chapter: 2, saveData: SaveManager.newGame(),
        });
      });
    }

    // ── Version & credits ────────────────────────────────────────────────────
    this.add.text(W / 2, H - 30, 'v1.0  ·  7 Chapters  ·  Dogs vs Cats', {
      fontSize: '13px', color: '#7788aa',
      fontFamily: 'Nunito, Courier New, monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    // ── Mute toggle button ────────────────────────────────────────────────────
    const muteBtn = this.add.text(W - 12, H - 12, '🔊 Sound ON', {
      fontSize: '13px', color: '#aabbcc',
      fontFamily: 'Nunito, Courier New, monospace', fontStyle: 'bold',
      backgroundColor: '#11223388', padding: { x: 6, y: 3 },
    }).setOrigin(1, 1).setAlpha(0.75).setInteractive({ useHandCursor: true });
    muteBtn.on('pointerover',  () => muteBtn.setAlpha(1));
    muteBtn.on('pointerout',   () => muteBtn.setAlpha(0.75));
    muteBtn.on('pointerdown',  () => {
      this.sound.mute = !this.sound.mute;
      muteBtn.setText(this.sound.mute ? '🔇 Sound OFF' : '🔊 Sound ON');
    });

    // ── Floating paw prints ───────────────────────────────────────────────────
    this.time.addEvent({ delay: 1200, loop: true, callback: this._spawnPaw, callbackScope: this });

    // ── Audio unlock prompt ───────────────────────────────────────────────────
    const audioPrompt = this.add.text(W / 2, H - 40, '🔊 Tap anywhere to enable audio', {
      fontSize: '14px', color: '#aaddff', fontFamily: 'Nunito, monospace',
      backgroundColor: '#00000066', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setDepth(100);

    this.input.once('pointerdown', () => {
      audioPrompt.destroy();
      if (this.sound.context && this.sound.context.state === 'suspended') {
        this.sound.context.resume().then(() => { AudioManager.playMusic(this, 'title'); });
      } else {
        AudioManager.playMusic(this, 'title');
      }
    });

    // ── Fade in from black ────────────────────────────────────────────────────
    this.cameras.main.fadeIn(600, 0, 0, 0);
  }

  _spawnPaw() {
    const x = Phaser.Math.Between(20, GAME_W - 20);
    const paw = this.add.text(x, GAME_H * 0.62, '🐾', { fontSize: '20px' }).setAlpha(0.6);
    this.tweens.add({
      targets: paw, y: paw.y - 60, alpha: 0,
      duration: 1800, ease: 'Power1',
      onComplete: () => paw.destroy(),
    });
  }

  _drawHouseSilhouette(g, x, y) {
    g.fillStyle(0x080818, 1);
    g.fillRect(x, y + 14, 40, 30);
    g.fillTriangle(x - 4, y + 14, x + 20, y - 10, x + 44, y + 14);
  }

  _drawTreeSilhouette(g, x, y) {
    g.fillStyle(0x080818, 1);
    g.fillTriangle(x - 16, y + 20, x, y - 20, x + 16, y + 20);
    g.fillTriangle(x - 12, y + 8,  x, y - 32, x + 12, y + 8);
  }

  _makeChapterDebugBtn(x, y, chapNum, cb) {
    const W_btn = 52, H_btn = 26;
    const targetLv = DEBUG_CHAPTER_LEVELS[chapNum] || 1;
    const bg = this.add.graphics();
    bg.fillStyle(0x112233, 0.9);
    bg.fillRoundedRect(x - W_btn / 2, y - H_btn / 2, W_btn, H_btn, 4);
    bg.lineStyle(1, 0x2255aa, 0.7);
    bg.strokeRoundedRect(x - W_btn / 2, y - H_btn / 2, W_btn, H_btn, 4);

    this.add.text(x, y - 4, `Ch${chapNum}`, {
      fontSize: '10px', color: '#aaccff',
      fontFamily: 'Nunito, Courier New, monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1);
    this.add.text(x, y + 5, `Lv${targetLv}`, {
      fontSize: '9px', color: '#7799bb',
      fontFamily: 'Nunito, Courier New, monospace',
    }).setOrigin(0.5).setDepth(1);

    const zone = this.add.zone(x, y, W_btn, H_btn).setInteractive({ useHandCursor: true });
    zone.on('pointerover',  () => { bg.clear(); bg.fillStyle(0x1a3355, 1); bg.fillRoundedRect(x - W_btn / 2, y - H_btn / 2, W_btn, H_btn, 4); });
    zone.on('pointerout',   () => { bg.clear(); bg.fillStyle(0x112233, 0.9); bg.fillRoundedRect(x - W_btn / 2, y - H_btn / 2, W_btn, H_btn, 4); bg.lineStyle(1, 0x2255aa, 0.7); bg.strokeRoundedRect(x - W_btn / 2, y - H_btn / 2, W_btn, H_btn, 4); });
    zone.on('pointerdown',  () => { setTimeout(cb, 80); });
  }

  _makeSmallDebugBtn(x, y, label, cb) {
    const W_btn = 210, H_btn = 24;
    const bg = this.add.graphics();
    bg.fillStyle(0x111122, 0.85);
    bg.fillRoundedRect(x - W_btn / 2, y - H_btn / 2, W_btn, H_btn, 5);
    bg.lineStyle(1, 0x334455, 0.6);
    bg.strokeRoundedRect(x - W_btn / 2, y - H_btn / 2, W_btn, H_btn, 5);

    const txt = this.add.text(x, y, label, {
      fontSize: '11px', color: '#8899bb',
      fontFamily: 'Nunito, Courier New, monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y, W_btn, H_btn).setInteractive({ useHandCursor: true });
    zone.on('pointerover',  () => txt.setColor('#8899bb'));
    zone.on('pointerout',   () => txt.setColor('#556677'));
    zone.on('pointerdown',  () => { setTimeout(cb, 80); });
  }
}

// Build a save-data object with all heroes leveled to chapter-appropriate level
function _buildDebugSaveData(chapterNumber) {
  const data = SaveManager.newGame();
  const targetLevel = DEBUG_CHAPTER_LEVELS[chapterNumber] || 1;

  // Build roster from ALL hero definitions so later chapters have full party
  const units = Object.keys(HERO_DEFS).map(id => new Unit(HERO_DEFS[id], 0, 0));

  if (targetLevel > 1) {
    units.forEach(u => {
      while (u.level < targetLevel) {
        u.gainExp(999);
      }
      u.hp = u.maxHp;
    });
  }

  data.roster = SaveManager.serializeRoster(units);
  data.currentChapter = chapterNumber;
  data.completedChapters = Array.from({ length: chapterNumber - 1 }, (_, i) => i + 1);
  return data;
}
