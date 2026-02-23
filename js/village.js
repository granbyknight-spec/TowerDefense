// Village Renderer - FF7-style bird's-eye JRPG village
// Rich canvas-rendered environment with lighting, shadows, and atmosphere

// === TILE TYPES ===
const TILE = {
    GRASS:     0,
    PATH:      1,
    WATER:     2,
    WALL:      3,
    FLOOR:     4,  // indoor floor
    FENCE:     5,
    BRIDGE:    6,
    FLOWERS:   7,
    SAND:      8,
    DARK_GRASS:9,
    ROOF:     10,
    DOOR:     11,
    STONE:    12,
};

// === OBJECT TYPES (placed on top of tiles) ===
const OBJ = {
    NONE:       0,
    TREE_OAK:   1,
    TREE_PINE:  2,
    BUSH:       3,
    ROCK:       4,
    BENCH:      5,
    LAMP:       6,
    SIGN:       7,
    WELL:       8,
    MAILBOX:    9,
    DOG_HOUSE: 10,
    FOUNTAIN:  11,
    BARREL:    12,
    CRATE:     13,
    FLOWER_BED:14,
    STATUE:    15,
    CHIMNEY:   16,
    WINDOW:    17,
};

class Village {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.active = false;

        // Camera
        this.camX = 0;
        this.camY = 0;
        this.camTargetX = 0;
        this.camTargetY = 0;
        this.camSmooth = 4; // lerp speed

        // Time
        this.time = 0;        // total elapsed
        this.dayTime = 0.35;  // 0-1 day cycle (0.35 = morning)

        // Tile size (pixels per tile)
        this.ts = 32;

        // Map data
        this.mapW = 0;
        this.mapH = 0;
        this.tiles = [];      // ground layer
        this.objects = [];     // object layer
        this.roofs = [];       // roof layer (hides interiors)
        this.collisions = [];  // walkability

        // Player
        this.playerX = 0;
        this.playerY = 0;
        this.playerTargetX = 0;
        this.playerTargetY = 0;
        this.playerDir = 0;   // 0=down,1=left,2=right,3=up
        this.playerMoving = false;
        this.playerAnimFrame = 0;
        this.playerSpeed = 3.5;

        // NPCs
        this.npcs = [];

        // Particles (ambient)
        this.particles = [];

        // Interaction
        this.interactTarget = null;
        this.onInteract = null; // callback(npc)
        this.onTrigger = null;  // callback(trigger)

        // Triggers
        this.triggers = [];

        // Cached gradients/patterns
        this._waterOffset = 0;
        this._grassPattern = null;

        // Light sources
        this.lights = [];

