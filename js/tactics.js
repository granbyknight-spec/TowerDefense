// =============================================================================
// tactics.js — Shining Force Tactical Battle: Renderer + Scenario + Integration
// =============================================================================
// Depends on: tacticsSprites.js, tacticsEngine.js (loaded before this file)
// =============================================================================

'use strict';

// ---------------------------------------------------------------------------
// Rendering palette
// ---------------------------------------------------------------------------
const TPAL = {
    UI_BG: '#000070', UI_BORDER: '#fcfcfc', UI_TEXT: '#fcfcfc',
    UI_ACCENT: '#f8d830', UI_SHADOW: '#000044',
    BLACK: '#000000', WHITE: '#fcfcfc',
    HP_GREEN: '#38b764', HP_YELLOW: '#f8d830', HP_RED: '#c83030',
    YELLOW: '#f8d830',
};

// Fallback terrain tile colors
const TERRAIN_COLORS = {
    GRASS:    { bg: '#38b764', d1: '#2e9e54', d2: '#4ac878' },
    FOREST:   { bg: '#2e7e3e', d1: '#1e5e2e', d2: '#38b764' },
    MOUNTAIN: { bg: '#8b7355', d1: '#6b5535', d2: '#a08c6c' },
    WATER:    { bg: '#3978a8', d1: '#2d5e85', d2: '#5898c8' },
    ROAD:     { bg: '#c8956c', d1: '#a07850', d2: '#d8b08c' },
    BRIDGE:   { bg: '#8b6914', d1: '#6b4914', d2: '#ab8934' },
    WALL:     { bg: '#707070', d1: '#505050', d2: '#909090' },
};

const TERRAIN_NAMES = ['GRASS','FOREST','MOUNTAIN','WATER','ROAD','BRIDGE','WALL'];

