// Main game loop and state management

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.state = 'title'; // title, playing, level_complete, won, lost

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.damageNumbers = [];
        this.gold = CONFIG.START_GOLD;
        this.lives = CONFIG.START_LIVES;

        this.lastTime = performance.now();
        this.gameSpeed = 1;

        // Camera (zoom + pan)
        this.zoom = 1;
        this.camX = 0; // world offset (0 = centered)
        this.camY = 0;

        // 2.5D perspective mode
        this.perspectiveMode = false;

        // Player name & stats
        this.playerName = '';
        this.kills = 0;

        // Combo kill system
        this.combo = 0;
        this.comboTimer = 0;
        this.comboTexts = [];   // floating milestone text effects
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.maxCombo = 0;      // best combo this game

        // Setup countdown (time to place towers before waves start)
        this.setupTimer = 0;

        // Trivia state
        this.triviaActive = false;
        this.triviaTimer = 0;
        this.triviaQuestion = null;
        this.triviaAnswered = false;
        this.triviaResultTimer = 0;
        this.triviaCorrect = false;
        this.triviaUsed = [];
        this._triviaShownForWave = -1;

        // Global ability state (one per tower type that has abilities)
        this.abilityState = {};
        for (const [key, def] of Object.entries(CONFIG.TOWERS)) {
            if (def.ability) {
                this.abilityState[key] = {
                    cooldown: 0,
                    active: false,
                    timer: 0,
                    effectTick: 0,  // for periodic effects
                    duration: def.ability.duration,
                    cooldownMax: def.ability.cooldown,
                    name: def.ability.name,
                    emoji: def.emoji
                };
            }
        }

        // Ambient environmental particles (level-themed)
        this.ambientParticles = [];

        // Ability visual effects (explosions, lightning bolts, storm clouds)
        this.abilityEffects = [];

        this.grid = new Grid(0);
        this.renderer = new Renderer(this.canvas, this.tileSize);
        this.waveManager = new WaveManager();
        this.ui = new UI(this);

        GameAudio.init();

        requestAnimationFrame((t) => this.loop(t));
    }

    resize() {
        const container = document.getElementById('game-container');
        const maxW = container.clientWidth;
        const maxH = container.clientHeight;

        const uiHeight = 130;
        const availH = maxH - uiHeight;
        const availW = maxW;

        const tileW = Math.floor(availW / CONFIG.GRID_COLS);
        const tileH = Math.floor(availH / CONFIG.GRID_ROWS);
        this.tileSize = Math.min(tileW, tileH);

        this.canvas.width = CONFIG.GRID_COLS * this.tileSize;
        this.canvas.height = CONFIG.GRID_ROWS * this.tileSize;

        if (this.renderer) {
            this.renderer.tileSize = this.tileSize;
        }

        for (const tower of (this.towers || [])) {
            tower.tileSize = this.tileSize;
            const pos = gridToPixel(tower.col, tower.row, this.tileSize);
            tower.x = pos.x;
            tower.y = pos.y;
        }
    }

    // Convert screen-space canvas coords to world coords
    screenToWorld(sx, sy) {
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        let wx = (sx - cw / 2) / this.zoom + cw / 2 - this.camX;
        let wy = (sy - ch / 2) / this.zoom + ch / 2 - this.camY;
        // Invert perspective Y-scale if enabled
        if (this.perspectiveMode) {
            const yScale = 0.88;
            const pivotY = ch * 0.5;
            wy = (wy - pivotY) / yScale + pivotY;
        }
        return { x: wx, y: wy };
    }

    resetCamera() {
        this.zoom = 1;
        this.camX = 0;
        this.camY = 0;
    }

    setZoom(newZoom, screenX, screenY) {
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        newZoom = Math.max(0.5, Math.min(3, newZoom));

        // Zoom toward the cursor position
        if (screenX !== undefined) {
            const wx = (screenX - cw / 2) / this.zoom + cw / 2 - this.camX;
            const wy = (screenY - ch / 2) / this.zoom + ch / 2 - this.camY;
            // After zoom, same world point should stay under cursor
            this.camX = cw / 2 - wx + (screenX - cw / 2) / newZoom;
            this.camY = ch / 2 - wy + (screenY - ch / 2) / newZoom;
        }

        this.zoom = newZoom;
        this._clampCamera();
    }

    _clampCamera() {
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        const maxPanX = Math.max(0, cw / 2 - cw / (2 * this.zoom));
        const maxPanY = Math.max(0, ch / 2 - ch / (2 * this.zoom));
        this.camX = Math.max(-maxPanX, Math.min(maxPanX, this.camX));
        this.camY = Math.max(-maxPanY, Math.min(maxPanY, this.camY));
    }

    startGame(startLevel) {
        startLevel = startLevel || 0;
        const nameInput = document.getElementById('player-name');
        this.playerName = (nameInput ? nameInput.value.trim() : '') || 'Anonymous';
        this.kills = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.comboTexts = [];
        this.maxCombo = 0;
        this.shakeTimer = 0;
        this.shakeIntensity = 0;

        // Reset game objects
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.damageNumbers = [];
        this.ambientParticles = [];
        this.abilityEffects = [];
        this.lives = CONFIG.START_LIVES;

        // Level select support
        this.grid = new Grid(startLevel);
        this.waveManager = new WaveManager(startLevel);
        this.gold = startLevel > 0 ? 3000 : CONFIG.START_GOLD;

        // Reset abilities
        for (const key in this.abilityState) {
            this.abilityState[key].cooldown = 0;
            this.abilityState[key].active = false;
            this.abilityState[key].timer = 0;
            this.abilityState[key].effectTick = 0;
        }

        this.triviaActive = false;
        this.triviaUsed = [];
        this._triviaShownForWave = -1;
        this._hideTrivia();

        this.ui.selectedTowerType = null;
        this.ui.selectedTower = null;
        this.ui.hideUpgradePanel();

        this.state = 'playing';
        this.setupTimer = CONFIG.SETUP_TIME;
        this.gameSpeed = 1;
        this.resetCamera();
        this.resize();
        const speedBtn = document.getElementById('speed-btn');
        if (speedBtn) speedBtn.textContent = '1x';
        document.getElementById('title-screen').style.display = 'none';
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('victory-screen').style.display = 'none';
        document.getElementById('level-complete-screen').style.display = 'none';
        document.getElementById('hud').style.display = 'flex';
        document.getElementById('bottom-bar').style.display = 'flex';
        document.getElementById('game-controls').style.display = 'flex';
        GameAudio.startMusic(startLevel);
        this.ui.updateHUD();
    }

    restart() {
        this.state = 'playing';
        this.grid = new Grid(0);
        this.waveManager = new WaveManager();
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.damageNumbers = [];
        this.gold = CONFIG.START_GOLD;
        this.lives = CONFIG.START_LIVES;
        this.kills = 0;
        this.ui.selectedTowerType = null;
        this.ui.selectedTower = null;
        this.ui.hideUpgradePanel();
        this.resize();

        // Reset all abilities
        for (const key in this.abilityState) {
            this.abilityState[key].cooldown = 0;
            this.abilityState[key].active = false;
            this.abilityState[key].timer = 0;
            this.abilityState[key].effectTick = 0;
        }

        this.triviaActive = false;
        this.triviaUsed = [];
        this._triviaShownForWave = -1;
        this._hideTrivia();

        // Reset combo state
        this.combo = 0;
        this.comboTimer = 0;
        this.comboTexts = [];
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.maxCombo = 0;
        this.ambientParticles = [];
        this.abilityEffects = [];

        document.getElementById('title-screen').style.display = 'none';
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('victory-screen').style.display = 'none';
        document.getElementById('level-complete-screen').style.display = 'none';
        document.getElementById('hud').style.display = 'flex';
        document.getElementById('bottom-bar').style.display = 'flex';
        document.getElementById('game-controls').style.display = 'flex';
        this.setupTimer = CONFIG.SETUP_TIME;
        this.gameSpeed = 1;
        this.resetCamera();
        const speedBtn = document.getElementById('speed-btn');
        if (speedBtn) speedBtn.textContent = '1x';
        GameAudio.startMusic(0);
        this.ui.updateHUD();
    }

    placeTower(type, col, row) {
        const cost = CONFIG.TOWERS[type].cost;
        this.gold -= cost;
        this.grid.placeTower(col, row);
        GameAudio.placeTower();

        const tower = new Tower(type, col, row, this.tileSize);
        this.towers.push(tower);

        // If this type's ability is currently active, start it on the new tower
        if (this.abilityState[type] && this.abilityState[type].active) {
            tower.startAbility();
        }

        const newPath = this.grid.currentPath;
        for (const enemy of this.enemies) {
            if (enemy.alive && !enemy.reachedEnd) {
                enemy.updatePath(newPath);
            }
        }

        // Check for 3-in-a-line merge (disabled for now)
        // this._checkAndMerge(tower);
    }

    // === TOWER MERGE SYSTEM ===
    _findMergeLine(tower) {
        const type = tower.type;
        const col = tower.col;
        const row = tower.row;

        if (!CONFIG.SUPER_TOWERS[type]) return null;

        const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];

        const findAt = (c, r) =>
            this.towers.find(t => t.col === c && t.row === r && t.type === type && !t.isSuper);

        for (const [dc, dr] of dirs) {
            // Collect same-type towers along this line through the placed tower
            const line = [];
            for (let i = -2; i <= 2; i++) {
                const t = findAt(col + dc * i, row + dr * i);
                if (t) line.push({ i, tower: t });
            }

            // Find 3 consecutive
            for (let s = 0; s < line.length - 2; s++) {
                if (line[s + 1].i === line[s].i + 1 && line[s + 2].i === line[s].i + 2) {
                    return [line[s].tower, line[s + 1].tower, line[s + 2].tower];
                }
            }
        }

        return null;
    }

    _checkAndMerge(newTower) {
        const line = this._findMergeLine(newTower);
        if (!line) return;

        // Middle tower becomes super, other two are removed
        const middle = line[1];
        const outer = [line[0], line[2]];

        // Combine total investment
        const totalInvested = line.reduce((sum, t) => sum + t.totalInvested, 0);

        // Remove outer towers
        for (const t of outer) {
            this.grid.removeTower(t.col, t.row);
            this.towers = this.towers.filter(tw => tw !== t);
        }

        // Transform middle into super tower
        middle.makeSuper(totalInvested);

        // Merge particle burst
        for (const t of line) {
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 / 12) * i;
                const speed = 50 + Math.random() * 60;
                this.particles.push({
                    x: t.x, y: t.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0.8, maxLife: 0.8,
                    color: '#FFD700', size: 6
                });
            }
        }

        // Converging particles from outer positions to middle
        for (const t of outer) {
            const dx = middle.x - t.x;
            const dy = middle.y - t.y;
            for (let i = 0; i < 5; i++) {
                this.particles.push({
                    x: t.x, y: t.y,
                    vx: dx * (0.8 + Math.random() * 0.5),
                    vy: dy * (0.8 + Math.random() * 0.5),
                    life: 0.5, maxLife: 0.5,
                    color: '#FFF', size: 4
                });
            }
        }

        // Recalc path since we freed 2 cells
        const newPath = this.grid.currentPath;
        for (const enemy of this.enemies) {
            if (enemy.alive && !enemy.reachedEnd) {
                enemy.updatePath(newPath);
            }
        }

        GameAudio.ability(); // reuse ability sound for merge
    }

    upgradeTower(tower) {
        const maxLevel = CONFIG.MAX_TOWER_LEVEL || 4;
        const cost = tower.getUpgradeCost();
        if (this.gold >= cost && tower.level < maxLevel) {
            this.gold -= tower.upgrade();
        }
    }

    moveTower(tower, newCol, newRow) {
        if (!tower.canMove) return false;
        if (!this.grid.canPlace(newCol, newRow)) return false;

        // Remove from old position
        this.grid.removeTower(tower.col, tower.row);

        // Place at new position
        this.grid.placeTower(newCol, newRow);
        tower.col = newCol;
        tower.row = newRow;
        const pos = gridToPixel(newCol, newRow, this.tileSize);
        tower.x = pos.x;
        tower.y = pos.y;
        tower.canMove = false;

        // Re-route enemies
        const newPath = this.grid.currentPath;
        for (const enemy of this.enemies) {
            if (enemy.alive && !enemy.reachedEnd) {
                enemy.updatePath(newPath);
            }
        }

        GameAudio.ability();
        return true;
    }

    sellTower(tower) {
        const refund = tower.getSellValue();
        this.gold += refund;
        this.grid.removeTower(tower.col, tower.row);
        this.towers = this.towers.filter(t => t !== tower);

        const newPath = this.grid.currentPath;
        for (const enemy of this.enemies) {
            if (enemy.alive && !enemy.reachedEnd) {
                enemy.updatePath(newPath);
            }
        }
    }

    // === GLOBAL ABILITY SYSTEM ===
    activateGlobalAbility(towerType) {
        const state = this.abilityState[towerType];
        if (!state || state.active || state.cooldown > 0) return false;

        // Need at least one tower of this type
        const hasTower = this.towers.some(t => t.type === towerType);
        if (!hasTower) return false;

        state.active = true;
        state.timer = state.duration;
        state.effectTick = 0;

        // Activate on all towers of this type
        for (const tower of this.towers) {
            if (tower.type === towerType) {
                tower.startAbility();
            }
        }

        GameAudio.ability();

        // Particles burst from all towers of this type
        for (const tower of this.towers) {
            if (tower.type !== towerType) continue;
            const color = towerType === 'barker' ? '#F5DEB3' :
                          towerType === 'poodle' ? '#DA70D6' :
                          towerType === 'husky' ? '#B3E5FC' :
                          towerType === 'sparky' ? '#FFEB3B' : '#FF6347';
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                this.particles.push({
                    x: tower.x, y: tower.y,
                    vx: Math.cos(angle) * 80,
                    vy: Math.sin(angle) * 80,
                    life: 0.6, maxLife: 0.6,
                    color: color, size: 5
                });
            }
        }

        return true;
    }

    _updateGlobalAbilities(dt) {
        for (const [type, state] of Object.entries(this.abilityState)) {
            if (state.active) {
                state.timer -= dt;
                state.effectTick -= dt;

                // Apply sustained effects
                if (state.effectTick <= 0) {
                    state.effectTick = 0.5; // apply every 0.5s
                    this._applyAbilityEffect(type);
                }

                if (state.timer <= 0) {
                    // Deactivate
                    state.active = false;
                    state.cooldown = state.cooldownMax;
                    for (const tower of this.towers) {
                        if (tower.type === type) {
                            tower.stopAbility();
                        }
                    }
                }
            } else if (state.cooldown > 0) {
                state.cooldown -= dt;
                if (state.cooldown < 0) state.cooldown = 0;
            }
        }
    }

    _applyAbilityEffect(type) {
        if (type === 'poodle') {
            // ZOOMIES: heavy slow on all enemies
            for (const e of this.enemies) {
                if (e.alive && !e.reachedEnd) {
                    e.applySlow(0.2, 1.5);
                }
            }
        } else if (type === 'husky') {
            // BLIZZARD: freeze enemies in range of any husky
            for (const tower of this.towers) {
                if (tower.type !== 'husky') continue;
                const rangePx = tower.range * tower.tileSize;
                for (const e of this.enemies) {
                    if (!e.alive || e.reachedEnd) continue;
                    if (dist(tower.x, tower.y, e.x, e.y) <= rangePx) {
                        e.applyFreeze(1.5);
                    }
                }
            }
        } else if (type === 'bigboi') {
            // MEGA WOOF: massive ground eruptions at random enemies
            const dmg = 40;
            const targets = this.enemies.filter(e => e.alive && !e.reachedEnd);
            // Pick up to 3 random targets for eruption epicenters
            const epicenters = [];
            const shuffled = [...targets].sort(() => Math.random() - 0.5);
            for (let i = 0; i < Math.min(3, shuffled.length); i++) {
                epicenters.push({ x: shuffled[i].x, y: shuffled[i].y });
            }
            // Damage all enemies
            for (const e of targets) {
                e.takeDamage(dmg);
            }
            // Spawn ground eruption effects at epicenters
            for (const ep of epicenters) {
                this.abilityEffects.push({
                    type: 'eruption', x: ep.x, y: ep.y,
                    life: 0.8, maxLife: 0.8, radius: this.tileSize * 2
                });
                // Debris particles
                for (let i = 0; i < 15; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 60 + Math.random() * 120;
                    this.particles.push({
                        x: ep.x, y: ep.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 80,
                        life: 0.6 + Math.random() * 0.4, maxLife: 1.0,
                        color: Math.random() > 0.5 ? '#FF6347' : '#8B4513',
                        size: 3 + Math.random() * 4
                    });
                }
            }
            // Screen shake
            this.shakeTimer = 0.5;
            this.shakeIntensity = 6;
        } else if (type === 'sparky') {
            // THUNDER STORM: storm cloud + lightning bolts from sky
            const targets = this.enemies.filter(e => e.alive && !e.reachedEnd);
            const cw = this.canvas.width;
            // Spawn storm cloud effect if not already there
            const hasCloud = this.abilityEffects.some(e => e.type === 'stormcloud');
            if (!hasCloud) {
                this.abilityEffects.push({
                    type: 'stormcloud', x: cw / 2, y: 0,
                    life: 10.5, maxLife: 10.5, w: cw
                });
            }
            // Strike up to 4 random enemies with lightning bolts
            const shuffled = [...targets].sort(() => Math.random() - 0.5);
            for (let i = 0; i < Math.min(4, shuffled.length); i++) {
                const e = shuffled[i];
                e.takeDamage(25);
                this.abilityEffects.push({
                    type: 'bolt', x: e.x, y: e.y,
                    startY: -10,
                    life: 0.35, maxLife: 0.35
                });
                // Spark particles at strike point
                for (let j = 0; j < 8; j++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 40 + Math.random() * 60;
                    this.particles.push({
                        x: e.x, y: e.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 0.3, maxLife: 0.3,
                        color: '#FFEB3B', size: 3
                    });
                }
            }
            // Brief screen flash
            this.shakeTimer = 0.15;
            this.shakeIntensity = 3;
        }
        // barker: handled by tower's rapid fireRate (already set in startAbility)
        // sparky chain doubling still happens via tower.js abilityActive check
    }

    // === TRIVIA SYSTEM ===
    _pickTrivia() {
        const levelIdx = this.waveManager.currentLevel;
        const pool = CONFIG.TRIVIA[levelIdx] || CONFIG.TRIVIA[0];
        if (this.triviaUsed.length >= pool.length) {
            this.triviaUsed = [];
        }
        let idx;
        do {
            idx = Math.floor(Math.random() * pool.length);
        } while (this.triviaUsed.includes(idx));
        this.triviaUsed.push(idx);

        const q = pool[idx];
        const indices = [0, 1, 2, 3];
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        return {
            question: q.q,
            answers: indices.map(i => q.a[i]),
            correctIdx: indices.indexOf(q.c)
        };
    }

    _showTrivia() {
        this.triviaQuestion = this._pickTrivia();
        this.triviaActive = true;
        this.triviaAnswered = false;
        this.triviaCorrect = false;
        this.triviaTimer = CONFIG.TRIVIA_TIME;
        this.triviaResultTimer = 0;

        const panel = document.getElementById('trivia-panel');
        if (!panel) return;

        const q = this.triviaQuestion;
        document.getElementById('trivia-question').textContent = q.question;
        const btns = panel.querySelectorAll('.trivia-btn');
        btns.forEach((btn, i) => {
            btn.textContent = q.answers[i];
            btn.className = 'trivia-btn';
            btn.onclick = () => this._answerTrivia(i);
        });
        document.getElementById('trivia-result').textContent = '';
        document.getElementById('trivia-timer-fill').style.width = '100%';
        panel.style.display = 'flex';
    }

    _answerTrivia(idx) {
        if (this.triviaAnswered) return;
        this.triviaAnswered = true;

        const correct = idx === this.triviaQuestion.correctIdx;
        this.triviaCorrect = correct;
        this.triviaResultTimer = 1.2;

        const panel = document.getElementById('trivia-panel');
        const btns = panel.querySelectorAll('.trivia-btn');
        const resultEl = document.getElementById('trivia-result');

        btns[this.triviaQuestion.correctIdx].classList.add('correct');
        if (!correct) {
            btns[idx].classList.add('wrong');
            resultEl.textContent = 'Nope!';
            resultEl.style.color = '#f44336';
        } else {
            this.gold += CONFIG.TRIVIA_REWARD;
            resultEl.textContent = '+' + CONFIG.TRIVIA_REWARD + 'g!';
            resultEl.style.color = '#4CAF50';
        }
    }

    _hideTrivia() {
        const panel = document.getElementById('trivia-panel');
        if (panel) panel.style.display = 'none';
        this.triviaActive = false;
    }

    _updateTrivia(dt) {
        if (!this.triviaActive) return;

        if (this.triviaAnswered) {
            this.triviaResultTimer -= dt;
            if (this.triviaResultTimer <= 0) {
                this._hideTrivia();
            }
            return;
        }

        this.triviaTimer -= dt;
        const fill = document.getElementById('trivia-timer-fill');
        if (fill) {
            const pct = Math.max(0, this.triviaTimer / CONFIG.TRIVIA_TIME) * 100;
            fill.style.width = pct + '%';
        }

        if (this.triviaTimer <= 0) {
            this.triviaAnswered = true;
            this.triviaResultTimer = 1.0;
            const resultEl = document.getElementById('trivia-result');
            if (resultEl) {
                resultEl.textContent = "Time's up!";
                resultEl.style.color = '#FF9800';
            }
            const panel = document.getElementById('trivia-panel');
            if (panel) {
                const btns = panel.querySelectorAll('.trivia-btn');
                btns[this.triviaQuestion.correctIdx].classList.add('correct');
            }
        }
    }

    // === LEVEL TRANSITIONS ===
    _showLevelComplete() {
        this.state = 'level_complete';
        const screen = document.getElementById('level-complete-screen');
        const lvl = this.waveManager.currentLevel + 1;
        document.getElementById('lc-level').textContent = lvl;
        const nextLevel = CONFIG.LEVELS[this.waveManager.currentLevel + 1];
        document.getElementById('lc-next').textContent = nextLevel ? nextLevel.name : '';
        screen.style.display = 'flex';
    }

    nextLevel() {
        document.getElementById('level-complete-screen').style.display = 'none';
        this.waveManager.startNextLevel();

        // Refund all towers so player can rebuild on new map
        for (const t of this.towers) {
            this.gold += t.getSellValue();
        }
        this.towers = [];

        // Fresh map for the new level
        const newLevelIdx = this.waveManager.currentLevel;
        this.grid = new Grid(newLevelIdx);

        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.ambientParticles = [];
        this.abilityEffects = [];
        this.ui.selectedTowerType = null;
        this.ui.selectedTower = null;
        this.ui.hideUpgradePanel();

        // Reset abilities
        for (const key in this.abilityState) {
            this.abilityState[key].cooldown = 0;
            this.abilityState[key].active = false;
            this.abilityState[key].timer = 0;
            this.abilityState[key].effectTick = 0;
        }

        this.state = 'playing';
        this.setupTimer = CONFIG.SETUP_TIME;
        this._triviaShownForWave = -1;
        this.resetCamera();
        GameAudio.startMusic(newLevelIdx);
        this.ui.updateHUD();
    }

    // === LEADERBOARD ===
    _calcScore() {
        return this.kills * CONFIG.SCORE_PER_KILL + this.lives * CONFIG.SCORE_PER_LIFE + this.gold;
    }

    _saveScore() {
        const entry = {
            name: this.playerName,
            score: this._calcScore(),
            kills: this.kills,
            gold: this.gold,
            lives: this.lives,
            level: this.waveManager.currentLevel + 1,
            date: new Date().toLocaleDateString()
        };

        let scores = [];
        try {
            const raw = localStorage.getItem(CONFIG.LEADERBOARD_KEY);
            if (raw) scores = JSON.parse(raw);
        } catch (e) {}

        scores.push(entry);
        scores.sort((a, b) => b.score - a.score);
        scores = scores.slice(0, CONFIG.LEADERBOARD_MAX);

        try {
            localStorage.setItem(CONFIG.LEADERBOARD_KEY, JSON.stringify(scores));
        } catch (e) {}

        return entry;
    }

    _loadScores() {
        try {
            const raw = localStorage.getItem(CONFIG.LEADERBOARD_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }

    showLeaderboard() {
        const screen = document.getElementById('leaderboard-screen');
        if (!screen) return;

        const scores = this._loadScores();
        const tbody = document.getElementById('leaderboard-body');
        if (tbody) {
            if (scores.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#8d6e63;">No scores yet!</td></tr>';
            } else {
                tbody.innerHTML = scores.map((s, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${s.name}</td>
                        <td>${s.score}</td>
                        <td>${s.kills}</td>
                        <td>Lv${s.level}</td>
                    </tr>
                `).join('');
            }
        }

        screen.style.display = 'flex';
    }

    // === BOSS MINION SPAWNING ===
    _updateBosses() {
        for (const enemy of this.enemies) {
            if (!enemy.isBoss || !enemy.alive) continue;

            if (enemy.minionTimer <= 0) {
                enemy.minionTimer = 8;
                const path = this.grid.currentPath;
                if (path && path.length > 0) {
                    for (let i = 0; i < 2; i++) {
                        const minion = new Enemy('kitten', path, this.tileSize);
                        minion.x = enemy.x + (Math.random() - 0.5) * 10;
                        minion.y = enemy.y + (Math.random() - 0.5) * 10;
                        minion.pathIndex = Math.max(0, enemy.pathIndex - 1);
                        this.enemies.push(minion);
                    }
                }
            }
        }
    }

    // === DOG HOUSE INCOME ===
    _giveDogHouseIncome() {
        let income = 0;
        for (const tower of this.towers) {
            if (tower.goldPerWave > 0) {
                income += tower.goldPerWave;
            }
        }
        if (income > 0) {
            this.gold += income;
        }
    }

    // === DOG HOUSE AURA BUFFS ===
    _applyDogHouseAuras() {
        // Reset all buff modifiers
        for (const tower of this.towers) {
            if (!tower.isPassive) {
                tower.buffDamageMult = 1;
                tower.buffFireRateMult = 1;
                tower.buffRange = 0;
                tower.isBuffed = false;
            }
        }

        // Apply auras from each Dog House
        for (const dh of this.towers) {
            if (!dh.isPassive || dh.auraRange <= 0) continue;

            // Dog Mansion (super) uses its own config, regular uses tier array
            let aura;
            if (dh.isSuper) {
                const superDef = CONFIG.SUPER_TOWERS.doghouse;
                aura = { fireRateMult: superDef.fireRateMult, rangePlus: superDef.rangePlus, damageMult: superDef.damageMult };
            } else {
                aura = CONFIG.DOGHOUSE_TIERS[dh.auraTier];
            }
            if (!aura) continue;

            const auraPx = dh.auraRange * dh.tileSize;

            for (const tower of this.towers) {
                if (tower.isPassive) continue;
                const d = dist(dh.x, dh.y, tower.x, tower.y);
                if (d > auraPx) continue;

                // Apply buffs (don't stack — use best value from any Dog House)
                tower.isBuffed = true;
                tower.buffFireRateMult = Math.min(tower.buffFireRateMult, aura.fireRateMult);
                tower.buffRange = Math.max(tower.buffRange, aura.rangePlus);
                tower.buffDamageMult = Math.max(tower.buffDamageMult, aura.damageMult);
            }
        }
    }

    _updateAmbientParticles(dt) {
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        const level = this.waveManager ? this.waveManager.currentLevel : 0;
        const maxP = 25;

        // Spawn new ambient particles
        if (this.ambientParticles.length < maxP && Math.random() < 0.15) {
            if (level === 0) {
                // Backyard: drifting leaves
                this.ambientParticles.push({
                    x: Math.random() * cw, y: -5,
                    vx: 10 + Math.random() * 20, vy: 15 + Math.random() * 25,
                    life: 6 + Math.random() * 4, maxLife: 10,
                    size: 3 + Math.random() * 3,
                    type: 'leaf', rot: Math.random() * 6.28,
                    rotSpeed: (Math.random() - 0.5) * 2,
                    color: Math.random() > 0.5 ? '#6B8E23' : '#8FBC8F'
                });
            } else if (level === 1) {
                // Park: fireflies
                this.ambientParticles.push({
                    x: Math.random() * cw, y: Math.random() * ch,
                    vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
                    life: 3 + Math.random() * 4, maxLife: 7,
                    size: 2 + Math.random() * 2,
                    type: 'firefly', phase: Math.random() * 6.28,
                    color: '#FFEB3B'
                });
            } else {
                // Cat Central: embers
                this.ambientParticles.push({
                    x: Math.random() * cw, y: ch + 5,
                    vx: (Math.random() - 0.5) * 25, vy: -(20 + Math.random() * 30),
                    life: 3 + Math.random() * 3, maxLife: 6,
                    size: 2 + Math.random() * 2,
                    type: 'ember', phase: Math.random() * 6.28,
                    color: Math.random() > 0.5 ? '#FF6347' : '#FF8C00'
                });
            }
        }

        // Update
        for (const p of this.ambientParticles) {
            p.life -= dt;
            if (p.type === 'leaf') {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx += Math.sin(p.life * 2) * dt * 8;
                p.rot += p.rotSpeed * dt;
            } else if (p.type === 'firefly') {
                p.phase += dt * 2;
                p.x += p.vx * dt + Math.sin(p.phase) * 0.5;
                p.y += p.vy * dt + Math.cos(p.phase * 0.7) * 0.5;
                // Wander direction
                p.vx += (Math.random() - 0.5) * dt * 30;
                p.vy += (Math.random() - 0.5) * dt * 30;
                p.vx *= 0.98; p.vy *= 0.98;
            } else if (p.type === 'ember') {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx += Math.sin(p.phase + p.life) * dt * 10;
                p.size *= 0.998;
            }
        }
        this.ambientParticles = this.ambientParticles.filter(p => p.life > 0);
    }

    update(dt) {
        if (this.state !== 'playing') return;

        dt = Math.min(dt, 0.1);

        // Setup countdown - let player place towers before waves start
        if (this.setupTimer > 0) {
            this.setupTimer -= dt;
            if (this.setupTimer < 0) this.setupTimer = 0;
            this.ui.updateHUD();
            return;
        }

        this._applyDogHouseAuras();
        this._updateTrivia(dt);
        this._updateGlobalAbilities(dt);
        this.waveManager.update(dt, this.grid.currentPath, this.tileSize, this.enemies);

        // Show trivia between waves
        if (this.waveManager.betweenWaves && !this.triviaActive
            && this._triviaShownForWave !== this.waveManager.currentWave
            && this.waveManager.currentWave > 0) {
            this._triviaShownForWave = this.waveManager.currentWave;
            this._showTrivia();
        }

        if (this.waveManager.levelComplete) {
            this._showLevelComplete();
            return;
        }

        // Update enemies
        for (const enemy of this.enemies) {
            enemy.update(dt);

            if (enemy.reachedEnd && enemy.alive) {
                enemy.alive = false;
                this.lives--;
                if (this.lives <= 0) {
                    this.lives = 0;
                    this.gameOver();
                    return;
                }
            }

            if (!enemy.alive && enemy.hp <= 0 && !enemy._deathHandled) {
                enemy._deathHandled = true;
                this.gold += enemy.gold;
                this.kills++;
                GameAudio.enemyDeath();
                for (let i = 0; i < 6; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 30 + Math.random() * 50;
                    this.particles.push({
                        x: enemy.x, y: enemy.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 0.5, maxLife: 0.5,
                        color: enemy.color, size: 4
                    });
                }

                // Combo kill tracking
                this.combo++;
                this.comboTimer = CONFIG.COMBO.WINDOW;
                if (this.combo > this.maxCombo) this.maxCombo = this.combo;

                // Check for combo milestone
                const thresholds = CONFIG.COMBO.THRESHOLDS;
                for (let ti = thresholds.length - 1; ti >= 0; ti--) {
                    if (this.combo === thresholds[ti].count) {
                        this.gold += thresholds[ti].bonus;
                        GameAudio.combo();
                        this.comboTexts.push({
                            x: enemy.x, y: enemy.y - 10,
                            text: `${thresholds[ti].label} x${this.combo}!`,
                            subtext: `+${thresholds[ti].bonus}g`,
                            color: thresholds[ti].color,
                            life: 2.0, maxLife: 2.0
                        });
                        // Screen shake on big combos
                        if (this.combo >= CONFIG.COMBO.SHAKE_MIN) {
                            this.shakeTimer = CONFIG.COMBO.SHAKE_DURATION;
                            this.shakeIntensity = Math.min(3 + this.combo * 0.3, 8);
                        }
                        // Extra gold particle burst
                        const burstCount = Math.min(this.combo, 20);
                        for (let bi = 0; bi < burstCount; bi++) {
                            const a = Math.random() * Math.PI * 2;
                            const sp = 50 + Math.random() * 80;
                            this.particles.push({
                                x: enemy.x, y: enemy.y,
                                vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                                life: 0.8, maxLife: 0.8,
                                color: '#FFD700', size: 3
                            });
                        }
                        break;
                    }
                }
            }
        }

        this.enemies = this.enemies.filter(e => e.alive && !e.reachedEnd);

        // Boss minion spawning
        this._updateBosses();

        for (const tower of this.towers) {
            tower.update(dt, this.enemies, this.projectiles);
        }

        for (const proj of this.projectiles) {
            proj.update(dt, this.enemies, this.particles);
        }
        this.projectiles = this.projectiles.filter(p => p.alive || (p.chainArcs && p.chainArcs.length > 0));

        // Spawn floating damage numbers from hit enemies
        for (const enemy of this.enemies) {
            if (enemy.hitFlash > 0.9 && enemy.lastDamage > 0) {
                this.damageNumbers.push({
                    x: enemy.x + (Math.random() - 0.5) * 8,
                    y: enemy.y - this.tileSize * enemy.size * 0.5,
                    value: enemy.lastDamage,
                    life: 0.8,
                    maxLife: 0.8,
                    color: enemy.lastDamage >= 20 ? '#FF6347' : '#fff'
                });
                enemy.lastDamage = 0;
            }
        }

        // Update damage numbers
        for (const dn of this.damageNumbers) {
            dn.y -= 40 * dt;
            dn.life -= dt;
        }
        this.damageNumbers = this.damageNumbers.filter(d => d.life > 0);

        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
        }
        this.particles = this.particles.filter(p => p.life > 0);

        // Combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }
        // Screen shake timer
        if (this.shakeTimer > 0) this.shakeTimer -= dt;
        // Combo floating texts
        for (const ct of this.comboTexts) {
            ct.y -= 25 * dt;
            ct.life -= dt;
        }
        this.comboTexts = this.comboTexts.filter(ct => ct.life > 0);

        // Ambient environmental particles
        this._updateAmbientParticles(dt);

        // Update ability visual effects
        for (const ef of this.abilityEffects) {
            ef.life -= dt;
        }
        this.abilityEffects = this.abilityEffects.filter(e => e.life > 0);

        // Wave income + dog house income
        if (this.waveManager.betweenWaves && !this.waveManager._incomeGiven) {
            this.waveManager._incomeGiven = true;
            this.gold += CONFIG.WAVE_INCOME;
            this._giveDogHouseIncome();
        }
        if (!this.waveManager.betweenWaves) {
            this.waveManager._incomeGiven = false;
        }

        // Victory check
        if (this.waveManager.allWavesComplete && this.enemies.length === 0) {
            this.victory();
        }

        this.ui.updateHUD();
    }

    render() {
        const ctx = this.canvas.getContext('2d');
        const cw = this.canvas.width;
        const ch = this.canvas.height;

        this.renderer.clear();

        // Apply camera transform (with screen shake)
        ctx.save();
        let shakeX = 0, shakeY = 0;
        if (this.shakeTimer > 0) {
            shakeX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            shakeY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
        }
        ctx.translate(cw / 2 + shakeX, ch / 2 + shakeY);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-cw / 2 + this.camX, -ch / 2 + this.camY);

        // 2.5D perspective: compress Y toward center for a tilted-table look
        if (this.perspectiveMode) {
            const pivotY = ch * 0.5;
            ctx.translate(0, pivotY);
            ctx.scale(1, 0.88);
            ctx.translate(0, -pivotY);
        }

        this.renderer.drawGrid(this.grid);
        this.renderer.drawPath(this.grid.currentPath, this.grid);

        if (this.ui.selectedTowerType && this.state === 'playing') {
            const canPlace = this.grid.canPlace(this.ui.hoverCol, this.ui.hoverRow);
            this.renderer.drawPlacementPreview(
                this.ui.hoverCol, this.ui.hoverRow,
                canPlace, this.ui.selectedTowerType
            );
        }

        // Move mode preview
        if (this.ui.movingTower && this.state === 'playing') {
            const mt = this.ui.movingTower;
            const hc = this.ui.hoverCol;
            const hr = this.ui.hoverRow;
            if (hc >= 0 && hc < CONFIG.GRID_COLS && hr >= 0 && hr < CONFIG.GRID_ROWS) {
                const canPlace = this.grid.canPlace(hc, hr);
                const ts = this.tileSize;
                const px = hc * ts;
                const py = hr * ts;
                ctx.fillStyle = canPlace ? 'rgba(100,200,255,0.3)' : 'rgba(255,60,60,0.3)';
                ctx.fillRect(px, py, ts, ts);
                ctx.strokeStyle = canPlace ? '#64c8ff' : '#ff3c3c';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(px + 1, py + 1, ts - 2, ts - 2);
                ctx.setLineDash([]);
                // Draw tower emoji at hover
                ctx.font = `${ts * 0.5}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.globalAlpha = 0.7;
                ctx.fillText(mt.emoji, px + ts / 2, py + ts / 2);
                ctx.globalAlpha = 1;
            }
            // Highlight source tower
            const sx = mt.col * this.tileSize;
            const sy = mt.row * this.tileSize;
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(sx + 1, sy + 1, this.tileSize - 2, this.tileSize - 2);
            ctx.setLineDash([]);
        }

        if (this.ui.selectedTower) {
            this.renderer.drawTowerRange(this.ui.selectedTower);
        }

        // Dynamic shadows (drawn first so they appear under entities)
        for (const tower of this.towers) {
            const sz = tower.isPassive ? this.tileSize * 0.4 : this.tileSize * (tower.isSuper ? 0.48 : 0.4);
            this.renderer.drawDynamicShadow(tower.x, tower.y, sz, this.tileSize);
        }
        for (const enemy of this.enemies) {
            if (enemy.alive) {
                this.renderer.drawDynamicShadow(enemy.x, enemy.y, this.tileSize * enemy.size, this.tileSize);
            }
        }

        for (const tower of this.towers) {
            this.renderer.drawTower(tower);
            // Muzzle flash when firing
            if (tower.attackAnim > 0.7 && !tower.isPassive) {
                this.renderer.drawMuzzleFlash(tower);
            }
        }

        for (const enemy of this.enemies) {
            this.renderer.drawEnemy(enemy);
        }

        for (const proj of this.projectiles) {
            this.renderer.drawProjectile(proj);
        }

        for (const p of this.particles) {
            this.renderer.drawParticle(p);
        }

        // Floating damage numbers
        for (const dn of this.damageNumbers) {
            this.renderer.drawDamageNumber(dn);
        }

        // Floating combo milestone texts
        for (const ct of this.comboTexts) {
            this.renderer.drawComboText(ct);
        }

        // Ability visual effects (eruptions, lightning bolts, storm cloud)
        for (const ef of this.abilityEffects) {
            this.renderer.drawAbilityEffect(ef);
        }

        // Ambient environmental particles
        for (const ap of this.ambientParticles) {
            this.renderer.drawAmbientParticle(ap);
        }

        ctx.restore(); // end camera transform

        // Zoom indicator (when not 1x)
        if (this.zoom !== 1) {
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(8, ch - 28, 50, 20);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.zoom.toFixed(1) + 'x', 33, ch - 18);
            ctx.restore();
        }

        // Combo HUD (screen space) - show when combo >= 2
        if (this.combo >= 2) {
            this.renderer.drawComboHUD(this.combo, this.comboTimer, CONFIG.COMBO.WINDOW, CONFIG.COMBO.THRESHOLDS);
        }

        // Setup countdown overlay (screen space)
        if (this.setupTimer > 0) {
            const secs = Math.ceil(this.setupTimer);

            // Background pill upper-right
            const text = secs.toString();
            const label = 'PLACE TOWERS!';
            const px = cw - 16;
            const py = 32;

            // Draw countdown number
            ctx.save();
            ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';

            // Glow behind number
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 16;
            ctx.fillStyle = '#FFD700';
            ctx.fillText(text, px, py);
            ctx.shadowBlur = 0;

            // Label underneath
            ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.fillText(label, px, py + 24);
            ctx.restore();
        }
    }

    loop(time) {
        const dt = ((time - this.lastTime) / 1000) * this.gameSpeed;
        this.lastTime = time;

        this.update(dt);
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }

    gameOver() {
        this.state = 'lost';
        this._hideTrivia();
        GameAudio.stopMusic();
        const entry = this._saveScore();

        document.getElementById('hud').style.display = 'none';
        document.getElementById('bottom-bar').style.display = 'none';
        document.getElementById('upgrade-panel').style.display = 'none';
        document.getElementById('game-controls').style.display = 'none';
        const screen = document.getElementById('game-over-screen');
        screen.style.display = 'flex';
        document.getElementById('go-wave').textContent = this.waveManager.currentWave;
        document.getElementById('go-score').textContent = entry.score;
        document.getElementById('go-kills').textContent = this.kills;
        const goCombo = document.getElementById('go-combo');
        if (goCombo) goCombo.textContent = this.maxCombo;
    }

    victory() {
        this.state = 'won';
        this._hideTrivia();
        GameAudio.stopMusic();
        const entry = this._saveScore();

        document.getElementById('hud').style.display = 'none';
        document.getElementById('bottom-bar').style.display = 'none';
        document.getElementById('upgrade-panel').style.display = 'none';
        document.getElementById('game-controls').style.display = 'none';
        const screen = document.getElementById('victory-screen');
        screen.style.display = 'flex';
        document.getElementById('vic-gold').textContent = this.gold;
        document.getElementById('vic-score').textContent = entry.score;
        document.getElementById('vic-kills').textContent = this.kills;
        const vicCombo = document.getElementById('vic-combo');
        if (vicCombo) vicCombo.textContent = this.maxCombo;
    }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
