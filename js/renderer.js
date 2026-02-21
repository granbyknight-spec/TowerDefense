// Canvas rendering - draws everything

class Renderer {
    constructor(canvas, tileSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileSize = tileSize;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGrid(grid) {
        const ts = this.tileSize;
        const ctx = this.ctx;

        for (let r = 0; r < grid.rows; r++) {
            for (let c = 0; c < grid.cols; c++) {
                // Checkerboard grass
                const isAlt = (r + c) % 2 === 0;
                ctx.fillStyle = isAlt ? CONFIG.GRASS_COLOR : CONFIG.GRASS_COLOR_ALT;
                ctx.fillRect(c * ts, r * ts, ts, ts);
            }
        }

        // Grid lines
        ctx.strokeStyle = CONFIG.GRID_LINE_COLOR;
        ctx.lineWidth = 0.5;
        for (let r = 0; r <= grid.rows; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * ts);
            ctx.lineTo(grid.cols * ts, r * ts);
            ctx.stroke();
        }
        for (let c = 0; c <= grid.cols; c++) {
            ctx.beginPath();
            ctx.moveTo(c * ts, 0);
            ctx.lineTo(c * ts, grid.rows * ts);
            ctx.stroke();
        }

        // Entry marker
        const entry = gridToPixel(grid.entry.col, grid.entry.row, ts);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(grid.entry.col * ts, grid.entry.row * ts, ts, ts);
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${ts * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('IN', entry.x, entry.y);

        // Exit marker
        const exit = gridToPixel(grid.exit.col, grid.exit.row, ts);
        ctx.fillStyle = '#f44336';
        ctx.fillRect(grid.exit.col * ts, grid.exit.row * ts, ts, ts);
        ctx.fillStyle = '#fff';
        ctx.fillText('OUT', exit.x, exit.y);
    }

    drawPath(path) {
        if (!path || path.length < 2) return;
        const ts = this.tileSize;
        const ctx = this.ctx;

        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = ts * 0.15;
        ctx.setLineDash([ts * 0.2, ts * 0.15]);
        ctx.beginPath();

        const start = gridToPixel(path[0].col, path[0].row, ts);
        ctx.moveTo(start.x, start.y);

        for (let i = 1; i < path.length; i++) {
            const p = gridToPixel(path[i].col, path[i].row, ts);
            ctx.lineTo(p.x, p.y);
        }

        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawPlacementPreview(col, row, canPlace, selectedTower) {
        if (col < 0 || row < 0) return;
        const ts = this.tileSize;
        const ctx = this.ctx;

        // Highlight tile
        ctx.fillStyle = canPlace ? CONFIG.VALID_COLOR : CONFIG.BLOCKED_COLOR;
        ctx.fillRect(col * ts, row * ts, ts, ts);

        // Range preview if can place
        if (canPlace && selectedTower) {
            const def = CONFIG.TOWERS[selectedTower];
            const pos = gridToPixel(col, row, ts);
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, def.range * ts, 0, Math.PI * 2);
            ctx.fillStyle = CONFIG.RANGE_COLOR;
            ctx.fill();
        }
    }

    drawTower(tower) {
        const ts = this.tileSize;
        const ctx = this.ctx;
        const x = tower.x;
        const y = tower.y;
        const size = ts * 0.4;

        // Attack animation (scale bounce)
        const scale = 1 + tower.attackAnim * 0.2;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Dog body (circle)
        ctx.fillStyle = tower.color;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();

        // Dog ears
        ctx.beginPath();
        ctx.ellipse(-size * 0.7, -size * 0.6, size * 0.35, size * 0.5, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(size * 0.7, -size * 0.6, size * 0.35, size * 0.5, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-size * 0.3, -size * 0.15, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(size * 0.3, -size * 0.15, size * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(-size * 0.25, -size * 0.15, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(size * 0.35, -size * 0.15, size * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(0, size * 0.15, size * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // Mouth (smile)
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, size * 0.1, size * 0.25, 0.2, Math.PI - 0.2);
        ctx.stroke();

        ctx.restore();

        // Level indicator
        if (tower.level > 1) {
            ctx.fillStyle = '#FFD700';
            ctx.font = `bold ${ts * 0.25}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', x + size * 0.9, y - size * 0.9);
        }

        // Type-specific flair
        if (tower.type === 'poodle') {
            // Poofy hair tuft
            ctx.fillStyle = '#FFC0CB';
            ctx.beginPath();
            ctx.arc(x, y - size * 1.1, size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawTowerRange(tower) {
        const ts = this.tileSize;
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.range * ts, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.RANGE_COLOR;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    drawEnemy(enemy) {
        if (!enemy.alive) return;
        const ts = this.tileSize;
        const ctx = this.ctx;
        const size = ts * enemy.size;

        // Wobble animation
        const wobbleX = Math.sin(enemy.wobble) * 2;

        ctx.save();
        ctx.translate(enemy.x + wobbleX, enemy.y);

        // Cat body
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();

        // Cat ears (triangles)
        ctx.beginPath();
        ctx.moveTo(-size * 0.7, -size * 0.5);
        ctx.lineTo(-size * 0.3, -size * 1.1);
        ctx.lineTo(-size * 0.0, -size * 0.5);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(size * 0.0, -size * 0.5);
        ctx.lineTo(size * 0.3, -size * 1.1);
        ctx.lineTo(size * 0.7, -size * 0.5);
        ctx.fill();

        // Inner ears
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.moveTo(-size * 0.55, -size * 0.55);
        ctx.lineTo(-size * 0.3, -size * 0.9);
        ctx.lineTo(-size * 0.1, -size * 0.55);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(size * 0.1, -size * 0.55);
        ctx.lineTo(size * 0.3, -size * 0.9);
        ctx.lineTo(size * 0.55, -size * 0.55);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-size * 0.3, -size * 0.1, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(size * 0.3, -size * 0.1, size * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Slit pupils
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.ellipse(-size * 0.3, -size * 0.1, size * 0.06, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(size * 0.3, -size * 0.1, size * 0.06, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = '#E91E63';
        ctx.beginPath();
        ctx.moveTo(0, size * 0.1);
        ctx.lineTo(-size * 0.1, size * 0.2);
        ctx.lineTo(size * 0.1, size * 0.2);
        ctx.closePath();
        ctx.fill();

        // Whiskers
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        // Left
        ctx.beginPath(); ctx.moveTo(-size * 0.15, size * 0.2); ctx.lineTo(-size * 0.8, size * 0.05); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-size * 0.15, size * 0.25); ctx.lineTo(-size * 0.8, size * 0.3); ctx.stroke();
        // Right
        ctx.beginPath(); ctx.moveTo(size * 0.15, size * 0.2); ctx.lineTo(size * 0.8, size * 0.05); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(size * 0.15, size * 0.25); ctx.lineTo(size * 0.8, size * 0.3); ctx.stroke();

        ctx.restore();

        // Slow indicator
        if (enemy.slowTimer > 0) {
            ctx.fillStyle = 'rgba(180, 130, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, size * 1.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // HP bar
        const barWidth = ts * 0.8;
        const barHeight = 4;
        const barX = enemy.x - barWidth / 2;
        const barY = enemy.y - size - barHeight - 6;
        const hpRatio = enemy.hp / enemy.maxHp;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const hpColor = hpRatio > 0.5 ? '#4CAF50' : hpRatio > 0.25 ? '#FF9800' : '#f44336';
        ctx.fillStyle = hpColor;
        ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
    }

    drawProjectile(proj) {
        if (!proj.alive) return;
        const ctx = this.ctx;

        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.fillStyle = proj.color + '66';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.size * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawParticle(p) {
        const ctx = this.ctx;
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    drawDeathEffect(x, y) {
        const ctx = this.ctx;
        // Quick poof particles are handled by particle system
        // This draws the "poof" text
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = `${this.tileSize * 0.3}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('poof!', x, y);
    }
}
