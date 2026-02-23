// =============================================================================
// cutscene.js — Prologue Victory Cutscene — Dragon Ball Z Anime Style
// =============================================================================
// Plays after the prologue battle victory. Call startPrologueCutscene(canvas).
// Pure canvas rendering, no external images required.
// =============================================================================

'use strict';

// ---------------------------------------------------------------------------
// Cutscene colour palette
// ---------------------------------------------------------------------------
const CS = {
    // Characters
    BUDDY_BODY:   '#8b5e3c',
    BUDDY_CAPE:   '#c83030',
    BUDDY_ARMOR:  '#c0c0c0',
    LUNA_BODY:    '#ffffff',
    LUNA_ROBE:    '#3060c8',
    LUNA_STAFF:   '#f0a830',
    REX_BODY:     '#808080',
    REX_LIGHT:    '#ffffff',
    SHADOW_BODY:  '#2a2a2a',
    SHADOW_EYE:   '#c83030',
    SHADOW_BAND:  '#c83030',
    BOSS_BODY:    '#3a1a4a',
    BOSS_EYE:     '#f8d830',
    BOSS_ARMOR:   '#5a2a6a',
    // FX
    ENERGY_RED:   '#ff2020',
    ENERGY_PURP:  '#a020f0',
    ENERGY_GOLD:  '#f8d830',
    LIGHTNING:    '#e8f0ff',
    SPARK:        '#ffe060',
    WHITE:        '#ffffff',
    BLACK:        '#000000',
};

// ---------------------------------------------------------------------------
// Easing helpers
// ---------------------------------------------------------------------------
function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
}
function lerp(a, b, t) {
    return a + (b - a) * t;
}

// ---------------------------------------------------------------------------
// Particle system
// ---------------------------------------------------------------------------
class Particle {
    constructor(x, y, vx, vy, color, size, life) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 60 * dt; // gravity
        this.life -= dt;
    }
    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    emit(x, y, count, options) {
        for (let i = 0; i < count; i++) {
            const angle = (options.angleMin || 0) + Math.random() * ((options.angleMax || Math.PI * 2) - (options.angleMin || 0));
            const speed = (options.speedMin || 30) + Math.random() * ((options.speedMax || 120) - (options.speedMin || 30));
            const size = (options.sizeMin || 2) + Math.random() * ((options.sizeMax || 6) - (options.sizeMin || 2));
            const life = (options.lifeMin || 0.5) + Math.random() * ((options.lifeMax || 1.5) - (options.lifeMin || 0.5));
            const colors = options.colors || [CS.SPARK];
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(
                x + (Math.random() - 0.5) * (options.spread || 0),
                y + (Math.random() - 0.5) * (options.spread || 0),
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color, size, life
            ));
        }
    }
    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    draw(ctx) {
        for (const p of this.particles) p.draw(ctx);
    }
    clear() {
        this.particles = [];
    }
}

// ---------------------------------------------------------------------------
// Speed-line renderer
// ---------------------------------------------------------------------------
function drawSpeedLines(ctx, cx, cy, count, innerR, outerR, alpha, color) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color || CS.WHITE;
    const step = (Math.PI * 2) / count;
    for (let i = 0; i < count; i++) {
        const angle = i * step;
        const jitter = (Math.random() - 0.5) * step * 0.6;
        ctx.lineWidth = 0.5 + Math.random() * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle + jitter) * innerR, cy + Math.sin(angle + jitter) * innerR);
        ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
        ctx.stroke();
    }
    ctx.restore();
}

// ---------------------------------------------------------------------------
// Lightning bolt renderer
// ---------------------------------------------------------------------------
function drawLightningBolt(ctx, x1, y1, x2, y2, roughness, color) {
    ctx.save();
    ctx.strokeStyle = color || CS.LIGHTNING;
    ctx.shadowBlur = 12;
    ctx.shadowColor = color || CS.LIGHTNING;

    const points = [[x1, y1]];
    const segments = 8;
    for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const mx = lerp(x1, x2, t) + (Math.random() - 0.5) * roughness;
        const my = lerp(y1, y2, t) + (Math.random() - 0.5) * roughness;
        points.push([mx, my]);
    }
    points.push([x2, y2]);

    // Glow pass
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.stroke();

    // Core pass
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.stroke();

    ctx.restore();
}

// ---------------------------------------------------------------------------
// Energy aura renderer
// ---------------------------------------------------------------------------
function drawEnergyAura(ctx, cx, cy, radius, color, t) {
    const rings = 4;
    for (let r = 0; r < rings; r++) {
        const phase = (t * 2 + r * 0.3) % 1;
        const ringR = radius * (0.6 + phase * 0.8);
        const alpha = (1 - phase) * 0.6;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        ctx.lineWidth = 3 - phase * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// ---------------------------------------------------------------------------
// Gradient background helpers
// ---------------------------------------------------------------------------
function bgGradient(ctx, w, h, top, bottom) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, top);
    grad.addColorStop(1, bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
}

function drawStars(ctx, w, h, count, t) {
    ctx.save();
    for (let i = 0; i < count; i++) {
        // Deterministic from seed
        const sx = ((i * 7919 + 13) % 100) / 100 * w;
        const sy = ((i * 6271 + 7) % 100) / 100 * h * 0.7;
        const brightness = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i));
        ctx.globalAlpha = brightness;
        ctx.fillStyle = CS.WHITE;
        ctx.fillRect(sx, sy, 1.5, 1.5);
    }
    ctx.restore();
}

// ---------------------------------------------------------------------------
// Character silhouette renderers
// ---------------------------------------------------------------------------
function drawBuddy(ctx, cx, cy, scale, faceRight) {
    ctx.save();
    ctx.translate(cx, cy);
    if (!faceRight) ctx.scale(-1, 1);
    const s = scale;

    // Cape
    ctx.fillStyle = CS.BUDDY_CAPE;
    ctx.beginPath();
    ctx.moveTo(-s * 12, -s * 30);
    ctx.lineTo(-s * 18, s * 20);
    ctx.lineTo(-s * 2, s * 5);
    ctx.closePath();
    ctx.fill();

    // Body
    ctx.fillStyle = CS.BUDDY_ARMOR;
    ctx.fillRect(-s * 10, -s * 30, s * 20, s * 40);

    // Chest plate
    ctx.fillStyle = CS.BUDDY_BODY;
    ctx.fillRect(-s * 7, -s * 25, s * 14, s * 20);

    // Helmet
    ctx.fillStyle = CS.BUDDY_ARMOR;
    ctx.beginPath();
    ctx.arc(0, -s * 38, s * 14, Math.PI, Math.PI * 2);
    ctx.fillRect(-s * 14, -s * 38, s * 28, s * 12);
    ctx.fill();

    // Visor
    ctx.fillStyle = CS.BLACK;
    ctx.fillRect(-s * 10, -s * 42, s * 20, s * 7);

    // Eyes (glowing)
    ctx.fillStyle = '#60c8ff';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#60c8ff';
    ctx.fillRect(-s * 7, -s * 41, s * 5, s * 5);
    ctx.fillRect(s * 2, -s * 41, s * 5, s * 5);
    ctx.shadowBlur = 0;

    // Sword
    ctx.strokeStyle = CS.BUDDY_ARMOR;
    ctx.lineWidth = s * 3;
    ctx.beginPath();
    ctx.moveTo(s * 14, -s * 20);
    ctx.lineTo(s * 14, s * 25);
    ctx.stroke();
    ctx.fillStyle = CS.BUDDY_BODY;
    ctx.fillRect(s * 8, -s * 5, s * 12, s * 5);

    // Legs
    ctx.fillStyle = CS.BUDDY_ARMOR;
    ctx.fillRect(-s * 9, s * 10, s * 8, s * 25);
    ctx.fillRect(s * 1, s * 10, s * 8, s * 25);

    ctx.restore();
}

