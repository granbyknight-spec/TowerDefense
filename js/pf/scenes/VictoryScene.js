'use strict';
// =============================================================================
// Puppy Force — VictoryScene.js
// Chapter victory, game over, and final victory screens
// =============================================================================

class VictoryScene extends Phaser.Scene {
  constructor() { super({ key: 'VictoryScene' }); }

  init(data) {
    this.result       = data.result;     // 'victory' | 'defeat'
    this.chapter      = data.chapter;
    this.saveData     = data.saveData;
    this.newUnits     = data.newUnits || [];
    this.levelUps     = data.levelUps || [];
    this.victoryLines = data.victoryLines || [];
  }

  create() {
    const W = GAME_W, H = GAME_H;
    const isVictory = this.result === 'victory';

    // ── Background ───────────────────────────────────────────────────────────
    const bg = this.add.graphics();
    if (isVictory) {
      bg.fillGradientStyle(0x0a1a2a, 0x0a1a2a, 0x1a2a0a, 0x1a2a0a, 1);
    } else {
      bg.fillGradientStyle(0x1a0a0a, 0x1a0a0a, 0x0a0a0a, 0x0a0a0a, 1);
    }
    bg.fillRect(0, 0, W, H);

    if (isVictory) {
      this._showVictoryDialogue();
    } else {
      this._showDefeat();
    }
  }

