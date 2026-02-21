// Canvas rendering - bird's-eye terrain with 3D puppy towers

class Renderer {
    constructor(canvas, tileSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileSize = tileSize;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // === SEEDED RANDOM for consistent terrain ===
    _hash(x, y) {
        let h = x * 374761393 + y * 668265263;
        h = (h ^ (h >> 13)) * 1274126177;
        return ((h ^ (h >> 16)) >>> 0) / 4294967296;
    }

    // === COLOR HELPERS ===
    _shade(hex, f) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${(r * f) | 0},${(g * f) | 0},${(b * f) | 0})`;
    }

    _lighten(hex, f) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${(r + (255 - r) * f) | 0},${(g + (255 - g) * f) | 0},${(b + (255 - b) * f) | 0})`;
    }

    // === BIRD'S-EYE TERRAIN ===
    drawGrid(grid) {
        const ts = this.tileSize;
        const ctx = this.ctx;

        for (let r = 0; r < grid.rows; r++) {
            for (let c = 0; c < grid.cols; c++) {
                this._drawGrassTile(ctx, c, r, ts, grid);
            }
        }

        // Entry portal
        this._drawPortal(ctx, grid.entry.col, grid.entry.row, ts, '#4CAF50', '#81C784', 'IN');
        // Exit portal
        this._drawPortal(ctx, grid.exit.col, grid.exit.row, ts, '#C62828', '#EF5350', 'OUT');
    }

    _drawGrassTile(ctx, c, r, ts, grid) {
        const x = c * ts;
        const y = r * ts;
        const h = this._hash(c, r);
        const h2 = this._hash(c + 100, r + 200);

        // Base grass — richer, varied greens
        const gVal = 95 + (h * 35) | 0;
        const rVal = 40 + (h * 20) | 0;
        const bVal = 18 + (h * 12) | 0;
        ctx.fillStyle = `rgb(${rVal},${gVal},${bVal})`;
        ctx.fillRect(x, y, ts, ts);

        // Top-left light / bottom-right shadow for raised tile feel
        // Light edge (top + left)
        ctx.fillStyle = 'rgba(255,255,200,0.06)';
        ctx.fillRect(x, y, ts, 2);
        ctx.fillRect(x, y, 2, ts);

        // Shadow edge (bottom + right)
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(x, y + ts - 2, ts, 2);
        ctx.fillRect(x + ts - 2, y, 2, ts);

        // Dirt/soil patches
        if (h2 > 0.72) {
            ctx.fillStyle = `rgba(70,50,25,${0.15 + h2 * 0.1})`;
            ctx.beginPath();
            ctx.ellipse(
                x + ts * (0.3 + h * 0.4),
                y + ts * (0.3 + h2 * 0.4),
                ts * 0.15, ts * 0.1, h * 3, 0, Math.PI * 2
            );
            ctx.fill();
        }

        // Grass tufts
        const tufts = ((h * 7) | 0) % 4;
        for (let i = 0; i < tufts; i++) {
            const hi = this._hash(c * 13 + i, r * 17 + i);
            const bx = x + hi * ts * 0.8 + ts * 0.1;
            const by = y + this._hash(c + i * 7, r + i * 3) * ts * 0.8 + ts * 0.1;
            ctx.strokeStyle = `rgba(25,${70 + (hi * 40) | 0},15,0.5)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + (hi - 0.5) * 4, by - 4 - hi * 3);
            ctx.stroke();
        }

        // Small rocks on some tiles
        if (h > 0.85) {
            const rx = x + ts * 0.5 + (h2 - 0.5) * ts * 0.4;
            const ry = y + ts * 0.6 + (h - 0.85) * ts * 2;
            const rr = ts * 0.05;
            ctx.fillStyle = `rgba(130,120,100,0.5)`;
            ctx.beginPath();
            ctx.ellipse(rx, ry, rr * 1.2, rr * 0.8, h * 2, 0, Math.PI * 2);
            ctx.fill();
            // Rock highlight
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath();
            ctx.ellipse(rx - rr * 0.3, ry - rr * 0.3, rr * 0.5, rr * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Tower tile: slightly raised platform look
        if (grid && grid.cells[r] && grid.cells[r][c] === 1) {
            // Stone platform
            const platGrad = ctx.createLinearGradient(x, y, x + ts, y + ts);
            platGrad.addColorStop(0, 'rgba(160,150,130,0.35)');
            platGrad.addColorStop(1, 'rgba(100,90,70,0.35)');
            ctx.fillStyle = platGrad;
            ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);

            // Platform edges (raised)
            ctx.fillStyle = 'rgba(200,190,170,0.25)';
            ctx.fillRect(x + 2, y + 2, ts - 4, 2);
            ctx.fillRect(x + 2, y + 2, 2, ts - 4);
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(x + 2, y + ts - 4, ts - 4, 2);
            ctx.fillRect(x + ts - 4, y + 2, 2, ts - 4);
        }
    }

    _drawPortal(ctx, col, row, ts, darkColor, lightColor, label) {
        const cx = col * ts + ts / 2;
        const cy = row * ts + ts / 2;

        // Glow
        const glow = ctx.createRadialGradient(cx, cy, ts * 0.1, cx, cy, ts * 0.6);
        glow.addColorStop(0, lightColor + 'AA');
        glow.addColorStop(0.5, darkColor + '44');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(col * ts - ts * 0.1, row * ts - ts * 0.1, ts * 1.2, ts * 1.2);

        // Stone frame
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(col * ts + 2, row * ts + 2, ts - 4, ts - 4);

        // Inner portal
        const inner = ctx.createRadialGradient(cx, cy, 0, cx, cy, ts * 0.35);
        inner.addColorStop(0, lightColor);
        inner.addColorStop(0.7, darkColor);
        inner.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = inner;
        ctx.beginPath();
        ctx.arc(cx, cy, ts * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = `bold ${ts * 0.3}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, cx, cy);
    }

    // === PATH ===
    drawPath(path) {
        if (!path || path.length < 2) return;
        const ts = this.tileSize;
        const ctx = this.ctx;

        // Draw dirt path tiles
        for (const node of path) {
            this._drawPathTile(ctx, node.col, node.row, ts);
        }

        // Subtle direction line
        ctx.strokeStyle = 'rgba(255,255,220,0.15)';
        ctx.lineWidth = ts * 0.06;
        ctx.setLineDash([ts * 0.12, ts * 0.18]);
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

    _drawPathTile(ctx, c, r, ts) {
        const x = c * ts;
        const y = r * ts;
        const h = this._hash(c, r);

        // Recessed dirt path
        ctx.fillStyle = `rgb(${130 + (h * 20) | 0},${98 + (h * 15) | 0},${58 + (h * 15) | 0})`;
        ctx.fillRect(x, y, ts, ts);

        // Recessed shadow edges (opposite of raised tile)
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x, y, ts, 2);
        ctx.fillRect(x, y, 2, ts);
        ctx.fillStyle = 'rgba(255,255,200,0.06)';
        ctx.fillRect(x, y + ts - 2, ts, 2);
        ctx.fillRect(x + ts - 2, y, 2, ts);

        // Cobblestones
        for (let i = 0; i < 4; i++) {
            const hi = this._hash(c * 7 + i, r * 11 + i);
            const sx = x + (hi * 0.6 + 0.15) * ts;
            const sy = y + (this._hash(c + i * 3, r + i * 5) * 0.6 + 0.15) * ts;
            const sr = ts * (0.07 + hi * 0.05);

            const bright = 115 + (hi * 45) | 0;
            ctx.fillStyle = `rgb(${bright},${bright - 8},${bright - 22})`;
            ctx.beginPath();
            ctx.ellipse(sx, sy, sr, sr * 0.7, hi * 2, 0, Math.PI * 2);
            ctx.fill();
            // Stone highlight
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.beginPath();
            ctx.ellipse(sx - sr * 0.2, sy - sr * 0.2, sr * 0.4, sr * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // === PLACEMENT PREVIEW ===
    drawPlacementPreview(col, row, canPlace, selectedTower) {
        if (col < 0 || row < 0) return;
        const ts = this.tileSize;
        const ctx = this.ctx;

        ctx.fillStyle = canPlace ? 'rgba(100,255,100,0.25)' : 'rgba(255,60,60,0.3)';
        ctx.fillRect(col * ts, row * ts, ts, ts);

        if (canPlace) {
            ctx.strokeStyle = 'rgba(100,255,100,0.6)';
            ctx.lineWidth = 2;
            ctx.strokeRect(col * ts + 1, row * ts + 1, ts - 2, ts - 2);
        }

        if (canPlace && selectedTower) {
            const def = CONFIG.TOWERS[selectedTower];
            const pos = gridToPixel(col, row, ts);
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, def.range * ts, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    // === 3D PUPPY TOWER ===
    drawTower(tower) {
        const ts = this.tileSize;
        const ctx = this.ctx;
        const x = tower.x;
        const y = tower.y;
        const size = ts * 0.4;
        const color = tower.color;

        const scale = 1 + tower.attackAnim * 0.2;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Ground shadow (elliptical, offset down-right for bird's-eye)
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(size * 0.1, size * 0.65, size * 1.0, size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3D Ears (behind body)
        this._draw3DEar(ctx, -size * 0.7, -size * 0.6, size * 0.35, size * 0.5, -0.3, color);
        this._draw3DEar(ctx, size * 0.7, -size * 0.6, size * 0.35, size * 0.5, 0.3, color);

        // 3D Dog body
        this._draw3DCircle(ctx, 0, 0, size, color);

        // Lighter muzzle area
        const muzzleGrad = ctx.createRadialGradient(0, size * 0.15, 0, 0, size * 0.15, size * 0.35);
        muzzleGrad.addColorStop(0, this._lighten(color, 0.4));
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

            const px = ex + side * size * 0.05;
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(px, ey, eyeR * 0.5, 0, Math.PI * 2);
            ctx.fill();

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

        // Type-specific details
        if (tower.type === 'bigboi') {
            // Red collar
            ctx.strokeStyle = '#C62828';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, size * 0.05, size * 0.85, 0.4, Math.PI - 0.4);
            ctx.stroke();
            // Gold tag
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
            const s = scale;
            this._draw3DCircle(this.ctx, x, y - size * s * 1.1, size * 0.28 * s, '#FFC0CB');
            this._draw3DCircle(this.ctx, x - size * 0.22 * s, y - size * s * 0.95, size * 0.16 * s, '#FFD0D8');
            this._draw3DCircle(this.ctx, x + size * 0.22 * s, y - size * s * 0.95, size * 0.16 * s, '#FFD0D8');
        }
    }

    // 3D sphere with radial gradient, outline, and specular highlight
    _draw3DCircle(ctx, cx, cy, radius, baseColor) {
        const grad = ctx.createRadialGradient(
            cx - radius * 0.3, cy - radius * 0.3, radius * 0.05,
            cx, cy, radius
        );
        grad.addColorStop(0, this._lighten(baseColor, 0.4));
        grad.addColorStop(0.5, baseColor);
        grad.addColorStop(1, this._shade(baseColor, 0.5));

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this._shade(baseColor, 0.35);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(cx - radius * 0.25, cy - radius * 0.3, radius * 0.3, radius * 0.15, -0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3D ear with gradient and inner ear
    _draw3DEar(ctx, cx, cy, rx, ry, rotation, baseColor) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);

        const grad = ctx.createRadialGradient(-rx * 0.2, -ry * 0.2, 0, 0, 0, Math.max(rx, ry));
        grad.addColorStop(0, this._lighten(baseColor, 0.2));
        grad.addColorStop(1, this._shade(baseColor, 0.45));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this._shade(baseColor, 0.35);
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = this._lighten(baseColor, 0.15);
        ctx.beginPath();
        ctx.ellipse(0, ry * 0.05, rx * 0.5, ry * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // === TOWER RANGE ===
    drawTowerRange(tower) {
        const ts = this.tileSize;
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.range * ts, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // === ENEMY ===
    drawEnemy(enemy) {
        if (!enemy.alive) return;
        const ts = this.tileSize;
        const ctx = this.ctx;
        const size = ts * enemy.size;

        const wobbleX = Math.sin(enemy.wobble) * 2;

        ctx.save();
        ctx.translate(enemy.x + wobbleX, enemy.y);

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(size * 0.05, size * 0.7, size * 0.9, size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cat body with gradient
        const bodyGrad = ctx.createRadialGradient(
            -size * 0.2, -size * 0.2, size * 0.05,
            0, 0, size
        );
        bodyGrad.addColorStop(0, this._lighten(enemy.color, 0.3));
        bodyGrad.addColorStop(0.6, enemy.color);
        bodyGrad.addColorStop(1, this._shade(enemy.color, 0.5));
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this._shade(enemy.color, 0.35);
        ctx.lineWidth = 1;
        ctx.stroke();

        // Cat ears
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.moveTo(-size * 0.7, -size * 0.5);
        ctx.lineTo(-size * 0.3, -size * 1.1);
        ctx.lineTo(0, -size * 0.5);
        ctx.fill();
        ctx.strokeStyle = this._shade(enemy.color, 0.4);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.5);
        ctx.lineTo(size * 0.3, -size * 1.1);
        ctx.lineTo(size * 0.7, -size * 0.5);
        ctx.fill();
        ctx.stroke();

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

        // Eye glints
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(-size * 0.35, -size * 0.17, size * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(size * 0.25, -size * 0.17, size * 0.06, 0, Math.PI * 2);
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
        ctx.strokeStyle = 'rgba(80,80,80,0.6)';
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(-size * 0.15, size * 0.2); ctx.lineTo(-size * 0.8, size * 0.05); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-size * 0.15, size * 0.25); ctx.lineTo(-size * 0.8, size * 0.3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(size * 0.15, size * 0.2); ctx.lineTo(size * 0.8, size * 0.05); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(size * 0.15, size * 0.25); ctx.lineTo(size * 0.8, size * 0.3); ctx.stroke();

        ctx.restore();

        // Slow indicator
        if (enemy.slowTimer > 0) {
            ctx.fillStyle = 'rgba(156, 39, 176, 0.25)';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, size * 1.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(186, 104, 200, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // HP bar
        const barWidth = ts * 0.8;
        const barHeight = 5;
        const barX = enemy.x - barWidth / 2;
        const barY = enemy.y - size - barHeight - 8;
        const hpRatio = enemy.hp / enemy.maxHp;

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

        const hpColor = hpRatio > 0.5 ? '#4CAF50' : hpRatio > 0.25 ? '#FF9800' : '#f44336';
        const hpGrad = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
        hpGrad.addColorStop(0, hpColor);
        hpGrad.addColorStop(1, this._shade(hpColor, 0.6));
        ctx.fillStyle = hpGrad;
        ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
    }

    // === PROJECTILE ===
    drawProjectile(proj) {
        if (!proj.alive) return;
        const ctx = this.ctx;

        const glow = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, proj.size * 3);
        glow.addColorStop(0, proj.color + '88');
        glow.addColorStop(1, proj.color + '00');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.size * 3, 0, Math.PI * 2);
        ctx.fill();

        const core = ctx.createRadialGradient(
            proj.x - proj.size * 0.3, proj.y - proj.size * 0.3, 0,
            proj.x, proj.y, proj.size
        );
        core.addColorStop(0, '#fff');
        core.addColorStop(0.4, proj.color);
        core.addColorStop(1, this._shade(proj.color, 0.5));
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
        ctx.fill();
    }

    // === PARTICLE ===
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
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = `${this.tileSize * 0.3}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('poof!', x, y);
    }
}
