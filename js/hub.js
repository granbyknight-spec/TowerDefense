// Hub UI - renders the Academy overworld screens
// Manages navigation between hub areas and launching battles

class Hub {
    constructor(academy, onStartBattle, onStartStory, onExploreVillage) {
        this.academy = academy;
        this.onStartBattle = onStartBattle; // callback(levelIndex)
        this.onStartStory = onStartStory;   // callback(episodeId)
        this.onExploreVillage = onExploreVillage; // callback(mapName)

        this.hubEl = document.getElementById('hub-screen');
        this.selectedBattle = 0;
        this._saveCodeVisible = false;
        this._loadInputVisible = false;
        this._shelterNaming = null; // { idx, breed } when naming a new dog
        this._factPopup = null; // breed key to show fact for
    }

    show() {
        this.academy.currentScreen = 'hub';
        this._hideAllScreens();
        this.hubEl.style.display = 'flex';
        this.render();
    }

    hide() {
        this.hubEl.style.display = 'none';
    }

    _hideAllScreens() {
        document.getElementById('title-screen').style.display = 'none';
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('victory-screen').style.display = 'none';
        document.getElementById('level-complete-screen').style.display = 'none';
        document.getElementById('leaderboard-screen').style.display = 'none';
        document.getElementById('hud').style.display = 'none';
        document.getElementById('bottom-bar').style.display = 'none';
        document.getElementById('game-controls').style.display = 'none';
        document.getElementById('upgrade-panel').style.display = 'none';
    }