        // Input
        this._pointerHandler = null;
        this._lastTap = null;
    }

    // === PUBLIC API ===

    loadMap(mapData) {
        this.mapW = mapData.width;
        this.mapH = mapData.height;
        this.tiles = mapData.tiles.slice();
        this.objects = mapData.objects ? mapData.objects.slice() : new Array(this.mapW * this.mapH).fill(0);
        this.roofs = mapData.roofs ? mapData.roofs.slice() : new Array(this.mapW * this.mapH).fill(0);
        this.collisions = mapData.collisions ? mapData.collisions.slice() : this._buildCollisions();
        this.npcs = (mapData.npcs || []).map(n => ({
            ...n,
            animFrame: 0,
            animTimer: Math.random() * 2,
            walkTimer: 0,
            walkDir: 0,
            origX: n.x,
            origY: n.y,
        }));
        this.triggers = mapData.triggers || [];
        this.lights = mapData.lights || [];
        this.playerX = mapData.startX || 10;
        this.playerY = mapData.startY || 10;
        this.playerTargetX = this.playerX;
        this.playerTargetY = this.playerY;

        // Center camera on player
        this.camX = this.playerX * this.ts;
        this.camY = this.playerY * this.ts;
        this.camTargetX = this.camX;
        this.camTargetY = this.camY;

        // Generate ambient particles
        this._initParticles();
    }

    start(onInteract, onTrigger) {
        this.active = true;
        this.onInteract = onInteract;
        this.onTrigger = onTrigger;
        this._bindInput();
        this._raf = requestAnimationFrame((t) => this._loop(t));
    }

    stop() {
        this.active = false;
        this._unbindInput();
        if (this._raf) cancelAnimationFrame(this._raf);
    }

    // === COLLISION ===

    _buildCollisions() {
        const c = new Array(this.mapW * this.mapH).fill(0);
        for (let i = 0; i < c.length; i++) {
            const t = this.tiles[i];
            if (t === TILE.WALL || t === TILE.WATER || t === TILE.ROOF) {
                c[i] = 1; // blocked
            }
            const o = this.objects[i];
            if (o === OBJ.TREE_OAK || o === OBJ.TREE_PINE || o === OBJ.ROCK ||
                o === OBJ.WELL || o === OBJ.FOUNTAIN || o === OBJ.STATUE ||
                o === OBJ.BARREL || o === OBJ.CRATE) {
                c[i] = 1;
            }
        }
        return c;
    }

    _isWalkable(tx, ty) {
        if (tx < 0 || ty < 0 || tx >= this.mapW || ty >= this.mapH) return false;
        return this.collisions[ty * this.mapW + tx] === 0;
    }

    // === INPUT ===

    _bindInput() {
        this._pointerHandler = (e) => {
            e.stopPropagation();
            e.preventDefault();
            this._onTap(e);
        };
        this.canvas.addEventListener('pointerdown', this._pointerHandler);
    }

    _unbindInput() {
        if (this._pointerHandler) {
            this.canvas.removeEventListener('pointerdown', this._pointerHandler);
            this._pointerHandler = null;
        }
    }

    _onTap(e) {
        if (!this.active) return;

        const rect = this.canvas.getBoundingClientRect();
        const sx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const sy = (e.clientY - rect.top) * (this.canvas.height / rect.height);

        // Convert screen to world coords
        const wx = sx + this.camX - this.canvas.width / 2;
        const wy = sy + this.camY - this.canvas.height / 2;

        // Convert to tile coords
        const tx = Math.floor(wx / this.ts);
        const ty = Math.floor(wy / this.ts);

        // Check NPC interaction
        for (const npc of this.npcs) {
            const nx = Math.round(npc.x);
            const ny = Math.round(npc.y);
            if (Math.abs(tx - nx) <= 1 && Math.abs(ty - ny) <= 1) {
                const dist = Math.abs(this.playerX - npc.x) + Math.abs(this.playerY - npc.y);
                if (dist <= 2.5) {
                    if (this.onInteract) this.onInteract(npc);
                    return;
                } else {
                    // Walk toward NPC
                    this._setMoveTarget(nx, ny - 1);
                    this._lastTap = { npc };
                    return;
                }
            }
        }

        // Check trigger zones
        for (const trigger of this.triggers) {
            if (tx >= trigger.x && tx < trigger.x + (trigger.w || 1) &&
                ty >= trigger.y && ty < trigger.y + (trigger.h || 1)) {
                this._setMoveTarget(tx, ty);
                this._lastTap = { trigger };
                return;
            }
        }

        // Move to location
        this._setMoveTarget(tx, ty);
        this._lastTap = null;
    }

    _setMoveTarget(tx, ty) {
        if (this._isWalkable(tx, ty)) {
            this.playerTargetX = tx;
            this.playerTargetY = ty;
            this.playerMoving = true;
        }
    }

    // === GAME LOOP ===

    _loop(timestamp) {
        if (!this.active) return;
        if (!this._lastTime) this._lastTime = timestamp;
        const dt = Math.min((timestamp - this._lastTime) / 1000, 0.1);
        this._lastTime = timestamp;

        this._update(dt);
        this._render();

        this._raf = requestAnimationFrame((t) => this._loop(t));
    }

    _update(dt) {
        this.time += dt;
        this._waterOffset += dt * 0.5;

        // Player movement
        if (this.playerMoving) {
            const dx = this.playerTargetX - this.playerX;
            const dy = this.playerTargetY - this.playerY;
            const d = Math.sqrt(dx * dx + dy * dy);

            if (d < 0.08) {
                this.playerX = this.playerTargetX;
                this.playerY = this.playerTargetY;
                this.playerMoving = false;

                // Check if we reached an NPC or trigger
                if (this._lastTap) {
                    if (this._lastTap.npc && this.onInteract) {
                        const npc = this._lastTap.npc;
                        const dist = Math.abs(this.playerX - npc.x) + Math.abs(this.playerY - npc.y);
                        if (dist <= 2.5) this.onInteract(npc);
                    }
                    if (this._lastTap.trigger && this.onTrigger) {
                        this.onTrigger(this._lastTap.trigger);
                    }
                    this._lastTap = null;
                }
            } else {
                const move = this.playerSpeed * dt;
                this.playerX += (dx / d) * Math.min(move, d);
                this.playerY += (dy / d) * Math.min(move, d);

                // Update direction
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.playerDir = dx > 0 ? 2 : 1; // right : left
                } else {
                    this.playerDir = dy > 0 ? 0 : 3; // down : up
                }

                this.playerAnimFrame += dt * 8;
            }
        }

        // Camera follow
        this.camTargetX = this.playerX * this.ts;
        this.camTargetY = this.playerY * this.ts;
        this.camX += (this.camTargetX - this.camX) * this.camSmooth * dt;
        this.camY += (this.camTargetY - this.camY) * this.camSmooth * dt;

        // NPC wandering
        for (const npc of this.npcs) {
            npc.animTimer += dt;
            if (npc.wander) {
                npc.walkTimer -= dt;
                if (npc.walkTimer <= 0) {
                    npc.walkTimer = 2 + Math.random() * 3;
                    const dir = Math.floor(Math.random() * 5); // 0-3 = move, 4 = stay
                    if (dir < 4) {
                        const ddx = [0, -1, 1, 0][dir];
                        const ddy = [1, 0, 0, -1][dir];
                        const nx = Math.round(npc.x) + ddx;
                        const ny = Math.round(npc.y) + ddy;
                        // Stay near origin
                        const distFromHome = Math.abs(nx - npc.origX) + Math.abs(ny - npc.origY);
                        if (distFromHome <= 3 && this._isWalkable(nx, ny)) {
                            npc.targetX = nx;
                            npc.targetY = ny;
                            npc.walkDir = dir;
                        }
                    }
                }
                // Move toward target
                if (npc.targetX !== undefined) {
                    const dx = npc.targetX - npc.x;
                    const dy = npc.targetY - npc.y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d > 0.05) {
                        npc.x += (dx / d) * 1.5 * dt;
                        npc.y += (dy / d) * 1.5 * dt;
                        npc.animFrame += dt * 6;
                    } else {
                        npc.x = npc.targetX;
                        npc.y = npc.targetY;
                        npc.targetX = undefined;
                    }
                }
            }
        }

        // Particles
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) {
                this._resetParticle(p);
            }
        }
    }

    // === RENDERING ===

    _render() {
        const ctx = this.ctx;
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        const ts = this.ts;

        // Calculate visible area
        const scrollX = this.camX - cw / 2;
        const scrollY = this.camY - ch / 2;

        const startCol = Math.max(0, Math.floor(scrollX / ts) - 1);
        const endCol = Math.min(this.mapW, Math.ceil((scrollX + cw) / ts) + 1);
        const startRow = Math.max(0, Math.floor(scrollY / ts) - 1);
        const endRow = Math.min(this.mapH, Math.ceil((scrollY + ch) / ts) + 1);

        ctx.save();

        // Sky/background gradient based on time of day
        this._renderSky(ctx, cw, ch);

        // Translate to camera
        ctx.translate(-scrollX, -scrollY);

        // === GROUND LAYER ===
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                this._renderTile(ctx, c, r, ts);
            }
        }

        // === SHADOWS (cast by objects/NPCs/player before drawing them) ===
        this._renderShadows(ctx, startCol, endCol, startRow, endRow, ts);

        // === OBJECTS LAYER (draw bottom-to-top for correct overlap) ===
        // Collect all drawable entities with their y-position for sorting
        const drawables = [];

        // Objects
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                const obj = this.objects[r * this.mapW + c];
                if (obj !== OBJ.NONE) {
                    drawables.push({ type: 'obj', obj, x: c, y: r });
                }
            }
        }

        // NPCs
        for (const npc of this.npcs) {
            if (npc.x >= startCol - 1 && npc.x <= endCol + 1 &&
                npc.y >= startRow - 1 && npc.y <= endRow + 1) {
                drawables.push({ type: 'npc', npc, x: npc.x, y: npc.y });
            }
        }

        // Player
        drawables.push({ type: 'player', x: this.playerX, y: this.playerY });

        // Sort by y (bottom items drawn last = in front)
        drawables.sort((a, b) => a.y - b.y);

        for (const d of drawables) {
            if (d.type === 'obj') this._renderObject(ctx, d.obj, d.x, d.y, ts);
            else if (d.type === 'npc') this._renderNPC(ctx, d.npc, ts);
            else if (d.type === 'player') this._renderPlayer(ctx, ts);
        }

        // === ROOF LAYER (hides interiors when player isn't inside) ===
        this._renderRoofs(ctx, startCol, endCol, startRow, endRow, ts);

        // === TRIGGER HIGHLIGHTS ===
        for (const trigger of this.triggers) {
            if (trigger.visible) {
                const px = trigger.x * ts;
                const py = trigger.y * ts;
                const w = (trigger.w || 1) * ts;
                const h = (trigger.h || 1) * ts;
                const pulse = 0.1 + Math.sin(this.time * 3) * 0.05;
                ctx.fillStyle = `rgba(255,215,0,${pulse})`;
                ctx.fillRect(px, py, w, h);
                if (trigger.label) {
                    ctx.font = `bold ${ts * 0.3}px Arial`;
                    ctx.fillStyle = '#FFD700';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.shadowColor = '#000';
                    ctx.shadowBlur = 4;
                    ctx.fillText(trigger.label, px + w / 2, py + h / 2);
                    ctx.shadowBlur = 0;
                }
            }
        }

        // === PARTICLES ===
        for (const p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.alpha * (p.life / p.maxLife));
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x * ts, p.y * ts, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        ctx.restore();

        // === LIGHTING OVERLAY ===
        this._renderLighting(ctx, cw, ch, scrollX, scrollY, ts);

        // === VIGNETTE ===
        this._renderVignette(ctx, cw, ch);

        // NPC name plates and interaction indicators (screen-space)
        ctx.save();
        for (const npc of this.npcs) {
            const sx = npc.x * ts - scrollX;
            const sy = npc.y * ts - scrollY;
            if (sx < -ts || sx > cw + ts || sy < -ts || sy > ch + ts) continue;

            const dist = Math.abs(this.playerX - npc.x) + Math.abs(this.playerY - npc.y);
            if (dist <= 3 && npc.name) {
                ctx.font = `bold ${Math.max(10, ts * 0.32)}px Arial`;
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.shadowColor = '#000';
                ctx.shadowBlur = 4;
                ctx.fillText(npc.name, sx + ts / 2, sy - ts * 0.15);
                ctx.shadowBlur = 0;

                if (npc.dialogue && dist <= 2.5) {
                    ctx.font = `${Math.max(8, ts * 0.28)}px Arial`;
                    ctx.fillText('💬', sx + ts / 2 + ts * 0.45, sy - ts * 0.05);
                }
            }
        }
        ctx.restore();
    }

    // === SKY ===

    _renderSky(ctx, cw, ch) {
        // Time-of-day sky gradient
        const t = this.dayTime;
        let topColor, botColor;

        if (t < 0.25) {
            // Night
            topColor = '#0a0a1a';
            botColor = '#141428';
        } else if (t < 0.35) {
            // Dawn
            const f = (t - 0.25) / 0.1;
            topColor = this._lerpColor('#0a0a1a', '#4a6fa5', f);
            botColor = this._lerpColor('#141428', '#e8b87d', f);
        } else if (t < 0.7) {
            // Day
            topColor = '#4a6fa5';
            botColor = '#87CEEB';
        } else if (t < 0.8) {
            // Dusk
            const f = (t - 0.7) / 0.1;
            topColor = this._lerpColor('#4a6fa5', '#2a1a3a', f);
            botColor = this._lerpColor('#87CEEB', '#d4645c', f);
        } else {
            // Night
            topColor = '#0a0a1a';
            botColor = '#141428';
        }

        const grad = ctx.createLinearGradient(0, 0, 0, ch);
        grad.addColorStop(0, topColor);
        grad.addColorStop(1, botColor);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);
    }

    // === TILE RENDERING ===

    _renderTile(ctx, col, row, ts) {
        const idx = row * this.mapW + col;
        const tile = this.tiles[idx];
        const px = col * ts;
        const py = row * ts;

        switch (tile) {
            case TILE.GRASS:
                this._drawGrass(ctx, px, py, ts, col, row);
                break;
            case TILE.DARK_GRASS:
                this._drawGrass(ctx, px, py, ts, col, row, true);
                break;
            case TILE.PATH:
                this._drawPath(ctx, px, py, ts, col, row);
                break;
            case TILE.WATER:
                this._drawWater(ctx, px, py, ts, col, row);
                break;
            case TILE.WALL:
                this._drawWall(ctx, px, py, ts, col, row);
                break;
            case TILE.FLOOR:
                this._drawFloor(ctx, px, py, ts);
                break;
            case TILE.FENCE:
                this._drawFence(ctx, px, py, ts, col, row);
                break;
            case TILE.BRIDGE:
                this._drawBridge(ctx, px, py, ts);
                break;
            case TILE.FLOWERS:
                this._drawGrass(ctx, px, py, ts, col, row);
                this._drawFlowers(ctx, px, py, ts, col, row);
                break;
            case TILE.SAND:
                this._drawSand(ctx, px, py, ts);
                break;
            case TILE.ROOF:
                this._drawRoof(ctx, px, py, ts, col, row);
                break;
            case TILE.DOOR:
                this._drawFloor(ctx, px, py, ts);
                this._drawDoor(ctx, px, py, ts);
                break;
            case TILE.STONE:
                this._drawStone(ctx, px, py, ts);
                break;
        }
    }

    _drawGrass(ctx, x, y, ts, col, row, dark) {
        // Rich multi-tone grass with FF7-style depth
        const seed = (col * 7 + row * 13) % 17;
        const seed2 = (col * 31 + row * 47) % 23;

        // Base gradient - two-tone per tile for depth
        const base = dark ? '#2d5016' : '#3a7a1e';
        const alt = dark ? '#245012' : '#328a18';
        const mid = dark ? '#295214' : '#35841c';
        ctx.fillStyle = (col + row) % 2 === 0 ? base : alt;
        ctx.fillRect(x, y, ts, ts);

        // Subtle diagonal gradient overlay for terrain variation
        const grad = ctx.createLinearGradient(x, y, x + ts, y + ts);
        grad.addColorStop(0, `rgba(${dark ? '20,60,10' : '60,140,30'},0.15)`);
        grad.addColorStop(0.5, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(${dark ? '40,90,20' : '80,180,50'},0.12)`);
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, ts, ts);

        // Secondary color patches for natural variation
        ctx.fillStyle = dark ? 'rgba(35,70,18,0.35)' : 'rgba(50,150,25,0.2)';
        ctx.beginPath();
        ctx.ellipse(
            x + ((seed * 5) % ts),
            y + ((seed2 * 3) % ts),
            ts * 0.3, ts * 0.2, seed * 0.5, 0, Math.PI * 2
        );
        ctx.fill();

        // Animated grass blades with wind sway
        const windPhase = this.time * 1.5 + col * 0.7 + row * 0.5;
        const windSway = Math.sin(windPhase) * ts * 0.03;
        const bladeColor1 = dark ? 'rgba(25,90,12,0.6)' : 'rgba(70,170,35,0.45)';
        const bladeColor2 = dark ? 'rgba(40,100,20,0.5)' : 'rgba(90,200,50,0.35)';

        ctx.strokeStyle = bladeColor1;
        ctx.lineWidth = 0.8;
        ctx.lineCap = 'round';
        for (let i = 0; i < 5; i++) {
            const bx = x + ((seed + i * 7) % (ts - 2)) + 1;
            const by = y + ((seed2 + i * 11) % (ts - 4)) + 4;
            const h = ts * (0.08 + (seed + i) % 3 * 0.03);
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.quadraticCurveTo(bx + windSway * (1 + i * 0.2), by - h * 0.6, bx + windSway * (1.5 + i * 0.15), by - h);
            ctx.stroke();
        }

        // Second set of blades, slightly different shade
        ctx.strokeStyle = bladeColor2;
        ctx.lineWidth = 0.6;
        for (let i = 0; i < 3; i++) {
            const bx = x + ((seed2 + i * 9) % (ts - 2)) + 1;
            const by = y + ((seed + i * 5) % (ts - 3)) + 3;
            const h = ts * (0.06 + (seed2 + i) % 3 * 0.025);
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.quadraticCurveTo(bx + windSway * 1.2, by - h * 0.5, bx + windSway * 1.8, by - h);
            ctx.stroke();
        }

        // Small wildflower details on some tiles
        if ((col * 13 + row * 7) % 11 < 2 && !dark) {
            const flowerColors = ['#ffeb3b', '#e8f5e9', '#fff9c4', '#f8bbd0'];
            const fc = flowerColors[(col + row) % flowerColors.length];
            const fx = x + ((seed * 4) % (ts - 6)) + 3;
            const fy = y + ((seed2 * 2) % (ts - 6)) + 3;
            // Tiny flower petals
            ctx.fillStyle = fc;
            const petalR = ts * 0.025;
            for (let p = 0; p < 4; p++) {
                const pa = p * Math.PI * 0.5 + this.time * 0.3;
                ctx.beginPath();
                ctx.arc(fx + Math.cos(pa) * petalR * 1.2, fy + Math.sin(pa) * petalR * 1.2, petalR, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = '#fdd835';
            ctx.beginPath();
            ctx.arc(fx, fy, petalR * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Dew sparkle (very subtle)
        if ((col * 3 + row * 11) % 19 === 0) {
            const sparkle = Math.sin(this.time * 2.5 + seed) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255,255,240,${sparkle * 0.25})`;
            ctx.beginPath();
            ctx.arc(x + ts * 0.6, y + ts * 0.3, ts * 0.02, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawPath(ctx, x, y, ts, col, row) {
        // Cobblestone-style path with individual stone shapes
        const seed = (col * 11 + row * 7) % 13;
        const seed2 = (col * 23 + row * 31) % 19;

        // Base earthy fill
        ctx.fillStyle = '#8a7050';
        ctx.fillRect(x, y, ts, ts);

        // Mortar/grout lines (darker gaps between stones)
        ctx.fillStyle = '#6a5535';
        ctx.fillRect(x, y, ts, ts);

        // Draw individual cobblestones
        const stoneColors = ['#a08565', '#b09575', '#988060', '#a89070', '#b8a080'];
        const stones = [
            // row 1
            { sx: 0.02, sy: 0.02, sw: 0.30, sh: 0.30, r: 3 },
            { sx: 0.35, sy: 0.03, sw: 0.28, sh: 0.28, r: 2 },
            { sx: 0.66, sy: 0.02, sw: 0.32, sh: 0.30, r: 3 },
            // row 2
            { sx: 0.05, sy: 0.35, sw: 0.26, sh: 0.28, r: 2 },
            { sx: 0.34, sy: 0.34, sw: 0.32, sh: 0.30, r: 3 },
            { sx: 0.69, sy: 0.35, sw: 0.28, sh: 0.28, r: 2 },
            // row 3
            { sx: 0.02, sy: 0.66, sw: 0.32, sh: 0.32, r: 3 },
            { sx: 0.37, sy: 0.67, sw: 0.28, sh: 0.30, r: 2 },
            { sx: 0.68, sy: 0.66, sw: 0.30, sh: 0.32, r: 3 },
        ];

        for (let i = 0; i < stones.length; i++) {
            const s = stones[i];
            const colorIdx = (seed + i) % stoneColors.length;
            ctx.fillStyle = stoneColors[colorIdx];

            // Rounded stone shape
            const sx = x + s.sx * ts;
            const sy = y + s.sy * ts;
            const sw = s.sw * ts;
            const sh = s.sh * ts;
            ctx.beginPath();
            ctx.roundRect(sx, sy, sw, sh, s.r);
            ctx.fill();

            // Stone highlight (top-left)
            ctx.fillStyle = 'rgba(220,200,170,0.2)';
            ctx.beginPath();
            ctx.roundRect(sx + 1, sy + 1, sw * 0.5, sh * 0.4, s.r);
            ctx.fill();

            // Stone shadow (bottom-right)
            ctx.fillStyle = 'rgba(40,30,20,0.15)';
            ctx.beginPath();
            ctx.roundRect(sx + sw * 0.3, sy + sh * 0.5, sw * 0.65, sh * 0.45, s.r);
            ctx.fill();
        }

        // Occasional dirt in cracks
        ctx.fillStyle = 'rgba(60,45,25,0.3)';
        ctx.fillRect(x + ((seed * 4) % (ts - 3)), y + ((seed2 * 2) % (ts - 2)), 2, 1);
        ctx.fillRect(x + ((seed2 * 3) % (ts - 2)), y + ((seed * 5) % (ts - 2)), 1, 2);

        // Tiny weed poking through cracks on some tiles
        if (seed % 7 === 0) {
            const wx = x + ts * 0.33;
            const wy = y + ts * 0.34;
            ctx.strokeStyle = 'rgba(60,130,30,0.5)';
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(wx, wy);
            ctx.quadraticCurveTo(wx - 1, wy - ts * 0.04, wx - 1.5, wy - ts * 0.07);
            ctx.stroke();
        }

        // Path border detection - draw edge shadows where path meets grass
        const above = row > 0 ? this.tiles[(row - 1) * this.mapW + col] : -1;
        const below = row < this.mapH - 1 ? this.tiles[(row + 1) * this.mapW + col] : -1;
        const left = col > 0 ? this.tiles[row * this.mapW + col - 1] : -1;
        const right = col < this.mapW - 1 ? this.tiles[row * this.mapW + col + 1] : -1;

        ctx.fillStyle = 'rgba(40,25,10,0.25)';
        if (above !== TILE.PATH && above !== TILE.BRIDGE && above !== TILE.DOOR && above !== TILE.FLOOR) {
            ctx.fillRect(x, y, ts, 2);
        }
        if (below !== TILE.PATH && below !== TILE.BRIDGE && below !== TILE.DOOR && below !== TILE.FLOOR) {
            ctx.fillRect(x, y + ts - 2, ts, 2);
        }
        if (left !== TILE.PATH && left !== TILE.BRIDGE && left !== TILE.DOOR && left !== TILE.FLOOR) {
            ctx.fillRect(x, y, 2, ts);
        }
        if (right !== TILE.PATH && right !== TILE.BRIDGE && right !== TILE.DOOR && right !== TILE.FLOOR) {
            ctx.fillRect(x + ts - 2, y, 2, ts);
        }
    }

    _drawWater(ctx, x, y, ts, col, row) {
        // Animated water
        const wave = Math.sin(this._waterOffset * 3 + col * 0.8 + row * 0.6);
        const r = 30 + wave * 10;
        const g = 100 + wave * 15;
        const b = 200 + wave * 20;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, ts, ts);

        // Shimmer highlights
        ctx.fillStyle = `rgba(255,255,255,${0.1 + wave * 0.08})`;
        const sx = x + ts * 0.3 + Math.sin(this._waterOffset * 2 + col) * ts * 0.2;
        const sy = y + ts * 0.4 + Math.cos(this._waterOffset * 1.5 + row) * ts * 0.2;
        ctx.fillRect(sx, sy, ts * 0.15, ts * 0.06);
        ctx.fillRect(sx + ts * 0.3, sy + ts * 0.25, ts * 0.1, ts * 0.04);

        // Edge foam where water meets land
        const above = row > 0 ? this.tiles[(row - 1) * this.mapW + col] : TILE.WATER;
        if (above !== TILE.WATER) {
            const foamAlpha = 0.3 + Math.sin(this._waterOffset * 4 + col) * 0.1;
            ctx.fillStyle = `rgba(200,230,255,${foamAlpha})`;
            ctx.fillRect(x, y, ts, ts * 0.12);
        }
    }

    _drawWall(ctx, x, y, ts, col, row) {
        // Stone/brick wall
        ctx.fillStyle = '#6d5540';
        ctx.fillRect(x, y, ts, ts);

        // Brick pattern
        const brickH = ts / 4;
        const brickW = ts / 2;
        ctx.strokeStyle = 'rgba(40,30,20,0.4)';
        ctx.lineWidth = 1;
        for (let by = 0; by < 4; by++) {
            const offset = (by % 2) * brickW * 0.5;
            for (let bx = -1; bx < 3; bx++) {
                ctx.strokeRect(x + bx * brickW + offset, y + by * brickH, brickW, brickH);
            }
        }

        // Top edge highlight
        const below = row < this.mapH - 1 ? this.tiles[(row + 1) * this.mapW + col] : TILE.WALL;
        if (below !== TILE.WALL && below !== TILE.ROOF) {
            ctx.fillStyle = 'rgba(100,80,60,0.6)';
            ctx.fillRect(x, y + ts - 3, ts, 3);
        }
    }

    _drawFloor(ctx, x, y, ts) {
        // Indoor wooden floor
        ctx.fillStyle = '#b08860';
        ctx.fillRect(x, y, ts, ts);

        // Wood grain
        ctx.strokeStyle = 'rgba(80,60,30,0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const gy = y + ts * (0.2 + i * 0.3);
            ctx.beginPath();
            ctx.moveTo(x, gy);
            ctx.lineTo(x + ts, gy);
            ctx.stroke();
        }
    }

    _drawFence(ctx, x, y, ts, col, row) {
        // Grass underneath
        this._drawGrass(ctx, x, y, ts, col, row);

        // Fence posts
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(x + ts * 0.4, y, ts * 0.2, ts);

        // Cross beams
        ctx.fillRect(x, y + ts * 0.25, ts, ts * 0.1);
        ctx.fillRect(x, y + ts * 0.65, ts, ts * 0.1);

        // Post tops
        ctx.fillStyle = '#a08868';
        ctx.fillRect(x + ts * 0.35, y, ts * 0.3, ts * 0.08);
    }

    _drawBridge(ctx, x, y, ts) {
        // Wooden bridge over water
        ctx.fillStyle = '#a08055';
        ctx.fillRect(x, y, ts, ts);

        // Planks
        ctx.strokeStyle = 'rgba(60,40,20,0.4)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(x, y + i * (ts / 4));
            ctx.lineTo(x + ts, y + i * (ts / 4));
            ctx.stroke();
        }

        // Rails
        ctx.fillStyle = '#705030';
        ctx.fillRect(x, y, ts * 0.08, ts);
        ctx.fillRect(x + ts * 0.92, y, ts * 0.08, ts);
    }

    _drawFlowers(ctx, x, y, ts, col, row) {
        const seed = col * 31 + row * 17;
        const colors = ['#ff6b8a', '#ffb347', '#fff44f', '#7ec8e3', '#c9b1ff'];
        for (let i = 0; i < 4; i++) {
            const fx = x + ((seed + i * 11) % (ts - 4)) + 2;
            const fy = y + ((seed * 3 + i * 13) % (ts - 4)) + 2;
            ctx.fillStyle = colors[(seed + i) % colors.length];
            ctx.beginPath();
            ctx.arc(fx, fy, ts * 0.08, 0, Math.PI * 2);
            ctx.fill();
            // Center
            ctx.fillStyle = '#ffeb3b';
            ctx.beginPath();
            ctx.arc(fx, fy, ts * 0.03, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawSand(ctx, x, y, ts) {
        ctx.fillStyle = '#d4b896';
        ctx.fillRect(x, y, ts, ts);
        ctx.fillStyle = 'rgba(200,170,130,0.3)';
        ctx.fillRect(x + 3, y + 5, 2, 1);
        ctx.fillRect(x + ts - 6, y + ts - 4, 2, 1);
    }

    _drawRoof(ctx, x, y, ts, col, row) {
        // Roof tiles
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x, y, ts, ts);

        // Shingle pattern
        const shingleH = ts / 3;
        ctx.fillStyle = 'rgba(100,50,10,0.3)';
        for (let sy2 = 0; sy2 < 3; sy2++) {
            const offset = (sy2 % 2) * ts * 0.25;
            ctx.fillRect(x + offset, y + sy2 * shingleH, ts * 0.5, 1);
            ctx.fillRect(x + offset + ts * 0.5, y + sy2 * shingleH, ts * 0.5, 1);
        }
    }

    _drawDoor(ctx, x, y, ts) {
        // Door on floor
        ctx.fillStyle = '#6d4c2e';
        ctx.fillRect(x + ts * 0.2, y + ts * 0.05, ts * 0.6, ts * 0.9);
        // Door handle
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x + ts * 0.65, y + ts * 0.5, ts * 0.05, 0, Math.PI * 2);
        ctx.fill();
        // Door frame
        ctx.strokeStyle = '#4a3520';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + ts * 0.2, y + ts * 0.05, ts * 0.6, ts * 0.9);
    }

    _drawStone(ctx, x, y, ts) {
        ctx.fillStyle = '#808080';
        ctx.fillRect(x, y, ts, ts);
        // Stone pattern
        ctx.strokeStyle = 'rgba(50,50,50,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, ts * 0.45, ts * 0.45);
        ctx.strokeRect(x + ts * 0.5, y + 1, ts * 0.48, ts * 0.48);
        ctx.strokeRect(x + 2, y + ts * 0.5, ts * 0.5, ts * 0.48);
    }

    // === OBJECT RENDERING ===

    _renderObject(ctx, obj, col, row, ts) {
        const x = col * ts;
        const y = row * ts;

        switch (obj) {
            case OBJ.TREE_OAK:
                this._drawTreeOak(ctx, x, y, ts);
                break;
            case OBJ.TREE_PINE:
                this._drawTreePine(ctx, x, y, ts);
                break;
            case OBJ.BUSH:
                this._drawBush(ctx, x, y, ts);
                break;
            case OBJ.ROCK:
                this._drawRock(ctx, x, y, ts);
                break;
            case OBJ.BENCH:
                this._drawBench(ctx, x, y, ts);
                break;
            case OBJ.LAMP:
                this._drawLamp(ctx, x, y, ts);
                break;
            case OBJ.SIGN:
                this._drawSign(ctx, x, y, ts);
                break;
            case OBJ.WELL:
                this._drawWell(ctx, x, y, ts);
                break;
            case OBJ.MAILBOX:
                this._drawMailbox(ctx, x, y, ts);
                break;
            case OBJ.DOG_HOUSE:
                this._drawDogHouse(ctx, x, y, ts);
                break;
            case OBJ.FOUNTAIN:
                this._drawFountain(ctx, x, y, ts);
                break;
            case OBJ.BARREL:
                this._drawBarrel(ctx, x, y, ts);
                break;
            case OBJ.CRATE:
                this._drawCrate(ctx, x, y, ts);
                break;
            case OBJ.FLOWER_BED:
                this._drawFlowerBed(ctx, x, y, ts);
                break;
            case OBJ.STATUE:
                this._drawStatue(ctx, x, y, ts);
                break;
            case OBJ.CHIMNEY:
                this._drawChimney(ctx, x, y, ts);
                break;
            case OBJ.WINDOW:
                this._drawWindow(ctx, x, y, ts);
                break;
        }
    }

    _drawTreeOak(ctx, x, y, ts) {
        // Trunk
        ctx.fillStyle = '#5d3a1a';
        ctx.fillRect(x + ts * 0.35, y + ts * 0.5, ts * 0.3, ts * 0.5);

        // Canopy - layered circles for volume
        const cx = x + ts * 0.5;
        const sway = Math.sin(this.time * 0.8 + x * 0.1) * ts * 0.02;

        ctx.fillStyle = '#1a6b0a';
        ctx.beginPath();
        ctx.ellipse(cx + sway - ts * 0.2, y + ts * 0.3, ts * 0.28, ts * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2a8b15';
        ctx.beginPath();
        ctx.ellipse(cx + sway + ts * 0.15, y + ts * 0.28, ts * 0.3, ts * 0.27, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#35a020';
        ctx.beginPath();
        ctx.ellipse(cx + sway, y + ts * 0.15, ts * 0.35, ts * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(100,200,50,0.3)';
        ctx.beginPath();
        ctx.ellipse(cx + sway - ts * 0.08, y + ts * 0.08, ts * 0.15, ts * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawTreePine(ctx, x, y, ts) {
        // Trunk
        ctx.fillStyle = '#4a2810';
        ctx.fillRect(x + ts * 0.4, y + ts * 0.65, ts * 0.2, ts * 0.35);

        const cx = x + ts * 0.5;
        const sway = Math.sin(this.time * 0.6 + x * 0.15) * ts * 0.015;

        // Pine layers (triangles)
        for (let i = 0; i < 3; i++) {
            const layerY = y + ts * 0.1 + i * ts * 0.2;
            const w = ts * (0.25 + i * 0.1);
            ctx.fillStyle = i === 0 ? '#1a5a15' : (i === 1 ? '#1d6818' : '#206b1a');
            ctx.beginPath();
            ctx.moveTo(cx + sway, layerY);
            ctx.lineTo(cx + sway - w, layerY + ts * 0.28);
            ctx.lineTo(cx + sway + w, layerY + ts * 0.28);
            ctx.closePath();
            ctx.fill();
        }
    }

    _drawBush(ctx, x, y, ts) {
        ctx.fillStyle = '#2d7a1e';
        ctx.beginPath();
        ctx.ellipse(x + ts * 0.5, y + ts * 0.6, ts * 0.4, ts * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#3a9928';
        ctx.beginPath();
        ctx.ellipse(x + ts * 0.4, y + ts * 0.55, ts * 0.25, ts * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Berries sometimes
        if ((Math.floor(x + y)) % 3 === 0) {
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(x + ts * 0.6, y + ts * 0.5, ts * 0.04, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + ts * 0.45, y + ts * 0.45, ts * 0.04, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawRock(ctx, x, y, ts) {
        ctx.fillStyle = '#707070';
        ctx.beginPath();
        ctx.ellipse(x + ts * 0.5, y + ts * 0.6, ts * 0.35, ts * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(180,180,180,0.3)';
        ctx.beginPath();
        ctx.ellipse(x + ts * 0.4, y + ts * 0.5, ts * 0.15, ts * 0.1, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawBench(ctx, x, y, ts) {
        // Seat
        ctx.fillStyle = '#8B6840';
        ctx.fillRect(x + ts * 0.1, y + ts * 0.4, ts * 0.8, ts * 0.2);
        // Legs
        ctx.fillStyle = '#5a4030';
        ctx.fillRect(x + ts * 0.15, y + ts * 0.6, ts * 0.08, ts * 0.3);
        ctx.fillRect(x + ts * 0.77, y + ts * 0.6, ts * 0.08, ts * 0.3);
        // Back
        ctx.fillRect(x + ts * 0.1, y + ts * 0.2, ts * 0.8, ts * 0.06);
        ctx.fillRect(x + ts * 0.12, y + ts * 0.2, ts * 0.04, ts * 0.22);
        ctx.fillRect(x + ts * 0.84, y + ts * 0.2, ts * 0.04, ts * 0.22);
    }

    _drawLamp(ctx, x, y, ts) {
        // Pole
        ctx.fillStyle = '#444';
        ctx.fillRect(x + ts * 0.45, y + ts * 0.25, ts * 0.1, ts * 0.75);
        // Lamp head
        ctx.fillStyle = '#666';
        ctx.fillRect(x + ts * 0.3, y + ts * 0.15, ts * 0.4, ts * 0.15);
        // Glow
        ctx.fillStyle = 'rgba(255,220,100,0.5)';
        ctx.beginPath();
        ctx.arc(x + ts * 0.5, y + ts * 0.22, ts * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawSign(ctx, x, y, ts) {
        // Post
        ctx.fillStyle = '#6d4c2e';
        ctx.fillRect(x + ts * 0.45, y + ts * 0.45, ts * 0.1, ts * 0.55);
        // Board
        ctx.fillStyle = '#d4a56a';
        ctx.fillRect(x + ts * 0.15, y + ts * 0.2, ts * 0.7, ts * 0.3);
        ctx.strokeStyle = '#5a3a1a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + ts * 0.15, y + ts * 0.2, ts * 0.7, ts * 0.3);
    }

    _drawWell(ctx, x, y, ts) {
        // Base
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.ellipse(x + ts * 0.5, y + ts * 0.65, ts * 0.38, ts * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Wall
        ctx.fillStyle = '#6d6d6d';
        ctx.fillRect(x + ts * 0.12, y + ts * 0.35, ts * 0.76, ts * 0.3);
        // Water inside
        ctx.fillStyle = '#2196F3';
        ctx.beginPath();
        ctx.ellipse(x + ts * 0.5, y + ts * 0.4, ts * 0.28, ts * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        // Roof posts
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(x + ts * 0.18, y + ts * 0.1, ts * 0.06, ts * 0.35);
        ctx.fillRect(x + ts * 0.76, y + ts * 0.1, ts * 0.06, ts * 0.35);
        // Roof
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.moveTo(x + ts * 0.5, y);
        ctx.lineTo(x + ts * 0.1, y + ts * 0.15);
        ctx.lineTo(x + ts * 0.9, y + ts * 0.15);
        ctx.closePath();
        ctx.fill();
    }

    _drawMailbox(ctx, x, y, ts) {
        // Post
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(x + ts * 0.45, y + ts * 0.5, ts * 0.1, ts * 0.5);
        // Box
        ctx.fillStyle = '#1565c0';
        ctx.fillRect(x + ts * 0.25, y + ts * 0.3, ts * 0.5, ts * 0.25);
        // Flag
        ctx.fillStyle = '#f44336';
        ctx.fillRect(x + ts * 0.75, y + ts * 0.3, ts * 0.08, ts * 0.15);
    }

    _drawDogHouse(ctx, x, y, ts) {
        // Base
        ctx.fillStyle = '#c0825a';
        ctx.fillRect(x + ts * 0.1, y + ts * 0.4, ts * 0.8, ts * 0.55);
        // Door hole
        ctx.fillStyle = '#3a2010';
        ctx.beginPath();
        ctx.arc(x + ts * 0.5, y + ts * 0.7, ts * 0.18, Math.PI, 0, true);
        ctx.fillRect(x + ts * 0.32, y + ts * 0.7, ts * 0.36, ts * 0.25);
        ctx.fill();
        // Roof
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.moveTo(x + ts * 0.5, y + ts * 0.2);
        ctx.lineTo(x + ts * 0.02, y + ts * 0.45);
        ctx.lineTo(x + ts * 0.98, y + ts * 0.45);
        ctx.closePath();
        ctx.fill();
        // Name plate
        ctx.fillStyle = '#d4a56a';
        ctx.fillRect(x + ts * 0.3, y + ts * 0.45, ts * 0.4, ts * 0.08);
    }

    _drawFountain(ctx, x, y, ts) {
        // Base
        ctx.fillStyle = '#909090';
        ctx.beginPath();
        ctx.ellipse(x + ts * 0.5, y + ts * 0.65, ts * 0.45, ts * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        // Water
        ctx.fillStyle = '#4fc3f7';
        ctx.beginPath();
        ctx.ellipse(x + ts * 0.5, y + ts * 0.62, ts * 0.35, ts * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        // Center pillar
        ctx.fillStyle = '#a0a0a0';
        ctx.fillRect(x + ts * 0.42, y + ts * 0.2, ts * 0.16, ts * 0.45);
        // Water spray
        const spray = Math.sin(this.time * 4) * 0.03;
        ctx.fillStyle = `rgba(100,200,255,${0.5 + spray})`;
        ctx.beginPath();
        ctx.arc(x + ts * 0.5, y + ts * 0.18, ts * 0.08, 0, Math.PI * 2);
        ctx.fill();
        // Droplets
        for (let i = 0; i < 3; i++) {
            const angle = this.time * 3 + i * 2.1;
            const dx = Math.cos(angle) * ts * 0.15;
            const dy = Math.sin(angle) * ts * 0.08 + ts * 0.35;
            ctx.fillStyle = 'rgba(100,200,255,0.6)';
            ctx.beginPath();
            ctx.arc(x + ts * 0.5 + dx, y + dy, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawBarrel(ctx, x, y, ts) {
        ctx.fillStyle = '#8B6840';
        ctx.beginPath();
        ctx.ellipse(x + ts * 0.5, y + ts * 0.65, ts * 0.28, ts * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7a5a35';
        ctx.fillRect(x + ts * 0.22, y + ts * 0.3, ts * 0.56, ts * 0.35);
        // Metal bands
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(x + ts * 0.5, y + ts * 0.38, ts * 0.28, ts * 0.06, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Top
        ctx.fillStyle = '#6d4c2e';
        ctx.beginPath();
        ctx.ellipse(x + ts * 0.5, y + ts * 0.3, ts * 0.28, ts * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawCrate(ctx, x, y, ts) {
        ctx.fillStyle = '#a08050';
        ctx.fillRect(x + ts * 0.15, y + ts * 0.3, ts * 0.7, ts * 0.6);
        // Cross boards
        ctx.strokeStyle = '#705030';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + ts * 0.15, y + ts * 0.3);
        ctx.lineTo(x + ts * 0.85, y + ts * 0.9);
        ctx.moveTo(x + ts * 0.85, y + ts * 0.3);
        ctx.lineTo(x + ts * 0.15, y + ts * 0.9);
        ctx.stroke();
        // Top
        ctx.fillStyle = '#b09060';
        ctx.fillRect(x + ts * 0.12, y + ts * 0.25, ts * 0.76, ts * 0.1);
    }

    _drawFlowerBed(ctx, x, y, ts) {
        // Earth border
        ctx.fillStyle = '#5a3a20';
        ctx.beginPath();
        ctx.roundRect(x + ts * 0.05, y + ts * 0.2, ts * 0.9, ts * 0.7, ts * 0.08);
        ctx.fill();
        // Soil
        ctx.fillStyle = '#3a2a15';
        ctx.beginPath();
        ctx.roundRect(x + ts * 0.12, y + ts * 0.25, ts * 0.76, ts * 0.6, ts * 0.05);
        ctx.fill();
        // Flowers
        const colors = ['#ff6b8a', '#ffb347', '#fff44f', '#c9b1ff', '#7ec8e3'];
        for (let i = 0; i < 5; i++) {
            const fx = x + ts * (0.2 + i * 0.15);
            const fy = y + ts * 0.45 + Math.sin(this.time + i) * ts * 0.02;
            ctx.fillStyle = colors[i];
            ctx.beginPath();
            ctx.arc(fx, fy, ts * 0.06, 0, Math.PI * 2);
            ctx.fill();
            // Stem
            ctx.strokeStyle = '#2d7a1e';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(fx, fy + ts * 0.06);
            ctx.lineTo(fx, fy + ts * 0.2);
            ctx.stroke();
        }
    }

    _drawStatue(ctx, x, y, ts) {
        // Base
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + ts * 0.25, y + ts * 0.7, ts * 0.5, ts * 0.25);
        // Dog figure
        ctx.fillStyle = '#a0a0a0';
        ctx.fillRect(x + ts * 0.35, y + ts * 0.3, ts * 0.3, ts * 0.4);
        // Head
        ctx.beginPath();
        ctx.arc(x + ts * 0.5, y + ts * 0.25, ts * 0.15, 0, Math.PI * 2);
        ctx.fill();
        // Plaque
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x + ts * 0.3, y + ts * 0.8, ts * 0.4, ts * 0.06);
    }

    _drawChimney(ctx, x, y, ts) {
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(x + ts * 0.3, y + ts * 0.1, ts * 0.4, ts * 0.5);
        // Top
        ctx.fillStyle = '#555';
        ctx.fillRect(x + ts * 0.25, y + ts * 0.05, ts * 0.5, ts * 0.1);
        // Smoke
        const smokeAlpha = 0.15 + Math.sin(this.time * 2) * 0.05;
        ctx.fillStyle = `rgba(180,180,180,${smokeAlpha})`;
        ctx.beginPath();
        ctx.arc(x + ts * 0.5 + Math.sin(this.time) * ts * 0.1, y - ts * 0.1, ts * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + ts * 0.5 + Math.sin(this.time * 0.7) * ts * 0.15, y - ts * 0.3, ts * 0.09, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawWindow(ctx, x, y, ts) {
        // Window frame
        ctx.fillStyle = '#4a3520';
        ctx.fillRect(x + ts * 0.15, y + ts * 0.2, ts * 0.7, ts * 0.5);
        // Glass
        ctx.fillStyle = 'rgba(135,206,235,0.6)';
        ctx.fillRect(x + ts * 0.2, y + ts * 0.25, ts * 0.27, ts * 0.18);
        ctx.fillRect(x + ts * 0.53, y + ts * 0.25, ts * 0.27, ts * 0.18);
        ctx.fillRect(x + ts * 0.2, y + ts * 0.48, ts * 0.27, ts * 0.18);
        ctx.fillRect(x + ts * 0.53, y + ts * 0.48, ts * 0.27, ts * 0.18);
        // Mullion
        ctx.fillStyle = '#4a3520';
        ctx.fillRect(x + ts * 0.48, y + ts * 0.2, ts * 0.04, ts * 0.5);
        ctx.fillRect(x + ts * 0.15, y + ts * 0.43, ts * 0.7, ts * 0.04);
        // Warm glow from inside
        ctx.fillStyle = 'rgba(255,200,100,0.2)';
        ctx.fillRect(x + ts * 0.2, y + ts * 0.25, ts * 0.6, ts * 0.4);
    }

    // === SHADOWS ===

    _renderShadows(ctx, startCol, endCol, startRow, endRow, ts) {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';

        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                const obj = this.objects[r * this.mapW + c];
                if (obj === OBJ.TREE_OAK || obj === OBJ.TREE_PINE) {
                    const sx = c * ts + ts * 0.3;
                    const sy = r * ts + ts * 0.7;
                    ctx.beginPath();
                    ctx.ellipse(sx + ts * 0.4, sy + ts * 0.1, ts * 0.45, ts * 0.15, 0.3, 0, Math.PI * 2);
                    ctx.fill();
                } else if (obj === OBJ.STATUE || obj === OBJ.WELL || obj === OBJ.FOUNTAIN) {
                    ctx.beginPath();
                    ctx.ellipse(c * ts + ts * 0.6, r * ts + ts * 0.85, ts * 0.35, ts * 0.12, 0.2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Player shadow
        ctx.beginPath();
        ctx.ellipse(
            this.playerX * ts + ts * 0.55,
            this.playerY * ts + ts * 0.9,
            ts * 0.25, ts * 0.08, 0, 0, Math.PI * 2
        );
        ctx.fill();

        // NPC shadows
        for (const npc of this.npcs) {
            ctx.beginPath();
            ctx.ellipse(
                npc.x * ts + ts * 0.55,
                npc.y * ts + ts * 0.9,
                ts * 0.2, ts * 0.07, 0, 0, Math.PI * 2
            );
            ctx.fill();
        }
    }

    // === PLAYER RENDERING ===

    _renderPlayer(ctx, ts) {
        const x = this.playerX * ts;
        const y = this.playerY * ts;
        const bounce = this.playerMoving ? Math.sin(this.playerAnimFrame) * ts * 0.04 : 0;

        // Body
        const bodyW = ts * 0.5;
        const bodyH = ts * 0.35;
        ctx.fillStyle = '#d4a054'; // golden-ish dog color

        // Direction-based shape
        const cx = x + ts * 0.5;
        const cy = y + ts * 0.55 + bounce;

        // Body ellipse
        ctx.beginPath();
        ctx.ellipse(cx, cy, bodyW * 0.5, bodyH * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head (direction-dependent)
        let headX = cx, headY = cy;
        if (this.playerDir === 0) { headY = cy + ts * 0.15; headX = cx; } // down
        else if (this.playerDir === 3) { headY = cy - ts * 0.2; headX = cx; } // up
        else if (this.playerDir === 1) { headX = cx - ts * 0.2; } // left
        else { headX = cx + ts * 0.2; } // right

        ctx.fillStyle = '#c89540';
        ctx.beginPath();
        ctx.arc(headX, headY, ts * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.fillStyle = '#a07030';
        if (this.playerDir === 0 || this.playerDir === 3) {
            ctx.beginPath();
            ctx.ellipse(headX - ts * 0.12, headY - ts * 0.08, ts * 0.06, ts * 0.1, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(headX + ts * 0.12, headY - ts * 0.08, ts * 0.06, ts * 0.1, 0.3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.playerDir === 1) {
            ctx.beginPath();
            ctx.ellipse(headX - ts * 0.05, headY - ts * 0.12, ts * 0.08, ts * 0.1, -0.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.ellipse(headX + ts * 0.05, headY - ts * 0.12, ts * 0.08, ts * 0.1, 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Eyes (only when facing down or sideways)
        if (this.playerDir !== 3) {
            ctx.fillStyle = '#222';
            if (this.playerDir === 0) {
                ctx.beginPath();
                ctx.arc(headX - ts * 0.06, headY - ts * 0.02, ts * 0.025, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(headX + ts * 0.06, headY - ts * 0.02, ts * 0.025, 0, Math.PI * 2);
                ctx.fill();
            } else {
                const ex = this.playerDir === 1 ? headX - ts * 0.06 : headX + ts * 0.06;
                ctx.beginPath();
                ctx.arc(ex, headY - ts * 0.02, ts * 0.025, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Nose
        ctx.fillStyle = '#222';
        let noseX = headX, noseY = headY + ts * 0.08;
        if (this.playerDir === 1) { noseX = headX - ts * 0.12; noseY = headY + ts * 0.02; }
        else if (this.playerDir === 2) { noseX = headX + ts * 0.12; noseY = headY + ts * 0.02; }
        else if (this.playerDir === 3) { noseY = headY - ts * 0.12; }
        ctx.beginPath();
        ctx.arc(noseX, noseY, ts * 0.03, 0, Math.PI * 2);
        ctx.fill();

        // Tail (wagging)
        const tailAngle = Math.sin(this.time * 6) * 0.6;
        ctx.strokeStyle = '#c89540';
        ctx.lineWidth = ts * 0.06;
        ctx.lineCap = 'round';
        let tailX = cx, tailY = cy;
        if (this.playerDir === 0) { tailY = cy - ts * 0.15; }
        else if (this.playerDir === 3) { tailY = cy + ts * 0.18; }
        else if (this.playerDir === 1) { tailX = cx + ts * 0.22; }
        else { tailX = cx - ts * 0.22; }
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.quadraticCurveTo(
            tailX + Math.sin(tailAngle) * ts * 0.15,
            tailY - ts * 0.15,
            tailX + Math.sin(tailAngle) * ts * 0.2,
            tailY - ts * 0.25
        );
        ctx.stroke();

        // Legs (simple when moving)
        if (this.playerMoving) {
            ctx.fillStyle = '#b08030';
            const legPhase = this.playerAnimFrame;
            const legOffset1 = Math.sin(legPhase) * ts * 0.06;
            const legOffset2 = Math.sin(legPhase + Math.PI) * ts * 0.06;

            if (this.playerDir === 0 || this.playerDir === 3) {
                // Front legs
                ctx.fillRect(cx - ts * 0.15 + legOffset1, cy + ts * 0.12, ts * 0.08, ts * 0.15);
                ctx.fillRect(cx + ts * 0.08 + legOffset2, cy + ts * 0.12, ts * 0.08, ts * 0.15);
                // Back legs
                ctx.fillRect(cx - ts * 0.12 + legOffset2, cy + ts * 0.12, ts * 0.07, ts * 0.12);
                ctx.fillRect(cx + ts * 0.06 + legOffset1, cy + ts * 0.12, ts * 0.07, ts * 0.12);
            } else {
                // Side view legs
                ctx.fillRect(cx - ts * 0.08, cy + ts * 0.1 + legOffset1, ts * 0.08, ts * 0.15);
                ctx.fillRect(cx + ts * 0.02, cy + ts * 0.1 + legOffset2, ts * 0.08, ts * 0.15);
            }
        }
    }

    // === NPC RENDERING ===

    _renderNPC(ctx, npc, ts) {
        const x = npc.x * ts;
        const y = npc.y * ts;

        // Simple animal body (use color)
        const color = npc.color || '#888';
        const cx = x + ts * 0.5;
        const cy = y + ts * 0.55;

        // Body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(cx, cy, ts * 0.22, ts * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(cx, cy - ts * 0.12, ts * 0.13, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(cx - ts * 0.05, cy - ts * 0.14, ts * 0.02, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + ts * 0.05, cy - ts * 0.14, ts * 0.02, 0, Math.PI * 2);
        ctx.fill();

        // Emoji overlay if specified
        if (npc.emoji) {
            ctx.font = `${ts * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(npc.emoji, cx, cy);
        }
    }

    // === ROOF LAYER ===

    _renderRoofs(ctx, startCol, endCol, startRow, endRow, ts) {
        // Check if player is inside a building (under a roof)
        const ptx = Math.round(this.playerX);
        const pty = Math.round(this.playerY);
        const playerUnderRoof = ptx >= 0 && pty >= 0 && ptx < this.mapW && pty < this.mapH &&
            this.roofs[pty * this.mapW + ptx] === 1;

        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if (this.roofs[r * this.mapW + c] !== 1) continue;

                // If player is inside this building cluster, make roof transparent
                if (playerUnderRoof && this._sameRoofCluster(c, r, ptx, pty)) {
                    ctx.globalAlpha = 0.15;
                }

                const px = c * ts;
                const py = r * ts;
                this._drawRoof(ctx, px, py, ts, c, r);

                ctx.globalAlpha = 1;
            }
        }
    }

    _sameRoofCluster(cx, cy, px, py) {
        // Simple distance check - same cluster if within 5 tiles
        return Math.abs(cx - px) <= 5 && Math.abs(cy - py) <= 5;
    }

    // === LIGHTING ===

    _renderLighting(ctx, cw, ch, scrollX, scrollY, ts) {
        const t = this.dayTime;

        // Skip lighting during bright daytime
        if (t > 0.3 && t < 0.65) return;

        // Create darkness overlay
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';

        // Base darkness level
        let darkness;
        if (t < 0.2 || t > 0.85) {
            darkness = 0.6; // night
        } else if (t < 0.3) {
            darkness = 0.6 * (1 - (t - 0.2) / 0.1); // dawn
        } else {
            darkness = 0.6 * ((t - 0.65) / 0.2); // dusk
        }

        // Dark tint
        const tintR = Math.round(255 - darkness * 180);
        const tintG = Math.round(255 - darkness * 190);
        const tintB = Math.round(255 - darkness * 150);
        ctx.fillStyle = `rgb(${tintR},${tintG},${tintB})`;
        ctx.fillRect(0, 0, cw, ch);

        ctx.restore();

        // Light sources (additive)
        if (darkness > 0.1) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';

            // Lamp lights
            for (let r = 0; r < this.mapH; r++) {
                for (let c = 0; c < this.mapW; c++) {
                    if (this.objects[r * this.mapW + c] === OBJ.LAMP) {
                        const lx = c * ts + ts * 0.5 - scrollX;
                        const ly = r * ts + ts * 0.3 - scrollY;
                        if (lx < -100 || lx > cw + 100 || ly < -100 || ly > ch + 100) continue;

                        const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, ts * 3);
                        const intensity = darkness * 0.6;
                        grad.addColorStop(0, `rgba(255,220,100,${intensity})`);
                        grad.addColorStop(0.5, `rgba(255,180,60,${intensity * 0.3})`);
                        grad.addColorStop(1, 'rgba(255,180,60,0)');
                        ctx.fillStyle = grad;
                        ctx.fillRect(lx - ts * 3, ly - ts * 3, ts * 6, ts * 6);
                    }
                }
            }

            // Custom light sources
            for (const light of this.lights) {
                const lx = light.x * ts - scrollX;
                const ly = light.y * ts - scrollY;
                if (lx < -150 || lx > cw + 150 || ly < -150 || ly > ch + 150) continue;

                const radius = (light.radius || 4) * ts;
                const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, radius);
                const lc = light.color || '255,200,100';
                grad.addColorStop(0, `rgba(${lc},${darkness * 0.5})`);
                grad.addColorStop(1, `rgba(${lc},0)`);
                ctx.fillStyle = grad;
                ctx.fillRect(lx - radius, ly - radius, radius * 2, radius * 2);
            }

            // Window glow
            for (let r = 0; r < this.mapH; r++) {
                for (let c = 0; c < this.mapW; c++) {
                    if (this.objects[r * this.mapW + c] === OBJ.WINDOW) {
                        const lx = c * ts + ts * 0.5 - scrollX;
                        const ly = r * ts + ts * 0.4 - scrollY;
                        if (lx < -50 || lx > cw + 50 || ly < -50 || ly > ch + 50) continue;

                        const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, ts * 1.5);
                        grad.addColorStop(0, `rgba(255,200,100,${darkness * 0.35})`);
                        grad.addColorStop(1, 'rgba(255,200,100,0)');
                        ctx.fillStyle = grad;
                        ctx.fillRect(lx - ts * 1.5, ly - ts * 1.5, ts * 3, ts * 3);
                    }
                }
            }

            ctx.restore();
        }
    }

    // === VIGNETTE ===

    _renderVignette(ctx, cw, ch) {
        const grad = ctx.createRadialGradient(cw / 2, ch / 2, cw * 0.3, cw / 2, ch / 2, cw * 0.75);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);
    }

    // === PARTICLES ===

    _initParticles() {
        this.particles = [];
        for (let i = 0; i < 20; i++) {
            this.particles.push(this._createParticle());
        }
    }

    _createParticle() {
        return {
            x: this.playerX + (Math.random() - 0.5) * 20,
            y: this.playerY + (Math.random() - 0.5) * 15,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -Math.random() * 0.2 - 0.05,
            size: Math.random() * 2 + 0.5,
            life: Math.random() * 5 + 3,
            maxLife: 8,
            alpha: Math.random() * 0.3 + 0.1,
            color: Math.random() > 0.5 ? '#ffe' : '#dfd',
        };
    }

    _resetParticle(p) {
        p.x = this.playerX + (Math.random() - 0.5) * 20;
        p.y = this.playerY + (Math.random() - 0.5) * 15;
        p.vx = (Math.random() - 0.5) * 0.3;
        p.vy = -Math.random() * 0.2 - 0.05;
        p.life = Math.random() * 5 + 3;
        p.alpha = Math.random() * 0.3 + 0.1;
    }

    // === UTILS ===

    _lerpColor(a, b, t) {
        const ar = parseInt(a.slice(1, 3), 16);
        const ag = parseInt(a.slice(3, 5), 16);
        const ab = parseInt(a.slice(5, 7), 16);
        const br = parseInt(b.slice(1, 3), 16);
        const bg = parseInt(b.slice(3, 5), 16);
        const bb = parseInt(b.slice(5, 7), 16);
        const rr = Math.round(ar + (br - ar) * t);
        const rg = Math.round(ag + (bg - ag) * t);
        const rb = Math.round(ab + (bb - ab) * t);
        return `#${rr.toString(16).padStart(2, '0')}${rg.toString(16).padStart(2, '0')}${rb.toString(16).padStart(2, '0')}`;
    }
}
