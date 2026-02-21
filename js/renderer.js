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

    // Color helpers for 3D shading
    _shadeColor(hex, factor) {
        const r = parseInt(hex.slice(1,3), 16);
        const g = parseInt(hex.slice(3,5), 16);
        const b = parseInt(hex.slice(5,7), 16);
        return `rgb(${Math.floor(r*factor)},${Math.floor(g*factor)},${Math.floor(b*factor)})`;
    }

    _lightenColor(hex, factor) {
        const r = parseInt(hex.slice(1,3), 16);
        const g = parseInt(hex.slice(3,5), 16);
        const b = parseInt(hex.slice(5,7), 16);
        return `rgb(${Math.floor(r+(255-r)*factor)},${Math.floor(g+(255-g)*factor)},${Math.floor(b+(255-b)*factor)})`;
    }

    // 3D sphere-like circle with radial gradient, outline, and specular highlight
    _draw3DCircle(cx, cy, radius, baseColor) {
        const ctx = this.ctx;

        // Radial gradient: light top-left to dark bottom-right
        const grad = ctx.createRadialGradient(
            cx - radius * 0.3, cy - radius * 0.3, radius * 0.05,
            cx, cy, radius
        );
        grad.addColorStop(0, this._lightenColor(baseColor, 0.4));
        grad.addColorStop(0.5, baseColor);
        grad.addColorStop(1, this._shadeColor(baseColor, 0.5));

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = this._shadeColor(baseColor, 0.35);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Specular highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(cx - radius * 0.25, cy - radius * 0.3, radius * 0.3, radius * 0.15, -0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3D ear with gradient and outline
    _draw3DEar(cx, cy, rx, ry, rotation, baseColor) {
        const ctx = this.ctx;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);

        const grad = ctx.createRadialGradient(-rx * 0.2, -ry * 0.2, 0, 0, 0, Math.max(rx, ry));
        grad.addColorStop(0, this._lightenColor(baseColor, 0.2));
        grad.addColorStop(1, this._shadeColor(baseColor, 0.45));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this._shadeColor(baseColor, 0.35);
        ctx.lineWidth = 1;
        ctx.stroke();

        // Inner ear
        ctx.fillStyle = this._lightenColor(baseColor, 0.15);
        ctx.beginPath();
        ctx.ellipse(0, ry * 0.05, rx * 0.5, ry * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawTower(tower) {
        const ts = this.tileSize;
        const ctx = this.ctx;
        const x = tower.x;
        const y = tower.y;
        const size = ts * 0.4;
        const color = tower.color;

        // Attack animation (scale bounce)
        const scale = 1 + tower.attackAnim * 0.2;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(0, size * 0.7, size * 1.0, size * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3D Ears (behind body)
        this._draw3DEar(-size * 0.7, -size * 0.6, size * 0.35, size * 0.5, -0.3, color);
        this._draw3DEar(size * 0.7, -size * 0.6, size * 0.35, size * 0.5, 0.3, color);

        // 3D Dog body
        this._draw3DCircle(0, 0, size, color);

        // Lighter muzzle area
        const muzzleGrad = ctx.createRadialGradient(0, size * 0.15, 0, 0, size * 0.15, size * 0.35);
        muzzleGrad.addColorStop(0, this._lightenColor(color, 0.4));
        muzzleGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = muzzleGrad;
        ctx.beginPath();
        ctx.ellipse(0, size * 0.2, size * 0.4, size * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes with gloss
        const eyeR = size * 0.2;
        [-1, 1].forEach(side => {
            const ex = side * size * 0.3;
            const ey = -size * 0.15;

            // Eye white gradient
            const eyeGrad = ctx.createRadialGradient(ex - eyeR * 0.2, ey - eyeR * 0.2, 0, ex, ey, eyeR);
            eyeGrad.addColorStop(0, '#fff');
            eyeGrad.addColorStop(1, '#ddd');
            ctx.fillStyle = eyeGrad;
            ctx.beginPath();
            ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#aaa';
            ctx.lineWidth = 0.8;
            ctx.stroke();

            // Pupil
            const px = ex + side * size * 0.05;
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(px, ey, eyeR * 0.5, 0, Math.PI * 2);
            ctx.fill();

            // Eye glint
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.beginPath();
            ctx.arc(px - eyeR * 0.2, ey - eyeR * 0.2, eyeR * 0.18, 0, Math.PI * 2);
            ctx.fill();
        });

        // 3D Nose
        const noseGrad = ctx.createRadialGradient(-size * 0.03, size * 0.11, 0, 0, size * 0.15, size * 0.13);
        noseGrad.addColorStop(0, '#555');
        noseGrad.addColorStop(0.7, '#222');
        noseGrad.addColorStop(1, '#111');
        ctx.fillStyle = noseGrad;
        ctx.beginPath();
        ctx.ellipse(0, size * 0.15, size * 0.13, size * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose shine
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(-size * 0.03, size * 0.12, size * 0.05, size * 0.025, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, size * 0.1, size * 0.25, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Big Boi collar (drawn inside save/restore so it scales with attack anim)
        if (tower.type === 'bigboi') {
            ctx.strokeStyle = '#C62828';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, size * 0.05, size * 0.85, 0.4, Math.PI - 0.4);
            ctx.stroke();
            // Tag
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, size * 0.72, size * 0.11, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#B8860B';
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }

        ctx.restore();

        // Level star with glow
        if (tower.level > 1) {
            ctx.save();
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 6;
            ctx.fillStyle = '#FFD700';
            ctx.font = `bold ${ts * 0.28}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', x + size * 0.9, y - size * 0.9);
            ctx.restore();
        }

        // Poodle poofy hair
        if (tower.type === 'poodle') {
            const s = scale; // match attack anim
            this._draw3DCircle(x, y - size * s * 1.1, size * 0.28 * s, '#FFC0CB');
            this._draw3DCircle(x - size * 0.22 * s, y - size * s * 0.95, size * 0.16 * s, '#FFD0D8');
            this._draw3DCircle(x + size * 0.22 * s, y - size * s * 0.95, size * 0.16 * s, '#FFD0D8');
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
