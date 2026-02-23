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
        this.dayTime = 0.78;  // 0-1 day cycle (0.78 = golden dusk - shows off FF7 lighting)

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

        // Build procedural tile texture cache
        this._buildTileCache();
        this._buildObjectCache();

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

        // Screen transition update
        if (this._transitionDir) {
            this._transitionAlpha = (this._transitionAlpha || 0) + this._transitionDir * (this._transitionSpeed || 2) * dt;
            if (this._transitionDir > 0 && this._transitionAlpha >= 1) {
                this._transitionAlpha = 1;
                this._transitionDir = 0;
                if (this._transitionCallback) this._transitionCallback();
            } else if (this._transitionDir < 0 && this._transitionAlpha <= 0) {
                this._transitionAlpha = 0;
                this._transitionDir = 0;
            }
        }

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

        // Particles (type-specific movement)
        for (const p of this.particles) {
            if (p.type === 'dust') {
                const driftPhase = p.driftPhase || 0;
                p.x += (p.vx + Math.sin(this.time * 0.5 + driftPhase) * 0.02) * dt;
                p.y += (p.vy + Math.cos(this.time * 0.3 + driftPhase) * 0.01) * dt;
            } else if (p.type === 'sparkle') {
                p.x += p.vx * dt * 0.5;
                p.y += p.vy * dt * 0.5;
            } else if (p.type === 'fog') {
                // Fog: very slow drift with large sinusoidal sway
                const driftPhase = p.driftPhase || 0;
                p.x += (p.vx + Math.sin(this.time * 0.15 + driftPhase) * 0.03) * dt;
                p.y += (p.vy + Math.cos(this.time * 0.1 + driftPhase) * 0.015) * dt;
            } else if (p.type === 'firefly') {
                // Fireflies: erratic movement with sudden direction changes
                p.x += (p.vx + Math.sin(this.time * 2 + (p.sparklePhase || 0)) * 0.08) * dt;
                p.y += (p.vy + Math.cos(this.time * 1.5 + (p.sparklePhase || 0)) * 0.06) * dt;
            } else if (p.type === 'ember') {
                // Embers: rise and drift with turbulence
                p.x += (p.vx + Math.sin(this.time * 3 + p.x) * 0.1) * dt;
                p.y += p.vy * dt;
                p.vy *= 0.998; // slow down as they rise
            } else {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
            }
            p.life -= dt;
            if (p.life <= 0) {
                this._resetParticle(p);
            }
        }
    }

    // === RENDERING ===

    _render() {
        const ctx = this.ctx;
        ctx.imageSmoothingEnabled = false;
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

        // Subtle parallax background elements (distant hills/mountains)
        this._renderParallaxBackground(ctx, cw, ch, scrollX, scrollY);

        // Translate to camera
        ctx.translate(-scrollX, -scrollY);

        // === GROUND LAYER ===
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                this._renderTile(ctx, c, r, ts);
            }
        }

        // === TILE TRANSITION BLENDING (soft edges between terrain types) ===
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                this._drawTileTransitions(ctx, c, r, ts);
            }
        }

        // === BUILDING FRONT FACES (3/4 perspective depth) ===
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                const tile = this.tiles[r * this.mapW + c];
                if (tile === TILE.WALL) {
                    this._drawWallFrontFace(ctx, c * ts, r * ts, ts, c, r);
                }
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

        // === PARTICLES (with type-specific rendering) ===
        for (const p of this.particles) {
            const lifeRatio = Math.max(0, p.life / p.maxLife);
            const px2 = p.x * ts;
            const py2 = p.y * ts;

            if (p.type === 'sparkle') {
                // Sparkle: pulsing star-like twinkle
                const sparkle = Math.sin((p.sparklePhase || 0) + this.time * (p.sparkleSpeed || 4));
                const sparkleAlpha = p.alpha * lifeRatio * (0.3 + sparkle * 0.7);
                if (sparkleAlpha <= 0) continue;
                ctx.globalAlpha = sparkleAlpha;
                ctx.fillStyle = p.color;
                const sz = p.size * (0.8 + sparkle * 0.5);
                ctx.fillRect(px2 - sz * 0.15, py2 - sz, sz * 0.3, sz * 2);
                ctx.fillRect(px2 - sz, py2 - sz * 0.15, sz * 2, sz * 0.3);
                ctx.beginPath();
                ctx.arc(px2, py2, sz * 0.4, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'dust') {
                ctx.globalAlpha = p.alpha * lifeRatio;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(px2, py2, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'fog') {
                // Fog: large, soft, diffuse circles (FF7 mist effect)
                const fogAlpha = p.alpha * lifeRatio * (0.5 + Math.sin(this.time * 0.3 + (p.driftPhase || 0)) * 0.5);
                if (fogAlpha <= 0.005) continue;
                ctx.globalAlpha = fogAlpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(px2, py2, p.size, 0, Math.PI * 2);
                ctx.fill();
                // Softer outer ring
                ctx.globalAlpha = fogAlpha * 0.4;
                ctx.beginPath();
                ctx.arc(px2, py2, p.size * 1.8, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'firefly') {
                // Firefly: blinking warm light with glow halo
                const blink = Math.sin((p.sparklePhase || 0) + this.time * (p.sparkleSpeed || 2));
                const ffAlpha = p.alpha * lifeRatio * Math.max(0, blink);
                if (ffAlpha <= 0) continue;
                // Outer glow
                ctx.globalAlpha = ffAlpha * 0.25;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(px2, py2, p.size * 4, 0, Math.PI * 2);
                ctx.fill();
                // Inner bright core
                ctx.globalAlpha = ffAlpha;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(px2, py2, p.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
                // Colored ring
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(px2, py2, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'ember') {
                // Ember: tiny bright spark with trail
                ctx.globalAlpha = p.alpha * lifeRatio;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(px2, py2, p.size, 0, Math.PI * 2);
                ctx.fill();
                // Fading trail below
                ctx.globalAlpha = p.alpha * lifeRatio * 0.3;
                ctx.beginPath();
                ctx.arc(px2 - p.vx * ts * 0.3, py2 - p.vy * ts * 0.3, p.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Default mote: glowing dot with halo
                ctx.globalAlpha = p.alpha * lifeRatio;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(px2, py2, p.size, 0, Math.PI * 2);
                ctx.fill();
                // Soft glow halo
                if (p.size > 1) {
                    ctx.globalAlpha = p.alpha * lifeRatio * 0.25;
                    ctx.beginPath();
                    ctx.arc(px2, py2, p.size * 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        ctx.globalAlpha = 1;

        ctx.restore();

        // === NOISE GRAIN (FF7 painted texture) ===
        this._renderNoiseOverlay(ctx, cw, ch);

        // === LIGHTING OVERLAY ===
        this._renderLighting(ctx, cw, ch, scrollX, scrollY, ts);

        // === VIGNETTE ===
        this._renderVignette(ctx, cw, ch);

        // === PS1 POST-PROCESS (FF7 pre-rendered background feel) ===
        this._applyPS1PostProcess(ctx, cw, ch);

        // === SCREEN TRANSITION OVERLAY ===
        this._renderTransition(ctx, cw, ch);

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
        // FF7-style rich sky gradients with multiple color stops
        const t = this.dayTime;
        const grad = ctx.createLinearGradient(0, 0, 0, ch);

        if (t < 0.2) {
            // Deep night - mako-tinged deep blue
            grad.addColorStop(0, '#050510');
            grad.addColorStop(0.3, '#0a0a20');
            grad.addColorStop(0.7, '#0f1030');
            grad.addColorStop(1, '#141432');
        } else if (t < 0.3) {
            // Dawn - warm horizon, cool zenith
            const f = (t - 0.2) / 0.1;
            const top = this._lerpColor('#050510', '#3a5580', f);
            const mid = this._lerpColor('#0a0a20', '#6a7090', f);
            const low = this._lerpColor('#141432', '#c89060', f);
            const bot = this._lerpColor('#141432', '#e8a870', f);
            grad.addColorStop(0, top);
            grad.addColorStop(0.4, mid);
            grad.addColorStop(0.75, low);
            grad.addColorStop(1, bot);
        } else if (t < 0.65) {
            // Day - clear blue sky
            grad.addColorStop(0, '#3a5a90');
            grad.addColorStop(0.3, '#5a80b0');
            grad.addColorStop(0.65, '#7ab0d0');
            grad.addColorStop(1, '#90cce8');
        } else if (t < 0.75) {
            // Early dusk - golden hour (FF7 Cosmo Canyon sunset)
            const f = (t - 0.65) / 0.1;
            const top = this._lerpColor('#3a5a90', '#2a2050', f);
            const mid = this._lerpColor('#5a80b0', '#8a4060', f);
            const low = this._lerpColor('#7ab0d0', '#d07040', f);
            const bot = this._lerpColor('#90cce8', '#e08850', f);
            grad.addColorStop(0, top);
            grad.addColorStop(0.35, mid);
            grad.addColorStop(0.7, low);
            grad.addColorStop(1, bot);
        } else if (t < 0.85) {
            // Deep dusk - purple sky with orange horizon
            const f = (t - 0.75) / 0.1;
            const top = this._lerpColor('#2a2050', '#0a0a1a', f);
            const mid = this._lerpColor('#8a4060', '#1a1535', f);
            const low = this._lerpColor('#d07040', '#3a2040', f);
            const bot = this._lerpColor('#e08850', '#2a1530', f);
            grad.addColorStop(0, top);
            grad.addColorStop(0.35, mid);
            grad.addColorStop(0.7, low);
            grad.addColorStop(1, bot);
        } else {
            // Night
            grad.addColorStop(0, '#050510');
            grad.addColorStop(0.3, '#0a0a20');
            grad.addColorStop(0.7, '#0f1030');
            grad.addColorStop(1, '#141432');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);
    }

    // === PARALLAX BACKGROUND ===

    _renderParallaxBackground(ctx, cw, ch, scrollX, scrollY) {
        const t = this.dayTime;
        const isDay = t > 0.3 && t < 0.75;
        const isNight = t < 0.2 || t > 0.85;
        const isDusk = t >= 0.65 && t < 0.85;

        // === LAYER 1: Very distant mountains (5% parallax) - FF7 painted backdrop ===
        const p0 = scrollX * 0.05;
        const p0Y = scrollY * 0.025;
        const mtnColor = isNight ? '15,18,40' : (isDusk ? '60,30,50' : (isDay ? '70,90,110' : '50,60,80'));
        const mtnAlpha = isNight ? 0.2 : (isDusk ? 0.18 : 0.1);
        ctx.fillStyle = `rgba(${mtnColor},${mtnAlpha})`;
        ctx.beginPath();
        ctx.moveTo(0, ch);
        for (let i = 0; i <= cw; i += cw / 16) {
            const h = ch * 0.6 + Math.sin((i + p0) * 0.002) * ch * 0.1
                    + Math.sin((i + p0) * 0.005) * ch * 0.05
                    + Math.sin((i + p0) * 0.0013) * ch * 0.07;
            ctx.lineTo(i, h - p0Y);
        }
        ctx.lineTo(cw, ch);
        ctx.closePath();
        ctx.fill();

        // Snow caps on mountains (daytime/dusk only)
        if (!isNight) {
            ctx.fillStyle = `rgba(220,230,240,${mtnAlpha * 0.6})`;
            ctx.beginPath();
            ctx.moveTo(0, ch);
            for (let i = 0; i <= cw; i += cw / 16) {
                const h = ch * 0.6 + Math.sin((i + p0) * 0.002) * ch * 0.1
                        + Math.sin((i + p0) * 0.005) * ch * 0.05
                        + Math.sin((i + p0) * 0.0013) * ch * 0.07;
                ctx.lineTo(i, h + ch * 0.01 - p0Y);
            }
            ctx.lineTo(cw, ch);
            ctx.closePath();
            ctx.fill();
        }

        // === LAYER 2: Mid-distance hills (10% parallax) ===
        const p1 = scrollX * 0.1;
        const p1Y = scrollY * 0.05;
        const hillColor = isNight ? '20,25,50' : (isDusk ? '70,40,50' : (isDay ? '55,85,55' : '60,70,60'));
        const hillAlpha = isNight ? 0.18 : (isDusk ? 0.15 : 0.1);
        ctx.fillStyle = `rgba(${hillColor},${hillAlpha})`;
        ctx.beginPath();
        ctx.moveTo(0, ch);
        for (let i = 0; i <= cw; i += cw / 12) {
            const h = ch * 0.68 + Math.sin((i + p1) * 0.003) * ch * 0.08
                    + Math.sin((i + p1) * 0.007) * ch * 0.04;
            ctx.lineTo(i, h - p1Y);
        }
        ctx.lineTo(cw, ch);
        ctx.closePath();
        ctx.fill();

        // === LAYER 3: Close foothills (20% parallax) ===
        const p2 = scrollX * 0.2;
        const p2Y = scrollY * 0.1;
        const footColor = isNight ? '12,18,35' : (isDusk ? '55,35,40' : (isDay ? '45,75,45' : '50,55,50'));
        ctx.fillStyle = `rgba(${footColor},${hillAlpha * 0.9})`;
        ctx.beginPath();
        ctx.moveTo(0, ch);
        for (let i = 0; i <= cw; i += cw / 14) {
            const h = ch * 0.76 + Math.sin((i + p2) * 0.005 + 1) * ch * 0.06
                    + Math.sin((i + p2) * 0.012 + 2) * ch * 0.03;
            ctx.lineTo(i, h - p2Y);
        }
        ctx.lineTo(cw, ch);
        ctx.closePath();
        ctx.fill();

        // === LAYER 4: Distant tree line (15% parallax) ===
        if (!isNight) {
            const p3 = scrollX * 0.15;
            const treeAlpha = isDusk ? 0.08 : (isDay ? 0.07 : 0.05);
            const treeColor = isDusk ? '40,30,25' : '25,55,20';
            ctx.fillStyle = `rgba(${treeColor},${treeAlpha})`;
            for (let i = -20; i < cw + 20; i += 14) {
                const th = ch * 0.75 + Math.sin((i + p3) * 0.01) * ch * 0.02 - scrollY * 0.08;
                const treeH = 8 + Math.sin(i * 0.23) * 4 + Math.sin(i * 0.47) * 3;
                ctx.beginPath();
                ctx.moveTo(i + p3 % 14, th);
                ctx.lineTo(i + p3 % 14 - 5, th + treeH);
                ctx.lineTo(i + p3 % 14 + 5, th + treeH);
                ctx.closePath();
                ctx.fill();
            }
            // Second row offset
            ctx.fillStyle = `rgba(${treeColor},${treeAlpha * 0.7})`;
            for (let i = -13; i < cw + 20; i += 16) {
                const th = ch * 0.74 + Math.sin((i + p3 + 50) * 0.008) * ch * 0.015 - scrollY * 0.08;
                const treeH = 10 + Math.sin(i * 0.31) * 4;
                ctx.beginPath();
                ctx.moveTo(i + p3 % 16 + 7, th);
                ctx.lineTo(i + p3 % 16 + 1, th + treeH);
                ctx.lineTo(i + p3 % 16 + 13, th + treeH);
                ctx.closePath();
                ctx.fill();
            }
        }

        // === STARS (night and dusk) ===
        if (isNight || isDusk) {
            const starParallax = scrollX * 0.02;
            const starAlpha = isNight ? 0.5 : 0.15;
            const starCount = isNight ? 40 : 12;
            for (let i = 0; i < starCount; i++) {
                const sx = ((i * 137 + 43) % cw + starParallax) % cw;
                const sy = ((i * 89 + 17) % (ch * 0.55));
                const twinkle = Math.sin(this.time * (1 + i * 0.3) + i) * 0.5 + 0.5;
                ctx.globalAlpha = (0.15 + twinkle * 0.35) * starAlpha;

                // Bright stars get cross-shaped glints
                if (i < starCount * 0.2) {
                    ctx.fillStyle = '#ffffee';
                    const gs = 1 + twinkle * 1.5;
                    ctx.fillRect(sx - gs, sy - 0.3, gs * 2, 0.6);
                    ctx.fillRect(sx - 0.3, sy - gs, 0.6, gs * 2);
                }

                ctx.fillStyle = i % 7 === 0 ? '#aaddff' : (i % 5 === 0 ? '#ffddaa' : '#ffffee');
                ctx.beginPath();
                ctx.arc(sx, sy, 0.6 + twinkle * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // === DISTANT MAKO GLOW (FF7 signature - faint green glow on horizon) ===
        if (isNight || isDusk) {
            const makoGlow = ctx.createRadialGradient(cw * 0.3, ch * 0.7, 0, cw * 0.3, ch * 0.7, cw * 0.25);
            const glowA = isNight ? 0.04 : 0.02;
            makoGlow.addColorStop(0, `rgba(0,255,136,${glowA})`);
            makoGlow.addColorStop(1, 'rgba(0,255,136,0)');
            ctx.fillStyle = makoGlow;
            ctx.fillRect(0, ch * 0.5, cw, ch * 0.5);
        }
    }

    // === TILE RENDERING ===

    _renderTile(ctx, col, row, ts) {
        const idx = row * this.mapW + col;
        const tile = this.tiles[idx];
        const px = col * ts;
        const py = row * ts;

        // Helper: pick a deterministic variant index from the texture array
        const pickVariant = (arr) => arr[(col * 7 + row * 13) % arr.length];

        switch (tile) {
            case TILE.GRASS: {
                // Draw cached static base
                ctx.drawImage(pickVariant(this._tileTextures.grass), px, py, ts, ts);
                // Animated overlays: grass blade sway, wildflower shimmer, dew sparkle
                this._drawGrassAnimOverlay(ctx, px, py, ts, col, row, false);
                break;
            }
            case TILE.DARK_GRASS: {
                ctx.drawImage(pickVariant(this._tileTextures.darkGrass), px, py, ts, ts);
                // Animated overlays (dark variant)
                this._drawGrassAnimOverlay(ctx, px, py, ts, col, row, true);
                break;
            }
            case TILE.PATH:
                ctx.drawImage(pickVariant(this._tileTextures.path), px, py, ts, ts);
                // Path edge-shadow detection is static per-frame but cheap; keep it
                this._drawPathEdges(ctx, px, py, ts, col, row);
                break;
            case TILE.WATER: {
                // Use cached water animation frames for the base, overlay dynamic effects
                const waterFrameIdx = Math.floor((this._waterOffset * 2 + col * 0.3 + row * 0.5) % 8);
                const waterFrame = this._tileTextures.water[((waterFrameIdx % 8) + 8) % 8];
                ctx.drawImage(waterFrame, px, py, ts, ts);
                // Animated overlays: caustics, shimmer, ripples, edge foam
                this._drawWaterAnimOverlay(ctx, px, py, ts, col, row);
                break;
            }
            case TILE.WALL:
                ctx.drawImage(pickVariant(this._tileTextures.wall), px, py, ts, ts);
                // Moss growth depends on neighbour tiles - draw on top of cached base
                this._drawWallMoss(ctx, px, py, ts, col, row);
                break;
            case TILE.FLOOR:
                ctx.drawImage(pickVariant(this._tileTextures.floor), px, py, ts, ts);
                break;
            case TILE.FENCE:
                // Cached fence tile (includes grass base + fence slats)
                ctx.drawImage(pickVariant(this._tileTextures.fence), px, py, ts, ts);
                // Animated grass overlay visible through fence gaps
                this._drawGrassAnimOverlay(ctx, px, py, ts, col, row, false);
                break;
            case TILE.BRIDGE:
                ctx.drawImage(pickVariant(this._tileTextures.bridge), px, py, ts, ts);
                break;
            case TILE.FLOWERS:
                // Cached flower tile (includes grass base + pixel-art flowers)
                ctx.drawImage(pickVariant(this._tileTextures.flowers), px, py, ts, ts);
                // Animated grass overlay on top
                this._drawGrassAnimOverlay(ctx, px, py, ts, col, row, false);
                break;
            case TILE.SAND:
                ctx.drawImage(pickVariant(this._tileTextures.sand), px, py, ts, ts);
                break;
            case TILE.ROOF:
                ctx.drawImage(pickVariant(this._tileTextures.roof), px, py, ts, ts);
                break;
            case TILE.DOOR:
                ctx.drawImage(pickVariant(this._tileTextures.door), px, py, ts, ts);
                break;
            case TILE.STONE:
                ctx.drawImage(pickVariant(this._tileTextures.stone), px, py, ts, ts);
                break;
        }
    }

    // Animated grass overlay: wind-swayed blades, wildflower shimmer, dew sparkle.
    // Separated from _drawGrass() so it can be layered on top of cached textures.
    _drawGrassAnimOverlay(ctx, x, y, ts, col, row, dark) {
        const seed  = (col * 7  + row * 13) % 17;
        const seed2 = (col * 31 + row * 47) % 23;

        // Animated grass blades with wind sway
        const windPhase = this.time * 1.5 + col * 0.7 + row * 0.5;
        const windSway  = Math.sin(windPhase) * ts * 0.03;
        const bladeColor1 = dark ? 'rgba(25,90,12,0.6)'  : 'rgba(70,170,35,0.45)';
        const bladeColor2 = dark ? 'rgba(40,100,20,0.5)' : 'rgba(90,200,50,0.35)';

        ctx.strokeStyle = bladeColor1;
        ctx.lineWidth   = 0.8;
        ctx.lineCap     = 'round';
        for (let i = 0; i < 5; i++) {
            const bx = x + ((seed  + i * 7)  % (ts - 2)) + 1;
            const by = y + ((seed2 + i * 11) % (ts - 4)) + 4;
            const h  = ts * (0.08 + (seed + i) % 3 * 0.03);
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.quadraticCurveTo(
                bx + windSway * (1 + i * 0.2),   by - h * 0.6,
                bx + windSway * (1.5 + i * 0.15), by - h
            );
            ctx.stroke();
        }

        ctx.strokeStyle = bladeColor2;
        ctx.lineWidth   = 0.6;
        for (let i = 0; i < 3; i++) {
            const bx = x + ((seed2 + i * 9) % (ts - 2)) + 1;
            const by = y + ((seed  + i * 5) % (ts - 3)) + 3;
            const h  = ts * (0.06 + (seed2 + i) % 3 * 0.025);
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.quadraticCurveTo(
                bx + windSway * 1.2, by - h * 0.5,
                bx + windSway * 1.8, by - h
            );
            ctx.stroke();
        }

        // Small wildflower details (animated petal rotation) on some tiles
        if ((col * 13 + row * 7) % 11 < 2 && !dark) {
            const flowerColors = ['#ffeb3b', '#e8f5e9', '#fff9c4', '#f8bbd0'];
            const fc = flowerColors[(col + row) % flowerColors.length];
            const fx = x + ((seed  * 4) % (ts - 6)) + 3;
            const fy = y + ((seed2 * 2) % (ts - 6)) + 3;
            const petalR = ts * 0.025;
            ctx.fillStyle = fc;
            for (let p = 0; p < 4; p++) {
                const pa = p * Math.PI * 0.5 + this.time * 0.3;
                ctx.beginPath();
                ctx.arc(
                    fx + Math.cos(pa) * petalR * 1.2,
                    fy + Math.sin(pa) * petalR * 1.2,
                    petalR, 0, Math.PI * 2
                );
                ctx.fill();
            }
            ctx.fillStyle = '#fdd835';
            ctx.beginPath();
            ctx.arc(fx, fy, petalR * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Dew sparkle (very subtle, pulsing)
        if ((col * 3 + row * 11) % 19 === 0) {
            const sparkle = Math.sin(this.time * 2.5 + seed) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255,255,240,${sparkle * 0.25})`;
            ctx.beginPath();
            ctx.arc(x + ts * 0.6, y + ts * 0.3, ts * 0.02, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Edge-shadow pass for PATH tiles (neighbour-dependent, must run per-frame).
    _drawPathEdges(ctx, x, y, ts, col, row) {
        const above = row > 0              ? this.tiles[(row - 1) * this.mapW + col]     : -1;
        const below = row < this.mapH - 1  ? this.tiles[(row + 1) * this.mapW + col]     : -1;
        const left  = col > 0              ? this.tiles[row * this.mapW + col - 1]        : -1;
        const right = col < this.mapW - 1  ? this.tiles[row * this.mapW + col + 1]        : -1;

        ctx.fillStyle = 'rgba(40,25,10,0.25)';
        if (above !== TILE.PATH && above !== TILE.BRIDGE && above !== TILE.DOOR && above !== TILE.FLOOR) {
            ctx.fillRect(x, y, ts, 2);
        }
        if (below !== TILE.PATH && below !== TILE.BRIDGE && below !== TILE.DOOR && below !== TILE.FLOOR) {
            ctx.fillRect(x, y + ts - 2, ts, 2);
        }
        if (left  !== TILE.PATH && left  !== TILE.BRIDGE && left  !== TILE.DOOR && left  !== TILE.FLOOR) {
            ctx.fillRect(x, y, 2, ts);
        }
        if (right !== TILE.PATH && right !== TILE.BRIDGE && right !== TILE.DOOR && right !== TILE.FLOOR) {
            ctx.fillRect(x + ts - 2, y, 2, ts);
        }
    }

    // Moss-growth pass for WALL tiles (neighbour-dependent, drawn over cached base).
    _drawWallMoss(ctx, x, y, ts, col, row) {
        const seed  = (col * 17 + row * 11) % 13;
        const above = row > 0              ? this.tiles[(row - 1) * this.mapW + col]     : TILE.WALL;
        const below = row < this.mapH - 1  ? this.tiles[(row + 1) * this.mapW + col]     : TILE.WALL;
        const left  = col > 0              ? this.tiles[row * this.mapW + col - 1]        : TILE.WALL;
        const right = col < this.mapW - 1  ? this.tiles[row * this.mapW + col + 1]        : TILE.WALL;

        if (below !== TILE.WALL && below !== TILE.ROOF) {
            ctx.fillStyle = 'rgba(60,45,30,0.5)';
            ctx.fillRect(x, y + ts - 3, ts, 3);
            ctx.fillStyle = 'rgba(50,120,30,0.35)';
            for (let i = 0; i < 3; i++) {
                const mx = x + ((seed + i * 11) % (ts - 6)) + 1;
                const mh = ts * (0.06 + ((seed + i) % 3) * 0.02);
                ctx.beginPath();
                ctx.ellipse(mx + 3, y + ts - 1, ts * 0.08, mh, 0, Math.PI, 0);
                ctx.fill();
            }
        }
        if (above !== TILE.WALL && above !== TILE.ROOF) {
            ctx.fillStyle = 'rgba(45,110,25,0.3)';
            for (let i = 0; i < 2; i++) {
                const mx = x + ((seed * 3 + i * 13) % (ts - 4));
                ctx.beginPath();
                ctx.ellipse(mx + 2, y + 2, ts * 0.06, ts * 0.04, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        if (left !== TILE.WALL && left !== TILE.ROOF) {
            ctx.fillStyle = 'rgba(45,110,25,0.25)';
            ctx.beginPath();
            ctx.ellipse(x + 2, y + ts * 0.7, ts * 0.04, ts * 0.12, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        if (right !== TILE.WALL && right !== TILE.ROOF) {
            ctx.fillStyle = 'rgba(45,110,25,0.25)';
            ctx.beginPath();
            ctx.ellipse(x + ts - 2, y + ts * 0.6, ts * 0.04, ts * 0.1, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Animated water overlay: caustics, shimmer highlights, ripple rings, and edge foam.
    // Drawn over the cached water base frames for dynamic visual richness.
    _drawWaterAnimOverlay(ctx, x, y, ts, col, row) {
        const wave1 = Math.sin(this._waterOffset * 3 + col * 0.8 + row * 0.6);
        const wave2 = Math.sin(this._waterOffset * 2.2 + col * 1.1 - row * 0.4);
        const wave3 = Math.cos(this._waterOffset * 1.7 + col * 0.5 + row * 0.9);

        // Caustic light pattern
        ctx.fillStyle = `rgba(100,200,255,${0.06 + wave3 * 0.03})`;
        const caustX = x + ts * 0.2 + Math.sin(this._waterOffset * 1.3 + col * 2) * ts * 0.15;
        const caustY = y + ts * 0.3 + Math.cos(this._waterOffset * 1.1 + row * 2) * ts * 0.15;
        ctx.beginPath();
        ctx.ellipse(caustX, caustY, ts * 0.18, ts * 0.1, wave1 * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Surface shimmer highlights
        const shimmer1 = 0.08 + wave1 * 0.06;
        const shimmer2 = 0.06 + wave2 * 0.05;
        ctx.fillStyle = `rgba(255,255,255,${shimmer1})`;
        const sx1 = x + ts * 0.15 + Math.sin(this._waterOffset * 2 + col) * ts * 0.15;
        const sy1 = y + ts * 0.3 + Math.cos(this._waterOffset * 1.5 + row) * ts * 0.1;
        ctx.fillRect(sx1, sy1, ts * 0.2, ts * 0.04);

        ctx.fillStyle = `rgba(200,240,255,${shimmer2})`;
        const sx2 = x + ts * 0.55 + Math.sin(this._waterOffset * 1.8 + col + 1) * ts * 0.1;
        const sy2 = y + ts * 0.6 + Math.cos(this._waterOffset * 1.2 + row + 1) * ts * 0.1;
        ctx.fillRect(sx2, sy2, ts * 0.15, ts * 0.03);

        // Small shimmer dot
        ctx.fillStyle = `rgba(255,255,255,${0.15 + wave3 * 0.1})`;
        ctx.beginPath();
        ctx.arc(
            x + ts * 0.7 + Math.sin(this._waterOffset * 2.5 + col * 0.7) * ts * 0.08,
            y + ts * 0.2 + Math.cos(this._waterOffset * 2 + row * 0.5) * ts * 0.08,
            ts * 0.02, 0, Math.PI * 2
        );
        ctx.fill();

        // Ripple rings
        if ((col * 7 + row * 3) % 9 < 2) {
            const ripplePhase = this._waterOffset * 1.5 + col * 2 + row;
            const rippleAlpha = (Math.sin(ripplePhase) * 0.5 + 0.5) * 0.12;
            const rippleR = ts * 0.1 + (ripplePhase % (Math.PI * 2)) / (Math.PI * 2) * ts * 0.2;
            ctx.strokeStyle = `rgba(200,230,255,${rippleAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(x + ts * 0.5, y + ts * 0.5, rippleR, 0, Math.PI * 2);
            ctx.stroke();
            if (rippleR > ts * 0.08) {
                ctx.strokeStyle = `rgba(200,230,255,${rippleAlpha * 0.6})`;
                ctx.beginPath();
                ctx.arc(x + ts * 0.5, y + ts * 0.5, rippleR * 0.6, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Edge foam where water meets land
        const above = row > 0 ? this.tiles[(row - 1) * this.mapW + col] : TILE.WATER;
        const below = row < this.mapH - 1 ? this.tiles[(row + 1) * this.mapW + col] : TILE.WATER;
        const left = col > 0 ? this.tiles[row * this.mapW + col - 1] : TILE.WATER;
        const right = col < this.mapW - 1 ? this.tiles[row * this.mapW + col + 1] : TILE.WATER;

        const foamWave = Math.sin(this._waterOffset * 4 + col + row) * 0.1;
        if (above !== TILE.WATER) {
            const foamAlpha = 0.3 + foamWave;
            ctx.fillStyle = `rgba(210,235,255,${foamAlpha})`;
            const foamH = ts * 0.1 + Math.sin(this._waterOffset * 3 + col * 1.5) * ts * 0.03;
            ctx.fillRect(x, y, ts, foamH);
            ctx.fillStyle = `rgba(255,255,255,${foamAlpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(x + ts * 0.3 + Math.sin(this._waterOffset + col) * 3, y + foamH * 0.5, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + ts * 0.7 + Math.cos(this._waterOffset + col) * 2, y + foamH * 0.7, 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
        if (below !== TILE.WATER) {
            ctx.fillStyle = `rgba(210,235,255,${0.2 + foamWave})`;
            ctx.fillRect(x, y + ts - ts * 0.08, ts, ts * 0.08);
        }
        if (left !== TILE.WATER) {
            ctx.fillStyle = `rgba(210,235,255,${0.2 + foamWave})`;
            ctx.fillRect(x, y, ts * 0.08, ts);
        }
        if (right !== TILE.WATER) {
            ctx.fillStyle = `rgba(210,235,255,${0.2 + foamWave})`;
            ctx.fillRect(x + ts - ts * 0.08, y, ts * 0.08, ts);
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
        // Dynamic animated water with depth and reflections
        const wave1 = Math.sin(this._waterOffset * 3 + col * 0.8 + row * 0.6);
        const wave2 = Math.sin(this._waterOffset * 2.2 + col * 1.1 - row * 0.4);
        const wave3 = Math.cos(this._waterOffset * 1.7 + col * 0.5 + row * 0.9);

        // Deep water base with gradient
        const deepR = 20 + wave1 * 8;
        const deepG = 70 + wave1 * 12 + wave2 * 5;
        const deepB = 170 + wave1 * 15 + wave2 * 10;
        const surfR = 40 + wave2 * 10;
        const surfG = 110 + wave2 * 15;
        const surfB = 210 + wave2 * 20;

        const grad = ctx.createLinearGradient(x, y, x + ts, y + ts);
        grad.addColorStop(0, `rgb(${Math.round(deepR)},${Math.round(deepG)},${Math.round(deepB)})`);
        grad.addColorStop(0.5, `rgb(${Math.round(surfR)},${Math.round(surfG)},${Math.round(surfB)})`);
        grad.addColorStop(1, `rgb(${Math.round(deepR + 5)},${Math.round(deepG + 8)},${Math.round(deepB + 5)})`);
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, ts, ts);

        // Caustic light patterns (underwater light refraction)
        ctx.fillStyle = `rgba(100,200,255,${0.06 + wave3 * 0.03})`;
        const caustX = x + ts * 0.2 + Math.sin(this._waterOffset * 1.3 + col * 2) * ts * 0.15;
        const caustY = y + ts * 0.3 + Math.cos(this._waterOffset * 1.1 + row * 2) * ts * 0.15;
        ctx.beginPath();
        ctx.ellipse(caustX, caustY, ts * 0.18, ts * 0.1, wave1 * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Surface shimmer highlights - elongated streaks
        const shimmer1 = 0.08 + wave1 * 0.06;
        const shimmer2 = 0.06 + wave2 * 0.05;
        ctx.fillStyle = `rgba(255,255,255,${shimmer1})`;
        const sx1 = x + ts * 0.15 + Math.sin(this._waterOffset * 2 + col) * ts * 0.15;
        const sy1 = y + ts * 0.3 + Math.cos(this._waterOffset * 1.5 + row) * ts * 0.1;
        ctx.fillRect(sx1, sy1, ts * 0.2, ts * 0.04);

        ctx.fillStyle = `rgba(200,240,255,${shimmer2})`;
        const sx2 = x + ts * 0.55 + Math.sin(this._waterOffset * 1.8 + col + 1) * ts * 0.1;
        const sy2 = y + ts * 0.6 + Math.cos(this._waterOffset * 1.2 + row + 1) * ts * 0.1;
        ctx.fillRect(sx2, sy2, ts * 0.15, ts * 0.03);

        // Small shimmer dot
        ctx.fillStyle = `rgba(255,255,255,${0.15 + wave3 * 0.1})`;
        ctx.beginPath();
        ctx.arc(
            x + ts * 0.7 + Math.sin(this._waterOffset * 2.5 + col * 0.7) * ts * 0.08,
            y + ts * 0.2 + Math.cos(this._waterOffset * 2 + row * 0.5) * ts * 0.08,
            ts * 0.02, 0, Math.PI * 2
        );
        ctx.fill();

        // Ripple rings (concentric circles that pulse)
        if ((col * 7 + row * 3) % 9 < 2) {
            const ripplePhase = this._waterOffset * 1.5 + col * 2 + row;
            const rippleAlpha = (Math.sin(ripplePhase) * 0.5 + 0.5) * 0.12;
            const rippleR = ts * 0.1 + (ripplePhase % (Math.PI * 2)) / (Math.PI * 2) * ts * 0.2;
            ctx.strokeStyle = `rgba(200,230,255,${rippleAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(x + ts * 0.5, y + ts * 0.5, rippleR, 0, Math.PI * 2);
            ctx.stroke();
            // Inner ring
            if (rippleR > ts * 0.08) {
                ctx.strokeStyle = `rgba(200,230,255,${rippleAlpha * 0.6})`;
                ctx.beginPath();
                ctx.arc(x + ts * 0.5, y + ts * 0.5, rippleR * 0.6, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Edge foam where water meets land (all edges)
        const above = row > 0 ? this.tiles[(row - 1) * this.mapW + col] : TILE.WATER;
        const below = row < this.mapH - 1 ? this.tiles[(row + 1) * this.mapW + col] : TILE.WATER;
        const left = col > 0 ? this.tiles[row * this.mapW + col - 1] : TILE.WATER;
        const right = col < this.mapW - 1 ? this.tiles[row * this.mapW + col + 1] : TILE.WATER;

        const foamWave = Math.sin(this._waterOffset * 4 + col + row) * 0.1;
        if (above !== TILE.WATER) {
            const foamAlpha = 0.3 + foamWave;
            ctx.fillStyle = `rgba(210,235,255,${foamAlpha})`;
            const foamH = ts * 0.1 + Math.sin(this._waterOffset * 3 + col * 1.5) * ts * 0.03;
            ctx.fillRect(x, y, ts, foamH);
            // Foam bubbles
            ctx.fillStyle = `rgba(255,255,255,${foamAlpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(x + ts * 0.3 + Math.sin(this._waterOffset + col) * 3, y + foamH * 0.5, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + ts * 0.7 + Math.cos(this._waterOffset + col) * 2, y + foamH * 0.7, 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
        if (below !== TILE.WATER) {
            ctx.fillStyle = `rgba(210,235,255,${0.2 + foamWave})`;
            ctx.fillRect(x, y + ts - ts * 0.08, ts, ts * 0.08);
        }
        if (left !== TILE.WATER) {
            ctx.fillStyle = `rgba(210,235,255,${0.2 + foamWave})`;
            ctx.fillRect(x, y, ts * 0.08, ts);
        }
        if (right !== TILE.WATER) {
            ctx.fillStyle = `rgba(210,235,255,${0.2 + foamWave})`;
            ctx.fillRect(x + ts - ts * 0.08, y, ts * 0.08, ts);
        }
    }

    _drawWall(ctx, x, y, ts, col, row) {
        // Detailed stone/brick wall with FF7-style texture
        const seed = (col * 17 + row * 11) % 13;

        // Base wall color with slight variation per tile
        const baseR = 100 + (seed % 5) * 3;
        const baseG = 78 + (seed % 4) * 3;
        const baseB = 58 + (seed % 3) * 3;
        ctx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
        ctx.fillRect(x, y, ts, ts);

        // Brick pattern with individual brick colors
        const brickH = ts / 4;
        const brickW = ts / 2;
        const brickColors = [
            `rgb(${baseR + 8},${baseG + 6},${baseB + 4})`,
            `rgb(${baseR - 5},${baseG - 4},${baseB - 3})`,
            `rgb(${baseR + 3},${baseG + 2},${baseB + 5})`,
            `rgb(${baseR - 8},${baseG - 6},${baseB - 2})`,
        ];

        for (let by = 0; by < 4; by++) {
            const offset = (by % 2) * brickW * 0.5;
            for (let bx = -1; bx < 3; bx++) {
                const brickX = x + bx * brickW + offset;
                const brickY = y + by * brickH;
                const ci = ((by * 3 + bx + seed) % brickColors.length + brickColors.length) % brickColors.length;

                // Individual brick fill
                ctx.fillStyle = brickColors[ci];
                ctx.fillRect(brickX + 0.5, brickY + 0.5, brickW - 1, brickH - 1);

                // Brick highlight (top edge)
                ctx.fillStyle = 'rgba(180,160,140,0.15)';
                ctx.fillRect(brickX + 1, brickY + 0.5, brickW - 2, 1);

                // Brick shadow (bottom edge)
                ctx.fillStyle = 'rgba(30,20,10,0.15)';
                ctx.fillRect(brickX + 1, brickY + brickH - 1.5, brickW - 2, 1);
            }
        }

        // Mortar lines
        ctx.strokeStyle = 'rgba(35,25,15,0.45)';
        ctx.lineWidth = 0.8;
        for (let by = 0; by < 4; by++) {
            const offset = (by % 2) * brickW * 0.5;
            for (let bx = -1; bx < 3; bx++) {
                ctx.strokeRect(x + bx * brickW + offset, y + by * brickH, brickW, brickH);
            }
        }

        // Weathering/aging marks
        if (seed % 5 === 0) {
            ctx.fillStyle = 'rgba(40,30,20,0.12)';
            ctx.beginPath();
            ctx.ellipse(x + ts * 0.6, y + ts * 0.7, ts * 0.15, ts * 0.08, 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Moss growth at edges - check adjacent tiles
        const above = row > 0 ? this.tiles[(row - 1) * this.mapW + col] : TILE.WALL;
        const below = row < this.mapH - 1 ? this.tiles[(row + 1) * this.mapW + col] : TILE.WALL;
        const left = col > 0 ? this.tiles[row * this.mapW + col - 1] : TILE.WALL;
        const right = col < this.mapW - 1 ? this.tiles[row * this.mapW + col + 1] : TILE.WALL;

        // Moss at base where wall meets ground
        if (below !== TILE.WALL && below !== TILE.ROOF) {
            // Bottom edge shadow
            ctx.fillStyle = 'rgba(60,45,30,0.5)';
            ctx.fillRect(x, y + ts - 3, ts, 3);

            // Moss patches at base
            ctx.fillStyle = 'rgba(50,120,30,0.35)';
            for (let i = 0; i < 3; i++) {
                const mx = x + ((seed + i * 11) % (ts - 6)) + 1;
                const mh = ts * (0.06 + ((seed + i) % 3) * 0.02);
                ctx.beginPath();
                ctx.ellipse(mx + 3, y + ts - 1, ts * 0.08, mh, 0, Math.PI, 0);
                ctx.fill();
            }
        }

        // Moss at top edge
        if (above !== TILE.WALL && above !== TILE.ROOF) {
            ctx.fillStyle = 'rgba(45,110,25,0.3)';
            for (let i = 0; i < 2; i++) {
                const mx = x + ((seed * 3 + i * 13) % (ts - 4));
                ctx.beginPath();
                ctx.ellipse(mx + 2, y + 2, ts * 0.06, ts * 0.04, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Moss along side edges
        if (left !== TILE.WALL && left !== TILE.ROOF) {
            ctx.fillStyle = 'rgba(45,110,25,0.25)';
            ctx.beginPath();
            ctx.ellipse(x + 2, y + ts * 0.7, ts * 0.04, ts * 0.12, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        if (right !== TILE.WALL && right !== TILE.ROOF) {
            ctx.fillStyle = 'rgba(45,110,25,0.25)';
            ctx.beginPath();
            ctx.ellipse(x + ts - 2, y + ts * 0.6, ts * 0.04, ts * 0.1, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Corner crack detail
        if (seed % 4 === 0) {
            ctx.strokeStyle = 'rgba(30,20,10,0.2)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(x + ts * 0.3, y + ts * 0.2);
            ctx.lineTo(x + ts * 0.35, y + ts * 0.35);
            ctx.lineTo(x + ts * 0.32, y + ts * 0.45);
            ctx.stroke();
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

    // === PROCEDURAL TILE TEXTURE CACHE ===

    _buildTileCache() {
        this._tileTextures = {};
        const ts = this.ts;
        const types = ['grass', 'path', 'water', 'wall', 'floor', 'fence', 'bridge', 'flowers', 'sand', 'darkGrass', 'roof', 'door', 'stone'];
        for (const type of types) {
            this._tileTextures[type] = [];
            const variantCount = (type === 'water') ? 8 : 4;
            for (let v = 0; v < variantCount; v++) {
                const canvas = document.createElement('canvas');
                canvas.width = ts;
                canvas.height = ts;
                const tCtx = canvas.getContext('2d');
                tCtx.imageSmoothingEnabled = false;
                this['_genTile_' + type](tCtx, ts, v);
                this._tileTextures[type].push(canvas);
            }
        }

        // Also build the noise overlay texture for FF7 "painted" grain
        if (typeof this._buildNoiseTexture === 'function') {
            this._buildNoiseTexture();
        }
    }

    // 2x2 Bayer dithering for retro pixel-art look
    _dither(ctx, x, y, r1, g1, b1, r2, g2, b2, threshold) {
        const bayerMatrix = [[0, 2], [3, 1]];
        const bayerValue = bayerMatrix[y % 2][x % 2] / 4;
        if (bayerValue < threshold) {
            ctx.fillStyle = `rgb(${r1},${g1},${b1})`;
        } else {
            ctx.fillStyle = `rgb(${r2},${g2},${b2})`;
        }
        ctx.fillRect(x, y, 1, 1);
    }

    // Seeded pseudo-random for deterministic tile generation
    _tileSeed(v, x, y) {
        let h = (v * 374761 + x * 668265 + y * 982451) & 0x7fffffff;
        h = ((h >> 16) ^ h) * 0x45d9f3b;
        h = ((h >> 16) ^ h) * 0x45d9f3b;
        h = (h >> 16) ^ h;
        return (h & 0x7fffffff) / 0x7fffffff;
    }

    // --- GRASS tile generator ---
    _genTile_grass(ctx, ts, variant) {
        const palettes = [
            { base: [58, 122, 30], mid: [50, 110, 25], dark: [38, 85, 18], light: [72, 145, 38], highlight: [85, 165, 48] },
            { base: [52, 115, 28], mid: [45, 105, 22], dark: [35, 80, 16], light: [68, 138, 35], highlight: [80, 158, 45] },
            { base: [55, 118, 32], mid: [48, 108, 26], dark: [40, 88, 20], light: [70, 142, 40], highlight: [82, 160, 50] },
            { base: [60, 125, 34], mid: [53, 112, 28], dark: [42, 90, 22], light: [75, 148, 42], highlight: [88, 168, 52] },
        ];
        const pal = palettes[variant];

        // Fill base with dithered multi-tone pattern
        for (let y = 0; y < ts; y++) {
            for (let x = 0; x < ts; x++) {
                const noise = this._tileSeed(variant, x * 3, y * 5);
                const noise2 = this._tileSeed(variant + 7, x * 7 + 3, y * 11 + 5);
                const gradFactor = (x + y) / (ts * 2);
                const threshold = 0.4 + gradFactor * 0.3 + noise * 0.2;

                if (noise2 < 0.08) {
                    ctx.fillStyle = `rgb(${pal.dark[0]},${pal.dark[1]},${pal.dark[2]})`;
                    ctx.fillRect(x, y, 1, 1);
                } else if (noise2 > 0.92) {
                    ctx.fillStyle = `rgb(${pal.highlight[0]},${pal.highlight[1]},${pal.highlight[2]})`;
                    ctx.fillRect(x, y, 1, 1);
                } else {
                    this._dither(ctx, x, y,
                        pal.base[0], pal.base[1], pal.base[2],
                        pal.mid[0], pal.mid[1], pal.mid[2],
                        threshold
                    );
                }
            }
        }

        // Grass blade clumps
        const clumpCount = 6 + variant;
        for (let i = 0; i < clumpCount; i++) {
            const cx = Math.floor(this._tileSeed(variant, i * 17, 100) * (ts - 2)) + 1;
            const cy = Math.floor(this._tileSeed(variant, i * 23, 200) * (ts - 6)) + 4;
            const bladeH = 2 + Math.floor(this._tileSeed(variant, i * 31, 300) * 3);
            const isLight = this._tileSeed(variant, i * 41, 400) > 0.5;
            const col = isLight ? pal.light : pal.dark;
            ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
            ctx.fillRect(cx, cy - bladeH, 1, bladeH);
            if (bladeH > 2) {
                const tipDir = this._tileSeed(variant, i * 53, 500) > 0.5 ? 1 : -1;
                if (cx + tipDir >= 0 && cx + tipDir < ts) {
                    ctx.fillRect(cx + tipDir, cy - bladeH - 1, 1, 1);
                }
            }
        }

        // Tiny stones
        const stoneCount = Math.floor(this._tileSeed(variant, 999, 999) * 2);
        for (let i = 0; i < stoneCount; i++) {
            const sx = Math.floor(this._tileSeed(variant, i * 67, 600) * (ts - 3)) + 1;
            const sy = Math.floor(this._tileSeed(variant, i * 71, 700) * (ts - 3)) + 1;
            ctx.fillStyle = `rgb(${110 + Math.floor(this._tileSeed(variant, i, 800) * 30)},${100 + Math.floor(this._tileSeed(variant, i, 801) * 25)},${85 + Math.floor(this._tileSeed(variant, i, 802) * 20)})`;
            ctx.fillRect(sx, sy, 2, 1);
        }

        // Edge shadow for ambient occlusion
        for (let x = 0; x < ts; x++) {
            const a = 0.06 + this._tileSeed(variant, x, 900) * 0.04;
            ctx.fillStyle = `rgba(20,40,10,${a})`;
            ctx.fillRect(x, ts - 1, 1, 1);
        }
        for (let y = 0; y < ts; y++) {
            const a = 0.04 + this._tileSeed(variant, 901, y) * 0.03;
            ctx.fillStyle = `rgba(20,40,10,${a})`;
            ctx.fillRect(ts - 1, y, 1, 1);
        }
    }

    // --- DARK GRASS tile generator ---
    _genTile_darkGrass(ctx, ts, variant) {
        const palettes = [
            { base: [38, 72, 18], mid: [32, 62, 14], dark: [22, 48, 10], light: [48, 88, 24], highlight: [55, 100, 28] },
            { base: [35, 68, 16], mid: [28, 58, 12], dark: [20, 44, 8], light: [45, 82, 22], highlight: [52, 95, 26] },
            { base: [40, 75, 20], mid: [34, 65, 16], dark: [24, 50, 12], light: [50, 90, 26], highlight: [58, 105, 30] },
            { base: [36, 70, 17], mid: [30, 60, 13], dark: [21, 46, 9], light: [46, 85, 23], highlight: [54, 98, 27] },
        ];
        const pal = palettes[variant];

        for (let y = 0; y < ts; y++) {
            for (let x = 0; x < ts; x++) {
                const noise = this._tileSeed(variant + 50, x * 3, y * 5);
                const noise2 = this._tileSeed(variant + 57, x * 7 + 3, y * 11 + 5);
                const gradFactor = (x + y) / (ts * 2);
                const threshold = 0.35 + gradFactor * 0.35 + noise * 0.2;

                if (noise2 < 0.12) {
                    ctx.fillStyle = `rgb(${pal.dark[0]},${pal.dark[1]},${pal.dark[2]})`;
                    ctx.fillRect(x, y, 1, 1);
                } else if (noise2 > 0.94) {
                    ctx.fillStyle = `rgb(${pal.highlight[0]},${pal.highlight[1]},${pal.highlight[2]})`;
                    ctx.fillRect(x, y, 1, 1);
                } else {
                    this._dither(ctx, x, y,
                        pal.base[0], pal.base[1], pal.base[2],
                        pal.dark[0], pal.dark[1], pal.dark[2],
                        threshold
                    );
                }
            }
        }

        // Thicker, wilder grass blades
        const clumpCount = 8 + variant;
        for (let i = 0; i < clumpCount; i++) {
            const cx = Math.floor(this._tileSeed(variant + 50, i * 17, 100) * (ts - 2)) + 1;
            const cy = Math.floor(this._tileSeed(variant + 50, i * 23, 200) * (ts - 7)) + 5;
            const bladeH = 3 + Math.floor(this._tileSeed(variant + 50, i * 31, 300) * 4);
            const isLight = this._tileSeed(variant + 50, i * 41, 400) > 0.6;
            const col = isLight ? pal.light : pal.dark;
            ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
            ctx.fillRect(cx, cy - bladeH, 1, bladeH);
            if (this._tileSeed(variant + 50, i * 47, 450) > 0.4 && cx + 1 < ts) {
                ctx.fillRect(cx + 1, cy - bladeH + 1, 1, bladeH - 2);
            }
            const tipDir = this._tileSeed(variant + 50, i * 53, 500) > 0.5 ? 1 : -1;
            if (cx + tipDir >= 0 && cx + tipDir < ts && cy - bladeH - 1 >= 0) {
                ctx.fillRect(cx + tipDir, cy - bladeH - 1, 1, 1);
            }
        }

        // Shadow patches
        for (let i = 0; i < 3; i++) {
            const sx = Math.floor(this._tileSeed(variant + 50, i * 89, 650) * (ts - 6)) + 2;
            const sy = Math.floor(this._tileSeed(variant + 50, i * 97, 660) * (ts - 4)) + 2;
            const sw = 2 + Math.floor(this._tileSeed(variant + 50, i * 83, 670) * 4);
            const sh = 1 + Math.floor(this._tileSeed(variant + 50, i * 79, 680) * 2);
            ctx.fillStyle = 'rgba(15,30,8,0.25)';
            ctx.fillRect(sx, sy, sw, sh);
        }

        // Edge AO
        for (let x = 0; x < ts; x++) {
            ctx.fillStyle = `rgba(10,20,5,${0.08 + this._tileSeed(variant + 50, x, 900) * 0.05})`;
            ctx.fillRect(x, ts - 1, 1, 1);
        }
        for (let y = 0; y < ts; y++) {
            ctx.fillStyle = `rgba(10,20,5,${0.06 + this._tileSeed(variant + 50, 901, y) * 0.04})`;
            ctx.fillRect(ts - 1, y, 1, 1);
        }
    }

    // --- PATH/COBBLESTONE tile generator ---
    _genTile_path(ctx, ts, variant) {
        const mortarColor = [90, 72, 52];

        // Fill mortar base
        for (let y = 0; y < ts; y++) {
            for (let x = 0; x < ts; x++) {
                const noise = this._tileSeed(variant + 100, x * 5, y * 7);
                this._dither(ctx, x, y,
                    mortarColor[0] - 5, mortarColor[1] - 5, mortarColor[2] - 5,
                    mortarColor[0] + 8, mortarColor[1] + 6, mortarColor[2] + 4,
                    0.5 + noise * 0.2
                );
            }
        }

        // Cobblestone layouts per variant
        const stoneLayouts = [
            [
                { x: 1, y: 1, w: 9, h: 7 }, { x: 11, y: 1, w: 10, h: 7 }, { x: 22, y: 1, w: 9, h: 7 },
                { x: 1, y: 9, w: 7, h: 7 }, { x: 9, y: 9, w: 10, h: 7 }, { x: 20, y: 9, w: 11, h: 7 },
                { x: 1, y: 17, w: 10, h: 7 }, { x: 12, y: 17, w: 8, h: 7 }, { x: 21, y: 17, w: 10, h: 7 },
                { x: 1, y: 25, w: 8, h: 6 }, { x: 10, y: 25, w: 11, h: 6 }, { x: 22, y: 25, w: 9, h: 6 },
            ],
            [
                { x: 1, y: 1, w: 14, h: 7 }, { x: 16, y: 1, w: 15, h: 7 },
                { x: 1, y: 9, w: 8, h: 7 }, { x: 10, y: 9, w: 12, h: 7 }, { x: 23, y: 9, w: 8, h: 7 },
                { x: 1, y: 17, w: 15, h: 7 }, { x: 17, y: 17, w: 14, h: 7 },
                { x: 1, y: 25, w: 10, h: 6 }, { x: 12, y: 25, w: 10, h: 6 }, { x: 23, y: 25, w: 8, h: 6 },
            ],
            [
                { x: 1, y: 1, w: 10, h: 9 }, { x: 12, y: 1, w: 8, h: 6 }, { x: 21, y: 1, w: 10, h: 9 },
                { x: 12, y: 8, w: 8, h: 8 },
                { x: 1, y: 11, w: 10, h: 6 }, { x: 21, y: 11, w: 10, h: 6 },
                { x: 1, y: 18, w: 8, h: 7 }, { x: 10, y: 17, w: 12, h: 8 }, { x: 23, y: 18, w: 8, h: 7 },
                { x: 1, y: 26, w: 14, h: 5 }, { x: 16, y: 26, w: 15, h: 5 },
            ],
            [
                { x: 1, y: 1, w: 7, h: 8 }, { x: 9, y: 1, w: 12, h: 6 }, { x: 22, y: 1, w: 9, h: 8 },
                { x: 9, y: 8, w: 6, h: 8 }, { x: 16, y: 7, w: 5, h: 5 },
                { x: 1, y: 10, w: 7, h: 7 }, { x: 16, y: 13, w: 7, h: 7 }, { x: 24, y: 10, w: 7, h: 7 },
                { x: 1, y: 18, w: 10, h: 6 }, { x: 12, y: 17, w: 9, h: 8 }, { x: 22, y: 18, w: 9, h: 6 },
                { x: 1, y: 25, w: 8, h: 6 }, { x: 10, y: 26, w: 11, h: 5 }, { x: 22, y: 25, w: 9, h: 6 },
            ],
        ];

        const stones = stoneLayouts[variant % stoneLayouts.length];
        const stoneBaseColors = [
            [148, 128, 100], [156, 135, 108], [140, 120, 95],
            [160, 140, 112], [145, 125, 98], [152, 132, 105],
        ];

        for (let si = 0; si < stones.length; si++) {
            const s = stones[si];
            const baseCol = stoneBaseColors[(si + variant * 3) % stoneBaseColors.length];

            // Fill stone body with dithered texture
            for (let y = s.y; y < Math.min(s.y + s.h, ts); y++) {
                for (let x = s.x; x < Math.min(s.x + s.w, ts); x++) {
                    const n = this._tileSeed(variant + 100, x * 13 + si, y * 17 + si);
                    const bv = Math.floor(n * 12) - 6;
                    this._dither(ctx, x, y,
                        baseCol[0] + bv, baseCol[1] + bv, baseCol[2] + bv,
                        baseCol[0] - 4 + bv, baseCol[1] - 4 + bv, baseCol[2] - 3 + bv,
                        0.5 + n * 0.15
                    );
                }
            }

            // Top edge highlight
            for (let x = s.x + 1; x < Math.min(s.x + s.w - 1, ts); x++) {
                if (s.y < ts) {
                    const ha = 0.15 + this._tileSeed(variant + 100, x + si * 10, 1000) * 0.1;
                    ctx.fillStyle = `rgba(220,200,175,${ha})`;
                    ctx.fillRect(x, s.y, 1, 1);
                }
            }
            // Left edge highlight
            for (let y = s.y + 1; y < Math.min(s.y + s.h - 1, ts); y++) {
                if (s.x < ts) {
                    const ha = 0.08 + this._tileSeed(variant + 100, 1001 + si * 10, y) * 0.08;
                    ctx.fillStyle = `rgba(210,190,165,${ha})`;
                    ctx.fillRect(s.x, y, 1, 1);
                }
            }

            // Bottom edge shadow
            const bottomY = Math.min(s.y + s.h - 1, ts - 1);
            for (let x = s.x; x < Math.min(s.x + s.w, ts); x++) {
                const sa = 0.18 + this._tileSeed(variant + 100, x + si * 10, 1002) * 0.12;
                ctx.fillStyle = `rgba(40,30,20,${sa})`;
                ctx.fillRect(x, bottomY, 1, 1);
            }
            // Right edge shadow
            const rightX = Math.min(s.x + s.w - 1, ts - 1);
            for (let y = s.y; y < Math.min(s.y + s.h, ts); y++) {
                const sa = 0.12 + this._tileSeed(variant + 100, 1003 + si * 10, y) * 0.1;
                ctx.fillStyle = `rgba(40,30,20,${sa})`;
                ctx.fillRect(rightX, y, 1, 1);
            }

            // Occasional crack
            if (this._tileSeed(variant + 100, si * 37, 1100) > 0.7) {
                const crackStartX = s.x + Math.floor(s.w * 0.3);
                const crackStartY = s.y + Math.floor(s.h * 0.2);
                ctx.fillStyle = 'rgba(50,38,25,0.35)';
                for (let ci = 0; ci < 3; ci++) {
                    const px = crackStartX + ci;
                    const py = crackStartY + ci;
                    if (px < ts && py < ts) ctx.fillRect(px, py, 1, 1);
                }
            }
        }

        // Worn center
        for (let y = Math.floor(ts * 0.3); y < Math.floor(ts * 0.7); y++) {
            for (let x = Math.floor(ts * 0.2); x < Math.floor(ts * 0.8); x++) {
                if (this._tileSeed(variant + 100, x + 2000, y + 2000) > 0.85) {
                    ctx.fillStyle = 'rgba(50,40,25,0.06)';
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
    }

    // --- WATER tile generator (animation frames) ---
    _genTile_water(ctx, ts, frame) {
        const phase = (frame / 8) * Math.PI * 2;

        for (let y = 0; y < ts; y++) {
            for (let x = 0; x < ts; x++) {
                const wave1 = Math.sin(phase + x * 0.4 + y * 0.3) * 0.5 + 0.5;
                const wave2 = Math.sin(phase * 0.7 + x * 0.2 - y * 0.5) * 0.5 + 0.5;
                const wave3 = Math.cos(phase * 1.3 + x * 0.6 + y * 0.15) * 0.5 + 0.5;
                const combined = wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2;

                const deepR = 18 + Math.floor(combined * 25);
                const deepG = 58 + Math.floor(combined * 40);
                const deepB = 140 + Math.floor(combined * 50);

                const surfR = 35 + Math.floor(wave1 * 30);
                const surfG = 95 + Math.floor(wave1 * 45);
                const surfB = 180 + Math.floor(wave1 * 40);

                const threshold = 0.4 + combined * 0.3;
                this._dither(ctx, x, y, deepR, deepG, deepB, surfR, surfG, surfB, threshold);
            }
        }

        // Foam highlights
        const foamCount = 3 + frame % 3;
        for (let i = 0; i < foamCount; i++) {
            const fx = Math.floor((Math.sin(phase + i * 2.1) * 0.3 + 0.5) * ts);
            const fy = Math.floor((Math.cos(phase * 0.8 + i * 1.7) * 0.3 + 0.5) * ts);
            const fw = 2 + Math.floor(Math.abs(Math.sin(phase + i)) * 4);
            for (let dx = 0; dx < fw; dx++) {
                const px = fx + dx;
                if (px >= 0 && px < ts && fy >= 0 && fy < ts) {
                    const fa = 0.3 + Math.sin(phase + dx * 0.5) * 0.15;
                    ctx.fillStyle = `rgba(200,230,255,${fa})`;
                    ctx.fillRect(px, fy, 1, 1);
                    if (fy + 1 < ts) {
                        ctx.fillStyle = `rgba(180,215,245,${fa * 0.5})`;
                        ctx.fillRect(px, fy + 1, 1, 1);
                    }
                }
            }
        }

        // Reflection patches
        for (let i = 0; i < 2; i++) {
            const rx = Math.floor(this._tileSeed(frame, i * 31, 500) * (ts - 4)) + 2;
            const ry = Math.floor(this._tileSeed(frame, i * 37, 501) * (ts - 3)) + 1;
            const rw = 2 + Math.floor(this._tileSeed(frame, i * 41, 502) * 3);
            for (let dx = 0; dx < rw; dx++) {
                if (rx + dx < ts) {
                    ctx.fillStyle = 'rgba(140,200,240,0.15)';
                    ctx.fillRect(rx + dx, ry, 1, 1);
                }
            }
        }

        // Sparkle
        const sparkX = Math.floor((Math.sin(phase * 1.5) * 0.3 + 0.5) * ts);
        const sparkY = Math.floor((Math.cos(phase * 0.9) * 0.25 + 0.4) * ts);
        if (sparkX >= 0 && sparkX < ts && sparkY >= 0 && sparkY < ts) {
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.fillRect(sparkX, sparkY, 1, 1);
        }
    }

    // --- WALL tile generator ---
    _genTile_wall(ctx, ts, variant) {
        const seed = variant * 17;
        const baseR = 100 + (variant % 3) * 5;
        const baseG = 78 + (variant % 4) * 4;
        const baseB = 58 + (variant % 2) * 6;

        // Fill base
        for (let y = 0; y < ts; y++) {
            for (let x = 0; x < ts; x++) {
                const n = this._tileSeed(variant + 200, x * 3, y * 5);
                this._dither(ctx, x, y,
                    baseR - 5, baseG - 4, baseB - 3,
                    baseR + 5, baseG + 4, baseB + 3,
                    0.5 + n * 0.15
                );
            }
        }

        // Brick pattern
        const brickH = Math.floor(ts / 4);
        const brickW = Math.floor(ts / 2);
        const brickColors = [
            [baseR + 10, baseG + 8, baseB + 6],
            [baseR - 6, baseG - 5, baseB - 4],
            [baseR + 4, baseG + 3, baseB + 7],
            [baseR - 10, baseG - 8, baseB - 3],
        ];

        for (let by = 0; by < 4; by++) {
            const offset = (by % 2) * Math.floor(brickW * 0.5);
            for (let bx = -1; bx < 3; bx++) {
                const brickStartX = bx * brickW + offset;
                const brickStartY = by * brickH;
                const ci = ((by * 3 + bx + seed) % brickColors.length + brickColors.length) % brickColors.length;
                const bc = brickColors[ci];

                for (let iy = brickStartY + 1; iy < brickStartY + brickH - 1 && iy < ts; iy++) {
                    for (let ix = brickStartX + 1; ix < brickStartX + brickW - 1 && ix < ts; ix++) {
                        if (ix < 0) continue;
                        const n = this._tileSeed(variant + 200, ix * 7 + by, iy * 11 + bx);
                        const bv = Math.floor(n * 8) - 4;
                        ctx.fillStyle = `rgb(${bc[0] + bv},${bc[1] + bv},${bc[2] + bv})`;
                        ctx.fillRect(ix, iy, 1, 1);
                    }
                }

                // Top highlight
                for (let ix = brickStartX + 1; ix < brickStartX + brickW - 1 && ix < ts; ix++) {
                    if (ix < 0 || brickStartY >= ts) continue;
                    ctx.fillStyle = 'rgba(180,160,140,0.2)';
                    ctx.fillRect(ix, brickStartY, 1, 1);
                }

                // Bottom shadow
                const botY = brickStartY + brickH - 1;
                if (botY >= 0 && botY < ts) {
                    for (let ix = brickStartX + 1; ix < brickStartX + brickW - 1 && ix < ts; ix++) {
                        if (ix < 0) continue;
                        ctx.fillStyle = 'rgba(30,20,10,0.2)';
                        ctx.fillRect(ix, botY, 1, 1);
                    }
                }
            }
        }

        // Mortar lines (horizontal)
        for (let by = 0; by < 4; by++) {
            const my = by * brickH;
            if (my >= 0 && my < ts) {
                for (let x = 0; x < ts; x++) {
                    ctx.fillStyle = `rgba(35,25,15,${0.35 + this._tileSeed(variant + 200, x, my + 2000) * 0.15})`;
                    ctx.fillRect(x, my, 1, 1);
                }
            }
        }

        // Mortar lines (vertical)
        for (let by = 0; by < 4; by++) {
            const offset = (by % 2) * Math.floor(brickW * 0.5);
            for (let bx = -1; bx < 3; bx++) {
                const mx = bx * brickW + offset;
                if (mx >= 0 && mx < ts) {
                    for (let y = by * brickH; y < (by + 1) * brickH && y < ts; y++) {
                        ctx.fillStyle = `rgba(35,25,15,${0.3 + this._tileSeed(variant + 200, mx + 3000, y) * 0.15})`;
                        ctx.fillRect(mx, y, 1, 1);
                    }
                }
            }
        }

        // Weathering
        if (variant % 3 === 0) {
            for (let i = 0; i < 4; i++) {
                const wx = Math.floor(this._tileSeed(variant + 200, i * 43, 1200) * (ts - 4)) + 1;
                const wy = Math.floor(this._tileSeed(variant + 200, i * 47, 1201) * (ts - 3)) + 1;
                ctx.fillStyle = 'rgba(40,30,20,0.12)';
                ctx.fillRect(wx, wy, 2, 1);
            }
        }

        // Corner moss
        if (variant === 1 || variant === 3) {
            for (let x = 0; x < 4; x++) {
                for (let y = ts - 3; y < ts; y++) {
                    if (this._tileSeed(variant + 200, x + 4000, y) > 0.6) {
                        ctx.fillStyle = 'rgba(45,100,25,0.2)';
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }
        }
    }

    // --- FLOOR (wood) tile generator ---
    _genTile_floor(ctx, ts, variant) {
        const plankCount = 4;
        const plankH = Math.floor(ts / plankCount);
        const plankBaseColors = [
            [168, 130, 90], [175, 135, 95], [162, 125, 85], [172, 132, 92],
        ];

        for (let p = 0; p < plankCount; p++) {
            const pColor = plankBaseColors[(p + variant) % plankBaseColors.length];
            const plankY = p * plankH;

            for (let y = plankY; y < plankY + plankH && y < ts; y++) {
                for (let x = 0; x < ts; x++) {
                    const grainNoise = this._tileSeed(variant + 300, x * 3 + p * 100, y * 2);
                    const grainLine = Math.sin(x * 0.8 + p * 2 + grainNoise * 3) * 0.5 + 0.5;
                    const bv = Math.floor(grainLine * 12) - 6;
                    const darkGrain = Math.sin(x * 0.3 + y * 0.1 + p * 5) > 0.85;
                    if (darkGrain) {
                        ctx.fillStyle = `rgb(${pColor[0] - 18},${pColor[1] - 15},${pColor[2] - 12})`;
                        ctx.fillRect(x, y, 1, 1);
                    } else {
                        this._dither(ctx, x, y,
                            pColor[0] + bv, pColor[1] + bv, pColor[2] + bv,
                            pColor[0] - 4 + bv, pColor[1] - 3 + bv, pColor[2] - 2 + bv,
                            0.5 + grainNoise * 0.2
                        );
                    }
                }
            }

            // Plank gap
            if (plankY > 0) {
                for (let x = 0; x < ts; x++) {
                    ctx.fillStyle = `rgba(50,35,18,${0.4 + this._tileSeed(variant + 300, x, plankY + 3000) * 0.2})`;
                    ctx.fillRect(x, plankY, 1, 1);
                }
            }

            // Top edge highlight
            if (plankY + 1 < ts) {
                for (let x = 0; x < ts; x++) {
                    ctx.fillStyle = `rgba(210,185,155,${0.08 + this._tileSeed(variant + 300, x, plankY + 4000) * 0.06})`;
                    ctx.fillRect(x, plankY + 1, 1, 1);
                }
            }
        }

        // Wood knots
        const knotCount = 1 + (variant % 2);
        for (let k = 0; k < knotCount; k++) {
            const kx = Math.floor(this._tileSeed(variant + 300, k * 61, 1500) * (ts - 6)) + 3;
            const ky = Math.floor(this._tileSeed(variant + 300, k * 67, 1501) * (ts - 6)) + 3;
            ctx.fillStyle = 'rgba(80,55,30,0.4)';
            ctx.fillRect(kx, ky, 2, 2);
            ctx.fillStyle = 'rgba(100,70,35,0.25)';
            ctx.fillRect(kx - 1, ky, 1, 2);
            ctx.fillRect(kx + 2, ky, 1, 2);
            ctx.fillRect(kx, ky - 1, 2, 1);
            ctx.fillRect(kx, ky + 2, 2, 1);
        }

        // Warm highlight at top-left
        for (let y = 0; y < Math.floor(ts * 0.4); y++) {
            for (let x = 0; x < Math.floor(ts * 0.4); x++) {
                if (this._tileSeed(variant + 300, x + 5000, y + 5000) > 0.8) {
                    ctx.fillStyle = 'rgba(230,200,150,0.04)';
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
    }

    // --- FENCE tile generator ---
    _genTile_fence(ctx, ts, variant) {
        // Grass base
        this._genTile_grass(ctx, ts, variant);

        const woodBase = [139, 115, 85];
        const woodLight = [165, 138, 105];
        const woodDark = [105, 82, 58];

        const slatWidth = Math.floor(ts * 0.18);
        const slatGap = Math.floor(ts * 0.07);
        const slatCount = 3;
        const startX = Math.floor((ts - slatCount * slatWidth - (slatCount - 1) * slatGap) / 2);

        for (let s = 0; s < slatCount; s++) {
            const sx = startX + s * (slatWidth + slatGap);
            const slatTop = 2;
            const slatBot = ts - 1;

            // Slat body
            for (let y = slatTop + 2; y < slatBot; y++) {
                for (let x = sx; x < sx + slatWidth && x < ts; x++) {
                    if (x < 0) continue;
                    const grain = Math.sin(y * 0.6 + variant + s) * 0.5 + 0.5;
                    const gv = Math.floor(grain * 8) - 4;
                    const n = this._tileSeed(variant + 400, x + s * 50, y);
                    this._dither(ctx, x, y,
                        woodBase[0] + gv, woodBase[1] + gv, woodBase[2] + gv,
                        woodDark[0] + gv, woodDark[1] + gv, woodDark[2] + gv,
                        0.55 + n * 0.15
                    );
                }
            }

            // Pointed top
            const peakX = sx + Math.floor(slatWidth / 2);
            for (let dy = 0; dy < 3; dy++) {
                const halfW = Math.max(0, Math.floor(slatWidth / 2) - dy);
                for (let dx = -halfW; dx <= halfW; dx++) {
                    const px = peakX + dx;
                    const py = slatTop + dy;
                    if (px >= 0 && px < ts && py >= 0 && py < ts) {
                        ctx.fillStyle = `rgb(${woodLight[0]},${woodLight[1]},${woodLight[2]})`;
                        ctx.fillRect(px, py, 1, 1);
                    }
                }
            }

            // Left highlight
            if (sx >= 0 && sx < ts) {
                for (let y = slatTop + 2; y < slatBot; y++) {
                    ctx.fillStyle = 'rgba(200,180,150,0.15)';
                    ctx.fillRect(sx, y, 1, 1);
                }
            }

            // Right shadow
            const rx = sx + slatWidth - 1;
            if (rx >= 0 && rx < ts) {
                for (let y = slatTop + 2; y < slatBot; y++) {
                    ctx.fillStyle = 'rgba(50,35,20,0.2)';
                    ctx.fillRect(rx, y, 1, 1);
                }
            }
        }

        // Horizontal beams
        const beamY1 = Math.floor(ts * 0.3);
        const beamY2 = Math.floor(ts * 0.7);
        for (const by of [beamY1, beamY2]) {
            for (let x = 0; x < ts; x++) {
                for (let dy = 0; dy < 3; dy++) {
                    if (by + dy < ts) {
                        const n = this._tileSeed(variant + 400, x + 2000, by + dy);
                        const bv = Math.floor(n * 6) - 3;
                        ctx.fillStyle = `rgb(${woodDark[0] + bv},${woodDark[1] + bv},${woodDark[2] + bv})`;
                        ctx.fillRect(x, by + dy, 1, 1);
                    }
                }
                if (by < ts) {
                    ctx.fillStyle = 'rgba(190,170,140,0.12)';
                    ctx.fillRect(x, by, 1, 1);
                }
            }
        }
    }

    // --- BRIDGE tile generator ---
    _genTile_bridge(ctx, ts, variant) {
        const plankBaseColors = [
            [155, 122, 80], [160, 128, 85], [148, 118, 78], [152, 125, 82],
        ];

        const baseCol = plankBaseColors[variant];
        for (let y = 0; y < ts; y++) {
            for (let x = 0; x < ts; x++) {
                const n = this._tileSeed(variant + 500, x * 3, y * 2);
                this._dither(ctx, x, y,
                    baseCol[0], baseCol[1], baseCol[2],
                    baseCol[0] - 8, baseCol[1] - 6, baseCol[2] - 4,
                    0.5 + n * 0.2
                );
            }
        }

        // Plank lines
        const plankH = Math.floor(ts / 4);
        for (let p = 0; p < 4; p++) {
            const py = p * plankH;
            for (let x = 2; x < ts - 2; x++) {
                ctx.fillStyle = `rgba(30,20,10,${0.4 + this._tileSeed(variant + 500, x, py + 3000) * 0.2})`;
                ctx.fillRect(x, py, 1, 1);
                if (this._tileSeed(variant + 500, x, py + 3001) > 0.7 && py + 1 < ts) {
                    ctx.fillStyle = 'rgba(20,50,100,0.3)';
                    ctx.fillRect(x, py + 1, 1, 1);
                }
            }

            // Wood grain
            for (let y = py + 1; y < py + plankH && y < ts; y++) {
                for (let x = 3; x < ts - 3; x++) {
                    if (Math.sin(x * 0.5 + p * 3 + variant) > 0.8) {
                        ctx.fillStyle = 'rgba(90,65,35,0.15)';
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }

            // Nails
            ctx.fillStyle = 'rgba(80,80,80,0.5)';
            ctx.fillRect(3, py + Math.floor(plankH / 2), 1, 1);
            ctx.fillRect(ts - 4, py + Math.floor(plankH / 2), 1, 1);
        }

        // Side rails
        for (let y = 0; y < ts; y++) {
            for (let dx = 0; dx < 3; dx++) {
                const n = this._tileSeed(variant + 500, dx, y + 4000);
                ctx.fillStyle = `rgb(${95 + Math.floor(n * 10)},${70 + Math.floor(n * 8)},${42 + Math.floor(n * 6)})`;
                ctx.fillRect(dx, y, 1, 1);
                ctx.fillRect(ts - 1 - dx, y, 1, 1);
            }
            ctx.fillStyle = 'rgba(180,155,120,0.12)';
            ctx.fillRect(2, y, 1, 1);
            ctx.fillRect(ts - 3, y, 1, 1);
        }
    }

    // --- FLOWERS tile generator ---
    _genTile_flowers(ctx, ts, variant) {
        this._genTile_grass(ctx, ts, variant);

        const flowerPalettes = [
            [[255, 107, 138], [255, 179, 71], [255, 244, 79], [126, 200, 227], [201, 177, 255]],
            [[255, 130, 150], [255, 160, 60], [240, 230, 70], [100, 185, 210], [220, 190, 255]],
            [[230, 90, 120], [245, 170, 80], [255, 255, 100], [140, 210, 235], [190, 165, 240]],
            [[250, 120, 160], [255, 190, 90], [248, 240, 85], [115, 195, 220], [205, 180, 250]],
        ];
        const flowers = flowerPalettes[variant];

        const flowerCount = 4 + variant;
        for (let i = 0; i < flowerCount; i++) {
            const fx = Math.floor(this._tileSeed(variant + 600, i * 19, 100) * (ts - 6)) + 3;
            const fy = Math.floor(this._tileSeed(variant + 600, i * 23, 101) * (ts - 6)) + 3;
            const fc = flowers[i % flowers.length];

            // Stem
            ctx.fillStyle = 'rgba(50,110,25,0.7)';
            if (fy + 1 < ts) ctx.fillRect(fx, fy + 1, 1, 2);

            // 4 petals
            const petalPositions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
            for (const [dx, dy] of petalPositions) {
                const px = fx + dx;
                const py = fy + dy;
                if (px >= 0 && px < ts && py >= 0 && py < ts) {
                    ctx.fillStyle = `rgb(${fc[0]},${fc[1]},${fc[2]})`;
                    ctx.fillRect(px, py, 1, 1);
                }
            }

            // Center
            ctx.fillStyle = 'rgb(255,220,50)';
            ctx.fillRect(fx, fy, 1, 1);

            // Extra petals
            if (this._tileSeed(variant + 600, i * 29, 102) > 0.5) {
                const diagPetals = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
                for (const [dx, dy] of diagPetals) {
                    const px = fx + dx;
                    const py = fy + dy;
                    if (px >= 0 && px < ts && py >= 0 && py < ts) {
                        ctx.fillStyle = `rgba(${fc[0]},${fc[1]},${fc[2]},0.6)`;
                        ctx.fillRect(px, py, 1, 1);
                    }
                }
            }
        }
    }

    // --- SAND tile generator ---
    _genTile_sand(ctx, ts, variant) {
        const baseColors = [
            [212, 184, 150], [208, 180, 146], [215, 188, 155], [210, 182, 148],
        ];
        const base = baseColors[variant];

        for (let y = 0; y < ts; y++) {
            for (let x = 0; x < ts; x++) {
                const n1 = this._tileSeed(variant + 700, x * 5, y * 7);
                const n2 = this._tileSeed(variant + 700, x * 11 + 3, y * 13 + 7);
                const ripple = Math.sin(x * 0.3 + y * 0.15 + variant * 2) * 0.5 + 0.5;
                const bv = Math.floor(n1 * 10) - 5 + Math.floor(ripple * 6);

                this._dither(ctx, x, y,
                    base[0] + bv, base[1] + bv, base[2] + bv,
                    base[0] - 4 + bv, base[1] - 3 + bv, base[2] - 2 + bv,
                    0.5 + n2 * 0.2
                );
            }
        }

        // Sand specks
        const speckCount = 8 + variant * 2;
        for (let i = 0; i < speckCount; i++) {
            const sx = Math.floor(this._tileSeed(variant + 700, i * 31, 200) * ts);
            const sy = Math.floor(this._tileSeed(variant + 700, i * 37, 201) * ts);
            ctx.fillStyle = this._tileSeed(variant + 700, i * 41, 202) > 0.5 ? 'rgba(235,215,185,0.4)' : 'rgba(170,145,110,0.3)';
            ctx.fillRect(sx, sy, 1, 1);
        }

        // Wind ridges
        for (let y = 0; y < ts; y++) {
            if (Math.sin(y * 0.6 + variant * 1.5) > 0.7) {
                for (let x = 0; x < ts; x++) {
                    if (this._tileSeed(variant + 700, x + 3000, y) > 0.4) {
                        ctx.fillStyle = 'rgba(230,205,170,0.12)';
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }
        }

        // AO at bottom-right
        for (let x = ts - 3; x < ts; x++) {
            for (let y = ts - 3; y < ts; y++) {
                ctx.fillStyle = 'rgba(150,125,90,0.08)';
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    // --- ROOF tile generator ---
    _genTile_roof(ctx, ts, variant) {
        const baseColors = [
            [139, 69, 19], [145, 75, 25], [132, 62, 15], [142, 72, 22],
        ];
        const base = baseColors[variant];

        for (let y = 0; y < ts; y++) {
            for (let x = 0; x < ts; x++) {
                const n = this._tileSeed(variant + 800, x * 3, y * 5);
                this._dither(ctx, x, y,
                    base[0], base[1], base[2],
                    base[0] - 10, base[1] - 6, base[2] - 4,
                    0.5 + n * 0.2
                );
            }
        }

        // Shingle rows
        const shingleH = Math.floor(ts / 3);
        for (let row = 0; row < 3; row++) {
            const sy = row * shingleH;
            const offset = (row % 2) * Math.floor(ts * 0.25);
            const shingleW = Math.floor(ts * 0.5);

            for (let s = -1; s < 3; s++) {
                const sx = s * shingleW + offset;

                // Bottom shadow
                const botY = sy + shingleH - 1;
                if (botY >= 0 && botY < ts) {
                    for (let x = Math.max(0, sx); x < Math.min(sx + shingleW, ts); x++) {
                        ctx.fillStyle = `rgba(60,30,5,${0.3 + this._tileSeed(variant + 800, x, botY + 2000) * 0.15})`;
                        ctx.fillRect(x, botY, 1, 1);
                        if (botY - 1 >= 0) {
                            const distFromCenter = Math.abs(x - (sx + shingleW / 2)) / (shingleW / 2);
                            if (distFromCenter < 0.8) {
                                ctx.fillStyle = `rgba(180,110,50,${0.12 * (1 - distFromCenter)})`;
                                ctx.fillRect(x, botY - 1, 1, 1);
                            }
                        }
                    }
                }

                // Top highlight
                if (sy >= 0 && sy < ts) {
                    for (let x = Math.max(0, sx + 1); x < Math.min(sx + shingleW - 1, ts); x++) {
                        ctx.fillStyle = `rgba(200,130,60,${0.12 + this._tileSeed(variant + 800, x, sy + 3000) * 0.08})`;
                        ctx.fillRect(x, sy, 1, 1);
                    }
                }

                // Vertical divider
                if (sx >= 0 && sx < ts) {
                    for (let y = sy; y < Math.min(sy + shingleH, ts); y++) {
                        ctx.fillStyle = `rgba(70,35,10,${0.2 + this._tileSeed(variant + 800, sx + 4000, y) * 0.1})`;
                        ctx.fillRect(sx, y, 1, 1);
                    }
                }
            }
        }

        // Weathering
        for (let i = 0; i < 3; i++) {
            const wx = Math.floor(this._tileSeed(variant + 800, i * 53, 1300) * (ts - 4)) + 2;
            const wy = Math.floor(this._tileSeed(variant + 800, i * 59, 1301) * (ts - 3)) + 1;
            ctx.fillStyle = 'rgba(180,120,60,0.08)';
            ctx.fillRect(wx, wy, 2, 2);
        }
    }

    // --- DOOR tile generator ---
    _genTile_door(ctx, ts, variant) {
        // Floor base
        this._genTile_floor(ctx, ts, variant);

        const frameW = Math.floor(ts * 0.2);
        const frameTop = Math.floor(ts * 0.05);
        const doorLeft = frameW;
        const doorRight = ts - frameW;
        const doorTop = frameTop;
        const doorBottom = ts - 1;
        const doorWidth = doorRight - doorLeft;
        const doorHeight = doorBottom - doorTop;

        const doorBaseColors = [
            [95, 65, 38], [100, 70, 42], [88, 60, 35], [92, 63, 36],
        ];
        const doorCol = doorBaseColors[variant];

        // Door planks
        for (let y = doorTop; y < doorBottom; y++) {
            for (let x = doorLeft; x < doorRight; x++) {
                const grain = Math.sin(y * 0.4 + variant + (x - doorLeft) * 0.15) * 0.5 + 0.5;
                const gv = Math.floor(grain * 10) - 5;
                const n = this._tileSeed(variant + 900, x, y);
                this._dither(ctx, x, y,
                    doorCol[0] + gv, doorCol[1] + gv, doorCol[2] + gv,
                    doorCol[0] - 6 + gv, doorCol[1] - 5 + gv, doorCol[2] - 3 + gv,
                    0.5 + n * 0.15
                );
            }
        }

        // Plank divider
        const midX = Math.floor(ts / 2);
        for (let y = doorTop + 1; y < doorBottom - 1; y++) {
            ctx.fillStyle = `rgba(40,25,12,${0.3 + this._tileSeed(variant + 900, midX, y + 5000) * 0.15})`;
            ctx.fillRect(midX, y, 1, 1);
        }

        // Frame edges
        for (let y = doorTop; y < doorBottom; y++) {
            ctx.fillStyle = `rgba(55,38,20,${0.6 + this._tileSeed(variant + 900, doorLeft - 1, y + 6000) * 0.2})`;
            if (doorLeft - 1 >= 0) ctx.fillRect(doorLeft - 1, y, 1, 1);
            ctx.fillRect(doorLeft, y, 1, 1);
            if (doorRight < ts) ctx.fillRect(doorRight, y, 1, 1);
            if (doorRight - 1 >= 0) {
                ctx.fillStyle = 'rgba(55,38,20,0.5)';
                ctx.fillRect(doorRight - 1, y, 1, 1);
            }
        }
        for (let x = doorLeft - 1; x <= doorRight && x < ts; x++) {
            if (x >= 0 && doorTop >= 0) {
                ctx.fillStyle = 'rgba(55,38,20,0.6)';
                ctx.fillRect(x, doorTop, 1, 1);
            }
        }

        // Metal bands
        const bandY1 = doorTop + Math.floor(doorHeight * 0.25);
        const bandY2 = doorTop + Math.floor(doorHeight * 0.75);
        for (const bandY of [bandY1, bandY2]) {
            for (let x = doorLeft + 1; x < doorRight - 1; x++) {
                const n = this._tileSeed(variant + 900, x, bandY + 7000);
                ctx.fillStyle = `rgb(${65 + Math.floor(n * 15)},${60 + Math.floor(n * 12)},${55 + Math.floor(n * 10)})`;
                ctx.fillRect(x, bandY, 1, 1);
                if (bandY - 1 >= doorTop) {
                    ctx.fillStyle = 'rgba(120,115,105,0.15)';
                    ctx.fillRect(x, bandY - 1, 1, 1);
                }
            }
        }

        // Handle
        const handleX = doorLeft + Math.floor(doorWidth * 0.7);
        const handleY = doorTop + Math.floor(doorHeight * 0.5);
        ctx.fillStyle = 'rgba(255,215,0,0.3)';
        ctx.fillRect(handleX - 1, handleY - 1, 3, 3);
        ctx.fillStyle = 'rgb(255,215,0)';
        ctx.fillRect(handleX, handleY, 1, 1);
        ctx.fillStyle = 'rgb(255,240,150)';
        ctx.fillRect(handleX, handleY - 1, 1, 1);
    }

    // --- STONE tile generator ---
    _genTile_stone(ctx, ts, variant) {
        const baseColors = [
            [128, 128, 128], [122, 122, 125], [132, 130, 126], [125, 125, 130],
        ];
        const base = baseColors[variant];

        // Mortar base
        for (let y = 0; y < ts; y++) {
            for (let x = 0; x < ts; x++) {
                const n = this._tileSeed(variant + 1000, x * 3, y * 5);
                this._dither(ctx, x, y,
                    base[0] - 20, base[1] - 18, base[2] - 15,
                    base[0] - 28, base[1] - 26, base[2] - 22,
                    0.5 + n * 0.15
                );
            }
        }

        // Stone blocks
        const stoneLayouts = [
            [
                { x: 1, y: 1, w: 14, h: 14 }, { x: 16, y: 1, w: 15, h: 14 },
                { x: 1, y: 16, w: 10, h: 15 }, { x: 12, y: 16, w: 10, h: 15 }, { x: 23, y: 16, w: 8, h: 15 },
            ],
            [
                { x: 1, y: 1, w: 10, h: 10 }, { x: 12, y: 1, w: 10, h: 10 }, { x: 23, y: 1, w: 8, h: 10 },
                { x: 1, y: 12, w: 15, h: 10 }, { x: 17, y: 12, w: 14, h: 10 },
                { x: 1, y: 23, w: 8, h: 8 }, { x: 10, y: 23, w: 12, h: 8 }, { x: 23, y: 23, w: 8, h: 8 },
            ],
            [
                { x: 1, y: 1, w: 20, h: 10 }, { x: 22, y: 1, w: 9, h: 10 },
                { x: 1, y: 12, w: 9, h: 10 }, { x: 11, y: 12, w: 20, h: 10 },
                { x: 1, y: 23, w: 14, h: 8 }, { x: 16, y: 23, w: 15, h: 8 },
            ],
            [
                { x: 1, y: 1, w: 12, h: 12 }, { x: 14, y: 1, w: 8, h: 7 }, { x: 23, y: 1, w: 8, h: 12 },
                { x: 14, y: 9, w: 8, h: 8 },
                { x: 1, y: 14, w: 10, h: 8 }, { x: 12, y: 18, w: 10, h: 8 }, { x: 23, y: 14, w: 8, h: 8 },
                { x: 1, y: 23, w: 15, h: 8 }, { x: 17, y: 23, w: 14, h: 8 },
            ],
        ];

        const blocks = stoneLayouts[variant % stoneLayouts.length];
        const stoneShades = [
            [base[0] + 5, base[1] + 5, base[2] + 5],
            [base[0] - 3, base[1] - 2, base[2] - 1],
            [base[0] + 10, base[1] + 8, base[2] + 6],
            [base[0] - 8, base[1] - 6, base[2] - 4],
        ];

        for (let bi = 0; bi < blocks.length; bi++) {
            const b = blocks[bi];
            const shade = stoneShades[(bi + variant) % stoneShades.length];

            for (let y = b.y; y < Math.min(b.y + b.h, ts); y++) {
                for (let x = b.x; x < Math.min(b.x + b.w, ts); x++) {
                    const n = this._tileSeed(variant + 1000, x * 7 + bi, y * 11 + bi);
                    const sv = Math.floor(n * 10) - 5;
                    this._dither(ctx, x, y,
                        shade[0] + sv, shade[1] + sv, shade[2] + sv,
                        shade[0] - 3 + sv, shade[1] - 3 + sv, shade[2] - 2 + sv,
                        0.5 + n * 0.15
                    );
                }
            }

            // Top highlight
            for (let x = b.x; x < Math.min(b.x + b.w, ts); x++) {
                if (b.y < ts) {
                    ctx.fillStyle = 'rgba(200,200,205,0.18)';
                    ctx.fillRect(x, b.y, 1, 1);
                }
            }
            // Left highlight
            for (let y = b.y; y < Math.min(b.y + b.h, ts); y++) {
                if (b.x < ts) {
                    ctx.fillStyle = 'rgba(190,190,195,0.12)';
                    ctx.fillRect(b.x, y, 1, 1);
                }
            }
            // Bottom shadow
            const bBot = Math.min(b.y + b.h - 1, ts - 1);
            for (let x = b.x; x < Math.min(b.x + b.w, ts); x++) {
                ctx.fillStyle = 'rgba(40,40,45,0.2)';
                ctx.fillRect(x, bBot, 1, 1);
            }
            // Right shadow
            const bRight = Math.min(b.x + b.w - 1, ts - 1);
            for (let y = b.y; y < Math.min(b.y + b.h, ts); y++) {
                ctx.fillStyle = 'rgba(45,45,50,0.15)';
                ctx.fillRect(bRight, y, 1, 1);
            }
        }

        // Surface noise
        for (let i = 0; i < 6; i++) {
            const sx = Math.floor(this._tileSeed(variant + 1000, i * 71, 2000) * ts);
            const sy = Math.floor(this._tileSeed(variant + 1000, i * 73, 2001) * ts);
            ctx.fillStyle = this._tileSeed(variant + 1000, i * 79, 2002) > 0.5 ? 'rgba(160,160,165,0.15)' : 'rgba(80,80,85,0.12)';
            ctx.fillRect(sx, sy, 1, 1);
        }
    }

    // === TILE TRANSITION BLENDING ===

    _drawTileTransitions(ctx, col, row, ts) {
        const idx = row * this.mapW + col;
        const tile = this.tiles[idx];
        const px = col * ts;
        const py = row * ts;

        // Get neighbor tiles (default to same tile at map edges to avoid transitions)
        const above = row > 0 ? this.tiles[(row - 1) * this.mapW + col] : tile;
        const below = row < this.mapH - 1 ? this.tiles[(row + 1) * this.mapW + col] : tile;
        const left = col > 0 ? this.tiles[row * this.mapW + col - 1] : tile;
        const right = col < this.mapW - 1 ? this.tiles[row * this.mapW + col + 1] : tile;

        const blendSize = ts * 0.25; // 25% of tile width for transition zone

        // Helper: check if a tile is a grass-like type
        const isGrass = (t) => t === TILE.GRASS || t === TILE.DARK_GRASS || t === TILE.FLOWERS;
        // Helper: check if a tile is a land type (not water)
        const isLand = (t) => t !== TILE.WATER;
        // Helper: check if a tile is a wall/building type
        const isWall = (t) => t === TILE.WALL || t === TILE.ROOF;

        // --- Grass meeting Path: grass fringe bleeds over the path edge ---
        if (tile === TILE.PATH || tile === TILE.STONE) {
            let grad;
            // Grass above this path tile -> grass fringe bleeds down from top
            if (isGrass(above)) {
                grad = ctx.createLinearGradient(px, py, px, py + blendSize);
                grad.addColorStop(0, 'rgba(58,122,30,0.45)');
                grad.addColorStop(0.5, 'rgba(58,122,30,0.15)');
                grad.addColorStop(1, 'rgba(58,122,30,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(px, py, ts, blendSize);
            }
            // Grass below this path tile -> grass fringe bleeds up from bottom
            if (isGrass(below)) {
                grad = ctx.createLinearGradient(px, py + ts, px, py + ts - blendSize);
                grad.addColorStop(0, 'rgba(58,122,30,0.45)');
                grad.addColorStop(0.5, 'rgba(58,122,30,0.15)');
                grad.addColorStop(1, 'rgba(58,122,30,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(px, py + ts - blendSize, ts, blendSize);
            }
            // Grass left of this path tile -> grass fringe bleeds right
            if (isGrass(left)) {
                grad = ctx.createLinearGradient(px, py, px + blendSize, py);
                grad.addColorStop(0, 'rgba(58,122,30,0.45)');
                grad.addColorStop(0.5, 'rgba(58,122,30,0.15)');
                grad.addColorStop(1, 'rgba(58,122,30,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(px, py, blendSize, ts);
            }
            // Grass right of this path tile -> grass fringe bleeds left
            if (isGrass(right)) {
                grad = ctx.createLinearGradient(px + ts, py, px + ts - blendSize, py);
                grad.addColorStop(0, 'rgba(58,122,30,0.45)');
                grad.addColorStop(0.5, 'rgba(58,122,30,0.15)');
                grad.addColorStop(1, 'rgba(58,122,30,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(px + ts - blendSize, py, blendSize, ts);
            }
        }

        // --- Grass meeting Water: sandy shoreline edge ---
        if (isGrass(tile)) {
            let grad;
            // Water above -> earthy shoreline at top edge of this grass
            if (above === TILE.WATER) {
                grad = ctx.createLinearGradient(px, py, px, py + blendSize * 1.2);
                grad.addColorStop(0, 'rgba(180,155,110,0.55)');
                grad.addColorStop(0.4, 'rgba(160,140,95,0.3)');
                grad.addColorStop(1, 'rgba(160,140,95,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(px, py, ts, blendSize * 1.2);
            }
            // Water below -> shoreline at bottom edge
            if (below === TILE.WATER) {
                grad = ctx.createLinearGradient(px, py + ts, px, py + ts - blendSize * 1.2);
                grad.addColorStop(0, 'rgba(180,155,110,0.55)');
                grad.addColorStop(0.4, 'rgba(160,140,95,0.3)');
                grad.addColorStop(1, 'rgba(160,140,95,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(px, py + ts - blendSize * 1.2, ts, blendSize * 1.2);
            }
            // Water left -> shoreline at left edge
            if (left === TILE.WATER) {
                grad = ctx.createLinearGradient(px, py, px + blendSize * 1.2, py);
                grad.addColorStop(0, 'rgba(180,155,110,0.55)');
                grad.addColorStop(0.4, 'rgba(160,140,95,0.3)');
                grad.addColorStop(1, 'rgba(160,140,95,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(px, py, blendSize * 1.2, ts);
            }
            // Water right -> shoreline at right edge
            if (right === TILE.WATER) {
                grad = ctx.createLinearGradient(px + ts, py, px + ts - blendSize * 1.2, py);
                grad.addColorStop(0, 'rgba(180,155,110,0.55)');
                grad.addColorStop(0.4, 'rgba(160,140,95,0.3)');
                grad.addColorStop(1, 'rgba(160,140,95,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(px + ts - blendSize * 1.2, py, blendSize * 1.2, ts);
            }
        }

        // --- Water meeting Land: foam/wet edge on the land side ---
        // (drawn on the water tile, extending foam toward its land neighbor)
        if (tile === TILE.WATER) {
            const foamWave = Math.sin(this._waterOffset * 3 + col * 0.7 + row * 0.5) * ts * 0.02;
            let grad;
            // Land above water -> wet foam at top of water tile
            if (isLand(above) && !isWall(above)) {
                grad = ctx.createLinearGradient(px, py, px, py + blendSize);
                grad.addColorStop(0, 'rgba(200,225,240,0.4)');
                grad.addColorStop(0.3, 'rgba(180,210,230,0.2)');
                grad.addColorStop(1, 'rgba(180,210,230,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(px, py, ts, blendSize + foamWave);
            }
            // Land below water -> wet foam at bottom
            if (isLand(below) && !isWall(below)) {
                grad = ctx.createLinearGradient(px, py + ts, px, py + ts - blendSize);
                grad.addColorStop(0, 'rgba(200,225,240,0.4)');
                grad.addColorStop(0.3, 'rgba(180,210,230,0.2)');
                grad.addColorStop(1, 'rgba(180,210,230,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(px, py + ts - blendSize + foamWave, ts, blendSize);
            }
            // Land left -> wet foam at left
            if (isLand(left) && !isWall(left)) {
                grad = ctx.createLinearGradient(px, py, px + blendSize, py);
                grad.addColorStop(0, 'rgba(200,225,240,0.4)');
                grad.addColorStop(0.3, 'rgba(180,210,230,0.2)');
                grad.addColorStop(1, 'rgba(180,210,230,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(px, py, blendSize + foamWave, ts);
            }
            // Land right -> wet foam at right
            if (isLand(right) && !isWall(right)) {
                grad = ctx.createLinearGradient(px + ts, py, px + ts - blendSize, py);
                grad.addColorStop(0, 'rgba(200,225,240,0.4)');
                grad.addColorStop(0.3, 'rgba(180,210,230,0.2)');
                grad.addColorStop(1, 'rgba(180,210,230,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(px + ts - blendSize + foamWave, py, blendSize, ts);
            }
        }

        // --- Path meeting Water: wet darkened edge on path side ---
        if (tile === TILE.PATH) {
            let grad;
            if (above === TILE.WATER) {
                grad = ctx.createLinearGradient(px, py, px, py + blendSize);
                grad.addColorStop(0, 'rgba(60,50,35,0.4)');
                grad.addColorStop(1, 'rgba(60,50,35,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(px, py, ts, blendSize);
            }
            if (below === TILE.WATER) {
                grad = ctx.createLinearGradient(px, py + ts, px, py + ts - blendSize);
                grad.addColorStop(0, 'rgba(60,50,35,0.4)');
                grad.addColorStop(1, 'rgba(60,50,35,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(px, py + ts - blendSize, ts, blendSize);
            }
            if (left === TILE.WATER) {
                grad = ctx.createLinearGradient(px, py, px + blendSize, py);
                grad.addColorStop(0, 'rgba(60,50,35,0.4)');
                grad.addColorStop(1, 'rgba(60,50,35,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(px, py, blendSize, ts);
            }
            if (right === TILE.WATER) {
                grad = ctx.createLinearGradient(px + ts, py, px + ts - blendSize, py);
                grad.addColorStop(0, 'rgba(60,50,35,0.4)');
                grad.addColorStop(1, 'rgba(60,50,35,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(px + ts - blendSize, py, blendSize, ts);
            }
        }
    }

    // === BUILDING FRONT FACES (3/4 perspective) ===

    _drawWallFrontFace(ctx, x, y, ts, col, row) {
        // Only draw a front face if the tile below is NOT a wall/floor/roof
        // (meaning this is the bottom edge of a building, visible from 3/4 view)
        if (row >= this.mapH - 1) return;
        const below = this.tiles[(row + 1) * this.mapW + col];
        if (below === TILE.WALL || below === TILE.FLOOR || below === TILE.ROOF || below === TILE.DOOR) return;

        const faceHeight = ts * 0.6;
        const seed = (col * 17 + row * 11) % 13;

        // Base wall colors (match _drawWall tones but darker for the front face)
        const baseR = 80 + (seed % 5) * 2;
        const baseG = 62 + (seed % 4) * 2;
        const baseB = 45 + (seed % 3) * 2;

        // Vertical face gradient: lighter at top (near wall), darker at bottom
        const faceGrad = ctx.createLinearGradient(x, y + ts, x, y + ts + faceHeight);
        faceGrad.addColorStop(0, `rgb(${baseR + 25},${baseG + 20},${baseB + 15})`);
        faceGrad.addColorStop(0.4, `rgb(${baseR + 10},${baseG + 8},${baseB + 5})`);
        faceGrad.addColorStop(1, `rgb(${baseR - 15},${baseG - 12},${baseB - 10})`);
        ctx.fillStyle = faceGrad;
        ctx.fillRect(x, y + ts, ts, faceHeight);

        // Brick lines on the front face for texture
        const brickH = faceHeight / 3;
        const brickW = ts / 2;
        ctx.strokeStyle = 'rgba(30,20,10,0.3)';
        ctx.lineWidth = 0.6;
        for (let by = 0; by < 3; by++) {
            const offset = (by % 2) * brickW * 0.5;
            const brickY = y + ts + by * brickH;
            // Horizontal mortar lines
            ctx.beginPath();
            ctx.moveTo(x, brickY);
            ctx.lineTo(x + ts, brickY);
            ctx.stroke();
            // Vertical mortar lines
            for (let bx = 0; bx < 3; bx++) {
                const mx = x + bx * brickW + offset;
                if (mx > x && mx < x + ts) {
                    ctx.beginPath();
                    ctx.moveTo(mx, brickY);
                    ctx.lineTo(mx, brickY + brickH);
                    ctx.stroke();
                }
            }
        }

        // Individual brick color variation on front face
        const brickFaceColors = [
            `rgba(${baseR + 15},${baseG + 12},${baseB + 8},0.3)`,
            `rgba(${baseR - 8},${baseG - 6},${baseB - 4},0.25)`,
        ];
        for (let by = 0; by < 3; by++) {
            const offset = (by % 2) * brickW * 0.5;
            for (let bx = 0; bx < 3; bx++) {
                const ci = (by + bx + seed) % brickFaceColors.length;
                ctx.fillStyle = brickFaceColors[ci];
                const brickX = x + bx * brickW + offset;
                const brickY2 = y + ts + by * brickH;
                ctx.fillRect(
                    Math.max(x, brickX) + 0.5,
                    brickY2 + 0.5,
                    Math.min(brickW - 1, x + ts - Math.max(x, brickX) - 0.5),
                    brickH - 1
                );
            }
        }

        // Highlight on the left edge (light source from left)
        const edgeHighlight = ctx.createLinearGradient(x, y + ts, x + ts * 0.15, y + ts);
        edgeHighlight.addColorStop(0, 'rgba(180,165,140,0.2)');
        edgeHighlight.addColorStop(1, 'rgba(180,165,140,0)');
        ctx.fillStyle = edgeHighlight;
        ctx.fillRect(x, y + ts, ts * 0.15, faceHeight);

        // Shadow along the right edge
        const edgeShadow = ctx.createLinearGradient(x + ts, y + ts, x + ts - ts * 0.12, y + ts);
        edgeShadow.addColorStop(0, 'rgba(20,15,10,0.2)');
        edgeShadow.addColorStop(1, 'rgba(20,15,10,0)');
        ctx.fillStyle = edgeShadow;
        ctx.fillRect(x + ts - ts * 0.12, y + ts, ts * 0.12, faceHeight);

        // Subtle shadow at the very bottom of the front face (ground contact)
        const bottomShadow = ctx.createLinearGradient(x, y + ts + faceHeight - ts * 0.08, x, y + ts + faceHeight);
        bottomShadow.addColorStop(0, 'rgba(0,0,0,0)');
        bottomShadow.addColorStop(1, 'rgba(0,0,0,0.25)');
        ctx.fillStyle = bottomShadow;
        ctx.fillRect(x, y + ts + faceHeight - ts * 0.08, ts, ts * 0.08);

        // Ground shadow cast below the building face
        const groundShadow = ctx.createLinearGradient(x, y + ts + faceHeight, x, y + ts + faceHeight + ts * 0.15);
        groundShadow.addColorStop(0, 'rgba(0,0,0,0.2)');
        groundShadow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = groundShadow;
        ctx.fillRect(x - ts * 0.05, y + ts + faceHeight, ts + ts * 0.1, ts * 0.15);
    }

    // === OBJECT RENDERING ===

    _renderObject(ctx, obj, col, row, ts) {
        const x = col * ts;
        const y = row * ts;

        // Lookup cached texture for this object type
        const cacheKey = this._objCacheKeyMap && this._objCacheKeyMap[obj];
        if (cacheKey && this._objTextures && this._objTextures[cacheKey]) {
            const variants = this._objTextures[cacheKey];
            // Pick variant based on position hash for deterministic variety
            const variantIdx = ((col * 7 + row * 13) & 0x7FFFFFFF) % variants.length;
            const cached = variants[variantIdx];
            // Cached canvases are sized to the object's bounding box.
            // They are anchored so that the bottom-center of the cached image
            // aligns with the center-bottom of the tile the object sits on.
            const drawX = x + ts * 0.5 - cached.width * 0.5;
            const drawY = y + ts - cached.height;
            ctx.drawImage(cached, drawX, drawY);

            // Some objects need animated overlays drawn on top of the cached sprite
            if (obj === OBJ.FOUNTAIN) {
                this._drawFountainOverlay(ctx, x, y, ts);
            } else if (obj === OBJ.LAMP) {
                this._drawLampGlow(ctx, x, y, ts);
            } else if (obj === OBJ.CHIMNEY) {
                this._drawChimneySmoke(ctx, x, y, ts);
            }
            return;
        }

        // Fallback to real-time drawing for uncached types
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
        const cx = x + ts * 0.5;
        const sway = Math.sin(this.time * 0.8 + x * 0.1) * ts * 0.02;
        const microSway = Math.sin(this.time * 1.5 + x * 0.2) * ts * 0.01;

        // Trunk with bark texture
        ctx.fillStyle = '#4a2a10';
        ctx.beginPath();
        ctx.moveTo(x + ts * 0.38, y + ts * 0.95);
        ctx.lineTo(x + ts * 0.35, y + ts * 0.55);
        ctx.quadraticCurveTo(cx + sway * 0.3, y + ts * 0.45, x + ts * 0.42 + sway * 0.3, y + ts * 0.38);
        ctx.lineTo(x + ts * 0.58 + sway * 0.3, y + ts * 0.38);
        ctx.quadraticCurveTo(cx + sway * 0.3, y + ts * 0.45, x + ts * 0.65, y + ts * 0.55);
        ctx.lineTo(x + ts * 0.62, y + ts * 0.95);
        ctx.closePath();
        ctx.fill();

        // Bark texture lines
        ctx.strokeStyle = 'rgba(30,15,5,0.35)';
        ctx.lineWidth = 0.6;
        for (let i = 0; i < 4; i++) {
            const by = y + ts * (0.55 + i * 0.1);
            ctx.beginPath();
            ctx.moveTo(x + ts * 0.37, by);
            ctx.quadraticCurveTo(cx, by + ts * 0.02, x + ts * 0.63, by);
            ctx.stroke();
        }
        // Bark highlight
        ctx.fillStyle = 'rgba(100,65,30,0.3)';
        ctx.fillRect(x + ts * 0.39, y + ts * 0.55, ts * 0.06, ts * 0.35);

        // Trunk knot
        ctx.fillStyle = 'rgba(35,18,5,0.4)';
        ctx.beginPath();
        ctx.ellipse(x + ts * 0.52, y + ts * 0.68, ts * 0.04, ts * 0.03, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Visible branches extending from trunk into canopy
        ctx.strokeStyle = '#4a2a10';
        ctx.lineWidth = ts * 0.04;
        ctx.lineCap = 'round';
        // Left branch
        ctx.beginPath();
        ctx.moveTo(cx + sway * 0.3, y + ts * 0.42);
        ctx.quadraticCurveTo(cx - ts * 0.15 + sway, y + ts * 0.32, cx - ts * 0.28 + sway, y + ts * 0.22);
        ctx.stroke();
        // Right branch
        ctx.lineWidth = ts * 0.035;
        ctx.beginPath();
        ctx.moveTo(cx + sway * 0.3 + ts * 0.05, y + ts * 0.44);
        ctx.quadraticCurveTo(cx + ts * 0.18 + sway, y + ts * 0.3, cx + ts * 0.25 + sway, y + ts * 0.18);
        ctx.stroke();

        // Canopy - multiple leaf cluster layers for volume
        // Back/shadow layer
        ctx.fillStyle = '#145808';
        ctx.beginPath();
        ctx.ellipse(cx + sway - ts * 0.18, y + ts * 0.32, ts * 0.24, ts * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + sway + ts * 0.2, y + ts * 0.3, ts * 0.22, ts * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Middle layer
        ctx.fillStyle = '#1d7a0c';
        ctx.beginPath();
        ctx.ellipse(cx + sway - ts * 0.12, y + ts * 0.25, ts * 0.26, ts * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + sway + ts * 0.14, y + ts * 0.23, ts * 0.25, ts * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Front/top layer - main canopy
        ctx.fillStyle = '#2a9518';
        ctx.beginPath();
        ctx.ellipse(cx + sway, y + ts * 0.16, ts * 0.3, ts * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Individual leaf cluster bumps on top
        ctx.fillStyle = '#32a51e';
        const clusterPositions = [
            [-0.2, 0.12], [-0.05, 0.05], [0.12, 0.08], [0.22, 0.18],
            [-0.15, 0.22], [0.08, 0.28], [-0.25, 0.28]
        ];
        for (let i = 0; i < clusterPositions.length; i++) {
            const [ox, oy] = clusterPositions[i];
            const clusterSway = sway + Math.sin(this.time * 1.2 + i * 1.1) * ts * 0.008;
            ctx.beginPath();
            ctx.arc(cx + ox * ts + clusterSway, y + oy * ts + microSway, ts * 0.09, 0, Math.PI * 2);
            ctx.fill();
        }

        // Sunlight dapple highlights on canopy
        ctx.fillStyle = 'rgba(120,210,60,0.3)';
        ctx.beginPath();
        ctx.ellipse(cx + sway - ts * 0.1, y + ts * 0.08, ts * 0.12, ts * 0.08, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(140,220,70,0.2)';
        ctx.beginPath();
        ctx.ellipse(cx + sway + ts * 0.1, y + ts * 0.14, ts * 0.09, ts * 0.06, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Bottom shadow on canopy (depth)
        ctx.fillStyle = 'rgba(10,40,5,0.2)';
        ctx.beginPath();
        ctx.ellipse(cx + sway, y + ts * 0.35, ts * 0.28, ts * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tiny leaf detail specks
        ctx.fillStyle = 'rgba(80,180,40,0.35)';
        for (let i = 0; i < 4; i++) {
            const lx = cx + sway + Math.sin(i * 2.5 + x * 0.1) * ts * 0.2;
            const ly = y + ts * 0.1 + Math.cos(i * 1.8 + y * 0.1) * ts * 0.12;
            ctx.fillRect(lx, ly, 1.5, 1.5);
        }

        // Root bumps at base
        ctx.fillStyle = '#3a2010';
        ctx.beginPath();
        ctx.ellipse(x + ts * 0.35, y + ts * 0.92, ts * 0.08, ts * 0.03, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + ts * 0.65, y + ts * 0.93, ts * 0.07, ts * 0.03, 0.2, 0, Math.PI * 2);
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
        const cx = x + ts * 0.5;
        const flicker = Math.sin(this.time * 8) * 0.03 + Math.sin(this.time * 13) * 0.02;

        // Base pedestal (ornate)
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.roundRect(cx - ts * 0.14, y + ts * 0.88, ts * 0.28, ts * 0.1, 2);
        ctx.fill();
        // Base highlight
        ctx.fillStyle = 'rgba(120,120,120,0.3)';
        ctx.fillRect(cx - ts * 0.12, y + ts * 0.88, ts * 0.08, ts * 0.04);

        // Ornate pole - tapers slightly
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.moveTo(cx - ts * 0.05, y + ts * 0.88);
        ctx.lineTo(cx - ts * 0.04, y + ts * 0.3);
        ctx.lineTo(cx + ts * 0.04, y + ts * 0.3);
        ctx.lineTo(cx + ts * 0.05, y + ts * 0.88);
        ctx.closePath();
        ctx.fill();

        // Pole decorative rings
        ctx.strokeStyle = '#5a5a5a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(cx, y + ts * 0.5, ts * 0.055, ts * 0.015, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(cx, y + ts * 0.7, ts * 0.055, ts * 0.015, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Pole highlight (metallic)
        ctx.fillStyle = 'rgba(150,150,150,0.2)';
        ctx.fillRect(cx - ts * 0.04, y + ts * 0.3, ts * 0.025, ts * 0.58);

        // Lamp arm (curved bracket)
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = ts * 0.04;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx, y + ts * 0.3);
        ctx.quadraticCurveTo(cx + ts * 0.12, y + ts * 0.22, cx, y + ts * 0.16);
        ctx.stroke();
        // Mirror bracket
        ctx.beginPath();
        ctx.moveTo(cx, y + ts * 0.3);
        ctx.quadraticCurveTo(cx - ts * 0.12, y + ts * 0.22, cx, y + ts * 0.16);
        ctx.stroke();

        // Lamp housing (glass lantern shape)
        // Lamp top cap
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.moveTo(cx, y + ts * 0.08);
        ctx.lineTo(cx - ts * 0.1, y + ts * 0.14);
        ctx.lineTo(cx + ts * 0.1, y + ts * 0.14);
        ctx.closePath();
        ctx.fill();

        // Glass panels (warm glow from inside)
        ctx.fillStyle = `rgba(255,220,100,${0.55 + flicker})`;
        ctx.beginPath();
        ctx.moveTo(cx - ts * 0.09, y + ts * 0.14);
        ctx.lineTo(cx - ts * 0.07, y + ts * 0.28);
        ctx.lineTo(cx + ts * 0.07, y + ts * 0.28);
        ctx.lineTo(cx + ts * 0.09, y + ts * 0.14);
        ctx.closePath();
        ctx.fill();

        // Glass panel frame lines
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(cx - ts * 0.09, y + ts * 0.14);
        ctx.lineTo(cx - ts * 0.07, y + ts * 0.28);
        ctx.lineTo(cx + ts * 0.07, y + ts * 0.28);
        ctx.lineTo(cx + ts * 0.09, y + ts * 0.14);
        ctx.closePath();
        ctx.stroke();
        // Vertical divider
        ctx.beginPath();
        ctx.moveTo(cx, y + ts * 0.14);
        ctx.lineTo(cx, y + ts * 0.28);
        ctx.stroke();

        // Bottom cap of lamp
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.roundRect(cx - ts * 0.08, y + ts * 0.27, ts * 0.16, ts * 0.03, 1);
        ctx.fill();

        // Warm glow radius (light cone downward)
        const glowGrad = ctx.createRadialGradient(cx, y + ts * 0.3, 0, cx, y + ts * 0.3, ts * 0.6);
        glowGrad.addColorStop(0, `rgba(255,210,80,${0.25 + flicker})`);
        glowGrad.addColorStop(0.4, `rgba(255,180,50,${0.1 + flicker * 0.5})`);
        glowGrad.addColorStop(1, 'rgba(255,180,50,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, y + ts * 0.3, ts * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Upward glow (smaller, around lantern)
        const upGrad = ctx.createRadialGradient(cx, y + ts * 0.18, 0, cx, y + ts * 0.18, ts * 0.2);
        upGrad.addColorStop(0, `rgba(255,230,130,${0.15 + flicker})`);
        upGrad.addColorStop(1, 'rgba(255,230,130,0)');
        ctx.fillStyle = upGrad;
        ctx.beginPath();
        ctx.arc(cx, y + ts * 0.18, ts * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Finial on top
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(cx, y + ts * 0.07, ts * 0.025, 0, Math.PI * 2);
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
        const cx = x + ts * 0.5;

        // Base/walls with wood grain
        ctx.fillStyle = '#b87545';
        ctx.fillRect(x + ts * 0.08, y + ts * 0.42, ts * 0.84, ts * 0.53);

        // Horizontal plank lines on walls
        ctx.strokeStyle = 'rgba(80,45,15,0.25)';
        ctx.lineWidth = 0.6;
        for (let i = 0; i < 5; i++) {
            const py = y + ts * (0.46 + i * 0.1);
            ctx.beginPath();
            ctx.moveTo(x + ts * 0.08, py);
            ctx.lineTo(x + ts * 0.92, py);
            ctx.stroke();
        }

        // Wall highlight (left side, light source)
        ctx.fillStyle = 'rgba(210,170,120,0.2)';
        ctx.fillRect(x + ts * 0.08, y + ts * 0.42, ts * 0.3, ts * 0.53);

        // Wall shadow (right side)
        ctx.fillStyle = 'rgba(60,30,10,0.12)';
        ctx.fillRect(x + ts * 0.62, y + ts * 0.42, ts * 0.3, ts * 0.53);

        // Door hole (arched entrance)
        ctx.fillStyle = '#2a1508';
        ctx.beginPath();
        ctx.arc(cx, y + ts * 0.68, ts * 0.16, Math.PI, 0, true);
        ctx.fill();
        ctx.fillRect(cx - ts * 0.16, y + ts * 0.68, ts * 0.32, ts * 0.27);

        // Door hole inner highlight
        ctx.fillStyle = 'rgba(60,35,15,0.5)';
        ctx.beginPath();
        ctx.arc(cx, y + ts * 0.68, ts * 0.13, Math.PI, 0, true);
        ctx.fill();

        // Bone decoration above door
        ctx.fillStyle = '#e8ddd0';
        const boneY = y + ts * 0.56;
        // Bone shaft
        ctx.fillRect(cx - ts * 0.09, boneY, ts * 0.18, ts * 0.035);
        // Bone knobs
        ctx.beginPath();
        ctx.arc(cx - ts * 0.1, boneY + ts * 0.017, ts * 0.03, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + ts * 0.1, boneY + ts * 0.017, ts * 0.03, 0, Math.PI * 2);
        ctx.fill();

        // Roof with shingle texture
        ctx.fillStyle = '#7a3810';
        ctx.beginPath();
        ctx.moveTo(cx, y + ts * 0.18);
        ctx.lineTo(x, y + ts * 0.44);
        ctx.lineTo(x + ts, y + ts * 0.44);
        ctx.closePath();
        ctx.fill();

        // Shingle rows on roof
        const shingleRows = 3;
        for (let sr = 0; sr < shingleRows; sr++) {
            const rowY = y + ts * (0.24 + sr * 0.07);
            const rowLeft = cx - ts * (0.08 + sr * 0.14);
            const rowRight = cx + ts * (0.08 + sr * 0.14);
            const rowWidth = rowRight - rowLeft;
            const shingleCount = 3 + sr * 2;
            const sw = rowWidth / shingleCount;

            for (let si = 0; si < shingleCount; si++) {
                const shadeOff = ((sr + si) % 3) * 8;
                ctx.fillStyle = `rgb(${110 + shadeOff},${48 + shadeOff},${14 + shadeOff})`;
                const sx2 = rowLeft + si * sw;
                ctx.beginPath();
                ctx.moveTo(sx2, rowY);
                ctx.lineTo(sx2 + sw * 0.5, rowY + ts * 0.065);
                ctx.lineTo(sx2 + sw, rowY);
                ctx.closePath();
                ctx.fill();
            }
        }

        // Roof ridge highlight
        ctx.strokeStyle = 'rgba(180,100,40,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, y + ts * 0.18);
        ctx.lineTo(x + ts * 0.15, y + ts * 0.42);
        ctx.stroke();

        // Roof shadow on right side
        ctx.fillStyle = 'rgba(40,15,5,0.2)';
        ctx.beginPath();
        ctx.moveTo(cx, y + ts * 0.18);
        ctx.lineTo(cx, y + ts * 0.44);
        ctx.lineTo(x + ts, y + ts * 0.44);
        ctx.closePath();
        ctx.fill();

        // "HERO" nameplate
        ctx.fillStyle = '#c4944a';
        ctx.beginPath();
        ctx.roundRect(cx - ts * 0.16, y + ts * 0.44, ts * 0.32, ts * 0.075, 1);
        ctx.fill();
        // Nameplate border
        ctx.strokeStyle = '#8a6530';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.roundRect(cx - ts * 0.16, y + ts * 0.44, ts * 0.32, ts * 0.075, 1);
        ctx.stroke();
        // "HERO" text
        ctx.fillStyle = '#4a2a10';
        ctx.font = `bold ${Math.max(5, ts * 0.12)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('HERO', cx, y + ts * 0.478);

        // Front step
        ctx.fillStyle = '#a0785a';
        ctx.fillRect(cx - ts * 0.2, y + ts * 0.92, ts * 0.4, ts * 0.06);
        ctx.fillStyle = 'rgba(180,140,100,0.3)';
        ctx.fillRect(cx - ts * 0.2, y + ts * 0.92, ts * 0.4, ts * 0.02);

        // Paw prints on step (tiny detail)
        ctx.fillStyle = 'rgba(80,50,25,0.2)';
        ctx.beginPath();
        ctx.arc(cx - ts * 0.05, y + ts * 0.94, ts * 0.015, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + ts * 0.06, y + ts * 0.95, ts * 0.012, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawFountain(ctx, x, y, ts) {
        const cx = x + ts * 0.5;

        // Outer base rim - ornate stone
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.ellipse(cx, y + ts * 0.72, ts * 0.48, ts * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        // Base rim highlight
        ctx.fillStyle = 'rgba(180,180,180,0.3)';
        ctx.beginPath();
        ctx.ellipse(cx, y + ts * 0.7, ts * 0.47, ts * 0.2, 0, Math.PI * 1.1, Math.PI * 1.9);
        ctx.fill();
        // Base rim shadow
        ctx.fillStyle = 'rgba(40,40,40,0.25)';
        ctx.beginPath();
        ctx.ellipse(cx, y + ts * 0.74, ts * 0.47, ts * 0.2, 0, 0, Math.PI);
        ctx.fill();

        // Inner basin wall
        ctx.fillStyle = '#757575';
        ctx.beginPath();
        ctx.ellipse(cx, y + ts * 0.68, ts * 0.42, ts * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Water in lower basin
        const wave = Math.sin(this.time * 2.5);
        ctx.fillStyle = '#4db8e8';
        ctx.beginPath();
        ctx.ellipse(cx, y + ts * 0.65, ts * 0.36, ts * 0.14, 0, 0, Math.PI * 2);
        ctx.fill();
        // Water shimmer
        ctx.fillStyle = `rgba(150,220,255,${0.25 + wave * 0.1})`;
        ctx.beginPath();
        ctx.ellipse(cx - ts * 0.08, y + ts * 0.63, ts * 0.12, ts * 0.05, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Middle tier (second bowl)
        ctx.fillStyle = '#8a8a8a';
        ctx.beginPath();
        ctx.ellipse(cx, y + ts * 0.48, ts * 0.22, ts * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        // Middle tier wall
        ctx.fillStyle = '#7a7a7a';
        ctx.fillRect(cx - ts * 0.18, y + ts * 0.38, ts * 0.36, ts * 0.12);
        // Water in middle tier
        ctx.fillStyle = '#5cc8f0';
        ctx.beginPath();
        ctx.ellipse(cx, y + ts * 0.44, ts * 0.16, ts * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();

        // Center pillar (ornate)
        ctx.fillStyle = '#909090';
        ctx.fillRect(cx - ts * 0.06, y + ts * 0.15, ts * 0.12, ts * 0.3);
        // Pillar detail lines
        ctx.strokeStyle = 'rgba(60,60,60,0.3)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(cx - ts * 0.06, y + ts * 0.22);
        ctx.lineTo(cx + ts * 0.06, y + ts * 0.22);
        ctx.moveTo(cx - ts * 0.06, y + ts * 0.32);
        ctx.lineTo(cx + ts * 0.06, y + ts * 0.32);
        ctx.stroke();
        // Pillar highlight
        ctx.fillStyle = 'rgba(200,200,200,0.2)';
        ctx.fillRect(cx - ts * 0.05, y + ts * 0.16, ts * 0.04, ts * 0.28);

        // Dog statue on top!
        ctx.fillStyle = '#a0a0a0';
        // Dog body (sitting pose)
        ctx.beginPath();
        ctx.ellipse(cx, y + ts * 0.11, ts * 0.07, ts * 0.05, 0, 0, Math.PI * 2);
        ctx.fill();
        // Dog head
        ctx.beginPath();
        ctx.arc(cx, y + ts * 0.04, ts * 0.045, 0, Math.PI * 2);
        ctx.fill();
        // Dog ears
        ctx.fillStyle = '#959595';
        ctx.beginPath();
        ctx.ellipse(cx - ts * 0.04, y + ts * 0.02, ts * 0.02, ts * 0.03, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + ts * 0.04, y + ts * 0.02, ts * 0.02, ts * 0.03, 0.4, 0, Math.PI * 2);
        ctx.fill();
        // Dog snout
        ctx.fillStyle = '#8a8a8a';
        ctx.beginPath();
        ctx.ellipse(cx, y + ts * 0.055, ts * 0.02, ts * 0.012, 0, 0, Math.PI * 2);
        ctx.fill();
        // Statue highlight
        ctx.fillStyle = 'rgba(200,200,210,0.3)';
        ctx.beginPath();
        ctx.arc(cx - ts * 0.015, y + ts * 0.03, ts * 0.02, 0, Math.PI * 2);
        ctx.fill();

        // Cascading water from top
        const spray = Math.sin(this.time * 4) * 0.04;
        // Water arcing from statue down to middle tier
        ctx.strokeStyle = `rgba(100,200,255,${0.45 + spray})`;
        ctx.lineWidth = 1.2;
        ctx.lineCap = 'round';
        for (let i = 0; i < 4; i++) {
            const angle = this.time * 2.5 + i * Math.PI * 0.5;
            const dropX = Math.cos(angle) * ts * 0.12;
            ctx.beginPath();
            ctx.moveTo(cx, y + ts * 0.14);
            ctx.quadraticCurveTo(cx + dropX, y + ts * 0.25, cx + dropX * 0.8, y + ts * 0.42);
            ctx.stroke();
        }

        // Water cascading from middle tier to lower basin
        ctx.strokeStyle = `rgba(100,200,255,${0.35 + spray})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            const angle = this.time * 2 + i * Math.PI / 3;
            const dropX = Math.cos(angle) * ts * 0.2;
            const dropY = Math.sin(angle) * ts * 0.04;
            ctx.beginPath();
            ctx.moveTo(cx + dropX * 0.6, y + ts * 0.47);
            ctx.quadraticCurveTo(cx + dropX, y + ts * 0.55 + dropY, cx + dropX * 0.9, y + ts * 0.62);
            ctx.stroke();
        }

        // Splash droplets around basin
        ctx.fillStyle = 'rgba(120,210,255,0.5)';
        for (let i = 0; i < 5; i++) {
            const angle = this.time * 3 + i * 1.26;
            const dr = ts * (0.3 + Math.sin(angle * 0.7) * 0.05);
            const dx = Math.cos(angle) * dr;
            const dy = Math.sin(angle) * dr * 0.4;
            const dropSize = 1 + Math.sin(angle + this.time) * 0.5;
            ctx.beginPath();
            ctx.arc(cx + dx, y + ts * 0.62 + dy, dropSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ripple rings on water surface
        const rippleT = (this.time * 1.5) % (Math.PI * 2);
        const rippleAlpha = 0.2 * (1 - rippleT / (Math.PI * 2));
        ctx.strokeStyle = `rgba(200,240,255,${rippleAlpha})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.ellipse(cx, y + ts * 0.64, ts * 0.1 + rippleT * ts * 0.04, ts * 0.04 + rippleT * ts * 0.015, 0, 0, Math.PI * 2);
        ctx.stroke();
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
        // FF7-style directional shadows with soft edges
        // Shadow direction based on time of day (sun angle)
        const t = this.dayTime;
        let shadowAngle, shadowLength, shadowAlpha;
        if (t < 0.25 || t > 0.85) {
            // Night: multiple soft ambient shadows
            shadowAngle = 0; shadowLength = 0.15; shadowAlpha = 0.12;
        } else if (t < 0.4) {
            // Morning: shadows cast to the left (sun from east)
            shadowAngle = -0.4; shadowLength = 0.6; shadowAlpha = 0.2;
        } else if (t < 0.6) {
            // Midday: short shadows
            shadowAngle = 0; shadowLength = 0.2; shadowAlpha = 0.22;
        } else {
            // Evening: long shadows to the right (sun from west)
            shadowAngle = 0.5; shadowLength = 0.7; shadowAlpha = 0.25;
        }

        const offX = Math.sin(shadowAngle) * ts * shadowLength;
        const offY = ts * 0.15 + Math.abs(shadowLength) * ts * 0.1;

        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                const obj = this.objects[r * this.mapW + c];
                if (obj === OBJ.TREE_OAK || obj === OBJ.TREE_PINE) {
                    const sx = c * ts + ts * 0.5 + offX;
                    const sy = r * ts + ts * 0.85 + offY * 0.3;
                    // Multi-layer shadow for softness
                    ctx.fillStyle = `rgba(0,0,20,${shadowAlpha * 0.4})`;
                    ctx.beginPath();
                    ctx.ellipse(sx, sy, ts * 0.6, ts * 0.2, shadowAngle * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = `rgba(0,0,20,${shadowAlpha})`;
                    ctx.beginPath();
                    ctx.ellipse(sx, sy, ts * 0.4, ts * 0.13, shadowAngle * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                } else if (obj === OBJ.STATUE || obj === OBJ.WELL || obj === OBJ.FOUNTAIN) {
                    ctx.fillStyle = `rgba(0,0,20,${shadowAlpha * 0.5})`;
                    ctx.beginPath();
                    ctx.ellipse(c * ts + ts * 0.6 + offX * 0.7, r * ts + ts * 0.88, ts * 0.4, ts * 0.14, shadowAngle * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = `rgba(0,0,20,${shadowAlpha})`;
                    ctx.beginPath();
                    ctx.ellipse(c * ts + ts * 0.55 + offX * 0.5, r * ts + ts * 0.85, ts * 0.3, ts * 0.1, shadowAngle * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                } else if (obj === OBJ.BARREL || obj === OBJ.CRATE) {
                    ctx.fillStyle = `rgba(0,0,20,${shadowAlpha})`;
                    ctx.beginPath();
                    ctx.ellipse(c * ts + ts * 0.55 + offX * 0.4, r * ts + ts * 0.9, ts * 0.2, ts * 0.07, shadowAngle * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                } else if (obj === OBJ.LAMP) {
                    ctx.fillStyle = `rgba(0,0,20,${shadowAlpha * 0.6})`;
                    ctx.beginPath();
                    ctx.ellipse(c * ts + ts * 0.5 + offX * 0.3, r * ts + ts * 0.92, ts * 0.12, ts * 0.05, shadowAngle * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                } else if (obj === OBJ.BENCH || obj === OBJ.SIGN) {
                    ctx.fillStyle = `rgba(0,0,20,${shadowAlpha * 0.7})`;
                    ctx.beginPath();
                    ctx.ellipse(c * ts + ts * 0.5 + offX * 0.4, r * ts + ts * 0.9, ts * 0.25, ts * 0.06, shadowAngle * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Building wall shadows (ambient occlusion at base of walls)
        ctx.fillStyle = `rgba(0,0,20,${shadowAlpha * 0.4})`;
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                const tile = this.tiles[r * this.mapW + c];
                if (tile === TILE.WALL) {
                    // Check if tile below is NOT a wall (bottom edge)
                    const below = r + 1 < this.mapH ? this.tiles[(r + 1) * this.mapW + c] : -1;
                    if (below !== TILE.WALL && below !== TILE.ROOF) {
                        ctx.fillRect(c * ts, (r + 1) * ts, ts, ts * 0.15);
                    }
                }
            }
        }

        // Player shadow (soft, directional)
        const plsx = this.playerX * ts + ts * 0.5 + offX * 0.3;
        const plsy = this.playerY * ts + ts * 0.92;
        ctx.fillStyle = `rgba(0,0,20,${shadowAlpha * 0.5})`;
        ctx.beginPath();
        ctx.ellipse(plsx, plsy, ts * 0.28, ts * 0.08, shadowAngle * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(0,0,20,${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(plsx, plsy, ts * 0.18, ts * 0.06, shadowAngle * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // NPC shadows
        for (const npc of this.npcs) {
            const nsx = npc.x * ts + ts * 0.5 + offX * 0.3;
            const nsy = npc.y * ts + ts * 0.92;
            ctx.fillStyle = `rgba(0,0,20,${shadowAlpha * 0.5})`;
            ctx.beginPath();
            ctx.ellipse(nsx, nsy, ts * 0.24, ts * 0.07, shadowAngle * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(0,0,20,${shadowAlpha})`;
            ctx.beginPath();
            ctx.ellipse(nsx, nsy, ts * 0.16, ts * 0.05, shadowAngle * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // === PLAYER RENDERING ===

    _renderPlayer(ctx, ts) {
        const x = this.playerX * ts;
        const y = this.playerY * ts;
        const bounce = this.playerMoving ? Math.sin(this.playerAnimFrame) * ts * 0.035 : 0;
        const breathe = Math.sin(this.time * 2.5) * ts * 0.008;
        const earBounce = this.playerMoving ? Math.sin(this.playerAnimFrame * 1.3) * ts * 0.025 : Math.sin(this.time * 1.5) * ts * 0.005;
        const dir = this.playerDir;

        // Slightly chibi/SD proportions: big head, compact body (FF7 field style)
        const cx = x + ts * 0.5;
        const cy = y + ts * 0.58 + bounce + breathe;

        // Shadow circle beneath
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(cx, y + ts * 0.92, ts * 0.22, ts * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();

        // === LEGS (drawn first, behind body) ===
        const legPhase = this.playerMoving ? this.playerAnimFrame : 0;
        const legColor = '#b07828';
        const legColorDark = '#8a5a18';
        ctx.lineCap = 'round';

        if (dir === 0 || dir === 3) {
            // Front/back view - four visible legs
            const lo1 = this.playerMoving ? Math.sin(legPhase) * ts * 0.06 : 0;
            const lo2 = this.playerMoving ? Math.sin(legPhase + Math.PI) * ts * 0.06 : 0;
            // Back legs (drawn first)
            ctx.fillStyle = legColorDark;
            ctx.beginPath();
            ctx.roundRect(cx - ts * 0.17 + lo2, cy + ts * 0.1, ts * 0.08, ts * 0.18 - Math.abs(lo2) * 0.3, 2);
            ctx.fill();
            ctx.beginPath();
            ctx.roundRect(cx + ts * 0.09 + lo1, cy + ts * 0.1, ts * 0.08, ts * 0.18 - Math.abs(lo1) * 0.3, 2);
            ctx.fill();
            // Paws on back legs
            ctx.fillStyle = '#c8a060';
            ctx.beginPath();
            ctx.ellipse(cx - ts * 0.13 + lo2, cy + ts * 0.27, ts * 0.05, ts * 0.02, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx + ts * 0.13 + lo1, cy + ts * 0.27, ts * 0.05, ts * 0.02, 0, 0, Math.PI * 2);
            ctx.fill();
            // Front legs
            ctx.fillStyle = legColor;
            ctx.beginPath();
            ctx.roundRect(cx - ts * 0.14 + lo1, cy + ts * 0.08, ts * 0.09, ts * 0.2 - Math.abs(lo1) * 0.3, 2);
            ctx.fill();
            ctx.beginPath();
            ctx.roundRect(cx + ts * 0.06 + lo2, cy + ts * 0.08, ts * 0.09, ts * 0.2 - Math.abs(lo2) * 0.3, 2);
            ctx.fill();
            // Paws on front legs
            ctx.fillStyle = '#c8a060';
            ctx.beginPath();
            ctx.ellipse(cx - ts * 0.095 + lo1, cy + ts * 0.27, ts * 0.055, ts * 0.022, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx + ts * 0.105 + lo2, cy + ts * 0.27, ts * 0.055, ts * 0.022, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Side view - two visible legs (near and far)
            const lo1 = this.playerMoving ? Math.sin(legPhase) * ts * 0.07 : 0;
            const lo2 = this.playerMoving ? Math.sin(legPhase + Math.PI) * ts * 0.07 : 0;
            const flip = dir === 1 ? -1 : 1;
            // Far leg (behind body)
            ctx.fillStyle = legColorDark;
            ctx.beginPath();
            ctx.roundRect(cx + flip * ts * 0.02, cy + ts * 0.08 + lo2 * 0.5, ts * 0.09, ts * 0.2, 2);
            ctx.fill();
            ctx.fillStyle = '#c8a060';
            ctx.beginPath();
            ctx.ellipse(cx + flip * ts * 0.065, cy + ts * 0.27 + lo2 * 0.3, ts * 0.055, ts * 0.02, 0, 0, Math.PI * 2);
            ctx.fill();
            // Near leg (in front)
            ctx.fillStyle = legColor;
            ctx.beginPath();
            ctx.roundRect(cx - flip * ts * 0.06, cy + ts * 0.08 + lo1 * 0.5, ts * 0.09, ts * 0.2, 2);
            ctx.fill();
            ctx.fillStyle = '#c8a060';
            ctx.beginPath();
            ctx.ellipse(cx - flip * ts * 0.015, cy + ts * 0.27 + lo1 * 0.3, ts * 0.055, ts * 0.02, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // === TAIL (wagging, behind body for down/side views) ===
        const tailWag = Math.sin(this.time * (this.playerMoving ? 8 : 5)) * 0.7;
        ctx.strokeStyle = '#c89540';
        ctx.lineWidth = ts * 0.055;
        ctx.lineCap = 'round';
        let tailBaseX = cx, tailBaseY = cy;
        if (dir === 0) { tailBaseY = cy - ts * 0.12; }
        else if (dir === 3) { tailBaseY = cy + ts * 0.15; }
        else if (dir === 1) { tailBaseX = cx + ts * 0.2; }
        else { tailBaseX = cx - ts * 0.2; }
        ctx.beginPath();
        ctx.moveTo(tailBaseX, tailBaseY);
        ctx.quadraticCurveTo(
            tailBaseX + Math.sin(tailWag) * ts * 0.15,
            tailBaseY - ts * 0.12,
            tailBaseX + Math.sin(tailWag) * ts * 0.2,
            tailBaseY - ts * 0.22
        );
        ctx.stroke();
        // Fluffy tail tip
        ctx.fillStyle = '#d4a858';
        ctx.beginPath();
        ctx.arc(
            tailBaseX + Math.sin(tailWag) * ts * 0.2,
            tailBaseY - ts * 0.22,
            ts * 0.035, 0, Math.PI * 2
        );
        ctx.fill();

        // === BODY (chibi proportioned) ===
        // Main body shape
        ctx.fillStyle = '#d4a054';
        ctx.beginPath();
        ctx.ellipse(cx, cy, ts * 0.22, ts * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Belly lighter area
        ctx.fillStyle = '#e8c880';
        ctx.beginPath();
        ctx.ellipse(cx, cy + ts * 0.04, ts * 0.14, ts * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();

        // === FF7-STYLE GEAR: Vest ===
        if (dir === 0) {
            // Front view vest
            ctx.fillStyle = '#3a5a8a';
            ctx.beginPath();
            ctx.moveTo(cx - ts * 0.18, cy - ts * 0.08);
            ctx.lineTo(cx - ts * 0.2, cy + ts * 0.1);
            ctx.lineTo(cx - ts * 0.05, cy + ts * 0.12);
            ctx.lineTo(cx, cy + ts * 0.06);
            ctx.lineTo(cx + ts * 0.05, cy + ts * 0.12);
            ctx.lineTo(cx + ts * 0.2, cy + ts * 0.1);
            ctx.lineTo(cx + ts * 0.18, cy - ts * 0.08);
            ctx.closePath();
            ctx.fill();
            // Vest trim
            ctx.strokeStyle = '#c8a030';
            ctx.lineWidth = 0.8;
            ctx.stroke();
            // Belt
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(cx - ts * 0.19, cy + ts * 0.04, ts * 0.38, ts * 0.03);
            // Belt buckle
            ctx.fillStyle = '#d4a030';
            ctx.fillRect(cx - ts * 0.03, cy + ts * 0.035, ts * 0.06, ts * 0.035);
        } else if (dir === 3) {
            // Back view vest
            ctx.fillStyle = '#3a5a8a';
            ctx.beginPath();
            ctx.ellipse(cx, cy - ts * 0.02, ts * 0.2, ts * 0.12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#c8a030';
            ctx.lineWidth = 0.8;
            ctx.stroke();
            // Belt from back
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(cx - ts * 0.19, cy + ts * 0.04, ts * 0.38, ts * 0.03);
            // Tiny sword on back!
            ctx.fillStyle = '#888';
            ctx.save();
            ctx.translate(cx + ts * 0.05, cy - ts * 0.15);
            ctx.rotate(0.3);
            ctx.fillRect(-ts * 0.015, 0, ts * 0.03, ts * 0.2);
            // Sword hilt
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(-ts * 0.04, ts * 0.18, ts * 0.08, ts * 0.035);
            // Sword pommel
            ctx.fillStyle = '#d4a030';
            ctx.beginPath();
            ctx.arc(0, ts * 0.22, ts * 0.02, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            // Side view vest + sword
            const flip = dir === 1 ? -1 : 1;
            ctx.fillStyle = '#3a5a8a';
            ctx.beginPath();
            ctx.ellipse(cx, cy - ts * 0.02, ts * 0.18, ts * 0.12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#c8a030';
            ctx.lineWidth = 0.7;
            ctx.stroke();
            // Belt
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(cx - ts * 0.18, cy + ts * 0.04, ts * 0.36, ts * 0.028);
            ctx.fillStyle = '#d4a030';
            ctx.fillRect(cx + flip * ts * 0.08, cy + ts * 0.035, ts * 0.04, ts * 0.03);
            // Sword on back (profile view - just the hilt sticking up)
            ctx.fillStyle = '#888';
            ctx.fillRect(cx - flip * ts * 0.12, cy - ts * 0.18, ts * 0.025, ts * 0.14);
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(cx - flip * ts * 0.14, cy - ts * 0.05, ts * 0.065, ts * 0.025);
        }

        // === HEAD (large chibi head, direction-dependent) ===
        let headX = cx, headY = cy;
        if (dir === 0) { headY = cy - ts * 0.18; }
        else if (dir === 3) { headY = cy - ts * 0.22; }
        else if (dir === 1) { headX = cx - ts * 0.08; headY = cy - ts * 0.18; }
        else { headX = cx + ts * 0.08; headY = cy - ts * 0.18; }

        // Head base (larger for chibi proportions)
        ctx.fillStyle = '#d4a054';
        ctx.beginPath();
        ctx.arc(headX, headY, ts * 0.18, 0, Math.PI * 2);
        ctx.fill();

        // Cheek/muzzle area (lighter)
        if (dir === 0) {
            ctx.fillStyle = '#e0b868';
            ctx.beginPath();
            ctx.ellipse(headX, headY + ts * 0.06, ts * 0.1, ts * 0.07, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (dir !== 3) {
            const flip = dir === 1 ? -1 : 1;
            ctx.fillStyle = '#e0b868';
            ctx.beginPath();
            ctx.ellipse(headX + flip * ts * 0.06, headY + ts * 0.04, ts * 0.09, ts * 0.07, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Floppy ears (beagle-style, with bounce animation)
        ctx.fillStyle = '#a07030';
        if (dir === 0 || dir === 3) {
            // Left floppy ear
            ctx.beginPath();
            ctx.ellipse(headX - ts * 0.16, headY + ts * 0.02 + earBounce, ts * 0.06, ts * 0.13, -0.2, 0, Math.PI * 2);
            ctx.fill();
            // Right floppy ear
            ctx.beginPath();
            ctx.ellipse(headX + ts * 0.16, headY + ts * 0.02 + earBounce, ts * 0.06, ts * 0.13, 0.2, 0, Math.PI * 2);
            ctx.fill();
            // Inner ear color
            ctx.fillStyle = '#c09050';
            ctx.beginPath();
            ctx.ellipse(headX - ts * 0.16, headY + ts * 0.04 + earBounce, ts * 0.035, ts * 0.08, -0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(headX + ts * 0.16, headY + ts * 0.04 + earBounce, ts * 0.035, ts * 0.08, 0.2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const flip = dir === 1 ? -1 : 1;
            // Main visible ear (floppy)
            ctx.beginPath();
            ctx.ellipse(headX + flip * ts * 0.12, headY + ts * 0.02 + earBounce, ts * 0.055, ts * 0.13, flip * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#c09050';
            ctx.beginPath();
            ctx.ellipse(headX + flip * ts * 0.12, headY + ts * 0.04 + earBounce, ts * 0.03, ts * 0.08, flip * 0.3, 0, Math.PI * 2);
            ctx.fill();
            // Far ear (partially visible)
            ctx.fillStyle = '#906828';
            ctx.beginPath();
            ctx.ellipse(headX - flip * ts * 0.06, headY - ts * 0.01 + earBounce, ts * 0.04, ts * 0.08, -flip * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Eyes
        if (dir !== 3) {
            if (dir === 0) {
                // Front-facing eyes
                // Eye whites
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.ellipse(headX - ts * 0.07, headY - ts * 0.03, ts * 0.04, ts * 0.035, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(headX + ts * 0.07, headY - ts * 0.03, ts * 0.04, ts * 0.035, 0, 0, Math.PI * 2);
                ctx.fill();
                // Pupils (FF7-style large expressive)
                ctx.fillStyle = '#1a1a2e';
                ctx.beginPath();
                ctx.arc(headX - ts * 0.065, headY - ts * 0.025, ts * 0.025, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(headX + ts * 0.075, headY - ts * 0.025, ts * 0.025, 0, Math.PI * 2);
                ctx.fill();
                // Eye shine
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(headX - ts * 0.055, headY - ts * 0.035, ts * 0.01, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(headX + ts * 0.085, headY - ts * 0.035, ts * 0.01, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Side view - one visible eye
                const flip = dir === 1 ? -1 : 1;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.ellipse(headX + flip * ts * 0.06, headY - ts * 0.03, ts * 0.04, ts * 0.035, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#1a1a2e';
                ctx.beginPath();
                ctx.arc(headX + flip * ts * 0.07, headY - ts * 0.025, ts * 0.025, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(headX + flip * ts * 0.08, headY - ts * 0.035, ts * 0.01, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Nose
        if (dir === 0) {
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.ellipse(headX, headY + ts * 0.08, ts * 0.035, ts * 0.025, 0, 0, Math.PI * 2);
            ctx.fill();
            // Nose highlight
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.arc(headX - ts * 0.01, headY + ts * 0.075, ts * 0.01, 0, Math.PI * 2);
            ctx.fill();
            // Tiny mouth line
            ctx.strokeStyle = '#8a6030';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(headX, headY + ts * 0.1);
            ctx.lineTo(headX - ts * 0.03, headY + ts * 0.12);
            ctx.moveTo(headX, headY + ts * 0.1);
            ctx.lineTo(headX + ts * 0.03, headY + ts * 0.12);
            ctx.stroke();
        } else if (dir === 3) {
            // Back of head - no nose visible, but show head fur tuft
            ctx.fillStyle = '#c89540';
            ctx.beginPath();
            ctx.ellipse(headX, headY - ts * 0.14, ts * 0.04, ts * 0.03, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const flip = dir === 1 ? -1 : 1;
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.ellipse(headX + flip * ts * 0.15, headY + ts * 0.04, ts * 0.03, ts * 0.022, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.arc(headX + flip * ts * 0.145, headY + ts * 0.035, ts * 0.008, 0, Math.PI * 2);
            ctx.fill();
        }

        // Head fur tuft on top
        ctx.fillStyle = '#c89540';
        ctx.beginPath();
        ctx.moveTo(headX - ts * 0.03, headY - ts * 0.16);
        ctx.quadraticCurveTo(headX, headY - ts * 0.22, headX + ts * 0.02, headY - ts * 0.16);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(headX + ts * 0.01, headY - ts * 0.15);
        ctx.quadraticCurveTo(headX + ts * 0.04, headY - ts * 0.2, headX + ts * 0.05, headY - ts * 0.14);
        ctx.fill();

        // === 1px BLACK OUTLINE around whole sprite ===
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 1;
        ctx.lineJoin = 'round';
        // Head outline
        ctx.beginPath();
        ctx.arc(headX, headY, ts * 0.185, 0, Math.PI * 2);
        ctx.stroke();
        // Body outline
        ctx.beginPath();
        ctx.ellipse(cx, cy, ts * 0.23, ts * 0.17, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    // === NPC RENDERING ===

    _renderNPC(ctx, npc, ts) {
        const x = npc.x * ts;
        const y = npc.y * ts;
        const color = npc.color || '#888';
        const cx = x + ts * 0.5;
        const breathe = Math.sin(npc.animTimer * 2.5) * ts * 0.006;
        const cy = y + ts * 0.55 + breathe;
        const type = (npc.type || 'dog').toLowerCase();

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(cx, y + ts * 0.92, ts * 0.18, ts * 0.05, 0, 0, Math.PI * 2);
        ctx.fill();

        // ---- Draw body based on NPC type ----
        if (type === 'cat') {
            // Cat NPC - sleek body, pointed ears, long tail
            // Tail
            const tailSway = Math.sin(this.time * 2 + npc.origX) * 0.5;
            ctx.strokeStyle = color;
            ctx.lineWidth = ts * 0.04;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(cx, cy + ts * 0.05);
            ctx.quadraticCurveTo(
                cx + ts * 0.25, cy - ts * 0.1,
                cx + ts * 0.2 + Math.sin(tailSway) * ts * 0.1, cy - ts * 0.25
            );
            ctx.stroke();

            // Body (sleek, smaller)
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(cx, cy, ts * 0.18, ts * 0.13, 0, 0, Math.PI * 2);
            ctx.fill();

            // Belly
            const colArr = this._parseColor(color);
            ctx.fillStyle = `rgba(${Math.min(255, colArr[0] + 40)},${Math.min(255, colArr[1] + 40)},${Math.min(255, colArr[2] + 40)},0.5)`;
            ctx.beginPath();
            ctx.ellipse(cx, cy + ts * 0.03, ts * 0.1, ts * 0.06, 0, 0, Math.PI * 2);
            ctx.fill();

            // Legs (thin)
            ctx.fillStyle = color;
            ctx.fillRect(cx - ts * 0.12, cy + ts * 0.08, ts * 0.05, ts * 0.14);
            ctx.fillRect(cx + ts * 0.07, cy + ts * 0.08, ts * 0.05, ts * 0.14);

            // Head
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(cx, cy - ts * 0.14, ts * 0.12, 0, Math.PI * 2);
            ctx.fill();

            // Pointed ears
            ctx.beginPath();
            ctx.moveTo(cx - ts * 0.1, cy - ts * 0.2);
            ctx.lineTo(cx - ts * 0.14, cy - ts * 0.34);
            ctx.lineTo(cx - ts * 0.03, cy - ts * 0.22);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx + ts * 0.1, cy - ts * 0.2);
            ctx.lineTo(cx + ts * 0.14, cy - ts * 0.34);
            ctx.lineTo(cx + ts * 0.03, cy - ts * 0.22);
            ctx.closePath();
            ctx.fill();
            // Inner ear
            ctx.fillStyle = '#e8a0a0';
            ctx.beginPath();
            ctx.moveTo(cx - ts * 0.08, cy - ts * 0.21);
            ctx.lineTo(cx - ts * 0.12, cy - ts * 0.3);
            ctx.lineTo(cx - ts * 0.04, cy - ts * 0.22);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx + ts * 0.08, cy - ts * 0.21);
            ctx.lineTo(cx + ts * 0.12, cy - ts * 0.3);
            ctx.lineTo(cx + ts * 0.04, cy - ts * 0.22);
            ctx.closePath();
            ctx.fill();

            // Cat eyes (slitted)
            ctx.fillStyle = '#aade50';
            ctx.beginPath();
            ctx.ellipse(cx - ts * 0.05, cy - ts * 0.15, ts * 0.03, ts * 0.025, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx + ts * 0.05, cy - ts * 0.15, ts * 0.03, ts * 0.025, 0, 0, Math.PI * 2);
            ctx.fill();
            // Slit pupils
            ctx.fillStyle = '#111';
            ctx.fillRect(cx - ts * 0.053, cy - ts * 0.16, ts * 0.01, ts * 0.025);
            ctx.fillRect(cx + ts * 0.047, cy - ts * 0.16, ts * 0.01, ts * 0.025);

            // Nose + whiskers
            ctx.fillStyle = '#e8a0a0';
            ctx.beginPath();
            ctx.ellipse(cx, cy - ts * 0.1, ts * 0.018, ts * 0.012, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 0.4;
            // Whiskers
            ctx.beginPath();
            ctx.moveTo(cx - ts * 0.02, cy - ts * 0.09);
            ctx.lineTo(cx - ts * 0.14, cy - ts * 0.11);
            ctx.moveTo(cx - ts * 0.02, cy - ts * 0.08);
            ctx.lineTo(cx - ts * 0.13, cy - ts * 0.07);
            ctx.moveTo(cx + ts * 0.02, cy - ts * 0.09);
            ctx.lineTo(cx + ts * 0.14, cy - ts * 0.11);
            ctx.moveTo(cx + ts * 0.02, cy - ts * 0.08);
            ctx.lineTo(cx + ts * 0.13, cy - ts * 0.07);
            ctx.stroke();

        } else if (type === 'bird') {
            // Bird NPC - round body, beak, wing, tail feathers
            const wingFlap = Math.sin(this.time * 4 + npc.origX) * 0.15;

            // Tail feathers
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(cx + ts * 0.12, cy + ts * 0.02);
            ctx.lineTo(cx + ts * 0.28, cy - ts * 0.08);
            ctx.lineTo(cx + ts * 0.25, cy + ts * 0.04);
            ctx.lineTo(cx + ts * 0.3, cy + ts * 0.0);
            ctx.lineTo(cx + ts * 0.2, cy + ts * 0.08);
            ctx.closePath();
            ctx.fill();

            // Body (round, compact)
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(cx, cy, ts * 0.16, ts * 0.14, 0, 0, Math.PI * 2);
            ctx.fill();

            // Breast (lighter)
            const colArr = this._parseColor(color);
            ctx.fillStyle = `rgba(${Math.min(255, colArr[0] + 50)},${Math.min(255, colArr[1] + 50)},${Math.min(255, colArr[2] + 30)},0.6)`;
            ctx.beginPath();
            ctx.ellipse(cx - ts * 0.03, cy + ts * 0.03, ts * 0.09, ts * 0.08, 0, 0, Math.PI * 2);
            ctx.fill();

            // Wing
            ctx.fillStyle = `rgba(${Math.max(0, colArr[0] - 20)},${Math.max(0, colArr[1] - 20)},${Math.max(0, colArr[2] - 10)},0.8)`;
            ctx.beginPath();
            ctx.ellipse(cx + ts * 0.06, cy - ts * 0.02 + wingFlap * ts, ts * 0.1, ts * 0.12, 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Legs (thin, stick-like)
            ctx.strokeStyle = '#8a6530';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - ts * 0.05, cy + ts * 0.12);
            ctx.lineTo(cx - ts * 0.06, cy + ts * 0.22);
            ctx.moveTo(cx + ts * 0.05, cy + ts * 0.12);
            ctx.lineTo(cx + ts * 0.06, cy + ts * 0.22);
            ctx.stroke();

            // Head
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(cx - ts * 0.08, cy - ts * 0.14, ts * 0.1, 0, Math.PI * 2);
            ctx.fill();

            // Eye
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(cx - ts * 0.12, cy - ts * 0.16, ts * 0.02, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(cx - ts * 0.125, cy - ts * 0.165, ts * 0.007, 0, Math.PI * 2);
            ctx.fill();

            // Beak
            ctx.fillStyle = '#e8a030';
            ctx.beginPath();
            ctx.moveTo(cx - ts * 0.16, cy - ts * 0.13);
            ctx.lineTo(cx - ts * 0.25, cy - ts * 0.11);
            ctx.lineTo(cx - ts * 0.16, cy - ts * 0.09);
            ctx.closePath();
            ctx.fill();

        } else {
            // Dog NPC (default) - various breeds based on NPC properties
            const breed = npc.breed || 'default';

            // Legs
            const walkAnim = npc.targetX !== undefined ? Math.sin(npc.animFrame) * ts * 0.04 : 0;
            ctx.fillStyle = color;
            ctx.fillRect(cx - ts * 0.14, cy + ts * 0.08 + walkAnim, ts * 0.07, ts * 0.16);
            ctx.fillRect(cx + ts * 0.07, cy + ts * 0.08 - walkAnim, ts * 0.07, ts * 0.16);

            // Body
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(cx, cy, ts * 0.2, ts * 0.14, 0, 0, Math.PI * 2);
            ctx.fill();

            // Belly highlight
            const colArr = this._parseColor(color);
            ctx.fillStyle = `rgba(${Math.min(255, colArr[0] + 35)},${Math.min(255, colArr[1] + 35)},${Math.min(255, colArr[2] + 35)},0.4)`;
            ctx.beginPath();
            ctx.ellipse(cx, cy + ts * 0.04, ts * 0.12, ts * 0.07, 0, 0, Math.PI * 2);
            ctx.fill();

            // Tail
            const tailWag = Math.sin(this.time * 5 + npc.origX * 2) * 0.5;
            ctx.strokeStyle = color;
            ctx.lineWidth = ts * 0.04;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(cx + ts * 0.18, cy - ts * 0.02);
            ctx.quadraticCurveTo(
                cx + ts * 0.28, cy - ts * 0.1 + Math.sin(tailWag) * ts * 0.08,
                cx + ts * 0.22, cy - ts * 0.2
            );
            ctx.stroke();

            // Head
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(cx - ts * 0.05, cy - ts * 0.14, ts * 0.13, 0, Math.PI * 2);
            ctx.fill();

            // Breed-specific features
            if (breed === 'poodle') {
                // Curly fur puffs
                ctx.fillStyle = color;
                for (let p = 0; p < 5; p++) {
                    const pa = p * Math.PI * 0.4;
                    ctx.beginPath();
                    ctx.arc(
                        cx - ts * 0.05 + Math.cos(pa) * ts * 0.12,
                        cy - ts * 0.14 + Math.sin(pa) * ts * 0.12,
                        ts * 0.05, 0, Math.PI * 2
                    );
                    ctx.fill();
                }
                // Poodle ear puffs
                ctx.beginPath();
                ctx.arc(cx - ts * 0.18, cy - ts * 0.1, ts * 0.06, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx + ts * 0.08, cy - ts * 0.1, ts * 0.06, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Default dog ears (floppy)
                const earDark = `rgba(${Math.max(0, colArr[0] - 30)},${Math.max(0, colArr[1] - 30)},${Math.max(0, colArr[2] - 20)},1)`;
                ctx.fillStyle = earDark;
                ctx.beginPath();
                ctx.ellipse(cx - ts * 0.16, cy - ts * 0.1, ts * 0.05, ts * 0.1, -0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(cx + ts * 0.06, cy - ts * 0.12, ts * 0.05, ts * 0.1, 0.3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Eyes
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(cx - ts * 0.08, cy - ts * 0.16, ts * 0.025, ts * 0.022, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx - ts * 0.02, cy - ts * 0.16, ts * 0.025, ts * 0.022, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(cx - ts * 0.075, cy - ts * 0.155, ts * 0.015, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx - ts * 0.015, cy - ts * 0.155, ts * 0.015, 0, Math.PI * 2);
            ctx.fill();

            // Nose
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.ellipse(cx - ts * 0.05, cy - ts * 0.06, ts * 0.025, ts * 0.015, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // === NPC outfit/accessory based on role ===
        const role = npc.role || '';
        if (role === 'shopkeeper') {
            // Apron
            ctx.fillStyle = 'rgba(220,220,220,0.6)';
            ctx.fillRect(cx - ts * 0.12, cy - ts * 0.02, ts * 0.24, ts * 0.16);
            ctx.strokeStyle = 'rgba(180,180,180,0.5)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(cx - ts * 0.12, cy - ts * 0.02, ts * 0.24, ts * 0.16);
        } else if (role === 'guard') {
            // Helmet
            ctx.fillStyle = '#808080';
            const headCy = cy - ts * 0.14;
            ctx.beginPath();
            ctx.arc(type === 'bird' ? cx - ts * 0.08 : cx - ts * 0.05, headCy - ts * 0.02, ts * 0.14, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = 'rgba(160,160,160,0.3)';
            ctx.beginPath();
            ctx.arc(type === 'bird' ? cx - ts * 0.08 : cx - ts * 0.05, headCy - ts * 0.02, ts * 0.13, Math.PI * 1.2, Math.PI * 1.7);
            ctx.fill();
        } else if (role === 'healer') {
            // Red cross on body
            ctx.fillStyle = 'rgba(220,50,50,0.7)';
            ctx.fillRect(cx - ts * 0.02, cy - ts * 0.06, ts * 0.04, ts * 0.12);
            ctx.fillRect(cx - ts * 0.06, cy - ts * 0.02, ts * 0.12, ts * 0.04);
        } else if (role === 'elder') {
            // Wise hat/robe collar
            ctx.fillStyle = '#6a3a9a';
            ctx.beginPath();
            const headCy = cy - ts * 0.14;
            ctx.moveTo(cx - ts * 0.05, headCy - ts * 0.12);
            ctx.lineTo(cx - ts * 0.05, headCy - ts * 0.25);
            ctx.lineTo(cx + ts * 0.05, headCy - ts * 0.12);
            ctx.closePath();
            ctx.fill();
            // Star on hat
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(cx - ts * 0.02, headCy - ts * 0.2, ts * 0.015, 0, Math.PI * 2);
            ctx.fill();
        }

        // === 1px outline ===
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        if (type === 'bird') {
            ctx.ellipse(cx, cy, ts * 0.17, ts * 0.15, 0, 0, Math.PI * 2);
        } else {
            ctx.ellipse(cx, cy, ts * 0.21, ts * 0.15, 0, 0, Math.PI * 2);
        }
        ctx.stroke();

        // === FF7-style speech/interaction indicator ===
        const dist = Math.abs(this.playerX - npc.x) + Math.abs(this.playerY - npc.y);
        if (dist <= 3 && npc.dialogue) {
            const indicatorY = y + ts * 0.05 + Math.sin(this.time * 3) * ts * 0.04;
            const bubbleText = dist <= 2 ? '!' : '...';

            // Speech bubble background
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 0.8;

            const textW = bubbleText === '!' ? ts * 0.14 : ts * 0.25;
            ctx.beginPath();
            ctx.roundRect(cx - textW * 0.5 - ts * 0.04, indicatorY - ts * 0.09, textW + ts * 0.08, ts * 0.15, 3);
            ctx.fill();
            ctx.stroke();

            // Bubble tail (triangle pointing down)
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.beginPath();
            ctx.moveTo(cx - ts * 0.03, indicatorY + ts * 0.055);
            ctx.lineTo(cx, indicatorY + ts * 0.1);
            ctx.lineTo(cx + ts * 0.03, indicatorY + ts * 0.055);
            ctx.closePath();
            ctx.fill();

            // Bubble text
            ctx.fillStyle = dist <= 2 ? '#d43030' : '#555';
            ctx.font = `bold ${Math.max(7, ts * 0.22)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bubbleText, cx, indicatorY);
        }

        // Emoji overlay if specified (after everything)
        if (npc.emoji) {
            ctx.font = `${ts * 0.5}px Arial`;
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

        // --- FF7-STYLE ATMOSPHERIC LIGHTING ---
        // Always apply atmospheric tinting (even during day for that FF7 painted look)

        let tintR, tintG, tintB, tintStrength;

        if (t <= 0.2 || t >= 0.85) {
            // Night: deep mako-infused blue-purple (FF7 signature)
            tintR = 40; tintG = 45; tintB = 90;
            tintStrength = t <= 0.2 ? 1.0 : (t >= 0.9 ? 1.0 : (t - 0.85) / 0.05);
        } else if (t > 0.2 && t <= 0.3) {
            // Dawn: warm lavender with mako green undertone
            const f = (t - 0.2) / 0.1;
            if (f < 0.5) {
                const subF = f / 0.5;
                tintR = Math.round(40 + (180 - 40) * subF);
                tintG = Math.round(45 + (160 - 45) * subF);
                tintB = Math.round(90 + (200 - 90) * subF);
                tintStrength = 1.0 - f * 0.2;
            } else {
                const subF = (f - 0.5) / 0.5;
                tintR = 180; tintG = 160; tintB = 200;
                tintStrength = 0.8 * (1.0 - subF) + 0.15 * subF; // fade to subtle day tint
            }
        } else if (t > 0.3 && t < 0.65) {
            // Day: subtle warm golden atmospheric haze (FF7 pre-rendered background feel)
            tintR = 240; tintG = 225; tintB = 200;
            tintStrength = 0.18; // always-on subtle warmth
        } else if (t >= 0.65 && t < 0.75) {
            // Dusk: rich amber/orange (FF7 Cosmo Canyon vibes)
            const f = (t - 0.65) / 0.1;
            tintR = 220; tintG = 140; tintB = 80;
            tintStrength = 0.18 + f * 0.82; // ramp up from day tint
        } else if (t >= 0.75 && t < 0.85) {
            // Deep dusk: orange-crimson transitioning to mako purple
            const f = (t - 0.75) / 0.1;
            tintR = Math.round(220 + (40 - 220) * f);
            tintG = Math.round(140 + (45 - 140) * f);
            tintB = Math.round(80 + (90 - 80) * f);
            tintStrength = 1.0;
        } else {
            tintR = 240; tintG = 225; tintB = 200;
            tintStrength = 0.15;
        }

        // Compute multiply color
        const mulR = Math.round(255 - (255 - tintR) * tintStrength);
        const mulG = Math.round(255 - (255 - tintG) * tintStrength);
        const mulB = Math.round(255 - (255 - tintB) * tintStrength);

        // Apply colored ambient tint via multiply composite
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';

        // Radial gradient: lighter near player, deeper tint at edges (FF7 spotlight feel)
        const darkGrad = ctx.createRadialGradient(cw / 2, ch / 2, 0, cw / 2, ch / 2, cw * 0.65);
        const edgeMul = tintStrength > 0.5 ? 30 : 15;
        const edgeR = Math.max(0, mulR - Math.round(tintStrength * edgeMul));
        const edgeG = Math.max(0, mulG - Math.round(tintStrength * edgeMul * 1.2));
        const edgeB = Math.max(0, mulB - Math.round(tintStrength * edgeMul * 0.8));
        darkGrad.addColorStop(0, `rgb(${mulR},${mulG},${mulB})`);
        darkGrad.addColorStop(0.5, `rgb(${Math.round((mulR + edgeR) / 2)},${Math.round((mulG + edgeG) / 2)},${Math.round((mulB + edgeB) / 2)})`);
        darkGrad.addColorStop(1, `rgb(${edgeR},${edgeG},${edgeB})`);
        ctx.fillStyle = darkGrad;
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();

        // --- DEPTH HAZE (atmospheric perspective - distant areas are hazier) ---
        ctx.save();
        const hazeStrength = t > 0.3 && t < 0.65 ? 0.06 : (t > 0.2 && t < 0.8 ? 0.1 : 0.15);
        const hazeGrad = ctx.createLinearGradient(0, 0, 0, ch);
        const isNightTime = t < 0.2 || t > 0.85;
        const hazeR = isNightTime ? 20 : 140;
        const hazeG = isNightTime ? 30 : 150;
        const hazeB = isNightTime ? 60 : 180;
        hazeGrad.addColorStop(0, `rgba(${hazeR},${hazeG},${hazeB},${hazeStrength})`);
        hazeGrad.addColorStop(0.4, `rgba(${hazeR},${hazeG},${hazeB},${hazeStrength * 0.3})`);
        hazeGrad.addColorStop(0.7, `rgba(${hazeR},${hazeG},${hazeB},0)`);
        hazeGrad.addColorStop(1, `rgba(${hazeR},${hazeG},${hazeB},0)`);
        ctx.fillStyle = hazeGrad;
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();

        // --- DARKNESS LEVEL for light sources ---
        let darkness;
        if (t < 0.15 || t > 0.9) {
            darkness = 0.75;
        } else if (t < 0.2) {
            darkness = 0.75 - (t - 0.15) / 0.05 * 0.15;
        } else if (t < 0.3) {
            darkness = 0.6 * (1 - (t - 0.2) / 0.1);
        } else if (t < 0.65) {
            darkness = 0.05; // subtle glow even during day (FF7 always has light sources visible)
        } else if (t < 0.75) {
            darkness = 0.05 + 0.55 * ((t - 0.65) / 0.1);
        } else if (t < 0.9) {
            darkness = 0.6 + (t - 0.75) / 0.15 * 0.15;
        } else {
            darkness = 0.75;
        }

        // --- LIGHT SOURCES (additive/screen blend) ---
        if (darkness > 0.02) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';

            const flicker = Math.sin(this.time * 8) * 0.025 + Math.sin(this.time * 13) * 0.015
                          + Math.sin(this.time * 21) * 0.008;

            // Lamp lights with warm FF7 glow
            for (let r = 0; r < this.mapH; r++) {
                for (let c = 0; c < this.mapW; c++) {
                    if (this.objects[r * this.mapW + c] === OBJ.LAMP) {
                        const lx = c * ts + ts * 0.5 - scrollX;
                        const ly = r * ts + ts * 0.3 - scrollY;
                        if (lx < -150 || lx > cw + 150 || ly < -150 || ly > ch + 150) continue;

                        const intensity = darkness * (0.65 + flicker);
                        const radius = ts * 4.5;
                        const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, radius);
                        // Warm core fading to amber edges
                        grad.addColorStop(0, `rgba(255,230,140,${intensity})`);
                        grad.addColorStop(0.1, `rgba(255,215,100,${intensity * 0.85})`);
                        grad.addColorStop(0.25, `rgba(255,195,70,${intensity * 0.5})`);
                        grad.addColorStop(0.5, `rgba(255,170,50,${intensity * 0.2})`);
                        grad.addColorStop(0.75, `rgba(255,150,40,${intensity * 0.06})`);
                        grad.addColorStop(1, 'rgba(255,140,30,0)');
                        ctx.fillStyle = grad;
                        ctx.fillRect(lx - radius, ly - radius, radius * 2, radius * 2);

                        // Secondary green-tinted ground glow (mako reflection)
                        if (darkness > 0.3) {
                            const gGrad = ctx.createRadialGradient(lx, ly + ts * 0.5, 0, lx, ly + ts * 0.5, ts * 2);
                            gGrad.addColorStop(0, `rgba(100,255,150,${darkness * 0.04})`);
                            gGrad.addColorStop(1, 'rgba(100,255,150,0)');
                            ctx.fillStyle = gGrad;
                            ctx.fillRect(lx - ts * 2, ly - ts * 1.5, ts * 4, ts * 4);
                        }
                    }
                }
            }

            // Custom light sources with FF7-style smoother gradients
            for (const light of this.lights) {
                const lx = light.x * ts - scrollX;
                const ly = light.y * ts - scrollY;
                if (lx < -200 || lx > cw + 200 || ly < -200 || ly > ch + 200) continue;

                const radius = (light.radius || 4) * ts;
                const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, radius);
                const lc = light.color || '255,200,100';
                const li = darkness * 0.6;
                grad.addColorStop(0, `rgba(${lc},${li})`);
                grad.addColorStop(0.2, `rgba(${lc},${li * 0.65})`);
                grad.addColorStop(0.45, `rgba(${lc},${li * 0.3})`);
                grad.addColorStop(0.7, `rgba(${lc},${li * 0.1})`);
                grad.addColorStop(1, `rgba(${lc},0)`);
                ctx.fillStyle = grad;
                ctx.fillRect(lx - radius, ly - radius, radius * 2, radius * 2);
            }

            // Window glow - warmer, with light spill
            for (let r = 0; r < this.mapH; r++) {
                for (let c = 0; c < this.mapW; c++) {
                    if (this.objects[r * this.mapW + c] === OBJ.WINDOW) {
                        const lx = c * ts + ts * 0.5 - scrollX;
                        const ly = r * ts + ts * 0.4 - scrollY;
                        if (lx < -80 || lx > cw + 80 || ly < -80 || ly > ch + 80) continue;

                        const winFlicker = Math.sin(this.time * 3 + c * 2) * 0.04
                                         + Math.sin(this.time * 7 + c * 5) * 0.02;
                        // Main warm glow
                        const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, ts * 2.5);
                        grad.addColorStop(0, `rgba(255,215,120,${darkness * (0.45 + winFlicker)})`);
                        grad.addColorStop(0.2, `rgba(255,200,100,${darkness * (0.3 + winFlicker)})`);
                        grad.addColorStop(0.5, `rgba(255,180,70,${darkness * 0.1})`);
                        grad.addColorStop(1, 'rgba(255,170,60,0)');
                        ctx.fillStyle = grad;
                        ctx.fillRect(lx - ts * 2.5, ly - ts * 2.5, ts * 5, ts * 5);

                        // Light spill downward (light pouring from window)
                        if (darkness > 0.3) {
                            const spillGrad = ctx.createRadialGradient(lx, ly + ts, 0, lx, ly + ts * 2, ts * 1.5);
                            spillGrad.addColorStop(0, `rgba(255,210,100,${darkness * 0.12})`);
                            spillGrad.addColorStop(1, 'rgba(255,200,80,0)');
                            ctx.fillStyle = spillGrad;
                            ctx.fillRect(lx - ts * 1.5, ly, ts * 3, ts * 3);
                        }
                    }
                }
            }

            // Player glow aura (always visible, stronger at night)
            const playerGlowIntensity = Math.max(darkness * 0.18, 0.03);
            const plx = this.playerX * ts + ts * 0.5 - scrollX;
            const ply = this.playerY * ts + ts * 0.5 - scrollY;
            const pGrad = ctx.createRadialGradient(plx, ply, 0, plx, ply, ts * 2);
            pGrad.addColorStop(0, `rgba(255,240,200,${playerGlowIntensity})`);
            pGrad.addColorStop(0.3, `rgba(255,225,170,${playerGlowIntensity * 0.5})`);
            pGrad.addColorStop(0.7, `rgba(255,210,140,${playerGlowIntensity * 0.15})`);
            pGrad.addColorStop(1, 'rgba(255,200,120,0)');
            ctx.fillStyle = pGrad;
            ctx.fillRect(plx - ts * 2, ply - ts * 2, ts * 4, ts * 4);

            ctx.restore();
        }

        // --- FF7 MAKO COLOR GRADING (subtle green/cyan shift) ---
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        const makoStrength = isNightTime ? 0.06 : 0.025;
        ctx.fillStyle = `rgba(0,255,136,${makoStrength})`;
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();
    }

    // === VIGNETTE ===

    _renderVignette(ctx, cw, ch) {
        const t = this.dayTime;

        // Stronger FF7-style vignette (heavy dark edges, like a camera lens)
        let tintR, tintG, tintB, vignetteStrength;
        if (t < 0.25 || t > 0.85) {
            // Night - deep blue-black vignette
            tintR = 5; tintG = 8; tintB = 25;
            vignetteStrength = 0.55;
        } else if (t < 0.35) {
            // Dawn - warm amber vignette
            tintR = 30; tintG = 15; tintB = 5;
            vignetteStrength = 0.4;
        } else if (t < 0.7) {
            // Day - subtle warm vignette
            tintR = 10; tintG = 8; tintB = 5;
            vignetteStrength = 0.3;
        } else {
            // Dusk - deep amber/crimson vignette
            tintR = 35; tintG = 12; tintB = 5;
            vignetteStrength = 0.5;
        }

        // Main vignette - tighter center, darker edges (FF7 camera feel)
        const grad = ctx.createRadialGradient(cw / 2, ch / 2, cw * 0.15, cw / 2, ch / 2, cw * 0.65);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.4, `rgba(${tintR},${tintG},${tintB},0)`);
        grad.addColorStop(0.7, `rgba(${tintR},${tintG},${tintB},${vignetteStrength * 0.3})`);
        grad.addColorStop(0.9, `rgba(${tintR},${tintG},${tintB},${vignetteStrength * 0.6})`);
        grad.addColorStop(1, `rgba(${tintR},${tintG},${tintB},${vignetteStrength})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);

        // Warm color wash
        ctx.fillStyle = `rgba(${tintR},${tintG},${tintB},0.05)`;
        ctx.fillRect(0, 0, cw, ch);
    }

    // === PS1 POST-PROCESS ===

    _applyPS1PostProcess(ctx, cw, ch) {
        // Generate dither overlay on first call, cache for reuse
        if (!this._ditherPattern) {
            const dc = document.createElement('canvas');
            dc.width = 4; dc.height = 4;
            const dctx = dc.getContext('2d');
            // 4x4 Bayer matrix pattern
            const bayer = [
                [0, 8, 2, 10],
                [12, 4, 14, 6],
                [3, 11, 1, 9],
                [15, 7, 13, 5]
            ];
            const imgData = dctx.createImageData(4, 4);
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 4; x++) {
                    const i = (y * 4 + x) * 4;
                    const v = Math.floor(bayer[y][x] * 16); // 0-255 range
                    imgData.data[i] = v;
                    imgData.data[i + 1] = v;
                    imgData.data[i + 2] = v;
                    imgData.data[i + 3] = 8; // Very subtle
                }
            }
            dctx.putImageData(imgData, 0, 0);
            this._ditherPattern = dc;
        }

        // Scanlines (subtle darkening of every other row)
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.03)';
        for (let y = 0; y < ch; y += 2) {
            ctx.fillRect(0, y, cw, 1);
        }
        ctx.restore();

        // Dither pattern overlay
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.04;
        const pattern = ctx.createPattern(this._ditherPattern, 'repeat');
        if (pattern) {
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, cw, ch);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // === SCREEN TRANSITIONS (FF7-style fade to black) ===

    _renderTransition(ctx, cw, ch) {
        if (!this._transitionAlpha || this._transitionAlpha <= 0) return;
        ctx.save();
        ctx.fillStyle = `rgba(0,0,0,${this._transitionAlpha})`;
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();
    }

    fadeOut(duration, callback) {
        this._transitionAlpha = 0;
        this._transitionDir = 1; // fading out (to black)
        this._transitionSpeed = 1 / (duration || 0.5);
        this._transitionCallback = callback;
    }

    fadeIn(duration) {
        this._transitionAlpha = 1;
        this._transitionDir = -1; // fading in (from black)
        this._transitionSpeed = 1 / (duration || 0.5);
        this._transitionCallback = null;
    }

    // === PARTICLES ===

    _initParticles() {
        this.particles = [];
        // FF7-style rich particle atmosphere
        // Mako motes (signature FF7 green-tinted floating lights)
        for (let i = 0; i < 25; i++) {
            this.particles.push(this._createParticle('mote'));
        }
        // Sparkle particles (more for magical feel)
        for (let i = 0; i < 18; i++) {
            this.particles.push(this._createParticle('sparkle'));
        }
        // Dust motes (atmospheric depth)
        for (let i = 0; i < 15; i++) {
            this.particles.push(this._createParticle('dust'));
        }
        // Fog wisps (FF7 signature - slow drifting haze)
        for (let i = 0; i < 12; i++) {
            this.particles.push(this._createParticle('fog'));
        }
        // Fireflies (warm tiny lights, especially at dusk/night)
        for (let i = 0; i < 10; i++) {
            this.particles.push(this._createParticle('firefly'));
        }
        // Embers (tiny rising sparks near buildings)
        for (let i = 0; i < 8; i++) {
            this.particles.push(this._createParticle('ember'));
        }
    }

    _createParticle(type) {
        const base = {
            x: this.playerX + (Math.random() - 0.5) * 24,
            y: this.playerY + (Math.random() - 0.5) * 18,
            life: Math.random() * 6 + 3,
            maxLife: 9,
            type: type || 'mote',
        };

        if (type === 'sparkle') {
            return {
                ...base,
                vx: (Math.random() - 0.5) * 0.15,
                vy: -Math.random() * 0.1 - 0.02,
                size: Math.random() * 1.8 + 0.5,
                alpha: Math.random() * 0.45 + 0.2,
                color: Math.random() > 0.3 ? '#fffde0' : '#c0ffd0', // some mako-green sparkles
                sparklePhase: Math.random() * Math.PI * 2,
                sparkleSpeed: 3 + Math.random() * 4,
            };
        } else if (type === 'dust') {
            return {
                ...base,
                vx: (Math.random() - 0.5) * 0.08,
                vy: Math.random() * 0.05 - 0.02,
                size: Math.random() * 1.8 + 1,
                alpha: Math.random() * 0.14 + 0.05,
                color: Math.random() > 0.5 ? '#e8dcc8' : '#d4c8b0',
                driftPhase: Math.random() * Math.PI * 2,
            };
        } else if (type === 'fog') {
            // FF7-style fog wisps - large, soft, slow-moving
            return {
                ...base,
                x: this.playerX + (Math.random() - 0.5) * 30,
                y: this.playerY + (Math.random() - 0.5) * 22,
                vx: (Math.random() - 0.5) * 0.04,
                vy: (Math.random() - 0.5) * 0.02,
                size: Math.random() * 12 + 6, // large and diffuse
                alpha: Math.random() * 0.06 + 0.02,
                color: Math.random() > 0.5 ? '#c8d8e8' : '#b8c8d8',
                life: Math.random() * 10 + 6,
                maxLife: 16,
                driftPhase: Math.random() * Math.PI * 2,
            };
        } else if (type === 'firefly') {
            // Warm blinking lights
            return {
                ...base,
                vx: (Math.random() - 0.5) * 0.12,
                vy: (Math.random() - 0.5) * 0.08,
                size: Math.random() * 1.2 + 0.4,
                alpha: Math.random() * 0.5 + 0.3,
                color: Math.random() > 0.4 ? '#ffee88' : '#88ffaa', // warm yellow or mako green
                sparklePhase: Math.random() * Math.PI * 2,
                sparkleSpeed: 1.5 + Math.random() * 2.5,
                life: Math.random() * 8 + 4,
                maxLife: 12,
            };
        } else if (type === 'ember') {
            // Tiny rising sparks
            return {
                ...base,
                vx: (Math.random() - 0.5) * 0.2,
                vy: -Math.random() * 0.3 - 0.1,
                size: Math.random() * 0.8 + 0.3,
                alpha: Math.random() * 0.6 + 0.3,
                color: Math.random() > 0.5 ? '#ff8844' : '#ffaa33',
                life: Math.random() * 3 + 1.5,
                maxLife: 4.5,
            };
        } else {
            // Default mote (now with mako green tint chance)
            const isMako = Math.random() > 0.5;
            return {
                ...base,
                vx: (Math.random() - 0.5) * 0.3,
                vy: -Math.random() * 0.2 - 0.05,
                size: Math.random() * 2.5 + 0.5,
                alpha: Math.random() * 0.35 + 0.1,
                color: isMako ? '#88ffbb' : (Math.random() > 0.5 ? '#ffe' : '#dfd'),
            };
        }
    }

    _resetParticle(p) {
        p.x = this.playerX + (Math.random() - 0.5) * (p.type === 'fog' ? 30 : 22);
        p.y = this.playerY + (Math.random() - 0.5) * (p.type === 'fog' ? 22 : 16);
        p.life = p.type === 'fog' ? Math.random() * 10 + 6 :
                 p.type === 'firefly' ? Math.random() * 8 + 4 :
                 p.type === 'ember' ? Math.random() * 3 + 1.5 :
                 Math.random() * 6 + 3;
        p.alpha = p.type === 'dust' ? Math.random() * 0.14 + 0.05 :
                  p.type === 'sparkle' ? Math.random() * 0.45 + 0.2 :
                  p.type === 'fog' ? Math.random() * 0.06 + 0.02 :
                  p.type === 'firefly' ? Math.random() * 0.5 + 0.3 :
                  p.type === 'ember' ? Math.random() * 0.6 + 0.3 :
                  Math.random() * 0.35 + 0.1;

        if (p.type === 'sparkle') {
            p.vx = (Math.random() - 0.5) * 0.15;
            p.vy = -Math.random() * 0.1 - 0.02;
            p.sparklePhase = Math.random() * Math.PI * 2;
        } else if (p.type === 'dust') {
            p.vx = (Math.random() - 0.5) * 0.08;
            p.vy = Math.random() * 0.05 - 0.02;
            p.driftPhase = Math.random() * Math.PI * 2;
        } else if (p.type === 'fog') {
            p.vx = (Math.random() - 0.5) * 0.04;
            p.vy = (Math.random() - 0.5) * 0.02;
            p.driftPhase = Math.random() * Math.PI * 2;
        } else if (p.type === 'firefly') {
            p.vx = (Math.random() - 0.5) * 0.12;
            p.vy = (Math.random() - 0.5) * 0.08;
            p.sparklePhase = Math.random() * Math.PI * 2;
        } else if (p.type === 'ember') {
            p.vx = (Math.random() - 0.5) * 0.2;
            p.vy = -Math.random() * 0.3 - 0.1;
        } else {
            p.vx = (Math.random() - 0.5) * 0.3;
            p.vy = -Math.random() * 0.2 - 0.05;
        }
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

    _parseColor(color) {
        // Parse hex color string to [r, g, b] array
        if (color.startsWith('#')) {
            let hex = color.slice(1);
            if (hex.length === 3) {
                hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
            }
            return [
                parseInt(hex.slice(0, 2), 16),
                parseInt(hex.slice(2, 4), 16),
                parseInt(hex.slice(4, 6), 16)
            ];
        }
        // Fallback for rgb() format
        const match = color.match(/(\d+)/g);
        if (match && match.length >= 3) {
            return [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])];
        }
        return [128, 128, 128]; // default gray
    }

    _buildNoiseTexture() {
        // FF7's pre-rendered backgrounds had subtle grain/noise that made them look painted.
        // Generate a cached noise texture to overlay each frame.
        const w = 256, h = 256;
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        const imgData = ctx.createImageData(w, h);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
            const n = (Math.random() - 0.5) * 20;
            d[i] = 128 + n;
            d[i + 1] = 128 + n;
            d[i + 2] = 128 + n;
            d[i + 3] = 6; // Very subtle
        }
        ctx.putImageData(imgData, 0, 0);
        this._noiseCanvas = c;
    }

    _buildObjectCache() {
        // Object textures will be generated here for richer sprites
        // Currently using real-time drawing; this can be enhanced incrementally
        this._objTextures = {};
    }

    // Render noise overlay for FF7 painted grain effect
    _renderNoiseOverlay(ctx, cw, ch) {
        if (!this._noiseCanvas) return;
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        // Tile the 256x256 noise across the screen
        const pattern = ctx.createPattern(this._noiseCanvas, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();
    }
}
