// JRPG Story Engine - Dialogue, scenes, cutscenes, and quest tracking
// Drives the narrative layer of Puppy Academy

class StoryEngine {
    constructor(canvas, academy) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.academy = academy;

        // Current scene state
        this.active = false;
        this.currentEpisode = null;
        this.sceneIndex = 0;
        this.stepIndex = 0;
        this.scene = null;
        this.step = null;

        // Dialogue state
        this.dialogueText = '';
        this.dialogueSpeaker = '';
        this.dialogueSpeakerEmoji = '';
        this.dialogueChoices = null;
        this.dialogueTyping = false;
        this.dialogueChars = 0;
        this.dialogueSpeed = 40; // chars per second
        this._typeTimer = 0;

        // Visual state
        this.bgColor = '#1a1a2e';
        this.bgEmojis = [];     // background scene decorations
        this.characters = [];    // [{emoji, x, y, name, scale}]
        this.fadeAlpha = 0;
        this.fadeTarget = 0;
        this.fadeSpeed = 2;
        this.shakeTimer = 0;
        this.shakeIntensity = 0;

        // Exploration state
        this.exploring = false;
        this.exploMap = null;
        this.playerX = 0;
        this.playerY = 0;
        this.playerDir = 'down';
        this.npcs = [];
        this.mapTriggers = [];  // [{x, y, w, h, action}]
        this._moveTarget = null;
        this._animTimer = 0;

        // Transition effects
        this._transition = null; // {type, progress, duration, callback}

        // Callbacks
        this.onComplete = null; // called when episode ends
        this.onBattle = null;   // called when story triggers a battle

