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
        this._punctPause = 0; // punctuation pause counter (in char-times)

        // Choice selection state
        this._selectedChoice = 0;

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

        // Village renderer reference (set externally)
        this.village = null; // Village instance for rich exploration
        this._villageActive = false;

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

        this._showSkipBtn();
        this._bindInput();
        this._startScene(0);
        this._raf = requestAnimationFrame((t) => this._loop(t));
    }

    stop() {
        this.active = false;
        this._unbindInput();
        this._hideSkipBtn();
        if (this._raf) cancelAnimationFrame(this._raf);
    }

    // Resume after a battle mid-story
    resumeAfterBattle() {
        this.active = true;
        this._showSkipBtn();
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
            // Check for village map FIRST - if found, delegate entirely
            const vMapName = this.scene.villageMap;
            const vMaps = window.VILLAGE_MAPS;
            if (vMapName && this.village && vMaps && vMaps[vMapName]) {
                // Get the first explore step for NPCs/triggers
                const exploreStep = this.scene.steps ? this.scene.steps.find(s => s.type === 'explore') : null;
                const mergedStep = { ...this.scene, ...(exploreStep || {}) };
                this._startVillageExploration(vMapName, mergedStep);
                return; // Village takes over - don't advance
            }
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
            // Scene complete, go to next with iris wipe transition
            this._transition = {
                type: 'iris',
                progress: 0,
                duration: 0.8,
                callback: () => this._startScene(this.sceneIndex + 1)
            };
            return;
        }

        this.step = steps[this.stepIndex];
        this._executeStep(this.step);
    }

    _executeStep(step) {
        switch (step.type) {
            case 'dialogue':
                this.dialogueSpeaker = this._substituteVars(step.speaker || '');
                this.dialogueSpeakerEmoji = this._substituteVars(step.emoji || '');
                this.dialogueText = this._substituteVars(step.text);
                this.dialogueChars = 0;
                this.dialogueTyping = true;
                this.dialogueChoices = null;
                this._punctPause = 0;
                break;

            case 'choice':
                this.dialogueSpeaker = this._substituteVars(step.speaker || '');
                this.dialogueSpeakerEmoji = this._substituteVars(step.emoji || '');
                this.dialogueText = this._substituteVars(step.text);
                this.dialogueChars = this.dialogueText.length; // show full text
                this.dialogueTyping = false;
                this.dialogueChoices = step.choices;
                this._selectedChoice = 0;
                break;

            case 'narration':
                this.dialogueSpeaker = '';
                this.dialogueSpeakerEmoji = '';
                this.dialogueText = this._substituteVars(step.text);
                this.dialogueChars = 0;
                this.dialogueTyping = true;
                this.dialogueChoices = null;
                this._punctPause = 0;
                break;

            case 'enter':
                this._addCharacter({
                    ...step,
                    emoji: this._substituteVars(step.emoji || '🐕'),
                    name: this._substituteVars(step.name || ''),
                });
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
        this._hideSkipBtn();
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

    // === SKIP BUTTON ===

    _showSkipBtn() {
        let btn = document.getElementById('story-skip-btn');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'story-skip-btn';
            btn.className = 'story-skip-btn';
            btn.textContent = 'Skip >>';
            document.getElementById('game-container').appendChild(btn);
        }
        btn.style.display = 'block';
        btn.onclick = () => this._skipScene();
    }

    _hideSkipBtn() {
        const btn = document.getElementById('story-skip-btn');
        if (btn) btn.style.display = 'none';
    }

    _skipScene() {
        if (!this.active || !this.scene) return;

        // If village exploration is active, end it
        if (this._villageActive) {
            this._endVillageExploration();
            return;
        }

        // If old-style exploration, end it
        if (this.exploring) {
            this.exploring = false;
        }

        // Fast-forward through remaining steps looking for the next
        // battle or the end of the scene. Execute reward/flag steps silently.
        const steps = this.scene.steps;
        while (this.stepIndex < steps.length) {
            const step = steps[this.stepIndex];
            if (step.type === 'battle') {
                // Can't skip battles - execute normally
                this._executeStep(step);
                return;
            }
            // Silently apply reward and flag steps
            if (step.type === 'reward') {
                if (step.bones) this.academy.bones += step.bones;
                if (step.treats) this.academy.treats += step.treats;
                if (step.xp) this.academy.addXP(step.xp);
                if (step.dog) this.academy.createDog(step.dog.breed, step.dog.name);
                SaveSystem.saveLocal(this.academy);
            } else if (step.type === 'flag') {
                if (!this.academy.storyFlags) this.academy.storyFlags = {};
                this.academy.storyFlags[step.flag] = step.value !== undefined ? step.value : true;
                SaveSystem.saveLocal(this.academy);
            }
            this.stepIndex++;
        }

        // Scene exhausted - go to next scene with iris wipe
        this.dialogueText = '';
        this.dialogueChoices = null;
        this._transition = {
            type: 'iris',
            progress: 0,
            duration: 0.5,
            callback: () => this._startScene(this.sceneIndex + 1)
        };
    }

    // === EXPLORATION ===

    _setupExploration(step) {
        // Check if this explore step uses the new Village renderer
        const villageMapName = step.villageMap || (this.scene && this.scene.villageMap);
        const villageMaps = window.VILLAGE_MAPS || (typeof VILLAGE_MAPS !== 'undefined' ? VILLAGE_MAPS : null);
        if (villageMapName && this.village && villageMaps && villageMaps[villageMapName]) {
            this._startVillageExploration(villageMapName, step);
            return;
        }

        this.exploring = true;
        // Use step map, or fall back to current scene map, or keep existing
        if (step.map) {
            this.exploMap = step.map;
        } else if (this.scene && this.scene.map && !this.exploMap) {
            this.exploMap = this.scene.map;
        }
        this.playerX = step.startX !== undefined ? step.startX : 5;
        this.playerY = step.startY !== undefined ? step.startY : 8;
        this.playerDir = 'down';
        this.npcs = (step.npcs || []).map(n => ({ ...n }));
        this.mapTriggers = step.triggers || [];
        this._moveTarget = null;
        this.dialogueText = '';
        this.dialogueSpeaker = '';
    }

    _startVillageExploration(mapName, step) {
        // Pause story rendering - Village takes over the canvas
        this.exploring = false;
        this._villageActive = true;

        // Unbind story input so village handles its own
        this._unbindInput();

        // Stop story loop (village has its own)
        if (this._raf) cancelAnimationFrame(this._raf);

        // Size canvas for village
        this.canvas.width = Math.min(window.innerWidth, 480);
        this.canvas.height = Math.min(window.innerHeight, 800);
        this.village.ts = Math.max(24, Math.floor(this.canvas.width / 16));

        // Load the village map
        const maps = window.VILLAGE_MAPS || VILLAGE_MAPS;
        const mapData = JSON.parse(JSON.stringify(maps[mapName]));

        // Override start position if step specifies it
        if (step.startX !== undefined) mapData.startX = step.startX;
        if (step.startY !== undefined) mapData.startY = step.startY;

        // Merge story NPCs into the village map NPCs
        if (step.npcs && step.npcs.length) {
            for (const npc of step.npcs) {
                // Replace or add NPCs from the story step
                const existing = mapData.npcs.findIndex(n => n.id === npc.id);
                const storyNpc = {
                    ...npc,
                    dialogue: this._substituteVars(npc.dialogue || ''),
                };
                if (existing >= 0) {
                    mapData.npcs[existing] = { ...mapData.npcs[existing], ...storyNpc };
                } else {
                    mapData.npcs.push(storyNpc);
                }
            }
        }

        // Override triggers if step specifies them
        if (step.triggers && step.triggers.length) {
            // Add story triggers to map triggers
            for (const t of step.triggers) {
                mapData.triggers.push(t);
            }
        }

        this.village.loadMap(mapData);

        // Show back button for village mode
        let backBtn = document.getElementById('village-back-btn');
        if (backBtn) backBtn.style.display = 'block';

        const self = this;
        this.village.start((npc) => {
            // NPC interaction - show dialogue overlay
            const text = npc.dialogue ? self._substituteVars(npc.dialogue) : '';
            if (text) {
                let overlay = document.getElementById('village-dialogue');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'village-dialogue';
                    overlay.className = 'village-dialogue-overlay';
                    document.getElementById('game-container').appendChild(overlay);
                }
                overlay.innerHTML = `
                    <div class="village-dialogue-box">
                        ${npc.name ? `<div class="village-dialogue-speaker">${npc.emoji || ''} ${npc.name}</div>` : ''}
                        <div class="village-dialogue-text">${text}</div>
                        <div class="village-dialogue-hint">tap to close</div>
                    </div>
                `;
                overlay.style.display = 'flex';
                overlay.onclick = () => {
                    overlay.style.display = 'none';
                    // Check if this NPC advances the story
                    if (npc.advanceStory) {
                        self._endVillageExploration();
                    }
                };
            }
        }, (trigger) => {
            if (trigger.action === 'nextStep') {
                self._endVillageExploration();
            } else if (trigger.action === 'dialogue') {
                let overlay = document.getElementById('village-dialogue');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'village-dialogue';
                    overlay.className = 'village-dialogue-overlay';
                    document.getElementById('game-container').appendChild(overlay);
                }
                overlay.innerHTML = `
                    <div class="village-dialogue-box">
                        <div class="village-dialogue-text">${self._substituteVars(trigger.text || '')}</div>
                        <div class="village-dialogue-hint">tap to close</div>
                    </div>
                `;
                overlay.style.display = 'flex';
                overlay.onclick = () => { overlay.style.display = 'none'; };
            }
        });
    }

    _endVillageExploration() {
        // Stop village, resume story
        this.village.stop();
        this._villageActive = false;

        // Hide village UI
        const dlg = document.getElementById('village-dialogue');
        if (dlg) dlg.style.display = 'none';
        const backBtn = document.getElementById('village-back-btn');
        if (backBtn) backBtn.style.display = 'none';

        // Restore canvas and resume story
        this._bindInput();
        this.stepIndex++;
        this._advanceStep();
        this._raf = requestAnimationFrame((t) => this._loop(t));
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
        // Typing animation with punctuation-based pauses (FF7-style)
        if (this.dialogueTyping && this.dialogueChars < this.dialogueText.length) {
            this._typeTimer += dt;
            const baseInterval = 1 / this.dialogueSpeed; // time per character

            while (this._typeTimer >= baseInterval && this.dialogueChars < this.dialogueText.length) {
                // Check if we are currently pausing for punctuation
                if (this._punctPause > 0) {
                    this._punctPause--;
                    this._typeTimer -= baseInterval;
                    continue;
                }

                this.dialogueChars++;
                this._typeTimer -= baseInterval;

                // Check the character we just revealed for punctuation pauses
                const ch2 = this.dialogueText[this.dialogueChars - 1];
                const nextCh = this.dialogueChars < this.dialogueText.length ? this.dialogueText[this.dialogueChars] : '';

                // Ellipsis detection: if we just typed the third dot of "..."
                if (ch2 === '.' && this.dialogueChars >= 3 &&
                    this.dialogueText[this.dialogueChars - 2] === '.' &&
                    this.dialogueText[this.dialogueChars - 3] === '.') {
                    this._punctPause = 12; // longer pause for ellipsis
                } else if ((ch2 === '.' || ch2 === '!' || ch2 === '?') && nextCh !== '.' && nextCh !== '!' && nextCh !== '?') {
                    // Period, exclamation, question: 8 char-times (but not mid-ellipsis/combo)
                    this._punctPause = 8;
                } else if (ch2 === ',') {
                    this._punctPause = 4;
                } else if (ch2 === ':' || ch2 === ';') {
                    this._punctPause = 3;
                }
            }

            if (this.dialogueChars >= this.dialogueText.length) {
                this.dialogueTyping = false;
            }
        }

        // Transition effects (fade and iris wipe)
        if (this._transition) {
            this._transition.progress += dt / this._transition.duration;
            if (this._transition.progress >= 1) {
                const cb = this._transition.callback;
                this._transition = null;
                this.fadeAlpha = 0;
                if (cb) cb();
            } else if (this._transition.type === 'fade') {
                // Fade out then in
                if (this._transition.progress < 0.5) {
                    this.fadeAlpha = this._transition.progress * 2;
                } else {
                    this.fadeAlpha = (1 - this._transition.progress) * 2;
                }
            }
            // Iris wipe is rendered in _render, progress tracked here
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

        // Iris wipe overlay (circle that closes/opens)
        if (this._transition && this._transition.type === 'iris') {
            const p = this._transition.progress;
            const maxRadius = Math.sqrt(cw * cw + ch * ch) / 2;
            let radius;
            if (p < 0.5) {
                // Closing: circle shrinks from full to zero
                radius = maxRadius * (1 - p * 2);
            } else {
                // Opening: circle grows from zero to full
                radius = maxRadius * ((p - 0.5) * 2);
            }

            // Draw black with a circular hole cut out
            ctx.save();
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.rect(0, 0, cw, ch);
            // Cut out circle using counter-clockwise winding
            ctx.moveTo(cw / 2 + radius, ch / 2);
            ctx.arc(cw / 2, ch / 2, Math.max(radius, 0.5), 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
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

    // Draw an FF7-style blue gradient box with borders and corner highlights
    _drawFF7Box(ctx, x, y, w, h, radius) {
        radius = radius || 6;

        // Background: dark blue-purple gradient
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, '#1a1040');
        grad.addColorStop(1, '#080618');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);
        ctx.fill();

        // Outer border: 2px #a8a0c0
        ctx.strokeStyle = '#a8a0c0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);
        ctx.stroke();

        // Inner border: 1px #605880 inset 3px
        ctx.strokeStyle = '#605880';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x + 3, y + 3, w - 6, h - 6, Math.max(radius - 2, 2));
        ctx.stroke();

        // Corner highlights: bright #c8c0e0 L-shapes at each corner (4px)
        const cLen = 4;
        ctx.strokeStyle = '#c8c0e0';
        ctx.lineWidth = 1.5;

        // Top-left corner L
        ctx.beginPath();
        ctx.moveTo(x + 1, y + 1 + cLen);
        ctx.lineTo(x + 1, y + 1);
        ctx.lineTo(x + 1 + cLen, y + 1);
        ctx.stroke();

        // Top-right corner L
        ctx.beginPath();
        ctx.moveTo(x + w - 1 - cLen, y + 1);
        ctx.lineTo(x + w - 1, y + 1);
        ctx.lineTo(x + w - 1, y + 1 + cLen);
        ctx.stroke();

        // Bottom-left corner L
        ctx.beginPath();
        ctx.moveTo(x + 1, y + h - 1 - cLen);
        ctx.lineTo(x + 1, y + h - 1);
        ctx.lineTo(x + 1 + cLen, y + h - 1);
        ctx.stroke();

        // Bottom-right corner L
        ctx.beginPath();
        ctx.moveTo(x + w - 1 - cLen, y + h - 1);
        ctx.lineTo(x + w - 1, y + h - 1);
        ctx.lineTo(x + w - 1, y + h - 1 - cLen);
        ctx.stroke();
    }

    _renderDialogueBox(ctx, cw, ch) {
        const boxH = ch * 0.28;
        const boxY = ch - boxH - 8;
        const boxX = 8;
        const boxW = cw - 16;
        const pad = 14;

        // === FF7-Style Blue Gradient Dialogue Box ===
        this._drawFF7Box(ctx, boxX, boxY, boxW, boxH, 6);

        // === Speaker Name Label Box (overlapping top border) ===
        let textStartY = boxY + pad + 4;
        if (this.dialogueSpeaker) {
            const nameFont = `bold ${cw * 0.033}px Arial`;
            ctx.font = nameFont;
            const emojiStr = this.dialogueSpeakerEmoji ? this.dialogueSpeakerEmoji + ' ' : '';
            const fullName = emojiStr + this.dialogueSpeaker;
            const nameWidth = ctx.measureText(fullName).width + 20;
            const nameBoxH = cw * 0.055;
            const nameBoxX = boxX + 12;
            const nameBoxY = boxY - nameBoxH * 0.4; // overlap top border by ~40%

            // Draw small FF7 blue box for name
            this._drawFF7Box(ctx, nameBoxX, nameBoxY, nameWidth, nameBoxH, 4);

            // Name text in lavender-white
            ctx.font = nameFont;
            ctx.fillStyle = '#e8e0ff';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(fullName, nameBoxX + 10, nameBoxY + nameBoxH / 2);

            textStartY = boxY + pad + 6;
        }

        // === Dialogue text (with typing effect) ===
        const displayText = this.dialogueText.substring(0, this.dialogueChars);
        ctx.font = `${cw * 0.032}px Arial`;
        ctx.fillStyle = '#e0e0e0';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Word wrap
        this._wrapText(ctx, displayText, boxX + pad, textStartY, boxW - pad * 2, cw * 0.04);

        // === Choice Menu Styling (FF7 blue boxes) ===
        if (this.dialogueChoices && !this.dialogueTyping) {
            const choiceLineH = cw * 0.046;
            const choiceBoxH = this.dialogueChoices.length * choiceLineH + 16;
            const choiceBoxW = boxW - 24;
            const choiceBoxX = boxX + 12;
            const choiceBoxY = boxY + boxH + 6;

            // Draw separate FF7 blue box for choices
            this._drawFF7Box(ctx, choiceBoxX, choiceBoxY, choiceBoxW, choiceBoxH, 5);

            const now = Date.now();
            for (let i = 0; i < this.dialogueChoices.length; i++) {
                const cy = choiceBoxY + 10 + i * choiceLineH;
                const isSelected = (this._selectedChoice === i);

                // Highlight selected vs unselected
                if (isSelected) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = `bold ${cw * 0.03}px Arial`;
                } else {
                    ctx.fillStyle = '#a0a0a0';
                    ctx.font = `${cw * 0.03}px Arial`;
                }

                // Animated bobbing cursor arrow for selected choice
                const arrowX = choiceBoxX + 12;
                const textX = choiceBoxX + 28;
                if (isSelected) {
                    const bob = Math.sin(now / 150) * 2;
                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillText('\u25B6', arrowX + bob, cy);
                }
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(this.dialogueChoices[i].text, textX, cy);
            }
        }

        // === Blinking Continue Indicator (downward triangle) ===
        if (!this.dialogueTyping && !this.dialogueChoices && this.dialogueChars >= this.dialogueText.length) {
            const blinkOn = Math.floor(Date.now() / 500) % 2 === 0;
            if (blinkOn) {
                const triX = boxX + boxW - pad - 6;
                const triY = boxY + boxH - pad - 2;
                const triSize = 6;
                ctx.fillStyle = '#a8a0c0';
                ctx.beginPath();
                ctx.moveTo(triX - triSize, triY - triSize);
                ctx.lineTo(triX + triSize, triY - triSize);
                ctx.lineTo(triX, triY + triSize * 0.6);
                ctx.closePath();
                ctx.fill();
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
        // Use pointerdown (not click) since the game UI uses pointerdown
        // and touch-action:manipulation can suppress click on mobile
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
        const x = (e.clientX || (e.touches && e.touches[0].clientX) || 0) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY) || 0) - rect.top;

        // Scale to canvas coords
        const sx = x * (this.canvas.width / rect.width);
        const sy = y * (this.canvas.height / rect.height);

        // If typing, skip to end
        if (this.dialogueTyping) {
            this.dialogueChars = this.dialogueText.length;
            this.dialogueTyping = false;
            return;
        }

        // If choices, check which was tapped (FF7 choice box below dialogue)
        if (this.dialogueChoices) {
            const cw = this.canvas.width;
            const ch = this.canvas.height;
            const boxH = ch * 0.28;
            const boxY = ch - boxH - 8;
            const boxX = 8;
            const boxW = cw - 16;
            const choiceLineH = cw * 0.046;
            const choiceBoxX = boxX + 12;
            const choiceBoxY = boxY + boxH + 6;
            const choiceBoxW = boxW - 24;
            const choiceBoxH = this.dialogueChoices.length * choiceLineH + 16;

            // Check if tap is inside choice box
            if (sx >= choiceBoxX && sx <= choiceBoxX + choiceBoxW &&
                sy >= choiceBoxY && sy <= choiceBoxY + choiceBoxH) {
                for (let i = 0; i < this.dialogueChoices.length; i++) {
                    const cy = choiceBoxY + 10 + i * choiceLineH;
                    if (sy >= cy - 4 && sy <= cy + choiceLineH) {
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
            }

            // Tap outside choice box: update selected choice based on nearest
            for (let i = 0; i < this.dialogueChoices.length; i++) {
                const cy = choiceBoxY + 10 + i * choiceLineH;
                if (sy >= cy - 4 && sy <= cy + choiceLineH) {
                    this._selectedChoice = i;
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
