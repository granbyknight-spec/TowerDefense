// Canvas rendering - WC3-inspired medieval fantasy style

class Renderer {
    constructor(canvas, tileSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileSize = tileSize;

        // Pre-generate terrain noise texture (seeded per tile)
        this._grassCache = null;
        this._grassCacheSize = 0;
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

    // === TERRAIN ===
    drawGrid(grid) {
        const ts = this.tileSize;
        const ctx = this.ctx;

        for (let r = 0; r < grid.rows; r++) {
            for (let c = 0; c < grid.cols; c++) {
                this._drawGrassTile(ctx, c, r, ts);
            }
        }

        // Subtle grid lines
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
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

        // Entry portal (green glowing arch)
        this._drawPortal(ctx, grid.entry.col, grid.entry.row, ts, '#4CAF50', '#81C784', 'IN');

        // Exit portal (red glowing arch)
        this._drawPortal(ctx, grid.exit.col, grid.exit.row, ts, '#C62828', '#EF5350', 'OUT');
    }

    _drawGrassTile(ctx, c, r, ts) {
        const x = c * ts;
        const y = r * ts;
        const h = this._hash(c, r);

        // Base grass color with variation
        const baseG = 100 + (h * 40) | 0;
        const baseR = 50 + (h * 25) | 0;
        const baseB = 25 + (h * 15) | 0;
        ctx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
        ctx.fillRect(x, y, ts, ts);

        // Dirt/soil patches using hash
        const h2 = this._hash(c + 100, r + 200);
        if (h2 > 0.75) {
            ctx.fillStyle = `rgba(80,55,30,${0.15 + h2 * 0.1})`;
            ctx.beginPath();
            ctx.ellipse(
                x + ts * (0.3 + h * 0.4),
                y + ts * (0.3 + h2 * 0.4),
                ts * 0.15, ts * 0.1, h * 3, 0, Math.PI * 2
            );
            ctx.fill();
        }

        // Grass tufts — small dark green blades
        const tufts = ((h * 7) | 0) % 4;
        ctx.strokeStyle = `rgba(30,${80 + (h * 40) | 0},20,0.4)`;
        ctx.lineWidth = 1;
        for (let i = 0; i < tufts; i++) {
            const hi = this._hash(c * 13 + i, r * 17 + i);
            const bx = x + hi * ts * 0.8 + ts * 0.1;
            const by = y + this._hash(c + i * 7, r + i * 3) * ts * 0.8 + ts * 0.1;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + (hi - 0.5) * 4, by - 4 - hi * 3);
            ctx.stroke();
        }

        // Subtle highlight for depth (top-left lit)
        const edgeGrad = ctx.createLinearGradient(x, y, x + ts, y + ts);
        edgeGrad.addColorStop(0, 'rgba(255,255,200,0.04)');
        edgeGrad.addColorStop(1, 'rgba(0,0,0,0.06)');
        ctx.fillStyle = edgeGrad;
        ctx.fillRect(x, y, ts, ts);
    }

    _drawPortal(ctx, col, row, ts, darkColor, lightColor, label) {
        const cx = col * ts + ts / 2;
        const cy = row * ts + ts / 2;

        // Glow effect
        const glow = ctx.createRadialGradient(cx, cy, ts * 0.1, cx, cy, ts * 0.6);
        glow.addColorStop(0, lightColor + 'AA');
        glow.addColorStop(0.5, darkColor + '44');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(col * ts - ts * 0.1, row * ts - ts * 0.1, ts * 1.2, ts * 1.2);

        // Stone arch base
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

        // Label
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

        // Draw dirt/cobblestone path on path tiles
        for (const node of path) {
            this._drawPathTile(ctx, node.col, node.row, ts);
        }

        // Directional arrows
        ctx.strokeStyle = 'rgba(255,255,220,0.2)';
        ctx.lineWidth = ts * 0.08;
        ctx.setLineDash([ts * 0.15, ts * 0.2]);
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

        // Dirt base
        ctx.fillStyle = `rgb(${140 + (h * 20) | 0},${105 + (h * 15) | 0},${65 + (h * 15) | 0})`;
        ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2);

