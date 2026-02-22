// Canvas rendering - bird's-eye terrain with 3D puppy towers, obstacles, and new enemy types

class Renderer {
    constructor(canvas, tileSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileSize = tileSize;
        // Performance: entity counts for LOD decisions
        this.entityCount = 0; // set each frame by game.js
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
        const t = Date.now() / 1000;
        for (let i = 0; i < tufts; i++) {
            const hi = this._hash(c * 13 + i, r * 17 + i);
            const bx = x + hi * ts * 0.8 + ts * 0.1;
            const by = y + this._hash(c + i * 7, r + i * 3) * ts * 0.8 + ts * 0.1;
            const sway = Math.sin(t * 1.8 + c * 0.7 + r * 0.5 + i * 2.1) * 3;
            ctx.strokeStyle = `rgba(25,${70 + (hi * 40) | 0},15,0.55)`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.quadraticCurveTo(bx + sway * 0.5, by - 3, bx + (hi - 0.5) * 4 + sway, by - 5 - hi * 3);
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

        // Color cycling base
        const cycle = Math.sin(t * 0.5 + c * 0.3 + r * 0.2) * 15;
        const blue = 140 + (h * 30) | 0;
        ctx.fillStyle = `rgb(${25 + cycle * 0.3 | 0},${75 + cycle * 0.5 | 0},${blue + cycle | 0})`;
        ctx.fillRect(x, y, ts, ts);

        // Animated wave lines
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const wy = y + ts * (0.25 + i * 0.25);
            const wAlpha = 0.2 + Math.sin(t * 1.5 + i * 1.2 + c) * 0.08;
            ctx.strokeStyle = `rgba(100,180,255,${wAlpha.toFixed(2)})`;
            ctx.beginPath();
            ctx.moveTo(x, wy + Math.sin(t * 2 + c + i) * 2);
            ctx.quadraticCurveTo(x + ts * 0.5, wy + Math.sin(t * 2 + c + i + 1) * 3, x + ts, wy + Math.sin(t * 2 + c + i + 2) * 2);
            ctx.stroke();
        }

        // Caustic light patterns
        for (let i = 0; i < 2; i++) {
            const hi = this._hash(c * 5 + i, r * 7 + i);
            const cx2 = x + ts * (0.2 + hi * 0.6);
            const cy2 = y + ts * (0.2 + this._hash(c + i, r + i * 3) * 0.6);
            const cSize = ts * (0.08 + hi * 0.08);
            const cAlpha = (0.08 + Math.sin(t * 2.5 + hi * 6.28 + c + r) * 0.06);
            ctx.fillStyle = `rgba(150,220,255,${Math.max(0, cAlpha).toFixed(2)})`;
            ctx.beginPath();
            ctx.ellipse(cx2 + Math.sin(t * 1.3 + hi * 5) * 2, cy2 + Math.cos(t * 1.1 + hi * 3) * 2, cSize, cSize * 0.6, t * 0.5 + hi * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Specular highlight
        const specAlpha = 0.04 + Math.sin(t * 1.8 + c * 0.5) * 0.03;
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, specAlpha).toFixed(2)})`;
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
    drawPath(path, grid) {
        if (!path || path.length < 2) return;
        const ts = this.tileSize;
        const ctx = this.ctx;

        for (const node of path) {
            const cellType = grid ? grid.getCellType(node.col, node.row) : 0;
            if (cellType === 5) {
                // Bridge cell: draw subtle path markers over the bridge instead of covering it
                this._drawBridgePathOverlay(ctx, node.col, node.row, ts);
            } else {
                this._drawPathTile(ctx, node.col, node.row, ts);
            }
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

    _drawBridgePathOverlay(ctx, c, r, ts) {
        const x = c * ts;
        const y = r * ts;
        // Subtle footprint marks on the bridge to show the path crosses here
        ctx.fillStyle = 'rgba(60,40,20,0.25)';
        ctx.fillRect(x + ts * 0.2, y + ts * 0.3, ts * 0.6, ts * 0.4);
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

        // Aura ring (level 2+)
        if (tower.auraRange > 0) {
            const auraPx = tower.auraRange * ts;
            const t = Date.now() / 1000;
            const pulse = 1 + Math.sin(t * 2) * 0.03;

            // Aura color by tier
            const auraColor = tower.auraTier >= 3 ? 'rgba(255,215,0,' : // gold (damage)
                              tower.auraTier >= 2 ? 'rgba(100,180,255,' : // blue (range)
                              'rgba(100,255,100,'; // green (speed)

            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, auraPx * pulse, 0, Math.PI * 2);
            ctx.fillStyle = auraColor + '0.04)';
            ctx.fill();
            ctx.strokeStyle = auraColor + '0.25)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        // Level stars
        const stars = tower.level - 1;
        if (stars > 0) {
            ctx.fillStyle = '#FFD700';
            ctx.font = `bold ${ts * 0.18}px Arial`;
            ctx.fillText('★'.repeat(stars), x, y - s * 1.2);
        }
    }

    // === DOG MANSION (super Dog House) ===
    drawDogMansion(tower) {
        const ts = this.tileSize;
        const ctx = this.ctx;
        const x = tower.x;
        const y = tower.y;
        const s = ts * 0.42; // bigger than regular

        // Glow aura
        const auraPx = tower.auraRange * ts;
        const t = Date.now() / 1000;
        const pulse = 1 + Math.sin(t * 1.5) * 0.03;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, auraPx * pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,215,0,0.05)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,215,0,0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(x + 2, y + s * 0.8, s * 1.3, s * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Castle body
        ctx.fillStyle = '#6D4C41';
        ctx.fillRect(x - s * 0.8, y - s * 0.4, s * 1.6, s * 1.2);

        // Battlements
        for (let i = 0; i < 5; i++) {
            const bx = x - s * 0.8 + i * s * 0.4;
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(bx, y - s * 0.6, s * 0.2, s * 0.2);
        }

        // Tower turrets
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - s * 0.85, y - s * 0.7, s * 0.3, s * 0.9);
        ctx.fillRect(x + s * 0.55, y - s * 0.7, s * 0.3, s * 0.9);
        // Turret roofs
        ctx.fillStyle = '#C62828';
        ctx.beginPath();
        ctx.moveTo(x - s * 0.9, y - s * 0.7);
        ctx.lineTo(x - s * 0.7, y - s * 1.0);
        ctx.lineTo(x - s * 0.5, y - s * 0.7);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + s * 0.5, y - s * 0.7);
        ctx.lineTo(x + s * 0.7, y - s * 1.0);
        ctx.lineTo(x + s * 0.9, y - s * 0.7);
        ctx.fill();

        // Main gate
        ctx.fillStyle = '#3E2723';
        ctx.beginPath();
        ctx.arc(x, y + s * 0.15, s * 0.35, Math.PI, 0);
        ctx.lineTo(x + s * 0.35, y + s * 0.8);
        ctx.lineTo(x - s * 0.35, y + s * 0.8);
        ctx.closePath();
        ctx.fill();

        // Gold banner
        ctx.fillStyle = '#FFD700';
        ctx.font = `bold ${ts * 0.3}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', x, y - s * 0.2);

