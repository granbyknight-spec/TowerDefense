// UI management - HUD, tower selection, touch/click handling

class UI {
    constructor(game) {
        this.game = game;
        this.selectedTowerType = null;
        this.selectedTower = null; // existing tower tapped for upgrade/sell
        this.hoverCol = -1;
        this.hoverRow = -1;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const canvas = this.game.canvas;

        // Unified pointer events for mouse + touch
        canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));

        // Prevent context menu on long press
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Tower selection buttons (set up after DOM ready)
        this.setupTowerButtons();

        // Send Early button
        const sendBtn = document.getElementById('send-early-btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                Audio.buttonClick();
                if (this.game.waveManager.sendEarly()) {
                    this.game.gold += CONFIG.SEND_EARLY_BONUS;
                }
            });
        }

        // Start button
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                Audio.buttonClick();
                this.game.startGame();
            });
        }

        // Restart buttons
        document.querySelectorAll('.restart-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                Audio.buttonClick();
                this.game.restart();
            });
        });

        // Mute button
        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                const muted = Audio.toggleMute();
                muteBtn.textContent = muted ? '🔇' : '🔊';
            });
        }

        // Speed button
        const speedBtn = document.getElementById('speed-btn');
        if (speedBtn) {
            const speeds = [1, 2, 0.5];
            const labels = ['1x', '2x', '½x'];
            let speedIdx = 0;
            speedBtn.addEventListener('click', () => {
                Audio.buttonClick();
                speedIdx = (speedIdx + 1) % speeds.length;
                this.game.gameSpeed = speeds[speedIdx];
                speedBtn.textContent = labels[speedIdx];
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
            btn.innerHTML = `
                <span class="tower-btn-icon">${def.emoji}</span>
                <span class="tower-btn-name">${def.name}</span>
                <span class="tower-btn-cost">${def.cost}g</span>
            `;
            btn.addEventListener('click', () => {
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

        const rect = this.game.canvas.getBoundingClientRect();
        const scaleX = this.game.canvas.width / rect.width;
        const scaleY = this.game.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const { col, row } = pixelToGrid(x, y, this.game.tileSize);

        if (col < 0 || col >= CONFIG.GRID_COLS || row < 0 || row >= CONFIG.GRID_ROWS) return;

        // Check if tapped an existing tower
        const existingTower = this.game.towers.find(t => t.col === col && t.row === row);

        if (existingTower) {
            this.selectedTowerType = null;
            this.updateTowerButtons();
            this.selectedTower = existingTower;
            this.showUpgradePanel(existingTower);
            return;
        }

        // Place new tower
        if (this.selectedTowerType) {
            const cost = CONFIG.TOWERS[this.selectedTowerType].cost;
            if (this.game.gold >= cost && this.game.grid.canPlace(col, row)) {
                this.game.placeTower(this.selectedTowerType, col, row);
            }
        } else {
            // Tapped empty space, deselect
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

        const canUpgrade = tower.level < 2;
        const upgradeCost = tower.getUpgradeCost();
        const sellValue = tower.getSellValue();

        panel.innerHTML = `
            <div class="upgrade-header">${tower.emoji} ${tower.name} Lv.${tower.level}</div>
            <div class="upgrade-stats">DMG: ${tower.damage} | RNG: ${tower.range.toFixed(1)} | SPD: ${tower.fireRate.toFixed(1)}s</div>
            <div class="upgrade-actions">
                ${canUpgrade ? `<button id="upgrade-btn" class="${upgradeCost > this.game.gold ? 'disabled' : ''}">Upgrade (${upgradeCost}g)</button>` : '<button class="disabled">MAX</button>'}
                <button id="sell-btn">Sell (${sellValue}g)</button>
            </div>
        `;
        panel.style.display = 'flex';

        const upgradeBtn = document.getElementById('upgrade-btn');
        if (upgradeBtn && canUpgrade && upgradeCost <= this.game.gold) {
            upgradeBtn.addEventListener('click', () => {
                this.game.upgradeTower(tower);
                this.showUpgradePanel(tower); // refresh
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

        if (goldEl) goldEl.textContent = this.game.gold;
        if (livesEl) livesEl.textContent = this.game.lives;
        if (waveEl) waveEl.textContent = this.game.waveManager.getWaveDisplay();

        const timer = this.game.waveManager.getTimerDisplay();
        if (timerEl) {
            timerEl.textContent = timer !== null ? `Next wave: ${timer}s` : '';
        }
        if (sendBtn) {
            sendBtn.style.display = this.game.waveManager.betweenWaves ? 'block' : 'none';
        }

        this.updateTowerButtons();
    }
}
