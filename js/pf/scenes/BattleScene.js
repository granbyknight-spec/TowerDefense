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
    // Audio (graceful — files are optional and may not exist yet)
    AudioManager.preloadMusic(this);
    AudioManager.preloadSFX(this);
    // Battle background for current chapter (graceful — file may not exist)
    try {
      const bgKey = `bg_ch${this.chapterId}`;
      this.load.image(bgKey, `assets/backgrounds/chapter_${this.chapterId}_v1.png`);
    } catch (e) {
      // silently skip if the file doesn't exist
    }
    // Enemy portrait/sprite PNG overrides (graceful — fall back to SVG if missing)
    // File naming convention: assets/enemies/<lowercase_id>_v1.png
    const ENEMY_PNG_IDS = [
      'SCOUT_CAT',
      'ALLEY_CAT',
      'SIAMESE_ASSASSIN',
      'PERSIAN_SORCERER',
      'TIGER_GENERAL',
      'LYNX_RANGER',
      'SNOW_LEOPARD',
      'RIVER_PANTHER',
      'SAND_CAT_KING',
      'PERSIAN_QUEEN',
      'CAT_EMPEROR',
    ];
    ENEMY_PNG_IDS.forEach(id => {
      const pngKey = `enemy_png_${id}`;
      if (!this.textures.exists(pngKey)) {
        const fileName = id.toLowerCase() + '_v1.png';
        try {
          this.load.image(pngKey, `assets/enemies/${fileName}`);
        } catch (e) {
          // silently skip — SVG fallback will be used
        }
      }
    });
    // Terrain tile PNGs (graceful — fall back to colored graphics if missing)
    TERRAIN.forEach((td, i) => {
      const key = `terrain_${i}`;
      if (!this.textures.exists(key)) {
        try {
          this.load.image(key, `assets/terrain/${td.name.toLowerCase()}_v1.png`);
        } catch (e) {
          // silently skip — colored rectangle fallback used in _buildMap
        }
      }
    });
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
    this._battleEnded = false; // latch: prevents _endBattle from firing twice
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

    // ── Track battle participation ───────────────────────────────────────────
    this.units.filter(u => u.team === 'player').forEach(u => u.battlesParticipated++);

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

    // ── Battle stats for win screen ─────────────────────────────────────────
    this._totalDamageDealt = 0;
    this._unitsLost        = 0;

    // ── Battle background image (depth -10, behind grid/tiles) ───────────────
    const bgKey = `bg_ch${this.chapterId}`;
    if (this.textures.exists(bgKey)) {
      this.add.image(GAME_W / 2, GAME_H / 2, bgKey)
        .setDisplaySize(GAME_W, GAME_H)
        .setDepth(-10)
        .setAlpha(0.35);
    }

    // ── Build map and sprites ────────────────────────────────────────────────
    this._buildMap();
    this._buildHighlightLayers();
    this._buildUnitSprites();
    this._buildGridOverlay();

    // ── Battle music ─────────────────────────────────────────────────────────
    if (this.cache.audio.exists('battle')) {
      AudioManager.playMusic(this, 'battle');
    } else {
      this.load.once('complete', () => AudioManager.playMusic(this, 'battle'));
      this.load.start();
    }

    // ── UIScene overlay (runs parallel) ─────────────────────────────────────
    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene', { battleScene: this });
    } else {
      this.scene.get('UIScene').reset(this);
    }

    // ── Input ────────────────────────────────────────────────────────────────
    this.input.on('pointerdown', this._onTap, this);

    // ── Opening dialogue → boss intro → IDLE ─────────────────────────────────
    const intro    = chapter.intro || [];
    const afterIntro = () => {
      const bossUnit = chapter.bossId
        ? this.units.find(u => u.id === chapter.bossId && !u.dead)
        : this.units.find(u => u.isBoss && !u.dead);
      if (bossUnit) {
        this._showBossIntro(bossUnit, () => this._setState(BS.IDLE));
      } else {
        this._setState(BS.IDLE);
      }
    };
    if (intro.length > 0) {
      this._startDialogue(intro, afterIntro);
    } else {
      afterIntro();
    }
  }

  // ==========================================================================
  // MAP RENDERING
  // ==========================================================================

  _buildMap() {
    this._tileGfx = this.add.graphics().setDepth(-4); // above terrain PNG images (-5)
    const g = this._tileGfx;

    for (let row = 0; row < GROWS; row++) {
      for (let col = 0; col < GCOLS; col++) {
        const tid = this.mapGrid[row][col];
        const td  = TERRAIN[tid];
        const x   = GRID_X + col * TILE;
        const y   = GRID_Y + row * TILE;

        // Base tile — use PNG if loaded, otherwise colored rectangle
        const terrainTexKey = `terrain_${tid}`;
        if (this.textures.exists(terrainTexKey)) {
          this.add.image(x + TILE / 2, y + TILE / 2, terrainTexKey)
            .setDisplaySize(TILE, TILE)
            .setAlpha(0.35)
            .setDepth(-5);
        } else {
          g.fillStyle(td.color, 1);
          g.fillRect(x, y, TILE, TILE);
          // Terrain detail icons (only needed for graphic fallback)
          this._drawTerrainDetail(g, tid, x, y);
        }

        // Highlight top-left edge (lighter) — drawn over PNG or graphic
        g.fillStyle(td.hi, 0.4);
        g.fillRect(x, y, TILE, 2);
        g.fillRect(x, y, 2, TILE);

        // Dark bottom-right edge
        g.fillStyle(0x000000, 0.25);
        g.fillRect(x + TILE - 2, y, 2, TILE);
        g.fillRect(x, y + TILE - 2, TILE, 2);
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
    g.lineStyle(1, 0x000000, 0.28);
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

    // ── SVG face sprite (replaces plain emoji text) ─────────────────────────
    // Scale the 64×64 SVG down to fit inside the circle (r*2 diameter = TILE-6)
    const spriteSize = (r * 2 - 4); // leave 2px padding inside ring
    const sprScale   = spriteSize / 64;

    const sprKey = getSpriteKey(unit);
    // For enemy units, prefer the PNG sprite override over the SVG if it loaded
    const pngKey = `enemy_png_${unit.id}`;
    const useEnemyPng = unit.team === 'enemy' && this.textures.exists(pngKey);

    const activeKey = useEnemyPng ? pngKey : sprKey;
    let sprite;
    if (this.textures.exists(activeKey)) {
      sprite = this.add.image(x, y - 1, activeKey).setOrigin(0.5);
      if (useEnemyPng) {
        // AI-generated PNGs can be any resolution — fit to tile size
        const fitSize = spriteSize * (unit.isBoss ? 1.15 : 1);
        sprite.setDisplaySize(fitSize, fitSize);
        // Circular mask so the white PNG background is clipped to a circle.
        // The mask graphics is not added to the display list — it only defines
        // the clip region. We redraw it each frame so it follows the sprite.
        const maskGfx = this.make.graphics({ x: 0, y: 0, add: false });
        const drawMask = (mx, my) => {
          maskGfx.clear();
          maskGfx.fillStyle(0xffffff);
          maskGfx.fillCircle(mx, my, r);
        };
        drawMask(x, y - 1);
        sprite.setMask(maskGfx.createGeometryMask());
        const onUpdate = () => {
          if (sprite.active) drawMask(sprite.x, sprite.y);
          else this.events.off('update', onUpdate);
        };
        this.events.on('update', onUpdate);
        unit._spriteMask   = maskGfx;
        unit._spriteMaskCb = onUpdate;
      } else {
        sprite.setScale(sprScale);
      }
    } else {
      // Fallback to emoji text if texture somehow not loaded
      sprite = this.add.text(x, y - 2, unit.emoji, { fontSize: '22px' }).setOrigin(0.5);
    }

    // Boss units get a slightly larger sprite to stand out
    if (unit.isBoss && sprite.setScale && !useEnemyPng) {
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
    if (unit._spriteMaskCb) this.events.off('update', unit._spriteMaskCb);
    [unit._spriteMask, unit.spriteBg, unit.sprite, unit.hpBarBg, unit.hpBar, unit.badge].forEach(o => o && o.destroy());
    unit._spriteMask = unit._spriteMaskCb = unit.spriteBg = unit.sprite = unit.hpBarBg = unit.hpBar = unit.badge = null;
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
      g.fillStyle(PAL.MOVE_HL, 0.35);
      g.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      g.lineStyle(2, 0x88aaff, 0.9);
      g.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
    });
  }

  _drawAtkHighlights(tiles) {
    const g = this._hlAtk;
    g.clear();
    tiles.forEach(({ col, row }) => {
      const { x, y } = this._tileTL(col, row);
      g.fillStyle(PAL.ATK_HL, 0.35);
      g.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      g.lineStyle(2, 0xff6666, 0.9);
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
    g.lineStyle(4, PAL.SEL_HL, 1);
    g.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
    // Animated corner marks
    const sz = 8;
    g.lineStyle(4, PAL.GOLD, 1);
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

      // Terrain landing feedback (Shining Force "land effect" display)
      this._showTerrainLanding(unit);

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

    const stepDur = Math.max(70, 160 - unit.mov * 8);

    const doStep = () => {
      if (step >= path.length) {
        // NOTE: callers are responsible for updating unit.col/unit.row then
        // calling _updateSpritePos() so the sprite snaps to the exact tile.
        onComplete();
        return;
      }
      const isLastStep = (step === path.length - 1);
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
      if (unit.spriteBg) this.tweens.add({ targets: unit.spriteBg, x, y,        duration: stepDur, ease: 'Power1' });
      if (unit.sprite)   this.tweens.add({ targets: unit.sprite,   x, y: y - 1, duration: stepDur, ease: 'Power1' });
      if (unit.hpBarBg)  this.tweens.add({ targets: unit.hpBarBg,  x, y: hpY,  duration: stepDur, ease: 'Power1' });
      if (unit.badge)    this.tweens.add({ targets: unit.badge,    x, y: bdgY, duration: stepDur, ease: 'Power1' });
      if (unit.hpBar) {
        this.tweens.add({
          targets: unit.hpBar,
          x: x - (TILE - 10) / 2,
          y: hpY,
          duration: stepDur,
          ease: 'Power1',
          onComplete: () => {
            if (isLastStep && unit.sprite) {
              const sprite = unit.sprite;
              this.tweens.add({
                targets: sprite,
                scaleX: 1.25, scaleY: 0.75,
                duration: 60, yoyo: true, ease: 'Back.easeOut',
              });
            }
            doStep();
          },
        });
      } else {
        if (isLastStep && unit.sprite) {
          const sprite = unit.sprite;
          this.tweens.add({
            targets: sprite,
            scaleX: 1.25, scaleY: 0.75,
            duration: 60, yoyo: true, ease: 'Back.easeOut',
          });
        }
        this.time.delayedCall(stepDur + 5, doStep);
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

  onActionMagic(skillIndexOrName) {
    const unit = this._selected;
    if (!unit || !unit.skills.length) return;

    // If no specific skill was provided, show the skill selector sub-menu instead
    if (skillIndexOrName === undefined || skillIndexOrName === null) {
      this._getUI()?.showSkillMenu(unit, this);
      return;
    }

    // Resolve skill by index (number) or name/key (string)
    let skill;
    if (typeof skillIndexOrName === 'number') {
      skill = unit.skills[skillIndexOrName];
    } else {
      // Find by skill key (e.g. 'fireball') — must exist in the unit's skill list
      skill = unit.skills.find(s => s === skillIndexOrName);
    }
    if (!skill) return;

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

  onActionItem(itemIndex = 0) {
    const unit = this._selected;
    if (!unit || unit.items.length === 0) {
      this._getUI()?.showMessage('No items!');
      return;
    }
    // Use item at the specified index (default 0)
    const idx    = Math.min(itemIndex, unit.items.length - 1);
    const itemId = unit.items[idx];
    const item   = ITEMS[itemId];
    if (item && item.heal) {
      const healed = unit.heal(item.heal);
      unit.items.splice(idx, 1);
      this._updateHPBar(unit);
      this._floatText(unit.col, unit.row, `+${healed} HP`, PAL.HP_G);
      unit.hasActed = true;
      this._checkEndCondition();
      this._deselect();
    } else if (item && item.promote && unit.canPromote()) {
      unit.items.splice(idx, 1);
      this._runPromotionCeremony(unit, () => {
        unit.hasActed = true;
        this._checkEndCondition();
        this._deselect();
      });
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
    if (this._state === BS.VICTORY   || this._state === BS.DEFEAT)    return;
    this._deselect();
    this._beginEnemyTurn();
  }

  // ==========================================================================
  // COMBAT
  // ==========================================================================

  _executeCombat(attacker, defender, onDone, hitNum = 1, skillName = null, isDouble = false) {
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
    const isMagicSkill = skillName ? (SKILLS[skillName].type === 'magic') : false;

    // Hit/Miss check — AGI-adjusted; magic is more accurate
    const agiDiff = attacker.agi - defender.agi;
    const baseHit  = isMagicSkill ? 95 : 88;
    const hitChance = Phaser.Math.Clamp(baseHit + agiDiff * 2, 55, 100);
    const hitRoll   = Phaser.Math.Between(1, 100);
    const didHit    = hitRoll <= hitChance;

    // Crit check — only on hits; AGI advantage raises crit chance
    const baseCrit  = isMagicSkill ? 4 : 8;
    const critChance = Phaser.Math.Clamp(baseCrit + Math.max(0, agiDiff), 2, 30);
    const critRoll   = Phaser.Math.Between(1, 100);
    const isCrit     = didHit && (critRoll <= critChance);

    const terrainDef = TERRAIN[this.mapGrid[defender.row][defender.col]]?.def || 0;
    const guardBonus = defender.guardActive ? Math.floor(defender.def * 0.5) : 0;
    const rawDmg = Math.max(1, attacker.atk - (defender.def + guardBonus + terrainDef));
    const variance = Phaser.Math.Between(0, Math.floor(attacker.atk * 0.15));
    // Apply Math.max(1) after atkBonus and variance so skills with power < 1 can't produce 0 damage
    const baseDmg = Math.max(1, Math.floor(rawDmg * atkBonus) + variance);
    const dmg = isCrit ? Math.floor(baseDmg * 1.5) : baseDmg;

    // Attack animation
    this._shakeSprite(attacker.sprite, () => {
      // On a miss, show EVADE text and bail early
      if (!didHit) {
        this._floatText(defender.col, defender.row, 'EVADE!', 0xaaddff, 20);
        // Still check AGI double-attack after a miss
        const afterMiss = () => {
          if (!isDouble && !attacker.dead && !defender.dead &&
              (attacker.agi - defender.agi) >= 4) {
            this.time.delayedCall(200, () => {
              this._executeCombat(attacker, defender, onDone, 1, null, true);
            });
          } else {
            onDone && onDone();
          }
        };
        this.time.delayedCall(500, afterMiss);
        return;
      }

      // Flash defender
      this.tweens.add({
        targets: [defender.spriteBg, defender.sprite],
        alpha: 0.2, duration: 60, yoyo: true, repeat: isCrit ? 4 : 2,
        onComplete: () => {
          const died = defender.takeDamage(dmg);
          this._totalDamageDealt += dmg;
          this._updateHPBar(defender);
          // Play attack SFX based on skill type (magic vs physical)
          const _sk = skillName ? SKILLS[skillName] : null;
          if (_sk && _sk.type === 'magic') {
            AudioManager.play(this, 'magic_cast');
          } else {
            AudioManager.play(this, 'attack_slash');
          }
          const defSprite = defender.sprite;
          if (defSprite && defSprite.setTint) {
            defSprite.setTint(isCrit ? 0xffaa00 : 0xff4444);
            this.time.delayedCall(isCrit ? 250 : 150, () => defSprite.clearTint());
          }
          if (isCrit) {
            this._floatCritBanner(defender.col, defender.row);
            this._floatText(defender.col, defender.row, `-${dmg}`, 0xffd700, 26);
          } else {
            this._floatText(defender.col, defender.row, `-${dmg}`, PAL.HP_R);
          }

          // EXP gain
          const expGain = 10 + Math.floor(dmg / 2);
          const leveled = attacker.gainExp(expGain);
          if (leveled) this._onLevelUp(attacker);

          if (died) {
            if (attacker.team === 'player') attacker.killCount++;
            this._killUnit(defender, () => {
              // Counter-attack possible for melee defenders?
              // (no counter if dead)
              onDone && onDone();
            });
            return;
          }

          // Counter-attack: defender can retaliate if attacker is within defender's weapon range
          const dist = Math.abs(attacker.col - defender.col) + Math.abs(attacker.row - defender.row);
          // Wrap onDone to check for AGI double-attack after the full sequence resolves
          const afterSequence = () => {
            if (!isDouble && !attacker.dead && !defender.dead &&
                (attacker.agi - defender.agi) >= 4) {
              this._floatText(attacker.col, attacker.row, '2×', PAL.GOLD);
              this.time.delayedCall(200, () => {
                this._executeCombat(attacker, defender, onDone, 1, null, true);
              });
            } else {
              onDone && onDone();
            }
          };

          const noCounter = this._lastSkillUsed ? (SKILLS[this._lastSkillUsed]?.noCounter || false) : false;
          const canCounter = !noCounter && dist <= defender.range && defender.team === 'enemy';
          if (canCounter) {
            const cDef = TERRAIN[this.mapGrid[attacker.row][attacker.col]]?.def || 0;
            const cRaw = Math.max(1, defender.atk - (attacker.def + cDef));
            const cVar = Phaser.Math.Between(0, Math.floor(defender.atk * 0.1));
            // Counter-attack hit/crit check (enemy counters)
            const cAgiDiff  = defender.agi - attacker.agi;
            const cHitChance = Phaser.Math.Clamp(85 + cAgiDiff * 2, 55, 100);
            const cHit       = Phaser.Math.Between(1, 100) <= cHitChance;
            const cCrit      = cHit && (Phaser.Math.Between(1, 100) <= Phaser.Math.Clamp(6 + Math.max(0, cAgiDiff), 2, 25));
            const cBaseDmg   = cRaw + cVar;
            const cDmg       = cCrit ? Math.floor(cBaseDmg * 1.5) : cBaseDmg;

            this.time.delayedCall(300, () => {
              this._shakeSprite(defender.sprite, () => {
                if (!cHit) {
                  this._floatText(attacker.col, attacker.row, 'EVADE!', 0xaaddff, 20);
                  this.time.delayedCall(400, () => this._applyPostCombatEffects(attacker, defender, afterSequence));
                  return;
                }
                this.tweens.add({
                  targets: [attacker.spriteBg, attacker.sprite],
                  alpha: 0.2, duration: 60, yoyo: true, repeat: cCrit ? 4 : 2,
                  onComplete: () => {
                    const aDied = attacker.takeDamage(cDmg);
                    this._updateHPBar(attacker);
                    if (cCrit) {
                      this._floatCritBanner(attacker.col, attacker.row);
                      this._floatText(attacker.col, attacker.row, `-${cDmg}`, 0xffd700, 26);
                    } else {
                      this._floatText(attacker.col, attacker.row, `-${cDmg}`, 0xff8844);
                    }
                    const expGain2 = Math.floor(cDmg / 3);
                    const leveled2 = defender.gainExp(expGain2);
                    if (leveled2) this._onLevelUp(defender);

                    if (aDied) {
                      if (defender.team === 'player') defender.killCount++;
                      this._killUnit(attacker, onDone);
                    } else {
                      this._applyPostCombatEffects(attacker, defender, afterSequence);
                    }
                  },
                });
              });
            });
          } else {
            if (totalHits > 1 && hitNum < totalHits && !defender.dead) {
              // Fire second hit after short delay
              this.time.delayedCall(200, () => {
                this._executeCombat(attacker, defender, onDone, hitNum + 1, skillName, isDouble);
              });
            } else {
              this._applyPostCombatEffects(attacker, defender, afterSequence);
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
          (TERRAIN[this.mapGrid[ny][nx]]?.movCost ?? 99) < 99 &&
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
      defender.burnStacks = (defender.burnStacks || 0) + sk.burn;
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
    AudioManager.play(this, 'heal');
    const targetSprite = target.sprite;
    if (targetSprite && targetSprite.setTint) {
      targetSprite.setTint(0x44ff88);
      this.time.delayedCall(200, () => targetSprite.clearTint());
    }
    this._floatText(target.col, target.row, `+${actual} HP`, PAL.HP_G);

    const expGain = 15;
    const leveled = healer.gainExp(expGain);
    if (leveled) this._onLevelUp(healer);

    // Spark effect on target
    this._healEffect(target.col, target.row);
  }

  _killUnit(unit, onDone) {
    AudioManager.play(this, 'unit_death');
    this.tweens.add({
      targets: [unit.spriteBg, unit.sprite, unit.hpBar, unit.hpBarBg],
      alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 400,
      ease: 'Power2',
      onComplete: () => {
        this._destroyUnitSprite(unit);
        unit.dead = true;
        if (unit.team === 'player') this._unitsLost++;
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
    this._getUI()?.showTurnBanner('Enemy Turn', 0xff4444);

    // Clear guard buffs from previous player turn
    this.units.filter(u => u.team === 'player').forEach(u => { u.guardActive = false; });

    // Apply burn DoT to all burning units
    this.units.filter(u => !u.dead && u.burnStacks > 0).forEach(u => {
      const bDmg = u.burnStacks;
      u.burnStacks--;
      const died = u.takeDamage(bDmg);
      this._updateHPBar(u);
      AudioManager.play(this, 'burn_crackle');
      this._floatText(u.col, u.row, `-${bDmg} Fire`, 0xff4400);
      if (died) this._killUnit(u, () => {});
    });

    this._enemyQueue = this.units.filter(u => !u.dead && u.team === 'enemy');
    // Enemy units need their turn state reset so they can act this turn
    this._enemyQueue.forEach(u => u.resetTurn());

    this.time.delayedCall(800, () => this._processNextEnemy());
  }

  _processNextEnemy() {
    if (this._state === BS.VICTORY || this._state === BS.DEFEAT) return;
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
          if (this._state === BS.VICTORY || this._state === BS.DEFEAT) return;
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

    // MP recovery — each player unit recovers 20% of max MP at the start of their turn
    this.units.filter(u => !u.dead && u.team === 'player').forEach(u => { u.recoverMp(Math.max(1, Math.round(u.maxMp * 0.20))); });
    // Refresh UI panel if a unit is currently selected
    if (this._selected) this._getUI()?.showUnitInfo(this._selected);

    this._setState(BS.IDLE);
    this._dimActedUnits();
    this._getUI()?.showTurnBanner('Your Turn', 0xf8c030);
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
    if (this._battleEnded) return;
    this._battleEnded = true;
    // Save progress
    if (victory) {
      const completed = this.saveData.completedChapters || [];
      if (!completed.includes(this.chapterId)) completed.push(this.chapterId);
      this.saveData.completedChapters = completed;
      this.saveData.currentChapter = Math.min(7, this.chapterId + 1);
      // Update roster with current unit states
      // Revive any fallen heroes and apply inter-chapter training bonus: +2 maxHp, +1 ATK per hero
      const survivors = this.units.filter(u => u.team === 'player');
      survivors.forEach(u => {
        if (u.dead) {
          u.dead = false;
        }
        u.maxHp += 2;
        u.hp = u.maxHp;
        u.atk += 1;
      });
      this.saveData.roster = SaveManager.serializeRoster(survivors);
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
      totalDamage:   this._totalDamageDealt,
      unitsLost:     this._unitsLost,
      turns:         this.turnNumber,
    });
  }

  // ==========================================================================
  // PROMOTION CEREMONY
  // ==========================================================================

  _runPromotionCeremony(unit, onDone) {
    this._setState(BS.ANIMATING);
    const W = GAME_W, H = GAME_H;
    const { x: ux, y: uy } = this._tileCenter(unit.col, unit.row);

    // Snapshot stats BEFORE promotion for comparison card
    const beforeName = unit.name;
    const beforeEmoji = unit.emoji;
    const beforeStats = { hp: unit.maxHp, atk: unit.atk, def: unit.def, mov: unit.mov, agi: unit.agi };

    // ── Phase 1: bright white flash + rising gold light rays ──────────────
    const overlay = this.add.rectangle(W/2, H/2, W, H, 0xffffff, 0).setDepth(50);
    this.tweens.add({ targets: overlay, alpha: 0.85, duration: 300, yoyo: true, onComplete: () => overlay.destroy() });
    this.cameras.main.shake(120, 0.012);

    // Gold light-ray particles bursting from unit
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const ray = this.add.rectangle(ux, uy, 3, Phaser.Math.Between(20, 60), 0xffd700, 0.9)
        .setRotation(angle).setDepth(48);
      this.tweens.add({
        targets: ray,
        x: ux + Math.cos(angle) * 80,
        y: uy + Math.sin(angle) * 80,
        alpha: 0,
        scaleY: 0.2,
        duration: 700,
        delay: i * 20,
        ease: 'Power2',
        onComplete: () => ray.destroy(),
      });
    }

    // Sparkle dots
    for (let i = 0; i < 20; i++) {
      const dot = this.add.circle(
        ux + Phaser.Math.Between(-50, 50),
        uy + Phaser.Math.Between(-50, 50),
        Phaser.Math.Between(3, 7), 0xffd700, 1
      ).setDepth(49);
      this.tweens.add({
        targets: dot, alpha: 0, y: dot.y - Phaser.Math.Between(30, 70),
        duration: 800, delay: i * 30,
        onComplete: () => dot.destroy(),
      });
    }

    // ── Phase 2: apply promotion & swap sprite ─────────────────────────────
    this.time.delayedCall(400, () => {
      unit.promote();
      if (unit.sprite && unit.sprite.setTexture) {
        unit.sprite.setTexture(getSpriteKey(unit));
      }
      AudioManager.play(this, 'level_up');

      // Promoted class name banner
      this._floatText(unit.col, unit.row, `${unit.emoji} ${unit.name}!`, 0xffd700, 20);

      // ── Phase 3: stat comparison card after 700ms ──────────────────────
      this.time.delayedCall(700, () => {
        this._showPromotionCard(unit, beforeName, beforeEmoji, beforeStats, () => {
          this._setState(BS.UNIT_MOVED);
          onDone && onDone();
        });
      });
    });
  }

  _showPromotionCard(unit, beforeName, beforeEmoji, beforeStats, onDone) {
    const W = GAME_W, H = GAME_H;
    const cardW = 300, cardH = 220, cardX = (W - cardW) / 2, cardY = (H - cardH) / 2 - 20;

    // Semi-transparent dark backdrop
    const backdrop = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.65).setDepth(55).setInteractive();

    const cardBg = this.add.graphics().setDepth(56);
    cardBg.fillStyle(0x0a1a2e, 0.98);
    cardBg.fillRoundedRect(cardX, cardY, cardW, cardH, 12);
    cardBg.lineStyle(2, 0xffd700, 0.9);
    cardBg.strokeRoundedRect(cardX, cardY, cardW, cardH, 12);

    const cx = cardX + cardW / 2;
    // Header
    this.add.text(cx, cardY + 18, '★  PROMOTION!  ★', {
      fontSize: '18px', color: '#ffd700', fontStyle: 'bold',
      fontFamily: 'Nunito, Courier New, monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(57);

    // Before → After names
    this.add.text(cx, cardY + 46, `${beforeEmoji} ${beforeName}  →  ${unit.emoji} ${unit.name}`, {
      fontSize: '13px', color: '#aaddff', fontStyle: 'bold',
      fontFamily: 'Nunito, Courier New, monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(57);

    // Stat diff rows
    const stats = [
      { label: 'HP',  before: beforeStats.hp,  after: unit.maxHp },
      { label: 'ATK', before: beforeStats.atk, after: unit.atk  },
      { label: 'DEF', before: beforeStats.def, after: unit.def  },
      { label: 'MOV', before: beforeStats.mov, after: unit.mov  },
      { label: 'AGI', before: beforeStats.agi, after: unit.agi  },
    ];
    let sy = cardY + 72;
    stats.forEach(s => {
      const diff = s.after - s.before;
      const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
      const diffCol = diff > 0 ? '#44ff88' : (diff < 0 ? '#ff4444' : '#888888');
      this.add.text(cardX + 28, sy, `${s.label}:  ${s.before}  →  ${s.after}`, {
        fontSize: '14px', color: '#ccddff', fontStyle: 'bold',
        fontFamily: 'Nunito, Courier New, monospace',
        stroke: '#000', strokeThickness: 2,
      }).setDepth(57);
      this.add.text(cardX + cardW - 28, sy, diffStr, {
        fontSize: '14px', color: diffCol, fontStyle: 'bold',
        fontFamily: 'Nunito, Courier New, monospace',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(1, 0).setDepth(57);
      sy += 22;
    });

    // Tap to continue hint
    const hint = this.add.text(cx, cardY + cardH - 18, '▶ TAP TO CONTINUE', {
      fontSize: '12px', color: '#aabbcc', fontStyle: 'bold',
      fontFamily: 'Nunito, Courier New, monospace',
    }).setOrigin(0.5).setDepth(57);
    this.tweens.add({ targets: hint, alpha: { from: 0.3, to: 1 }, duration: 600, yoyo: true, repeat: -1 });

    // Tap anywhere on card/backdrop to dismiss
    backdrop.on('pointerdown', dismiss);
    const dismiss = () => {
      backdrop.destroy();
      cardBg.destroy();
      // destroy all text objects we added (use depth tag via getAllChildren is harder, so just schedule cleanup)
      this.time.delayedCall(50, onDone);
    };
    backdrop.on('pointerdown', dismiss);
  }

  // ==========================================================================
  // LEVEL UP
  // ==========================================================================

  _onLevelUp(unit) {
    this._levelUps.push({ name: unit.name, emoji: unit.emoji, newLevel: unit.level });
    AudioManager.play(this, 'level_up');
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

  _floatText(col, row, text, color, size = 17) {
    const { x, y } = this._tileCenter(col, row);
    const t = this.add.text(x, y, text, {
      fontSize: `${size}px`,
      color: '#' + color.toString(16).padStart(6, '0'),
      stroke: '#000000',
      strokeThickness: size > 20 ? 5 : 4,
      fontFamily: 'Nunito, Courier New, monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({
      targets: t,
      y: y - (size > 20 ? 60 : 44),
      alpha: 0,
      scaleX: size > 20 ? 1.4 : 1,
      scaleY: size > 20 ? 1.4 : 1,
      duration: size > 20 ? 900 : 1200,
      ease: 'Power1',
      onComplete: () => t.destroy(),
    });
  }

  // "★ CRITICAL! ★" screen flash + banner — called in parallel with damage float
  _floatCritBanner(col, row) {
    // Quick white flash over the whole scene
    const flash = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0xffffff, 0.55)
      .setDepth(30);
    this.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });

    // Screen shake via camera
    this.cameras.main.shake(180, 0.014);

    // Large "★ CRITICAL! ★" text rising from the tile
    const { x, y } = this._tileCenter(col, row);
    const banner = this.add.text(x, y - 10, '★ CRITICAL! ★', {
      fontSize: '22px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 6,
      fontFamily: 'Nunito, Courier New, monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({
      targets: banner,
      y: y - 70,
      alpha: 0,
      duration: 1100,
      ease: 'Power2',
      onComplete: () => banner.destroy(),
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

  // Show terrain name + DEF bonus briefly when a unit lands on a defensive tile
  _showTerrainLanding(unit) {
    const tid  = this.mapGrid[unit.row][unit.col];
    const terr = TERRAIN[tid];
    if (!terr || terr.def <= 0) return; // only show on tiles with a defense bonus

    const defIcons = ['', '🛡', '🛡🛡', '🛡🛡🛡'];
    const icon  = defIcons[Math.min(terr.def, 3)];
    const label = `${terr.name}  ${icon} +${terr.def} DEF`;

    const W = GAME_W;
    const bannerY = GRID_Y + GROWS * TILE - 22; // just above the UI panel
    const bg = this.add.graphics().setDepth(18);
    bg.fillStyle(0x000000, 0.72);
    bg.fillRoundedRect(GRID_X + 4, bannerY - 14, GW - 8, 24, 6);

    const txt = this.add.text(W / 2, bannerY - 2, label, {
      fontSize: '14px',
      color: '#88ddff',
      stroke: '#000000',
      strokeThickness: 3,
      fontFamily: 'Nunito, Courier New, monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(19);

    this.tweens.add({
      targets: [bg, txt],
      alpha: 0,
      duration: 500,
      delay: 1200,
      onComplete: () => { bg.destroy(); txt.destroy(); },
    });
  }

  // ==========================================================================
  // BOSS INTRODUCTION
  // ==========================================================================

  _showBossIntro(bossUnit, onDone) {
    this._setState(BS.ANIMATING);
    const W = GAME_W, H = GAME_H;

    // Darken the scene
    const shade = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0).setDepth(40);
    this.tweens.add({ targets: shade, alpha: 0.6, duration: 400 });

    // Red glow pulse on the boss sprite
    if (bossUnit.spriteBg) {
      this.tweens.add({
        targets: bossUnit.spriteBg,
        fillColor: { from: 0x882222, to: 0xff2200 },
        duration: 300, yoyo: true, repeat: 3,
      });
    }

    // Boss frame — slides in from top
    const frameH = 90, frameY = H / 2 - 45;
    const frameBg = this.add.graphics().setDepth(42);
    frameBg.fillStyle(0x1a0000, 0.95);
    frameBg.fillRect(0, frameY, W, frameH);
    frameBg.lineStyle(2, 0xff2200, 0.9);
    frameBg.lineBetween(0, frameY, W, frameY);
    frameBg.lineBetween(0, frameY + frameH, W, frameY + frameH);
    frameBg.setY(-frameH);
    this.tweens.add({ targets: frameBg, y: 0, duration: 350, ease: 'Back.easeOut' });

    // Boss emoji (large)
    const bossEmoji = this.add.text(W / 2, frameY + frameH / 2 - 18, bossUnit.emoji, {
      fontSize: '48px',
    }).setOrigin(0.5).setDepth(43).setAlpha(0);

    // Boss name
    const bossLabel = this.add.text(W / 2, frameY + frameH / 2 + 20, bossUnit.name.toUpperCase(), {
      fontSize: '20px', color: '#ff4444',
      stroke: '#000000', strokeThickness: 5,
      fontFamily: 'Nunito, Courier New, monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(43).setAlpha(0);

    const bossClass = this.add.text(W / 2, frameY + frameH / 2 + 44,
      `${bossUnit.unitClass}  ·  LV ${bossUnit.level}`, {
        fontSize: '13px', color: '#ff9999',
        stroke: '#000000', strokeThickness: 3,
        fontFamily: 'Nunito, Courier New, monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(43).setAlpha(0);

    const tagline = this.add.text(W / 2, frameY + 8, '— ENEMY COMMANDER —', {
      fontSize: '11px', color: '#ff6666',
      stroke: '#000000', strokeThickness: 2,
      fontFamily: 'Nunito, Courier New, monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(43).setAlpha(0);

    // Staggered fade-in
    this.time.delayedCall(300, () => {
      this.tweens.add({ targets: [bossEmoji, tagline], alpha: 1, duration: 250 });
      this.time.delayedCall(150, () => {
        this.tweens.add({ targets: bossLabel, alpha: 1, duration: 250,
          onComplete: () => this.tweens.add({ targets: bossClass, alpha: 1, duration: 200 }) });
      });
    });

    // Dismiss on tap or after 2.5s
    const allObjs = [shade, frameBg, bossEmoji, bossLabel, bossClass, tagline];
    const dismiss = () => {
      tapZone.removeAllListeners();
      this.tweens.add({
        targets: allObjs, alpha: 0, duration: 400,
        onComplete: () => { allObjs.forEach(o => o.destroy()); tapZone.destroy(); onDone && onDone(); },
      });
    };
    const tapZone = this.add.zone(W/2, H/2, W, H).setInteractive().setDepth(44);
    tapZone.on('pointerdown', dismiss);
    this.time.delayedCall(2500, () => { if (tapZone.active) dismiss(); });
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
