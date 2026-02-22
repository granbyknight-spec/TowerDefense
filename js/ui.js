// UI management - HUD, tower selection, touch/click handling

class UI {
    constructor(game) {
        this.game = game;
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.hoverCol = -1;
        this.hoverRow = -1;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const canvas = this.game.canvas;

        canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        this.setupTowerButtons();

        // Send Early button
        const sendBtn = document.getElementById('send-early-btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                GameAudio.unlock();
                GameAudio.buttonClick();
                if (this.game.waveManager.sendEarly()) {
                    this.game.gold += CONFIG.SEND_EARLY_BONUS;
                }
            });
        }

        // Start button
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                GameAudio.unlock();
                GameAudio.buttonClick();
                this.game.startGame();
            });
        }

        // Restart buttons
        document.querySelectorAll('.restart-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                GameAudio.unlock();
                GameAudio.buttonClick();
                this.game.restart();
            });
        });

        // Next Level button
        const nextLevelBtn = document.getElementById('next-level-btn');
        if (nextLevelBtn) {
            nextLevelBtn.addEventListener('click', () => {
                GameAudio.unlock();
                GameAudio.buttonClick();
                this.game.nextLevel();
            });
        }

        // Mute button
        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                GameAudio.unlock();
                const muted = GameAudio.toggleMute();
                muteBtn.textContent = muted ? '🔇' : '🔊';
                if (!muted) GameAudio.buttonClick();
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
                GameAudio.buttonClick();
                speedIdx = (speedIdx + 1) % speeds.length;
                this.game.gameSpeed = speeds[speedIdx];
                speedBtn.textContent = labels[speedIdx];
            });
        }

        // High Scores button
        const hsBtn = document.getElementById('highscores-btn');
        if (hsBtn) {
            hsBtn.addEventListener('click', () => {
                GameAudio.unlock();
                GameAudio.buttonClick();
                this.game.showLeaderboard();
            });
        }

        // Close leaderboard
        const closeHs = document.getElementById('close-leaderboard-btn');
        if (closeHs) {
            closeHs.addEventListener('click', () => {
                GameAudio.unlock();
                GameAudio.buttonClick();
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
                GameAudio.unlock();
                this.selectTowerType(key);
            });
            bar.appendChild(btn);
        }
    }

    selectTowerType(type) {
        this.selectedTower = null;
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

    onPointerDown(e) {
        if (this.game.state !== 'playing') return;
        GameAudio.unlock();

        const rect = this.game.canvas.getBoundingClientRect();
        const scaleX = this.game.canvas.width / rect.width;
        const scaleY = this.game.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const { col, row } = pixelToGrid(x, y, this.game.tileSize);

        if (col < 0 || col >= CONFIG.GRID_COLS || row < 0 || row >= CONFIG.GRID_ROWS) return;

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
        const rect = this.game.canvas.getBoundingClientRect();
        const scaleX = this.game.canvas.width / rect.width;
        const scaleY = this.game.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const { col, row } = pixelToGrid(x, y, this.game.tileSize);
        this.hoverCol = col;
        this.hoverRow = row;
    }

    showUpgradePanel(tower) {
        const panel = document.getElementById('upgrade-panel');
        if (!panel) return;

        const maxLevel = CONFIG.MAX_TOWER_LEVEL || 4;
        const canUpgrade = tower.level < maxLevel;
        const upgradeCost = tower.getUpgradeCost();
        const sellValue = tower.getSellValue();

        let statsLine;
        if (tower.isPassive) {
            statsLine = `Income: +${tower.goldPerWave}g/wave`;
        } else {
            const dps = (tower.damage / tower.fireRate).toFixed(1);
            statsLine = `DPS: ${dps} | DMG: ${tower.damage} | SPD: ${tower.fireRate.toFixed(2)}s`;
        }

        let extraLine = '';
        if (!tower.isPassive) {
            extraLine = `RNG: ${tower.range.toFixed(1)}${tower.slow > 0 ? ' | Slow: ' + Math.round((1 - tower.slow) * 100) + '%' : ''}${tower.splash > 0 ? ' | Splash' : ''}`;
        }

        // Ability button
        let abilityHtml = '';
        if (tower.abilityName) {
            const ready = tower.canActivateAbility();
            const cdLeft = tower.abilityCooldown > 0 ? ` (${Math.ceil(tower.abilityCooldown)}s)` : '';
            abilityHtml = `<button id="ability-btn" class="${ready ? '' : 'disabled'}" style="background:#FF9800;">${tower.abilityName}${cdLeft}</button>`;
        }

        panel.innerHTML = `
            <div class="upgrade-header">${tower.emoji} ${tower.name} Lv.${tower.level}</div>
            <div class="upgrade-stats">${statsLine}</div>
            ${extraLine ? `<div class="upgrade-stats">${extraLine}</div>` : ''}
            <div class="upgrade-actions">
                ${canUpgrade ? `<button id="upgrade-btn" class="${upgradeCost > this.game.gold ? 'disabled' : ''}">Upgrade (${upgradeCost}g)</button>` : '<button class="disabled">MAX</button>'}
                <button id="sell-btn">Sell (${sellValue}g)</button>
            </div>
            ${abilityHtml ? `<div class="upgrade-actions">${abilityHtml}</div>` : ''}
        `;
        panel.style.display = 'flex';

        const upgradeBtn = document.getElementById('upgrade-btn');
        if (upgradeBtn && canUpgrade && upgradeCost <= this.game.gold) {
            upgradeBtn.addEventListener('click', () => {
                this.game.upgradeTower(tower);
                this.showUpgradePanel(tower);
            });
        }

        const sellBtn = document.getElementById('sell-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                this.game.sellTower(tower);
                this.hideUpgradePanel();
                this.selectedTower = null;
            });
        }

        const abilityBtn = document.getElementById('ability-btn');
        if (abilityBtn && tower.canActivateAbility()) {
            abilityBtn.addEventListener('click', () => {
                tower.activateAbility(this.game.enemies, this.game.particles);
                this.showUpgradePanel(tower);
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
        const sendBtn = document.getElementById('send-early-btn');
        const levelEl = document.getElementById('level-display');

        if (goldEl) goldEl.textContent = this.game.gold;
        if (livesEl) livesEl.textContent = this.game.lives;
        if (waveEl) waveEl.textContent = this.game.waveManager.getWaveDisplay();
        if (levelEl) levelEl.textContent = this.game.waveManager.getLevelDisplay();

        const timer = this.game.waveManager.getTimerDisplay();
        if (timerEl) {
            timerEl.textContent = timer !== null ? `Next: ${timer}s` : '';
        }
        if (sendBtn) {
            sendBtn.style.display = this.game.waveManager.betweenWaves ? 'block' : 'none';
        }

        this.updateTowerButtons();
    }
}
