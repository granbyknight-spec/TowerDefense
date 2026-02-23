'use strict';
// =============================================================================
// Puppy Force — VictoryScene.js
// Chapter victory, game over, and final victory screens
// =============================================================================

class VictoryScene extends Phaser.Scene {
  constructor() { super({ key: 'VictoryScene' }); }

  init(data) {
    this.result     = data.result;     // 'victory' | 'defeat' | 'gameover'
    this.chapter    = data.chapter;
    this.saveData   = data.saveData;
    this.newUnits   = data.newUnits || [];
    this.levelUps   = data.levelUps || [];
  }

  create() {
    const W = GAME_W, H = GAME_H;
    const isVictory = this.result === 'victory';
    const isGameOver= this.result === 'gameover';

    // ── Background ───────────────────────────────────────────────────────────
    const bg = this.add.graphics();
    if (isVictory) {
      bg.fillGradientStyle(0x0a1a2a, 0x0a1a2a, 0x1a2a0a, 0x1a2a0a, 1);
    } else {
      bg.fillGradientStyle(0x1a0a0a, 0x1a0a0a, 0x0a0a0a, 0x0a0a0a, 1);
    }
    bg.fillRect(0, 0, W, H);

    if (isVictory) {
      this._showVictory();
    } else {
      this._showDefeat();
    }
  }

  _showVictory() {
    const W = GAME_W, H = GAME_H;
    const chap = CHAPTERS[this.chapter - 1];
    const isFinal = this.chapter === 7;

    // Confetti particles
    for (let i = 0; i < 40; i++) {
      const colors = [0xf8d030, 0x4488ff, 0xff4466, 0x44cc66, 0xcc44ff];
      const dot = this.add.rectangle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(-20, 0),
        Phaser.Math.Between(4, 10), Phaser.Math.Between(4, 10),
        Phaser.Utils.Array.GetRandom(colors)
      );
      this.tweens.add({
        targets: dot, y: H + 20, x: dot.x + Phaser.Math.Between(-60, 60),
        rotation: Math.random() * 6,
        duration: Phaser.Math.Between(1500, 3000),
        delay: Phaser.Math.Between(0, 1500),
        repeat: -1,
      });
    }

