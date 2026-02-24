'use strict';
// =============================================================================
// Puppy Force — UIScene.js
// HUD overlay: runs simultaneously with BattleScene
// Shows: bottom panel, unit info, action menu, turn banner, dialogue box
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
  create() {
    // Audio (graceful — files are optional and may not exist yet)
    AudioManager.preloadSFX(this);
    this._buildPanel();
    this._buildActionMenu();
    this._buildTurnBanner();
    this._buildDialogueBox();
    this._buildEndTurnBtn();
    this._buildMessage();
    // Initialize display
    this.clearUnitInfo();
    this.hideActionMenu();
  }

  _rebuildUI() {
    // Already created, just update references
  }

  // ==========================================================================
  // BOTTOM PANEL
  // ==========================================================================

  _buildPanel() {
    const W = GAME_W;

    // Panel background
    const pg = this.add.graphics();
    pg.fillStyle(PAL.PANEL, 0.95);
    pg.fillRect(0, UI_Y, W, UI_H);
    pg.lineStyle(2, PAL.BORDER, 0.8);
    pg.lineBetween(0, UI_Y, W, UI_Y);

    // Turn indicator (left side)
    this._turnLabel = this.add.text(10, UI_Y + 8, 'TURN 1', {
      fontSize: '16px', color: '#aabbcc',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
    });

    // Phase indicator
    this._phaseLabel = this.add.text(10, UI_Y + 26, 'YOUR TURN', {
      fontSize: '18px', color: '#4488ff',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000033',
      strokeThickness: 2,
    });

    // Unit info area (center)
    this._unitNameTxt = this.add.text(W / 2, UI_Y + 8, '', {
      fontSize: '20px', color: '#ffffff',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0);

    this._unitStatsTxt = this.add.text(W / 2, UI_Y + 30, '', {
      fontSize: '15px', color: '#ccddf0',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5, 0);

    this._unitHpTxt = this.add.text(W / 2, UI_Y + 50, '', {
      fontSize: '15px', color: '#88ddaa',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // MP bar
    this._mpBarBg = this.add.graphics();
    this._mpBarFg = this.add.graphics();
    this._mpTxt   = this.add.text(W / 2 + 50, UI_Y + 63, '', {
      fontSize: '11px', color: '#88aaff',
      fontFamily: 'Nunito, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    this._unitEmojiTxt = this.add.text(W / 2 - 80, UI_Y + 28, '', {
      fontSize: '30px',
    }).setOrigin(0.5, 0);

    // Skills / items display
    this._skillsTxt = this.add.text(W / 2, UI_Y + 70, '', {
      fontSize: '14px', color: '#99aacc',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this._skillsTxt.setInteractive({ useHandCursor: true });
    this._skillsTxt.on('pointerdown', () => {
      if (this._selectedUnit) this._showSkillInfo(this._selectedUnit);
    });

    // Status effect icons — two pre-created slots, hidden by default
    this._statusIcon1 = this.add.text(W / 2 - 44, UI_Y + 87, '', {
      fontSize: '18px',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setVisible(false);

    this._statusIcon2 = this.add.text(W / 2 + 16, UI_Y + 87, '', {
      fontSize: '18px',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setVisible(false);
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
  // ACTION MENU
  // ==========================================================================

  _buildActionMenu() {
    this._actionMenu = this.add.container(0, 0).setVisible(false);
    const W = GAME_W;
    const btnData = [
      { key: 'atk',   label: '⚔ Attack',  color: 0x882222, hi: 0xcc4444 },
      { key: 'mag',   label: '⚡ Skill',   color: 0x224488, hi: 0x4488cc },
      { key: 'item',  label: '🎒 Item',    color: 0x226622, hi: 0x44aa44 },
      { key: 'wait',  label: '⏳ Wait',    color: 0x444422, hi: 0x888822 },
    ];

    const btnW = (W - 20) / 4 - 4;
    const btnH = 36;
    const startX = 10;
    const y = UI_Y + 104;

    this._actionBtns = {};
    btnData.forEach((b, i) => {
      const x = startX + i * (btnW + 4);
      const bg = this.add.graphics();
      bg.fillStyle(b.color, 1);
      bg.fillRoundedRect(x, y, btnW, btnH, 6);
      bg.lineStyle(1, b.hi, 0.8);
      bg.strokeRoundedRect(x, y, btnW, btnH, 6);

      const txt = this.add.text(x + btnW / 2, y + btnH / 2, b.label, {
        fontSize: '15px', color: '#ffffff',
        fontFamily: 'Nunito, Arial, sans-serif',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);

      const zone = this.add.zone(x + btnW/2, y + btnH/2, btnW, btnH)
        .setInteractive({ useHandCursor: true });

      zone.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(b.hi, 1);
        bg.fillRoundedRect(x, y, btnW, btnH, 6);
      });
      zone.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(b.color, 1);
        bg.fillRoundedRect(x, y, btnW, btnH, 6);
        bg.lineStyle(1, b.hi, 0.8);
        bg.strokeRoundedRect(x, y, btnW, btnH, 6);
      });
      zone.on('pointerdown', () => {
        this.tweens.add({ targets: txt, scaleX:0.9, scaleY:0.9, duration:80, yoyo:true });
        this._onActionBtn(b.key);
      });

      this._actionMenu.add([bg, txt, zone]);
      this._actionBtns[b.key] = { bg, txt, zone, bData: b, x, y, w: btnW, h: btnH };
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
    }
    // Menu visibility is managed entirely by BattleScene action methods —
    // do NOT auto-hide here, so a failed action (e.g. no targets) keeps the
    // menu open and the player isn't left with no way to act.
  }

  // ==========================================================================
  // END TURN BUTTON
  // ==========================================================================

  _buildEndTurnBtn() {
    const W = GAME_W;
    const x = W - 76, y = UI_Y + 12, w = 66, h = 52;

    const bg = this.add.graphics();
    bg.fillStyle(0x113344, 1);
    bg.fillRoundedRect(x, y, w, h, 8);
    bg.lineStyle(1, 0x2266aa, 0.9);
    bg.strokeRoundedRect(x, y, w, h, 8);

    const txt = this.add.text(x + w/2, y + h/2, 'END\nTURN', {
      fontSize: '15px', color: '#88ccff',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#001133',
      strokeThickness: 2,
    }).setOrigin(0.5);

    const zone = this.add.zone(x + w/2, y + h/2, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => { bg.clear(); bg.fillStyle(0x2255aa, 1); bg.fillRoundedRect(x,y,w,h,8); });
    zone.on('pointerout',  () => { bg.clear(); bg.fillStyle(0x113344, 1); bg.fillRoundedRect(x,y,w,h,8); bg.lineStyle(1,0x2266aa,0.9); bg.strokeRoundedRect(x,y,w,h,8); });
    zone.on('pointerdown', () => {
      this.tweens.add({ targets: [bg,txt], scaleX:0.9, scaleY:0.9, duration:80, yoyo:true });
      this._battle?.onEndTurn();
    });

    this._endTurnBtn = { bg, txt, zone };
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
    this._bannerBg.fillRect(0, GAME_H/2 - 60, W, 80);
    this._bannerBg.lineStyle(2, color, 0.8);
    this._bannerBg.lineBetween(0, GAME_H/2 - 60, W, GAME_H/2 - 60);
    this._bannerBg.lineBetween(0, GAME_H/2 + 20, W, GAME_H/2 + 20);

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

    // Update turn label
    const bn = this._battle;
    if (bn) {
      this._turnLabel?.setText(`TURN ${bn.turnNumber}`);
      this._phaseLabel?.setText(bn.playerTurn ? 'YOUR TURN' : 'ENEMY TURN');
      this._phaseLabel?.setStyle({ color: bn.playerTurn ? '#4488ff' : '#ff4444' });
    }
  }

  // ==========================================================================
  // UNIT INFO
  // ==========================================================================

  showUnitInfo(unit) {
    if (!unit) { this.clearUnitInfo(); return; }
    const hpPct = Math.floor(unit.hp / unit.maxHp * 100);
    const hpColor = unit.hp > unit.maxHp * 0.5 ? '#44cc66'
                  : unit.hp > unit.maxHp * 0.25 ? '#ffcc00' : '#ff4444';

    const promoted = unit.promoted ? '★' : '';
    this._unitNameTxt?.setText(`${unit.name}${promoted}  Lv${unit.level}`);
    this._unitEmojiTxt?.setText(unit.emoji);
    this._unitStatsTxt?.setText(`ATK:${unit.atk}  DEF:${unit.def}  MOV:${unit.mov}  AGI:${unit.agi}`);
    this._unitHpTxt?.setText(`HP: ${unit.hp}/${unit.maxHp}  (${hpPct}%)`)
                    .setStyle({ color: hpColor });

    // MP bar
    const mpRatio = (unit.maxMp > 0) ? (unit.mp / unit.maxMp) : 0;
    const barW = 80, barH = 6;
    const barX = GAME_W / 2 - barW / 2;
    const barY = UI_Y + 60;

    this._mpBarBg?.clear();
    this._mpBarFg?.clear();

    if (unit.maxMp > 0) {
      this._mpBarBg?.fillStyle(0x112244, 0.8);
      this._mpBarBg?.fillRoundedRect(barX, barY, barW, barH, 3);
      this._mpBarFg?.fillStyle(0x4488ff, 1);
      this._mpBarFg?.fillRoundedRect(barX, barY, Math.max(2, barW * mpRatio), barH, 3);
      this._mpTxt?.setText(`MP ${unit.mp}/${unit.maxMp}`).setVisible(true);
    } else {
      this._mpTxt?.setVisible(false);
    }

    const skillList = unit.skills.map(s => SKILLS[s]?.name || s).join(' · ');
    const itemList  = unit.items.map(i => ITEMS[i]?.emoji || '').join('');
    this._skillsTxt?.setText(`${skillList}  ${itemList}`);

    // Status effect icons
    const icons = [];
    if (unit.guardActive) icons.push({ icon: '🛡', label: ' Guard', color: '#88aaff' });
    if (unit.burnStacks > 0) icons.push({ icon: '🔥', label: ` Burn×${unit.burnStacks}`, color: '#ff8844' });

    [this._statusIcon1, this._statusIcon2].forEach((txt, i) => {
      if (!txt) return;
      if (icons[i]) {
        txt.setText(icons[i].icon + icons[i].label).setColor(icons[i].color).setVisible(true);
      } else {
        txt.setVisible(false);
      }
    });

    // Update phase labels
    if (this._battle) {
      this._turnLabel?.setText(`TURN ${this._battle.turnNumber}`);
    }
  }

  clearUnitInfo() {
    this._unitNameTxt?.setText('');
    this._unitStatsTxt?.setText('Tap a unit to select');
    this._unitHpTxt?.setText('');
    this._unitEmojiTxt?.setText('');
    this._skillsTxt?.setText('');
    this._mpBarBg?.clear();
    this._mpBarFg?.clear();
    this._mpTxt?.setText('').setVisible(false);
    this._statusIcon1?.setVisible(false);
    this._statusIcon2?.setVisible(false);
  }

  // ==========================================================================
  // ACTION MENU
  // ==========================================================================

  showActionMenu(unit, battleScene) {
    this._selectedUnit = unit;
    this._battle = battleScene;
    this._actionMenu.setVisible(true);
    // Attack and Magic are only available if the unit hasn't acted yet
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

    // Hide the main action menu while the sub-menu is open
    this._actionMenu.setVisible(false);

    const W = GAME_W;
    const skillCount = unit.skills.length;
    // Each skill row is btnH tall; add room for a Cancel button and top padding
    const btnH   = 38;
    const padTop = 8;
    const padBot = 6;
    const cancelH= 32;
    const menuH  = padTop + skillCount * (btnH + 4) + cancelH + padBot + 4;
    const menuY  = UI_Y + 100 - menuH;  // sit just above the bottom panel action row
    const menuX  = 8;
    const menuW  = W - 16;

    // Container that we'll destroy on close
    const container = this.add.container(0, 0).setDepth(50);

    // Background panel
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x0a1a2e, 0.97);
    panelBg.fillRoundedRect(menuX, menuY, menuW, menuH, 8);
    panelBg.lineStyle(2, 0x4488cc, 0.9);
    panelBg.strokeRoundedRect(menuX, menuY, menuW, menuH, 8);
    container.add(panelBg);

    const headerTxt = this.add.text(W / 2, menuY + padTop + 2, 'Choose Skill', {
      fontSize: '13px', color: '#aabbcc',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    container.add(headerTxt);

    const destroy = () => { container.destroy(true); };

    // One button per skill
    unit.skills.forEach((skillId, idx) => {
      const sk = SKILLS[skillId];
      if (!sk) return;

      const canAfford = (sk.mpCost || 0) === 0 || unit.mp >= (sk.mpCost || 0);
      const rowY = menuY + padTop + 18 + idx * (btnH + 4);
      const rowX = menuX + 6;
      const rowW = menuW - 12;

      const colorBase = canAfford ? 0x224488 : 0x1a1a1a;
      const colorHi   = canAfford ? 0x4488cc : 0x2a2a2a;
      const textAlpha = canAfford ? 1.0 : 0.45;

      const bg = this.add.graphics();
      bg.fillStyle(colorBase, 1);
      bg.fillRoundedRect(rowX, rowY, rowW, btnH, 6);
      bg.lineStyle(1, colorHi, 0.8);
      bg.strokeRoundedRect(rowX, rowY, rowW, btnH, 6);
      container.add(bg);

      const mpLabel = sk.mpCost ? `  MP:${sk.mpCost}` : '';
      const nameTxt = this.add.text(rowX + 10, rowY + btnH / 2, sk.name + mpLabel, {
        fontSize: '15px', color: '#ffffff',
        fontFamily: 'Nunito, Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0, 0.5).setAlpha(textAlpha);
      container.add(nameTxt);

      if (canAfford) {
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
          this.tweens.add({ targets: nameTxt, scaleX: 0.9, scaleY: 0.9, duration: 80, yoyo: true });
          destroy();
          this._battle.onActionMagic(skillId);
        });
        container.add(zone);
      }
    });

    // Cancel / Back button
    const cancelY = menuY + padTop + 18 + skillCount * (btnH + 4) + 4;
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
      // Re-show the main action menu
      this.showActionMenu(unit, this._battle);
    });
    container.add(cancelZone);

    // Keep a reference so BattleScene can close it programmatically if needed
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
    // Each item row is btnH tall; add room for a Cancel button and top padding
    const btnH    = 38;
    const padTop  = 8;
    const padBot  = 6;
    const cancelH = 32;
    const menuH   = padTop + itemCount * (btnH + 4) + cancelH + padBot + 4;
    const menuY   = UI_Y + 100 - menuH;  // sit just above the bottom panel action row
    const menuX   = 8;
    const menuW   = W - 16;

    // Container that we'll destroy on close
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
      // Always treat items as usable (no cost check needed in current design)
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
      // Re-show the main action menu
      this.showActionMenu(unit, this._battle);
    });
    container.add(cancelZone);

    // Keep a reference so BattleScene can close it programmatically if needed
    this._itemMenuContainer = container;
    container.once('destroy', () => { this._itemMenuContainer = null; });
  }

  // ==========================================================================
  // MESSAGE
  // ==========================================================================

  _buildMessage() {
    const W = GAME_W;
    this._msgBg  = this.add.graphics().setVisible(false);
    this._msgTxt = this.add.text(W / 2, UI_Y - 22, '', {
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
    this._msgBg.fillRoundedRect(W/2 - 160, UI_Y - 36, 320, 30, 6);
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
    dBg.lineStyle(2, PAL.GOLD, 0.8);
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

    const chNum = this.add.text(W/2, GAME_H/2 - 60, `CHAPTER ${chapterId}`, {
      fontSize: '16px', color: '#aabbcc',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      letterSpacing: 5,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0);

    const chTitle = this.add.text(W/2, GAME_H/2 - 26, chap.title, {
      fontSize: '34px', color: '#f8d030',
      fontFamily: 'Nunito, Georgia, serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    const chSub = this.add.text(W/2, GAME_H/2 + 24, chap.subtitle, {
      fontSize: '15px', color: '#ccddf0',
      fontFamily: 'Nunito, Arial, sans-serif',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: W - 60 },
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets:[chNum,chTitle,chSub], alpha:1, duration:600, stagger:200 });
    this.time.delayedCall(2200, () => {
      this.tweens.add({
        targets:[overlay,chNum,chTitle,chSub], alpha:0, duration:500,
        onComplete:() => { overlay.destroy(); chNum.destroy(); chTitle.destroy(); chSub.destroy(); },
      });
    });
  }
}
