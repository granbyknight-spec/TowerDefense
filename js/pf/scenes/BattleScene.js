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
  preload() {
    // Load all unit SVG sprites as Phaser textures (self-contained data URIs)
    preloadUnitSprites(this);
  }

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
    this._lastSkillUsed = null;  // skill used in last _executeCombat call
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

    // No background circle — sprites stand on their own.

    // ── SVG face sprite (replaces plain emoji text) ─────────────────────────
    // Scale the 64×64 SVG down to fit inside the circle (r*2 diameter = TILE-6)
    const spriteSize = (r * 2 - 4); // leave 2px padding inside ring
    const sprScale   = spriteSize / 64;

    const sprKey = getSpriteKey(unit);
    let sprite;
    if (this.textures.exists(sprKey)) {
      sprite = this.add.image(x, y - 1, sprKey)
        .setOrigin(0.5)
        .setScale(sprScale);
    } else {
      // Fallback to emoji text if texture somehow not loaded
      sprite = this.add.text(x, y - 2, unit.emoji, { fontSize: '22px' }).setOrigin(0.5);
    }

    // Boss units get a slightly larger sprite to stand out
    if (unit.isBoss && sprite.setScale) {
      sprite.setScale(sprScale * 1.15);
    }

    // ── HP bar background ───────────────────────────────────────────────────
    const hpBg = this.add.rectangle(x, y + r + 3, TILE - 10, 4, 0x000000, 0.7);

    // ── HP bar foreground ───────────────────────────────────────────────────
    const hpBar = this.add.rectangle(x - (TILE - 10) / 2, y + r + 3, TILE - 10, 4, PAL.HP_G, 1);
    hpBar.setOrigin(0, 0.5);

    // ── Class badge label (tiny, below hp bar) ──────────────────────────────
    // Shows first 3 chars of unit class so player units are distinguishable
    const badgeColor = unit.team === 'player' ? '#88bbff'
                     : unit.team === 'neutral' ? '#88ffaa'
                     : '#ff8888';
    const badge = this.add.text(x, y + r + 10, unit.unitClass.slice(0, 4).toUpperCase(), {
      fontSize: '7px',
      color: badgeColor,
      fontFamily: 'Courier New, monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    unit.spriteBg  = null;  // no background circle
    unit.sprite    = sprite;
    unit.hpBarBg   = hpBg;
    unit.hpBar     = hpBar;
    unit.badge     = badge;

    this._unitLayer.add([sprite, hpBg, hpBar, badge]);
    this._updateHPBar(unit);

    // ── Idle bob animation ─────────────────────────────────────────────────
    // Player units gently float up and down to signal readiness
    if (unit.team === 'player') {
      this._startIdleBob(unit);
    }
  }

  // Gentle idle float for player units (stored so it can be killed on act)
  _startIdleBob(unit) {
    if (!unit.sprite) return;
    const baseY = unit.sprite.y;
    const bobTween = this.tweens.add({
      targets: unit.sprite,
      y: { from: baseY - 2, to: baseY + 2 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: Math.random() * 600, // stagger so units don't all bob in sync
    });
    unit._bobTween = bobTween;
  }

  _stopIdleBob(unit) {
    if (unit._bobTween) {
      unit._bobTween.stop();
      unit._bobTween = null;
      // Snap sprite back to its correct y
      if (unit.sprite) {
        const { y } = this._tileCenter(unit.col, unit.row);
        unit.sprite.setY(y - 1);
      }
    }
  }

  // Bounce-pop animation when a unit is selected
  _bounceSprite(unit) {
    if (!unit.sprite) return;
    this._stopIdleBob(unit);
    this.tweens.add({
      targets: unit.sprite,
      scaleX: { from: unit.sprite.scaleX * 1.25, to: unit.sprite.scaleX },
      scaleY: { from: unit.sprite.scaleY * 1.25, to: unit.sprite.scaleY },
      duration: 220,
      ease: 'Back.easeOut',
    });
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
    if (unit.spriteBg) unit.spriteBg.setPosition(x, y);
    unit.sprite.setPosition(x, y - 1);
    unit.hpBarBg.setPosition(x, y + r + 3);
    unit.hpBar.setX(x - (TILE - 10) / 2);
    unit.hpBar.setY(y + r + 3);
    if (unit.badge) unit.badge.setPosition(x, y + r + 10);
    this._updateHPBar(unit);
  }

  _destroyUnitSprite(unit) {
    this._stopIdleBob(unit);
    [unit.spriteBg, unit.sprite, unit.hpBarBg, unit.hpBar, unit.badge].forEach(o => o && o.destroy());
    unit.spriteBg = unit.sprite = unit.hpBarBg = unit.hpBar = unit.badge = null;
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
    if (!unit || unit.dead) return;
    if (unit.team === 'player') {
      // Selectable as long as the unit hasn't both moved AND acted
      if (!(unit.hasMoved && unit.hasActed)) {
        this._selectUnit(unit);
      } else {
        this._showUnitInfo(unit);
      }
    } else {
      // Tap enemy / neutral — show their stats without selecting
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

    // Tap on another friendly unit (still has something to do): switch selection
    if (unit && unit.team === 'player' && !unit.dead && !(unit.hasMoved && unit.hasActed)) {
      this._selectUnit(unit);
      return;
    }

    // Deselect
    this._deselect();
  }

  _handleMovedTap(col, row) {
    const unit = this._unitAt(col, row);
    if (!unit || unit !== this._selected) {
      if (this._preMovPos && col === this._preMovPos.col && row === this._preMovPos.row) {
        this._undoMove();  // tap original tile → undo the move
      } else {
        this._deselect();  // tap anywhere else → cancel / deselect
      }
    }
  }

  _handleAtkTargetTap(col, row) {
    if (!this._atkTiles.some(t => t.col === col && t.row === row)) {
      this._cancelTargeting(); return;
    }
    const target = this._unitAt(col, row);
    if (!target || target.team !== 'enemy') { this._cancelTargeting(); return; }

    this._executeCombat(this._selected, target, () => {
      const unit = this._selected;
      if (!unit) return;
      unit.hasActed = true;
      this._checkEndCondition();
      // If game ended, do nothing further
      if (this._state === BS.VICTORY || this._state === BS.DEFEAT) return;
      if (!unit.hasMoved && !unit.dead) {
        // Unit attacked before moving — still allow a move this turn
        const tiles = getReachableTiles(unit, this.mapGrid, this.units);
        this._moveTiles = tiles;
        this._clearHighlights();
        this._drawMoveHighlights(tiles);
        this._drawSelHighlight(unit);
        this._setState(BS.UNIT_SEL);
        this._getUI()?.showActionMenu(unit, this);  // shows Wait/Item; Attack disabled
      } else {
        this._deselect();
      }
    });
  }

  _handleHealTargetTap(col, row) {
    if (!this._healTiles.some(t => t.col === col && t.row === row)) {
      this._cancelTargeting(); return;
    }
    const target = this._unitAt(col, row);
    if (!target || target.team !== 'player') { this._cancelTargeting(); return; }

    this._executeHeal(this._selected, target);
    const unit = this._selected;
    unit.hasActed = true;
    this._checkEndCondition();
    if (this._state === BS.VICTORY || this._state === BS.DEFEAT) return;
    if (!unit.hasMoved && !unit.dead) {
      // Healed before moving — still allow a move this turn
      const tiles = getReachableTiles(unit, this.mapGrid, this.units);
      this._moveTiles = tiles;
      this._clearHighlights();
      this._drawMoveHighlights(tiles);
      this._drawSelHighlight(unit);
      this._setState(BS.UNIT_SEL);
      this._getUI()?.showActionMenu(unit, this);
    } else {
      this._deselect();
    }
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
    // Show attack-range preview from current position (red overlay)
    if (!unit.hasActed) {
      this._drawAtkHighlights(getAttackTiles(unit, this.mapGrid, unit.col, unit.row));
    }
    this._drawSelHighlight(unit);
    this._setState(BS.UNIT_SEL);
    this._getUI()?.showUnitInfo(unit);
    this._getUI()?.showActionMenu(unit, this);  // action menu visible immediately
    this._dimActedUnits();
    this._bounceSprite(unit);
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

  // Cancel targeting (Attack/Heal) and return to unit-selection state with action menu
  _cancelTargeting() {
    const unit = this._selected;
    if (!unit) { this._deselect(); return; }
    this._atkTiles    = [];
    this._healTiles   = [];
    this._pendingSkill = null;  // discard any queued skill so it doesn't leak to next attack
    this._clearHighlights();
    if (unit.hasMoved) {
      // Was in UNIT_MOVED — just restore sel highlight and menu
      this._drawSelHighlight(unit);
      this._setState(BS.UNIT_MOVED);
    } else {
      // Was in UNIT_SEL — restore move + attack range highlights
      const movTiles = getReachableTiles(unit, this.mapGrid, this.units);
      this._moveTiles = movTiles;
      this._drawMoveHighlights(movTiles);
      if (!unit.hasActed) {
        this._drawAtkHighlights(getAttackTiles(unit, this.mapGrid, unit.col, unit.row));
      }
      this._drawSelHighlight(unit);
      this._setState(BS.UNIT_SEL);
    }
    this._getUI()?.showActionMenu(unit, this);
  }

  _moveSelectedUnit(col, row) {
    const unit = this._selected;
    this._preMovPos = { col: unit.col, row: unit.row };
    this._getUI()?.hideActionMenu();  // hide menu while the walk animation plays

    const path = findPath(unit, col, row, this.mapGrid, this.units);
    this._animateMove(unit, path || [{ col, row }], () => {
      unit.col = col;
      unit.row = row;
      unit.hasMoved = true;
      // Snap sprite to exact tile now that the model is updated
      this._updateSpritePos(unit);
      if (unit.team === 'player' && !unit.hasActed) this._startIdleBob(unit);

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

    // Stop idle bob while moving
    this._stopIdleBob(unit);

    const r = TILE / 2 - 3;
    const badgeY = (col, row) => this._tileCenter(col, row).y + r + 10;
    let step = 0;

    const doStep = () => {
      if (step >= path.length) {
        // NOTE: callers are responsible for updating unit.col/unit.row then
        // calling _updateSpritePos() so the sprite snaps to the exact tile.
        onComplete();
        return;
      }
      const { col, row } = path[step++];
      const { x, y } = this._tileCenter(col, row);
      const hpY  = y + r + 3;
      const bdgY = y + r + 10;

      // Small paw-print trail dot
      if (unit.sprite) {
        const trail = this.add.circle(
          unit.sprite.x, unit.sprite.y + 4,
          3, 0x99bbff, 0.55
        );
        this.tweens.add({ targets: trail, alpha: 0, y: trail.y - 10, duration: 350, onComplete: () => trail.destroy() });
      }

      // Separate tween per display object (different target y values)
      if (unit.spriteBg) this.tweens.add({ targets: unit.spriteBg, x, y,        duration: 120, ease: 'Power1' });
      if (unit.sprite)   this.tweens.add({ targets: unit.sprite,   x, y: y - 1, duration: 120, ease: 'Power1' });
      if (unit.hpBarBg)  this.tweens.add({ targets: unit.hpBarBg,  x, y: hpY,  duration: 120, ease: 'Power1' });
      if (unit.badge)    this.tweens.add({ targets: unit.badge,    x, y: bdgY, duration: 120, ease: 'Power1' });
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

    // MP cost check — cancel immediately if the unit can't afford the skill
    const mpCost = sk.mpCost || 0;
    if (mpCost > 0 && unit.mp < mpCost) {
      this._getUI()?.showMessage(`Not enough MP! (need ${mpCost})`);
      return;
    }

    // Instant buff — no targeting needed
    if (sk.type === 'buff') {
      if (skill === 'guard') {
        if (mpCost > 0) unit.useMp(mpCost);
        unit.guardActive = true;
        unit.hasActed = true;
        this._getUI()?.showUnitInfo(unit); // refresh MP bar
        this._getUI()?.showMessage(`${unit.name} raises their guard!`);
        this._getUI()?.hideActionMenu();
        this._setState(BS.IDLE);
        this._clearHighlights();
        this._deselect();
      }
      return;
    }

    if (sk.targetAlly) {
      // AoE heal (healall) — immediately heal all allies in range without target selection
      if (sk.aoe) {
        if (mpCost > 0) unit.useMp(mpCost);

        const healRange = sk.range || 3;
        const alliesInRange = this.units.filter(u => {
          if (u.dead || u === unit || u.team !== unit.team) return false;
          const dist = Math.abs(u.col - unit.col) + Math.abs(u.row - unit.row);
          return dist <= healRange;
        });

        alliesInRange.forEach(target => {
          const healAmt = Math.floor(unit.atk * Math.abs(sk.power));
          target.hp = Math.min(target.maxHp, target.hp + healAmt);
          this._updateHPBar(target);
          this._floatText(target.col, target.row, `+${healAmt}`, 0x00ff88);
          this._healEffect(target.col, target.row);
        });

        if (alliesInRange.length === 0) {
          this._getUI()?.showMessage('No allies in range!');
          // Refund the MP cost since no one was healed
          if (mpCost > 0) unit.recoverMp(mpCost);
          this._getUI()?.showUnitInfo(unit);
          return;
        }

        unit.hasActed = true;
        unit.hasMoved = true;
        this._getUI()?.showUnitInfo(unit); // refresh MP bar
        this._clearHighlights();
        this._deselect();
        this._checkEndCondition();
        return;
      }

      // Single-target heal — use skill's own range rather than unit's weapon range
      const skillRange = sk.range || unit.range;
      const healTiles = getAttackTiles({ ...unit, range: skillRange }, this.mapGrid, unit.col, unit.row);
      this._healTiles = healTiles;
      this._clearHighlights();
      this._drawHealHighlights(healTiles);
      this._drawSelHighlight(unit);
      this._setState(BS.TARGET_HEAL);
      this._getUI()?.hideActionMenu();
    } else {
      // Offensive skill — use the skill's own range (and minRange if set), not unit's weapon range
      this._pendingSkill = skill;
      const skillRange = sk.range || unit.range;
      const skillOverride = { ...unit, range: skillRange };
      if (sk.minRange) skillOverride.minRange = sk.minRange;
      const atkTiles = getAttackTiles(skillOverride, this.mapGrid, unit.col, unit.row);
      const hasTarget = atkTiles.some(t => {
        const u = this._unitAt(t.col, t.row);
        return u && u.team === 'enemy';
      });
      if (!hasTarget) {
        this._getUI()?.showMessage('No enemies in range!');
        this._pendingSkill = null;
        return;
      }
      this._atkTiles = atkTiles;
      this._clearHighlights();
      this._drawAtkHighlights(atkTiles);
      this._drawSelHighlight(unit);
      this._setState(BS.TARGET_ATK);
      this._getUI()?.hideActionMenu();
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
      // Update SVG sprite to promoted form (swap texture key)
      if (unit.sprite && unit.sprite.setTexture) {
        const newKey = getSpriteKey(unit);
        unit.sprite.setTexture(newKey);
      }
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

  _executeCombat(attacker, defender, onDone, hitNum = 1, skillName = null) {
    this._setState(BS.ANIMATING);
    this._clearHighlights();

    // On the first hit, consume _pendingSkill; on subsequent hits, reuse the passed-in skillName
    if (hitNum === 1) {
      skillName = this._pendingSkill;
      this._pendingSkill = null;
      // Deduct MP cost when the skill is actually executed
      if (skillName) {
        const mpCost = (SKILLS[skillName]?.mpCost) || 0;
        if (mpCost > 0) attacker.useMp(mpCost);
        this._getUI()?.showUnitInfo(attacker); // refresh MP bar in panel
      }
    }
    this._lastSkillUsed = skillName;  // keep updated so noCounter / post-effects always know the skill

    // Combat math
    const atkBonus = skillName ? (SKILLS[skillName].power || 1) : 1;
    const totalHits = (hitNum === 1 && skillName) ? (SKILLS[skillName]?.hits || 1) : 1;

    const terrainDef = TERRAIN[this.mapGrid[defender.row][defender.col]]?.def || 0;
    const guardBonus = defender.guardActive ? Math.floor(defender.def * 0.5) : 0;
    const rawDmg = Math.max(1, attacker.atk - (defender.def + guardBonus + terrainDef));
    const variance = Phaser.Math.Between(0, Math.floor(attacker.atk * 0.15));
    // Apply Math.max(1) after atkBonus and variance so skills with power < 1 can't produce 0 damage
    const dmg = Math.max(1, Math.floor(rawDmg * atkBonus) + variance);

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

          // Counter-attack: defender can retaliate if attacker is within defender's weapon range
          const dist = Math.abs(attacker.col - defender.col) + Math.abs(attacker.row - defender.row);
          const noCounter = this._lastSkillUsed ? (SKILLS[this._lastSkillUsed]?.noCounter || false) : false;
          const canCounter = !noCounter && dist <= defender.range && defender.team === 'enemy';
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
                      this._applyPostCombatEffects(attacker, defender, onDone);
                    }
                  },
                });
              });
            });
          } else {
            if (totalHits > 1 && hitNum < totalHits && !defender.dead) {
              // Fire second hit after short delay
              this.time.delayedCall(200, () => {
                this._executeCombat(attacker, defender, onDone, hitNum + 1, skillName);
              });
            } else {
              this._applyPostCombatEffects(attacker, defender, onDone);
            }
          }
        },
      });
    });
  }

  _applyPostCombatEffects(attacker, defender, onDone) {
    const sk = this._lastSkillUsed ? SKILLS[this._lastSkillUsed] : null;
    if (!sk) { onDone && onDone(); return; }

    // KNOCKBACK (charge)
    if (sk.knockback && !defender.dead) {
      const dx = defender.col - attacker.col;
      const dy = defender.row - attacker.row;
      const len = Math.max(Math.abs(dx), Math.abs(dy)) || 1;
      const nx = defender.col + Math.sign(dx / len);
      const ny = defender.row + Math.sign(dy / len);
      if (nx >= 0 && nx < GCOLS && ny >= 0 && ny < GROWS &&
          TERRAIN[this.mapGrid[ny][nx]]?.passable !== false &&
          !this._unitAt(nx, ny)) {
        defender.col = nx;
        defender.row = ny;
        this._updateSpritePos(defender);
        this._floatText(nx, ny, '↗ Pushed!', 0xffaa44);
      }
    }

    // DIVE REPOSITION (dash) — move attacker adjacent to defender
    if (sk.dive && !defender.dead) {
      const dx = defender.col - attacker.col;
      const dy = defender.row - attacker.row;
      let nx, ny;
      if (Math.abs(dx) >= Math.abs(dy)) {
        nx = attacker.col + Math.sign(dx);
        ny = attacker.row;
      } else {
        nx = attacker.col;
        ny = attacker.row + Math.sign(dy);
      }
      if (nx >= 0 && nx < GCOLS && ny >= 0 && ny < GROWS && !this._unitAt(nx, ny)) {
        attacker.col = nx;
        attacker.row = ny;
        this._updateSpritePos(attacker);
      }
    }

    // SPLASH (fireball) — hit all enemies adjacent to defender
    if (sk.splash && !defender.dead) {
      const splashPower = sk.splash;
      const adjEnemies = this.units.filter(u =>
        !u.dead && u.team === 'enemy' && u !== defender &&
        Math.abs(u.col - defender.col) + Math.abs(u.row - defender.row) === 1
      );
      adjEnemies.forEach(u => {
        const tDef = TERRAIN[this.mapGrid[u.row][u.col]]?.def || 0;
        const sRaw = Math.max(1, attacker.atk - (u.def + tDef));
        const sDmg = Math.max(1, Math.floor(sRaw * splashPower));
        const died = u.takeDamage(sDmg);
        this._updateHPBar(u);
        this._floatText(u.col, u.row, `-${sDmg} Fire`, 0xff6600);
        if (died) this._killUnit(u, () => {});
      });
    }

    // BURN DoT (fireball)
    if (sk.burn && !defender.dead) {
      defender.burnDamage = (defender.burnDamage || 0) + sk.burn;
      this._floatText(defender.col, defender.row, 'Burn!', 0xff4400);
    }

    onDone && onDone();
  }

  _executeHeal(healer, target) {
    const sk = SKILLS['heal'];
    // Use skill power magnitude to scale heal (power is negative to denote healing)
    const skillPower = sk ? Math.abs(sk.power) : 1.0;
    const healAmt = Math.floor(healer.atk * skillPower) + Phaser.Math.Between(2, 6);
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

    // Clear guard buffs from previous player turn
    this.units.filter(u => u.team === 'player').forEach(u => { u.guardActive = false; });

    // Apply burn DoT to all burning units
    this.units.filter(u => !u.dead && u.burnDamage > 0).forEach(u => {
      const bDmg = u.burnDamage;
      u.burnDamage = 0;
      const died = u.takeDamage(bDmg);
      this._updateHPBar(u);
      this._floatText(u.col, u.row, `-${bDmg} Fire`, 0xff4400);
      if (died) this._killUnit(u, () => {});
    });

    this._enemyQueue = this.units.filter(u => !u.dead && u.team === 'enemy');
    // Enemy units need their turn state reset so they can act this turn
    this._enemyQueue.forEach(u => u.resetTurn());

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
    // action.moveTo is already validated by getReachableTiles; follow the full path
    const path = findPath(enemy, action.moveTo.col, action.moveTo.row, this.mapGrid, this.units);

    this._animateMove(enemy, path && path.length > 0 ? path : [action.moveTo], () => {
      enemy.col = action.moveTo.col;
      enemy.row = action.moveTo.row;
      enemy.hasMoved = true;
      // Snap sprite to exact tile now that the model is updated
      this._updateSpritePos(enemy);

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

    // MP recovery — each player unit gains 2 MP at the start of their turn
    this.units.filter(u => !u.dead && u.team === 'player').forEach(u => { u.recoverMp(2); });
    // Refresh UI panel if a unit is currently selected
    if (this._selected) this._getUI()?.showUnitInfo(this._selected);

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

    // Victory: chapter's designated boss is dead (prefer bossId, fall back to any isBoss)
    const boss = chapter.bossId
      ? this.units.find(u => u.id === chapter.bossId)
      : this.units.find(u => u.isBoss);
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
    // Show a victory message and immediately end the battle —
    // no in-battle dialogue loop so the screen never gets stuck.
    this._getUI()?.showMessage('Victory! 🏆');
    this.time.delayedCall(1500, () => this._endBattle(true));
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
    const chapter = CHAPTERS[this.chapterId - 1];
    this.scene.start('VictoryScene', {
      result:        victory ? 'victory' : 'defeat',
      chapter:       this.chapterId,
      saveData:      this.saveData,
      levelUps:      this._levelUps,
      newUnits:      this._newUnits,
      victoryLines:  victory ? (chapter.victory || []) : [],
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
      fontSize: '17px',
      color: '#' + color.toString(16).padStart(6, '0'),
      stroke: '#000000',
      strokeThickness: 4,
      fontFamily: 'Nunito, Courier New, monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: t, y: y - 44, alpha: 0, duration: 1200, ease: 'Power1',
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

  // Grey out units that have acted; stop/start idle bobs accordingly
  _dimActedUnits() {
    this.units.forEach(u => {
      if (!u.sprite) return;
      const dim = (u.team === 'player') && (u.hasMoved && u.hasActed);
      const alpha = dim ? 0.45 : 1.0;
      u.sprite.setAlpha(alpha);
      u.spriteBg?.setAlpha(alpha);
      u.badge?.setAlpha(alpha);
      // Stop bob for acted units, restart for ready ones
      if (u.team === 'player') {
        if (dim) {
          this._stopIdleBob(u);
        } else if (!u._bobTween) {
          this._startIdleBob(u);
        }
      }
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