function drawLuna(ctx, cx, cy, scale, faceRight) {
    ctx.save();
    ctx.translate(cx, cy);
    if (!faceRight) ctx.scale(-1, 1);
    const s = scale;

    // Robe / skirt
    ctx.fillStyle = CS.LUNA_ROBE;
    ctx.beginPath();
    ctx.moveTo(-s * 14, -s * 10);
    ctx.lineTo(-s * 20, s * 35);
    ctx.lineTo(s * 20, s * 35);
    ctx.lineTo(s * 14, -s * 10);
    ctx.closePath();
    ctx.fill();

    // Body
    ctx.fillStyle = CS.LUNA_BODY;
    ctx.fillRect(-s * 9, -s * 30, s * 18, s * 22);

    // Hood/hair (fluffy poodle)
    ctx.fillStyle = CS.LUNA_BODY;
    for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(i * s * 7, -s * 38, s * 9, 0, Math.PI * 2);
        ctx.fill();
    }
    // Face
    ctx.fillStyle = CS.LUNA_BODY;
    ctx.beginPath();
    ctx.arc(0, -s * 36, s * 12, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = CS.LUNA_ROBE;
    ctx.shadowBlur = 6;
    ctx.shadowColor = CS.LUNA_ROBE;
    ctx.fillRect(-s * 6, -s * 39, s * 4, s * 5);
    ctx.fillRect(s * 2, -s * 39, s * 4, s * 5);
    ctx.shadowBlur = 0;

    // Staff
    ctx.strokeStyle = '#c87020';
    ctx.lineWidth = s * 3;
    ctx.beginPath();
    ctx.moveTo(s * 16, -s * 50);
    ctx.lineTo(s * 10, s * 35);
    ctx.stroke();

    // Staff tip glow
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = CS.LUNA_STAFF;
    ctx.fillStyle = CS.LUNA_STAFF;
    ctx.beginPath();
    ctx.arc(s * 17, -s * 52, s * 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
}

function drawRex(ctx, cx, cy, scale, faceRight) {
    ctx.save();
    ctx.translate(cx, cy);
    if (!faceRight) ctx.scale(-1, 1);
    const s = scale;

    // Big body — no armor
    ctx.fillStyle = CS.REX_BODY;
    ctx.fillRect(-s * 16, -s * 28, s * 32, s * 42);

    // Chest lighter patch
    ctx.fillStyle = CS.REX_LIGHT;
    ctx.fillRect(-s * 8, -s * 20, s * 16, s * 18);

    // Head — big and round husky
    ctx.fillStyle = CS.REX_BODY;
    ctx.beginPath();
    ctx.arc(0, -s * 38, s * 18, 0, Math.PI * 2);
    ctx.fill();
    // White face mask
    ctx.fillStyle = CS.REX_LIGHT;
    ctx.beginPath();
    ctx.arc(0, -s * 34, s * 12, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.fillStyle = CS.REX_BODY;
    ctx.beginPath();
    ctx.moveTo(-s * 15, -s * 50);
    ctx.lineTo(-s * 18, -s * 38);
    ctx.lineTo(-s * 6, -s * 44);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s * 15, -s * 50);
    ctx.lineTo(s * 18, -s * 38);
    ctx.lineTo(s * 6, -s * 44);
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#38b8f8';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#38b8f8';
    ctx.beginPath();
    ctx.arc(-s * 7, -s * 40, s * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 7, -s * 40, s * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Legs
    ctx.fillStyle = CS.REX_BODY;
    ctx.fillRect(-s * 14, s * 14, s * 11, s * 22);
    ctx.fillRect(s * 3, s * 14, s * 11, s * 22);

    ctx.restore();
}

function drawShadow(ctx, cx, cy, scale, faceRight, t) {
    ctx.save();
    ctx.translate(cx, cy);
    if (!faceRight) ctx.scale(-1, 1);
    const s = scale;

    // Dark aura flicker
    ctx.save();
    ctx.globalAlpha = 0.18 + 0.1 * Math.sin(t * 8);
    ctx.fillStyle = '#800020';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#800020';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 28, s * 55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Ninja robe / cloak
    ctx.fillStyle = CS.SHADOW_BODY;
    ctx.beginPath();
    ctx.moveTo(-s * 14, -s * 20);
    ctx.lineTo(-s * 22, s * 40);
    ctx.lineTo(s * 22, s * 40);
    ctx.lineTo(s * 14, -s * 20);
    ctx.closePath();
    ctx.fill();

    // Body
    ctx.fillStyle = CS.SHADOW_BODY;
    ctx.fillRect(-s * 10, -s * 40, s * 20, s * 22);

    // Head
    ctx.fillStyle = CS.SHADOW_BODY;
    ctx.beginPath();
    ctx.arc(0, -s * 48, s * 13, 0, Math.PI * 2);
    ctx.fill();

    // Ears — pointed cat ears
    ctx.beginPath();
    ctx.moveTo(-s * 12, -s * 57);
    ctx.lineTo(-s * 6, -s * 44);
    ctx.lineTo(s * 0, -s * 57);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s * 0, -s * 57);
    ctx.lineTo(s * 6, -s * 44);
    ctx.lineTo(s * 12, -s * 57);
    ctx.closePath();
    ctx.fill();

    // Red headband
    ctx.fillStyle = CS.SHADOW_BAND;
    ctx.fillRect(-s * 12, -s * 52, s * 24, s * 5);

    // Glowing red eyes
    ctx.fillStyle = CS.SHADOW_EYE;
    ctx.shadowBlur = 14;
    ctx.shadowColor = CS.SHADOW_EYE;
    ctx.fillRect(-s * 8, -s * 52, s * 5, s * 5);
    ctx.fillRect(s * 3, -s * 52, s * 5, s * 5);
    ctx.shadowBlur = 0;

    // Face mask (lower half)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-s * 12, -s * 46, s * 24, s * 8);

    ctx.restore();
}

function drawMysteryCommander(ctx, cx, cy, scale, t) {
    ctx.save();
    ctx.translate(cx, cy);
    const s = scale;

    // Massive aura
    ctx.save();
    ctx.globalAlpha = 0.15 + 0.08 * Math.sin(t * 5);
    ctx.fillStyle = CS.BOSS_BODY;
    ctx.shadowBlur = 40;
    ctx.shadowColor = '#6010a0';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 45, s * 80, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Heavy armor body
    ctx.fillStyle = CS.BOSS_BODY;
    ctx.fillRect(-s * 22, -s * 40, s * 44, s * 55);

    // Armor highlights
    ctx.fillStyle = CS.BOSS_ARMOR;
    ctx.fillRect(-s * 20, -s * 38, s * 8, s * 50);
    ctx.fillRect(s * 12, -s * 38, s * 8, s * 50);
    ctx.fillRect(-s * 18, -s * 38, s * 36, s * 10);

    // Shoulder pauldrons
    ctx.fillStyle = CS.BOSS_ARMOR;
    ctx.beginPath();
    ctx.arc(-s * 28, -s * 30, s * 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 28, -s * 30, s * 14, 0, Math.PI * 2);
    ctx.fill();
    // Pauldron spikes
    ctx.fillStyle = CS.BOSS_BODY;
    for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-s * 28 + i * s * 8, -s * 44);
        ctx.lineTo(-s * 28 + i * s * 8 - s * 4, -s * 30);
        ctx.lineTo(-s * 28 + i * s * 8 + s * 4, -s * 30);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s * 28 + i * s * 8, -s * 44);
        ctx.lineTo(s * 28 + i * s * 8 - s * 4, -s * 30);
        ctx.lineTo(s * 28 + i * s * 8 + s * 4, -s * 30);
        ctx.closePath();
        ctx.fill();
    }

    // Head — big cat, helmeted
    ctx.fillStyle = CS.BOSS_BODY;
    ctx.beginPath();
    ctx.arc(0, -s * 55, s * 20, 0, Math.PI * 2);
    ctx.fill();

    // Helmet
    ctx.fillStyle = CS.BOSS_ARMOR;
    ctx.beginPath();
    ctx.arc(0, -s * 58, s * 20, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-s * 20, -s * 58, s * 40, s * 15);

    // Horns on helmet
    ctx.fillStyle = CS.BOSS_BODY;
    ctx.beginPath();
    ctx.moveTo(-s * 16, -s * 70);
    ctx.lineTo(-s * 20, -s * 58);
    ctx.lineTo(-s * 8, -s * 60);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s * 16, -s * 70);
    ctx.lineTo(s * 20, -s * 58);
    ctx.lineTo(s * 8, -s * 60);
    ctx.closePath();
    ctx.fill();

    // Cat ears (visible under helmet)
    ctx.fillStyle = CS.BOSS_BODY;
    ctx.beginPath();
    ctx.moveTo(-s * 18, -s * 72);
    ctx.lineTo(-s * 12, -s * 60);
    ctx.lineTo(-s * 4, -s * 72);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s * 4, -s * 72);
    ctx.lineTo(s * 12, -s * 60);
    ctx.lineTo(s * 18, -s * 72);
    ctx.closePath();
    ctx.fill();

    // Glowing yellow eyes
    ctx.fillStyle = CS.BOSS_EYE;
    ctx.shadowBlur = 20;
    ctx.shadowColor = CS.BOSS_EYE;
    ctx.beginPath();
    ctx.ellipse(-s * 7, -s * 57, s * 5, s * 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s * 7, -s * 57, s * 5, s * 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Slit pupils
    ctx.fillStyle = CS.BOSS_BODY;
    ctx.fillRect(-s * 8, -s * 60, s * 2, s * 6);
    ctx.fillRect(s * 6, -s * 60, s * 2, s * 6);
    ctx.shadowBlur = 0;

    // Legs / greaves
    ctx.fillStyle = CS.BOSS_ARMOR;
    ctx.fillRect(-s * 18, s * 15, s * 14, s * 28);
    ctx.fillRect(s * 4, s * 15, s * 14, s * 28);

    ctx.restore();
}

