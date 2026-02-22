// Main game loop and state management

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.state = 'title'; // title, playing, level_complete, won, lost

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.grid = new Grid(0);
        this.renderer = new Renderer(this.canvas, this.tileSize);
        this.waveManager = new WaveManager();
        this.ui = new UI(this);

        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.gold = CONFIG.START_GOLD;
        this.lives = CONFIG.START_LIVES;

        this.lastTime = performance.now();
        this.gameSpeed = 1;

        // Player name & stats
        this.playerName = '';
        this.kills = 0;

        // Trivia state
        this.triviaActive = false;
        this.triviaTimer = 0;
        this.triviaQuestion = null;
        this.triviaAnswered = false;
        this.triviaResultTimer = 0;
        this.triviaCorrect = false;
        this.triviaUsed = [];
        this._triviaShownForWave = -1;

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

    startGame() {
        // Get player name
        const nameInput = document.getElementById('player-name');
        this.playerName = (nameInput ? nameInput.value.trim() : '') || 'Anonymous';
        this.kills = 0;

        this.state = 'playing';
        document.getElementById('title-screen').style.display = 'none';
        document.getElementById('hud').style.display = 'flex';
        document.getElementById('tower-bar').style.display = 'flex';
        document.getElementById('game-controls').style.display = 'flex';
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
        this.gold = CONFIG.START_GOLD;
        this.lives = CONFIG.START_LIVES;
        this.kills = 0;
        this.ui.selectedTowerType = null;
        this.ui.selectedTower = null;
        this.ui.hideUpgradePanel();
        this.resize();

        this.triviaActive = false;
        this.triviaUsed = [];
        this._triviaShownForWave = -1;
        this._hideTrivia();

        document.getElementById('title-screen').style.display = 'none';
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('victory-screen').style.display = 'none';
        document.getElementById('level-complete-screen').style.display = 'none';
        document.getElementById('hud').style.display = 'flex';
        document.getElementById('tower-bar').style.display = 'flex';
        document.getElementById('game-controls').style.display = 'flex';
        this.gameSpeed = 1;
        const speedBtn = document.getElementById('speed-btn');
        if (speedBtn) speedBtn.textContent = '1x';
        this.ui.updateHUD();
    }

    placeTower(type, col, row) {
        const cost = CONFIG.TOWERS[type].cost;
        this.gold -= cost;
        this.grid.placeTower(col, row);
        GameAudio.placeTower();

        const tower = new Tower(type, col, row, this.tileSize);
        this.towers.push(tower);

        const newPath = this.grid.currentPath;
        for (const enemy of this.enemies) {
            if (enemy.alive && !enemy.reachedEnd) {
                enemy.updatePath(newPath);
            }
        }
    }

    upgradeTower(tower) {
        const maxLevel = CONFIG.MAX_TOWER_LEVEL || 4;
        const cost = tower.getUpgradeCost();
        if (this.gold >= cost && tower.level < maxLevel) {
            this.gold -= tower.upgrade();
            GameAudio.upgradeTower();
        }
    }

    sellTower(tower) {
        const refund = tower.getSellValue();
        this.gold += refund;
        GameAudio.sellTower();
        this.grid.removeTower(tower.col, tower.row);
        this.towers = this.towers.filter(t => t !== tower);

        const newPath = this.grid.currentPath;
        for (const enemy of this.enemies) {
            if (enemy.alive && !enemy.reachedEnd) {
                enemy.updatePath(newPath);
            }
        }
    }

    // === TRIVIA SYSTEM ===
    _pickTrivia() {
        const pool = CONFIG.TRIVIA;
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
            GameAudio.goldEarned();
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
        this.ui.selectedTowerType = null;
        this.ui.selectedTower = null;
        this.ui.hideUpgradePanel();
        this.state = 'playing';
        this._triviaShownForWave = -1;
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

            // Spawn minions when timer hits 0
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
                    GameAudio.bossRoar();
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

    update(dt) {
        if (this.state !== 'playing') return;

        dt = Math.min(dt, 0.1);

        this._updateTrivia(dt);
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
                GameAudio.enemyEscape();
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
        this.projectiles = this.projectiles.filter(p => p.alive);

        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
        }
        this.particles = this.particles.filter(p => p.life > 0);

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
        this.renderer.clear();
        this.renderer.drawGrid(this.grid);
        this.renderer.drawPath(this.grid.currentPath);

        if (this.ui.selectedTowerType && this.state === 'playing') {
            const canPlace = this.grid.canPlace(this.ui.hoverCol, this.ui.hoverRow);
            this.renderer.drawPlacementPreview(
                this.ui.hoverCol, this.ui.hoverRow,
                canPlace, this.ui.selectedTowerType
            );
        }

        if (this.ui.selectedTower) {
            this.renderer.drawTowerRange(this.ui.selectedTower);
        }

        for (const tower of this.towers) {
            this.renderer.drawTower(tower);
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
        GameAudio.gameOver();
        const entry = this._saveScore();

        document.getElementById('hud').style.display = 'none';
        document.getElementById('tower-bar').style.display = 'none';
        document.getElementById('upgrade-panel').style.display = 'none';
        document.getElementById('game-controls').style.display = 'none';
        const screen = document.getElementById('game-over-screen');
        screen.style.display = 'flex';
        document.getElementById('go-wave').textContent = this.waveManager.currentWave;
        document.getElementById('go-score').textContent = entry.score;
        document.getElementById('go-kills').textContent = this.kills;
    }

    victory() {
        this.state = 'won';
        this._hideTrivia();
        GameAudio.victory();
        const entry = this._saveScore();

        document.getElementById('hud').style.display = 'none';
        document.getElementById('tower-bar').style.display = 'none';
        document.getElementById('upgrade-panel').style.display = 'none';
        document.getElementById('game-controls').style.display = 'none';
        const screen = document.getElementById('victory-screen');
        screen.style.display = 'flex';
        document.getElementById('vic-gold').textContent = this.gold;
        document.getElementById('vic-score').textContent = entry.score;
        document.getElementById('vic-kills').textContent = this.kills;
    }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
