// Main game loop and state management

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.state = 'title'; // title, playing, won, lost

        // Calculate tile size to fit screen
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.grid = new Grid();
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
        this.gameSpeed = 1; // 1 = normal, 0.5 = slow, 2 = fast

        Audio.init();

        // Start render loop (renders title screen too)
        requestAnimationFrame((t) => this.loop(t));
    }

    resize() {
        const container = document.getElementById('game-container');
        const maxW = container.clientWidth;
        const maxH = container.clientHeight;

        // Calculate tile size to fit grid in available space
        // Leave room for UI bars (top HUD ~50px, bottom bar ~80px)
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

        // Update tower/enemy positions if tile size changed
        for (const tower of (this.towers || [])) {
            tower.tileSize = this.tileSize;
            const pos = gridToPixel(tower.col, tower.row, this.tileSize);
            tower.x = pos.x;
            tower.y = pos.y;
        }
    }

    startGame() {
        this.state = 'playing';
        document.getElementById('title-screen').style.display = 'none';
        document.getElementById('hud').style.display = 'flex';
        document.getElementById('tower-bar').style.display = 'flex';
        document.getElementById('game-controls').style.display = 'flex';
        this.ui.updateHUD();
    }

    restart() {
        this.state = 'playing';
        this.grid = new Grid();
        this.waveManager = new WaveManager();
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.gold = CONFIG.START_GOLD;
        this.lives = CONFIG.START_LIVES;
        this.ui.selectedTowerType = null;
        this.ui.selectedTower = null;
        this.ui.hideUpgradePanel();
        this.resize();

        document.getElementById('title-screen').style.display = 'none';
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('victory-screen').style.display = 'none';
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
        Audio.placeTower();

        const tower = new Tower(type, col, row, this.tileSize);
        this.towers.push(tower);

        // Recalculate paths for all living enemies
        const newPath = this.grid.currentPath;
        for (const enemy of this.enemies) {
            if (enemy.alive && !enemy.reachedEnd) {
                enemy.updatePath(newPath);
            }
        }
    }

    upgradeTower(tower) {
        const cost = tower.getUpgradeCost();
        if (this.gold >= cost && tower.level < 2) {
            this.gold -= tower.upgrade();
            Audio.upgradeTower();
        }
    }

    sellTower(tower) {
        const refund = tower.getSellValue();
        this.gold += refund;
        Audio.sellTower();
        this.grid.removeTower(tower.col, tower.row);
        this.towers = this.towers.filter(t => t !== tower);

        // Recalculate paths
        const newPath = this.grid.currentPath;
        for (const enemy of this.enemies) {
            if (enemy.alive && !enemy.reachedEnd) {
                enemy.updatePath(newPath);
            }
        }
    }

    update(dt) {
        if (this.state !== 'playing') return;

        // Cap dt to prevent huge jumps
        dt = Math.min(dt, 0.1);

        // Spawn enemies via wave manager
        this.waveManager.update(dt, this.grid.currentPath, this.tileSize, this.enemies);

        // Update enemies
        for (const enemy of this.enemies) {
            enemy.update(dt);

            if (enemy.reachedEnd && enemy.alive) {
                enemy.alive = false;
                this.lives--;
                Audio.enemyEscape();
                if (this.lives <= 0) {
                    this.lives = 0;
                    this.gameOver();
                    return;
                }
            }

            // Death particles
            if (!enemy.alive && enemy.hp <= 0 && !enemy._deathHandled) {
                enemy._deathHandled = true;
                this.gold += enemy.gold;
                Audio.enemyDeath();
                for (let i = 0; i < 6; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 30 + Math.random() * 50;
                    this.particles.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 0.5,
                        maxLife: 0.5,
                        color: enemy.color,
                        size: 4
                    });
                }
            }
        }

        // Clean up dead/escaped enemies
        this.enemies = this.enemies.filter(e => e.alive && !e.reachedEnd);

        // Update towers
        for (const tower of this.towers) {
            tower.update(dt, this.enemies, this.projectiles);
        }

        // Update projectiles
        for (const proj of this.projectiles) {
            proj.update(dt, this.enemies, this.particles);
        }
        this.projectiles = this.projectiles.filter(p => p.alive);

        // Update particles
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
        }
        this.particles = this.particles.filter(p => p.life > 0);

        // Wave income when transitioning between waves
        if (this.waveManager.betweenWaves && !this.waveManager._incomeGiven) {
            this.waveManager._incomeGiven = true;
            this.gold += CONFIG.WAVE_INCOME;
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

        // Draw path preview
        this.renderer.drawPath(this.grid.currentPath);

        // Draw placement preview
        if (this.ui.selectedTowerType && this.state === 'playing') {
            const canPlace = this.grid.canPlace(this.ui.hoverCol, this.ui.hoverRow);
            this.renderer.drawPlacementPreview(
                this.ui.hoverCol, this.ui.hoverRow,
                canPlace, this.ui.selectedTowerType
            );
        }

        // Draw selected tower range
        if (this.ui.selectedTower) {
            this.renderer.drawTowerRange(this.ui.selectedTower);
        }

        // Draw towers
        for (const tower of this.towers) {
            this.renderer.drawTower(tower);
        }

        // Draw enemies
        for (const enemy of this.enemies) {
            this.renderer.drawEnemy(enemy);
        }

        // Draw projectiles
        for (const proj of this.projectiles) {
            this.renderer.drawProjectile(proj);
        }

        // Draw particles
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
        Audio.gameOver();
        document.getElementById('hud').style.display = 'none';
        document.getElementById('tower-bar').style.display = 'none';
        document.getElementById('upgrade-panel').style.display = 'none';
        document.getElementById('game-controls').style.display = 'none';
        const screen = document.getElementById('game-over-screen');
        screen.style.display = 'flex';
        document.getElementById('go-wave').textContent = this.waveManager.currentWave;
    }

    victory() {
        this.state = 'won';
        Audio.victory();
        document.getElementById('hud').style.display = 'none';
        document.getElementById('tower-bar').style.display = 'none';
        document.getElementById('upgrade-panel').style.display = 'none';
        document.getElementById('game-controls').style.display = 'none';
        const screen = document.getElementById('victory-screen');
        screen.style.display = 'flex';
        document.getElementById('vic-gold').textContent = this.gold;
    }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