    render() {
        const a = this.academy;
        const dog = a.getActiveDog();
        const breedData = dog ? a.getBreedData(dog) : null;
        const title = a.getTrainerTitle();
        const nextXP = a.getNextRankXP();
        const xpPct = nextXP > 0 ? Math.min(100, Math.round((a.trainerXP / nextXP) * 100)) : 100;
        const completedCount = a.completedLevels.length;
        const totalLevels = CONFIG.LEVELS.length;

        // Build battle list
        const battleCards = CONFIG.LEVELS.map((lvl, i) => {
            const completed = a.completedLevels.includes(i);
            const locked = i > 0 && !a.completedLevels.includes(i - 1);
            return `
                <button class="hub-battle-card ${completed ? 'completed' : ''} ${locked ? 'locked' : ''} ${this.selectedBattle === i ? 'selected' : ''}"
                        data-level="${i}" ${locked ? 'disabled' : ''}>
                    <span class="hub-battle-icon">${completed ? '⭐' : locked ? '🔒' : '⚔️'}</span>
                    <span class="hub-battle-name">${lvl.name}</span>
                    <span class="hub-battle-waves">${lvl.waves} waves</span>
                </button>
            `;
        }).join('');

        // Build roster
        const rosterCards = a.roster.map(d => {
            const bd = DOG_BREEDS[d.breed];
            const isActive = d.id === a.activeDogId;
            const bondLabel = d.bond >= 80 ? 'Best Friend' : d.bond >= 50 ? 'Close Bond' : d.bond >= 20 ? 'Friendly' : 'Getting to know...';
            return `
                <div class="hub-dog-card ${isActive ? 'active' : ''}" data-dog-id="${d.id}">
                    <div class="hub-dog-emoji">${bd ? bd.emoji : '🐕'}</div>
                    <div class="hub-dog-info">
                        <div class="hub-dog-name">${d.name} <span class="hub-dog-level">Lv${d.level}</span></div>
                        <div class="hub-dog-breed">${bd ? bd.breed : d.breed} &middot; ${bondLabel}</div>
                        <div class="hub-dog-bond-bar"><div class="hub-dog-bond-fill" style="width:${d.bond}%"></div></div>
                    </div>
                    <div class="hub-dog-actions">
                        ${!isActive ? `<button class="hub-small-btn" data-action="setactive" data-dog-id="${d.id}">Set Active</button>` : '<span class="hub-active-badge">COMPANION</span>'}
                        <button class="hub-small-btn hub-treat-btn" data-action="treat" data-dog-id="${d.id}">🦴 Treat</button>
                        <button class="hub-small-btn hub-fact-btn" data-action="fact" data-breed="${d.breed}">📖 Info</button>
                    </div>
                </div>
            `;
        }).join('');

        // Build shelter
        const shelterCards = SHELTER_DOGS.map((s, i) => {
            const bd = DOG_BREEDS[s.breed];
            const canAfford = a.bones >= s.cost;
            const hasRank = a.trainerRank >= s.minRank;
            const ownCount = a.roster.filter(d => d.breed === s.breed).length;
            const maxed = ownCount >= 2;
            const available = canAfford && hasRank && !maxed;
            return `
                <button class="hub-shelter-card ${available ? '' : 'unavailable'}" data-shelter="${i}" ${available ? '' : 'disabled'}>
                    <span class="hub-shelter-emoji">${bd ? bd.emoji : '?'}</span>
                    <span class="hub-shelter-name">${bd ? bd.breed : s.breed}</span>
                    <span class="hub-shelter-cost">🦴 ${s.cost}</span>
                    ${!hasRank ? `<span class="hub-shelter-req">Rank ${s.minRank}+</span>` : ''}
                    ${maxed ? '<span class="hub-shelter-req">Max owned</span>' : ''}
                </button>
            `;
        }).join('');

        // Save code section
        const saveSection = this._saveCodeVisible ? `
            <div class="hub-save-section">
                <div class="hub-save-label">Your Save Code (copy this!):</div>
                <textarea class="hub-save-code" id="save-code-output" readonly rows="3">${SaveSystem.generateCode(a)}</textarea>
                <button class="hub-btn hub-copy-btn" id="copy-save-btn">📋 Copy to Clipboard</button>
            </div>
        ` : '';

        const loadSection = this._loadInputVisible ? `
            <div class="hub-save-section">
                <div class="hub-save-label">Paste a Save Code:</div>
                <textarea class="hub-save-code" id="load-code-input" rows="3" placeholder="Paste your save code here..."></textarea>
                <button class="hub-btn" id="apply-load-btn">Load Save</button>
            </div>
        ` : '';

        // Fact popup
        const factPopup = this._factPopup ? (() => {
            const bd = DOG_BREEDS[this._factPopup];
            if (!bd) return '';
            return `
                <div class="hub-fact-overlay" id="fact-overlay">
                    <div class="hub-fact-card">
                        <div class="hub-fact-emoji">${bd.emoji}</div>
                        <div class="hub-fact-breed">${bd.breed}</div>
                        <div class="hub-fact-detail"><strong>Origin:</strong> ${bd.origin}</div>
                        <div class="hub-fact-detail"><strong>Group:</strong> ${bd.group}</div>
                        <div class="hub-fact-detail"><strong>Trait:</strong> ${bd.trait}</div>
                        <div class="hub-fact-fun">"${bd.funFact}"</div>
                        <button class="hub-btn" id="close-fact-btn">Close</button>
                    </div>
                </div>
            `;
        })() : '';

        // Naming popup
        const namingPopup = this._shelterNaming ? (() => {
            const bd = DOG_BREEDS[this._shelterNaming.breed];
            return `
                <div class="hub-fact-overlay" id="naming-overlay">
                    <div class="hub-fact-card">
                        <div class="hub-fact-emoji">${bd ? bd.emoji : '🐕'}</div>
                        <div class="hub-fact-breed">Name your new ${bd ? bd.breed : 'dog'}!</div>
                        <input type="text" id="dog-name-input" class="hub-name-input" placeholder="${bd ? bd.breed : 'Dog'}" maxlength="16" autocomplete="off">
                        <button class="hub-btn" id="confirm-adopt-btn">Adopt!</button>
                        <button class="hub-btn hub-btn-cancel" id="cancel-adopt-btn">Cancel</button>
                    </div>
                </div>
            `;
        })() : '';

        this.hubEl.innerHTML = `
            <div class="hub-header">
                <div class="hub-title">Puppy Academy</div>
                <div class="hub-trainer">
                    <span class="hub-trainer-name">${a.playerName}</span>
                    <span class="hub-trainer-rank">${title}</span>
                </div>
                <div class="hub-xp-bar"><div class="hub-xp-fill" style="width:${xpPct}%"></div></div>
                <div class="hub-currency">
                    <span class="hub-bones">🦴 ${a.bones}</span>
                    <span class="hub-treats">🍖 ${a.treats}</span>
                </div>
            </div>

            ${dog ? `
            <div class="hub-companion">
                <div class="hub-companion-emoji">${breedData ? breedData.emoji : '🐕'}</div>
                <div class="hub-companion-info">
                    <div class="hub-companion-name">${dog.name} <span class="hub-dog-level">Lv${dog.level}</span></div>
                    <div class="hub-companion-breed">${breedData ? breedData.breed : ''} &middot; ${dog.battlesWon} Victories</div>
                </div>
            </div>
            ` : ''}

            <div class="hub-section">
                <div class="hub-section-title">Story Mode</div>
                <div class="hub-episodes">${this._buildEpisodeCards(a)}</div>
            </div>

            <div class="hub-section">
                <div class="hub-section-title">Explore</div>
                <div class="hub-explore-buttons">
                    <button class="hub-explore-btn" data-map="academy">
                        <span class="hub-explore-icon">🏫</span>
                        <span class="hub-explore-label">Academy Grounds</span>
                    </button>
                    <button class="hub-explore-btn" data-map="barksville">
                        <span class="hub-explore-icon">🏘️</span>
                        <span class="hub-explore-label">Barksville Town</span>
                    </button>
                </div>
            </div>

            <div class="hub-section">
                <div class="hub-section-title">Yard Patrol &middot; ${completedCount}/${totalLevels}</div>
                <div class="hub-battles">${battleCards}</div>
                <button class="hub-btn hub-go-btn" id="start-battle-btn">Start Battle</button>
            </div>

            <div class="hub-section">
                <div class="hub-section-title">Your Kennel &middot; ${a.roster.length} dogs</div>
                <div class="hub-roster">${rosterCards || '<div class="hub-empty">No dogs yet! Visit the shelter to adopt.</div>'}</div>
            </div>

            <div class="hub-section">
                <div class="hub-section-title">Dog Shelter</div>
                <div class="hub-shelter">${shelterCards}</div>
            </div>

            <div class="hub-section hub-save-area">
                <div class="hub-section-title">Save / Load</div>
                <div class="hub-save-buttons">
                    <button class="hub-btn" id="save-code-btn">📝 Get Save Code</button>
                    <button class="hub-btn" id="load-code-btn">📂 Enter Save Code</button>
                </div>
                ${saveSection}
                ${loadSection}
            </div>

            ${factPopup}
            ${namingPopup}

            ${a.notification ? `<div class="hub-notif">${a.notification}</div>` : ''}
        `;

        this._bindEvents();
    }