        // Crown / SUPER label
        ctx.fillStyle = '#FFD700';
        ctx.font = `bold ${ts * 0.15}px Arial`;
        ctx.fillText('SUPER', x, y - s * 1.25);
    }

    // === 3D PUPPY TOWER ===
    drawTower(tower) {
        if (tower.isPassive) {
            if (tower.isSuper) {
                this.drawDogMansion(tower);
            } else {
                this.drawDogHouse(tower);
            }
            return;
        }

        const ts = this.tileSize;
        const ctx = this.ctx;
        const x = tower.x;
        const y = tower.y;
        const baseSize = tower.isSuper ? ts * 0.48 : ts * 0.4;
        const size = baseSize;
        const color = tower.color;
        const scale = 1 + tower.attackAnim * 0.2;

        // Super tower golden glow ring
        if (tower.isSuper) {
            ctx.save();
            const glowR = size * (1.6 + Math.sin(Date.now() / 400) * 0.1);
            const glow = ctx.createRadialGradient(x, y, size * 0.8, x, y, glowR);
            glow.addColorStop(0, 'rgba(255,215,0,0.15)');
            glow.addColorStop(1, 'rgba(255,215,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(x, y, glowR, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Frost Zone perk: draw frost aura circle
        if (tower.superPerk === 'frostZone') {
            const rangePx = (tower.range + tower.buffRange) * ts;
            ctx.save();
            ctx.fillStyle = 'rgba(100,200,255,0.06)';
            ctx.beginPath();
            ctx.arc(x, y, rangePx, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(100,200,255,0.2)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
            // Frost particles
            for (let i = 0; i < 6; i++) {
                const angle = (Date.now() / 2000 + i * 1.047) % (Math.PI * 2);
                const r = rangePx * (0.5 + Math.sin(Date.now() / 800 + i) * 0.3);
                ctx.fillStyle = 'rgba(180,230,255,0.4)';
                ctx.beginPath();
                ctx.arc(x + Math.cos(angle) * r, y + Math.sin(angle) * r, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Merge flash animation
        if (tower.superAnim > 0) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, tower.superAnim);
            ctx.fillStyle = 'rgba(255,255,255,' + (tower.superAnim * 0.4) + ')';
            ctx.beginPath();
            ctx.arc(x, y, size * 2 * tower.superAnim, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

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
        if (this.entityCount > 100) {
            ctx.fillStyle = this._lighten(color, 0.25);
        } else {
            const muzzleGrad = ctx.createRadialGradient(0, size * 0.15, 0, 0, size * 0.15, size * 0.35);
            muzzleGrad.addColorStop(0, this._lighten(color, 0.4));
            muzzleGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = muzzleGrad;
        }
        ctx.beginPath();
        ctx.ellipse(0, size * 0.2, size * 0.4, size * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        const eyeR = size * 0.2;
        [-1, 1].forEach(side => {
            const ex = side * size * 0.3;
            const ey = -size * 0.15;
            if (this.entityCount > 100) {
                ctx.fillStyle = '#f0f0f0';
            } else {
                const eyeGrad = ctx.createRadialGradient(ex - eyeR * 0.2, ey - eyeR * 0.2, 0, ex, ey, eyeR);
                eyeGrad.addColorStop(0, '#fff');
                eyeGrad.addColorStop(1, '#ddd');
                ctx.fillStyle = eyeGrad;
            }
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
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.ellipse(0, size * 0.15, size * 0.13, size * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();
        if (this.entityCount <= 100) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.ellipse(-size * 0.03, size * 0.12, size * 0.05, size * 0.025, -0.3, 0, Math.PI * 2);
            ctx.fill();
        }

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

        // Sparky: lightning bolt forehead mark
        if (tower.type === 'sparky') {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-size * 0.1, -size * 0.7);
            ctx.lineTo(size * 0.05, -size * 0.4);
            ctx.lineTo(-size * 0.05, -size * 0.35);
            ctx.lineTo(size * 0.1, -size * 0.05);
            ctx.stroke();
            // Yellow collar
            ctx.strokeStyle = '#FFC107';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, size * 0.05, size * 0.85, 0.4, Math.PI - 0.4);
            ctx.stroke();
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

        // Sparky electric sparks
        if (tower.type === 'sparky') {
            ctx.save();
            for (let i = 0; i < 3; i++) {
                const angle = (Date.now() / 800 + i * 2.09) % (Math.PI * 2);
                const r = size * (1.0 + Math.sin(Date.now() / 300 + i * 1.5) * 0.2);
                const fx = x + Math.cos(angle) * r;
                const fy = y + Math.sin(angle) * r * 0.7;
                ctx.fillStyle = 'rgba(255,235,59,0.7)';
                ctx.beginPath();
                ctx.arc(fx, fy, size * 0.07, 0, Math.PI * 2);
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

        // Level stars / super label (no shadowBlur - expensive)
        if (tower.isSuper) {
            ctx.save();
            ctx.fillStyle = '#B8860B';
            ctx.font = `bold ${ts * 0.17}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('SUPER', x + 1, y - size * 1.25 + 1);
            ctx.fillStyle = '#FFD700';
            ctx.fillText('SUPER', x, y - size * 1.25);
            ctx.restore();
        } else {
            const stars = tower.level - 1;
            if (stars > 0) {
                ctx.save();
                ctx.fillStyle = '#B8860B';
                ctx.font = `bold ${ts * 0.2}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('★'.repeat(stars), x + 1, y - size * 1.2 + 1);
                ctx.fillStyle = '#FFD700';
                ctx.fillText('★'.repeat(stars), x, y - size * 1.2);
                ctx.restore();
            }
        }

        // Dog House buff indicator
        if (tower.isBuffed) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255,215,0,0.35)';
            ctx.lineWidth = 1.5;
            const buffR = size * (1.25 + Math.sin(Date.now() / 600) * 0.05);
            ctx.beginPath();
            ctx.arc(x, y, buffR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Poodle poofy hair
        if (tower.type === 'poodle') {
            const s = scale;
            this._draw3DCircle(this.ctx, x, y - size * s * 1.1, size * 0.28 * s, '#FFC0CB');
            this._draw3DCircle(this.ctx, x - size * 0.22 * s, y - size * s * 0.95, size * 0.16 * s, '#FFD0D8');
            this._draw3DCircle(this.ctx, x + size * 0.22 * s, y - size * s * 0.95, size * 0.16 * s, '#FFD0D8');
        }

        // Active ability glow ring
        if (tower.abilityActive && tower.type !== 'barker') {
            ctx.save();
            const glowColor = tower.type === 'poodle' ? 'rgba(218,112,214,0.5)' :
                              tower.type === 'husky' ? 'rgba(100,200,255,0.5)' :
                              tower.type === 'sparky' ? 'rgba(255,235,59,0.6)' :
                              'rgba(255,99,71,0.5)';
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 2;
            const pulseR = size * (1.15 + Math.sin(Date.now() / 150) * 0.1);
            ctx.beginPath();
            ctx.arc(x, y, pulseR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    _draw3DCircle(ctx, cx, cy, radius, baseColor) {
        if (this.entityCount > 100) {
            // Simplified: flat color with outline
            ctx.fillStyle = baseColor;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = this._shade(baseColor, 0.4);
            ctx.lineWidth = 1.5;
            ctx.stroke();
            return;
        }
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
        if (this.entityCount > 100) {
            ctx.fillStyle = baseColor;
            ctx.beginPath();
            ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
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
        }
        ctx.restore();
    }

    // === DYNAMIC SHADOW (sun-cast) ===
    drawDynamicShadow(x, y, radius, ts) {
        const ctx = this.ctx;
        const t = Date.now() / 1000;
        // Sun angle drifts slowly for a subtle living feel
        const sunAngle = t * 0.15;
        const offsetX = Math.cos(sunAngle) * radius * 0.4;
        const offsetY = Math.sin(sunAngle) * 0.2 * radius + radius * 0.5;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.13)';
        ctx.beginPath();
        ctx.ellipse(x + offsetX, y + offsetY, radius * 0.95, radius * 0.35, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // === TOWER RANGE ===
    drawTowerRange(tower) {
        const ts = this.tileSize;
        const ctx = this.ctx;

        if (tower.isPassive) {
            // Show aura range for Dog House
            if (tower.auraRange > 0) {
                ctx.beginPath();
                ctx.arc(tower.x, tower.y, tower.auraRange * ts, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,215,0,0.06)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,215,0,0.3)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([6, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            return;
        }

        const effectiveRange = tower.range + tower.buffRange;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, effectiveRange * ts, 0, Math.PI * 2);
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
        if (this.entityCount > 80) {
            // Simplified flat body under load
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = this._shade(enemy.color, 0.4);
            ctx.lineWidth = 1;
            ctx.stroke();
        } else {
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
        }

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

        if (this.entityCount <= 80) {
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
        }

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

        if (this.entityCount <= 80) {
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
        }

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

        // Hit flash - white overlay
        if (enemy.hitFlash > 0) {
            ctx.save();
            ctx.globalAlpha = enemy.hitFlash * 0.7;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, size * 1.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

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

        // Dazzle indicator (pink sparkle ring)
        if (enemy.dazzled) {
            ctx.strokeStyle = 'rgba(255,105,180,0.6)';
            ctx.lineWidth = 2;
            const dazzleR = size * (1.15 + Math.sin(Date.now() / 150) * 0.1);
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, dazzleR, 0, Math.PI * 2);
            ctx.stroke();
            // Sparkle dots
            if (this.entityCount <= 80) {
                for (let i = 0; i < 3; i++) {
                    const a = Date.now() / 200 + i * 2.09;
                    const r = dazzleR * 0.9;
                    ctx.fillStyle = 'rgba(255,182,193,0.8)';
                    ctx.beginPath();
                    ctx.arc(enemy.x + Math.cos(a) * r, enemy.y + Math.sin(a) * r, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
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
        ctx.fillStyle = hpColor;
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
        if (!proj.alive && (!proj.chainArcs || proj.chainArcs.length === 0)) return;
        const ctx = this.ctx;

        // Draw chain lightning arcs
        if (proj.chainArcs) {
            for (const arc of proj.chainArcs) {
                this._drawLightningArc(ctx, arc.x1, arc.y1, arc.x2, arc.y2, arc.life / arc.maxLife);
            }
        }

        if (!proj.alive) return;

        const type = proj.towerType || '';
        const highLoad = this.entityCount > 100;

        // Under high load: simplified projectile (just a colored dot)
        if (highLoad) {
            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size * 1.2, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        // --- Type-specific trail ---
        if (proj.trail && proj.trail.length > 0) {
            for (let i = 0; i < proj.trail.length; i++) {
                const t = proj.trail[i];
                if (t.life <= 0) continue;
                const alpha = (t.life / 0.2) * 0.6;
                const sz = proj.size * (t.life / 0.2) * 0.8;
                ctx.globalAlpha = alpha;
                if (type === 'poodle') {
                    // Sparkly pink trail with shimmer
                    ctx.fillStyle = i % 2 === 0 ? '#FF69B4' : '#DA70D6';
                    ctx.beginPath();
                    ctx.arc(t.x + (Math.random() - 0.5) * 2, t.y + (Math.random() - 0.5) * 2, sz * 1.2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (type === 'husky') {
                    // Ice crystal trail
                    ctx.fillStyle = 'rgba(180,230,255,0.7)';
                    ctx.beginPath();
                    ctx.save();
                    ctx.translate(t.x, t.y);
                    ctx.rotate(i * 0.8);
                    ctx.fillRect(-sz * 0.5, -sz * 0.5, sz, sz);
                    ctx.restore();
                } else if (type === 'sparky') {
                    // Electric crackle trail
                    ctx.fillStyle = '#FFEB3B';
                    ctx.beginPath();
                    ctx.arc(t.x + (Math.random() - 0.5) * 4, t.y + (Math.random() - 0.5) * 4, sz * 0.7, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillStyle = proj.color;
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, sz, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.globalAlpha = 1;
        }

        // --- Type-specific projectile body ---
        if (type === 'barker') {
            // Bark shockwave ring
            const glow = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, proj.size * 3);
            glow.addColorStop(0, 'rgba(245,222,179,0.5)');
            glow.addColorStop(1, 'rgba(245,222,179,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size * 3, 0, Math.PI * 2);
            ctx.fill();
            // Expanding ring
            ctx.strokeStyle = 'rgba(245,222,179,0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size * 2, 0, Math.PI * 2);
            ctx.stroke();
            // Core
            ctx.fillStyle = '#F5DEB3';
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'poodle') {
            // Sparkly pink/purple orb
            const glow = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, proj.size * 3.5);
            glow.addColorStop(0, 'rgba(255,105,180,0.5)');
            glow.addColorStop(0.5, 'rgba(218,112,214,0.2)');
            glow.addColorStop(1, 'rgba(218,112,214,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size * 3.5, 0, Math.PI * 2);
            ctx.fill();
            // Core with sparkle
            const core = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, proj.size);
            core.addColorStop(0, '#FFF');
            core.addColorStop(0.3, '#FF69B4');
            core.addColorStop(1, '#DA70D6');
            ctx.fillStyle = core;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size * 1.1, 0, Math.PI * 2);
            ctx.fill();
            // Tiny sparkle dots
            for (let i = 0; i < 3; i++) {
                const a = Date.now() / 150 + i * 2.1;
                const r = proj.size * (1.5 + Math.sin(a) * 0.5);
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.beginPath();
                ctx.arc(proj.x + Math.cos(a) * r, proj.y + Math.sin(a) * r, 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (type === 'husky') {
            // Icy crystalline projectile
            const glow = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, proj.size * 3);
            glow.addColorStop(0, 'rgba(100,200,255,0.5)');
            glow.addColorStop(1, 'rgba(100,200,255,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size * 3, 0, Math.PI * 2);
            ctx.fill();
            // Diamond/crystal shape
            ctx.save();
            ctx.translate(proj.x, proj.y);
            ctx.rotate(Date.now() / 200);
            ctx.fillStyle = '#B3E5FC';
            ctx.beginPath();
            ctx.moveTo(0, -proj.size * 1.3);
            ctx.lineTo(proj.size * 0.8, 0);
            ctx.lineTo(0, proj.size * 1.3);
            ctx.lineTo(-proj.size * 0.8, 0);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.moveTo(0, -proj.size * 1.3);
            ctx.lineTo(proj.size * 0.3, 0);
            ctx.lineTo(0, proj.size * 0.3);
            ctx.lineTo(-proj.size * 0.3, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else if (type === 'bigboi') {
            // Heavy cannonball
            const glow = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, proj.size * 4);
            glow.addColorStop(0, 'rgba(255,99,71,0.4)');
            glow.addColorStop(0.5, 'rgba(255,69,0,0.15)');
            glow.addColorStop(1, 'rgba(255,69,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size * 4, 0, Math.PI * 2);
            ctx.fill();
            // Dark heavy core
            const core = ctx.createRadialGradient(proj.x - proj.size * 0.3, proj.y - proj.size * 0.3, 0, proj.x, proj.y, proj.size * 1.5);
            core.addColorStop(0, '#666');
            core.addColorStop(0.4, '#333');
            core.addColorStop(1, '#111');
            ctx.fillStyle = core;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            // Hot glow ring
            ctx.strokeStyle = 'rgba(255,100,50,0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size * 1.7, 0, Math.PI * 2);
            ctx.stroke();
            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.beginPath();
            ctx.arc(proj.x - proj.size * 0.4, proj.y - proj.size * 0.4, proj.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'sparky') {
            // Electric ball with crackle
            ctx.save();
            const glow = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, proj.size * 3);
            glow.addColorStop(0, 'rgba(255,235,59,0.6)');
            glow.addColorStop(1, 'rgba(255,235,59,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size * 3, 0, Math.PI * 2);
            ctx.fill();
            // Core
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFEB3B';
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size * 1.2, 0, Math.PI * 2);
            ctx.fill();
            // Mini lightning spikes
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 1;
            for (let i = 0; i < 4; i++) {
                const a = Date.now() / 80 + i * 1.57;
                const len = proj.size * (2 + Math.random());
                ctx.beginPath();
                ctx.moveTo(proj.x, proj.y);
                ctx.lineTo(proj.x + Math.cos(a) * len, proj.y + Math.sin(a) * len);
                ctx.stroke();
            }
            ctx.restore();
        } else {
            // Default projectile (generic)
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
    }

    // === CHAIN LIGHTNING ARC ===
    _drawLightningArc(ctx, x1, y1, x2, y2, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#FFEB3B';
        ctx.lineWidth = 2.5;

        // Jagged lightning segments
        const dx = x2 - x1;
        const dy = y2 - y1;
        const segments = 5;
        const jitter = 8;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const px = x1 + dx * t + (Math.random() - 0.5) * jitter;
            const py = y1 + dy * t + (Math.random() - 0.5) * jitter;
            ctx.lineTo(px, py);
        }
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Thinner bright core
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const px = x1 + dx * t + (Math.random() - 0.5) * jitter * 0.5;
            const py = y1 + dy * t + (Math.random() - 0.5) * jitter * 0.5;
            ctx.lineTo(px, py);
        }
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
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

    // === MUZZLE FLASH ===
    drawMuzzleFlash(tower) {
        const ctx = this.ctx;
        const ts = this.tileSize;
        const x = tower.x;
        const y = tower.y;
        const intensity = (tower.attackAnim - 0.7) / 0.3; // 0-1 over the flash period

        ctx.save();
        // Bright flash burst
        const flashSize = ts * 0.4 * intensity;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, flashSize);
        glow.addColorStop(0, 'rgba(255,255,200,' + (intensity * 0.8) + ')');
        glow.addColorStop(0.4, tower.projectileColor + Math.floor(intensity * 100).toString(16).padStart(2, '0'));
        glow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, flashSize, 0, Math.PI * 2);
        ctx.fill();

        // Star spikes
        ctx.strokeStyle = 'rgba(255,255,220,' + (intensity * 0.6) + ')';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + Date.now() / 200;
            const len = flashSize * 1.2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
            ctx.stroke();
        }
        ctx.restore();
    }

    // === FLOATING DAMAGE NUMBER ===
    drawDamageNumber(dn) {
        const ctx = this.ctx;
        const ts = this.tileSize;
        const alpha = Math.min(1, dn.life / dn.maxLife * 2);
        const scale = 0.8 + (1 - dn.life / dn.maxLife) * 0.4;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${ts * 0.3 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillText(dn.value, dn.x + 1, dn.y + 1);
        // Main text
        ctx.fillStyle = dn.color;
        ctx.fillText(dn.value, dn.x, dn.y);
        ctx.restore();
    }

    // Floating combo milestone text (world-space, at kill location)
    drawComboText(ct) {
        const ctx = this.ctx;
        const progress = 1 - ct.life / ct.maxLife;
        const alpha = Math.max(0, ct.life / ct.maxLife);
        const scale = 1.2 + progress * 0.6;
        const fontSize = Math.floor(18 * scale);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Main combo label (use stroke outline instead of expensive shadowBlur)
        ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText(ct.text, ct.x, ct.y);
        ctx.fillStyle = ct.color;
        ctx.fillText(ct.text, ct.x, ct.y);

        // Bonus gold subtext
        ctx.font = `bold ${Math.floor(12 * scale)}px system-ui, -apple-system, sans-serif`;
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 2;
        ctx.strokeText(ct.subtext, ct.x, ct.y + fontSize * 0.7);
        ctx.fillStyle = '#FFD700';
        ctx.fillText(ct.subtext, ct.x, ct.y + fontSize * 0.7);

        ctx.restore();
    }

    // === ABILITY VISUAL EFFECTS ===
    drawAbilityEffect(ef) {
        const ctx = this.ctx;
        const progress = 1 - ef.life / ef.maxLife;

        if (ef.type === 'eruption') {
            // Ground eruption: expanding shockwave ring + fire/dirt burst
            ctx.save();
            const alpha = Math.max(0, ef.life / ef.maxLife);
            const r = ef.radius * (0.3 + progress * 1.2);

            // Shockwave ring
            ctx.strokeStyle = `rgba(255,100,50,${(alpha * 0.8).toFixed(2)})`;
            ctx.lineWidth = 4 * alpha;
            ctx.beginPath();
            ctx.arc(ef.x, ef.y, r, 0, Math.PI * 2);
            ctx.stroke();

            // Inner fire glow
            const glow = ctx.createRadialGradient(ef.x, ef.y, 0, ef.x, ef.y, r * 0.8);
            glow.addColorStop(0, `rgba(255,200,50,${(alpha * 0.5).toFixed(2)})`);
            glow.addColorStop(0.4, `rgba(255,80,20,${(alpha * 0.3).toFixed(2)})`);
            glow.addColorStop(1, 'rgba(255,50,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(ef.x, ef.y, r * 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Crack lines radiating from center
            if (progress < 0.6) {
                ctx.strokeStyle = `rgba(255,200,100,${(alpha * 0.6).toFixed(2)})`;
                ctx.lineWidth = 2;
                for (let i = 0; i < 8; i++) {
                    const a = (i / 8) * Math.PI * 2 + ef.x * 0.1;
                    const len = r * (0.5 + Math.random() * 0.5);
                    ctx.beginPath();
                    ctx.moveTo(ef.x, ef.y);
                    ctx.lineTo(ef.x + Math.cos(a) * len, ef.y + Math.sin(a) * len);
                    ctx.stroke();
                }
            }

            // Ground scar (darkened earth)
            if (progress > 0.3) {
                ctx.fillStyle = `rgba(40,20,0,${(alpha * 0.3).toFixed(2)})`;
                ctx.beginPath();
                ctx.ellipse(ef.x, ef.y, r * 0.6, r * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        } else if (ef.type === 'bolt') {
            // Lightning bolt from sky to target
            ctx.save();
            const alpha = Math.max(0, ef.life / ef.maxLife);
            ctx.globalAlpha = alpha;

            // Bright flash at strike point
            const flashR = 30 * alpha;
            const flash = ctx.createRadialGradient(ef.x, ef.y, 0, ef.x, ef.y, flashR);
            flash.addColorStop(0, 'rgba(255,255,255,0.9)');
            flash.addColorStop(0.3, 'rgba(255,255,100,0.5)');
            flash.addColorStop(1, 'rgba(255,255,100,0)');
            ctx.fillStyle = flash;
            ctx.beginPath();
            ctx.arc(ef.x, ef.y, flashR, 0, Math.PI * 2);
            ctx.fill();

            // Main bolt from top of screen to target
            ctx.strokeStyle = '#FFEB3B';
            ctx.lineWidth = 4;

            const segments = 8;
            const jitter = 15;
            const dy = ef.y - ef.startY;
            ctx.beginPath();
            ctx.moveTo(ef.x + (Math.random() - 0.5) * 10, ef.startY);
            for (let i = 1; i < segments; i++) {
                const t = i / segments;
                ctx.lineTo(
                    ef.x + (Math.random() - 0.5) * jitter,
                    ef.startY + dy * t
                );
            }
            ctx.lineTo(ef.x, ef.y);
            ctx.stroke();

            // Bright white core bolt
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(ef.x + (Math.random() - 0.5) * 5, ef.startY);
            for (let i = 1; i < segments; i++) {
                const t = i / segments;
                ctx.lineTo(
                    ef.x + (Math.random() - 0.5) * jitter * 0.5,
                    ef.startY + dy * t
                );
            }
            ctx.lineTo(ef.x, ef.y);
            ctx.stroke();

            // Branch bolts
            if (Math.random() > 0.3) {
                ctx.strokeStyle = 'rgba(255,235,59,0.6)';
                ctx.lineWidth = 1.5;
                const branchY = ef.startY + dy * (0.3 + Math.random() * 0.4);
                const branchX = ef.x + (Math.random() - 0.5) * jitter;
                const endX = branchX + (Math.random() - 0.5) * 40;
                const endY = branchY + 20 + Math.random() * 30;
                ctx.beginPath();
                ctx.moveTo(branchX, branchY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }

            ctx.restore();
        } else if (ef.type === 'stormcloud') {
            // Dark storm cloud across top of screen
            ctx.save();
            const alpha = Math.min(1, ef.life / (ef.maxLife - 9), (ef.maxLife - (ef.maxLife - ef.life)) / 2) * 0.6;
            ctx.globalAlpha = Math.min(0.6, alpha);
            const t = Date.now() / 1000;

            // Multiple overlapping dark cloud ellipses
            for (let i = 0; i < 8; i++) {
                const cx = ef.w * (i / 8 + 0.06) + Math.sin(t * 0.3 + i) * 15;
                const cy = 25 + Math.sin(t * 0.5 + i * 0.8) * 8;
                const rx = ef.w * 0.12 + Math.sin(i * 1.3) * 10;
                const ry = 20 + Math.sin(i * 0.7) * 5;

                const cloud = ctx.createRadialGradient(cx, cy - 5, 0, cx, cy, ry * 1.5);
                cloud.addColorStop(0, 'rgba(30,30,50,0.8)');
                cloud.addColorStop(0.5, 'rgba(40,40,60,0.5)');
                cloud.addColorStop(1, 'rgba(50,50,70,0)');
                ctx.fillStyle = cloud;
                ctx.beginPath();
                ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // Occasional internal flicker
            if (Math.random() > 0.92) {
                ctx.fillStyle = 'rgba(255,255,200,0.15)';
                const fx = Math.random() * ef.w;
                ctx.beginPath();
                ctx.ellipse(fx, 20, 30, 15, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // === AMBIENT PARTICLE ===
    drawAmbientParticle(p) {
        const ctx = this.ctx;
        const alpha = Math.min(1, p.life / (p.maxLife * 0.3), (p.maxLife - (p.maxLife - p.life)) / p.maxLife);
        const fadeAlpha = Math.min(1, p.life * 2, (p.maxLife - (p.maxLife - p.life)) / (p.maxLife * 0.5));

        ctx.save();
        if (p.type === 'leaf') {
            ctx.globalAlpha = Math.min(0.7, p.life / 2);
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            // Leaf shape
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            // Leaf vein
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(-p.size, 0);
            ctx.lineTo(p.size, 0);
            ctx.stroke();
        } else if (p.type === 'firefly') {
            const glow = 0.4 + Math.sin(p.phase * 3) * 0.4;
            ctx.globalAlpha = Math.min(glow, p.life / 2);
            // Outer glow
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
            g.addColorStop(0, 'rgba(255,255,100,0.3)');
            g.addColorStop(1, 'rgba(255,255,100,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
            ctx.fill();
            // Core
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'ember') {
            ctx.globalAlpha = Math.min(0.8, p.life / 1.5);
            // Glow
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
            g.addColorStop(0, p.color + 'AA');
            g.addColorStop(1, p.color + '00');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            ctx.fill();
            // Core
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // Persistent combo HUD counter (screen-space, called after ctx.restore)
    drawComboHUD(combo, timer, maxTimer, thresholds) {
        const ctx = this.ctx;
        const cw = this.canvas.width;

        // Find current threshold color
        let color = '#FFFFFF';
        for (let i = thresholds.length - 1; i >= 0; i--) {
            if (combo >= thresholds[i].count) {
                color = thresholds[i].color;
                break;
            }
        }

        const pulse = 1 + Math.sin(performance.now() * 0.008) * 0.08;
        const x = cw - 20;
        const y = 75;

        ctx.save();

        // Combo count
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.floor(28 * pulse)}px system-ui, -apple-system, sans-serif`;
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 3;
        ctx.strokeText(`x${combo}`, x, y);
        ctx.fillStyle = color;
        ctx.fillText(`x${combo}`, x, y);

        // "COMBO" label
        ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('COMBO', x, y - 20);

        // Timer bar
        const barW = 50;
        const barH = 4;
        const barX = x - barW;
        const barY = y + 18;
        const pct = Math.max(0, timer / maxTimer);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = color;
        ctx.fillRect(barX, barY, barW * pct, barH);

        ctx.restore();
    }
}