// =============================================================================
// PROLOGUE SCENARIO
// =============================================================================
const PROLOGUE_SCENARIO = {
    name: 'Prologue: The Midnight Raid',
    mapWidth: 15, mapHeight: 10,
    // 0=GRASS 1=FOREST 2=MOUNTAIN 3=WATER 4=ROAD 5=BRIDGE 6=WALL
    terrain: [
        1,1,0,0,4,0,0,0,0,0,0,1,1,1,2,
        1,0,0,0,4,0,0,0,0,0,0,0,1,1,1,
        0,0,0,0,4,0,0,3,0,0,0,0,0,1,1,
        0,0,0,4,4,0,0,3,0,0,1,0,0,0,1,
        0,0,0,4,0,0,0,3,0,0,0,0,0,0,0,
        0,1,0,4,0,0,0,5,0,0,0,0,1,0,0,
        0,0,0,4,0,0,0,3,0,0,0,0,0,0,0,
        0,0,0,4,4,0,0,3,0,0,1,0,0,0,1,
        1,0,0,0,4,0,0,0,0,0,0,0,1,1,2,
        1,1,0,0,4,0,0,0,0,0,1,1,1,2,2,
    ],
    playerUnits: [
        { id:'buddy', name:'Buddy', team:'player', unitClass:'knight',
          x:2, y:4, hp:28, maxHp:28, mp:5, maxMp:5,
          atk:10, def:7, spd:6, mov:4, atkRange:1,
          level:1, exp:0, spriteKey:'dog_knight',
          abilities:['attack','growl'] },
        { id:'luna', name:'Luna', team:'player', unitClass:'mage',
          x:1, y:2, hp:18, maxHp:18, mp:10, maxMp:10,
          atk:12, def:3, spd:8, mov:3, atkRange:2,
          level:1, exp:0, spriteKey:'dog_mage',
          abilities:['attack','tailwhip'] },
        { id:'rex', name:'Rex', team:'player', unitClass:'warrior',
          x:2, y:7, hp:35, maxHp:35, mp:3, maxMp:3,
          atk:11, def:9, spd:4, mov:3, atkRange:1,
          level:1, exp:0, spriteKey:'dog_warrior',
          abilities:['attack','barkwave'] },
    ],
    enemyUnits: [
        { id:'scout1', name:'Whiskers', team:'enemy', unitClass:'scout',
          x:10, y:2, hp:12, maxHp:12, mp:0, maxMp:0,
          atk:6, def:3, spd:9, mov:5, atkRange:1,
          level:1, exp:0, spriteKey:'cat_scout', abilities:['attack'] },
        { id:'scout2', name:'Mittens', team:'enemy', unitClass:'scout',
          x:11, y:7, hp:12, maxHp:12, mp:0, maxMp:0,
          atk:6, def:3, spd:9, mov:5, atkRange:1,
          level:1, exp:0, spriteKey:'cat_scout', abilities:['attack'] },
        { id:'soldier1', name:'Patches', team:'enemy', unitClass:'soldier',
          x:12, y:4, hp:20, maxHp:20, mp:2, maxMp:2,
          atk:8, def:5, spd:5, mov:4, atkRange:1,
          level:1, exp:0, spriteKey:'cat_soldier', abilities:['attack','scratch'] },
        { id:'soldier2', name:'Ginger', team:'enemy', unitClass:'soldier',
          x:12, y:6, hp:20, maxHp:20, mp:2, maxMp:2,
          atk:8, def:5, spd:5, mov:4, atkRange:1,
          level:1, exp:0, spriteKey:'cat_soldier', abilities:['attack','scratch'] },
        { id:'boss', name:'Shadow', team:'enemy', unitClass:'boss',
          x:13, y:5, hp:32, maxHp:32, mp:4, maxMp:4,
          atk:12, def:6, spd:10, mov:5, atkRange:1,
          level:3, exp:0, spriteKey:'cat_boss', abilities:['attack','scratch','hiss'] },
    ],
    triggers: [
        { id:'opening',
          condition: e => e.turnNumber===1 && e.state==='player_select',
          dialogueChain: [
            {speaker:'Buddy', text:"Squad, hold position! I see movement beyond the stream..."},
            {speaker:'Luna',  text:"I count five of them. Scouts and soldiers."},
            {speaker:'Rex',   text:"*growls* Let 'em come. Nobody crosses this border."},
            {speaker:'Buddy', text:"Luna, use your range. Rex, hold the center. I'll push up the road."},
            {speaker:'',      text:"[Tap a unit to select, choose MOVE, then tap a blue tile!]"},
          ]},
        { id:'first_blood',
          condition: e => e.units.filter(u=>u.team==='enemy'&&!u.alive).length>=1,
          dialogueChain: [
            {speaker:'Buddy', text:"One down! Keep the pressure on!"},
            {speaker:'Rex',   text:"Hah! Too easy."},
          ]},
        { id:'boss_encounter',
          condition: e => {
            const b=e.units.find(u=>u.id==='boss');
            if(!b||!b.alive) return false;
            return e.units.filter(u=>u.team==='player'&&u.alive)
              .some(p=>Math.abs(p.x-b.x)+Math.abs(p.y-b.y)<=3);
          },
          dialogueChain: [
            {speaker:'Shadow', text:"So... the famous Puppy Guard. How disappointing."},
            {speaker:'Buddy',  text:"Shadow?! The Ninja Cat..."},
            {speaker:'Shadow', text:"Oh, I'm very real. And this raid is merely a taste."},
            {speaker:'Luna',   text:"Careful — he's incredibly fast!"},
          ]},
        { id:'buddy_hurt',
          condition: e => {const b=e.units.find(u=>u.id==='buddy'); return b&&b.alive&&b.hp<=b.maxHp*0.35;},
          dialogueChain: [
            {speaker:'Rex',   text:"Buddy! Fall back — you're hurt!"},
            {speaker:'Buddy', text:"Not yet... we can't let them through..."},
          ]},
    ],
    victoryDialogue: [
        {speaker:'Buddy',  text:"We did it! The border is secure!"},
        {speaker:'Shadow', text:"Heh... enjoy your little victory, pups."},
        {speaker:'Shadow', text:"This was merely a scouting party. The Cat Kingdom has much bigger plans..."},
        {speaker:'Luna',   text:"He vanished... What did he mean by 'bigger plans'?"},
        {speaker:'Rex',    text:"Nothing good. We need to report to the Academy."},
        {speaker:'Buddy',  text:"Agreed. Let's move out. This isn't over."},
        {speaker:'',       text:"[ End of Prologue — Chapter 1 coming soon! ]"},
    ],
    defeatDialogue: [
        {speaker:'Shadow', text:"Pathetic. The Puppy Guard is finished."},
        {speaker:'',       text:"[ Game Over — Tap to retry ]"},
    ],
};