// ---------------------------------------------------------------------------
// Castle silhouette
// ---------------------------------------------------------------------------
function drawCastle(ctx, cx, cy, scale) {
    ctx.save();
    ctx.translate(cx, cy);
    const s = scale;
    ctx.fillStyle = '#1a0a22';

    // Main keep
    ctx.fillRect(-s * 40, -s * 80, s * 80, s * 80);
    // Battlements on keep
    for (let i = -3; i <= 3; i++) {
        ctx.fillRect(i * s * 12 - s * 5, -s * 88, s * 10, s * 10);
    }

    // Left tower
    ctx.fillRect(-s * 70, -s * 100, s * 28, s * 100);
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(-s * 70 + i * s * 8, -s * 108, s * 6, s * 10);
    }
    // Tower top
    ctx.beginPath();
    ctx.moveTo(-s * 70, -s * 100);
    ctx.lineTo(-s * 56, -s * 120);
    ctx.lineTo(-s * 42, -s * 100);
    ctx.closePath();
    ctx.fill();

    // Right tower
    ctx.fillRect(s * 42, -s * 100, s * 28, s * 100);
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(s * 42 + i * s * 8, -s * 108, s * 6, s * 10);
    }
    ctx.beginPath();
    ctx.moveTo(s * 42, -s * 100);
    ctx.lineTo(s * 56, -s * 120);
    ctx.lineTo(s * 70, -s * 100);
    ctx.closePath();
    ctx.fill();

    // Central spire
    ctx.beginPath();
    ctx.moveTo(-s * 12, -s * 80);
    ctx.lineTo(0, -s * 140);
    ctx.lineTo(s * 12, -s * 80);
    ctx.closePath();
    ctx.fill();

    // Windows (glowing)
    ctx.save();
    ctx.fillStyle = '#c83030';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#c83030';
    ctx.fillRect(-s * 5, -s * 60, s * 10, s * 14);
    ctx.fillRect(-s * 55, -s * 70, s * 8, s * 12);
    ctx.fillRect(s * 47, -s * 70, s * 8, s * 12);
    ctx.restore();

    // Mountain base
    ctx.fillStyle = '#0f0618';
    ctx.beginPath();
    ctx.moveTo(-s * 120, s * 0);
    ctx.lineTo(-s * 80, -s * 40);
    ctx.lineTo(-s * 50, -s * 20);
    ctx.lineTo(0, -s * 50);
    ctx.lineTo(s * 50, -s * 20);
    ctx.lineTo(s * 80, -s * 40);
    ctx.lineTo(s * 120, s * 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

// ---------------------------------------------------------------------------
// Letterbox (cinematic bars)
// ---------------------------------------------------------------------------
function drawLetterbox(ctx, w, h, barH) {
    ctx.fillStyle = CS.BLACK;
    ctx.fillRect(0, 0, w, barH);
    ctx.fillRect(0, h - barH, w, barH);
}

// ---------------------------------------------------------------------------
// Text rendering (letter-by-letter reveal)
// ---------------------------------------------------------------------------
function drawDialogue(ctx, w, h, speaker, text, revealT, barH) {
    const BOX_H = 90;
    const BOX_Y = h - barH - BOX_H - 8;
    const PAD = 16;

    // Box background
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = '#00003a';
    roundRect(ctx, PAD, BOX_Y, w - PAD * 2, BOX_H, 6);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Border
    ctx.strokeStyle = '#f8d830';
    ctx.lineWidth = 2;
    roundRect(ctx, PAD, BOX_Y, w - PAD * 2, BOX_H, 6);
    ctx.stroke();

    // Speaker name
    if (speaker) {
        ctx.fillStyle = '#f8d830';
        ctx.font = 'bold 14px monospace';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#f8d830';
        ctx.fillText(speaker, PAD + 10, BOX_Y + 20);
        ctx.shadowBlur = 0;
    }

    // Dialogue text (reveal)
    const chars = Math.floor(text.length * Math.min(1, revealT));
    const partial = text.slice(0, chars);
    ctx.fillStyle = CS.WHITE;
    ctx.font = '15px monospace';
    ctx.shadowBlur = 3;
    ctx.shadowColor = CS.BLACK;
    wrapText(ctx, partial, PAD + 10, BOX_Y + (speaker ? 42 : 24), w - PAD * 2 - 20, 22);
    ctx.shadowBlur = 0;
    ctx.restore();
}

function drawNarrativeText(ctx, w, h, text, revealT, barH, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const chars = Math.floor(text.length * Math.min(1, revealT));
    const partial = text.slice(0, chars);
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = CS.WHITE;
    ctx.shadowBlur = 8;
    ctx.shadowColor = CS.BLACK;
    ctx.fillText(partial, w / 2, h - barH - 30);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
    ctx.restore();
}

function wrapText(ctx, text, x, y, maxW, lineH) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (const word of words) {
        const test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width > maxW && line) {
            ctx.fillText(line, x, currentY);
            line = word;
            currentY += lineH;
        } else {
            line = test;
        }
    }
    if (line) ctx.fillText(line, x, currentY);
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ---------------------------------------------------------------------------
// Title card renderer
// ---------------------------------------------------------------------------
function drawTitleCard(ctx, w, h, title, subtitle, t, barH) {
    // Glowing title
    ctx.save();
    ctx.textAlign = 'center';

    const alpha = Math.min(1, t * 2);
    ctx.globalAlpha = alpha;

    // Title backdrop glow
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#f8d830';
    ctx.fillStyle = '#f8d830';
    ctx.font = `bold ${Math.floor(w * 0.07)}px monospace`;
    ctx.fillText(title, w / 2, h / 2 - 20);
    ctx.shadowBlur = 0;

    // Decorative lines
    const lineY = h / 2 + 10;
    const lineAlpha = Math.min(1, (t - 0.3) * 3);
    if (lineAlpha > 0) {
        ctx.globalAlpha = alpha * lineAlpha;
        ctx.strokeStyle = '#f8d830';
        ctx.lineWidth = 2;
        const lineLen = Math.min(w * 0.4, (t - 0.3) * 3 * w * 0.4);
        ctx.beginPath();
        ctx.moveTo(w / 2 - lineLen, lineY);
        ctx.lineTo(w / 2 + lineLen, lineY);
        ctx.stroke();
    }

    // Subtitle
    const subAlpha = Math.min(1, (t - 0.5) * 4);
    if (subAlpha > 0) {
        ctx.globalAlpha = alpha * subAlpha;
        ctx.fillStyle = CS.WHITE;
        ctx.font = `${Math.floor(w * 0.038)}px monospace`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = CS.BLACK;
        ctx.fillText(subtitle, w / 2, h / 2 + 42);
        ctx.shadowBlur = 0;
    }

    ctx.textAlign = 'left';
    ctx.restore();
}

