'use strict';
// =============================================================================
// Puppy Force — TitleScene.js
// Animated title screen with stars and paw prints
// =============================================================================

class TitleScene extends Phaser.Scene {
  constructor() { super({ key: 'TitleScene' }); }

  create() {
    const W = GAME_W, H = GAME_H;
    this._stars = [];
    this._paws  = [];

    // ── Background gradient ──────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x0d1535, 0x0d1535, 1);
    bg.fillRect(0, 0, W, H);

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
    const moon = this.add.circle(W - 60, 60, 28, 0xfff4cc, 0.9);
    this.add.circle(W - 48, 55, 24, 0x0d1535, 0.85); // crescent cutout

    // ── Landscape silhouette ─────────────────────────────────────────────────
    const land = this.add.graphics();
    land.fillStyle(0x050510, 1);
    land.fillRect(0, H * 0.62, W, H * 0.38);
    // Simple hill shapes
    land.fillStyle(0x0a0a20, 1);
    land.fillEllipse(80, H * 0.62, 220, 80);
    land.fillEllipse(W - 80, H * 0.62, 200, 70);
    land.fillEllipse(W / 2, H * 0.60, 300, 90);
    // Village silhouette
    this._drawHouseSilhouette(land, W / 2 - 60, H * 0.58);
    this._drawHouseSilhouette(land, W / 2 + 20, H * 0.57);
    this._drawTreeSilhouette(land, 30, H * 0.59);
    this._drawTreeSilhouette(land, W - 50, H * 0.59);

    // ── Title ────────────────────────────────────────────────────────────────
    // Glow layer
    const glow = this.add.text(W / 2, 160, 'PUPPY FORCE', {
      fontFamily: 'Georgia, serif',
      fontSize: '44px',
      color: '#4488ff',
      stroke: '#000044',
      strokeThickness: 12,
      alpha: 0.5,
    }).setOrigin(0.5).setAlpha(0.5);
    this.tweens.add({ targets: glow, alpha: { from: 0.2, to: 0.6 }, duration: 1500, yoyo: true, repeat: -1 });

    const title = this.add.text(W / 2, 160, 'PUPPY FORCE', {
      fontFamily: 'Georgia, serif',
      fontSize: '44px',
      color: '#f8d030',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(W / 2, 208, '— A TACTICAL DOG ADVENTURE —', {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      color: '#88aacc',
    }).setOrigin(0.5);

    // Hero emojis row
    const heroes = ['🐶','🐕','🦮','🐩','🐾','🐕‍🦺','🐺','🦊'];
    heroes.forEach((e, i) => {
      const x = 30 + i * 54;
      const t = this.add.text(x, 248, e, { fontSize: '32px' }).setOrigin(0.5);
      this.tweens.add({
        targets: t, y: 240, duration: 600,
        yoyo: true, repeat: -1,
        delay: i * 120,
      });
    });

    // ── Buttons ──────────────────────────────────────────────────────────────
    const hasSave = SaveManager.hasSave();

    this._makeBtn(W / 2, 330, '▶  NEW GAME', 0x2255aa, 0x4488ff, () => {
      const data = SaveManager.newGame();
      SaveManager.save(data);
      this.scene.start('BattleScene', { chapter: 1, saveData: data });
    });

    if (hasSave) {
      this._makeBtn(W / 2, 400, '📂  CONTINUE', 0x1a4422, 0x33bb55, () => {
        const data = SaveManager.load();
        this.scene.start('BattleScene', { chapter: data.currentChapter, saveData: data });
      });
    }

    this._makeBtn(W / 2, hasSave ? 470 : 400, '🗑  ERASE DATA', 0x442200, 0x884400, () => {
      SaveManager.deleteSave();
      this.scene.restart();
    });

    // ── Version & credits ────────────────────────────────────────────────────
    this.add.text(W / 2, H - 30, 'v1.0  ·  7 Chapters  ·  Dogs vs Cats', {
      fontSize: '10px', color: '#445566',
    }).setOrigin(0.5);

    // ── Floating paw prints animation ────────────────────────────────────────
    this.time.addEvent({
      delay: 1200, loop: true,
      callback: this._spawnPaw, callbackScope: this,
    });

    // ── Chapter select: tap chapter number after continue ────────────────────
    // (handled via BattleScene start data)
  }

  _makeBtn(x, y, label, colorDark, colorLight, cb) {
    const W_btn = 240, H_btn = 48;
    const bg = this.add.graphics();
    bg.fillStyle(colorDark, 1);
    bg.fillRoundedRect(x - W_btn / 2, y - H_btn / 2, W_btn, H_btn, 10);
    bg.lineStyle(2, colorLight, 0.8);
    bg.strokeRoundedRect(x - W_btn / 2, y - H_btn / 2, W_btn, H_btn, 10);

    const txt = this.add.text(x, y, label, {
      fontSize: '18px', color: '#ffffff',
      fontFamily: 'Courier New, monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y, W_btn, H_btn).setInteractive({ useHandCursor: true });
    zone.on('pointerover',  () => { bg.clear(); bg.fillStyle(colorLight,0.9); bg.fillRoundedRect(x-W_btn/2,y-H_btn/2,W_btn,H_btn,10); });
    zone.on('pointerout',   () => { bg.clear(); bg.fillStyle(colorDark,1); bg.fillRoundedRect(x-W_btn/2,y-H_btn/2,W_btn,H_btn,10); bg.lineStyle(2,colorLight,0.8); bg.strokeRoundedRect(x-W_btn/2,y-H_btn/2,W_btn,H_btn,10); });
    zone.on('pointerdown',  () => { this.tweens.add({ targets:[bg,txt], scaleX:0.95, scaleY:0.95, duration:80, yoyo:true }); cb(); });
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
}