        // Cobblestones
        for (let i = 0; i < 4; i++) {
            const hi = this._hash(c * 7 + i, r * 11 + i);
            const sx = x + (hi * 0.6 + 0.15) * ts;
            const sy = y + (this._hash(c + i * 3, r + i * 5) * 0.6 + 0.15) * ts;
            const sr = ts * (0.08 + hi * 0.06);

            const bright = 120 + (hi * 50) | 0;
            ctx.fillStyle = `rgb(${bright},${bright - 10},${bright - 25})`;
            ctx.beginPath();
            ctx.ellipse(sx, sy, sr, sr * 0.8, hi * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = `rgba(0,0,0,0.2)`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        // Dark edge
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(x + 1, y + ts - 3, ts - 2, 2);
    }

    // === PLACEMENT PREVIEW ===
    drawPlacementPreview(col, row, canPlace, selectedTower) {
        if (col < 0 || row < 0) return;
        const ts = this.tileSize;
        const ctx = this.ctx;

        ctx.fillStyle = canPlace ? 'rgba(100,255,100,0.25)' : 'rgba(255,60,60,0.3)';
        ctx.fillRect(col * ts, row * ts, ts, ts);

        if (canPlace) {
            // Pulsing border
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

    // === MEDIEVAL TOWER ===
    drawTower(tower) {
        const ts = this.tileSize;
        const ctx = this.ctx;
        const x = tower.x;
        const y = tower.y;
        const s = ts * 0.42;

        // Attack animation
        const atkScale = 1 + tower.attackAnim * 0.15;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(atkScale, atkScale);

        if (tower.type === 'barker') {
            this._drawWatchTower(ctx, s, tower);
        } else if (tower.type === 'bigboi') {
            this._drawFortress(ctx, s, tower);
        } else if (tower.type === 'poodle') {
            this._drawMageTower(ctx, s, tower);
        }

        ctx.restore();

        // Level star
        if (tower.level > 1) {
            ctx.save();
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#FFD700';
            ctx.font = `bold ${ts * 0.28}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', x + s * 0.85, y - s * 1.1);
            ctx.restore();
        }
    }

    // Barker: wooden watchtower with dog face
    _drawWatchTower(ctx, s, tower) {
        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, s * 0.65, s * 0.7, s * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stone foundation
        const baseGrad = ctx.createLinearGradient(-s * 0.45, s * 0.3, s * 0.45, -s * 0.1);
        baseGrad.addColorStop(0, '#6D4C41');
        baseGrad.addColorStop(0.5, '#8D6E63');
        baseGrad.addColorStop(1, '#5D4037');
        ctx.fillStyle = baseGrad;
        ctx.fillRect(-s * 0.45, -s * 0.1, s * 0.9, s * 0.7);

        // Stone lines
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-s * 0.45, s * 0.2); ctx.lineTo(s * 0.45, s * 0.2);
        ctx.moveTo(-s * 0.45, s * 0.4); ctx.lineTo(s * 0.45, s * 0.4);
        ctx.stroke();

        // Wooden upper
        const woodGrad = ctx.createLinearGradient(-s * 0.5, -s * 0.7, s * 0.5, -s * 0.1);
        woodGrad.addColorStop(0, '#A1887F');
        woodGrad.addColorStop(0.5, '#C8A882');
        woodGrad.addColorStop(1, '#8D6E63');
        ctx.fillStyle = woodGrad;
        ctx.fillRect(-s * 0.5, -s * 0.7, s * 1.0, s * 0.65);

        // Wood outline
        ctx.strokeStyle = '#4E342E';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-s * 0.5, -s * 0.7, s * 1.0, s * 0.65);

        // Roof (triangle)
        const roofGrad = ctx.createLinearGradient(0, -s * 1.15, 0, -s * 0.65);
        roofGrad.addColorStop(0, '#D84315');
        roofGrad.addColorStop(1, '#BF360C');
        ctx.fillStyle = roofGrad;
        ctx.beginPath();
        ctx.moveTo(-s * 0.6, -s * 0.68);
        ctx.lineTo(0, -s * 1.15);
        ctx.lineTo(s * 0.6, -s * 0.68);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#8B2500';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Roof highlight
        ctx.fillStyle = 'rgba(255,200,100,0.15)';
        ctx.beginPath();
        ctx.moveTo(-s * 0.1, -s * 1.1);
        ctx.lineTo(0, -s * 1.15);
        ctx.lineTo(s * 0.5, -s * 0.7);
        ctx.lineTo(-s * 0.1, -s * 0.7);
        ctx.closePath();
        ctx.fill();

        // Dog face in window
        this._drawDogFace(ctx, 0, -s * 0.35, s * 0.3, tower.color);

        // Window frame
        ctx.strokeStyle = '#4E342E';
        ctx.lineWidth = 2;
        ctx.strokeRect(-s * 0.25, -s * 0.6, s * 0.5, s * 0.45);
    }

    // Big Boi: stone fortress with dog face
    _drawFortress(ctx, s, tower) {
        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(0, s * 0.65, s * 0.8, s * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wide stone base
        const baseGrad = ctx.createLinearGradient(-s * 0.55, s * 0.5, s * 0.55, -s * 0.5);
        baseGrad.addColorStop(0, '#546E7A');
        baseGrad.addColorStop(0.3, '#78909C');
        baseGrad.addColorStop(0.7, '#90A4AE');
        baseGrad.addColorStop(1, '#607D8B');
        ctx.fillStyle = baseGrad;
        ctx.fillRect(-s * 0.55, -s * 0.5, s * 1.1, s * 1.1);

        // Stone outline
        ctx.strokeStyle = '#37474F';
        ctx.lineWidth = 2;
        ctx.strokeRect(-s * 0.55, -s * 0.5, s * 1.1, s * 1.1);

        // Brick pattern
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 4; i++) {
            const yy = -s * 0.5 + i * s * 0.275;
            ctx.beginPath();
            ctx.moveTo(-s * 0.55, yy);
            ctx.lineTo(s * 0.55, yy);
            ctx.stroke();
            // Vertical offsets per row
            const offset = (i % 2) * s * 0.25;
            for (let j = 0; j < 3; j++) {
                ctx.beginPath();
                const xx = -s * 0.55 + offset + j * s * 0.5;
                ctx.moveTo(xx, yy);
                ctx.lineTo(xx, yy + s * 0.275);
                ctx.stroke();
            }
        }

        // Battlements (crenellations)
        const bw = s * 0.22;
        const bh = s * 0.18;
        ctx.fillStyle = baseGrad;
        for (let i = -2; i <= 1; i++) {
            if (i % 2 === 0) {
                ctx.fillRect(-s * 0.55 + (i + 2) * bw, -s * 0.5 - bh, bw, bh);
                ctx.strokeStyle = '#37474F';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(-s * 0.55 + (i + 2) * bw, -s * 0.5 - bh, bw, bh);
            }
        }

        // Dog face
        this._drawDogFace(ctx, 0, -s * 0.05, s * 0.32, tower.color);

        // Cannon/emblem below face
        ctx.fillStyle = '#37474F';
        ctx.fillRect(-s * 0.12, s * 0.35, s * 0.24, s * 0.1);
        ctx.fillStyle = '#263238';
        ctx.beginPath();
        ctx.arc(0, s * 0.4, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
    }

    // Poodle: magical mage tower with swirling energy
    _drawMageTower(ctx, s, tower) {
        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, s * 0.65, s * 0.6, s * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tall narrow base
        const baseGrad = ctx.createLinearGradient(-s * 0.35, s * 0.6, s * 0.35, -s * 0.6);
        baseGrad.addColorStop(0, '#4A148C');
        baseGrad.addColorStop(0.5, '#7B1FA2');
        baseGrad.addColorStop(1, '#6A1B9A');
        ctx.fillStyle = baseGrad;

        // Tapered tower shape
        ctx.beginPath();
        ctx.moveTo(-s * 0.4, s * 0.6);
        ctx.lineTo(-s * 0.32, -s * 0.6);
        ctx.lineTo(s * 0.32, -s * 0.6);
        ctx.lineTo(s * 0.4, s * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#311B92';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Mystical bands
        ctx.strokeStyle = 'rgba(206,147,216,0.4)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            const yy = -s * 0.4 + i * s * 0.35;
            const w = s * (0.33 + i * 0.03);
            ctx.beginPath();
            ctx.moveTo(-w, yy);
            ctx.lineTo(w, yy);
            ctx.stroke();
        }

        // Pointed wizard hat roof
        const roofGrad = ctx.createLinearGradient(0, -s * 1.3, 0, -s * 0.55);
        roofGrad.addColorStop(0, '#E040FB');
        roofGrad.addColorStop(0.5, '#9C27B0');
        roofGrad.addColorStop(1, '#6A1B9A');
        ctx.fillStyle = roofGrad;
        ctx.beginPath();
        ctx.moveTo(-s * 0.42, -s * 0.58);
        ctx.lineTo(0, -s * 1.3);
        ctx.lineTo(s * 0.42, -s * 0.58);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#4A148C';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Magic orb on top
        const orbGrad = ctx.createRadialGradient(-s * 0.03, -s * 1.32, 0, 0, -s * 1.3, s * 0.1);
        orbGrad.addColorStop(0, '#F8BBD0');
        orbGrad.addColorStop(0.5, '#E040FB');
        orbGrad.addColorStop(1, '#AB47BC80');
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(0, -s * 1.3, s * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Dog face
        this._drawDogFace(ctx, 0, -s * 0.08, s * 0.26, tower.color);

        // Sparkles around tower
        ctx.fillStyle = 'rgba(206,147,216,0.6)';
        for (let i = 0; i < 3; i++) {
            const angle = (Date.now() / 800 + i * 2.1) % (Math.PI * 2);
            const r = s * (0.5 + Math.sin(Date.now() / 600 + i) * 0.1);
            const sx = Math.cos(angle) * r;
            const sy = Math.sin(angle) * r * 0.6 - s * 0.2;
            ctx.beginPath();
            ctx.arc(sx, sy, s * 0.04, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Reusable dog face for tower windows
    _drawDogFace(ctx, cx, cy, size, color) {
        const s = size;

        // Face circle
        const faceGrad = ctx.createRadialGradient(
            cx - s * 0.2, cy - s * 0.2, s * 0.05,
            cx, cy, s
        );
        faceGrad.addColorStop(0, this._lighten(color, 0.35));
        faceGrad.addColorStop(0.6, color);
        faceGrad.addColorStop(1, this._shade(color, 0.5));
        ctx.fillStyle = faceGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, s, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this._shade(color, 0.35);
        ctx.lineWidth = 1;
        ctx.stroke();

        // Ears poking up
        const earGrad1 = ctx.createRadialGradient(cx - s * 0.6, cy - s * 0.7, 0, cx - s * 0.6, cy - s * 0.7, s * 0.4);
        earGrad1.addColorStop(0, this._lighten(color, 0.2));
        earGrad1.addColorStop(1, this._shade(color, 0.45));
        ctx.fillStyle = earGrad1;
        ctx.beginPath();
        ctx.ellipse(cx - s * 0.6, cy - s * 0.7, s * 0.3, s * 0.4, -0.3, 0, Math.PI * 2);
        ctx.fill();

        const earGrad2 = ctx.createRadialGradient(cx + s * 0.6, cy - s * 0.7, 0, cx + s * 0.6, cy - s * 0.7, s * 0.4);
        earGrad2.addColorStop(0, this._lighten(color, 0.2));
        earGrad2.addColorStop(1, this._shade(color, 0.45));
        ctx.fillStyle = earGrad2;
        ctx.beginPath();
        ctx.ellipse(cx + s * 0.6, cy - s * 0.7, s * 0.3, s * 0.4, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Muzzle area
        ctx.fillStyle = this._lighten(color, 0.35);
        ctx.beginPath();
        ctx.ellipse(cx, cy + s * 0.2, s * 0.45, s * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        const er = s * 0.18;
        [-1, 1].forEach(side => {
            const ex = cx + side * s * 0.3;
            const ey = cy - s * 0.1;
            // White
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(ex, ey, er, 0, Math.PI * 2);
            ctx.fill();
            // Pupil
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(ex + side * er * 0.15, ey, er * 0.55, 0, Math.PI * 2);
            ctx.fill();
            // Glint
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.beginPath();
            ctx.arc(ex + side * er * 0.05 - er * 0.15, ey - er * 0.2, er * 0.22, 0, Math.PI * 2);
            ctx.fill();
        });

        // Nose
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.ellipse(cx, cy + s * 0.18, s * 0.1, s * 0.07, 0, 0, Math.PI * 2);
        ctx.fill();
        // Nose shine
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.ellipse(cx - s * 0.03, cy + s * 0.15, s * 0.04, s * 0.02, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy + s * 0.15, s * 0.2, 0.3, Math.PI - 0.3);
        ctx.stroke();
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

    // === ENEMY (cat with more depth) ===
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
        ctx.ellipse(0, size * 0.7, size * 0.9, size * 0.2, 0, 0, Math.PI * 2);
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

        // Cat ears (triangles with inner pink)
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

        // Slow indicator (purple aura)
        if (enemy.slowTimer > 0) {
            ctx.fillStyle = 'rgba(156, 39, 176, 0.25)';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, size * 1.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(186, 104, 200, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // HP bar with border
        const barWidth = ts * 0.8;
        const barHeight = 5;
        const barX = enemy.x - barWidth / 2;
        const barY = enemy.y - size - barHeight - 8;
        const hpRatio = enemy.hp / enemy.maxHp;

        // Bar background
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

        // HP fill
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

        // Outer glow
        const glow = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, proj.size * 3);
        glow.addColorStop(0, proj.color + '88');
        glow.addColorStop(1, proj.color + '00');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core
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