// ---------------------------------------------------------------------------
// Screen flash overlay
// ---------------------------------------------------------------------------
function drawFlash(ctx, w, h, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = CS.WHITE;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
}

// ---------------------------------------------------------------------------
// Camera shake helper — returns [ox, oy]
// ---------------------------------------------------------------------------
function getCameraShake(magnitude, t) {
    if (magnitude <= 0) return [0, 0];
    const ox = (Math.sin(t * 80.3) * 0.5 + Math.sin(t * 47.1) * 0.5) * magnitude;
    const oy = (Math.cos(t * 63.7) * 0.5 + Math.cos(t * 91.2) * 0.5) * magnitude;
    return [ox, oy];
}

// ---------------------------------------------------------------------------
// Scene definitions
// ---------------------------------------------------------------------------
function buildScenes(w, h) {
    return [
        // ---- Scene 0: Battlefield aftermath ----
        {
            duration: 5.5,
            bg: (ctx, t, shake) => {
                ctx.save();
                ctx.translate(shake[0], shake[1]);
                bgGradient(ctx, w, h, '#e86420', '#3a1a08');
                // Smoke wisps
                for (let i = 0; i < 6; i++) {
                    const sx = (i * w * 0.18 + t * 18) % w;
                    const sy = h * 0.4 - i * 12;
                    ctx.save();
                    ctx.globalAlpha = 0.12;
                    ctx.fillStyle = '#c0c0c0';
                    ctx.beginPath();
                    ctx.ellipse(sx, sy, 40 + i * 10, 18, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
                // Ground
                ctx.fillStyle = '#1a0e06';
                ctx.fillRect(0, h * 0.65, w, h * 0.35);
                // Distant tree silhouettes
                for (let i = 0; i < 8; i++) {
                    const tx = i * w * 0.14 + 20;
                    const ty = h * 0.65;
                    ctx.fillStyle = '#0d0702';
                    ctx.fillRect(tx - 4, ty - 40 - i % 3 * 15, 8, 40 + i % 3 * 15);
                    ctx.beginPath();
                    ctx.arc(tx, ty - 40 - i % 3 * 15, 14, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Battle scars on ground
                ctx.strokeStyle = '#0a0604';
                ctx.lineWidth = 2;
                for (let i = 0; i < 5; i++) {
                    ctx.beginPath();
                    ctx.moveTo(w * 0.1 + i * w * 0.16, h * 0.7);
                    ctx.lineTo(w * 0.14 + i * w * 0.16, h * 0.75);
                    ctx.stroke();
                }
                ctx.restore();
            },
            character: null,
            particles: (ps, t, dt) => {
                if (t < 0.2 && Math.random() < 0.4) {
                    ps.emit(Math.random() * w, h * 0.65, 3, {
                        colors: ['#c08020', '#804010', '#e0a030'],
                        speedMin: 10, speedMax: 40,
                        angleMin: -Math.PI * 0.8, angleMax: -Math.PI * 0.2,
                        sizeMin: 2, sizeMax: 5,
                        lifeMin: 1.5, lifeMax: 3,
                        spread: 20,
                    });
                }
            },
            fxOverlay: null,
            speedLines: false,
            flash: (t) => t < 0.05 ? (1 - t / 0.05) * 0.3 : 0,
            text: { type: 'narrative', text: 'The border is secure... for now.' },
            shake: 0,
        },

        // ---- Scene 1: Shadow's escape ----
        {
            duration: 5.0,
            bg: (ctx, t, shake) => {
                ctx.save();
                ctx.translate(shake[0], shake[1]);
                bgGradient(ctx, w, h, '#1a0a30', '#0a0010');
                drawStars(ctx, w, h, 60, t);
                // Ground
                ctx.fillStyle = '#0d0818';
                ctx.fillRect(0, h * 0.7, w, h * 0.3);
                ctx.restore();
            },
            character: (ctx, t, shake) => {
                ctx.save();
                ctx.translate(shake[0], shake[1]);
                // Speed lines
                const lineAlpha = Math.min(0.6, t * 3);
                drawSpeedLines(ctx, w * 0.55, h * 0.5, 50, 40, Math.max(w, h) * 0.9, lineAlpha, '#400060');
                // Shadow leaping
                const jumpY = h * 0.45 - Math.abs(Math.sin(t * Math.PI)) * h * 0.2;
                const lean = Math.sin(t * 3) * 0.3;
                ctx.save();
                ctx.translate(w * 0.55, jumpY);
                ctx.rotate(lean);
                drawShadow(ctx, 0, 0, 1.2, true, t);
                ctx.restore();

                // Motion blur trail
                for (let i = 1; i <= 4; i++) {
                    const trailX = w * 0.55 - i * 18;
                    const trailY = jumpY + (Math.abs(Math.sin((t - i * 0.04) * Math.PI)) - Math.abs(Math.sin(t * Math.PI))) * h * 0.2;
                    ctx.save();
                    ctx.globalAlpha = 0.15 / i;
                    ctx.translate(trailX, trailY);
                    ctx.rotate(lean);
                    drawShadow(ctx, 0, 0, 1.2, true, t);
                    ctx.restore();
                }
                ctx.restore();
            },
            particles: (ps, t, dt) => {
                if (Math.random() < 0.6) {
                    ps.emit(w * 0.55, h * 0.45, 2, {
                        colors: ['#400060', '#800080', '#2a0040'],
                        speedMin: 20, speedMax: 80,
                        angleMin: Math.PI * 0.6, angleMax: Math.PI * 1.4,
                        sizeMin: 1, sizeMax: 4,
                        lifeMin: 0.3, lifeMax: 0.8,
                    });
                }
            },
            fxOverlay: null,
            speedLines: false,
            flash: (t) => t < 0.05 ? t / 0.05 * 0.5 : 0,
            text: { type: 'dialogue', speaker: 'Shadow', text: '"This was merely a taste, pups..."' },
            shake: 0,
        },

        // ---- Scene 2: Buddy close-up ----
        {
            duration: 5.5,
            bg: (ctx, t, shake) => {
                ctx.save();
                ctx.translate(shake[0], shake[1]);
                // Dramatic orange sunset close-up
                bgGradient(ctx, w, h, '#ff6820', '#a02010');
                // Sun
                ctx.save();
                ctx.fillStyle = '#ffcc40';
                ctx.shadowBlur = 40;
                ctx.shadowColor = '#ffaa00';
                ctx.beginPath();
                ctx.arc(w * 0.7, h * 0.3, 50, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                // Horizontal cloud streaks
                for (let i = 0; i < 5; i++) {
                    ctx.save();
                    ctx.globalAlpha = 0.15;
                    ctx.fillStyle = '#ff9030';
                    ctx.fillRect(0, h * (0.2 + i * 0.07), w, 8);
                    ctx.restore();
                }
                ctx.restore();
            },
            character: (ctx, t, shake) => {
                ctx.save();
                ctx.translate(shake[0], shake[1]);
                // Wind effect — cape particles
                // Big Buddy close-up
                const scale = 1.8 + Math.sin(t * 1.2) * 0.02;
                drawBuddy(ctx, w * 0.38, h * 0.55, scale, true);
                // Aura
                drawEnergyAura(ctx, w * 0.38, h * 0.45, 80 * scale, '#ff8030', t);
                ctx.restore();
            },
            particles: (ps, t, dt) => {
                // Wind particles
                if (Math.random() < 0.5) {
                    ps.emit(w * 0.5 + Math.random() * w * 0.3, h * 0.3 + Math.random() * h * 0.3, 1, {
                        colors: ['#ffcc60', '#ff9030'],
                        speedMin: 30, speedMax: 80,
                        angleMin: Math.PI * 0.9, angleMax: Math.PI * 1.1,
                        sizeMin: 1, sizeMax: 3,
                        lifeMin: 0.6, lifeMax: 1.2,
                    });
                }
            },
            fxOverlay: null,
            speedLines: false,
            flash: (t) => t < 0.06 ? (1 - t / 0.06) * 0.7 : 0,
            text: { type: 'dialogue', speaker: 'Buddy', text: '"He\'s heading toward the Cat Kingdom capital..."' },
            shake: 0,
        },

        // ---- Scene 3: Luna warns ----
        {
            duration: 5.5,
            bg: (ctx, t, shake) => {
                ctx.save();
                ctx.translate(shake[0], shake[1]);
                bgGradient(ctx, w, h, '#0a1840', '#040820');
                drawStars(ctx, w, h, 80, t);
                // Ground
                ctx.fillStyle = '#060d20';
                ctx.fillRect(0, h * 0.7, w, h * 0.3);
                ctx.restore();
            },
            character: (ctx, t, shake) => {
                ctx.save();
                ctx.translate(shake[0], shake[1]);
                // Staff glow
                ctx.save();
                ctx.globalAlpha = 0.3 + 0.2 * Math.sin(t * 4);
                const lunaGrad = ctx.createRadialGradient(w * 0.55, h * 0.3, 0, w * 0.55, h * 0.3, 120);
                lunaGrad.addColorStop(0, '#6090ff');
                lunaGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = lunaGrad;
                ctx.fillRect(0, 0, w, h);
                ctx.restore();

                drawLuna(ctx, w * 0.5, h * 0.55, 1.7, true);
                drawEnergyAura(ctx, w * 0.5, h * 0.44, 90, '#3060c8', t);
                // Magic circle on ground
                ctx.save();
                ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 3);
                ctx.strokeStyle = '#6090ff';
                ctx.lineWidth = 2;
                ctx.shadowBlur = 12;
                ctx.shadowColor = '#3060c8';
                for (let r = 0; r < 3; r++) {
                    ctx.beginPath();
                    ctx.arc(w * 0.5, h * 0.7, 50 + r * 25, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
                ctx.restore();
            },
            particles: (ps, t, dt) => {
                if (Math.random() < 0.7) {
                    const angle = Math.random() * Math.PI * 2;
                    ps.emit(w * 0.5 + Math.cos(angle) * 80, h * 0.4 + Math.sin(angle) * 30, 1, {
                        colors: ['#6090ff', '#3060c8', '#90c0ff', CS.LUNA_STAFF],
                        speedMin: 15, speedMax: 50,
                        angleMin: -Math.PI * 0.5 - 0.3, angleMax: -Math.PI * 0.5 + 0.3,
                        sizeMin: 1, sizeMax: 4,
                        lifeMin: 0.8, lifeMax: 2.0,
                    });
                }
            },
            fxOverlay: null,
            speedLines: false,
            flash: (t) => t < 0.06 ? (1 - t / 0.06) * 0.5 : 0,
            text: { type: 'dialogue', speaker: 'Luna', text: '"I sense a powerful dark energy gathering in the north. Something terrible is coming."' },
            shake: 0,
        },

        // ---- Scene 4: Energy burst (DBZ style) ----
        {
            duration: 4.5,
            bg: (ctx, t, shake) => {
                ctx.save();
                ctx.translate(shake[0], shake[1]);
                bgGradient(ctx, w, h, '#200010', '#050005');
                drawStars(ctx, w, h, 40, t);
                ctx.restore();
            },
            character: (ctx, t, shake) => {
                ctx.save();
                ctx.translate(shake[0], shake[1]);

                const boom = Math.min(1, t * 4);
                const boomR = boom * w * 0.7;

                // Energy explosion
                if (t < 0.5) {
                    // Speed lines
                    drawSpeedLines(ctx, w * 0.5, h * 0.4, 80, 10, boomR, Math.min(1, boom * 2), CS.ENERGY_PURP);
                }

                // Radial glow
                const grad = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, boomR * 0.8);
                grad.addColorStop(0, 'rgba(255,255,255,0.9)');
                grad.addColorStop(0.2, 'rgba(255, 60, 0, 0.8)');
                grad.addColorStop(0.6, 'rgba(160, 0, 200, 0.5)');
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.globalAlpha = Math.max(0, 1 - t * 1.5);
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
                ctx.globalAlpha = 1;

                // Expanding ring
                const ringT = (t * 1.5) % 1;
                ctx.save();
                ctx.globalAlpha = (1 - ringT) * 0.8;
                ctx.strokeStyle = CS.ENERGY_RED;
                ctx.lineWidth = 6 * (1 - ringT);
                ctx.shadowBlur = 20;
                ctx.shadowColor = CS.ENERGY_RED;
                ctx.beginPath();
                ctx.arc(w * 0.5, h * 0.4, ringT * w * 0.6, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();

                // Second ring (purple)
                const ringT2 = ((t * 1.5) + 0.33) % 1;
                ctx.save();
                ctx.globalAlpha = (1 - ringT2) * 0.6;
                ctx.strokeStyle = CS.ENERGY_PURP;
                ctx.lineWidth = 4 * (1 - ringT2);
                ctx.shadowBlur = 16;
                ctx.shadowColor = CS.ENERGY_PURP;
                ctx.beginPath();
                ctx.arc(w * 0.5, h * 0.4, ringT2 * w * 0.55, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();

                // Rex small figure at bottom
                ctx.save();
                ctx.translate(w * 0.5 - 30, h * 0.78);
                ctx.scale(0.6, 0.6);
                drawRex(ctx, 0, 0, 1.0, true);
                ctx.restore();

                ctx.restore();
            },
            particles: (ps, t, dt) => {
                if (t < 0.3 && Math.random() < 0.9) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 100 + Math.random() * 300;
                    ps.emit(w * 0.5, h * 0.4, 3, {
                        colors: [CS.ENERGY_RED, CS.ENERGY_PURP, '#ff8060', CS.WHITE],
                        speedMin: speed, speedMax: speed * 1.3,
                        angleMin: angle - 0.2, angleMax: angle + 0.2,
                        sizeMin: 2, sizeMax: 8,
                        lifeMin: 0.4, lifeMax: 1.2,
                    });
                }
                if (Math.random() < 0.3) {
                    ps.emit(w * 0.5, h * 0.4, 1, {
                        colors: [CS.SPARK, CS.ENERGY_GOLD],
                        speedMin: 20, speedMax: 80,
                        sizeMin: 1, sizeMax: 3,
                        lifeMin: 0.3, lifeMax: 0.8,
                    });
                }
            },
            fxOverlay: null,
            speedLines: false,
            flash: (t) => t < 0.12 ? (1 - t / 0.12) * 1.0 : 0,
            text: { type: 'dialogue', speaker: 'Rex', text: '"What in the...?!"' },
            shake: 4,
        },

        // ---- Scene 5: Dark castle reveal ----
        {
            duration: 6.0,
            bg: (ctx, t, shake) => {
                ctx.save();
                ctx.translate(shake[0], shake[1]);
                bgGradient(ctx, w, h, '#0a0018', '#1a0028');
                drawStars(ctx, w, h, 100, t);
                // Ominous red moon
                ctx.save();
                ctx.fillStyle = '#800010';
                ctx.shadowBlur = 30;
                ctx.shadowColor = '#c00020';
                ctx.beginPath();
                ctx.arc(w * 0.75, h * 0.18, 38, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                // Eerie ground fog
                for (let i = 0; i < 5; i++) {
                    ctx.save();
                    ctx.globalAlpha = 0.08 + 0.04 * Math.sin(t * 0.8 + i);
                    ctx.fillStyle = '#400060';
                    ctx.beginPath();
                    ctx.ellipse(
                        w * (0.1 + i * 0.2) + Math.sin(t * 0.3 + i) * 20,
                        h * 0.72,
                        80 + i * 20, 22, 0, 0, Math.PI * 2
                    );
                    ctx.fill();
                    ctx.restore();
                }
                ctx.restore();
            },
            character: (ctx, t, shake) => {
                ctx.save();
                ctx.translate(shake[0], shake[1]);

                // Camera pan — castle comes in from the right
                const panX = lerp(w * 1.2, w * 0.5, Math.min(1, easeOut(t * 0.6)));
                drawCastle(ctx, panX, h * 0.82, 0.9);

                // Lightning bolts
                if (Math.random() < 0.04) {
                    const lx = w * 0.3 + Math.random() * w * 0.4;
                    drawLightningBolt(ctx, lx, 0, lx + (Math.random() - 0.5) * 60, h * 0.5, 40, '#c0d0ff');
                }
                if (Math.random() < 0.02) {
                    drawLightningBolt(ctx, w * 0.5, h * 0.1, w * 0.5 + (Math.random() - 0.5) * 40, h * 0.4, 30, '#ff4040');
                }
                ctx.restore();
            },
            particles: (ps, t, dt) => {
                if (Math.random() < 0.3) {
                    ps.emit(w * 0.5 + (Math.random() - 0.5) * w * 0.6, h * 0.3, 1, {
                        colors: ['#400060', '#600080', '#200030'],
                        speedMin: 5, speedMax: 20,
                        angleMin: -Math.PI * 0.6, angleMax: -Math.PI * 0.4,
                        sizeMin: 2, sizeMax: 6,
                        lifeMin: 2, lifeMax: 4,
                    });
                }
            },
            fxOverlay: null,
            speedLines: false,
            flash: (t) => t < 0.04 ? (1 - t / 0.04) * 0.4 : 0,
            text: { type: 'narrative', text: 'The Cat Kingdom Fortress — Shadowfang Citadel' },
            shake: 0,
        },

        // ---- Scene 6: Mysterious commander ----
        {
            duration: 5.5,
            bg: (ctx, t, shake) => {
                ctx.save();
                ctx.translate(shake[0], shake[1]);
                bgGradient(ctx, w, h, '#0d0520', '#050010');
                // Throne room pillars (silhouettes)
                for (let i = 0; i < 4; i++) {
                    const px = w * 0.05 + i * w * 0.28;
                    ctx.fillStyle = '#0a0318';
                    ctx.fillRect(px, h * 0.2, 18, h * 0.8);
                    ctx.save();
                    ctx.fillStyle = '#c83030';
                    ctx.globalAlpha = 0.12 + 0.06 * Math.sin(t * 2 + i);
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#c83030';
                    ctx.fillRect(px, h * 0.2, 18, h * 0.8);
                    ctx.restore();
                }
                // Floor reflection
                ctx.save();
                ctx.globalAlpha = 0.15;
                ctx.fillStyle = '#3a0050';
                ctx.fillRect(0, h * 0.75, w, h * 0.25);
                ctx.restore();
                ctx.restore();
            },
            character: (ctx, t, shake) => {
                ctx.save();
                ctx.translate(shake[0], shake[1]);
                // Commander on throne — looming large
                drawMysteryCommander(ctx, w * 0.5, h * 0.65, 1.5, t);
                // Dark energy rings
                drawEnergyAura(ctx, w * 0.5, h * 0.5, 110, '#6010a0', t);
                drawEnergyAura(ctx, w * 0.5, h * 0.5, 140, '#c83030', t + 0.4);
                // Shadow tendrils from bottom
                for (let i = 0; i < 5; i++) {
                    ctx.save();
                    ctx.globalAlpha = 0.2 + 0.1 * Math.sin(t * 3 + i);
                    ctx.strokeStyle = '#3a0050';
                    ctx.lineWidth = 8;
                    ctx.shadowBlur = 12;
                    ctx.shadowColor = '#6010a0';
                    ctx.beginPath();
                    const tx = w * 0.15 + i * w * 0.18;
                    ctx.moveTo(tx, h);
                    ctx.bezierCurveTo(
                        tx + Math.sin(t + i) * 30, h * 0.85,
                        w * 0.5 + (tx - w * 0.5) * 0.4, h * 0.75,
                        w * 0.5, h * 0.7
                    );
                    ctx.stroke();
                    ctx.restore();
                }
                ctx.restore();
            },
            particles: (ps, t, dt) => {
                if (Math.random() < 0.5) {
                    ps.emit(w * 0.5, h * 0.55, 2, {
                        colors: ['#6010a0', '#3a0050', '#9020d0', '#c83030'],
                        speedMin: 15, speedMax: 60,
                        sizeMin: 1, sizeMax: 5,
                        lifeMin: 0.5, lifeMax: 1.5,
                    });
                }
            },
            fxOverlay: null,
            speedLines: false,
            flash: (t) => t < 0.06 ? (1 - t / 0.06) * 0.6 : 0,
            text: { type: 'dialogue', speaker: '???', text: '"Send the war party. I want those puppies... eliminated."' },
            shake: 0,
        },

        // ---- Scene 7: Team rallies ----
        {
            duration: 5.5,
            bg: (ctx, t, shake) => {
                ctx.save();
                ctx.translate(shake[0], shake[1]);
                bgGradient(ctx, w, h, '#102040', '#060e20');
                drawStars(ctx, w, h, 60, t);
                // Dawn light on horizon
                const dawnAlpha = Math.min(1, t * 0.6) * 0.4;
                const dawnGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
                dawnGrad.addColorStop(0, `rgba(255,160,20,${dawnAlpha})`);
                dawnGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = dawnGrad;
                ctx.fillRect(0, h * 0.55, w, h * 0.45);
                // Ground
                ctx.fillStyle = '#050c18';
                ctx.fillRect(0, h * 0.72, w, h * 0.28);
                ctx.restore();
            },
            character: (ctx, t, shake) => {
                ctx.save();
                ctx.translate(shake[0], shake[1]);
                // Three dogs in a row, dramatic rise
                const riseT = Math.min(1, easeOut(t * 1.5));
                const baseY = h * 0.66;

                // Luna — left
                const lunaY = baseY + (1 - riseT) * 80;
                ctx.save();
                ctx.globalAlpha = riseT;
                drawLuna(ctx, w * 0.25, lunaY, 1.1, true);
                ctx.restore();

                // Rex — right
                const rexY = baseY + (1 - riseT) * 80;
                ctx.save();
                ctx.globalAlpha = riseT;
                drawRex(ctx, w * 0.75, rexY, 1.1, false);
                ctx.restore();

                // Buddy — center, slightly in front
                const buddyY = baseY - 10 + (1 - riseT) * 80;
                ctx.save();
                ctx.globalAlpha = riseT;
                drawBuddy(ctx, w * 0.5, buddyY, 1.3, true);
                ctx.restore();

                // Group aura
                const auraAlpha = Math.max(0, riseT - 0.5) * 2;
                ctx.save();
                ctx.globalAlpha = auraAlpha * 0.5;
                const teamGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.55);
                teamGrad.addColorStop(0, 'rgba(255,220,80,0.4)');
                teamGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = teamGrad;
                ctx.fillRect(0, 0, w, h);
                ctx.restore();

                ctx.restore();
            },
            particles: (ps, t, dt) => {
                if (Math.random() < 0.4) {
                    ps.emit(w * 0.5 + (Math.random() - 0.5) * w * 0.6, h * 0.6 + Math.random() * h * 0.15, 1, {
                        colors: [CS.ENERGY_GOLD, '#fff0a0', '#ffcc40'],
                        speedMin: 20, speedMax: 80,
                        angleMin: -Math.PI * 0.9, angleMax: -Math.PI * 0.1,
                        sizeMin: 1, sizeMax: 4,
                        lifeMin: 0.8, lifeMax: 2.0,
                    });
                }
            },
            fxOverlay: null,
            speedLines: false,
            flash: (t) => t < 0.08 ? (1 - t / 0.08) * 0.7 : 0,
            text: { type: 'dialogue', speaker: 'Buddy', text: '"We need to reach the Academy. The kingdom must be warned!"' },
            shake: 0,
        },

        // ---- Scene 8: Title card ----
        {
            duration: 6.0,
            bg: (ctx, t, shake) => {
                ctx.save();
                ctx.translate(shake[0], shake[1]);
                bgGradient(ctx, w, h, '#000020', '#000008');
                drawStars(ctx, w, h, 120, t);
                // Subtle particle nebula
                ctx.save();
                ctx.globalAlpha = 0.06 + 0.04 * Math.sin(t * 0.5);
                const nebGrad = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, w * 0.7);
                nebGrad.addColorStop(0, '#2040a0');
                nebGrad.addColorStop(0.5, '#400060');
                nebGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = nebGrad;
                ctx.fillRect(0, 0, w, h);
                ctx.restore();
                ctx.restore();
            },
            character: (ctx, t, shake) => {
                ctx.save();
                ctx.translate(shake[0], shake[1]);
                drawTitleCard(ctx, w, h, 'Chapter 1:', 'The Road to Shadowfang', t, 48);
                ctx.restore();
            },
            particles: (ps, t, dt) => {
                if (t > 0.3 && Math.random() < 0.2) {
                    ps.emit(Math.random() * w, Math.random() * h, 1, {
                        colors: [CS.ENERGY_GOLD, '#fff0a0'],
                        speedMin: 5, speedMax: 20,
                        sizeMin: 1, sizeMax: 2,
                        lifeMin: 2, lifeMax: 4,
                    });
                }
            },
            fxOverlay: null,
            speedLines: false,
            flash: (t) => t < 0.08 ? (1 - t / 0.08) * 0.5 : 0,
            text: { type: 'narrative', text: 'To be continued...' },
            shake: 0,
        },

        // ---- Scene 9: Fade to black ----
        {
            duration: 2.5,
            bg: (ctx, t, shake) => {
                ctx.save();
                ctx.translate(shake[0], shake[1]);
                bgGradient(ctx, w, h, '#000010', '#000000');
                ctx.restore();
            },
            character: null,
            particles: null,
            fxOverlay: (ctx, t) => {
                // Just blackness with a subtle fade up
                const alpha = Math.min(1, t * 2);
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = CS.BLACK;
                ctx.fillRect(0, 0, w, h);
                ctx.restore();
            },
            speedLines: false,
            flash: () => 0,
            text: null,
            shake: 0,
        },
    ];
}

// ---------------------------------------------------------------------------
// Main cutscene engine
// ---------------------------------------------------------------------------
function startPrologueCutscene(canvas) {
    'use strict';
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const BAR_H = Math.floor(h * 0.1);
    const TEXT_SPEED = 28; // chars per second

    const scenes = buildScenes(w, h);
    const ps = new ParticleSystem();

    let sceneIndex = 0;
    let sceneTime = 0;
    let totalTime = 0;
    let lastTimestamp = null;
    let rafId = null;
    let done = false;
    let transitionAlpha = 0; // for fade-in of each scene
    let flashQueue = 0; // extra flash alpha (from scene.flash function)

    // We store lightning seeds per-frame to avoid shimmer
    let lightningState = { bolts: [], nextSpawn: 0 };

    function endCutscene() {
        if (done) return;
        done = true;
        if (rafId) cancelAnimationFrame(rafId);
        canvas.removeEventListener('pointerdown', onTap);
        // Show title screen
        const ts = document.getElementById('title-screen');
        if (ts) ts.style.display = 'flex';
    }

    function advanceScene() {
        sceneIndex++;
        if (sceneIndex >= scenes.length) {
            endCutscene();
            return;
        }
        sceneTime = 0;
        transitionAlpha = 0;
        ps.clear();
    }

    function onTap() {
        advanceScene();
    }

    canvas.addEventListener('pointerdown', onTap);

    function drawScene(scene, st, dt) {
        const shake = getCameraShake(
            scene.shake * Math.max(0, 1 - st * 2),
            totalTime
        );

        // Background
        if (scene.bg) scene.bg(ctx, st, shake);

        // Particles update + draw (under characters)
        if (scene.particles) scene.particles(ps, st, dt);
        ps.update(dt);
        ps.draw(ctx);

        // Character art
        if (scene.character) scene.character(ctx, st, shake);

        // FX overlay
        if (scene.fxOverlay) scene.fxOverlay(ctx, st);

        // Letterbox
        drawLetterbox(ctx, w, h, BAR_H);

        // Text
        if (scene.text) {
            const textRevealT = st * TEXT_SPEED / scene.text.text.length;
            if (scene.text.type === 'dialogue') {
                drawDialogue(ctx, w, h, scene.text.speaker, scene.text.text, textRevealT, BAR_H);
            } else if (scene.text.type === 'narrative') {
                const textAlpha = Math.min(1, st * 2);
                drawNarrativeText(ctx, w, h, scene.text.text, textRevealT, BAR_H, textAlpha);
            }
        }

        // Scene fade-in transition
        transitionAlpha = Math.max(0, 1 - st * 6);
        if (transitionAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = transitionAlpha;
            ctx.fillStyle = CS.BLACK;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }

        // Scene flash
        const flashAlpha = scene.flash ? scene.flash(st) : 0;
        drawFlash(ctx, w, h, flashAlpha);

        // Scene end fade-out
        const timeLeft = scene.duration - st;
        if (timeLeft < 0.5) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, (0.5 - timeLeft) / 0.5);
            ctx.fillStyle = CS.BLACK;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }
    }

    function loop(timestamp) {
        if (done) return;
        if (lastTimestamp === null) lastTimestamp = timestamp;
        const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000);
        lastTimestamp = timestamp;

        sceneTime += dt;
        totalTime += dt;

        const scene = scenes[sceneIndex];
        if (!scene) { endCutscene(); return; }

        // Clear
        ctx.clearRect(0, 0, w, h);

        drawScene(scene, sceneTime, dt);

        // Auto-advance
        if (sceneTime >= scene.duration) {
            advanceScene();
        }

        rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
}

// Export as global
window.startPrologueCutscene = startPrologueCutscene;
