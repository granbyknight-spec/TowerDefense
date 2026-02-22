// UI management - HUD, tower selection, touch/click handling, global ability buttons

class UI {
    constructor(game) {
        this.game = game;
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.movingTower = null;
        this.hoverCol = -1;
        this.hoverRow = -1;

        this.setupEventListeners();
        this.setupAbilityButtons();
    }

    setupEventListeners() {
        const canvas = this.game.canvas;

        this._panning = false;
        this._lastPanX = 0;
        this._lastPanY = 0;

        // Double-tap detection: toggle zoom in/out
        this._lastTapTime = 0;
        this._lastTapX = 0;
        this._lastTapY = 0;

        canvas.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'touch') {
                const now = performance.now();
                const dx = e.clientX - this._lastTapX;
                const dy = e.clientY - this._lastTapY;
                const tapDist = Math.sqrt(dx * dx + dy * dy);
                if (now - this._lastTapTime < 350 && tapDist < 40) {
                    // Double-tap detected: toggle zoom
                    e.preventDefault();
                    if (this.game.zoom > 1.05) {
                        this.game.resetCamera();
                    } else {
                        const rect = canvas.getBoundingClientRect();
                        const sx = (e.clientX - rect.left) * (canvas.width / rect.width);
                        const sy = (e.clientY - rect.top) * (canvas.height / rect.height);
                        this.game.setZoom(2, sx, sy);
                    }
                    this._lastTapTime = 0;
                    return;
                }
                this._lastTapTime = now;
                this._lastTapX = e.clientX;
                this._lastTapY = e.clientY;
            }
            this.onPointerDown(e);
        });
        canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
        canvas.addEventListener('pointerup', (e) => { this._panning = false; });
        canvas.addEventListener('pointercancel', () => { this._panning = false; });
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        canvas.addEventListener('dblclick', (e) => e.preventDefault());

        // Scroll wheel zoom
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const sx = (e.clientX - rect.left) * scaleX;
            const sy = (e.clientY - rect.top) * scaleY;
            const delta = e.deltaY > 0 ? -0.15 : 0.15;
            this.game.setZoom(this.game.zoom + delta, sx, sy);
        }, { passive: false });

        // Pinch zoom (touch)
        this._pinchDist = 0;
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                this._pinchDist = Math.sqrt(dx * dx + dy * dy);
            }
        }, { passive: true });
        canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const newDist = Math.sqrt(dx * dx + dy * dy);
                if (this._pinchDist > 0) {
                    const scale = newDist / this._pinchDist;
                    const rect = canvas.getBoundingClientRect();
                    const mx = ((e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left) * (canvas.width / rect.width);
                    const my = ((e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top) * (canvas.height / rect.height);
                    this.game.setZoom(this.game.zoom * scale, mx, my);
                }
                this._pinchDist = newDist;
            }
        }, { passive: false });

        this.setupTowerButtons();

        // Restart buttons -> return to hub
        document.querySelectorAll('.restart-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                GameAudio.unlock();
                this.game.returnToHub();
            });
        });

        // Next Level button
        const nextLevelBtn = document.getElementById('next-level-btn');
        if (nextLevelBtn) {
            nextLevelBtn.addEventListener('click', () => {
                GameAudio.unlock();
                this.game.nextLevel();
            });
        }

        // Mute SFX button
        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                GameAudio.unlock();
                const muted = GameAudio.toggleMute();
                muteBtn.textContent = muted ? '🔇' : '🔊';
            });
        }

        // Music toggle button
        const musicBtn = document.getElementById('music-btn');
        if (musicBtn) {
            musicBtn.addEventListener('click', () => {
                GameAudio.unlock();
                const off = GameAudio.toggleMusic();
                musicBtn.textContent = off ? '🚫' : '🎵';
            });
        }

        // Speed button
        const speedBtn = document.getElementById('speed-btn');
        if (speedBtn) {
            const speeds = [1, 2, 0.5];
            const labels = ['1x', '2x', '½x'];
            let speedIdx = 0;
            speedBtn.addEventListener('click', () => {
                GameAudio.unlock();
                speedIdx = (speedIdx + 1) % speeds.length;
                this.game.gameSpeed = speeds[speedIdx];
                speedBtn.textContent = labels[speedIdx];
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.game.state !== 'playing') return;
            const cw = this.game.canvas.width;
            const ch = this.game.canvas.height;
            if (e.key === '=' || e.key === '+') {
                this.game.setZoom(this.game.zoom + 0.25, cw / 2, ch / 2);
            } else if (e.key === '-' || e.key === '_') {
                this.game.setZoom(this.game.zoom - 0.25, cw / 2, ch / 2);
            } else if (e.key === '0') {
                this.game.resetCamera();
            } else if (e.key === 'Escape') {
                this.movingTower = null;
                this.selectedTowerType = null;
                this.selectedTower = null;
                this.hideUpgradePanel();
                this.updateTowerButtons();
            }
        });

        // Zoom buttons
        const zoomInBtn = document.getElementById('zoom-in-btn');
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                const cw = this.game.canvas.width;
                const ch = this.game.canvas.height;
                this.game.setZoom(this.game.zoom + 0.25, cw / 2, ch / 2);
            });
        }
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                const cw = this.game.canvas.width;
                const ch = this.game.canvas.height;
                this.game.setZoom(this.game.zoom - 0.25, cw / 2, ch / 2);
            });
        }
        const zoomResetBtn = document.getElementById('zoom-reset-btn');
        if (zoomResetBtn) {
            zoomResetBtn.addEventListener('click', () => {
                this.game.resetCamera();
            });
        }

        // Perspective toggle button
        const perspBtn = document.getElementById('perspective-btn');
        if (perspBtn) {
            perspBtn.addEventListener('click', () => {
                this.game.perspectiveMode = !this.game.perspectiveMode;
                perspBtn.textContent = this.game.perspectiveMode ? '3D' : '2D';
                perspBtn.title = this.game.perspectiveMode ? 'Switch to flat view' : 'Switch to 2.5D view';
            });
        }

        // Close leaderboard
        const closeHs = document.getElementById('close-leaderboard-btn');
        if (closeHs) {
            closeHs.addEventListener('click', () => {
                GameAudio.unlock();
                document.getElementById('leaderboard-screen').style.display = 'none';
            });
        }
    }

    setupTowerButtons() {
        const bar = document.getElementById('tower-bar');
        if (!bar) return;
        bar.innerHTML = '';

        for (const [key, def] of Object.entries(CONFIG.TOWERS)) {
            const btn = document.createElement('button');
            btn.className = 'tower-btn';
            btn.dataset.tower = key;

            let statLine;
            if (def.isPassive) {
                statLine = `+${def.goldPerWave}g/wave`;
            } else {
                statLine = (def.damage / def.fireRate).toFixed(1) + ' DPS';
            }

            btn.innerHTML = `
                <span class="tower-btn-icon">${def.emoji}</span>
                <span class="tower-btn-name">${def.name}</span>
                <span class="tower-btn-cost">${def.cost}g</span>
                <span class="tower-btn-dps">${statLine}</span>
            `;
            btn.addEventListener('click', () => {
                if (this.game.triviaActive) return;
                GameAudio.unlock();
                this.selectTowerType(key);
            });
            bar.appendChild(btn);
        }
    }

    setupAbilityButtons() {
        const bar = document.getElementById('ability-bar');
        if (!bar) return;
        bar.innerHTML = '';

        for (const [key, state] of Object.entries(this.game.abilityState)) {
            const def = CONFIG.TOWERS[key];
            const btn = document.createElement('button');
            btn.className = 'ability-btn';
            btn.dataset.abilityType = key;
            btn.title = state.name + ' - ' + (def.ability ? def.ability.desc : '');
            btn.innerHTML = `
                <span class="ability-btn-icon">${def.emoji}</span>
                <span class="ability-btn-name">${state.name}</span>
                <div class="ability-btn-sweep"></div>
                <span class="ability-btn-cd"></span>
            `;
            btn.addEventListener('click', () => {
                GameAudio.unlock();
                this.game.activateGlobalAbility(key);
            });
            bar.appendChild(btn);
        }
    }

    selectTowerType(type) {
        this.selectedTower = null;
        this.movingTower = null;
        this.hideUpgradePanel();

        if (this.selectedTowerType === type) {
            this.selectedTowerType = null;
        } else {
            this.selectedTowerType = type;
        }
        this.updateTowerButtons();
    }

    updateTowerButtons() {
        document.querySelectorAll('.tower-btn').forEach(btn => {
            const type = btn.dataset.tower;
            btn.classList.toggle('selected', type === this.selectedTowerType);
            const cost = CONFIG.TOWERS[type].cost;
            btn.classList.toggle('too-expensive', cost > this.game.gold);
        });
    }

    updateAbilityButtons() {
        document.querySelectorAll('.ability-btn').forEach(btn => {
            const type = btn.dataset.abilityType;
            const state = this.game.abilityState[type];
            if (!state) return;

            const hasTower = this.game.towers.some(t => t.type === type);
            const cdEl = btn.querySelector('.ability-btn-cd');
            const sweepEl = btn.querySelector('.ability-btn-sweep');

            if (state.active) {
                btn.classList.add('active');
                btn.classList.remove('on-cooldown', 'no-towers', 'ready-glow');
                if (cdEl) cdEl.textContent = Math.ceil(state.timer) + 's';
                // Show remaining duration as sweep (fills as time runs out)
                if (sweepEl) {
                    const pct = 1 - (state.timer / state.duration);
                    const deg = Math.round(pct * 360);
                    sweepEl.style.background = `conic-gradient(rgba(0,0,0,0.5) ${deg}deg, transparent ${deg}deg)`;
                }
            } else if (state.cooldown > 0) {
                btn.classList.add('on-cooldown');
                btn.classList.remove('active', 'no-towers', 'ready-glow');
                if (cdEl) cdEl.textContent = Math.ceil(state.cooldown) + 's';
                // Show cooldown progress as sweep (clears as cooldown expires)
                if (sweepEl) {
                    const pct = state.cooldown / state.cooldownMax;
                    const deg = Math.round(pct * 360);
                    sweepEl.style.background = `conic-gradient(rgba(0,0,0,0.55) ${deg}deg, transparent ${deg}deg)`;
                }
            } else if (!hasTower) {
                btn.classList.add('no-towers');
                btn.classList.remove('active', 'on-cooldown', 'ready-glow');
                if (cdEl) cdEl.textContent = '';
                if (sweepEl) sweepEl.style.background = 'none';
            } else {
                btn.classList.remove('active', 'on-cooldown', 'no-towers');
                btn.classList.add('ready-glow');
                if (cdEl) cdEl.textContent = '';
                if (sweepEl) sweepEl.style.background = 'none';
            }
        });
    }

    _screenToGrid(e) {
        const rect = this.game.canvas.getBoundingClientRect();
        const scaleX = this.game.canvas.width / rect.width;
        const scaleY = this.game.canvas.height / rect.height;
        const sx = (e.clientX - rect.left) * scaleX;
        const sy = (e.clientY - rect.top) * scaleY;
        const world = this.game.screenToWorld(sx, sy);
        return { sx, sy, ...pixelToGrid(world.x, world.y, this.game.tileSize) };
    }

    onPointerDown(e) {
        if (this.game.state !== 'playing') return;
        if (this.game.triviaActive) return;
        GameAudio.unlock();

        // Right-click starts panning
        if (e.button === 2 && this.game.zoom > 1) {
            this._panning = true;
            this._lastPanX = e.clientX;
            this._lastPanY = e.clientY;
            return;
        }

        const { col, row } = this._screenToGrid(e);

        if (col < 0 || col >= CONFIG.GRID_COLS || row < 0 || row >= CONFIG.GRID_ROWS) {
            if (this.movingTower) {
                this.movingTower = null; // cancel move on out-of-bounds click
            }
            return;
        }

        // Move mode: place super tower at new position
        if (this.movingTower) {
            if (this.game.moveTower(this.movingTower, col, row)) {
                this.selectedTower = this.movingTower;
                this.movingTower = null;
                this.showUpgradePanel(this.selectedTower);
            }
            return;
        }

        const existingTower = this.game.towers.find(t => t.col === col && t.row === row);
        if (existingTower) {
            this.selectedTowerType = null;
            this.updateTowerButtons();
            this.selectedTower = existingTower;
            this.showUpgradePanel(existingTower);
            return;
        }

        if (this.selectedTowerType) {
            const cost = CONFIG.TOWERS[this.selectedTowerType].cost;
            if (this.game.gold >= cost && this.game.grid.canPlace(col, row)) {
                this.game.placeTower(this.selectedTowerType, col, row);
            }
        } else {
            this.selectedTower = null;
            this.hideUpgradePanel();
        }
    }

    onPointerMove(e) {
        // Handle panning
        if (this._panning) {
            const rect = this.game.canvas.getBoundingClientRect();
            const scaleX = this.game.canvas.width / rect.width;
            const scaleY = this.game.canvas.height / rect.height;
            const dx = (e.clientX - this._lastPanX) * scaleX / this.game.zoom;
            const dy = (e.clientY - this._lastPanY) * scaleY / this.game.zoom;
            this.game.camX += dx;
            this.game.camY += dy;
            this.game._clampCamera();
            this._lastPanX = e.clientX;
            this._lastPanY = e.clientY;
            return;
        }

        const { col, row } = this._screenToGrid(e);
        this.hoverCol = col;
        this.hoverRow = row;
    }

    showUpgradePanel(tower) {
        const panel = document.getElementById('upgrade-panel');
        if (!panel) return;

        const maxLevel = CONFIG.MAX_TOWER_LEVEL || 4;
        const canUpgrade = !tower.isSuper && tower.level < maxLevel;
        const upgradeCost = tower.getUpgradeCost();
        const sellValue = tower.getSellValue();

        let statsLine;
        if (tower.isPassive) {
            if (tower.isSuper) {
                statsLine = `+${tower.goldPerWave}g/wave | Aura: ${tower.auraRange} tiles`;
            } else {
                const tier = CONFIG.DOGHOUSE_TIERS ? CONFIG.DOGHOUSE_TIERS[tower.auraTier] : null;
                statsLine = tier ? tier.label : `Income: +${tower.goldPerWave}g/wave`;
            }
        } else {
            const effDmg = Math.floor(tower.damage * tower.buffDamageMult);
            const effRate = tower.fireRate * tower.buffFireRateMult;
            const dps = (effDmg / effRate).toFixed(1);
            statsLine = `DPS: ${dps} | DMG: ${effDmg} | SPD: ${effRate.toFixed(2)}s`;
        }

        let extraLine = '';
        if (tower.isPassive && !tower.isSuper) {
            const tier = CONFIG.DOGHOUSE_TIERS ? CONFIG.DOGHOUSE_TIERS[tower.auraTier] : null;
            if (tier && tier.next) {
                extraLine = `Next: ${tier.next}`;
            }
            if (tier && tier.auraRange > 0) {
                extraLine = `Aura: ${tier.auraRange} tiles` + (extraLine ? ` | ${extraLine}` : '');
            }
        } else if (tower.isSuper && tower.isPassive) {
            extraLine = '+Spd | +Rng | +Dmg | Ultimate';
        } else if (!tower.isPassive) {
            const effRange = tower.range + tower.buffRange;
            extraLine = `RNG: ${effRange.toFixed(1)}${tower.slow > 0 ? ' | Slow: ' + Math.round((1 - tower.slow) * 100) + '%' : ''}${tower.splash > 0 ? ' | Splash' : ''}${tower.chainCount > 0 ? ' | Chain: ' + tower.chainCount : ''}`;
            if (tower.superPerk) {
                const perkLabels = {
                    tripleShot: '3x Shot',
                    freezeBlast: 'AoE Freeze',
                    frostZone: 'Frost Zone',
                    megaChain: 'Mega Chain',
                    stun: 'Earthquake Stun'
                };
                extraLine += ' | ' + (perkLabels[tower.superPerk] || tower.superPerk);
            }
            if (tower.isBuffed) {
                extraLine += ' | 🏠 Buffed';
            }
        }

        const headerClass = tower.isSuper ? 'upgrade-header super' : 'upgrade-header';
        const moveBtn = tower.isSuper && tower.canMove
            ? '<button id="move-btn">Move ↗</button>'
            : (tower.isSuper ? '<button class="disabled">Moved</button>' : '');

        panel.innerHTML = `
            <div class="${headerClass}">${tower.emoji} ${tower.name}${tower.isSuper ? ' ★' : ' Lv.' + tower.level}</div>
            <div class="upgrade-stats">${statsLine}</div>
            ${extraLine ? `<div class="upgrade-stats">${extraLine}</div>` : ''}
            <div class="upgrade-actions">
                ${canUpgrade ? `<button id="upgrade-btn" class="${upgradeCost > this.game.gold ? 'disabled' : ''}">Upgrade (${upgradeCost}g)</button>` : `<button class="disabled">${tower.isSuper ? 'SUPER' : 'MAX'}</button>`}
                ${moveBtn}
                <button id="sell-btn">Sell (${sellValue}g)</button>
            </div>
        `;
        panel.style.display = 'flex';

        const upgradeBtn = document.getElementById('upgrade-btn');
        if (upgradeBtn && canUpgrade && upgradeCost <= this.game.gold) {
            upgradeBtn.addEventListener('click', () => {
                if (this.game.triviaActive) return;
                this.game.upgradeTower(tower);
                this.showUpgradePanel(tower);
            });
        }

        const moveBtnEl = document.getElementById('move-btn');
        if (moveBtnEl) {
            moveBtnEl.addEventListener('click', () => {
                if (this.game.triviaActive) return;
                this.movingTower = tower;
                this.selectedTowerType = null;
                this.updateTowerButtons();
                this.hideUpgradePanel();
            });
        }

        const sellBtn = document.getElementById('sell-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                if (this.game.triviaActive) return;
                this.game.sellTower(tower);
                this.hideUpgradePanel();
                this.selectedTower = null;
            });
        }
    }

    hideUpgradePanel() {
        const panel = document.getElementById('upgrade-panel');
        if (panel) panel.style.display = 'none';
    }

    updateHUD() {
        const goldEl = document.getElementById('gold-display');
        const livesEl = document.getElementById('lives-display');
        const waveEl = document.getElementById('wave-display');
        const timerEl = document.getElementById('timer-display');
        const levelEl = document.getElementById('level-display');

        if (goldEl) goldEl.textContent = this.game.gold;
        if (livesEl) livesEl.textContent = this.game.lives;
        if (waveEl) waveEl.textContent = this.game.waveManager.getWaveDisplay();
        if (levelEl) levelEl.textContent = this.game.waveManager.getLevelDisplay();

        const timer = this.game.waveManager.getTimerDisplay();
        if (timerEl) {
            timerEl.textContent = timer !== null ? `Next: ${timer}s` : '';
        }

        this.updateTowerButtons();
        this.updateAbilityButtons();
    }
}