// =============================================================================
// TacticalBattle — Renderer wrapping TacticsEngine
// =============================================================================
class TacticalBattle {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.engine = new TacticsEngine();
        this.spriteCache = null;
        this.terrainCache = null;
        this.pixelScale = 3;
        this.ts = 48;
        this.camX = 0; this.camY = 0;
        this.camTargetX = 0; this.camTargetY = 0;
        this.camSpeed = 5;
        this.zoom = 1.0; this.zoomTarget = 1.0;
        this.zoomMin = 0.4; this.zoomMax = 2.5; this.zoomSpeed = 4;
        this.time = 0;
        this.damageNumbers = [];
        this.shakeTimer = 0; this.shakeIntensity = 0;
        this.actionButtons = [];
        this._ptrH = null; this._wheelH = null; this._keyH = null;
        this._pinch = null;
        this.onComplete = null;
        this._raf = null; this._lastT = 0;
        this._scenario = null;
    }

    // ── Loading ───────────────────────────────────────────────────────
    loadScenario(sc) {
        this._scenario = sc;
        const tNames = sc.terrain.map(id => TERRAIN_NAMES[id] || 'GRASS');
        // Build triggers in engine format: { id, condition: fn(), action: fn() }
        const engineTriggers = (sc.triggers || [])
            .filter(t => t.id !== 'opening') // opening handled separately
            .map(t => ({
                id: t.id,
                condition: () => t.condition(this.engine),
                action: () => {
                    if (t.dialogueChain) {
                        for (const l of t.dialogueChain)
                            this.engine.queueDialogue(l.speaker, l.text, null);
                    }
                },
            }));
        this.engine.loadBattle({
            map: { width: sc.mapWidth, height: sc.mapHeight, terrain: tNames },
            units: [...sc.playerUnits, ...sc.enemyUnits],
            dialogue: {
                intro: [],
                victory: sc.victoryDialogue || [],
                defeat: sc.defeatDialogue || [],
            },
            storyTriggers: engineTriggers,
        });
        this.spriteCache = buildTacticsSpriteCache(this.pixelScale);
        this._buildTerrainCache();
        const pu = this.engine.getTeamUnits('player');
        if (pu.length) {
            const ax = pu.reduce((s,u)=>s+u.x,0)/pu.length;
            const ay = pu.reduce((s,u)=>s+u.y,0)/pu.length;
            this.camX = this.camTargetX = (ax+0.5)*this.ts;
            this.camY = this.camTargetY = (ay+0.5)*this.ts;
        }
    }

    // ── Start / Stop ──────────────────────────────────────────────────
    start() {
        this._resize();
        this.engine.onEvent = (n,d) => this._onEv(n,d);
        this._bindInput();
        this._lastT = 0;
        this._raf = requestAnimationFrame(t => this._loop(t));
        // Fire opening dialogue from scenario triggers
        const op = (this._scenario.triggers||[]).find(t=>t.id==='opening');
        if (op && op.dialogueChain) {
            for (const l of op.dialogueChain) this.engine.queueDialogue(l.speaker, l.text, null);
        }
    }
    stop() {
        this._unbindInput();
        if (this._raf) cancelAnimationFrame(this._raf);
        this._raf = null; this.engine.onEvent = null;
    }
    _resize() {
        const p = this.canvas.parentElement;
        if (p) { this.canvas.width=p.clientWidth||480; this.canvas.height=p.clientHeight||360; }
    }

    // ── Terrain cache ─────────────────────────────────────────────────
    _buildTerrainCache() {
        this.terrainCache = {};
        const s = this.pixelScale;
        for (const name of Object.keys(TERRAIN_COLORS)) {
            const sk = 'tile_'+name.toLowerCase();
            const sd = TACTICS_SPRITES[sk];
            if (sd && Array.isArray(sd[0]) && typeof sd[0][0]==='string') {
                this.terrainCache[name] = sd.map(fr => _renderSprite(fr, TACTICS_PALETTE, s));
            } else if (sd && typeof sd[0]==='string') {
                this.terrainCache[name] = [_renderSprite(sd, TACTICS_PALETTE, s)];
            }
            if (!this.terrainCache[name]||!this.terrainCache[name].length) {
                const col = TERRAIN_COLORS[name];
                const c = document.createElement('canvas'); c.width=16*s; c.height=16*s;
                const cx = c.getContext('2d');
                cx.fillStyle=col.bg; cx.fillRect(0,0,c.width,c.height);
                cx.fillStyle=col.d1;
                for (let i=0;i<8;i++) cx.fillRect(((i*7+3)%16)*s,((i*11+5)%16)*s,s,s);
                cx.fillStyle=col.d2;
                for (let i=0;i<4;i++) cx.fillRect(((i*13+1)%16)*s,((i*9+7)%16)*s,s,s);
                this.terrainCache[name] = [c];
            }
        }
    }

    // ── Engine events ─────────────────────────────────────────────────
    _onEv(name, data) {
        if (name==='unit_attacked' && data.defender) {
            this.damageNumbers.push({
                x:(data.defender.x+0.5)*this.ts, y:data.defender.y*this.ts-8,
                text:data.critical?data.damage+'!':''+data.damage,
                color:data.critical?TPAL.YELLOW:TPAL.WHITE, timer:0, max:1.2});
            this.shakeTimer=data.critical?0.3:0.15;
            this.shakeIntensity=data.critical?4:2;
        } else if (name==='unit_healed' && data.target) {
            this.damageNumbers.push({
                x:(data.target.x+0.5)*this.ts, y:data.target.y*this.ts-8,
                text:'+'+data.amount, color:TPAL.HP_GREEN, timer:0, max:1.2});
        } else if (name==='victory' && this._scenario.victoryDialogue) {
            for (const l of this._scenario.victoryDialogue) this.engine.queueDialogue(l.speaker,l.text,null);
        } else if (name==='defeat' && this._scenario.defeatDialogue) {
            for (const l of this._scenario.defeatDialogue) this.engine.queueDialogue(l.speaker,l.text,null);
        } else if (name==='phase_change' && data.phase==='enemy') {
            const eu=this.engine.getTeamUnits('enemy');
            if (eu.length){this.camTargetX=(eu[0].x+0.5)*this.ts;this.camTargetY=(eu[0].y+0.5)*this.ts;}
        } else if (name==='unit_moved' && data.unit && data.unit.team==='enemy') {
            this.camTargetX=(data.unit.x+0.5)*this.ts;
            this.camTargetY=(data.unit.y+0.5)*this.ts;
        }
    }

    // ── Game loop ─────────────────────────────────────────────────────
    _loop(ts) {
        if (!this._raf) return;
        if (!this._lastT) this._lastT=ts;
        const dt=Math.min((ts-this._lastT)/1000,0.1);
        this._lastT=ts;
        this._update(dt); this._render();
        this._raf = requestAnimationFrame(t=>this._loop(t));
    }
    _update(dt) {
        this.time+=dt;
        this.camX+=(this.camTargetX-this.camX)*this.camSpeed*dt;
        this.camY+=(this.camTargetY-this.camY)*this.camSpeed*dt;
        this.zoom+=(this.zoomTarget-this.zoom)*this.zoomSpeed*dt;
        if (this.shakeTimer>0) this.shakeTimer-=dt;
        for (let i=this.damageNumbers.length-1;i>=0;i--) {
            const d=this.damageNumbers[i]; d.timer+=dt; d.y-=30*dt;
            if (d.timer>=d.max) this.damageNumbers.splice(i,1);
        }
        const act=this.engine.selectedUnit;
        if (act&&act.alive){this.camTargetX=(act.x+0.5)*this.ts;this.camTargetY=(act.y+0.5)*this.ts;}
        this.engine.checkStoryTriggers();
    }

    // ── RENDER ────────────────────────────────────────────────────────
    _render() {
        const ctx=this.ctx, cw=this.canvas.width, ch=this.canvas.height, ts=this.ts, z=this.zoom;
        ctx.imageSmoothingEnabled=false;
        ctx.fillStyle=TPAL.BLACK; ctx.fillRect(0,0,cw,ch);
        if (!this.engine.map) return;
        const scrollX=this.camX*z-cw/2, scrollY=this.camY*z-ch/2;
        let sx=0,sy=0;
        if (this.shakeTimer>0){sx=(Math.random()-0.5)*this.shakeIntensity*2;sy=(Math.random()-0.5)*this.shakeIntensity*2;}
        ctx.save(); ctx.translate(-scrollX+sx,-scrollY+sy); ctx.scale(z,z);
        const mW=this.engine.map.width, mH=this.engine.map.height;
        const sc=Math.max(0,Math.floor(scrollX/z/ts)-1), ec=Math.min(mW,Math.ceil((scrollX/z+cw/z)/ts)+1);
        const sr=Math.max(0,Math.floor(scrollY/z/ts)-1), er=Math.min(mH,Math.ceil((scrollY/z+ch/z)/ts)+1);
        this._rTerrain(ctx,sc,ec,sr,er,ts);
        this._rGrid(ctx,sc,ec,sr,er,ts);
        this._rHL(ctx,ts);
        this._rUnits(ctx,ts);
        this._rCursor(ctx,ts);
        this._rDmg(ctx);
        ctx.restore();
        this._rBanner(ctx,cw,ch);
        this._rInfo(ctx,cw,ch);
        this._rActions(ctx,cw,ch);
        this._rDlg(ctx,cw,ch);
        this._rEnd(ctx,cw,ch);
        if (Math.abs(this.zoom-1)>0.05){
            ctx.save();ctx.font='bold 11px monospace';ctx.fillStyle='rgba(255,255,255,0.4)';
            ctx.textAlign='right';ctx.fillText((this.zoom*100|0)+'%',cw-6,ch-6);ctx.restore();
        }
    }
    _rTerrain(ctx,sc,ec,sr,er,ts) {
        for (let r=sr;r<er;r++) for (let c=sc;c<ec;c++) {
            const t=this.engine.getTerrain(c,r), nm=t.name.toUpperCase();
            const arr=this.terrainCache[nm];
            if(arr) ctx.drawImage(arr[((c*7+r*13)&0x7FFFFFFF)%arr.length],c*ts,r*ts,ts,ts);
            else{ctx.fillStyle='#38b764';ctx.fillRect(c*ts,r*ts,ts,ts);}
            if(nm==='WATER'){
                ctx.fillStyle='rgba(88,152,200,0.25)';
                ctx.fillRect(c*ts,r*ts+Math.sin(this.time*3+c*2)*2+(Math.floor(this.time*2)%4)*4,ts,4);
            }
        }
    }
    _rGrid(ctx,sc,ec,sr,er,ts) {
        ctx.strokeStyle='rgba(0,0,0,0.12)';ctx.lineWidth=0.5;
        for(let r=sr;r<=er;r++){ctx.beginPath();ctx.moveTo(sc*ts,r*ts);ctx.lineTo(ec*ts,r*ts);ctx.stroke();}
        for(let c=sc;c<=ec;c++){ctx.beginPath();ctx.moveTo(c*ts,sr*ts);ctx.lineTo(c*ts,er*ts);ctx.stroke();}
    }
    _rHL(ctx,ts) {
        const e=this.engine;
        if(e.movableTiles.length){
            const p=0.35+Math.sin(this.time*4)*0.1;
            ctx.fillStyle=`rgba(80,130,255,${p})`;
            for(const t of e.movableTiles)ctx.fillRect(t.x*ts+1,t.y*ts+1,ts-2,ts-2);
            ctx.strokeStyle=`rgba(80,130,255,${p+0.15})`;ctx.lineWidth=1.5;
            for(const t of e.movableTiles)ctx.strokeRect(t.x*ts+1,t.y*ts+1,ts-2,ts-2);
        }
        if(e.attackableTiles.length){
            const p=0.35+Math.sin(this.time*5)*0.1;
            ctx.fillStyle=`rgba(255,80,80,${p})`;
            for(const t of e.attackableTiles)ctx.fillRect(t.x*ts+1,t.y*ts+1,ts-2,ts-2);
            ctx.strokeStyle=`rgba(255,80,80,${p+0.15})`;ctx.lineWidth=1.5;
            for(const t of e.attackableTiles)ctx.strokeRect(t.x*ts+1,t.y*ts+1,ts-2,ts-2);
        }
    }
    _rUnits(ctx,ts) {
        const units=this.engine.units.filter(u=>u.alive).sort((a,b)=>a.y-b.y);
        for(const u of units){
            const px=u.x*ts,py=u.y*ts;
            ctx.fillStyle='rgba(0,0,0,0.18)';
            ctx.beginPath();ctx.ellipse(px+ts/2,py+ts-3,ts*0.28,ts*0.08,0,0,Math.PI*2);ctx.fill();
            let by=0;
            if(u===this.engine.selectedUnit)by=Math.sin(this.time*6)*3;
            const dir=['down','left','right','up'][u.dir||0];
            const fi=Math.floor(this.time*3)%2;
            let sp=getTacticsSprite(this.spriteCache,u.spriteKey+'_'+dir,fi);
            if(!sp)sp=getTacticsSprite(this.spriteCache,u.spriteKey+'_down',fi);
            if(u.acted)ctx.globalAlpha=0.45;
            if(sp)ctx.drawImage(sp,px,py+by-4,ts,ts);
            else{
                ctx.fillStyle=u.team==='player'?'#4488ff':'#ff4444';
                ctx.beginPath();ctx.arc(px+ts/2,py+ts/2+by,ts*0.32,0,Math.PI*2);ctx.fill();
                ctx.fillStyle=TPAL.WHITE;ctx.font='bold 11px monospace';ctx.textAlign='center';
                ctx.fillText(u.name[0],px+ts/2,py+ts/2+by+4);
            }
            ctx.globalAlpha=1;
            this._hp(ctx,px+4,py+ts-6+by,ts-8,4,u.hp,u.maxHp);
            ctx.fillStyle=u.team==='player'?'#4488ff':'#ff4444';
            ctx.beginPath();ctx.arc(px+ts-5,py+5+by,3,0,Math.PI*2);ctx.fill();
            if(u.unitClass==='boss'||u.id==='boss'){
                ctx.fillStyle=TPAL.YELLOW;ctx.font='10px serif';ctx.textAlign='center';
                ctx.fillText('\u265A',px+ts/2,py+by-2);
            }
        }
    }
    _hp(ctx,x,y,w,h,hp,mx){
        const p=hp/mx;
        ctx.fillStyle='#1a1a2e';ctx.fillRect(x,y,w,h);
        ctx.fillStyle=p>0.5?TPAL.HP_GREEN:p>0.25?TPAL.HP_YELLOW:TPAL.HP_RED;
        ctx.fillRect(x,y,w*p,h);
        ctx.strokeStyle='#000';ctx.lineWidth=0.5;ctx.strokeRect(x,y,w,h);
    }
    _rCursor(ctx,ts){
        const e=this.engine,cx=e.cursor.x,cy=e.cursor.y;
        if(cx<0||cy<0)return;
        if(e.state==='dialogue'||e.state==='victory'||e.state==='defeat')return;
        const px=cx*ts,py=cy*ts,pu=0.6+Math.sin(this.time*5)*0.25;
        ctx.strokeStyle=`rgba(248,216,48,${pu})`;ctx.lineWidth=2;
        ctx.strokeRect(px+1,py+1,ts-2,ts-2);
        const cl=7;ctx.strokeStyle=TPAL.YELLOW;ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(px,py+cl);ctx.lineTo(px,py);ctx.lineTo(px+cl,py);ctx.stroke();
        ctx.beginPath();ctx.moveTo(px+ts-cl,py);ctx.lineTo(px+ts,py);ctx.lineTo(px+ts,py+cl);ctx.stroke();
        ctx.beginPath();ctx.moveTo(px,py+ts-cl);ctx.lineTo(px,py+ts);ctx.lineTo(px+cl,py+ts);ctx.stroke();
        ctx.beginPath();ctx.moveTo(px+ts-cl,py+ts);ctx.lineTo(px+ts,py+ts);ctx.lineTo(px+ts,py+ts-cl);ctx.stroke();
    }
    _rDmg(ctx){
        for(const d of this.damageNumbers){
            const a=1-d.timer/d.max;
            ctx.save();ctx.globalAlpha=a;ctx.font='bold 16px monospace';ctx.textAlign='center';
            ctx.fillStyle=TPAL.BLACK;ctx.fillText(d.text,d.x+1,d.y+1);
            ctx.fillStyle=d.color;ctx.fillText(d.text,d.x,d.y);ctx.restore();
        }
    }
    _rBanner(ctx,cw,ch){
        const e=this.engine;
        if(e.state==='dialogue'||e.state==='victory'||e.state==='defeat')return;
        const isE=e.state.startsWith('enemy');
        const txt=isE?`Enemy Phase \u2014 Round ${e.turnNumber}`:`Your Turn \u2014 Round ${e.turnNumber}`;
        ctx.save();ctx.font='bold 13px monospace';
        const tw=ctx.measureText(txt).width;
        const bx=(cw-tw)/2-12,by=4,bw=tw+24,bh=22;
        this._dq(ctx,bx,by,bw,bh);
        ctx.fillStyle=isE?'#ff8888':TPAL.UI_TEXT;ctx.textAlign='center';ctx.fillText(txt,cw/2,by+16);
        ctx.restore();
    }
    _rInfo(ctx,cw,ch){
        const sel=this.engine.selectedUnit;if(!sel)return;
        this._pan(ctx,6,32,140,sel);
        const tgt=this.engine.getUnitAt(this.engine.cursor.x,this.engine.cursor.y);
        if(tgt&&tgt!==sel&&tgt.alive)this._pan(ctx,cw-146,32,140,tgt);
    }
    _pan(ctx,x,y,w,u){
        const h=70;this._dq(ctx,x,y,w,h);
        ctx.save();
        ctx.font='bold 12px monospace';ctx.fillStyle=u.team==='player'?'#88bbff':'#ff8888';
        ctx.textAlign='left';ctx.fillText(u.name,x+8,y+16);
        ctx.font='10px monospace';ctx.fillStyle=TPAL.UI_TEXT;
        ctx.fillText('HP',x+8,y+31);this._hp(ctx,x+28,y+24,w-38,7,u.hp,u.maxHp);
        ctx.fillText(`${u.hp}/${u.maxHp}`,x+8,y+44);
        ctx.fillText(`ATK:${u.atk} DEF:${u.def} SPD:${u.spd}`,x+8,y+56);
        if(u.maxMp>0){ctx.fillStyle='#88aaff';ctx.fillText(`MP:${u.mp}/${u.maxMp}`,x+8,y+66);}
        ctx.restore();
    }
    _rActions(ctx,cw,ch){
        const e=this.engine;
        if(e.state!=='player_action'){this.actionButtons=[];return;}
        const u=e.selectedUnit;if(!u)return;
        const items=[];
        if(!u.moved)items.push('Move');
        items.push('Attack');
        for(const ab of(u.abilities||[])){if(ab==='attack')continue;const d=ABILITY_DEFS[ab];if(d&&u.mp>=d.mpCost)items.push(d.name);}
        items.push('Wait');
        const bw=120,bh=28,gap=4;
        const mH=items.length*(bh+gap)+gap,mx=cw/2-bw/2,my=ch/2-mH/2;
        this._dq(ctx,mx-8,my-8,bw+16,mH+16);
        this.actionButtons=[];
        ctx.save();
        for(let i=0;i<items.length;i++){
            const bx=mx,bby=my+i*(bh+gap);
            ctx.fillStyle='#001088';ctx.fillRect(bx,bby,bw,bh);
            ctx.strokeStyle=TPAL.UI_BORDER;ctx.lineWidth=1;ctx.strokeRect(bx,bby,bw,bh);
            ctx.font='bold 13px monospace';ctx.fillStyle=TPAL.UI_TEXT;ctx.textAlign='center';
            ctx.fillText(items[i],bx+bw/2,bby+19);
            this.actionButtons.push({label:items[i],x:bx,y:bby,w:bw,h:bh});
        }
        ctx.restore();
    }
    _rDlg(ctx,cw,ch){
        const e=this.engine;if(!e.currentDialogue)return;
        const bH=80,bY=ch-bH-8,bX=16,bW=cw-32;
        this._dq(ctx,bX,bY,bW,bH);
        ctx.save();
        const{speaker,text}=e.currentDialogue;
        if(speaker){ctx.font='bold 13px monospace';ctx.fillStyle=TPAL.UI_ACCENT;ctx.textAlign='left';ctx.fillText(speaker,bX+12,bY+18);}
        ctx.font='12px monospace';ctx.fillStyle=TPAL.UI_TEXT;
        const maxW=bW-24,lH=16,words=text.split(' ');
        let line='',ly=bY+(speaker?36:20);
        for(const w of words){const t=line+(line?' ':'')+w;if(ctx.measureText(t).width>maxW){ctx.fillText(line,bX+12,ly);line=w;ly+=lH;}else line=t;}
        if(line)ctx.fillText(line,bX+12,ly);
        if(Math.floor(this.time*3)%2===0){ctx.fillStyle=TPAL.UI_TEXT;ctx.font='10px monospace';ctx.textAlign='right';ctx.fillText('TAP \u25B6',bX+bW-12,bY+bH-10);}
        ctx.restore();
    }
    _rEnd(ctx,cw,ch){
        const e=this.engine;
        if(e.state!=='victory'&&e.state!=='defeat')return;
        if(e.currentDialogue)return;
        ctx.save();ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,cw,ch);
        const win=e.state==='victory';
        ctx.font='bold 32px monospace';ctx.textAlign='center';
        ctx.fillStyle='#000';ctx.fillText(win?'VICTORY!':'DEFEAT',cw/2+2,ch/2-18);
        ctx.fillStyle=win?TPAL.YELLOW:TPAL.HP_RED;ctx.fillText(win?'VICTORY!':'DEFEAT',cw/2,ch/2-20);
        ctx.font='14px monospace';ctx.fillStyle=TPAL.UI_TEXT;ctx.fillText('Tap to continue',cw/2,ch/2+20);
        ctx.restore();
    }
    _dq(ctx,x,y,w,h){
        ctx.save();ctx.fillStyle=TPAL.UI_BG;ctx.fillRect(x+2,y+2,w-4,h-4);
        ctx.strokeStyle=TPAL.UI_BORDER;ctx.lineWidth=2;const r=4;
        ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);
        ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);
        ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.stroke();
        ctx.strokeStyle='rgba(255,255,255,0.12)';ctx.lineWidth=1;ctx.strokeRect(x+4,y+4,w-8,h-8);
        ctx.restore();
    }

    // ── Input ─────────────────────────────────────────────────────────
    _bindInput(){
        this._ptrH=e=>{e.preventDefault();e.stopPropagation();this._onPtr(e);};
        this.canvas.addEventListener('pointerdown',this._ptrH);
        this._wheelH=e=>{e.preventDefault();this.zoomTarget=Math.max(this.zoomMin,Math.min(this.zoomMax,this.zoomTarget+(e.deltaY>0?-0.12:0.12)));};
        this.canvas.addEventListener('wheel',this._wheelH,{passive:false});
        this._keyH=e=>{
            if(e.key==='+'||e.key==='=')this.zoomTarget=Math.min(this.zoomMax,this.zoomTarget+0.15);
            else if(e.key==='-'||e.key==='_')this.zoomTarget=Math.max(this.zoomMin,this.zoomTarget-0.15);
            else if(e.key==='0')this.zoomTarget=1;
            else if(e.key==='Escape')this.engine.cancelSelection();
        };
        document.addEventListener('keydown',this._keyH);
        this.canvas.addEventListener('touchstart',e=>{
            if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;this._pinch={dist:Math.sqrt(dx*dx+dy*dy),zoom:this.zoomTarget};}
        },{passive:true});
        this.canvas.addEventListener('touchmove',e=>{
            if(e.touches.length===2&&this._pinch){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;this.zoomTarget=Math.max(this.zoomMin,Math.min(this.zoomMax,this._pinch.zoom*(Math.sqrt(dx*dx+dy*dy)/this._pinch.dist)));}
        },{passive:true});
        this.canvas.addEventListener('touchend',()=>{this._pinch=null;},{passive:true});
    }
    _unbindInput(){
        if(this._ptrH)this.canvas.removeEventListener('pointerdown',this._ptrH);
        if(this._wheelH)this.canvas.removeEventListener('wheel',this._wheelH);
        if(this._keyH)document.removeEventListener('keydown',this._keyH);
    }
    _onPtr(e){
        const rect=this.canvas.getBoundingClientRect();
        const sx=(e.clientX-rect.left)*(this.canvas.width/rect.width);
        const sy=(e.clientY-rect.top)*(this.canvas.height/rect.height);
        for(const b of this.actionButtons){if(sx>=b.x&&sx<=b.x+b.w&&sy>=b.y&&sy<=b.y+b.h){this._doAct(b.label);return;}}
        if((this.engine.state==='victory'||this.engine.state==='defeat')&&!this.engine.currentDialogue){if(this.onComplete)this.onComplete();return;}
        const scrollX=this.camX*this.zoom-this.canvas.width/2;
        const scrollY=this.camY*this.zoom-this.canvas.height/2;
        this.engine.handleTap(Math.floor((sx+scrollX)/this.zoom/this.ts),Math.floor((sy+scrollY)/this.zoom/this.ts));
    }
    _doAct(label){
        const e=this.engine,u=e.selectedUnit;if(!u)return;
        if(label==='Move'){e.movableTiles=e.calcMovementRange(u);e.state='player_move';}
        else if(label==='Attack')e.beginAttackTarget();
        else if(label==='Wait')e.endUnitTurn();
        else{for(const ab of(u.abilities||[])){const d=ABILITY_DEFS[ab];if(d&&d.name===label){e.beginAbilityTarget(ab);break;}}}
    }
}

// =============================================================================
// LAUNCH
// =============================================================================
function startTacticalBattle(){
    document.querySelectorAll('.overlay-screen').forEach(s=>s.style.display='none');
    ['hud','game-controls','bottom-bar','trivia-panel','upgrade-panel','pause-overlay'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
    const canvas=document.getElementById('game-canvas');
    canvas.style.display='block';
    const p=canvas.parentElement;
    if(p){canvas.width=p.clientWidth||window.innerWidth;canvas.height=p.clientHeight||window.innerHeight;}
    const battle=new TacticalBattle(canvas);
    battle.loadScenario(PROLOGUE_SCENARIO);
    battle.onComplete=()=>{battle.stop();document.getElementById('title-screen').style.display='flex';};
    battle.start();
}
