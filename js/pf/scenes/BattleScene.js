'use strict';
// =============================================================================
// Puppy Force — BattleScene.js
// Core turn-based tactical battle
// =============================================================================

// State machine states
const BS = {
  IDLE:         'IDLE',
  UNIT_SEL:     'UNIT_SEL',
  UNIT_MOVED:   'UNIT_MOVED',
  TARGET_ATK:   'TARGET_ATK',
  TARGET_HEAL:  'TARGET_HEAL',
  ENEMY_TURN:   'ENEMY_TURN',
  ANIMATING:    'ANIMATING',
  DIALOGUE:     'DIALOGUE',
  VICTORY:      'VICTORY',
  DEFEAT:       'DEFEAT',
};

class BattleScene extends Phaser.Scene {
  constructor() { super({ key: 'BattleScene' }); }

  // --------------------------------------------------------------------------
  init(data) {
    this.chapterId  = data.chapter || 1;
    this.saveData   = data.saveData || SaveManager.newGame();
    this._state     = BS.IDLE;
    this._selected  = null;    // selected Unit
    this._moveTiles = [];      // reachable tiles
    this._atkTiles  = [];      // attackable tiles
    this._healTiles = [];      // heal-range tiles
    this._preMovPos   = null;    // {col,row} before move for undo
    this._pendingSkill= null;    // offensive skill queued before attack target
    this._dlgQueue  = [];        // dialogue lines
    this._dlgIndex  = 0;
    this._enemyQueue= [];      // enemies still to act this turn
    this._levelUps  = [];      // collected during battle
    this._newUnits  = [];      // newly recruited
    this.turnNumber = 1;
    this.playerTurn = true;
  }

  // --------------------------------------------------------------------------
  create() {
    const chapter = CHAPTERS[this.chapterId - 1];

    // Load roster from save, then place units
    this.roster = SaveManager.deserializeRoster(this.saveData.roster);
    this.mapGrid= chapter.mapGrid;
    this.units  = [];

    // ── Build player units ──────────────────────────────────────────────────
    const maxSlots = Math.min(chapter.playerStart.length, 8);
    for (let i = 0; i < maxSlots; i++) {
      const slot = chapter.playerStart[i];
      const saved= this.roster.find(u => u.id === slot.unitId);
      if (!saved) continue;
      saved.col = slot.col;
      saved.row = slot.row;
      this.units.push(saved);
    }

    // ── Build enemy units ───────────────────────────────────────────────────
    chapter.enemies.forEach(spawn => {
      const enemy = buildEnemyUnit(spawn, this.units);
      if (enemy) this.units.push(enemy);
    });

    // ── Build recruitable units (neutral, stand still) ─────────────────────
    this._recruitables = [];
    (chapter.recruitable || []).forEach(r => {
      const def  = HERO_DEFS[r.unitId] || ALLY_DEFS[r.unitId];
      if (!def) return;
      const unit = new Unit(def, r.col, r.row);
      unit.team  = 'neutral';
      unit.rescueMsg = r.rescueMsg;
      this.units.push(unit);
      this._recruitables.push(unit);
    });

    // ── Build map and sprites ────────────────────────────────────────────────
    this._buildMap();
    this._buildHighlightLayers();
    this._buildUnitSprites();
    this._buildGridOverlay();

    // ── UIScene overlay (runs parallel) ─────────────────────────────────────
    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene', { battleScene: this });
    } else {
      this.scene.get('UIScene').reset(this);
    }

    // ── Input ────────────────────────────────────────────────────────────────
    this.input.on('pointerdown', this._onTap, this);

