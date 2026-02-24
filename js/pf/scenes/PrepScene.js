'use strict';
// =============================================================================
// Puppy Force — PrepScene.js
// Pre-battle preparation / deployment screen
// Shown after CutsceneScene, before BattleScene
// =============================================================================

class PrepScene extends Phaser.Scene {
  constructor() { super({ key: 'PrepScene' }); }

  init(data) {
    this.chapter  = data.chapter;
    this.saveData = data.saveData;
  }

  preload() {
    AudioManager.preloadMusic(this);
    AudioManager.preloadSFX(this);
  }

  create() {
    AudioManager.playMusic(this, 'overworld', 0.35);
    const W = GAME_W, H = GAME_H;

    this._buildBackground(W, H);
    this._buildHeader(W);
    this._buildObjective(W);
    this._buildRoster(W, H);
    this._buildDeployButton(W, H);
  }

  // ---------------------------------------------------------------------------
  _buildBackground(W, H) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x0a1422, 0x0a1422, 1);
    bg.fillRect(0, 0, W, H);

    // Subtle decorative horizontal rules
    for (let i = 1; i < 5; i++) {
      const line = this.add.graphics();
      line.lineStyle(1, 0x223355, 0.18);
      line.lineBetween(0, i * (H / 5), W, i * (H / 5));
    }

    // Corner accent glyphs
    const accentStyle = { fontSize: '13px', color: '#223355', fontFamily: 'Nunito, Arial, sans-serif' };
    this.add.text(10,  10,  '✦', accentStyle);
    this.add.text(W - 22, 10,  '✦', accentStyle);
    this.add.text(10,  H - 22, '✦', accentStyle);
    this.add.text(W - 22, H - 22, '✦', accentStyle);
  }

  // ---------------------------------------------------------------------------
  _buildHeader(W) {
    const chap = CHAPTERS[this.chapter - 1] || {};

    // "CHAPTER N" line
    this.add.text(W / 2, 40, `⚔  CHAPTER ${this.chapter}`, {
      fontSize: '14px',
      color: '#aabbcc',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      letterSpacing: 4,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Chapter title in gold
    this.add.text(W / 2, 70, chap.title || `Chapter ${this.chapter}`, {
      fontSize: '28px',
      color: '#f8d030',
      fontFamily: 'Nunito, Georgia, serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Subtitle / flavour in muted blue
    if (chap.subtitle) {
      this.add.text(W / 2, 104, chap.subtitle, {
        fontSize: '13px',
        color: '#7799bb',
        fontFamily: 'Nunito, Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 1,
        wordWrap: { width: W - 40 },
        align: 'center',
      }).setOrigin(0.5);
    }

    // Thin gold divider
    const divider = this.add.graphics();
    divider.lineStyle(1, 0xf8d030, 0.35);
    divider.lineBetween(30, 124, W - 30, 124);
  }

  // ---------------------------------------------------------------------------
  _buildObjective(W) {
    const chap = CHAPTERS[this.chapter - 1] || {};

    // Build hint text: prefer explicit bossHint, fall back to bossId label, or generic
    let hintText = chap.bossHint || null;
    if (!hintText && chap.bossId) {
      // Turn "SNOW_LEOPARD" → "Snow Leopard"
      const bossName = chap.bossId
        .split('_')
        .map(w => w.charAt(0) + w.slice(1).toLowerCase())
        .join(' ');
      hintText = `Defeat the ${bossName}`;
    }
    if (!hintText) {
      hintText = 'Defeat all enemies';
    }

    this.add.text(W / 2, 144, 'OBJECTIVE:', {
      fontSize: '12px',
      color: '#f8d030',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      letterSpacing: 3,
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5);

    this.add.text(W / 2, 164, hintText, {
      fontSize: '15px',
      color: '#ddeeff',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
      wordWrap: { width: W - 60 },
      align: 'center',
    }).setOrigin(0.5);

    // Section header for roster
    const lineY = 190;
    const lineGfx = this.add.graphics();
    lineGfx.lineStyle(1, 0x334466, 0.6);
    lineGfx.lineBetween(20, lineY, W - 20, lineY);

    this.add.text(24, lineY - 9, 'YOUR FORCE', {
      fontSize: '11px',
      color: '#778899',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      letterSpacing: 3,
      stroke: '#000000',
      strokeThickness: 1,
    });
  }

  // ---------------------------------------------------------------------------
  _buildRoster(W, H) {
    // Deserialize roster; fall back gracefully if saveData is missing or empty
    let units = [];
    if (this.saveData && this.saveData.roster && this.saveData.roster.length > 0) {
      try {
        units = SaveManager.deserializeRoster(this.saveData.roster);
      } catch (e) {
        console.warn('PrepScene: could not deserialize roster', e);
      }
    }

    // If still empty, build a default fresh roster for display
    if (units.length === 0) {
      const defaultIds = ['PUPPY_KNIGHT', 'CORGI_HEALER', 'LABRADOR_SCOUT',
                          'POODLE_MAGE', 'HUSKY_RIDER', 'BEAGLE_ARCHER'];
      defaultIds.forEach(id => {
        const def = (typeof HERO_DEFS !== 'undefined' && HERO_DEFS[id]) ||
                    (typeof ALLY_DEFS !== 'undefined' && ALLY_DEFS[id]);
        if (def) {
          try { units.push(new Unit(def, 0, 0)); } catch (_) {}
        }
      });
    }

    // Show up to 8 units
    const display = units.slice(0, 8);

    const cardW  = W - 40;   // 440
    const cardH  = 46;
    const startY = 200;
    const gap    = 6;

    display.forEach((unit, i) => {
      const cardX = 20;
      const cardY = startY + i * (cardH + gap);

      // --- HP calculations
      const maxHp  = (unit.stats && unit.stats.maxHp) ? unit.stats.maxHp : (unit.baseStats && unit.baseStats.maxHp) || 1;
      const curHp  = (unit.hp !== undefined) ? unit.hp : maxHp;
      const hpPct  = Math.max(0, curHp / maxHp);
      const hpColor = hpPct > 0.5 ? '#44dd77' : (hpPct > 0.25 ? '#f8d030' : '#ee4444');

      // Card background
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x0d1e33, 0.95);
      cardBg.fillRoundedRect(cardX, cardY, cardW, cardH, 7);
      cardBg.lineStyle(1, 0x334466, 0.7);
      cardBg.strokeRoundedRect(cardX, cardY, cardW, cardH, 7);

      // Thin HP-coloured left accent bar
      const accentGfx = this.add.graphics();
      const accentCol = hpPct > 0.5 ? 0x44dd77 : (hpPct > 0.25 ? 0xf8d030 : 0xee4444);
      accentGfx.fillStyle(accentCol, 0.8);
      accentGfx.fillRoundedRect(cardX, cardY, 4, cardH, { tl: 7, bl: 7, tr: 0, br: 0 });

      // Emoji
      this.add.text(cardX + 14, cardY + cardH / 2, unit.emoji || '🐾', {
        fontSize: '24px',
      }).setOrigin(0, 0.5);

      // Name
      this.add.text(cardX + 50, cardY + 10, unit.name || 'Unknown', {
        fontSize: '14px',
        color: '#eeeeff',
        fontFamily: 'Nunito, Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 1,
      });

      // Class
      const unitClass = (unit.unitClass) || (unit.def && unit.def.unitClass) || '';
      this.add.text(cardX + 50, cardY + 27, unitClass, {
        fontSize: '11px',
        color: '#8899bb',
        fontFamily: 'Nunito, Arial, sans-serif',
        fontStyle: 'bold',
      });

      // Level (right-aligned, mid-column)
      const level = (unit.stats && unit.stats.level) || (unit.baseStats && unit.baseStats.level) || 1;
      this.add.text(cardX + cardW - 90, cardY + cardH / 2, `Lv${level}`, {
        fontSize: '13px',
        color: '#aabbcc',
        fontFamily: 'Nunito, Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 1,
      }).setOrigin(0, 0.5);

      // HP display  "##/##HP"
      this.add.text(cardX + cardW - 18, cardY + cardH / 2, `${curHp}/${maxHp}HP`, {
        fontSize: '13px',
        color: hpColor,
        fontFamily: 'Nunito, Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 1,
      }).setOrigin(1, 0.5);
    });

    // Separator below roster
    const rosterBottomY = startY + display.length * (cardH + gap) + 6;
    const sepGfx = this.add.graphics();
    sepGfx.lineStyle(1, 0x334466, 0.4);
    sepGfx.lineBetween(20, rosterBottomY, W - 20, rosterBottomY);
  }

  // ---------------------------------------------------------------------------
  _buildDeployButton(W, H) {
    this._btn(W / 2, H - 66, '⚔  DEPLOY!', 0x1a4422, 0x33bb55, () => {
      this.scene.start('BattleScene', {
        chapter:  this.chapter,
        saveData: this.saveData,
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Shared button helper — same style as VictoryScene._btn
  _btn(x, y, label, colorDark, colorLight, cb) {
    const W_btn = 260, H_btn = 52;
    const bg = this.add.graphics();
    bg.fillStyle(colorDark, 1);
    bg.fillRoundedRect(x - W_btn / 2, y - H_btn / 2, W_btn, H_btn, 10);
    bg.lineStyle(2, colorLight, 0.9);
    bg.strokeRoundedRect(x - W_btn / 2, y - H_btn / 2, W_btn, H_btn, 10);

    const txt = this.add.text(x, y, label, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Nunito, Courier New, monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y, W_btn, H_btn).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(colorLight, 1);
      bg.fillRoundedRect(x - W_btn / 2, y - H_btn / 2, W_btn, H_btn, 10);
      bg.lineStyle(2, colorLight, 1);
      bg.strokeRoundedRect(x - W_btn / 2, y - H_btn / 2, W_btn, H_btn, 10);
    });
    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(colorDark, 1);
      bg.fillRoundedRect(x - W_btn / 2, y - H_btn / 2, W_btn, H_btn, 10);
      bg.lineStyle(2, colorLight, 0.9);
      bg.strokeRoundedRect(x - W_btn / 2, y - H_btn / 2, W_btn, H_btn, 10);
    });
    zone.on('pointerdown', () => {
      this.tweens.add({ targets: [bg, txt], scaleX: 0.95, scaleY: 0.95, duration: 80, yoyo: true });
      setTimeout(cb, 120);
    });
  }
}