    _bindEvents() {
        const self = this;
        const a = this.academy;

        // Battle selection
        this.hubEl.querySelectorAll('.hub-battle-card').forEach(btn => {
            btn.addEventListener('click', () => {
                const lvl = parseInt(btn.dataset.level);
                self.selectedBattle = lvl;
                self.render();
            });
        });

        // Start battle
        const startBtn = document.getElementById('start-battle-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                self.hide();
                self.onStartBattle(self.selectedBattle);
            });
        }

        // Dog actions
        this.hubEl.querySelectorAll('[data-action="setactive"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                a.activeDogId = parseInt(btn.dataset.dogId);
                SaveSystem.saveLocal(a);
                self.render();
            });
        });

        this.hubEl.querySelectorAll('[data-action="treat"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.dogId);
                if (a.giveTreat(id)) {
                    self.render();
                } else {
                    a.showNotification('No treats left!');
                    self.render();
                }
            });
        });

        this.hubEl.querySelectorAll('[data-action="fact"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                self._factPopup = btn.dataset.breed;
                if (!a.factsLearned.includes(btn.dataset.breed)) {
                    a.factsLearned.push(btn.dataset.breed);
                }
                self.render();
            });
        });

        // Close fact
        const closeFactBtn = document.getElementById('close-fact-btn');
        if (closeFactBtn) {
            closeFactBtn.addEventListener('click', () => {
                self._factPopup = null;
                self.render();
            });
        }

        // Fact overlay background click
        const factOverlay = document.getElementById('fact-overlay');
        if (factOverlay) {
            factOverlay.addEventListener('click', (e) => {
                if (e.target === factOverlay) {
                    self._factPopup = null;
                    self.render();
                }
            });
        }

        // Shelter adopt
        this.hubEl.querySelectorAll('.hub-shelter-card').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.shelter);
                const offer = SHELTER_DOGS[idx];
                self._shelterNaming = { idx, breed: offer.breed };
                self.render();
                const input = document.getElementById('dog-name-input');
                if (input) input.focus();
            });
        });

        // Confirm adopt
        const confirmAdopt = document.getElementById('confirm-adopt-btn');
        if (confirmAdopt) {
            confirmAdopt.addEventListener('click', () => {
                const input = document.getElementById('dog-name-input');
                const name = input ? input.value.trim() : '';
                const result = a.adoptDog(self._shelterNaming.idx, name || undefined);
                self._shelterNaming = null;
                if (result) {
                    a.showNotification('Welcome ' + result.name + ' to the Academy!');
                    self._factPopup = result.breed;
                }
                self.render();
            });
        }

        // Cancel adopt
        const cancelAdopt = document.getElementById('cancel-adopt-btn');
        if (cancelAdopt) {
            cancelAdopt.addEventListener('click', () => {
                self._shelterNaming = null;
                self.render();
            });
        }

        // Naming overlay background click
        const namingOverlay = document.getElementById('naming-overlay');
        if (namingOverlay) {
            namingOverlay.addEventListener('click', (e) => {
                if (e.target === namingOverlay) {
                    self._shelterNaming = null;
                    self.render();
                }
            });
        }

        // Save code
        const saveBtn = document.getElementById('save-code-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                self._saveCodeVisible = !self._saveCodeVisible;
                self._loadInputVisible = false;
                self.render();
            });
        }

        // Copy
        const copyBtn = document.getElementById('copy-save-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const ta = document.getElementById('save-code-output');
                if (ta) {
                    ta.select();
                    navigator.clipboard.writeText(ta.value).then(() => {
                        a.showNotification('Save code copied!');
                        self.render();
                    }).catch(() => {
                        // Fallback
                        document.execCommand('copy');
                        a.showNotification('Save code copied!');
                        self.render();
                    });
                }
            });
        }

        // Load code
        const loadBtn = document.getElementById('load-code-btn');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                self._loadInputVisible = !self._loadInputVisible;
                self._saveCodeVisible = false;
                self.render();
            });
        }

        // Apply load
        const applyLoadBtn = document.getElementById('apply-load-btn');
        if (applyLoadBtn) {
            applyLoadBtn.addEventListener('click', () => {
                const ta = document.getElementById('load-code-input');
                if (!ta || !ta.value.trim()) return;
                const state = SaveSystem.loadCode(ta.value);
                if (state && a.loadFromState(state)) {
                    a.showNotification('Game loaded!');
                    self._loadInputVisible = false;
                    self.render();
                } else {
                    a.showNotification('Invalid save code!');
                    self.render();
                }
            });
        }

        // Explore village buttons
        this.hubEl.querySelectorAll('.hub-explore-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mapName = btn.dataset.map;
                self.hide();
                if (self.onExploreVillage) self.onExploreVillage(mapName);
            });
        });

        // Story episode buttons
        this.hubEl.querySelectorAll('.hub-episode-card').forEach(btn => {
            btn.addEventListener('click', () => {
                const epId = parseInt(btn.dataset.episode);
                if (btn.classList.contains('locked')) return;
                self.hide();
                if (self.onStartStory) self.onStartStory(epId);
            });
        });
    }

    _buildEpisodeCards(a) {
        const flags = a.storyFlags || {};
        const episodes = [
            { id: 1, title: 'A Lost Pup', icon: '🌧️', desc: 'Rescue a puppy lost in the storm' },
        ];

        return episodes.map(ep => {
            const epData = EPISODES[ep.id];
            const completed = flags['ep' + ep.id + '_complete'];
            const locked = epData && a.trainerRank < (epData.requiredRank || 0);
            return `
                <button class="hub-episode-card ${completed ? 'completed' : ''} ${locked ? 'locked' : ''}"
                        data-episode="${ep.id}" ${locked ? 'disabled' : ''}>
                    <div class="hub-episode-icon">${completed ? '⭐' : locked ? '🔒' : ep.icon}</div>
                    <div class="hub-episode-info">
                        <div class="hub-episode-title">Ep ${ep.id}: ${ep.title}</div>
                        <div class="hub-episode-desc">${completed ? 'Completed!' : ep.desc}</div>
                    </div>
                    <div class="hub-episode-arrow">${locked ? '' : '▸'}</div>
                </button>
            `;
        }).join('');
    }
}