    // Title
    const titleText = isFinal ? '🏆  VICTORY!  🏆' : `Chapter ${this.chapter} Clear!`;
    this.add.text(W / 2, 80, titleText, {
      fontFamily: 'Georgia, serif',
      fontSize: isFinal ? '38px' : '32px',
      color: '#f8d030',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Chapter name
    this.add.text(W / 2, 126, chap.title, {
      fontSize: '18px', color: '#88ccff',
      fontFamily: 'Courier New, monospace',
    }).setOrigin(0.5);

    // Hero emojis
    const heroRow = ['🐶','🐕','🦮','🐩','🐾','🐕‍🦺','🐺','🦊'];
    heroRow.forEach((e, i) => {
      const x = W/2 - (heroRow.length/2)*30 + i*30 + 15;
      const t = this.add.text(x, 170, e, { fontSize: '28px' }).setOrigin(0.5);
      this.tweens.add({ targets:t, y:160, duration:400+i*50, yoyo:true, repeat:-1 });
    });

    // Level up summary
    let yOff = 218;
    if (this.levelUps.length > 0) {
      this.add.text(W/2, yOff, '⬆ Level Ups:', {
        fontSize:'14px', color:'#ffcc44',
        fontFamily:'Courier New, monospace',
      }).setOrigin(0.5);
      yOff += 24;
      this.levelUps.slice(0, 5).forEach(lu => {
        this.add.text(W/2, yOff, `${lu.emoji} ${lu.name}: Lv ${lu.newLevel}`, {
          fontSize:'13px', color:'#ccddff',
          fontFamily:'Courier New, monospace',
        }).setOrigin(0.5);
        yOff += 20;
      });
      yOff += 8;
    }

    // New recruits
    if (this.newUnits.length > 0) {
      this.add.text(W/2, yOff, '🐾 New Allies:', {
        fontSize:'14px', color:'#44ff88',
        fontFamily:'Courier New, monospace',
      }).setOrigin(0.5);
      yOff += 24;
      this.newUnits.forEach(u => {
        this.add.text(W/2, yOff, `${u.emoji}  ${u.name}  joined!`, {
          fontSize:'13px', color:'#ccffcc',
          fontFamily:'Courier New, monospace',
        }).setOrigin(0.5);
        yOff += 20;
      });
      yOff += 8;
    }

    // Buttons
    if (!isFinal) {
      this._btn(W/2, H - 140, '⚔  NEXT CHAPTER', 0x1a4422, 0x33bb55, () => {
        this.scene.start('BattleScene', {
          chapter: this.chapter + 1,
          saveData: this.saveData,
        });
      });
    } else {
      this.add.text(W/2, H - 180, 'ALL 7 CHAPTERS COMPLETE!\nBarkville is saved forever!', {
        fontSize:'16px', color:'#f8d030',
        fontFamily:'Georgia, serif',
        align:'center',
      }).setOrigin(0.5);
    }

    this._btn(W/2, H - 70, '🏠  TITLE SCREEN', 0x112244, 0x2255aa, () => {
      this.scene.start('TitleScene');
    });
  }

  _showDefeat() {
    const W = GAME_W, H = GAME_H;

    // Rain-like effect
    for (let i = 0; i < 30; i++) {
      const drop = this.add.rectangle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(-H, 0),
        1, Phaser.Math.Between(10, 25), 0x4488cc, 0.4
      );
      this.tweens.add({
        targets: drop, y: H + 30,
        duration: Phaser.Math.Between(800, 1800),
        repeat: -1, delay: Phaser.Math.Between(0, 2000),
      });
    }

    this.add.text(W/2, 130, 'DEFEATED...', {
      fontFamily:'Georgia, serif', fontSize:'42px',
      color:'#cc3333', stroke:'#000000', strokeThickness:4,
    }).setOrigin(0.5);

    this.add.text(W/2, 186, 'The cats overwhelmed your force...', {
      fontSize:'15px', color:'#8899aa',
      fontFamily:'Courier New, monospace',
    }).setOrigin(0.5);

    this.add.text(W/2, 230, '😿🐱🐈😿', { fontSize:'44px' }).setOrigin(0.5);

    this.add.text(W/2, 300, 'Your brave dogs fought with honor.\nTry again and reclaim Barkville!', {
      fontSize:'14px', color:'#778899',
      fontFamily:'Courier New, monospace',
      align:'center',
    }).setOrigin(0.5);

    this._btn(W/2, H - 140, '🔄  RETRY CHAPTER', 0x2a1a00, 0x885500, () => {
      this.scene.start('BattleScene', {
        chapter: this.chapter,
        saveData: this.saveData,
      });
    });

    this._btn(W/2, H - 70, '🏠  TITLE SCREEN', 0x112244, 0x2255aa, () => {
      this.scene.start('TitleScene');
    });
  }

  _btn(x, y, label, colorDark, colorLight, cb) {
    const W_btn = 240, H_btn = 48;
    const bg = this.add.graphics();
    bg.fillStyle(colorDark, 1);
    bg.fillRoundedRect(x - W_btn/2, y - H_btn/2, W_btn, H_btn, 10);
    bg.lineStyle(2, colorLight, 0.9);
    bg.strokeRoundedRect(x - W_btn/2, y - H_btn/2, W_btn, H_btn, 10);

    const txt = this.add.text(x, y, label, {
      fontSize:'17px', color:'#ffffff',
      fontFamily:'Courier New, monospace', fontStyle:'bold',
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y, W_btn, H_btn).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      this.tweens.add({ targets:[bg,txt], scaleX:0.95, scaleY:0.95, duration:80, yoyo:true });
      setTimeout(cb, 120);
    });
  }
}