    // ── Opening dialogue ──────────────────────────────────────────────────────
    const intro = chapter.intro || [];
    if (intro.length > 0) {
      this._startDialogue(intro, () => this._setState(BS.IDLE));
    } else {
      this._setState(BS.IDLE);
    }
  }

  // ==========================================================================
  // MAP RENDERING
  // ==========================================================================

  _buildMap() {
    this._tileGfx = this.add.graphics();
    const g = this._tileGfx;

    for (let row = 0; row < GROWS; row++) {
      for (let col = 0; col < GCOLS; col++) {
        const tid = this.mapGrid[row][col];
        const td  = TERRAIN[tid];
        const x   = GRID_X + col * TILE;
        const y   = GRID_Y + row * TILE;

        // Base tile
        g.fillStyle(td.color, 1);
        g.fillRect(x, y, TILE, TILE);

        // Highlight top-left edge (lighter)
        g.fillStyle(td.hi, 0.4);
        g.fillRect(x, y, TILE, 2);
        g.fillRect(x, y, 2, TILE);

        // Dark bottom-right edge
        g.fillStyle(0x000000, 0.25);
        g.fillRect(x + TILE - 2, y, 2, TILE);
        g.fillRect(x, y + TILE - 2, TILE, 2);

        // Terrain detail icons
        this._drawTerrainDetail(g, tid, x, y);
      }
    }
  }

  _drawTerrainDetail(g, tid, x, y) {
    // Small decorative marks on certain terrain types
    const cx = x + TILE / 2, cy = y + TILE / 2;
    if (tid === T.FOREST) {
      g.fillStyle(0x1a4010, 0.6);
      g.fillCircle(cx - 8, cy + 4, 7);
      g.fillCircle(cx + 5, cy + 4, 6);
      g.fillCircle(cx - 2, cy - 2, 8);
    } else if (tid === T.MOUNTAIN) {
      g.fillStyle(0x9a8a75, 0.7);
      g.fillTriangle(cx - 8, cy + 10, cx, cy - 8, cx + 8, cy + 10);
      g.fillStyle(0xffffff, 0.5);
      g.fillTriangle(cx - 2, cy - 8, cx, cy - 14, cx + 2, cy - 8);
    } else if (tid === T.WATER) {
      g.fillStyle(0x55aaee, 0.35);
      for (let i = 0; i < 3; i++) {
        g.fillEllipse(cx - 12 + i * 12, cy + (i % 2 === 0 ? -4 : 4), 14, 5);
      }
    } else if (tid === T.VILLAGE) {
      g.fillStyle(0xa06040, 0.7);
      g.fillRect(cx - 8, cy - 2, 16, 14);
      g.fillStyle(0x884422, 0.8);
      g.fillTriangle(cx - 10, cy - 2, cx, cy - 14, cx + 10, cy - 2);
    } else if (tid === T.CASTLE) {
      g.fillStyle(0x666688, 0.7);
      g.fillRect(cx - 10, cy - 10, 20, 20);
      g.fillStyle(0x888899, 0.6);
      g.fillRect(cx - 14, cy - 14, 8, 10);
      g.fillRect(cx + 6,  cy - 14, 8, 10);
    } else if (tid === T.SNOW) {
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(cx, cy, 8);
      g.fillCircle(cx - 10, cy + 5, 5);
      g.fillCircle(cx + 9, cy + 5, 5);
    } else if (tid === T.OASIS) {
      g.fillStyle(0x22aa44, 0.7);
      g.fillCircle(cx, cy, 10);
      g.fillStyle(0x55cc66, 0.5);
      g.fillTriangle(cx - 2, cy - 5, cx, cy - 16, cx + 2, cy - 5);
      g.fillTriangle(cx - 2, cy - 8, cx + 8, cy - 14, cx + 4, cy - 6);
      g.fillTriangle(cx + 2, cy - 8, cx - 8, cy - 14, cx - 4, cy - 6);
    } else if (tid === T.SAND) {
      g.fillStyle(0xf0cc60, 0.25);
      g.fillCircle(cx - 5, cy + 5, 6);
      g.fillCircle(cx + 8, cy - 4, 5);
    } else if (tid === T.BRIDGE) {
      g.fillStyle(0xa07030, 0.8);
      for (let i = 0; i < 3; i++) {
        g.fillRect(cx - 18 + i * 12, cy - 4, 8, TILE * 0.3);
      }
    } else if (tid === T.WALL) {
      g.fillStyle(0x555555, 0.7);
      g.fillRect(cx - TILE/2 + 4, cy - TILE/2 + 4, TILE - 8, TILE - 8);
      g.lineStyle(1, 0x333333, 0.8);
      g.strokeRect(cx - TILE/2 + 4, cy - TILE/2 + 4, TILE - 8, TILE - 8);
    }
  }

  _buildHighlightLayers() {
    this._hlMove  = this.add.graphics(); // Blue: movement
    this._hlAtk   = this.add.graphics(); // Red: attack
    this._hlHeal  = this.add.graphics(); // Green: heal
    this._hlSel   = this.add.graphics(); // Yellow: selected unit
    this._hlCursor= this.add.graphics(); // White pulse: cursor
  }

  _buildGridOverlay() {
    const g = this.add.graphics();
    g.lineStyle(1, 0x000000, 0.15);
    for (let col = 0; col <= GCOLS; col++) {
      g.lineBetween(GRID_X + col*TILE, GRID_Y, GRID_X + col*TILE, GRID_Y + GH);
    }
    for (let row = 0; row <= GROWS; row++) {
      g.lineBetween(GRID_X, GRID_Y + row*TILE, GRID_X + GW, GRID_Y + row*TILE);
    }
  }

  _buildUnitSprites() {
    this._unitLayer = this.add.container(0, 0);
    this.units.forEach(u => this._createUnitSprite(u));
  }

  _createUnitSprite(unit) {
    const { x, y } = this._tileCenter(unit.col, unit.row);
    const r = TILE / 2 - 3;

    // Background circle
    const teamColor = unit.team === 'player' ? 0x224488
                    : unit.team === 'neutral' ? 0x2a4a1a
                    : 0x882222;
    const glow      = unit.team === 'player' ? PAL.PLAYER_GLOW
                    : unit.team === 'neutral' ? 0x44cc66
                    : PAL.ENEMY_GLOW;

    const bg = this.add.circle(x, y, r, teamColor, 0.95);
    bg.setStrokeStyle(2, glow, 0.9);

    // Emoji sprite
    const sprite = this.add.text(x, y - 2, unit.emoji, {
      fontSize: '22px',
    }).setOrigin(0.5);

    // HP bar background
    const hpBg = this.add.rectangle(x, y + r + 3, TILE - 10, 4, 0x000000, 0.7);

    // HP bar foreground
    const hpBar = this.add.rectangle(x - (TILE - 10) / 2, y + r + 3, TILE - 10, 4, PAL.HP_G, 1);
    hpBar.setOrigin(0, 0.5);

    unit.spriteBg  = bg;
    unit.sprite    = sprite;
    unit.hpBarBg   = hpBg;
    unit.hpBar     = hpBar;

    this._unitLayer.add([bg, sprite, hpBg, hpBar]);
    this._updateHPBar(unit);
  }

  _updateHPBar(unit) {
    if (!unit.hpBar) return;
    const pct = unit.hp / unit.maxHp;
    const maxW = TILE - 10;
    unit.hpBar.width = maxW * pct;
    unit.hpBar.fillColor = pct > 0.5 ? PAL.HP_G : pct > 0.25 ? PAL.HP_Y : PAL.HP_R;
    unit.hpBar.setX(this._tileCenter(unit.col, unit.row).x - maxW / 2);
    unit.hpBarBg.setX(this._tileCenter(unit.col, unit.row).x);
  }

  _updateSpritePos(unit) {
    if (!unit.sprite) return;
    const { x, y } = this._tileCenter(unit.col, unit.row);
    const r = TILE / 2 - 3;
    unit.spriteBg.setPosition(x, y);
    unit.sprite.setPosition(x, y - 2);
    unit.hpBarBg.setPosition(x, y + r + 3);
    unit.hpBar.setX(x - (TILE - 10) / 2);
    unit.hpBar.setY(y + r + 3);
    this._updateHPBar(unit);
  }

  _destroyUnitSprite(unit) {
    [unit.spriteBg, unit.sprite, unit.hpBarBg, unit.hpBar].forEach(o => o && o.destroy());
    unit.spriteBg = unit.sprite = unit.hpBarBg = unit.hpBar = null;
  }

  // ==========================================================================
  // HIGHLIGHT RENDERING
  // ==========================================================================

  _clearHighlights() {
    this._hlMove.clear();
    this._hlAtk.clear();
    this._hlHeal.clear();
    this._hlSel.clear();
  }

  _drawMoveHighlights(tiles) {
    const g = this._hlMove;
    g.clear();
    tiles.forEach(({ col, row }) => {
      const { x, y } = this._tileTL(col, row);
      g.fillStyle(PAL.MOVE_HL, 0.30);
      g.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      g.lineStyle(1, PAL.MOVE_HL, 0.7);
      g.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
    });
  }

  _drawAtkHighlights(tiles) {
    const g = this._hlAtk;
    g.clear();
    tiles.forEach(({ col, row }) => {
      const { x, y } = this._tileTL(col, row);
      g.fillStyle(PAL.ATK_HL, 0.30);
      g.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      g.lineStyle(1, PAL.ATK_HL, 0.7);
      g.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
    });
  }

  _drawHealHighlights(tiles) {
    const g = this._hlHeal;
    g.clear();
    tiles.forEach(({ col, row }) => {
      const { x, y } = this._tileTL(col, row);
      g.fillStyle(PAL.HEAL_HL, 0.30);
      g.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      g.lineStyle(1, PAL.HEAL_HL, 0.7);
      g.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
    });
  }

  _drawSelHighlight(unit) {
    const g = this._hlSel;
    g.clear();
    if (!unit) return;
    const { x, y } = this._tileTL(unit.col, unit.row);
    g.lineStyle(3, PAL.SEL_HL, 1);
    g.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
    // Animated corner marks
    const sz = 8;
    g.lineStyle(3, PAL.GOLD, 1);
    g.lineBetween(x+1, y+1, x+1+sz, y+1);
    g.lineBetween(x+1, y+1, x+1, y+1+sz);
    g.lineBetween(x+TILE-1, y+1, x+TILE-1-sz, y+1);
    g.lineBetween(x+TILE-1, y+1, x+TILE-1, y+1+sz);
    g.lineBetween(x+1, y+TILE-1, x+1+sz, y+TILE-1);
    g.lineBetween(x+1, y+TILE-1, x+1, y+TILE-1-sz);
    g.lineBetween(x+TILE-1, y+TILE-1, x+TILE-1-sz, y+TILE-1);
    g.lineBetween(x+TILE-1, y+TILE-1, x+TILE-1, y+TILE-1-sz);
  }

  // ==========================================================================
  // INPUT HANDLING
  // ==========================================================================

  _onTap(ptr) {
    if (this._state === BS.DIALOGUE)  { this._advanceDialogue(); return; }
    if (this._state === BS.ANIMATING) return;
    if (this._state === BS.ENEMY_TURN)return;
    if (this._state === BS.VICTORY || this._state === BS.DEFEAT) return;

    const col = Math.floor((ptr.x - GRID_X) / TILE);
    const row = Math.floor((ptr.y - GRID_Y) / TILE);
    if (col < 0 || col >= GCOLS || row < 0 || row >= GROWS) return;

    switch (this._state) {
      case BS.IDLE:       this._handleIdleTap(col, row);     break;
      case BS.UNIT_SEL:   this._handleSelectTap(col, row);   break;
      case BS.UNIT_MOVED: this._handleMovedTap(col, row);    break;
      case BS.TARGET_ATK: this._handleAtkTargetTap(col, row);break;
      case BS.TARGET_HEAL:this._handleHealTargetTap(col, row);break;
    }
  }

  _handleIdleTap(col, row) {
    const unit = this._unitAt(col, row);
    if (unit && unit.team === 'player' && unit.canAct) {
      this._selectUnit(unit);
    } else if (unit && unit.team === 'player' && !unit.canAct) {
      this._showUnitInfo(unit);
    }
  }

  _handleSelectTap(col, row) {
    const unit = this._unitAt(col, row);

    // Tap on a move tile
    if (this._moveTiles.some(t => t.col === col && t.row === row)) {
      this._moveSelectedUnit(col, row);
      return;
    }

    // Tap on another friendly unit: switch selection
    if (unit && unit.team === 'player' && unit.canAct) {
      this._selectUnit(unit);
      return;
    }

    // Deselect
    this._deselect();
  }

  _handleMovedTap(col, row) {
    // In UNIT_MOVED state, the action menu handles input via UIScene buttons
    // This handles deselect if tapping elsewhere
    const unit = this._unitAt(col, row);
    if (!unit || unit !== this._selected) {
      // Could undo move here if tapping original tile
      if (this._preMovPos && col === this._preMovPos.col && row === this._preMovPos.row) {
        this._undoMove();
      }
    }
  }

  _handleAtkTargetTap(col, row) {
    if (!this._atkTiles.some(t => t.col === col && t.row === row)) {
      this._deselect(); return;
    }
    const target = this._unitAt(col, row);
    if (!target || target.team === 'player') { this._deselect(); return; }

    this._executeCombat(this._selected, target, () => {
      this._selected.hasActed = true;
      this._checkEndCondition();
      this._deselect();
    });
  }

  _handleHealTargetTap(col, row) {
    if (!this._healTiles.some(t => t.col === col && t.row === row)) {
      this._deselect(); return;
    }
    const target = this._unitAt(col, row);
    if (!target || target.team !== 'player') { this._deselect(); return; }

    this._executeHeal(this._selected, target);
    this._selected.hasActed = true;
    this._checkEndCondition();
    this._deselect();
  }

  // ==========================================================================
  // UNIT SELECTION & MOVEMENT
  // ==========================================================================

  _selectUnit(unit) {
    this._selected = unit;
    const tiles = getReachableTiles(unit, this.mapGrid, this.units);
    this._moveTiles = tiles;
    this._clearHighlights();
    this._drawMoveHighlights(tiles);
    this._drawSelHighlight(unit);
    this._setState(BS.UNIT_SEL);
    this._getUI()?.showUnitInfo(unit);
    this._dimActedUnits();
  }

  _deselect() {
    this._selected  = null;
    this._moveTiles = [];
    this._atkTiles  = [];
    this._healTiles = [];
    this._clearHighlights();
    this._setState(BS.IDLE);
    this._getUI()?.hideActionMenu();
    this._getUI()?.clearUnitInfo();
    this._dimActedUnits();
  }

  _moveSelectedUnit(col, row) {
    const unit = this._selected;
    this._preMovPos = { col: unit.col, row: unit.row };

    const path = findPath(unit, col, row, this.mapGrid, this.units);
    this._animateMove(unit, path || [{ col, row }], () => {
      unit.col = col;
      unit.row = row;
      unit.hasMoved = true;

      // Check if recruitable unit is adjacent
      this._checkRecruitment(unit);

      this._clearHighlights();
      this._drawSelHighlight(unit);
      this._setState(BS.UNIT_MOVED);
      this._getUI()?.showActionMenu(unit, this);
    });
  }

  _undoMove() {
    const unit = this._selected;
    if (!unit || !this._preMovPos) return;
    unit.col = this._preMovPos.col;
    unit.row = this._preMovPos.row;
    unit.hasMoved = false;
    this._preMovPos = null;
    this._updateSpritePos(unit);
    this._selectUnit(unit);
  }

  _animateMove(unit, path, onComplete) {
    if (!path || path.length === 0) { onComplete(); return; }
    this._setState(BS.ANIMATING);

    const r = TILE / 2 - 3;
    let step = 0;

    const doStep = () => {
      if (step >= path.length) {
        this._updateSpritePos(unit);
        onComplete();
        return;
      }
      const { col, row } = path[step++];
      const { x, y } = this._tileCenter(col, row);
      const hpY = y + r + 3;

      // Paw trail
      if (unit.sprite) {
        const trail = this.add.text(unit.sprite.x, unit.sprite.y, '·', {
          fontSize: '16px', color: '#aaccff',
        }).setOrigin(0.5).setAlpha(0.6);
        this.tweens.add({ targets: trail, alpha: 0, y: trail.y - 12, duration: 350, onComplete: () => trail.destroy() });
      }

      // Separate tween per display object (different target y values)
      if (unit.spriteBg) this.tweens.add({ targets: unit.spriteBg, x, y,        duration: 120, ease: 'Power1' });
      if (unit.sprite)   this.tweens.add({ targets: unit.sprite,   x, y: y - 2, duration: 120, ease: 'Power1' });
      if (unit.hpBarBg)  this.tweens.add({ targets: unit.hpBarBg,  x, y: hpY,  duration: 120, ease: 'Power1' });
      if (unit.hpBar) {
        this.tweens.add({
          targets: unit.hpBar,
          x: x - (TILE - 10) / 2,
          y: hpY,
          duration: 120,
          ease: 'Power1',
          onComplete: doStep,
        });
      } else {
        this.time.delayedCall(125, doStep);
      }
    };
    doStep();
  }

  // --------------------------------------------------------------------------
  // Action menu callbacks (called by UIScene)
  // --------------------------------------------------------------------------

  onActionAttack() {
    const unit = this._selected;
    if (!unit) return;
    const atkTiles = getAttackTiles(unit, this.mapGrid, unit.col, unit.row);
    const hasTarget = atkTiles.some(t => {
      const u = this._unitAt(t.col, t.row);
      return u && u.team === 'enemy';
    });
    if (!hasTarget) {
      this._getUI()?.showMessage('No enemies in range!');
      return;
    }
    this._atkTiles = atkTiles;
    this._clearHighlights();
    this._drawAtkHighlights(atkTiles);
    this._drawSelHighlight(unit);
    this._setState(BS.TARGET_ATK);
    this._getUI()?.hideActionMenu();
  }

  onActionMagic() {
    const unit = this._selected;
    if (!unit || !unit.skills.length) return;
    const skill = unit.skills[0]; // use first skill
    const sk = SKILLS[skill];
    if (!sk) return;

    if (sk.targetAlly) {
      // Heal
      const healTiles = getAttackTiles(unit, this.mapGrid, unit.col, unit.row);
      this._healTiles = healTiles;
      this._clearHighlights();
      this._drawHealHighlights(healTiles);
      this._drawSelHighlight(unit);
      this._setState(BS.TARGET_HEAL);
      this._getUI()?.hideActionMenu();
    } else {
      // Offensive skill = treat like attack but with skill power
      this._pendingSkill = skill;
      this.onActionAttack();
    }
  }

  onActionItem() {
    const unit = this._selected;
    if (!unit || unit.items.length === 0) {
      this._getUI()?.showMessage('No items!');
      return;
    }
    // Use first healing item
    const itemId = unit.items[0];
    const item   = ITEMS[itemId];
    if (item && item.heal) {
      const healed = unit.heal(item.heal);
      unit.items.splice(0, 1);
      this._updateHPBar(unit);
      this._floatText(unit.col, unit.row, `+${healed} HP`, PAL.HP_G);
      unit.hasActed = true;
      this._checkEndCondition();
      this._deselect();
    } else if (item && item.promote && unit.canPromote()) {
      const msg = unit.promote() ? `${unit.name} promoted!` : 'Cannot promote!';
      unit.items.splice(0, 1);
      this._getUI()?.showMessage(msg);
      unit.sprite.setText(unit.emoji);
      unit.hasActed = true;
      this._checkEndCondition();
      this._deselect();
    }
  }

  onActionWait() {
    const unit = this._selected;
    if (!unit) return;
    unit.hasMoved = true;
    unit.hasActed = true;
    this._checkEndCondition();
    this._deselect();
  }

  onEndTurn() {
    if (this._state === BS.ENEMY_TURN || this._state === BS.ANIMATING) return;
    this._deselect();
    this._beginEnemyTurn();
  }

  // ==========================================================================
  // COMBAT
  // ==========================================================================

  _executeCombat(attacker, defender, onDone) {
    this._setState(BS.ANIMATING);
    this._clearHighlights();

    // Combat math
    const atkBonus = this._pendingSkill ? (SKILLS[this._pendingSkill].power || 1) : 1;
    this._pendingSkill = null;

    const terrainDef = TERRAIN[this.mapGrid[defender.row][defender.col]]?.def || 0;
    const rawDmg = Math.max(1, attacker.atk - (defender.def + terrainDef));
    const variance = Phaser.Math.Between(0, Math.floor(attacker.atk * 0.15));
    const dmg = Math.floor(rawDmg * atkBonus) + variance;

    // Attack animation
    this._shakeSprite(attacker.sprite, () => {
      // Flash defender
      this.tweens.add({
        targets: [defender.spriteBg, defender.sprite],
        alpha: 0.2, duration: 60, yoyo: true, repeat: 2,
        onComplete: () => {
          const died = defender.takeDamage(dmg);
          this._updateHPBar(defender);
          this._floatText(defender.col, defender.row, `-${dmg}`, PAL.HP_R);

          // EXP gain
          const expGain = 10 + Math.floor(dmg / 2);
          const leveled = attacker.gainExp(expGain);
          if (leveled) this._onLevelUp(attacker);

          if (died) {
            this._killUnit(defender, () => {
              // Counter-attack possible for melee defenders?
              // (no counter if dead)
              onDone && onDone();
            });
            return;
          }

          // Counter-attack: melee defenders that haven't attacked this combat
          const dist = Math.abs(attacker.col - defender.col) + Math.abs(attacker.row - defender.row);
          const canCounter = dist === 1 && defender.range === 1 && defender.team === 'enemy';
          if (canCounter) {
            const cDef = TERRAIN[this.mapGrid[attacker.row][attacker.col]]?.def || 0;
            const cRaw = Math.max(1, defender.atk - (attacker.def + cDef));
            const cVar = Phaser.Math.Between(0, Math.floor(defender.atk * 0.1));
            const cDmg = cRaw + cVar;

            this.time.delayedCall(300, () => {
              this._shakeSprite(defender.sprite, () => {
                this.tweens.add({
                  targets: [attacker.spriteBg, attacker.sprite],
                  alpha: 0.2, duration: 60, yoyo: true, repeat: 2,
                  onComplete: () => {
                    const aDied = attacker.takeDamage(cDmg);
                    this._updateHPBar(attacker);
                    this._floatText(attacker.col, attacker.row, `-${cDmg}`, 0xff8844);
                    const expGain2 = Math.floor(cDmg / 3);
                    const leveled2 = defender.gainExp(expGain2);
                    if (leveled2) this._onLevelUp(defender);

                    if (aDied) {
                      this._killUnit(attacker, onDone);
                    } else {
                      onDone && onDone();
                    }
                  },
                });
              });
            });
          } else {
            onDone && onDone();
          }
        },
      });
    });
  }

  _executeHeal(healer, target) {
    const sk = SKILLS['heal'];
    const healAmt = Math.floor(healer.atk * 0.8) + Phaser.Math.Between(2, 6);
    const actual  = target.heal(healAmt);
    this._updateHPBar(target);
    this._floatText(target.col, target.row, `+${actual} HP`, PAL.HP_G);

    const expGain = 15;
    const leveled = healer.gainExp(expGain);
    if (leveled) this._onLevelUp(healer);

    // Spark effect on target
    this._healEffect(target.col, target.row);
  }

  _killUnit(unit, onDone) {
    this.tweens.add({
      targets: [unit.spriteBg, unit.sprite, unit.hpBar, unit.hpBarBg],
      alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 400,
      ease: 'Power2',
      onComplete: () => {
        this._destroyUnitSprite(unit);
        unit.dead = true;
        this._checkEndCondition();
        onDone && onDone();
      },
    });
  }

  // ==========================================================================
  // ENEMY AI TURN
  // ==========================================================================

  _beginEnemyTurn() {
    this.playerTurn = false;
    this.turnNumber++;
    this._setState(BS.ENEMY_TURN);
    this._getUI()?.showTurnBanner('Enemy Turn', 0xcc2222);

    this._enemyQueue = this.units.filter(u => !u.dead && u.team === 'enemy');
    this.units.filter(u => !u.dead && u.team !== 'enemy').forEach(u => u.resetTurn());

    this.time.delayedCall(800, () => this._processNextEnemy());
  }

  _processNextEnemy() {
    // Remove dead from queue
    this._enemyQueue = this._enemyQueue.filter(u => !u.dead);

    if (this._enemyQueue.length === 0) {
      this._beginPlayerTurn();
      return;
    }

    const enemy = this._enemyQueue.shift();
    const action = computeEnemyAction(enemy, this.mapGrid, this.units);

    // Move
    const path = findPath(enemy, action.moveTo.col, action.moveTo.row, this.mapGrid, this.units);
    const movePath = (path || []).slice(0, enemy.mov + 1);

    this._animateMove(enemy, movePath.length > 0 ? movePath : [action.moveTo], () => {
      enemy.col = action.moveTo.col;
      enemy.row = action.moveTo.row;
      enemy.hasMoved = true;

      if (action.target && !action.target.dead) {
        this._executeCombat(enemy, action.target, () => {
          enemy.hasActed = true;
          this.time.delayedCall(200, () => this._processNextEnemy());
        });
      } else {
        enemy.hasActed = true;
        this.time.delayedCall(150, () => this._processNextEnemy());
      }
    });
  }

  _beginPlayerTurn() {
    this.playerTurn = true;
    this.units.filter(u => !u.dead && u.team === 'player').forEach(u => u.resetTurn());
    this._setState(BS.IDLE);
    this._dimActedUnits();
    this._getUI()?.showTurnBanner('Your Turn', 0x2255cc);
  }

  // ==========================================================================
  // RECRUITMENT (adjacent player to recruitable)
  // ==========================================================================

  _checkRecruitment(movedUnit) {
    if (movedUnit.team !== 'player') return;
    this._recruitables.forEach(r => {
      if (r.team !== 'neutral' || r.dead) return;
      const dist = Math.abs(movedUnit.col - r.col) + Math.abs(movedUnit.row - r.row);
      if (dist === 1) {
        // Recruit!
        r.team = 'player';
        this._recruitables.splice(this._recruitables.indexOf(r), 1);
        this._newUnits.push({ name: r.name, emoji: r.emoji });
        // Update sprite color
        if (r.spriteBg) {
          r.spriteBg.setFillStyle(0x224488, 0.95);
          r.spriteBg.setStrokeStyle(2, PAL.PLAYER_GLOW, 0.9);
        }
        // Add to roster
        this.saveData.roster.push(r.toSave());
        this._floatText(r.col, r.row, r.rescueMsg || 'Joins!', 0x44ff88);
        this._getUI()?.showMessage(r.rescueMsg || `${r.name} joined!`);
      }
    });
  }

  // ==========================================================================
  // WIN / LOSE CHECK
  // ==========================================================================

  _checkEndCondition() {
    if (this._state === BS.VICTORY || this._state === BS.DEFEAT) return;

    const chapter = CHAPTERS[this.chapterId - 1];
    const players = this.units.filter(u => !u.dead && u.team === 'player');
    const enemies = this.units.filter(u => !u.dead && u.team === 'enemy');

    // Defeat: all player units dead
    if (players.length === 0) {
      this._setState(BS.DEFEAT);
      this._getUI()?.showMessage('All units defeated!');
      this.time.delayedCall(1500, () => this._endBattle(false));
      return;
    }

    // Victory: boss dead
    const boss = this.units.find(u => u.id === chapter.bossId || u.isBoss);
    if (boss && boss.dead) {
      this._setState(BS.VICTORY);
      this._celebrateVictory();
      return;
    }

    // Victory fallback: all enemies dead
    if (enemies.length === 0) {
      this._setState(BS.VICTORY);
      this._celebrateVictory();
      return;
    }
  }

  _celebrateVictory() {
    const chapter = CHAPTERS[this.chapterId - 1];

    // Victory dialogue first
    const victDlg = chapter.victory || [];
    if (victDlg.length > 0) {
      this._startDialogue(victDlg, () => this._endBattle(true));
    } else {
      this.time.delayedCall(800, () => this._endBattle(true));
    }
  }

  _endBattle(victory) {
    // Save progress
    if (victory) {
      const completed = this.saveData.completedChapters || [];
      if (!completed.includes(this.chapterId)) completed.push(this.chapterId);
      this.saveData.completedChapters = completed;
      this.saveData.currentChapter = Math.min(7, this.chapterId + 1);
      // Update roster with current unit states
      this.saveData.roster = SaveManager.serializeRoster(
        this.units.filter(u => !u.dead && u.team === 'player')
      );
      SaveManager.save(this.saveData);
    }

    this.scene.stop('UIScene');
    this.scene.start('VictoryScene', {
      result:   victory ? 'victory' : 'defeat',
      chapter:  this.chapterId,
      saveData: this.saveData,
      levelUps: this._levelUps,
      newUnits: this._newUnits,
    });
  }

  // ==========================================================================
  // LEVEL UP
  // ==========================================================================

  _onLevelUp(unit) {
    this._levelUps.push({ name: unit.name, emoji: unit.emoji, newLevel: unit.level });
    this._floatText(unit.col, unit.row, `Level Up! Lv${unit.level}`, PAL.GOLD);
    // Golden flash
    this.tweens.add({
      targets: unit.spriteBg,
      fillColor: { from: 0xf8d030, to: unit.team === 'player' ? 0x224488 : 0x882222 },
      duration: 600,
    });

    if (unit.canPromote()) {
      this._floatText(unit.col, unit.row, 'Can Promote!', 0xff88ff);
    }
  }

  // ==========================================================================
  // DIALOGUE SYSTEM
  // ==========================================================================

  _startDialogue(lines, onDone) {
    this._dlgQueue  = lines;
    this._dlgIndex  = 0;
    this._dlgOnDone = onDone;
    this._setState(BS.DIALOGUE);
    this._showDialogueLine(this._dlgQueue[0]);
    this._getUI()?.showDialogue(this._dlgQueue[0]);
  }

  _showDialogueLine(line) {
    this._getUI()?.showDialogue(line);
  }

  _advanceDialogue() {
    this._dlgIndex++;
    if (this._dlgIndex >= this._dlgQueue.length) {
      this._getUI()?.hideDialogue();
      if (this._dlgOnDone) this._dlgOnDone();
      return;
    }
    this._showDialogueLine(this._dlgQueue[this._dlgIndex]);
  }

  // ==========================================================================
  // VISUAL EFFECTS
  // ==========================================================================

  _floatText(col, row, text, color) {
    const { x, y } = this._tileCenter(col, row);
    const t = this.add.text(x, y, text, {
      fontSize: '13px',
      color: '#' + color.toString(16).padStart(6, '0'),
      stroke: '#000000',
      strokeThickness: 3,
      fontFamily: 'Courier New, monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: t, y: y - 36, alpha: 0, duration: 1100, ease: 'Power1',
      onComplete: () => t.destroy(),
    });
  }

  _shakeSprite(sprite, onDone) {
    if (!sprite) { onDone && onDone(); return; }
    const origX = sprite.x;
    this.tweens.add({
      targets: sprite,
      x: { from: origX - 4, to: origX + 4 },
      duration: 50, yoyo: true, repeat: 3,
      onComplete: () => { sprite.setX(origX); onDone && onDone(); },
    });
  }

  _healEffect(col, row) {
    const { x, y } = this._tileCenter(col, row);
    for (let i = 0; i < 6; i++) {
      const dot = this.add.circle(
        x + Phaser.Math.Between(-12, 12),
        y + Phaser.Math.Between(-12, 12),
        Phaser.Math.Between(2, 5), 0x44ff88, 0.9
      );
      this.tweens.add({
        targets: dot, y: dot.y - 20, alpha: 0, scaleX: 2, scaleY: 2,
        duration: 500, delay: i * 60,
        onComplete: () => dot.destroy(),
      });
    }
  }

  // Grey out units that have acted
  _dimActedUnits() {
    this.units.forEach(u => {
      if (!u.sprite) return;
      const dim = (u.team === 'player') && (u.hasMoved && u.hasActed);
      const alpha = dim ? 0.45 : 1.0;
      u.sprite.setAlpha(alpha);
      u.spriteBg?.setAlpha(alpha);
    });
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  _setState(state) { this._state = state; }

  _unitAt(col, row) {
    return this.units.find(u => !u.dead && u.col === col && u.row === row) || null;
  }

  _tileCenter(col, row) {
    return {
      x: GRID_X + col * TILE + TILE / 2,
      y: GRID_Y + row * TILE + TILE / 2,
    };
  }

  _tileTL(col, row) {
    return { x: GRID_X + col * TILE, y: GRID_Y + row * TILE };
  }

  _getUI() {
    return this.scene.isActive('UIScene') ? this.scene.get('UIScene') : null;
  }

  _showUnitInfo(unit) {
    this._getUI()?.showUnitInfo(unit);
  }
}
