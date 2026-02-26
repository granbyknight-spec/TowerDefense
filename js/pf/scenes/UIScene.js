'use strict';
// =============================================================================
// Puppy Force — UIScene.js
// HUD overlay: runs simultaneously with BattleScene
// Shows: floating unit info panel (top-right), thin action bar (bottom),
//        turn banner, dialogue box
// =============================================================================

class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene' }); }

  init(data) {
    this._battle = data.battleScene;
  }

  reset(battleScene) {
    this._battle = battleScene;
    this._rebuildUI();
  }

  // --------------------------------------------------------------------------
  preload() {
    // Audio (graceful — files are optional and may not exist yet)
    AudioManager.preloadSFX(this);
    // Character portraits (graceful — files may not exist yet)
    const portraits = [
      'PUPPY_KNIGHT', 'CORGI_HEALER', 'LABRADOR_SCOUT', 'POODLE_MAGE',
      'HUSKY_RIDER', 'BEAGLE_ARCHER', 'BULLDOG_TANK', 'TERRIER_THIEF', 'DOG_PALADIN',
    ];
    portraits.forEach(id => {
      this.load.image(`portrait_${id}`, `assets/characters/${id}_portrait.png`);
    });
  }

  // --------------------------------------------------------------------------
  create() {
    this._buildPanel();
    this._buildActionMenu();
    this._buildTurnBanner();
    this._buildDialogueBox();
    this._buildEndTurnBtn();
    this._buildMuteBtn();
    this._buildDangerBtn();
    this._buildMessage();
    this._buildDamagePreview();
    // Initialize display
    this.clearUnitInfo();
    this.hideActionMenu();
  }

  _rebuildUI() {
    // Already created, just update references
  }

  // ==========================================================================
  // FLOATING UNIT INFO PANEL  (top-right, overlays map)
  // ==========================================================================
  // Layout constants for the floating panel
  // Panel origin: x=264, y=8, w=210, h=110
  // All element positions are absolute (not relative to a container) so that
  // the Graphics bg can be redrawn independently.

  _buildPanel() {
    const FP = this._FP = {
      x: 264, y: 8, w: 210, h: 138,
    };

    // Semi-transparent dark background + gold border — redrawn in showUnitInfo
    this._fpBg = this.add.graphics().setVisible(false);

    // Portrait image
    this._portraitImg = this.add.image(FP.x + 6, FP.y + 6, '__DEFAULT')
      .setDisplaySize(40, 40)
      .setOrigin(0, 0)
      .setVisible(false);

    // Emoji fallback (when no portrait PNG)
    this._unitEmojiTxt = this.add.text(FP.x + 6 + 20, FP.y + 6 + 18, '', {
      fontSize: '26px',
    }).setOrigin(0.5, 0.5).setVisible(false);

    // Unit name  (right of portrait)
    this._unitNameTxt = this.add.text(FP.x + 52, FP.y + 6, '', {
      fontSize: '14px', color: '#ffffff',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 0).setVisible(false);

    // Class • Lv N
    this._unitClassTxt = this.add.text(FP.x + 52, FP.y + 22, '', {
      fontSize: '11px', color: '#aabbcc',
      fontFamily: 'Nunito, Arial, sans-serif',
    }).setOrigin(0, 0).setVisible(false);

    // Stats row  (ATK / DEF / MOV / AGI — small, below portrait)
    this._unitStatsTxt = this.add.text(FP.x + 52, FP.y + 34, '', {
      fontSize: '10px', color: '#ccddf0',
      fontFamily: 'Nunito, Arial, sans-serif',
    }).setOrigin(0, 0).setVisible(false);

    // Hidden second stats row (kept for API compatibility)
    this._unitStats2Txt = this.add.text(0, 0, '', {
      fontSize: '10px', color: '#ccddf0',
      fontFamily: 'Nunito, Arial, sans-serif',
    }).setOrigin(0, 0).setVisible(false);

    // HP label
    this._hpLabel = this.add.text(FP.x + 6, FP.y + 60, 'HP', {
      fontSize: '12px', color: '#88ff88',
      fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setVisible(false);

    // HP bars (bg / fg drawn in showUnitInfo)
    this._hpBarBg = this.add.graphics().setVisible(false);
    this._hpBarFg = this.add.graphics().setVisible(false);

    // HP fraction  (right-aligned at x=FP.x+FP.w-6)
    this._unitHpTxt = this.add.text(FP.x + FP.w - 6, FP.y + 60, '', {
      fontSize: '12px', color: '#ffffff', stroke: '#000000', strokeThickness: 2,
      fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(1, 0.5).setVisible(false);

    // MP label
    this._mpLabel = this.add.text(FP.x + 6, FP.y + 78, 'MP', {
      fontSize: '12px', color: '#88aaff',
      fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setVisible(false);

    // MP bars
    this._mpBarBg = this.add.graphics().setVisible(false);
    this._mpBarFg = this.add.graphics().setVisible(false);

    // MP fraction
    this._mpTxt = this.add.text(FP.x + FP.w - 6, FP.y + 78, '', {
      fontSize: '12px', color: '#ffffff', stroke: '#000000', strokeThickness: 2,
      fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(1, 0.5).setVisible(false);

    // EXP label
    this._expLabel = this.add.text(FP.x + 6, FP.y + 92, 'EXP', {
      fontSize: '10px', color: '#ffdd44',
      fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setVisible(false);

    // EXP bars (bg / fg drawn in showUnitInfo)
    this._expBarBg = this.add.graphics().setVisible(false);
    this._expBarFg = this.add.graphics().setVisible(false);

    // EXP fraction
    this._expTxt = this.add.text(FP.x + FP.w - 6, FP.y + 92, '', {
      fontSize: '10px', color: '#ffdd44', stroke: '#000000', strokeThickness: 2,
      fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(1, 0.5).setVisible(false);

    // Skill chips — created dynamically, tracked in array
    this._skillChips = [];

    // Skill text (hidden — kept for API compatibility / click to show skill popup)
    this._skillsTxt = this.add.text(FP.x + 6, FP.y + 106, '', {
      fontSize: '10px', color: '#99aacc',
      fontFamily: 'Nunito, Arial, sans-serif',
    }).setOrigin(0, 0).setVisible(false);
    this._skillsTxt.setInteractive({ useHandCursor: true });
    this._skillsTxt.on('pointerdown', () => {
      if (this._selectedUnit) this._showSkillInfo(this._selectedUnit);
    });

    // Veteran battle history line — shown inside floating panel
    this._unitVetTxt = this.add.text(FP.x + 6, FP.y + 120, '', {
      fontSize: '9px', color: '#99aabb',
      fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0, 0).setVisible(false);

    // Status effect icons
    this._statusIcon1 = this.add.text(FP.x + 110, FP.y + 56, '', {
      fontSize: '11px', fontFamily: 'Nunito, Arial, sans-serif',
    }).setOrigin(0, 0).setVisible(false);
    this._statusIcon2 = this.add.text(FP.x + 155, FP.y + 56, '', {
      fontSize: '11px', fontFamily: 'Nunito, Arial, sans-serif',
    }).setOrigin(0, 0).setVisible(false);

    // --------------------------------------------------------------------------
    // Thin action bar background  (bottom of screen, always visible)
    // --------------------------------------------------------------------------
    const ABG_Y = 682;
    const barBg = this.add.graphics();
    barBg.fillStyle(0x111122, 1);
    barBg.fillRect(0, ABG_Y, GAME_W, 38);
    // Top highlight line
    barBg.fillStyle(0x3344aa, 1);
    barBg.fillRect(0, ABG_Y, GAME_W, 1);

    // Turn indicator (bottom-left of bar)
    this._turnLabel = this.add.text(8, ABG_Y + 6, 'TURN 1', {
      fontSize: '11px', color: '#aabbcc',
      fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
    });
    this._phaseLabel = this.add.text(8, ABG_Y + 18, 'YOUR TURN', {
      fontSize: '10px', color: '#4488ff',
      fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
    });

    // M3: Objective display
    this._objectiveLabel = this.add.text(8, 52, '', {
      fontSize: '10px',
      color: '#ffcc44',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(100).setVisible(false);

    // Small terrain info panel (top-left corner, always visible as a label)
    this._terrainPanel = this.add.text(6, 8, '', {
      fontSize: '11px', color: '#ccddee',
      fontFamily: 'Nunito, Arial, sans-serif',
      backgroundColor: '#00000099',
      padding: { x: 5, y: 3 },
    }).setOrigin(0, 0).setVisible(true);
  }

  // ==========================================================================
  // TERRAIN INFO PANEL
  // ==========================================================================

  /** Called internally or by BattleScene to update the terrain panel. */
  showTerrainInfo(terrainId) {
    const terrain = (typeof TERRAIN !== 'undefined') ? TERRAIN[terrainId] : null;
    if (!terrain || !this._terrainPanel) return;

    const movStr = terrain.movCost >= 99 ? 'Impassable' : `MOV: ${terrain.movCost}`;
    const defStr = `DEF: +${terrain.def}`;
    this._terrainPanel.setText(`${terrain.name}\n${movStr}  ${defStr}`);
    this._terrainPanel.setVisible(true);
  }

  /** Public API for BattleScene to call — updates the terrain panel by terrain ID. */
  updateTerrainPanel(terrainId) {
    this.showTerrainInfo(terrainId);
  }

  _showSkillInfo(unit) {
    if (!unit || !unit.skills || unit.skills.length === 0) return;
    const W = GAME_W, H = GAME_H;

    // Dark overlay
    const overlay = this.add.graphics().setDepth(200);
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, W, H);
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, W, H), Phaser.Geom.Rectangle.Contains);

    // Popup box
    const popW = W - 32, popH = Math.min(unit.skills.length * 90 + 80, H - 80);
    const popX = 16, popY = (H - popH) / 2;
    const popBg = this.add.graphics().setDepth(201);
    popBg.fillStyle(0x0a1a2e, 0.97);
    popBg.fillRoundedRect(popX, popY, popW, popH, 10);
    popBg.lineStyle(2, 0x4488cc, 0.8);
    popBg.strokeRoundedRect(popX, popY, popW, popH, 10);

    const title = this.add.text(W / 2, popY + 16, '⚡ Skill Info', {
      fontSize: '18px', color: '#f8d030',
      fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(202);

    const skillTexts = [];
    unit.skills.forEach((skillId, idx) => {
      const sk = SKILLS[skillId];
      if (!sk) return;
      const sy = popY + 48 + idx * 90;
      const powerStr = sk.power ? `${Math.round(Math.abs(sk.power) * 100)}% ${sk.type === 'magic' ? 'Mag' : 'ATK'}` : '';
      const rangeStr = sk.range ? `Range: ${sk.range}` : '';
      const mpStr   = sk.mpCost ? `MP: ${sk.mpCost}` : 'No MP cost';
      const statsLine = [powerStr, rangeStr, mpStr].filter(Boolean).join('  •  ');

      const nameT = this.add.text(popX + 16, sy, `${sk.name}`, {
        fontSize: '16px', color: '#88ccff',
        fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
      }).setDepth(202);
      const statsT = this.add.text(popX + 16, sy + 22, statsLine, {
        fontSize: '13px', color: '#aabbcc',
        fontFamily: 'Nunito, Arial, sans-serif',
      }).setDepth(202);
      const descT = this.add.text(popX + 16, sy + 44, sk.description || '', {
        fontSize: '13px', color: '#ddeeff',
        fontFamily: 'Nunito, Arial, sans-serif',
        wordWrap: { width: popW - 32 },
      }).setDepth(202);
      skillTexts.push(nameT, statsT, descT);
    });

    const closeHint = this.add.text(W / 2, popY + popH - 18, '▶ Tap to close', {
      fontSize: '12px', color: '#aabbcc',
      fontFamily: 'Nunito, Arial, sans-serif',
    }).setOrigin(0.5, 0.5).setDepth(202);
    this.tweens.add({ targets: closeHint, alpha: { from: 0.4, to: 1 }, duration: 500, yoyo: true, repeat: -1 });

    const destroy = () => {
      overlay.destroy(); popBg.destroy(); title.destroy(); closeHint.destroy();
      skillTexts.forEach(t => t.destroy());
    };
    overlay.once('pointerdown', destroy);
  }

  // ==========================================================================
  // ACTION BUTTON BAR  (thin bar at bottom: y=682, h=38)
  // ==========================================================================

  _buildActionMenu() {
    this._actionMenu = this.add.container(0, 0).setVisible(false);

    const W = GAME_W;
    const BAR_Y = 682;
    const BAR_H = 38;
    const btnW = W / 5;          //  96 px each (480/5)
    const btnH = BAR_H;          // full bar height
    const btnY = BAR_Y;

    const btnData = [
      { key: 'atk',  label: 'Attack', color: 0x223355, hi: 0x335588 },
      { key: 'mag',  label: 'Skill',  color: 0x223355, hi: 0x335588 },
      { key: 'item', label: 'Item',   color: 0x223355, hi: 0x335588 },
      { key: 'wait', label: 'Wait',   color: 0x223355, hi: 0x335588 },
      { key: 'undo', label: '↩ Undo', color: 0x336688, hi: 0x4488aa },
    ];

    this._actionBtns = {};
    btnData.forEach((b, i) => {
      const x = i * btnW;

      const bg = this.add.graphics();
      // Draw normal state
      const drawNormal = () => {
        bg.clear();
        bg.fillStyle(b.color, 1);
        bg.fillRect(x, btnY, btnW - 1, btnH); // 1px gap between buttons
        // subtle top-highlight
        bg.fillStyle(0x4455aa, 1);
        bg.fillRect(x, btnY, btnW - 1, 1);
      };
      const drawHover = () => {
        bg.clear();
        bg.fillStyle(b.hi, 1);
        bg.fillRect(x, btnY, btnW - 1, btnH);
        bg.fillStyle(0x6677cc, 1);
        bg.fillRect(x, btnY, btnW - 1, 1);
      };
      drawNormal();

      const txt = this.add.text(x + btnW / 2, btnY + btnH / 2, b.label, {
        fontSize: '18px', color: '#aabbff',
        fontFamily: 'Nunito, Arial, sans-serif',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000022',
        strokeThickness: 2,
      }).setOrigin(0.5);

      const zone = this.add.zone(x + btnW / 2, btnY + btnH / 2, btnW - 1, btnH)
        .setInteractive({ useHandCursor: true });

      zone.on('pointerover',  () => drawHover());
      zone.on('pointerout',   () => drawNormal());
      zone.on('pointerdown', () => {
        AudioManager.play(this, 'cursor_move');
        this.tweens.add({ targets: txt, scaleX: 0.9, scaleY: 0.9, duration: 80, yoyo: true });
        this._onActionBtn(b.key);
      });

      this._actionMenu.add([bg, txt, zone]);
      this._actionBtns[b.key] = { bg, txt, zone, bData: b, x, y: btnY, w: btnW, h: btnH, drawNormal, drawHover };
    });
  }

  _onActionBtn(key) {
    const bs = this._battle;
    if (!bs) return;
    switch (key) {
      case 'atk':  bs.onActionAttack(); break;
      case 'mag':  bs.onActionMagic();  break;
      case 'item': {
        const unit = this._selectedUnit;
        if (unit && unit.items.length > 1) {
          this.showItemMenu(unit, bs);
        } else {
          bs.onActionItem();
        }
        break;
      }
      case 'wait': bs.onActionWait();   break;
      case 'undo': bs.onActionCancel?.();  break;
    }
    // Menu visibility is managed entirely by BattleScene action methods —
    // do NOT auto-hide here, so a failed action (e.g. no targets) keeps the
    // menu open and the player isn't left with no way to act.
  }

  // ==========================================================================
  // END TURN BUTTON  — sits right of action bar at bottom
  // ==========================================================================

  _buildEndTurnBtn() {
    const BAR_Y = 682;
    const BAR_H = 38;
    // Overlay the rightmost button slot (Wait) isn't ideal; place END TURN
    // as a compact button just above the bar, top-right corner
    const w = 66, h = 30;
    const x = GAME_W - w - 4, y = BAR_Y - h - 4;

    const bg = this.add.graphics();
    bg.fillStyle(0x113344, 1);
    bg.fillRoundedRect(x, y, w, h, 6);
    bg.lineStyle(1, 0x2266aa, 0.9);
    bg.strokeRoundedRect(x, y, w, h, 6);

    const txt = this.add.text(x + w / 2, y + h / 2, 'END\nTURN', {
      fontSize: '12px', color: '#aaddff',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#001133',
      strokeThickness: 2,
    }).setOrigin(0.5);

    const zone = this.add.zone(x + w / 2, y + h / 2, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x3377cc, 1);
      bg.fillRoundedRect(x, y, w, h, 6);
      bg.lineStyle(1, 0x66aaff, 0.9);
      bg.strokeRoundedRect(x, y, w, h, 6);
    });
    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x113344, 1);
      bg.fillRoundedRect(x, y, w, h, 6);
      bg.lineStyle(1, 0x2266aa, 0.9);
      bg.strokeRoundedRect(x, y, w, h, 6);
    });
    zone.on('pointerdown', () => {
      AudioManager.play(this, 'cursor_move');
      this.tweens.add({ targets: [bg, txt], scaleX: 0.9, scaleY: 0.9, duration: 80, yoyo: true });
      this._battle?.onEndTurn();
    });

    this._endTurnBtn = { bg, txt, zone };
  }

  // ==========================================================================
  // MUTE TOGGLE BUTTON — compact, top-right above bar
  // ==========================================================================

  _buildMuteBtn() {
    const BAR_Y = 682;
    const BAR_H = 38;
    const w = 30, h = 30;
    // Sit just left of the END TURN button
    const endX = GAME_W - 66 - 4;
    const x = endX - w - 4;
    const y = BAR_Y - h - 4;

    const bg = this.add.graphics();
    bg.fillStyle(0x113344, 1);
    bg.fillRoundedRect(x, y, w, h, 6);
    bg.lineStyle(1, 0x2266aa, 0.9);
    bg.strokeRoundedRect(x, y, w, h, 6);

    const isMuted = () => {
      const bs = this.scene.get('BattleScene');
      return bs ? bs.sound.mute : false;
    };

    const txt = this.add.text(x + w / 2, y + h / 2, isMuted() ? '🔇' : '🔊', {
      fontSize: '16px',
    }).setOrigin(0.5);

    const zone = this.add.zone(x + w / 2, y + h / 2, w, h)
      .setInteractive({ useHandCursor: true });

    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x2255aa, 1);
      bg.fillRoundedRect(x, y, w, h, 6);
    });
    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x113344, 1);
      bg.fillRoundedRect(x, y, w, h, 6);
      bg.lineStyle(1, 0x2266aa, 0.9);
      bg.strokeRoundedRect(x, y, w, h, 6);
    });
    zone.on('pointerdown', () => {
      const bs = this.scene.get('BattleScene');
      if (bs) {
        bs.sound.mute = !bs.sound.mute;
        txt.setText(bs.sound.mute ? '🔇' : '🔊');
      }
      this.tweens.add({ targets: txt, scaleX: 0.85, scaleY: 0.85, duration: 80, yoyo: true });
    });

    this._muteBtn = { bg, txt, zone };
  }


  // ==========================================================================
  // DANGER ZONE TOGGLE BUTTON — compact, left of mute button
  // ==========================================================================

  _buildDangerBtn() {
    const BAR_Y = 682;
    const BAR_H = 38;
    const w = 52, h = 30;
    // Sit just left of the MUTE button
    const muteX = GAME_W - 66 - 4 - 30 - 4; // 376
    const x = muteX - w - 4;                  // 320
    const y = BAR_Y - h - 4;                  // 648

    this._dangerOn = false;

    const bg = this.add.graphics();
    const drawBg = (on) => {
      bg.clear();
      bg.fillStyle(on ? 0x661111 : 0x113344, 1);
      bg.fillRoundedRect(x, y, w, h, 6);
      bg.lineStyle(1, on ? 0xff4444 : 0x2266aa, 0.9);
      bg.strokeRoundedRect(x, y, w, h, 6);
    };
    drawBg(false);

    const txt = this.add.text(x + w / 2, y + h / 2, '⚠ DANGER', {
      fontSize: '10px', color: '#ff8888',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    const zone = this.add.zone(x + w / 2, y + h / 2, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(this._dangerOn ? 0x881111 : 0x1a3a55, 1);
      bg.fillRoundedRect(x, y, w, h, 6);
      bg.lineStyle(1, this._dangerOn ? 0xff6666 : 0x3388cc, 0.9);
      bg.strokeRoundedRect(x, y, w, h, 6);
    });
    zone.on('pointerout', () => {
      drawBg(this._dangerOn);
    });
    zone.on('pointerdown', () => {
      this._dangerOn = !this._dangerOn;
      drawBg(this._dangerOn);
      txt.setColor(this._dangerOn ? '#ffaaaa' : '#ff8888');
      this.tweens.add({ targets: txt, scaleX: 0.9, scaleY: 0.9, duration: 80, yoyo: true });
      const bs = this.scene.get('BattleScene');
      if (bs && typeof bs.toggleDangerZone === 'function') bs.toggleDangerZone();
    });

    this._dangerBtn = { bg, txt, zone };
  }

  // ==========================================================================
  // TURN BANNER
  // ==========================================================================

  _buildTurnBanner() {
    const W = GAME_W;
    this._bannerBg = this.add.graphics().setVisible(false);
    this._bannerTxt = this.add.text(W / 2, GAME_H / 2 - 30, '', {
      fontFamily: 'Nunito, Georgia, serif',
      fontSize: '38px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setVisible(false);
  }

  showTurnBanner(text, color) {
    const W = GAME_W;
    this._bannerBg.setVisible(true);
    this._bannerTxt.setVisible(true);
    this._bannerBg.clear();
    this._bannerBg.fillStyle(0x000000, 0.6);
    this._bannerBg.fillRect(0, GAME_H / 2 - 60, W, 80);
    this._bannerBg.lineStyle(2, color, 0.8);
    this._bannerBg.lineBetween(0, GAME_H / 2 - 60, W, GAME_H / 2 - 60);
    this._bannerBg.lineBetween(0, GAME_H / 2 + 20, W, GAME_H / 2 + 20);

    this._bannerTxt.setText(text);
    this._bannerTxt.setStyle({ color: '#' + color.toString(16).padStart(6, '0') });

    this._bannerBg.setAlpha(1);
    this._bannerTxt.setAlpha(1);

    this.tweens.add({
      targets: [this._bannerBg, this._bannerTxt],
      alpha: 0,
      duration: 600,
      delay: 900,
      onComplete: () => {
        this._bannerBg.setVisible(false);
        this._bannerTxt.setVisible(false);
      },
    });

    // Update turn / phase labels in the bottom bar
    const bn = this._battle;
    if (bn) {
      this._turnLabel?.setText(`TURN ${bn.turnNumber}`);
      this._phaseLabel?.setText(bn.playerTurn ? 'YOUR TURN' : 'ENEMY TURN');
      this._phaseLabel?.setStyle({ color: bn.playerTurn ? '#4488ff' : '#ff4444' });
    }

    // M3: Objective banner
    if (bn && this._objectiveLabel) {
      const chapter = typeof CHAPTERS !== 'undefined' ? CHAPTERS[bn.chapterId - 1] : null;
      if (chapter?.preObjective === 'survive_turns' && bn.turnNumber <= chapter.surviveTurns) {
        const remaining = chapter.surviveTurns - bn.turnNumber + 1;
        const txt = `Survive ${remaining} more turn${remaining !== 1 ? 's' : ''}!`;
        const col = remaining <= 2 ? '#ff6644' : '#ffcc44';
        this._objectiveLabel.setText(txt).setStyle({ color: col }).setVisible(true);
      } else if (chapter?.objective === 'defeat_boss' || chapter?.bossId) {
        const bossName = (chapter.bossId || '').replace(/_/g, ' ');
        this._objectiveLabel.setText(`Objective: Defeat ${bossName || 'the boss'}`).setStyle({ color: '#ffcc44' }).setVisible(true);
      } else {
        this._objectiveLabel.setVisible(false);
      }
    }
  }

  // ==========================================================================
  // UNIT INFO  — populates the floating top-right panel
  // ==========================================================================

  showUnitInfo(unit) {
    if (!unit) { this.clearUnitInfo(); return; }

    const FP = this._FP;

    // Draw / redraw the floating panel background
    this._fpBg.clear();
    this._fpBg.fillStyle(0x000000, 0.75);
    this._fpBg.fillRoundedRect(FP.x, FP.y, FP.w, FP.h, 6);
    this._fpBg.lineStyle(2, 0xf8d030, 1);
    this._fpBg.strokeRoundedRect(FP.x, FP.y, FP.w, FP.h, 6);
    this._fpBg.setVisible(true);

    // Portrait — 40x40 at top-left of panel
    const portraitKey = `portrait_${unit.id}`;
    if (this._portraitImg && this.textures.exists(portraitKey)) {
      this._portraitImg
        .setTexture(portraitKey)
        .setDisplaySize(40, 40)
        .setPosition(FP.x + 6, FP.y + 6)
        .setVisible(true);
      this._unitEmojiTxt?.setVisible(false);
    } else {
      this._portraitImg?.setVisible(false);
      this._unitEmojiTxt
        ?.setPosition(FP.x + 6 + 20, FP.y + 6 + 20)
        .setText(unit.emoji)
        .setVisible(true);
    }

    // Unit name
    const promoted = unit.promoted ? '★' : '';
    const nameColor = unit.team === 'player' ? '#f8d030' : '#ff8888';
    this._unitNameTxt
      ?.setText(`${unit.name}${promoted}`)
      .setStyle({ color: nameColor })
      .setPosition(FP.x + 52, FP.y + 6)
      .setVisible(true);

    // Class + level
    this._unitClassTxt
      ?.setText(`${unit.unitClass}  •  Lv ${unit.level}`)
      .setPosition(FP.x + 52, FP.y + 22)
      .setVisible(true);

    // Stats row
    this._unitStatsTxt
      ?.setText(`ATK:${unit.atk}  DEF:${unit.def}  MOV:${unit.mov}  AGI:${unit.agi}`)
      .setPosition(FP.x + 52, FP.y + 34)
      .setVisible(true);
    this._unitStats2Txt?.setText('').setVisible(false);

    // HP  -----------------------------------------------------------------
    const hpRatio  = Math.max(0, unit.hp / unit.maxHp);
    const hpColor  = hpRatio > 0.5 ? '#44cc66' : hpRatio > 0.25 ? '#ffcc00' : '#ff4444';
    const hpColor2 = hpRatio > 0.5 ? 0x38c864  : hpRatio > 0.25 ? 0xf8d030  : 0xc83030;
    const barX = FP.x + 25;   // after "HP" label
    const barW = FP.w - 31;   // leaves room for fraction on right
    const hpBarY = FP.y + 54;

    this._hpLabel?.setPosition(FP.x + 6, FP.y + 60).setVisible(true);

    this._hpBarBg?.clear();
    this._hpBarBg?.fillStyle(0x333333, 1);
    this._hpBarBg?.fillRoundedRect(barX, hpBarY, barW, 12, 4);
    this._hpBarBg?.setVisible(true);

    this._hpBarFg?.clear();
    this._hpBarFg?.fillStyle(hpColor2, 1);
    this._hpBarFg?.fillRoundedRect(barX, hpBarY, Math.max(4, barW * hpRatio), 12, 4);
    this._hpBarFg?.setVisible(true);

    this._unitHpTxt
      ?.setText(`${unit.hp}/${unit.maxHp}`)
      .setStyle({ color: '#ffffff', stroke: '#000000', strokeThickness: 2, fontSize: '12px', fontStyle: 'bold' })
      .setPosition(FP.x + FP.w - 6, FP.y + 60)
      .setVisible(true);

    // MP  -----------------------------------------------------------------
    const mpBarY  = FP.y + 72;
    const mpRatio = (unit.maxMp > 0) ? Math.max(0, unit.mp / unit.maxMp) : 0;

    this._mpBarBg?.clear();
    this._mpBarFg?.clear();

    if (unit.maxMp > 0) {
      this._mpLabel?.setPosition(FP.x + 6, FP.y + 78).setVisible(true);

      this._mpBarBg?.fillStyle(0x333333, 1);
      this._mpBarBg?.fillRoundedRect(barX, mpBarY, barW, 12, 4);
      this._mpBarBg?.setVisible(true);

      this._mpBarFg?.fillStyle(0x4466ff, 1);
      this._mpBarFg?.fillRoundedRect(barX, mpBarY, Math.max(2, barW * mpRatio), 12, 4);
      this._mpBarFg?.setVisible(true);

      this._mpTxt
        ?.setText(`${unit.mp}/${unit.maxMp}`)
        .setPosition(FP.x + FP.w - 6, FP.y + 78)
        .setVisible(true);
    } else {
      this._mpLabel?.setVisible(false);
      this._mpBarBg?.setVisible(false);
      this._mpBarFg?.setVisible(false);
      this._mpTxt?.setVisible(false);
    }

    // EXP  -----------------------------------------------------------------
    const expBarY = FP.y + 86;
    const expVal  = unit.team === 'player' ? (unit.exp || 0) : -1;

    this._expBarBg?.clear();
    this._expBarFg?.clear();

    if (expVal >= 0) {
      const expRatio = Math.min(1, expVal / 100);
      this._expLabel?.setPosition(FP.x + 6, FP.y + 92).setVisible(true);
      this._expBarBg?.fillStyle(0x333333, 1);
      this._expBarBg?.fillRoundedRect(barX, expBarY, barW, 8, 3);
      this._expBarBg?.setVisible(true);
      this._expBarFg?.fillStyle(0xddcc00, 1);
      this._expBarFg?.fillRoundedRect(barX, expBarY, Math.max(2, barW * expRatio), 8, 3);
      this._expBarFg?.setVisible(true);
      this._expTxt?.setText(`${expVal}/100`).setPosition(FP.x + FP.w - 6, FP.y + 92).setVisible(true);
    } else {
      this._expLabel?.setVisible(false);
      this._expBarBg?.setVisible(false);
      this._expBarFg?.setVisible(false);
      this._expTxt?.setVisible(false);
    }

    // Status effect icons  ------------------------------------------------
    const icons = [];
    if (unit.guardActive)  icons.push({ icon: '🛡', label: ' Guard', color: '#88aaff' });
    if (unit.burnStacks > 0) icons.push({ icon: '🔥', label: ` ×${unit.burnStacks}`, color: '#ff8844' });

    [this._statusIcon1, this._statusIcon2].forEach((txt, i) => {
      if (!txt) return;
      if (icons[i]) {
        txt.setText(icons[i].icon + icons[i].label)
          .setColor(icons[i].color)
          .setVisible(true);
      } else {
        txt.setVisible(false);
      }
    });

    // Veteran history
    const battles = unit.battlesParticipated || 0;
    const kills   = unit.killCount || 0;
    const vetStr  = battles > 0 ? `⚔ ${kills} KO · ${battles} battles` : '';
    const vetColor = kills >= 10 ? '#ffd700' : kills >= 5 ? '#ff9944' : '#aabbcc';
    this._unitVetTxt
      ?.setText(vetStr)
      .setStyle({ color: vetColor })
      .setPosition(FP.x + 6, FP.y + 120)
      .setVisible(true);

    // Skill chips  --------------------------------------------------------
    this._skillsTxt?.setVisible(false);
    this._drawSkillChips(unit);

    // Update turn label
    if (this._battle) {
      this._turnLabel?.setText(`TURN ${this._battle.turnNumber}`);
    }
  }

  clearUnitInfo() {
    // Hide all floating panel elements
    this._fpBg?.setVisible(false);
    this._portraitImg?.setVisible(false);
    this._unitEmojiTxt?.setVisible(false);
    this._unitNameTxt?.setVisible(false);
    this._unitClassTxt?.setVisible(false);
    this._unitStatsTxt?.setVisible(false);
    this._unitStats2Txt?.setVisible(false);
    this._hpLabel?.setVisible(false);
    this._hpBarBg?.clear().setVisible(false);
    this._hpBarFg?.clear().setVisible(false);
    this._unitHpTxt?.setVisible(false);
    this._mpLabel?.setVisible(false);
    this._mpBarBg?.clear().setVisible(false);
    this._mpBarFg?.clear().setVisible(false);
    this._mpTxt?.setVisible(false);
    this._expLabel?.setVisible(false);
    this._expBarBg?.clear().setVisible(false);
    this._expBarFg?.clear().setVisible(false);
    this._expTxt?.setVisible(false);
    this._statusIcon1?.setVisible(false);
    this._statusIcon2?.setVisible(false);
    this._unitVetTxt?.setVisible(false);
    this._skillsTxt?.setVisible(false);
    this._clearSkillChips();
  }

  // ==========================================================================
  // SKILL CHIPS HELPERS
  // ==========================================================================

  _clearSkillChips() {
    (this._skillChips || []).forEach(({ bg, txt }) => { bg?.destroy(); txt?.destroy(); });
    this._skillChips = [];
  }

  _drawSkillChips(unit) {
    this._clearSkillChips();
    if (!unit) return;

    const FP = this._FP;
    let chipX = FP.x + 6;
    const chipY = FP.y + 106;
    const chipH = 14;
    const maxRight = FP.x + FP.w - 6;

    (unit.skills || []).forEach(skillId => {
      const sk = SKILLS[skillId];
      const label = sk?.name || skillId;
      const chipW = Math.min(label.length * 6 + 10, 72);
      if (chipX + chipW > maxRight) return;

      const bg = this.add.graphics();
      bg.fillStyle(0x1a3050, 1);
      bg.fillRoundedRect(chipX, chipY, chipW, chipH, 3);
      bg.lineStyle(1, 0x4466aa, 1);
      bg.strokeRoundedRect(chipX, chipY, chipW, chipH, 3);
      const txt = this.add.text(chipX + 5, chipY + 2, label, {
        fontSize: '11px', color: '#aaccff',
        fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
      }).setOrigin(0, 0);
      this._skillChips.push({ bg, txt });
      chipX += chipW + 3;
    });

    // Item chips
    (unit.items || []).forEach(itemId => {
      const it = ITEMS?.[itemId];
      const label = it?.emoji || '📦';
      const chipW = 20;
      if (chipX + chipW > maxRight) return;
      const bg = this.add.graphics();
      bg.fillStyle(0x103010, 1);
      bg.fillRoundedRect(chipX, chipY, chipW, chipH, 3);
      bg.lineStyle(1, 0x336633, 1);
      bg.strokeRoundedRect(chipX, chipY, chipW, chipH, 3);
      const txt = this.add.text(chipX + 3, chipY + 1, label, {
        fontSize: '11px', fontFamily: 'Nunito, Arial, sans-serif',
      }).setOrigin(0, 0);
      this._skillChips.push({ bg, txt });
      chipX += chipW + 3;
    });
  }

  // ==========================================================================
  // ACTION MENU — show / hide
  // ==========================================================================

  showActionMenu(unit, battleScene) {
    this._selectedUnit = unit;
    this._battle = battleScene;
    this._actionMenu.setVisible(true);

    const canAttack = !unit.hasActed;
    const hasMagic  = canAttack && unit.skills.length > 0;
    const hasItem   = unit.items.length > 0;

    const atkBtn = this._actionBtns['atk'];
    const magBtn = this._actionBtns['mag'];
    const itmBtn = this._actionBtns['item'];

    if (atkBtn) {
      atkBtn.txt.setAlpha(canAttack ? 1 : 0.4);
      if (canAttack) atkBtn.zone.setInteractive({ useHandCursor: true });
      else atkBtn.zone.disableInteractive();
    }
    if (magBtn) {
      magBtn.txt.setAlpha(hasMagic ? 1 : 0.4);
      if (hasMagic) magBtn.zone.setInteractive({ useHandCursor: true });
      else magBtn.zone.disableInteractive();
    }
    if (itmBtn) {
      itmBtn.txt.setAlpha(hasItem ? 1 : 0.4);
      if (hasItem) itmBtn.zone.setInteractive({ useHandCursor: true });
      else itmBtn.zone.disableInteractive();
    }

    const undoBtn = this._actionBtns['undo'];
    // Show Undo only when unit has moved but hasn't committed an action yet
    const canUndo = unit.hasMoved && !unit.hasActed;
    if (undoBtn) {
      undoBtn.txt.setAlpha(canUndo ? 1 : 0.4);
      if (canUndo) undoBtn.zone.setInteractive({ useHandCursor: true });
      else undoBtn.zone.disableInteractive();
    }
  }

  hideActionMenu() {
    this._actionMenu.setVisible(false);
  }

  // ==========================================================================
  // SKILL SELECTOR SUB-MENU
  // ==========================================================================

  showSkillMenu(unit, battleScene) {
    if (!unit || !unit.skills || unit.skills.length === 0) return;
    this._selectedUnit = unit;
    this._battle = battleScene;
    this._actionMenu.setVisible(false);

    const W = GAME_W;
    const menuW = 300;
    const menuX = (W - menuW) / 2;  // centered: x=90
    const rowH  = 44;
    const headerH = 28;
    const cancelH = 32;
    const padV = 8;
    const skillCount = unit.skills.length;
    const menuH = padV + headerH + skillCount * (rowH + 4) + 4 + cancelH + padV;
    const menuY = 682 - menuH - 4;  // float above bottom bar

    const container = this.add.container(0, 0).setDepth(50);

    // Panel background with gold border
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x0a1428, 0.97);
    panelBg.fillRoundedRect(menuX, menuY, menuW, menuH, 10);
    panelBg.lineStyle(2, 0xf8d030, 1);
    panelBg.strokeRoundedRect(menuX, menuY, menuW, menuH, 10);
    // Inner accent line
    panelBg.lineStyle(1, 0x4488cc, 0.5);
    panelBg.strokeRoundedRect(menuX + 3, menuY + 3, menuW - 6, menuH - 6, 8);
    container.add(panelBg);

    // Header
    const headerTxt = this.add.text(W / 2, menuY + padV + 4, '✦  Choose Skill  ✦', {
      fontSize: '13px', color: '#f8d030',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    container.add(headerTxt);

    // Divider under header
    const divider = this.add.graphics();
    divider.lineStyle(1, 0xf8d030, 0.4);
    divider.beginPath();
    divider.moveTo(menuX + 10, menuY + padV + headerH);
    divider.lineTo(menuX + menuW - 10, menuY + padV + headerH);
    divider.strokePath();
    container.add(divider);

    const destroy = () => { container.destroy(true); };

    // Cursor text (shared, moved per hover)
    const cursorTxt = this.add.text(menuX + 8, menuY, '►', {
      fontSize: '12px', color: '#f8d030',
      fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setVisible(false);
    container.add(cursorTxt);

    unit.skills.forEach((skillId, idx) => {
      const sk = SKILLS[skillId];
      if (!sk) return;

      const canAfford = (sk.mpCost || 0) === 0 || unit.mp >= (sk.mpCost || 0);
      const rowY = menuY + padV + headerH + 4 + idx * (rowH + 4);
      const rowX = menuX + 8;
      const rowW = menuW - 16;

      const bgColor = canAfford ? 0x112244 : 0x111111;
      const borderColor = canAfford ? 0x3366aa : 0x2a2a2a;
      const textAlpha = canAfford ? 1.0 : 0.4;

      const bg = this.add.graphics();
      const drawBg = (fill, border) => {
        bg.clear();
        bg.fillStyle(fill, 1);
        bg.fillRoundedRect(rowX, rowY, rowW, rowH, 6);
        bg.lineStyle(1, border, 0.9);
        bg.strokeRoundedRect(rowX, rowY, rowW, rowH, 6);
      };
      drawBg(bgColor, borderColor);
      container.add(bg);

      // Skill icon
      const icon = sk.icon || sk.emoji || '⚡';
      const iconTxt = this.add.text(rowX + 8, rowY + rowH / 2 - 2, icon, {
        fontSize: '18px', fontFamily: 'Nunito, Arial, sans-serif',
      }).setOrigin(0, 0.5).setAlpha(textAlpha);
      container.add(iconTxt);

      // Skill name
      const nameTxt = this.add.text(rowX + 34, rowY + 8, sk.name, {
        fontSize: '13px', color: '#ffffff',
        fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
      }).setOrigin(0, 0).setAlpha(textAlpha);
      container.add(nameTxt);

      // Description sub-line
      const desc = sk.desc || sk.type || '';
      const descTxt = this.add.text(rowX + 34, rowY + 26, desc, {
        fontSize: '11px', color: '#aabbcc',
        fontFamily: 'Nunito, Arial, sans-serif',
      }).setOrigin(0, 0).setAlpha(textAlpha);
      container.add(descTxt);

      // MP cost badge (right side)
      if (sk.mpCost) {
        const badgeColor = canAfford ? 0x1144aa : 0x222222;
        const badgeTxt = `MP ${sk.mpCost}`;
        const badgeW = 38;
        const badgeX = rowX + rowW - badgeW - 4;
        const badgeY = rowY + (rowH - 16) / 2;
        const badgeBg = this.add.graphics();
        badgeBg.fillStyle(badgeColor, 1);
        badgeBg.fillRoundedRect(badgeX, badgeY, badgeW, 16, 4);
        badgeBg.lineStyle(1, canAfford ? 0x4488ff : 0x333333, 1);
        badgeBg.strokeRoundedRect(badgeX, badgeY, badgeW, 16, 4);
        container.add(badgeBg);
        const badgeLbl = this.add.text(badgeX + badgeW / 2, badgeY + 8, badgeTxt, {
          fontSize: '9px', color: canAfford ? '#88aaff' : '#887777',
          fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
        }).setOrigin(0.5).setAlpha(textAlpha);
        container.add(badgeLbl);
      }

      if (canAfford) {
        const zone = this.add.zone(rowX + rowW / 2, rowY + rowH / 2, rowW, rowH)
          .setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => {
          drawBg(0x1a4488, 0x66aaff);
          cursorTxt.setPosition(menuX + 8, rowY + rowH / 2).setVisible(true);
        });
        zone.on('pointerout', () => {
          drawBg(bgColor, borderColor);
          cursorTxt.setVisible(false);
        });
        zone.on('pointerdown', () => {
          AudioManager.play(this, 'cursor_move');
          this.tweens.add({ targets: nameTxt, scaleX: 0.9, scaleY: 0.9, duration: 80, yoyo: true });
          destroy();
          this._battle.onActionMagic(skillId);
        });
        container.add(zone);
      }
    });

    // Back button (styled as menu row)
    const cancelY = menuY + padV + headerH + 4 + skillCount * (rowH + 4) + 4;
    const cancelX = menuX + 8;
    const cancelW = menuW - 16;

    const cancelBg = this.add.graphics();
    const drawCancel = (fill) => {
      cancelBg.clear();
      cancelBg.fillStyle(fill, 1);
      cancelBg.fillRoundedRect(cancelX, cancelY, cancelW, cancelH, 6);
      cancelBg.lineStyle(1, 0x445566, 0.8);
      cancelBg.strokeRoundedRect(cancelX, cancelY, cancelW, cancelH, 6);
    };
    drawCancel(0x1a1a2e);
    container.add(cancelBg);

    const cancelTxt = this.add.text(cancelX + 12, cancelY + cancelH / 2, '◄  Back', {
      fontSize: '12px', color: '#8899aa',
      fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    container.add(cancelTxt);

    const cancelZone = this.add.zone(cancelX + cancelW / 2, cancelY + cancelH / 2, cancelW, cancelH)
      .setInteractive({ useHandCursor: true });
    cancelZone.on('pointerover', () => { drawCancel(0x2a2a3e); cancelTxt.setStyle({ color: '#aabbcc' }); });
    cancelZone.on('pointerout',  () => { drawCancel(0x1a1a2e); cancelTxt.setStyle({ color: '#8899aa' }); });
    cancelZone.on('pointerdown', () => {
      destroy();
      this.showActionMenu(unit, this._battle);
    });
    container.add(cancelZone);

    this._skillMenuContainer = container;
    container.once('destroy', () => { this._skillMenuContainer = null; });
  }

  // ==========================================================================
  // ITEM SELECTOR SUB-MENU
  // ==========================================================================

  showItemMenu(unit, battleScene) {
    if (!unit || !unit.items || unit.items.length === 0) return;
    this._selectedUnit = unit;
    this._battle = battleScene;

    // Hide the main action menu while the sub-menu is open
    this._actionMenu.setVisible(false);

    const W = GAME_W;
    const itemCount = unit.items.length;
    const btnH    = 38;
    const padTop  = 8;
    const padBot  = 6;
    const cancelH = 32;
    const menuH   = padTop + itemCount * (btnH + 4) + cancelH + padBot + 4;
    const menuY   = 682 - menuH - 4;  // sit just above the bottom action bar
    const menuX   = 8;
    const menuW   = W - 16;

    const container = this.add.container(0, 0).setDepth(50);

    // Background panel
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x0a1a2e, 0.97);
    panelBg.fillRoundedRect(menuX, menuY, menuW, menuH, 8);
    panelBg.lineStyle(2, 0x44aa44, 0.9);
    panelBg.strokeRoundedRect(menuX, menuY, menuW, menuH, 8);
    container.add(panelBg);

    const headerTxt = this.add.text(W / 2, menuY + padTop + 2, 'Choose Item', {
      fontSize: '13px', color: '#aabbcc',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    container.add(headerTxt);

    const destroy = () => { container.destroy(true); };

    // One button per item
    unit.items.forEach((itemId, idx) => {
      const it = ITEMS[itemId];
      const canUse = !!it;
      const rowY = menuY + padTop + 18 + idx * (btnH + 4);
      const rowX = menuX + 6;
      const rowW = menuW - 12;

      const colorBase = canUse ? 0x226622 : 0x1a1a1a;
      const colorHi   = canUse ? 0x44aa44 : 0x2a2a2a;
      const textAlpha = canUse ? 1.0 : 0.45;

      const bg = this.add.graphics();
      bg.fillStyle(colorBase, 1);
      bg.fillRoundedRect(rowX, rowY, rowW, btnH, 6);
      bg.lineStyle(1, colorHi, 0.8);
      bg.strokeRoundedRect(rowX, rowY, rowW, btnH, 6);
      container.add(bg);

      const label = it
        ? `${it.emoji}  ${it.name} — ${it.description}`
        : itemId;
      const nameTxt = this.add.text(rowX + 10, rowY + btnH / 2, label, {
        fontSize: '15px', color: '#ffffff',
        fontFamily: 'Nunito, Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0, 0.5).setAlpha(textAlpha);
      container.add(nameTxt);

      if (canUse) {
        const zone = this.add.zone(rowX + rowW / 2, rowY + btnH / 2, rowW, btnH)
          .setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => {
          bg.clear();
          bg.fillStyle(colorHi, 1);
          bg.fillRoundedRect(rowX, rowY, rowW, btnH, 6);
        });
        zone.on('pointerout', () => {
          bg.clear();
          bg.fillStyle(colorBase, 1);
          bg.fillRoundedRect(rowX, rowY, rowW, btnH, 6);
          bg.lineStyle(1, colorHi, 0.8);
          bg.strokeRoundedRect(rowX, rowY, rowW, btnH, 6);
        });
        zone.on('pointerdown', () => {
          AudioManager.play(this, 'cursor_move');
          this.tweens.add({ targets: nameTxt, scaleX: 0.9, scaleY: 0.9, duration: 80, yoyo: true });
          destroy();
          this._battle.onActionItem(idx);
        });
        container.add(zone);
      }
    });

    // Cancel / Back button
    const cancelY = menuY + padTop + 18 + itemCount * (btnH + 4) + 4;
    const cancelX = menuX + 6;
    const cancelW = menuW - 12;

    const cancelBg = this.add.graphics();
    cancelBg.fillStyle(0x222222, 1);
    cancelBg.fillRoundedRect(cancelX, cancelY, cancelW, cancelH, 6);
    cancelBg.lineStyle(1, 0x555555, 0.8);
    cancelBg.strokeRoundedRect(cancelX, cancelY, cancelW, cancelH, 6);
    container.add(cancelBg);

    const cancelTxt = this.add.text(W / 2, cancelY + cancelH / 2, '✕  Back', {
      fontSize: '14px', color: '#aabbcc',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(cancelTxt);

    const cancelZone = this.add.zone(W / 2, cancelY + cancelH / 2, cancelW, cancelH)
      .setInteractive({ useHandCursor: true });
    cancelZone.on('pointerover', () => {
      cancelBg.clear();
      cancelBg.fillStyle(0x444444, 1);
      cancelBg.fillRoundedRect(cancelX, cancelY, cancelW, cancelH, 6);
    });
    cancelZone.on('pointerout', () => {
      cancelBg.clear();
      cancelBg.fillStyle(0x222222, 1);
      cancelBg.fillRoundedRect(cancelX, cancelY, cancelW, cancelH, 6);
      cancelBg.lineStyle(1, 0x555555, 0.8);
      cancelBg.strokeRoundedRect(cancelX, cancelY, cancelW, cancelH, 6);
    });
    cancelZone.on('pointerdown', () => {
      destroy();
      this.showActionMenu(unit, this._battle);
    });
    container.add(cancelZone);

    this._itemMenuContainer = container;
    container.once('destroy', () => { this._itemMenuContainer = null; });
  }

  // ==========================================================================
  // MESSAGE
  // ==========================================================================

  _buildMessage() {
    const W = GAME_W;
    this._msgBg  = this.add.graphics().setVisible(false);
    this._msgTxt = this.add.text(W / 2, 682 - 22, '', {
      fontSize: '17px',
      color: '#ffffff',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setVisible(false);
  }

  showMessage(text) {
    const W = GAME_W;
    this._msgBg.clear();
    this._msgBg.fillStyle(0x000000, 0.7);
    this._msgBg.fillRoundedRect(W / 2 - 160, 682 - 36, 320, 30, 6);
    this._msgBg.setVisible(true);
    this._msgTxt.setText(text).setVisible(true);

    this.tweens.killTweensOf([this._msgBg, this._msgTxt]);
    this._msgBg.setAlpha(1);
    this._msgTxt.setAlpha(1);
    this.tweens.add({
      targets: [this._msgBg, this._msgTxt],
      alpha: 0, duration: 400, delay: 2000,
      onComplete: () => { this._msgBg.setVisible(false); this._msgTxt.setVisible(false); },
    });
  }

  // ==========================================================================
  // DAMAGE PREVIEW PANEL
  // ==========================================================================

  _buildDamagePreview() {
    const W = GAME_W;
    // Panel sits above the unit info area / action bar, centered
    // Target Y: just above the action bar (682), with padding
    const panW = 240;
    const panH = 88;
    const panX = (W - panW) / 2;  // centered: 120
    const panY = 682 - panH - 44; // sits above end-turn / mute buttons area

    this._dmgPreviewBg = this.add.graphics().setVisible(false);
    this._dmgPreviewBg.fillStyle(0x000000, 0.82);
    this._dmgPreviewBg.fillRoundedRect(panX, panY, panW, panH, 7);
    this._dmgPreviewBg.lineStyle(1, 0xff6644, 0.85);
    this._dmgPreviewBg.strokeRoundedRect(panX, panY, panW, panH, 7);

    this._dmgPreviewLine1 = this.add.text(W / 2, panY + 11, '', {
      fontSize: '13px', color: '#ffcc88',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
    }).setOrigin(0.5, 0).setVisible(false);

    this._dmgPreviewLine2 = this.add.text(W / 2, panY + 27, '', {
      fontSize: '11px', color: '#ff9977',
      fontFamily: 'Nunito, Arial, sans-serif',
      align: 'center',
    }).setOrigin(0.5, 0).setVisible(false);

    this._dmgPreviewLine3 = this.add.text(W / 2, panY + 44, '', {
      fontSize: '12px', color: '#88ccff',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
    }).setOrigin(0.5, 0).setVisible(false);

    this._dmgPreviewLine4 = this.add.text(W / 2, panY + 60, '', {
      fontSize: '11px', color: '#aaaaaa',
      fontFamily: 'Nunito, Arial, sans-serif',
      align: 'center',
    }).setOrigin(0.5, 0).setVisible(false);

    this._dmgPreviewPanX = panX;
    this._dmgPreviewPanY = panY;
    this._dmgPreviewPanW = panW;
    this._dmgPreviewPanH = panH;
  }

  showDamagePreview(attacker, defender, terrainDef, effectiveness = 1.0, options = {}) {
    const agiDiff  = attacker.agi - defender.agi;
    const hitPct   = Phaser.Math.Clamp(88 + agiDiff * 2, 55, 99);
    const critPct  = Phaser.Math.Clamp(8 + Math.max(0, agiDiff), 2, 30);
    const guardBonus = defender.guardActive ? Math.floor(defender.def * 0.5) : 0;

    // M4: Adjacency support preview
    const bn = this._battle;
    const atkSupport = bn ? Math.min(3, bn.units.filter(u =>
      !u.dead && u !== attacker && u.team === attacker.team &&
      Math.abs(u.col - attacker.col) + Math.abs(u.row - attacker.row) === 1
    ).length) : 0;
    const defSupport = bn ? Math.min(3, bn.units.filter(u =>
      !u.dead && u !== defender && u.team === defender.team &&
      Math.abs(u.col - defender.col) + Math.abs(u.row - defender.row) === 1
    ).length) : 0;

    const rawDmg = Math.max(1, (attacker.atk + atkSupport) - (defender.def + guardBonus + defSupport + (terrainDef || 0)));
    const minDmg   = rawDmg;
    const maxDmg   = rawDmg + Math.floor(attacker.atk * 0.15);
    const willDouble = agiDiff >= 7;

    // C2: Pending skill power multiplier
    const pendingSkill = this._battle?._pendingSkill;
    const skillPower = pendingSkill && typeof SKILLS !== 'undefined' ? (SKILLS[pendingSkill]?.power || 1) : 1;
    const skillHits  = pendingSkill && typeof SKILLS !== 'undefined' ? (SKILLS[pendingSkill]?.hits  || 1) : 1;
    const adjMin = Math.max(1, Math.floor(minDmg * Math.abs(skillPower)));
    const adjMax = Math.max(1, Math.floor(maxDmg * Math.abs(skillPower)));
    const willKill = defender.hp <= (adjMax * (willDouble ? 2 : 1) * skillHits);
    const hitsStr = skillHits > 1 ? `  ×${skillHits}` : '';

    // Weapon triangle prefix
    let prefix = '';
    if (effectiveness > 1.0)      prefix = '▲ ';  // green triangle up
    else if (effectiveness < 1.0) prefix = '▼ ';  // red triangle down

    // Redraw background (in case it was previously hidden/cleared)
    const { _dmgPreviewPanX: panX, _dmgPreviewPanY: panY,
            _dmgPreviewPanW: panW, _dmgPreviewPanH: panH } = this;
    this._dmgPreviewBg.clear();
    this._dmgPreviewBg.fillStyle(0x000000, 0.82);
    this._dmgPreviewBg.fillRoundedRect(panX, panY, panW, panH, 7);
    this._dmgPreviewBg.lineStyle(1, 0xff6644, 0.85);
    this._dmgPreviewBg.strokeRoundedRect(panX, panY, panW, panH, 7);
    this._dmgPreviewBg.setVisible(true);

    // Line 1 — attacker forecast with double/kill indicators
    const atkLine = `${prefix}${attacker.name} → ${adjMin === adjMax ? adjMin : adjMin + '-' + adjMax}  HIT:${hitPct}%  CRIT:${critPct}%${willDouble ? '  ×2' : ''}${hitsStr}${willKill ? '  KILL' : ''}`;
    const line1Color = effectiveness > 1.0 ? '#88ff88' : effectiveness < 1.0 ? '#ff8888' : '#ffcc88';
    this._dmgPreviewLine1.setText(atkLine).setStyle({ color: line1Color }).setVisible(true);

    // Line 2 — hide (was old simple counter; now replaced by line3)
    this._dmgPreviewLine2.setVisible(false);

    // Counter-attack forecast (m1 fix: use attacker's tile terrain def for counter calc)
    const dist = Math.abs(attacker.col - defender.col) + Math.abs(attacker.row - defender.row);
    const canCounter = dist <= (defender.range || 1);
    if (canCounter) {
      const atkTDef = options.defenderTerrainDef || 0;
      const cGuard = attacker.guardActive ? Math.floor(attacker.def * 0.5) : 0;
      const cRaw = Math.max(1, defender.atk - (attacker.def + cGuard + atkTDef));
      const cMin = cRaw;
      const cMax = cRaw + Math.floor(defender.atk * 0.1);
      const cAgiDiff = defender.agi - attacker.agi;
      const cHit = Phaser.Math.Clamp(85 + cAgiDiff * 2, 55, 99);
      const cCrit = Phaser.Math.Clamp(6 + Math.max(0, cAgiDiff), 2, 25);
      const defDouble = cAgiDiff >= 7;
      const counterText = `${defender.name} ← ${cMin === cMax ? cMin : cMin + '-' + cMax}  HIT:${cHit}%  CRIT:${cCrit}%${defDouble ? '  ×2' : ''}`;
      this._dmgPreviewLine3.setText(counterText).setVisible(true);
      this._dmgPreviewLine4.setVisible(false);
    } else {
      this._dmgPreviewLine3.setText('No counter-attack').setVisible(true);
      this._dmgPreviewLine4.setVisible(false);
    }
  }

  hideDamagePreview() {
    this._dmgPreviewBg?.clear().setVisible(false);
    this._dmgPreviewLine1?.setVisible(false);
    this._dmgPreviewLine2?.setVisible(false);
    this._dmgPreviewLine3?.setVisible(false);
    this._dmgPreviewLine4?.setVisible(false);
  }

  // ==========================================================================
  // DIALOGUE BOX
  // ==========================================================================

  _buildDialogueBox() {
    const W = GAME_W;
    const boxH = 110;
    const boxY = GAME_H - boxH - 10;

    this._dlgContainer = this.add.container(0, 0).setVisible(false);

    const dBg = this.add.graphics();
    dBg.fillStyle(0x000020, 0.92);
    dBg.fillRoundedRect(10, boxY, W - 20, boxH, 10);
    dBg.lineStyle(2, 0x4455aa, 0.85);
    dBg.strokeRoundedRect(10, boxY, W - 20, boxH, 10);

    this._dlgPortrait = this.add.text(28, boxY + 14, '', { fontSize: '38px' });
    this._dlgSpeaker  = this.add.text(76, boxY + 12, '', {
      fontSize: '16px', color: '#f8d030',
      fontFamily: 'Nunito, Georgia, serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this._dlgText = this.add.text(76, boxY + 34, '', {
      fontSize: '16px', color: '#ddeeff',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      wordWrap: { width: W - 106 },
      lineSpacing: 5,
    });
    this._dlgPrompt = this.add.text(W - 24, boxY + boxH - 18, '▶ TAP', {
      fontSize: '13px', color: '#aabbcc',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    this.tweens.add({
      targets: this._dlgPrompt, alpha: { from: 0.3, to: 1 },
      duration: 600, yoyo: true, repeat: -1,
    });

    this._dlgContainer.add([dBg, this._dlgPortrait, this._dlgSpeaker, this._dlgText, this._dlgPrompt]);

    // Tap zone — advances dialogue when player taps the dialogue box directly
    const dlgTapZone = this.add.zone(W / 2, boxY + boxH / 2, W, boxH)
      .setInteractive({ useHandCursor: true });
    dlgTapZone.on('pointerdown', () => {
      this._battle?._advanceDialogue();
    });
    this._dlgContainer.add([dlgTapZone]);
  }

  showDialogue(line) {
    this._dlgContainer.setVisible(true);
    this._dlgPortrait.setText(line.portrait || '');
    this._dlgSpeaker.setText(line.speaker || '');
    // Cancel any in-progress typewriter timer
    if (this._typewriterTimer) {
      this._typewriterTimer.remove(false);
      this._typewriterTimer = null;
    }
    // Typewriter effect
    const fullText = line.text || '';
    this._dlgText.setText('');
    let i = 0;
    this._typewriterTimer = this.time.addEvent({
      delay: 28, repeat: fullText.length - 1,
      callback: () => {
        this._dlgText.setText(fullText.slice(0, ++i));
      },
    });
  }

  hideDialogue() {
    this._dlgContainer.setVisible(false);
  }

  // ==========================================================================
  // CHAPTER TITLE CARD
  // ==========================================================================

  showChapterTitle(chapterId) {
    const chap = CHAPTERS[chapterId - 1];
    const W = GAME_W;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, W, GAME_H);

    const chNum = this.add.text(W / 2, GAME_H / 2 - 60, `CHAPTER ${chapterId}`, {
      fontSize: '16px', color: '#aabbcc',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      letterSpacing: 5,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0);

    const chTitle = this.add.text(W / 2, GAME_H / 2 - 26, chap.title, {
      fontSize: '34px', color: '#f8d030',
      fontFamily: 'Nunito, Georgia, serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    const chSub = this.add.text(W / 2, GAME_H / 2 + 24, chap.subtitle, {
      fontSize: '15px', color: '#ccddf0',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: W - 60 },
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: [chNum, chTitle, chSub], alpha: 1, duration: 600, stagger: 200 });
    this.time.delayedCall(2200, () => {
      this.tweens.add({
        targets: [overlay, chNum, chTitle, chSub], alpha: 0, duration: 500,
        onComplete: () => { overlay.destroy(); chNum.destroy(); chTitle.destroy(); chSub.destroy(); },
      });
    });
  }
}
