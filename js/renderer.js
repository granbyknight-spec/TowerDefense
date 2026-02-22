// Canvas rendering - bird's-eye terrain with 3D puppy towers, obstacles, and new enemy types

class Renderer {
    constructor(canvas, tileSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileSize = tileSize;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    _hash(x, y) {
        let h = x * 374761393 + y * 668265263;
        h = (h ^ (h >> 13)) * 1274126177;
        return ((h ^ (h >> 16)) >>> 0) / 4294967296;
    }

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

    // === GRID WITH OBSTACLES ===
    drawGrid(grid) {
        const ts = this.tileSize;
        const ctx = this.ctx;

        for (let r = 0; r < grid.rows; r++) {
            for (let c = 0; c < grid.cols; c++) {
                const cellType = grid.cells[r][c];
                if (cellType === 2) {
                    this._drawWaterTile(ctx, c, r, ts);
                } else if (cellType === 3) {
                    this._drawGrassTile(ctx, c, r, ts, grid);
                    this._drawRockObstacle(ctx, c, r, ts);
                } else if (cellType === 4) {
                    this._drawGrassTile(ctx, c, r, ts, grid);
                    this._drawTreeObstacle(ctx, c, r, ts);
                } else if (cellType === 5) {
                    this._drawWaterTile(ctx, c, r, ts);
                    this._drawBridge(ctx, c, r, ts);
                } else {
                    this._drawGrassTile(ctx, c, r, ts, grid);
                }
            }
        }

        this._drawPortal(ctx, grid.entry.col, grid.entry.row, ts, '#4CAF50', '#81C784', 'IN');
        this._drawPortal(ctx, grid.exit.col, grid.exit.row, ts, '#C62828', '#EF5350', 'OUT');
    }

    _drawGrassTile(ctx, c, r, ts, grid) {
        const x = c * ts;
        const y = r * ts;
        const h = this._hash(c, r);
        const h2 = this._hash(c + 100, r + 200);

        const gVal = 95 + (h * 35) | 0;
        const rVal = 40 + (h * 20) | 0;
        const bVal = 18 + (h * 12) | 0;
        ctx.fillStyle = `rgb(${rVal},${gVal},${bVal})`;
        ctx.fillRect(x, y, ts, ts);

        ctx.fillStyle = 'rgba(255,255,200,0.06)';
        ctx.fillRect(x, y, ts, 2);
        ctx.fillRect(x, y, 2, ts);
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(x, y + ts - 2, ts, 2);
        ctx.fillRect(x + ts - 2, y, 2, ts);

        if (h2 > 0.72) {
            ctx.fillStyle = `rgba(70,50,25,${0.15 + h2 * 0.1})`;
            ctx.beginPath();
            ctx.ellipse(x + ts * (0.3 + h * 0.4), y + ts * (0.3 + h2 * 0.4), ts * 0.15, ts * 0.1, h * 3, 0, Math.PI * 2);
            ctx.fill();
        }

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

        if (h > 0.85) {
            const rx = x + ts * 0.5 + (h2 - 0.5) * ts * 0.4;
            const ry = y + ts * 0.6 + (h - 0.85) * ts * 2;
            const rr = ts * 0.05;
            ctx.fillStyle = 'rgba(130,120,100,0.5)';
            ctx.beginPath();
            ctx.ellipse(rx, ry, rr * 1.2, rr * 0.8, h * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath();
            ctx.ellipse(rx - rr * 0.3, ry - rr * 0.3, rr * 0.5, rr * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        if (grid && grid.cells[r] && grid.cells[r][c] === 1) {
            const platGrad = ctx.createLinearGradient(x, y, x + ts, y + ts);
            platGrad.addColorStop(0, 'rgba(160,150,130,0.35)');
            platGrad.addColorStop(1, 'rgba(100,90,70,0.35)');
            ctx.fillStyle = platGrad;
            ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);
            ctx.fillStyle = 'rgba(200,190,170,0.25)';
            ctx.fillRect(x + 2, y + 2, ts - 4, 2);
            ctx.fillRect(x + 2, y + 2, 2, ts - 4);
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(x + 2, y + ts - 4, ts - 4, 2);
            ctx.fillRect(x + ts - 4, y + 2, 2, ts - 4);
        }
    }

    // === WATER TILE ===
    _drawWaterTile(ctx, c, r, ts) {
        const x = c * ts;
        const y = r * ts;
        const h = this._hash(c, r);
        const t = Date.now() / 1000;

        const blue = 140 + (h * 30) | 0;
        ctx.fillStyle = `rgb(30,80,${blue})`;
        ctx.fillRect(x, y, ts, ts);

        // Animated wave lines
        ctx.strokeStyle = 'rgba(100,180,255,0.25)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const wy = y + ts * (0.25 + i * 0.25);
            ctx.beginPath();
            ctx.moveTo(x, wy + Math.sin(t * 2 + c + i) * 2);
            ctx.quadraticCurveTo(x + ts * 0.5, wy + Math.sin(t * 2 + c + i + 1) * 3, x + ts, wy + Math.sin(t * 2 + c + i + 2) * 2);
            ctx.stroke();
        }

        // Specular highlight
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(x, y, ts, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x, y + ts - 2, ts, 2);
    }

    // === ROCK OBSTACLE ===
    _drawRockObstacle(ctx, c, r, ts) {
        const cx = c * ts + ts / 2;
        const cy = r * ts + ts / 2;
        const h = this._hash(c * 3, r * 5);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(cx + 2, cy + ts * 0.15, ts * 0.38, ts * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rock body
        const rockGrad = ctx.createRadialGradient(cx - ts * 0.1, cy - ts * 0.1, 0, cx, cy, ts * 0.35);
        rockGrad.addColorStop(0, '#a0a0a0');
        rockGrad.addColorStop(0.6, '#707070');
        rockGrad.addColorStop(1, '#505050');
        ctx.fillStyle = rockGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy - ts * 0.05, ts * 0.35, ts * 0.28 + h * ts * 0.05, h * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#404040';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.ellipse(cx - ts * 0.1, cy - ts * 0.15, ts * 0.12, ts * 0.06, -0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    // === TREE OBSTACLE ===
    _drawTreeObstacle(ctx, c, r, ts) {
        const cx = c * ts + ts / 2;
        const cy = r * ts + ts / 2;
        const h = this._hash(c * 7, r * 11);

        // Trunk shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(cx + 2, cy + ts * 0.2, ts * 0.12, ts * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trunk
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(cx - ts * 0.06, cy - ts * 0.05, ts * 0.12, ts * 0.3);

        // Canopy (multiple overlapping circles for bird's-eye)
        const canopyColor = `rgb(${30 + (h * 20) | 0},${100 + (h * 30) | 0},${25 + (h * 15) | 0})`;
        const offsets = [[-0.12, -0.18], [0.12, -0.15], [0, -0.25], [-0.08, -0.08], [0.1, -0.05]];
        for (const [ox, oy] of offsets) {
            this._draw3DCircle(ctx, cx + ts * ox, cy + ts * oy, ts * 0.18, canopyColor);
        }
    }

    // === BRIDGE ===
    _drawBridge(ctx, c, r, ts) {
        const x = c * ts;
        const y = r * ts;

        // Wooden planks
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);

        // Plank lines
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(x + 2, y + ts * i / 4);
            ctx.lineTo(x + ts - 2, y + ts * i / 4);
            ctx.stroke();
        }

        // Rails
        ctx.fillStyle = '#6D4C41';
        ctx.fillRect(x, y, 3, ts);
        ctx.fillRect(x + ts - 3, y, 3, ts);

        // Wood highlight
        ctx.fillStyle = 'rgba(255,255,200,0.1)';
        ctx.fillRect(x + 3, y + 2, ts - 6, 2);
    }

    _drawPortal(ctx, col, row, ts, darkColor, lightColor, label) {
        const cx = col * ts + ts / 2;
        const cy = row * ts + ts / 2;

        const glow = ctx.createRadialGradient(cx, cy, ts * 0.1, cx, cy, ts * 0.6);
        glow.addColorStop(0, lightColor + 'AA');
        glow.addColorStop(0.5, darkColor + '44');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(col * ts - ts * 0.1, row * ts - ts * 0.1, ts * 1.2, ts * 1.2);

        ctx.fillStyle = '#5D4037';
        ctx.fillRect(col * ts + 2, row * ts + 2, ts - 4, ts - 4);

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

        for (const node of path) {
            this._drawPathTile(ctx, node.col, node.row, ts);
        }

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

        ctx.fillStyle = `rgb(${130 + (h * 20) | 0},${98 + (h * 15) | 0},${58 + (h * 15) | 0})`;
        ctx.fillRect(x, y, ts, ts);

        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x, y, ts, 2);
        ctx.fillRect(x, y, 2, ts);
        ctx.fillStyle = 'rgba(255,255,200,0.06)';
        ctx.fillRect(x, y + ts - 2, ts, 2);
        ctx.fillRect(x + ts - 2, y, 2, ts);

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
            if (def.range > 0) {
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
    }

    // === DOG HOUSE TOWER ===
    drawDogHouse(tower) {
        const ts = this.tileSize;
        const ctx = this.ctx;
        const x = tower.x;
        const y = tower.y;
        const s = ts * 0.35;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(x + 2, y + s * 0.8, s * 1.1, s * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // House body
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - s * 0.7, y - s * 0.3, s * 1.4, s * 1.0);

        // Roof
        ctx.fillStyle = '#C62828';
        ctx.beginPath();
        ctx.moveTo(x - s * 0.9, y - s * 0.3);
        ctx.lineTo(x, y - s * 0.9);
        ctx.lineTo(x + s * 0.9, y - s * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Door hole
        ctx.fillStyle = '#3E2723';
        ctx.beginPath();
        ctx.arc(x, y + s * 0.25, s * 0.3, Math.PI, 0);
        ctx.lineTo(x + s * 0.3, y + s * 0.7);
        ctx.lineTo(x - s * 0.3, y + s * 0.7);
        ctx.closePath();
        ctx.fill();

        // Gold coins icon
        ctx.fillStyle = '#FFD700';
        ctx.font = `bold ${ts * 0.25}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', x, y - s * 0.55);

        // Level stars
        const stars = tower.level - 1;
        if (stars > 0) {
            ctx.save();
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 4;
            ctx.fillStyle = '#FFD700';
            ctx.font = `bold ${ts * 0.18}px Arial`;
            ctx.fillText('★'.repeat(stars), x, y - s * 1.2);
            ctx.restore();
        }
    }

    // === 3D PUPPY TOWER ===
    drawTower(tower) {
        if (tower.isPassive) {
            this.drawDogHouse(tower);
            return;
        }

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

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(size * 0.1, size * 0.65, size * 1.0, size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        this._draw3DEar(ctx, -size * 0.7, -size * 0.6, size * 0.35, size * 0.5, -0.3, color);
        this._draw3DEar(ctx, size * 0.7, -size * 0.6, size * 0.35, size * 0.5, 0.3, color);

        // Body
        this._draw3DCircle(ctx, 0, 0, size, color);

        // Muzzle
        const muzzleGrad = ctx.createRadialGradient(0, size * 0.15, 0, 0, size * 0.15, size * 0.35);
        muzzleGrad.addColorStop(0, this._lighten(color, 0.4));
        muzzleGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = muzzleGrad;
        ctx.beginPath();
        ctx.ellipse(0, size * 0.2, size * 0.4, size * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
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

        // Nose
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

        // Type-specific
        if (tower.type === 'bigboi') {
            ctx.strokeStyle = '#C62828';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, size * 0.05, size * 0.85, 0.4, Math.PI - 0.4);
            ctx.stroke();
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, size * 0.72, size * 0.11, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#B8860B';
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }

        if (tower.type === 'husky') {
            ctx.strokeStyle = '#0288D1';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, size * 0.05, size * 0.85, 0.4, Math.PI - 0.4);
            ctx.stroke();
            ctx.fillStyle = '#E1F5FE';
            ctx.font = `bold ${size * 0.4}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('*', 0, size * 0.72);
        }

        ctx.restore();

        // Husky frost aura
        if (tower.type === 'husky') {
            ctx.save();
            for (let i = 0; i < 4; i++) {
                const angle = (Date.now() / 1200 + i * 1.57) % (Math.PI * 2);
                const r = size * (1.1 + Math.sin(Date.now() / 500 + i) * 0.15);
                const fx = x + Math.cos(angle) * r;
                const fy = y + Math.sin(angle) * r * 0.7;
                ctx.fillStyle = 'rgba(179,229,252,0.5)';
                ctx.beginPath();
                ctx.arc(fx, fy, size * 0.06, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Bark Storm active aura
        if (tower.abilityActive && tower.type === 'barker') {
            ctx.save();
            ctx.strokeStyle = 'rgba(255,200,50,0.5)';
            ctx.lineWidth = 2;
            const pulseR = size * (1.3 + Math.sin(Date.now() / 100) * 0.2);
            ctx.beginPath();
            ctx.arc(x, y, pulseR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Level stars
        const stars = tower.level - 1;
        if (stars > 0) {
            ctx.save();
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 4;
            ctx.fillStyle = '#FFD700';
            ctx.font = `bold ${ts * 0.2}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★'.repeat(stars), x, y - size * 1.2);
            ctx.restore();
        }

        // Poodle poofy hair
        if (tower.type === 'poodle') {
            const s = scale;
            this._draw3DCircle(this.ctx, x, y - size * s * 1.1, size * 0.28 * s, '#FFC0CB');
            this._draw3DCircle(this.ctx, x - size * 0.22 * s, y - size * s * 0.95, size * 0.16 * s, '#FFD0D8');
            this._draw3DCircle(this.ctx, x + size * 0.22 * s, y - size * s * 0.95, size * 0.16 * s, '#FFD0D8');
        }

        // Ability cooldown ring
        if (tower.abilityName && tower.abilityCooldown > 0) {
            const pct = 1 - tower.abilityCooldown / tower.abilityCooldownMax;
            ctx.save();
            ctx.strokeStyle = 'rgba(255,215,0,0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, size * 1.15, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    _draw3DCircle(ctx, cx, cy, radius, baseColor) {
        const grad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.05, cx, cy, radius);
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
        if (tower.isPassive) return;
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

        // Ninja: semi-transparent
        if (enemy.type === 'ninja') {
            ctx.globalAlpha = enemy.dodgeUsed ? 0.85 : 0.5 + Math.sin(Date.now() / 200) * 0.15;
        }

        // Dodge flash
        if (enemy.dodgeFlash > 0) {
            ctx.globalAlpha = 0.3;
        }

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(size * 0.05, size * 0.7, size * 0.9, size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cat body
        const bodyGrad = ctx.createRadialGradient(-size * 0.2, -size * 0.2, size * 0.05, 0, 0, size);
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
        ctx.fillStyle = enemy.type === 'ninja' ? '#444' : '#FFB6C1';
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

        // Pupils - ninja has red, boss has gold
        const pupilColor = enemy.type === 'ninja' ? '#C62828' : enemy.isBoss ? '#FFD700' : '#2E7D32';
        ctx.fillStyle = pupilColor;
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

        // Boss: crown
        if (enemy.isBoss) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(-size * 0.5, -size * 0.9);
            ctx.lineTo(-size * 0.35, -size * 1.4);
            ctx.lineTo(-size * 0.15, -size * 1.1);
            ctx.lineTo(0, -size * 1.5);
            ctx.lineTo(size * 0.15, -size * 1.1);
            ctx.lineTo(size * 0.35, -size * 1.4);
            ctx.lineTo(size * 0.5, -size * 0.9);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#B8860B';
            ctx.lineWidth = 1;
            ctx.stroke();
            // Crown gems
            ctx.fillStyle = '#E91E63';
            ctx.beginPath();
            ctx.arc(0, -size * 1.15, size * 0.06, 0, Math.PI * 2);
            ctx.fill();
        }

        // Chonker: extra belly circles
        if (enemy.type === 'chonker') {
            ctx.fillStyle = this._lighten(enemy.color, 0.2);
            ctx.beginPath();
            ctx.ellipse(0, size * 0.2, size * 0.7, size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Slow immune indicator
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath();
            ctx.ellipse(0, size * 0.1, size * 0.4, size * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ninja: headband
        if (enemy.type === 'ninja') {
            ctx.fillStyle = '#C62828';
            ctx.fillRect(-size * 0.8, -size * 0.35, size * 1.6, size * 0.12);
            // Headband tails
            ctx.strokeStyle = '#C62828';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(size * 0.7, -size * 0.3);
            ctx.quadraticCurveTo(size * 1.0, -size * 0.5, size * 1.1, -size * 0.7);
            ctx.stroke();
        }

        ctx.restore();

        // Frozen indicator
        if (enemy.frozen) {
            ctx.save();
            ctx.strokeStyle = 'rgba(100,200,255,0.7)';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, size * 1.2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            // Ice crystals
            ctx.fillStyle = 'rgba(180,230,255,0.6)';
            ctx.font = `${size * 0.5}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('*', enemy.x, enemy.y - size * 1.0);
            ctx.restore();
        }

        // Slow indicator
        if (enemy.slowTimer > 0 && !enemy.frozen) {
            ctx.fillStyle = 'rgba(156, 39, 176, 0.25)';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, size * 1.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(186, 104, 200, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Boss: speed burst glow
        if (enemy.isBoss && enemy.speedBurstActive) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255,100,0,0.6)';
            ctx.lineWidth = 2;
            const pulseR = size * (1.4 + Math.sin(Date.now() / 80) * 0.2);
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, pulseR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Dodge flash text
        if (enemy.dodgeFlash > 0) {
            ctx.save();
            ctx.globalAlpha = enemy.dodgeFlash;
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${ts * 0.3}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('DODGE!', enemy.x, enemy.y - size * 1.5);
            ctx.restore();
        }

        // HP bar
        const barWidth = enemy.isBoss ? ts * 1.5 : ts * 0.8;
        const barHeight = enemy.isBoss ? 8 : 5;
        const barX = enemy.x - barWidth / 2;
        const barY = enemy.y - size - barHeight - (enemy.isBoss ? 14 : 8);
        const hpRatio = enemy.hp / enemy.maxHp;

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

        const hpColor = hpRatio > 0.5 ? '#4CAF50' : hpRatio > 0.25 ? '#FF9800' : '#f44336';
        const hpGrad = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
        hpGrad.addColorStop(0, hpColor);
        hpGrad.addColorStop(1, this._shade(hpColor, 0.6));
        ctx.fillStyle = hpGrad;
        ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

        // Boss: name label
        if (enemy.isBoss) {
            ctx.fillStyle = '#FFD700';
            ctx.font = `bold ${ts * 0.22}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('BOSS', enemy.x, barY - 4);
        }
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

        const core = ctx.createRadialGradient(proj.x - proj.size * 0.3, proj.y - proj.size * 0.3, 0, proj.x, proj.y, proj.size);
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