        // Input
        this._clickHandler = null;
        this._touchHandler = null;
    }

    // === PUBLIC API ===

    startEpisode(episodeData, onComplete, onBattle) {
        this.active = true;
        this.currentEpisode = episodeData;
        this.sceneIndex = 0;
        this.stepIndex = 0;
        this.onComplete = onComplete;
        this.onBattle = onBattle;
        this.exploring = false;

        // Show canvas, hide hub
        this.canvas.style.display = 'block';

        this._bindInput();
        this._startScene(0);
        this._raf = requestAnimationFrame((t) => this._loop(t));
    }

    stop() {
        this.active = false;
        this._unbindInput();
        if (this._raf) cancelAnimationFrame(this._raf);
    }

    // Resume after a battle mid-story
    resumeAfterBattle() {
        this.active = true;
        this._bindInput();
        this.stepIndex++;
        this._advanceStep();
        this._raf = requestAnimationFrame((t) => this._loop(t));
    }

    // === SCENE MANAGEMENT ===

    _startScene(idx) {
        const ep = this.currentEpisode;
        if (idx >= ep.scenes.length) {
            this._endEpisode();
            return;
        }

        this.sceneIndex = idx;
        this.scene = ep.scenes[idx];
        this.stepIndex = 0;

        // Apply scene defaults
        this.bgColor = this.scene.bg || '#1a1a2e';
        this.bgEmojis = this.scene.bgEmojis || [];
        this.characters = [];

        if (this.scene.characters) {
            this.characters = this.scene.characters.map(c => ({ ...c }));
        }

        // If scene is exploration, set up the map
        if (this.scene.type === 'explore') {
            this._setupExploration(this.scene);
        } else {
            this.exploring = false;
        }

        this._advanceStep();
    }

    _advanceStep() {
        if (!this.scene) return;
        const steps = this.scene.steps;
        if (this.stepIndex >= steps.length) {
            // Scene complete, go to next
            this._transition = {
                type: 'fade',
                progress: 0,
                duration: 0.5,
                callback: () => this._startScene(this.sceneIndex + 1)
            };
            this.fadeTarget = 1;
            return;
        }

        this.step = steps[this.stepIndex];
        this._executeStep(this.step);
    }

    _executeStep(step) {
        switch (step.type) {
            case 'dialogue':
                this.dialogueSpeaker = step.speaker || '';
                this.dialogueSpeakerEmoji = step.emoji || '';
                this.dialogueText = this._substituteVars(step.text);
                this.dialogueChars = 0;
                this.dialogueTyping = true;
                this.dialogueChoices = null;
                break;

            case 'choice':
                this.dialogueSpeaker = step.speaker || '';
                this.dialogueSpeakerEmoji = step.emoji || '';
                this.dialogueText = this._substituteVars(step.text);
                this.dialogueChars = step.text.length; // show full text
                this.dialogueTyping = false;
                this.dialogueChoices = step.choices;
                break;

            case 'narration':
                this.dialogueSpeaker = '';
                this.dialogueSpeakerEmoji = '';
                this.dialogueText = this._substituteVars(step.text);
                this.dialogueChars = 0;
                this.dialogueTyping = true;
                this.dialogueChoices = null;
                break;

            case 'enter':
                this._addCharacter(step);
                this.stepIndex++;
                this._advanceStep();
                break;

            case 'exit':
                this.characters = this.characters.filter(c => c.id !== step.id);
                this.stepIndex++;
                this._advanceStep();
                break;

            case 'move':
                const ch = this.characters.find(c => c.id === step.id);
                if (ch) { ch.x = step.x; ch.y = step.y; }
                this.stepIndex++;
                this._advanceStep();
                break;

            case 'bg':
                this.bgColor = step.color || this.bgColor;
                if (step.emojis) this.bgEmojis = step.emojis;
                this.stepIndex++;
                this._advanceStep();
                break;

            case 'shake':
                this.shakeTimer = step.duration || 0.5;
                this.shakeIntensity = step.intensity || 6;
                this.stepIndex++;
                this._advanceStep();
                break;

            case 'pause':
                setTimeout(() => {
                    this.stepIndex++;
                    this._advanceStep();
                }, (step.duration || 1) * 1000);
                break;

            case 'battle':
                // Trigger a tower defense battle, story pauses
                this.active = false;
                this._unbindInput();
                if (this._raf) cancelAnimationFrame(this._raf);
                if (this.onBattle) this.onBattle(step.level || 0);
                break;

            case 'reward':
                if (step.bones) this.academy.bones += step.bones;
                if (step.treats) this.academy.treats += step.treats;
                if (step.xp) this.academy.addXP(step.xp);
                if (step.dog) {
                    this.academy.createDog(step.dog.breed, step.dog.name);
                }
                SaveSystem.saveLocal(this.academy);
                this.stepIndex++;
                this._advanceStep();
                break;

            case 'explore':
                this._setupExploration(step);
                break;

            case 'endExplore':
                this.exploring = false;
                this.stepIndex++;
                this._advanceStep();
                break;

            case 'flag':
                // Set a story flag on the academy
                if (!this.academy.storyFlags) this.academy.storyFlags = {};
                this.academy.storyFlags[step.flag] = step.value !== undefined ? step.value : true;
                SaveSystem.saveLocal(this.academy);
                this.stepIndex++;
                this._advanceStep();
                break;

            default:
                this.stepIndex++;
                this._advanceStep();
        }
    }

    _substituteVars(text) {
        const dog = this.academy.getActiveDog();
        const bd = dog ? this.academy.getBreedData(dog) : null;
        return text
            .replace(/{playerName}/g, this.academy.playerName || 'Trainer')
            .replace(/{dogName}/g, dog ? dog.name : 'your dog')
            .replace(/{dogBreed}/g, bd ? bd.breed : 'dog')
            .replace(/{dogEmoji}/g, bd ? bd.emoji : '🐕');
    }

    _addCharacter(step) {
        const existing = this.characters.find(c => c.id === step.id);
        if (existing) {
            Object.assign(existing, { x: step.x, y: step.y, emoji: step.emoji, name: step.name, scale: step.scale || 1 });
        } else {
            this.characters.push({
                id: step.id,
                emoji: step.emoji || '🐕',
                name: step.name || '',
                x: step.x !== undefined ? step.x : 0.5,
                y: step.y !== undefined ? step.y : 0.6,
                scale: step.scale || 1,
            });
        }
    }

    _endEpisode() {
        this.active = false;
        this._unbindInput();
        if (this._raf) cancelAnimationFrame(this._raf);

        // Mark episode complete
        if (!this.academy.storyFlags) this.academy.storyFlags = {};
        this.academy.storyFlags['ep' + this.currentEpisode.id + '_complete'] = true;
        this.academy.storyProgress = Math.max(
            this.academy.storyProgress || 0,
            this.currentEpisode.id
        );
        SaveSystem.saveLocal(this.academy);

        if (this.onComplete) this.onComplete();
    }

    // === EXPLORATION ===

    _setupExploration(step) {
        this.exploring = true;
        this.exploMap = step.map || null;
        this.playerX = step.startX !== undefined ? step.startX : 5;
        this.playerY = step.startY !== undefined ? step.startY : 8;
        this.playerDir = 'down';
        this.npcs = (step.npcs || []).map(n => ({ ...n }));
        this.mapTriggers = step.triggers || [];
        this._moveTarget = null;
        this.dialogueText = '';
        this.dialogueSpeaker = '';
    }

    _handleExplorationTap(wx, wy) {
        const tileSize = Math.min(this.canvas.width / 12, this.canvas.height / 16);

        // Check NPC interaction (tap on NPC)
        for (const npc of this.npcs) {
            const nx = npc.x * tileSize + tileSize / 2;
            const ny = npc.y * tileSize + tileSize / 2;
            const dx = wx - nx, dy = wy - ny;
            if (Math.sqrt(dx * dx + dy * dy) < tileSize * 1.2) {
                // Adjacent check
                const dist = Math.abs(this.playerX - npc.x) + Math.abs(this.playerY - npc.y);
                if (dist <= 2) {
                    this._triggerNPC(npc);
                    return;
                } else {
                    // Walk toward NPC first
                    this._moveTarget = { x: npc.x, y: npc.y - 1, then: () => this._triggerNPC(npc) };
                    return;
                }
            }
        }

        // Check trigger zones
        const tx = Math.floor(wx / tileSize);
        const ty = Math.floor(wy / tileSize);
        for (const trigger of this.mapTriggers) {
            if (tx >= trigger.x && tx < trigger.x + (trigger.w || 1) &&
                ty >= trigger.y && ty < trigger.y + (trigger.h || 1)) {
                this._moveTarget = { x: tx, y: ty, then: () => this._executeTrigger(trigger) };
                return;
            }
        }

        // Just move player
        this._moveTarget = { x: tx, y: ty };
    }

    _triggerNPC(npc) {
        if (npc.dialogue) {
            this.dialogueSpeaker = npc.name || '';
            this.dialogueSpeakerEmoji = npc.emoji || '';
            this.dialogueText = this._substituteVars(npc.dialogue);
            this.dialogueChars = 0;
            this.dialogueTyping = true;
            this.dialogueChoices = null;
        }
        if (npc.onInteract) {
            npc.onInteract();
        }
        if (npc.advanceStory) {
            this.exploring = false;
            this.stepIndex++;
            this._advanceStep();
        }
    }

    _executeTrigger(trigger) {
        if (trigger.action === 'nextStep') {
            this.exploring = false;
            this.stepIndex++;
            this._advanceStep();
        } else if (trigger.action === 'dialogue') {
            this.dialogueSpeaker = '';
            this.dialogueSpeakerEmoji = '';
            this.dialogueText = this._substituteVars(trigger.text);
            this.dialogueChars = 0;
            this.dialogueTyping = true;
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
        // Typing animation
        if (this.dialogueTyping && this.dialogueChars < this.dialogueText.length) {
            this._typeTimer += dt;
            const charsToAdd = Math.floor(this._typeTimer * this.dialogueSpeed);
            if (charsToAdd > 0) {
                this.dialogueChars = Math.min(this.dialogueChars + charsToAdd, this.dialogueText.length);
                this._typeTimer = 0;
            }
            if (this.dialogueChars >= this.dialogueText.length) {
                this.dialogueTyping = false;
            }
        }

        // Fade transition
        if (this._transition) {
            this._transition.progress += dt / this._transition.duration;
            if (this._transition.progress >= 1) {
                const cb = this._transition.callback;
                this._transition = null;
                this.fadeAlpha = 0;
                if (cb) cb();
            } else {
                // Fade out then in
                if (this._transition.progress < 0.5) {
                    this.fadeAlpha = this._transition.progress * 2;
                } else {
                    this.fadeAlpha = (1 - this._transition.progress) * 2;
                }
            }
        }

        // Shake
        if (this.shakeTimer > 0) this.shakeTimer -= dt;

        // Exploration movement
        if (this.exploring && this._moveTarget) {
            const speed = 6; // tiles per second
            const dx = this._moveTarget.x - this.playerX;
            const dy = this._moveTarget.y - this.playerY;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < 0.15) {
                this.playerX = this._moveTarget.x;
                this.playerY = this._moveTarget.y;
                const cb = this._moveTarget.then;
                this._moveTarget = null;
                if (cb) cb();
            } else {
                const move = speed * dt;
                this.playerX += (dx / d) * Math.min(move, d);
                this.playerY += (dy / d) * Math.min(move, d);
                // Update facing direction
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.playerDir = dx > 0 ? 'right' : 'left';
                } else {
                    this.playerDir = dy > 0 ? 'down' : 'up';
                }
            }
            this._animTimer += dt;
        }
    }

    // === RENDERING ===

    _render() {
        const ctx = this.ctx;
        const cw = this.canvas.width;
        const ch = this.canvas.height;

        ctx.save();

        // Shake
        if (this.shakeTimer > 0) {
            ctx.translate(
                (Math.random() - 0.5) * this.shakeIntensity * 2,
                (Math.random() - 0.5) * this.shakeIntensity * 2
            );
        }

        if (this.exploring) {
            this._renderExploration(ctx, cw, ch);
        } else {
            this._renderCutscene(ctx, cw, ch);
        }

        // Dialogue box
        if (this.dialogueText) {
            this._renderDialogueBox(ctx, cw, ch);
        }

        // Fade overlay
        if (this.fadeAlpha > 0) {
            ctx.fillStyle = `rgba(0,0,0,${this.fadeAlpha})`;
            ctx.fillRect(0, 0, cw, ch);
        }

        ctx.restore();
    }

    _renderCutscene(ctx, cw, ch) {
        // Background
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(0, 0, cw, ch);

        // Background emojis (decorative)
        ctx.font = `${cw * 0.06}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const be of this.bgEmojis) {
            ctx.globalAlpha = be.alpha || 0.3;
            ctx.fillText(be.emoji, cw * be.x, ch * be.y);
        }
        ctx.globalAlpha = 1;

        // Characters
        for (const ch2 of this.characters) {
            const size = cw * 0.12 * (ch2.scale || 1);
            ctx.font = `${size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ch2.emoji, cw * ch2.x, ch * ch2.y);

            // Name label
            if (ch2.name) {
                ctx.font = `bold ${cw * 0.028}px Arial`;
                ctx.fillStyle = '#fff';
                ctx.fillText(ch2.name, cw * ch2.x, ch * ch2.y + size * 0.6);
            }
        }
    }

    _renderExploration(ctx, cw, ch) {
        const map = this.exploMap;
        if (!map) return;

        const cols = map.width || 12;
        const rows = map.height || 16;
        const ts = Math.min(Math.floor(cw / cols), Math.floor(ch / rows));
        const offX = (cw - cols * ts) / 2;
        const offY = (ch - rows * ts) / 2;

        // Draw tiles
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const tileIdx = r * cols + c;
                const tile = map.tiles ? map.tiles[tileIdx] : 0;
                const px = offX + c * ts;
                const py = offY + r * ts;

                // Tile colors
                switch (tile) {
                    case 0: // grass
                        ctx.fillStyle = (c + r) % 2 === 0 ? '#4A7C2E' : '#3D6B25';
                        break;
                    case 1: // path/road
                        ctx.fillStyle = '#8B7355';
                        break;
                    case 2: // water
                        ctx.fillStyle = '#2196F3';
                        break;
                    case 3: // wall/building
                        ctx.fillStyle = '#6D4C41';
                        break;
                    case 4: // door / interactable
                        ctx.fillStyle = '#FF9800';
                        break;
                    case 5: // dark / cave
                        ctx.fillStyle = '#263238';
                        break;
                    default:
                        ctx.fillStyle = '#4A7C2E';
                }
                ctx.fillRect(px, py, ts, ts);

                // Tile decorations
                if (map.decor && map.decor[tileIdx]) {
                    ctx.font = `${ts * 0.6}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(map.decor[tileIdx], px + ts / 2, py + ts / 2);
                }
            }
        }

        // Trigger zone highlights
        for (const trigger of this.mapTriggers) {
            if (trigger.visible) {
                const px = offX + trigger.x * ts;
                const py = offY + trigger.y * ts;
                const w = (trigger.w || 1) * ts;
                const h = (trigger.h || 1) * ts;
                ctx.fillStyle = 'rgba(255,215,0,0.15)';
                ctx.fillRect(px, py, w, h);
                if (trigger.label) {
                    ctx.font = `bold ${ts * 0.25}px Arial`;
                    ctx.fillStyle = '#FFD700';
                    ctx.textAlign = 'center';
                    ctx.fillText(trigger.label, px + w / 2, py + h / 2);
                }
            }
        }

        // NPCs
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const npc of this.npcs) {
            const nx = offX + npc.x * ts + ts / 2;
            const ny = offY + npc.y * ts + ts / 2;
            ctx.font = `${ts * 0.7}px Arial`;
            ctx.fillText(npc.emoji || '🐕', nx, ny);
            if (npc.name) {
                ctx.font = `bold ${ts * 0.25}px Arial`;
                ctx.fillStyle = '#fff';
                ctx.shadowColor = '#000';
                ctx.shadowBlur = 3;
                ctx.fillText(npc.name, nx, ny - ts * 0.5);
                ctx.shadowBlur = 0;
            }
            // Interaction indicator
            const dist = Math.abs(this.playerX - npc.x) + Math.abs(this.playerY - npc.y);
            if (dist <= 2 && npc.dialogue) {
                ctx.font = `${ts * 0.3}px Arial`;
                ctx.fillText('💬', nx + ts * 0.3, ny - ts * 0.35);
            }
        }

        // Player
        const dog = this.academy.getActiveDog();
        const bd = dog ? this.academy.getBreedData(dog) : null;
        const playerEmoji = bd ? bd.emoji : '🐕';
        const px = offX + this.playerX * ts + ts / 2;
        const py = offY + this.playerY * ts + ts / 2;

        // Bounce animation
        const bounce = this._moveTarget ? Math.sin(this._animTimer * 10) * ts * 0.05 : 0;
        ctx.font = `${ts * 0.75}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(playerEmoji, px, py + bounce);

        // Player name
        if (dog) {
            ctx.font = `bold ${ts * 0.25}px Arial`;
            ctx.fillStyle = '#FFD700';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 3;
            ctx.fillText(dog.name, px, py - ts * 0.5);
            ctx.shadowBlur = 0;
        }

        // Move target indicator
        if (this._moveTarget) {
            const mx = offX + this._moveTarget.x * ts + ts / 2;
            const my = offY + this._moveTarget.y * ts + ts / 2;
            ctx.strokeStyle = 'rgba(255,215,0,0.4)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(mx, my, ts * 0.3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    _renderDialogueBox(ctx, cw, ch) {
        const boxH = ch * 0.28;
        const boxY = ch - boxH - 8;
        const boxX = 8;
        const boxW = cw - 16;
        const pad = 14;

        // Box background
        ctx.fillStyle = 'rgba(15, 10, 8, 0.92)';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 12);
        ctx.fill();

        // Box border
        ctx.strokeStyle = this.dialogueSpeaker ? '#FFD700' : '#8d6e63';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 12);
        ctx.stroke();

        // Speaker name + emoji
        if (this.dialogueSpeaker) {
            const speakerY = boxY + pad + 2;
            if (this.dialogueSpeakerEmoji) {
                ctx.font = `${cw * 0.05}px Arial`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(this.dialogueSpeakerEmoji, boxX + pad, speakerY - 2);
            }
            ctx.font = `bold ${cw * 0.035}px Arial`;
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            const nameX = this.dialogueSpeakerEmoji ? boxX + pad + cw * 0.06 : boxX + pad;
            ctx.fillText(this.dialogueSpeaker, nameX, speakerY);
        }

        // Dialogue text (with typing effect)
        const textY = boxY + pad + (this.dialogueSpeaker ? cw * 0.05 : 4);
        const displayText = this.dialogueText.substring(0, this.dialogueChars);
        ctx.font = `${cw * 0.032}px Arial`;
        ctx.fillStyle = '#e0e0e0';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Word wrap
        this._wrapText(ctx, displayText, boxX + pad, textY, boxW - pad * 2, cw * 0.04);

        // Choices
        if (this.dialogueChoices && !this.dialogueTyping) {
            const choiceY = boxY + boxH - pad - this.dialogueChoices.length * (cw * 0.042);
            for (let i = 0; i < this.dialogueChoices.length; i++) {
                const cy = choiceY + i * (cw * 0.042);
                ctx.fillStyle = '#FFD700';
                ctx.font = `bold ${cw * 0.03}px Arial`;
                ctx.fillText(`▸ ${this.dialogueChoices[i].text}`, boxX + pad + 4, cy);
            }
        }

        // "Tap to continue" indicator
        if (!this.dialogueTyping && !this.dialogueChoices) {
            const blink = Math.sin(Date.now() / 300) > 0;
            if (blink) {
                ctx.font = `${cw * 0.025}px Arial`;
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.textAlign = 'right';
                ctx.fillText('tap to continue ▸', boxX + boxW - pad, boxY + boxH - pad);
            }
        }
    }

    _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let cy = y;

        for (const word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line !== '') {
                ctx.fillText(line.trim(), x, cy);
                line = word + ' ';
                cy += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line.trim(), x, cy);
    }

    // === INPUT ===

    _bindInput() {
        this._clickHandler = (e) => this._onTap(e);
        this.canvas.addEventListener('click', this._clickHandler);
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    }

    _unbindInput() {
        if (this._clickHandler) {
            this.canvas.removeEventListener('click', this._clickHandler);
        }
    }

    _onTap(e) {
        if (!this.active) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Scale to canvas coords
        const sx = x * (this.canvas.width / rect.width);
        const sy = y * (this.canvas.height / rect.height);

        // If typing, skip to end
        if (this.dialogueTyping) {
            this.dialogueChars = this.dialogueText.length;
            this.dialogueTyping = false;
            return;
        }

        // If choices, check which was tapped
        if (this.dialogueChoices) {
            const cw = this.canvas.width;
            const ch = this.canvas.height;
            const boxH = ch * 0.28;
            const boxY = ch - boxH - 8;
            const pad = 14;
            const choiceY = boxY + boxH - pad - this.dialogueChoices.length * (cw * 0.042);

            for (let i = 0; i < this.dialogueChoices.length; i++) {
                const cy = choiceY + i * (cw * 0.042);
                if (sy >= cy - 5 && sy <= cy + cw * 0.04) {
                    const choice = this.dialogueChoices[i];
                    this.dialogueChoices = null;
                    this.dialogueText = '';

                    if (choice.jump !== undefined) {
                        this.stepIndex = choice.jump;
                    } else {
                        this.stepIndex++;
                    }
                    this._advanceStep();
                    return;
                }
            }
            return;
        }

        // If exploring, handle movement/interaction
        if (this.exploring) {
            // Check if tapping dialogue box to dismiss
            const ch = this.canvas.height;
            const boxH = ch * 0.28;
            const boxY = ch - boxH - 8;
            if (this.dialogueText && sy >= boxY) {
                this.dialogueText = '';
                return;
            }

            this._handleExplorationTap(sx, sy);
            return;
        }

        // Otherwise, advance dialogue
        if (this.dialogueText) {
            this.dialogueText = '';
            this.stepIndex++;
            this._advanceStep();
        }
    }
}