  _showVictoryDialogue() {
    if (this.victoryLines.length === 0) { this._buildVictoryContent(); return; }
    const W = this.scale.width, H = this.scale.height;
    const lines = this.victoryLines;
    let idx = 0;

    // Dialogue box
    const boxH = 110, boxY = H - boxH - 10;
    const dBg = this.add.graphics();
    dBg.fillStyle(0x0a1a2e, 0.95);
    dBg.fillRoundedRect(10, boxY, W - 20, boxH, 10);
    dBg.lineStyle(2, 0x4488cc, 0.8);
    dBg.strokeRoundedRect(10, boxY, W - 20, boxH, 10);

    const portrait = this.add.text(36, boxY + 14, '', { fontSize: '36px' });
    const speaker  = this.add.text(76, boxY + 12, '', {
      fontSize: '16px', color: '#f8d030',
      fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 2,
    });
    const dlgText  = this.add.text(76, boxY + 34, '', {
      fontSize: '15px', color: '#ddeeff',
      fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
      wordWrap: { width: W - 106 }, lineSpacing: 5,
    });
    const tapHint  = this.add.text(W - 24, boxY + boxH - 16, '▶ TAP', {
      fontSize: '12px', color: '#aabbcc',
      fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(1, 0.5);
    this.tweens.add({ targets: tapHint, alpha: { from: 0.3, to: 1 }, duration: 600, yoyo: true, repeat: -1 });

    const showLine = (i) => {
      const line = lines[i];
      portrait.setText(line.portrait || '');
      speaker.setText(line.speaker || '');
      dlgText.setText(line.text || '');
    };
    showLine(0);

    const advance = () => {
      idx++;
      if (idx >= lines.length) {
        // Done — destroy dialogue elements and show stats
        [dBg, portrait, speaker, dlgText, tapHint].forEach(o => o.destroy());
        tapZone.destroy();
        this._buildVictoryContent();
        return;
      }
      showLine(idx);
    };

    const tapZone = this.add.zone(W / 2, boxY + boxH / 2, W, boxH)
      .setInteractive({ useHandCursor: true });
    tapZone.on('pointerdown', advance);
  }

  _buildVictoryContent() {
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
      fontFamily: 'Nunito, Georgia, serif',
      fontSize: isFinal ? '42px' : '36px',
      fontStyle: 'bold',
      color: '#f8d030',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    // Chapter name
    this.add.text(W / 2, 128, chap.title, {
      fontSize: '20px', color: '#88ccff',
      fontFamily: 'Nunito, Courier New, monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Hero emojis
    const heroRow = ['🐶','🐕','🦮','🐩','🐾','🐕‍🦺','🐺','🦊'];
    heroRow.forEach((e, i) => {
      const x = W/2 - (heroRow.length/2)*30 + i*30 + 15;
      const t = this.add.text(x, 170, e, { fontSize: '28px' }).setOrigin(0.5);
      this.tweens.add({ targets:t, y:160, duration:400+i*50, yoyo:true, repeat:-1 });
    });

    // Level up summary
    let yOff = 222;
    if (this.levelUps.length > 0) {
      this.add.text(W/2, yOff, '⬆ Level Ups:', {
        fontSize:'16px', color:'#ffcc44',
        fontFamily:'Nunito, Courier New, monospace',
        fontStyle:'bold',
        stroke:'#000000', strokeThickness:2,
      }).setOrigin(0.5);
      yOff += 26;
      this.levelUps.slice(0, 5).forEach(lu => {
        this.add.text(W/2, yOff, `${lu.emoji} ${lu.name}: Lv ${lu.newLevel}`, {
          fontSize:'15px', color:'#ccdeff',
          fontFamily:'Nunito, Courier New, monospace',
          fontStyle:'bold',
        }).setOrigin(0.5);
        yOff += 22;
      });
      yOff += 10;
    }

    // New recruits
    if (this.newUnits.length > 0) {
      this.add.text(W/2, yOff, '🐾 New Allies:', {
        fontSize:'16px', color:'#44ff88',
        fontFamily:'Nunito, Courier New, monospace',
        fontStyle:'bold',
        stroke:'#000000', strokeThickness:2,
      }).setOrigin(0.5);
      yOff += 26;
      this.newUnits.forEach(u => {
        this.add.text(W/2, yOff, `${u.emoji}  ${u.name}  joined!`, {
          fontSize:'15px', color:'#ccffcc',
          fontFamily:'Nunito, Courier New, monospace',
          fontStyle:'bold',
        }).setOrigin(0.5);
        yOff += 22;
      });
      yOff += 10;
    }

    // Buttons
    if (!isFinal) {
      this._btn(W/2, H - 140, '⚔  NEXT CHAPTER', 0x1a4422, 0x33bb55, () => {
        this.scene.start('CutsceneScene', {
          currentChap: this.chapter,
          chapter:     this.chapter + 1,
          saveData:    this.saveData,
        });
      });
    } else {
      this.add.text(W/2, H - 180, 'ALL 7 CHAPTERS COMPLETE!\nBarkville is saved forever!', {
        fontSize:'18px', color:'#f8d030',
        fontFamily:'Nunito, Georgia, serif',
        fontStyle:'bold',
        align:'center',
        stroke:'#000000', strokeThickness:3,
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
      fontFamily:'Nunito, Georgia, serif', fontSize:'46px',
      fontStyle:'bold',
      color:'#dd3333', stroke:'#000000', strokeThickness:5,
    }).setOrigin(0.5);

    this.add.text(W/2, 190, 'The cats overwhelmed your force...', {
      fontSize:'16px', color:'#99aabb',
      fontFamily:'Nunito, Courier New, monospace',
      fontStyle:'bold',
      stroke:'#000000', strokeThickness:2,
    }).setOrigin(0.5);

    this.add.text(W/2, 234, '😿🐱🐈😿', { fontSize:'44px' }).setOrigin(0.5);

    this.add.text(W/2, 306, 'Your brave dogs fought with honor.\nTry again and reclaim Barkville!', {
      fontSize:'15px', color:'#8899aa',
      fontFamily:'Nunito, Courier New, monospace',
      fontStyle:'bold',
      align:'center',
      stroke:'#000000', strokeThickness:2,
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
      fontSize:'19px', color:'#ffffff',
      fontFamily:'Nunito, Courier New, monospace', fontStyle:'bold',
      stroke:'#000000', strokeThickness:2,
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y, W_btn, H_btn).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      this.tweens.add({ targets:[bg,txt], scaleX:0.95, scaleY:0.95, duration:80, yoyo:true });
      setTimeout(cb, 120);
    });
  }
}
