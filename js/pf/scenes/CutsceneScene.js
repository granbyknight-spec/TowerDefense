'use strict';
// =============================================================================
// Puppy Force — CutsceneScene.js
// Animated inter-chapter cutscene with moving emoji characters
// =============================================================================

class CutsceneScene extends Phaser.Scene {
  constructor() { super({ key: 'CutsceneScene' }); }

  init(data) {
    this.nextChapter = data.chapter;        // chapter to load after cutscene
    this.currentChap = data.currentChap;    // chapter that was just won
    this.saveData    = data.saveData;
    this.hasSkipped  = false;
  }

  create() {
    const W = GAME_W, H = GAME_H;

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
  _beatEnter(beat, W, H) {
    const isVillain = beat.villain || false;
    const centerY   = H * 0.42;

    // Starting position (offscreen)
    let startX, startY, targetX, targetY;
    if (beat.side === 'top') {
      startX = W / 2;  startY = -120;
      targetX = W / 2; targetY = centerY - 40;
    } else if (beat.side === 'left') {
      startX = -100;   startY = centerY;
      targetX = W * 0.28; targetY = centerY;
    } else {
      startX = W + 100; startY = centerY;
      targetX = W * 0.72; targetY = centerY;
    }

    const fontSize = isVillain ? '96px' : '80px';
    const emoji = this.add.text(startX, startY, beat.portrait, { fontSize }).setOrigin(0.5).setDepth(5);

    // Slide / drop in
    const ease = beat.side === 'top' ? 'Bounce.out' : 'Power2.out';
    this.tweens.add({ targets: emoji, x: targetX, y: targetY, duration: 700, ease });

    // Bounce idle animation
    this.tweens.add({
      targets: emoji,
      y: targetY - (isVillain ? 14 : 8),
      duration: isVillain ? 500 : 700,
      yoyo: true, repeat: -1,
      ease: 'Sine.inOut',
      delay: 750,
    });

    // Speaker name label
    const nameLabel = this.add.text(targetX, targetY + (fontSize === '96px' ? 58 : 48), beat.speaker, {
      fontSize: '13px', color: isVillain ? '#ff8888' : '#f8d030',
      fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0).setDepth(5);
    this.tweens.add({ targets: nameLabel, alpha: 1, duration: 300, delay: 700 });

    // Speech bubble
    const bubbleY = isVillain ? targetY + 90 : (beat.side === 'left' ? targetY - 80 : targetY - 80);
    const bubbleX = isVillain ? W / 2 : (beat.side === 'left' ? W * 0.62 : W * 0.38);
    const bubble  = this._makeSpeechBubble(bubbleX, bubbleY, beat.text, W - 80, isVillain);

    // Typewriter text
    const textObj = bubble.getData('textObj');
    if (textObj) {
      const full = beat.text;
      textObj.setText('');
      let ci = 0;
      const tw = this.time.addEvent({
        delay: 30, repeat: full.length - 1,
        callback: () => { textObj.setText(full.slice(0, ++ci)); },
      });
      bubble.setData('timer', tw);
    }

    // Fade everything out before next beat
    this.time.delayedCall(beat.hold, () => {
      this.tweens.add({
        targets: [emoji, nameLabel, bubble],
        alpha: 0, duration: 400,
        onComplete: () => { emoji.destroy(); nameLabel.destroy(); bubble.destroy(); },
      });
    });
  }

  _makeSpeechBubble(cx, cy, text, maxW, isVillain) {
    const bubbleW = Math.min(maxW, 280), bubbleH = 72;
    const container = this.add.container(cx, cy).setDepth(6).setAlpha(0);

    const bg = this.add.graphics();
    const fillCol  = isVillain ? 0x2a0808 : 0x0a1a2e;
    const rimCol   = isVillain ? 0xcc4444 : 0x4488cc;
    bg.fillStyle(fillCol, 0.92);
    bg.fillRoundedRect(-bubbleW / 2, -bubbleH / 2, bubbleW, bubbleH, 8);
    bg.lineStyle(1.5, rimCol, 0.8);
    bg.strokeRoundedRect(-bubbleW / 2, -bubbleH / 2, bubbleW, bubbleH, 8);

    const textObj = this.add.text(0, 0, '', {
      fontSize: '13px',
      color: isVillain ? '#ffcccc' : '#ddeeff',
      fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
      wordWrap: { width: bubbleW - 20 },
      align: 'center',
    }).setOrigin(0.5);

    container.add([bg, textObj]);
    container.setData('textObj', textObj);

    this.tweens.add({ targets: container, alpha: 1, duration: 300, delay: 600 });
    return container;
  }

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
        this.scene.start('BattleScene', {
          chapter:  this.nextChapter,
          saveData: this.saveData,
        });
      },
    });
  }
}
