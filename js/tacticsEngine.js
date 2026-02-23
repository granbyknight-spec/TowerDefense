// =============================================================================
// tacticsEngine.js — Puppy Academy Tactical Battle Engine
// =============================================================================
// Shining Force-style tactical RPG battle engine for the "Puppy Academy" game.
// Dogs vs. Cats themed JRPG combat on a grid map.
//
// This module handles ALL game logic: state machine, movement/attack ranges,
// combat math, enemy AI, story triggers, and dialogue queuing.
// It does NOT render anything — a separate renderer subscribes via onEvent.
// =============================================================================

'use strict';

// -----------------------------------------------------------------------------
// Terrain definitions
// moveCost: movement points spent to enter this tile (99 = impassable)
// defBonus: flat damage reduction when defending on this tile
// avoid:    percentage chance to dodge an attack (unused by default AI, but
//           available for future hit-rate calculations)
// -----------------------------------------------------------------------------
const TERRAIN = {
    GRASS:    { name: 'Grass',    moveCost: 1,    defBonus: 0, avoid: 0  },
    FOREST:   { name: 'Forest',   moveCost: 2,    defBonus: 2, avoid: 10 },
    ROAD:     { name: 'Road',     moveCost: 0.8,  defBonus: 0, avoid: 0  },
    MOUNTAIN: { name: 'Mountain', moveCost: 3,    defBonus: 3, avoid: 15 },
    WATER:    { name: 'Water',    moveCost: 99,   defBonus: 0, avoid: 0  }, // impassable
    BRIDGE:   { name: 'Bridge',   moveCost: 1,    defBonus: 0, avoid: 0  },
    WALL:     { name: 'Wall',     moveCost: 99,   defBonus: 0, avoid: 0  }, // impassable
};

// -----------------------------------------------------------------------------
// Built-in ability definitions
// Abilities are looked up by name string stored in unit.abilities[].
// Each entry describes how the ability works so useAbility() can resolve it.
// -----------------------------------------------------------------------------
const ABILITY_DEFS = {
    // Every unit has access to the basic attack (handled separately in the
    // action menu, but listed here for completeness / future extension).
    attack: {
        name: 'Attack',
        mpCost: 0,
        targetType: 'enemy',   // 'enemy' | 'ally' | 'self' | 'empty'
        aoeRadius: 0,          // 0 = single target
        description: 'Strike an adjacent enemy.',
    },

    // ── Player abilities ──────────────────────────────────────────────────────
    heal: {
        name: 'Heal',
        mpCost: 3,
        targetType: 'ally',
        aoeRadius: 0,
        healAmount: 8,
        description: 'Restore HP to an ally.',
    },
    tailwhip: {
        name: 'Tail Whip',
        mpCost: 2,
        targetType: 'enemy',
        aoeRadius: 0,
        power: 12,             // base magic damage before defender.def
        description: 'A stinging tail whip that ignores terrain bonuses.',
        ignoresTerrain: true,
    },
    barkwave: {
        name: 'Bark Wave',
        mpCost: 4,
        targetType: 'enemy',
        aoeRadius: 1,          // hits all enemies within 1 tile of target
        power: 8,
        description: 'A sonic bark that damages nearby enemies.',
    },
    fetchbuff: {
        name: 'Fetch!',
        mpCost: 3,
        targetType: 'ally',
        aoeRadius: 0,
        atkBuff: 4,            // temporary ATK increase (lasts rest of phase)
        duration: 1,           // turns
        description: 'Rally an ally, boosting their ATK this turn.',
    },
    growl: {
        name: 'Growl',
        mpCost: 2,
        targetType: 'enemy',
        aoeRadius: 0,
        defDebuff: 3,          // reduces target DEF temporarily
        duration: 2,
        description: 'Lower an enemy\'s guard.',
    },

    // ── Enemy abilities ───────────────────────────────────────────────────────
    scratch: {
        name: 'Scratch',
        mpCost: 2,
        targetType: 'enemy',
        aoeRadius: 0,
        power: 10,
        description: 'A sharp claw strike.',
    },
    hiss: {
        name: 'Hiss',
        mpCost: 2,
        targetType: 'enemy',
        aoeRadius: 1,
        power: 5,
        description: 'An intimidating hiss that weakens nearby units.',
        defDebuff: 2,
        duration: 1,
    },
};

// =============================================================================
// TacticsEngine
// =============================================================================
class TacticsEngine {
    constructor() {
        // ── Phase state machine ───────────────────────────────────────────────
        // Valid states:
        //   'intro'         — opening story/dialogue before battle starts
        //   'player_select' — player picks a unit to command
        //   'player_move'   — movement range shown, waiting for destination
        //   'player_action' — action menu visible (handled by renderer)
        //   'player_target' — choosing attack/ability target
        //   'animating'     — an animation is playing; input is blocked
        //   'enemy_turn'    — AI is processing enemy moves
        //   'dialogue'      — story/dialogue overlay is active
        //   'victory'       — battle won
        //   'defeat'        — battle lost
        this.state = 'intro';

        // ── Map data ──────────────────────────────────────────────────────────
        this.map = null;          // { width, height, terrain: string[] }
        this.units = [];          // all units (both teams, alive and dead)
        this.turnNumber = 1;

        // ── Player interaction state ──────────────────────────────────────────
        this.selectedUnit = null;
        this.movableTiles = [];    // [{x, y, cost}]  tiles the unit can reach
        this.attackableTiles = []; // [{x, y}]         tiles the unit can attack
        this.cursor = { x: 0, y: 0 };

        // Position the selected unit occupied BEFORE moving this phase.
        // Used by undoMove() to restore position.
        this._preMovePosX = null;
        this._preMovePosY = null;

        // Which ability is being targeted (during 'player_target' state).
        this._pendingAbility = null;

        // ── Animation queue ───────────────────────────────────────────────────
        this.animations = [];

        // ── Dialogue system ───────────────────────────────────────────────────
        this.dialogueQueue = [];    // [{speaker, text, portrait}] waiting lines
        this.currentDialogue = null; // the line currently on screen
        this._stateBeforeDialogue = null; // where to return after dialogue ends
        this._dialogueTimer = 0;    // seconds elapsed on current dialogue line
        this._dialogueAutoTime = 3.5; // seconds before auto-advance

        // ── Story triggers ────────────────────────────────────────────────────
        // Each trigger fires at most once. Populated by loadBattle().
        this.storyTriggers = [];

        // ── Event callback ────────────────────────────────────────────────────
        // The renderer sets this. The engine calls it as:
        //   this.onEvent('event_name', payloadObject)
        this.onEvent = null;

        // ── Enemy AI ──────────────────────────────────────────────────────────
        // Index into getTeamUnits('enemy') — which enemy is currently acting.
        this._enemyQueue = [];    // units left to process this enemy phase
        this._enemyProcessTimer = null; // setTimeout handle for async AI steps
    }

    // =========================================================================
    // Event emission helper
    // =========================================================================

    /**
     * Emit an engine event to the renderer.
     * @param {string} eventName
     * @param {object} [payload={}]
     */
    _emit(eventName, payload = {}) {
        if (typeof this.onEvent === 'function') {
            this.onEvent(eventName, payload);
        }
    }

    // =========================================================================
    // Scenario loading
    // =========================================================================

    /**
     * Load a battle scenario and start the intro phase.
     *
     * Expected scenario shape:
     * {
     *   map: { width, height, terrain: string[] },
     *   units: UnitDefinition[],
     *   dialogue: { intro: [{speaker, text}], victory: [...], defeat: [...] },
     *   storyTriggers: [{ id, condition: fn, action: fn }],   // optional
     * }
     */
    loadBattle(scenario) {
        // ── Deep-copy the map ─────────────────────────────────────────────────
        this.map = {
            width:   scenario.map.width,
            height:  scenario.map.height,
            terrain: [...scenario.map.terrain], // shallow copy of primitives
        };

        // ── Clone unit definitions into live unit objects ──────────────────────
        this.units = scenario.units.map(def => this._createUnit(def));

        // ── Story triggers ────────────────────────────────────────────────────
        this.storyTriggers = [];

        // Built-in default triggers (can be overridden by scenario)
        this._addDefaultTriggers();

        // Scenario-supplied triggers
        if (Array.isArray(scenario.storyTriggers)) {
            scenario.storyTriggers.forEach(t => {
                this.storyTriggers.push({
                    id:        t.id || `trigger_${this.storyTriggers.length}`,
                    condition: t.condition,
                    action:    t.action,
                    fired:     false,
                });
            });
        }

        // ── Reset engine state ────────────────────────────────────────────────
        this.turnNumber = 1;
        this.selectedUnit = null;
        this.movableTiles = [];
        this.attackableTiles = [];
        this.cursor = { x: 0, y: 0 };
        this.animations = [];
        this.dialogueQueue = [];
        this.currentDialogue = null;
        this._stateBeforeDialogue = null;
        this._pendingAbility = null;
        this._enemyQueue = [];
        this._dialogueTimer = 0;

        // ── Queue intro dialogue, then transition to player phase ─────────────
        const introLines = scenario.dialogue && scenario.dialogue.intro
            ? scenario.dialogue.intro
            : [];

        if (introLines.length > 0) {
            this.state = 'intro';
            introLines.forEach(line => {
                this.queueDialogue(line.speaker, line.text, line.portrait || null);
            });
            this._stateBeforeDialogue = 'player_select';
            this._nextDialogue();
        } else {
            this.state = 'player_select';
            this._emit('phase_change', { phase: 'player' });
        }
    }

    /**
     * Create a live unit object from a definition.  We deep-copy to avoid
     * mutating the original scenario data.
     * @private
     */
    _createUnit(def) {
        return {
            id:         def.id,
            name:       def.name,
            team:       def.team,
            unitClass:  def.unitClass || 'fighter',
            x:          def.x,
            y:          def.y,
            hp:         def.hp,
            maxHp:      def.maxHp,
            mp:         def.mp         !== undefined ? def.mp     : 0,
            maxMp:      def.maxMp      !== undefined ? def.maxMp  : 0,
            atk:        def.atk,
            def:        def.def,
            spd:        def.spd        !== undefined ? def.spd    : 5,
            mov:        def.mov,
            atkRange:   def.atkRange   !== undefined ? def.atkRange : 1,
            level:      def.level      !== undefined ? def.level  : 1,
            exp:        def.exp        !== undefined ? def.exp    : 0,
            moved:      false,
            acted:      false,
            alive:      true,
            abilities:  Array.isArray(def.abilities) ? [...def.abilities] : ['attack'],
            portrait:   def.portrait   || null,
            spriteKey:  def.spriteKey  || null,
            dir:        def.dir        !== undefined ? def.dir : 0,
            // Temporary stat buffs/debuffs — cleared at the start of each phase
            _atkBuff:   0,
            _defDebuff: 0,
        };
    }

    /**
     * Add default built-in story triggers.
     * @private
     */
    _addDefaultTriggers() {
        this.storyTriggers.push(
            {
                id:        'first_kill',
                condition: () => this.units.some(u => u.team === 'enemy' && !u.alive),
                action:    () => this.queueDialogue(
                    'Buddy',
                    "We got one! Keep it up, team!",
                    null
                ),
                fired: false,
            },
            {
                id:        'first_ally_down',
                condition: () => this.units.some(u => u.team === 'player' && !u.alive),
                action:    () => this.queueDialogue(
                    'Buddy',
                    "No! Stay strong everyone, we can still do this!",
                    null
                ),
                fired: false,
            },
            {
                id:        'half_enemies_down',
                condition: () => {
                    const enemies = this.units.filter(u => u.team === 'enemy');
                    const dead    = enemies.filter(u => !u.alive).length;
                    return enemies.length > 0 && dead >= Math.ceil(enemies.length / 2);
                },
                action:    () => this.queueDialogue(
                    'Buddy',
                    "We're more than halfway there — don't let up!",
                    null
                ),
                fired: false,
            },
            {
                id:        'low_hp_ally',
                condition: () => this.units.some(
                    u => u.team === 'player' && u.alive && u.hp <= Math.ceil(u.maxHp * 0.25)
                ),
                action:    () => this.queueDialogue(
                    'Buddy',
                    "Someone needs help — get a healer over there!",
                    null
                ),
                fired: false,
            }
        );
    }

    // =========================================================================
    // Map / terrain helpers
    // =========================================================================

    /**
     * Return the terrain definition for the tile at (x, y).
     * Falls back to GRASS if the tile is out of bounds or unrecognised.
     * @param {number} x
     * @param {number} y
     * @returns {object} TERRAIN entry
     */
    getTerrain(x, y) {
        if (!this.map) return TERRAIN.GRASS;
        if (x < 0 || y < 0 || x >= this.map.width || y >= this.map.height) {
            return TERRAIN.WALL; // treat out-of-bounds as impassable wall
        }
        const key = this.map.terrain[y * this.map.width + x];
        return TERRAIN[key] || TERRAIN.GRASS;
    }

    /**
     * Return whether a grid coordinate is within map bounds.
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    _inBounds(x, y) {
        return this.map !== null
            && x >= 0 && x < this.map.width
            && y >= 0 && y < this.map.height;
    }

    // =========================================================================
    // Unit helpers
    // =========================================================================

    /**
     * Return the alive unit occupying the given grid cell, or null.
     * @param {number} x
     * @param {number} y
     * @returns {object|null}
     */
    getUnitAt(x, y) {
        return this.units.find(u => u.alive && u.x === x && u.y === y) || null;
    }

    /**
     * Return all alive units belonging to a team.
     * @param {'player'|'enemy'} team
     * @returns {object[]}
     */
    getTeamUnits(team) {
        return this.units.filter(u => u.team === team && u.alive);
    }

    // =========================================================================
    // Movement range (BFS with movement-cost accumulation)
    // =========================================================================

    /**
     * Calculate tiles reachable by `unit` given its mov stat and terrain costs.
     *
     * Rules:
     *   - Impassable terrain (moveCost === 99) blocks movement entirely.
     *   - Friendly units can be passed through but not stopped on.
     *   - Enemy units completely block the path (cannot enter their tile).
     *   - The unit's current tile is NOT included in the returned list
     *     (the unit is already there).
     *
     * @param {object} unit
     * @returns {Array<{x:number, y:number, cost:number}>}
     */
    calcMovementRange(unit) {
        const budget = unit.mov;
        // visited: map from "x,y" -> lowest cost seen so far
        const visited = new Map();
        const start   = `${unit.x},${unit.y}`;
        visited.set(start, 0);

        // BFS queue entries: { x, y, cost }
        const queue = [{ x: unit.x, y: unit.y, cost: 0 }];

        const reachable = []; // tiles (not the starting tile)

        const directions = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx:  0, dy: -1 },
        ];

        while (queue.length > 0) {
            // Pop the node with lowest accumulated cost (priority queue via sort)
            queue.sort((a, b) => a.cost - b.cost);
            const { x, y, cost } = queue.shift();

            for (const { dx, dy } of directions) {
                const nx = x + dx;
                const ny = y + dy;

                if (!this._inBounds(nx, ny)) continue;

                const terrain   = this.getTerrain(nx, ny);
                const moveCost  = terrain.moveCost;

                // Impassable terrain
                if (moveCost >= 99) continue;

                const newCost = cost + moveCost;
                if (newCost > budget) continue;

                // Enemy units block passage entirely
                const occupant = this.getUnitAt(nx, ny);
                if (occupant && occupant.team !== unit.team) continue;

                const key = `${nx},${ny}`;
                if (visited.has(key) && visited.get(key) <= newCost) continue;

                visited.set(key, newCost);

                // Friendly units can be passed through but not stopped on
                const canStop = !occupant || occupant === unit;
                if (canStop) {
                    reachable.push({ x: nx, y: ny, cost: newCost });
                }

                queue.push({ x: nx, y: ny, cost: newCost });
            }
        }

        return reachable;
    }

    /**
     * Calculate all tiles attackable from (x, y) with the given range.
     * Range is measured in Manhattan (Chebyshev) distance for the "diamond"
     * pattern familiar from classic tactical RPGs.
     *
     * @param {number} x       Starting x
     * @param {number} y       Starting y
     * @param {number} range   Maximum Manhattan distance
     * @param {number} [minRange=1]  Minimum distance (default 1, so melee
     *                               excludes the unit's own tile)
     * @returns {Array<{x:number, y:number}>}
     */
    calcAttackRange(x, y, range, minRange = 1) {
        const tiles = [];
        for (let dx = -range; dx <= range; dx++) {
            for (let dy = -range; dy <= range; dy++) {
                const dist = Math.abs(dx) + Math.abs(dy);
                if (dist < minRange || dist > range) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (this._inBounds(nx, ny)) {
                    tiles.push({ x: nx, y: ny });
                }
            }
        }
        return tiles;
    }

    /**
     * Quick check: is (tx, ty) within attack range of (x, y)?
     * @private
     */
    _inAttackRange(x, y, tx, ty, range) {
        return Math.abs(tx - x) + Math.abs(ty - y) <= range;
    }

    // =========================================================================
    // Unit selection
    // =========================================================================

    /**
     * Select a player unit for commanding.
     * Computes its movement and attack ranges and stores them.
     * Transitions state to 'player_move'.
     * @param {object} unit
     */
    selectUnit(unit) {
        this.selectedUnit   = unit;
        this.movableTiles   = this.calcMovementRange(unit);
        this.attackableTiles = this.calcAttackRange(unit.x, unit.y, unit.atkRange);
        this._preMovePosX  = unit.x;
        this._preMovePosY  = unit.y;
        this._pendingAbility = null;
        this.state = 'player_move';
        this._emit('unit_selected', { unit, movableTiles: this.movableTiles });
    }

    /**
     * Cancel the current selection and return to player_select.
     */
    cancelSelection() {
        this.selectedUnit    = null;
        this.movableTiles    = [];
        this.attackableTiles = [];
        this._pendingAbility = null;
        this.state = 'player_select';
        this._emit('selection_cancelled', {});
    }

    // =========================================================================
    // Movement
    // =========================================================================

    /**
     * Move the selected unit to (x, y) (must be in movableTiles).
     * Transitions state to 'player_action' after the move.
     *
     * A simple A* / BFS path is computed for the renderer to animate along.
     *
     * @param {number} x
     * @param {number} y
     */
    moveUnit(x, y) {
        const unit = this.selectedUnit;
        if (!unit) return;

        const fromX = unit.x;
        const fromY = unit.y;

        // Reconstruct movement path for the renderer
        const path = this._buildPath(unit, x, y);

        unit.x    = x;
        unit.y    = y;
        unit.moved = true;

        // Recalculate attack range from the new position
        this.attackableTiles = this.calcAttackRange(x, y, unit.atkRange);

        this.state = 'player_action';

        this._emit('unit_moved', { unit, fromX, fromY, toX: x, toY: y, path });
    }

    /**
     * Build a walkable path from the unit's current position to (tx, ty).
     * Uses the same BFS logic as calcMovementRange but also tracks predecessors.
     * @private
     * @returns {Array<{x:number, y:number}>} ordered list of tiles including destination
     */
    _buildPath(unit, tx, ty) {
        const start = { x: unit.x, y: unit.y };

        // predecessor map
        const prev = new Map();
        const visited = new Map();
        const startKey = `${start.x},${start.y}`;
        visited.set(startKey, 0);

        const queue = [{ x: start.x, y: start.y, cost: 0 }];

        const directions = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx:  0, dy: -1 },
        ];

        let found = false;
        while (queue.length > 0 && !found) {
            queue.sort((a, b) => a.cost - b.cost);
            const { x, y, cost } = queue.shift();

            if (x === tx && y === ty) { found = true; break; }

            for (const { dx, dy } of directions) {
                const nx = x + dx;
                const ny = y + dy;
                if (!this._inBounds(nx, ny)) continue;

                const terrain  = this.getTerrain(nx, ny);
                if (terrain.moveCost >= 99) continue;

                const newCost  = cost + terrain.moveCost;
                if (newCost > unit.mov + 0.001) continue;

                const occupant = this.getUnitAt(nx, ny);
                if (occupant && occupant.team !== unit.team) continue;

                const key = `${nx},${ny}`;
                if (visited.has(key) && visited.get(key) <= newCost) continue;

                visited.set(key, newCost);
                prev.set(key, { x, y });
                queue.push({ x: nx, y: ny, cost: newCost });
            }
        }

        // Trace back path
        const path = [];
        let cur = `${tx},${ty}`;
        while (prev.has(cur)) {
            const [cx, cy] = cur.split(',').map(Number);
            path.unshift({ x: cx, y: cy });
            const p = prev.get(cur);
            cur = `${p.x},${p.y}`;
        }

        return path;
    }

    /**
     * Undo the selected unit's move (only valid before acting).
     * Returns the unit to its position at the start of this phase.
     */
    undoMove() {
        const unit = this.selectedUnit;
        if (!unit || unit.acted) return; // can't undo after acting

        unit.x     = this._preMovePosX;
        unit.y     = this._preMovePosY;
        unit.moved = false;

        // Recalculate movement range from the restored position
        this.movableTiles    = this.calcMovementRange(unit);
        this.attackableTiles = this.calcAttackRange(unit.x, unit.y, unit.atkRange);

        this.state = 'player_move';
        this._emit('move_undone', { unit });
    }

    // =========================================================================
    // Combat — damage calculation
    // =========================================================================

    /**
     * Calculate damage dealt from attacker to defender.
     *
     * Shining Force-style formula:
     *   base   = attacker.atk * 2 − defender.def
     *   after terrain = base − TERRAIN[defender tile].defBonus
     *   jitter = random integer in [−2, +2]
     *   final  = max(1, after terrain + jitter)
     *   critical (10%) → damage *= 1.5
     *
     * @param {object} attacker
     * @param {object} defender
     * @param {boolean} [ignoresTerrain=false]
     * @returns {{ damage: number, critical: boolean }}
     */
    calcDamage(attacker, defender, ignoresTerrain = false) {
        const atkStat    = attacker.atk + (attacker._atkBuff || 0);
        const defStat    = Math.max(0, defender.def - (defender._defDebuff || 0));
        const terrain    = this.getTerrain(defender.x, defender.y);
        const terrainDef = ignoresTerrain ? 0 : terrain.defBonus;

        const base    = atkStat * 2 - defStat;
        const jitter  = Math.floor(Math.random() * 5) - 2; // -2 to +2
        let damage    = Math.max(1, base - terrainDef + jitter);

        const critical = Math.random() < 0.10;
        if (critical) {
            damage = Math.ceil(damage * 1.5);
        }

        return { damage, critical };
    }

    // =========================================================================
    // Combat — attack execution
    // =========================================================================

    /**
     * Execute a physical attack from `attacker` against `defender`.
     *
     * Counter-attack rules (classic Shining Force):
     *   - Defender counter-attacks only if attacker is within DEFENDER's range.
     *   - Counter only happens if the defender is still alive after the first hit.
     *
     * @param {object} attacker
     * @param {object} defender
     * @returns {{
     *   damage: number, critical: boolean, killed: boolean,
     *   counterDamage: number|null, counterCritical: boolean|null
     * }}
     */
    executeAttack(attacker, defender) {
        // ── Initial strike ────────────────────────────────────────────────────
        const { damage, critical } = this.calcDamage(attacker, defender);
        defender.hp = Math.max(0, defender.hp - damage);

        const killed = defender.hp <= 0;
        if (killed) {
            defender.alive = false;
        }

        attacker.acted = true;

        // Emit attack event
        this._emit('unit_attacked', { attacker, defender, damage, critical, killed });

        if (killed) {
            this._emit('unit_died', { unit: defender });
        }

        // ── Counter-attack ────────────────────────────────────────────────────
        let counterDamage   = null;
        let counterCritical = null;

        if (!killed && this._inAttackRange(defender.x, defender.y, attacker.x, attacker.y, defender.atkRange)) {
            const counter = this.calcDamage(defender, attacker);
            counterDamage   = counter.damage;
            counterCritical = counter.critical;

            attacker.hp = Math.max(0, attacker.hp - counterDamage);
            const attackerKilled = attacker.hp <= 0;
            if (attackerKilled) {
                attacker.alive = false;
            }

            this._emit('unit_attacked', {
                attacker:  defender,
                defender:  attacker,
                damage:    counterDamage,
                critical:  counterCritical,
                killed:    attackerKilled,
                isCounter: true,
            });

            if (attackerKilled) {
                this._emit('unit_died', { unit: attacker });
            }
        }

        // ── Post-combat bookkeeping ───────────────────────────────────────────
        this._awardExp(attacker, defender, killed);
        this.checkStoryTriggers();
        this.checkBattleEnd();

        return { damage, critical, killed, counterDamage, counterCritical };
    }

    /**
     * Award EXP to a unit after combat.
     * Levels up if EXP >= 100.
     * @private
     */
    _awardExp(unit, defeated, killed) {
        if (!unit.alive) return;

        // Base exp: 10 per attack, +20 bonus if target was killed
        const gain = 10 + (killed ? 20 : 0);
        unit.exp  += gain;

        while (unit.exp >= 100) {
            unit.exp -= 100;
            this._levelUp(unit);
        }
    }

    /**
     * Level a unit up, boosting stats.
     * @private
     */
    _levelUp(unit) {
        unit.level += 1;

        // Small random stat gains (Shining Force style)
        unit.maxHp  += Math.floor(Math.random() * 3) + 2;  // +2..4
        unit.hp      = unit.maxHp; // full restore on level up
        unit.maxMp  += Math.floor(Math.random() * 2);       // +0..1
        unit.mp      = unit.maxMp;
        unit.atk    += Math.floor(Math.random() * 2) + 1;  // +1..2
        unit.def    += Math.floor(Math.random() * 2);       // +0..1
        unit.spd    += Math.floor(Math.random() * 2);       // +0..1

        this._emit('level_up', { unit });
    }

    // =========================================================================
    // Abilities
    // =========================================================================

    /**
     * Use an ability.
     *
     * @param {object} unit         — the caster
     * @param {string} abilityName  — key in ABILITY_DEFS
     * @param {number} targetX
     * @param {number} targetY
     * @returns {boolean} true if ability was used successfully
     */
    useAbility(unit, abilityName, targetX, targetY) {
        const def = ABILITY_DEFS[abilityName];
        if (!def) {
            console.warn(`[TacticsEngine] Unknown ability: ${abilityName}`);
            return false;
        }

        if (unit.mp < def.mpCost) {
            this._emit('ability_failed', { unit, reason: 'not_enough_mp' });
            return false;
        }

        unit.mp -= def.mpCost;
        unit.acted = true;

        // Collect targets in AoE or single-target
        let targets = [];

        if (def.aoeRadius > 0) {
            // All units in radius around (targetX, targetY)
            targets = this.units.filter(u => {
                if (!u.alive) return false;
                const dist = Math.abs(u.x - targetX) + Math.abs(u.y - targetY);
                return dist <= def.aoeRadius;
            });
        } else {
            const t = this.getUnitAt(targetX, targetY);
            if (t) targets.push(t);
        }

        // Filter by target type
        targets = targets.filter(t => {
            if (def.targetType === 'enemy') return t.team !== unit.team;
            if (def.targetType === 'ally')  return t.team === unit.team;
            return true;
        });

        // Apply effect to each target
        targets.forEach(target => {
            // ── Damage ability ────────────────────────────────────────────────
            if (def.power !== undefined) {
                const { damage, critical } = this.calcDamage(
                    { ...unit, atk: Math.floor(def.power / 2) },
                    target,
                    def.ignoresTerrain || false
                );
                target.hp = Math.max(0, target.hp - damage);
                const killed = target.hp <= 0;
                if (killed) target.alive = false;

                this._emit('unit_attacked', { attacker: unit, defender: target, damage, critical, killed, isAbility: true, abilityName });
                if (killed) this._emit('unit_died', { unit: target });

            // ── Heal ability ──────────────────────────────────────────────────
            } else if (def.healAmount !== undefined) {
                const healed = Math.min(def.healAmount, target.maxHp - target.hp);
                target.hp   += healed;
                this._emit('unit_healed', { healer: unit, target, amount: healed });

            // ── ATK buff ──────────────────────────────────────────────────────
            } else if (def.atkBuff !== undefined) {
                target._atkBuff = (target._atkBuff || 0) + def.atkBuff;
                this._emit('unit_buffed', { source: unit, target, stat: 'atk', amount: def.atkBuff });

            // ── DEF debuff ────────────────────────────────────────────────────
            } else if (def.defDebuff !== undefined) {
                target._defDebuff = (target._defDebuff || 0) + def.defDebuff;
                this._emit('unit_debuffed', { source: unit, target, stat: 'def', amount: def.defDebuff });
            }
        });

        this._emit('ability_used', { unit, abilityName, targetX, targetY, targets });

        this.checkStoryTriggers();
        this.checkBattleEnd();
        return true;
    }

    /**
     * Enter targeting state for an ability.
     * Called by the renderer when player picks an ability from the action menu.
     *
     * @param {string} abilityName
     */
    beginAbilityTarget(abilityName) {
        if (!this.selectedUnit) return;
        const def = ABILITY_DEFS[abilityName];
        if (!def) return;

        this._pendingAbility = abilityName;

        // Compute targetable tiles based on unit's attack range (reuse atkRange)
        this.attackableTiles = this.calcAttackRange(
            this.selectedUnit.x,
            this.selectedUnit.y,
            this.selectedUnit.atkRange
        );

        this.state = 'player_target';
        this._emit('ability_targeting', { unit: this.selectedUnit, abilityName, attackableTiles: this.attackableTiles });
    }

    // =========================================================================
    // Turn management
    // =========================================================================

    /**
     * Mark the selected unit's turn as done (Wait action).
     * The unit's acted flag is set and turn passes to checkPhaseEnd.
     */
    endUnitTurn() {
        const unit = this.selectedUnit;
        if (!unit) return;

        unit.acted = true;
        unit.moved = true; // treat as having moved too

        this.selectedUnit    = null;
        this.movableTiles    = [];
        this.attackableTiles = [];

        this.state = 'player_select';
        this._emit('unit_waited', { unit });

        this.checkPhaseEnd();
    }

    /**
     * Check whether all player units have acted; if so, start the enemy phase.
     */
    checkPhaseEnd() {
        const playerUnits = this.getTeamUnits('player');
        const allActed    = playerUnits.every(u => u.acted);

        if (allActed) {
            this.startEnemyPhase();
        }
    }

    /**
     * Start the player phase: increment turn counter, reset flags, emit event.
     */
    startPlayerPhase() {
        this.turnNumber += 1;

        // Reset player unit flags and clear temporary buffs
        this.getTeamUnits('player').forEach(u => {
            u.moved      = false;
            u.acted      = false;
            u._atkBuff   = 0;
            u._defDebuff = 0;
        });

        // Also clear enemy debuffs that shouldn't persist
        this.getTeamUnits('enemy').forEach(u => {
            u._defDebuff = 0;
        });

        this.state = 'player_select';
        this._emit('phase_change', { phase: 'player', turnNumber: this.turnNumber });
    }

    // =========================================================================
    // Enemy AI
    // =========================================================================

    /**
     * Start the enemy phase.
     * Queues all alive enemy units and processes them one at a time
     * with a small delay between each so the renderer can animate.
     */
    startEnemyPhase() {
        // Clear any still-pending enemy process timer
        if (this._enemyProcessTimer !== null) {
            clearTimeout(this._enemyProcessTimer);
            this._enemyProcessTimer = null;
        }

        this.state = 'enemy_turn';
        this._emit('phase_change', { phase: 'enemy', turnNumber: this.turnNumber });

        // Reset enemy flags
        this.getTeamUnits('enemy').forEach(u => {
            u.moved    = false;
            u.acted    = false;
            u._atkBuff = 0;
        });
        this.getTeamUnits('player').forEach(u => {
            u._defDebuff = 0;
        });

        // Build the queue of enemies to process
        this._enemyQueue = [...this.getTeamUnits('enemy')];
        this._processNextEnemy();
    }

    /**
     * Pull the next enemy off the queue and process it, or end the enemy phase.
     * @private
     */
    _processNextEnemy() {
        // If the battle has already ended (victory or defeat), stop processing
        if (this.state === 'victory' || this.state === 'defeat') return;

        if (this._enemyQueue.length === 0) {
            // All enemies done → back to player phase
            this.startPlayerPhase();
            return;
        }

        const unit = this._enemyQueue.shift();

        // Unit may have been killed during a counter-attack earlier this phase
        if (!unit.alive) {
            this._processNextEnemy();
            return;
        }

        this.processEnemyUnit(unit);

        // If the attack ended the battle, stop scheduling more enemies
        if (this.state === 'victory' || this.state === 'defeat') return;

        // Yield control to let the renderer animate, then continue
        // In environments without setTimeout (testing), call synchronously.
        if (typeof setTimeout !== 'undefined') {
            this._enemyProcessTimer = setTimeout(() => this._processNextEnemy(), 400);
        } else {
            this._processNextEnemy();
        }
    }

    /**
     * AI logic for a single enemy unit.
     *
     * Strategy:
     *  1. Find all reachable tiles.
     *  2. For each reachable tile, check if any player unit is in attack range.
     *  3. Score (moveTile, attackTarget) pairs:
     *       - bonus if target is low HP (can finish it off)
     *       - bonus for defensive terrain on the move tile
     *  4. If a good (move, attack) pair found → move + attack.
     *  5. Otherwise, move toward nearest player unit.
     *  6. After moving, attack if now in range.
     *
     * @param {object} unit
     */
    processEnemyUnit(unit) {
        const playerUnits = this.getTeamUnits('player');
        if (playerUnits.length === 0) return;

        const reachable = this.calcMovementRange(unit);

        // Include the unit's current tile as a valid "don't move" option
        const allPositions = [{ x: unit.x, y: unit.y, cost: 0 }, ...reachable];

        // ── Phase 1: find best (move, attack) combo ───────────────────────────
        let bestScore   = -Infinity;
        let bestMove    = null;
        let bestTarget  = null;

        for (const pos of allPositions) {
            const attackable = this.calcAttackRange(pos.x, pos.y, unit.atkRange);

            for (const tile of attackable) {
                const target = this.getUnitAt(tile.x, tile.y);
                if (!target || target.team !== 'player') continue;

                let score = 0;

                // Strongly prefer targets that can be killed in one hit
                const estimatedDmg = Math.max(1, unit.atk * 2 - target.def);
                if (estimatedDmg >= target.hp) score += 100;

                // Prefer low-HP targets (opportunistic)
                score += (1 - target.hp / target.maxHp) * 40;

                // Prefer defensive terrain for the move position
                const moveTerrain = this.getTerrain(pos.x, pos.y);
                score += moveTerrain.defBonus * 3;
                score += moveTerrain.avoid;

                // Penalise tiles occupied by another allied unit
                // (can't stop there, but we check this for the starting tile)
                const occupant = this.getUnitAt(pos.x, pos.y);
                if (occupant && occupant !== unit) score -= 999;

                if (score > bestScore) {
                    bestScore  = score;
                    bestMove   = pos;
                    bestTarget = target;
                }
            }
        }

        // ── Phase 2: execute best action ──────────────────────────────────────
        if (bestMove && bestTarget) {
            // Move to best position if it differs from current
            if (bestMove.x !== unit.x || bestMove.y !== unit.y) {
                const fromX = unit.x;
                const fromY = unit.y;
                const path  = this._buildPath(unit, bestMove.x, bestMove.y);
                unit.x      = bestMove.x;
                unit.y      = bestMove.y;
                unit.moved  = true;
                this._emit('unit_moved', { unit, fromX, fromY, toX: bestMove.x, toY: bestMove.y, path });
            }

            // Attack
            this.executeAttack(unit, bestTarget);
            unit.acted = true;
            // If the attack ended the battle, return immediately
            if (this.state === 'victory' || this.state === 'defeat') return;
            return;
        }

        // ── Phase 3: no attack available → move toward nearest player unit ────
        const nearest = this._findNearestPlayer(unit, playerUnits);
        if (!nearest) return;

        const bestTile = this._findBestMoveToward(unit, nearest, reachable);

        if (bestTile) {
            const fromX = unit.x;
            const fromY = unit.y;
            const path  = this._buildPath(unit, bestTile.x, bestTile.y);
            unit.x      = bestTile.x;
            unit.y      = bestTile.y;
            unit.moved  = true;
            this._emit('unit_moved', { unit, fromX, fromY, toX: bestTile.x, toY: bestTile.y, path });

            // Check if now in range after moving
            if (this._inAttackRange(unit.x, unit.y, nearest.x, nearest.y, unit.atkRange)) {
                this.executeAttack(unit, nearest);
                // If the attack ended the battle, return immediately
                if (this.state === 'victory' || this.state === 'defeat') return;
            }
        }

        unit.acted = true;
    }

    /**
     * Find the nearest alive player unit by Manhattan distance.
     * @private
     */
    _findNearestPlayer(unit, playerUnits) {
        let nearest  = null;
        let minDist  = Infinity;

        for (const p of playerUnits) {
            const d = Math.abs(p.x - unit.x) + Math.abs(p.y - unit.y);
            if (d < minDist) {
                minDist  = d;
                nearest  = p;
            }
        }

        return nearest;
    }

    /**
     * Among reachable tiles, find the one that gets closest to the target.
     * Prefer defensive terrain as a tiebreaker.
     * @private
     */
    _findBestMoveToward(unit, target, reachable) {
        let best       = null;
        let bestDist   = Math.abs(target.x - unit.x) + Math.abs(target.y - unit.y);
        let bestTerrain = 0;

        for (const tile of reachable) {
            // Don't try to stop on a tile occupied by another unit
            const occupant = this.getUnitAt(tile.x, tile.y);
            if (occupant && occupant !== unit) continue;

            const d = Math.abs(target.x - tile.x) + Math.abs(target.y - tile.y);
            const t = this.getTerrain(tile.x, tile.y);

            if (d < bestDist || (d === bestDist && t.defBonus > bestTerrain)) {
                bestDist    = d;
                bestTerrain = t.defBonus;
                best        = tile;
            }
        }

        return best;
    }

    // =========================================================================
    // Victory / Defeat
    // =========================================================================

    /**
     * Check if the battle is over (all enemies dead → victory, all players dead → defeat).
     * Emits the appropriate event and updates state.
     */
    checkBattleEnd() {
        const playerAlive = this.getTeamUnits('player').length;
        const enemyAlive  = this.getTeamUnits('enemy').length;

        if (enemyAlive === 0) {
            this.state = 'victory';
            this._emit('victory', { turnNumber: this.turnNumber });
            return;
        }

        if (playerAlive === 0) {
            this.state = 'defeat';
            this._emit('defeat', { turnNumber: this.turnNumber });
            return;
        }
    }

    // =========================================================================
    // Dialogue system
    // =========================================================================

    /**
     * Add a line to the dialogue queue.
     * @param {string}      speaker   — character name
     * @param {string}      text      — dialogue text
     * @param {string|null} portrait  — portrait key/URL or null
     */
    queueDialogue(speaker, text, portrait = null) {
        this.dialogueQueue.push({ speaker, text, portrait });

        // If we're not already in dialogue, start now
        if (this.state !== 'dialogue' && this.state !== 'intro') {
            this._stateBeforeDialogue = this.state;
            this._nextDialogue();
        }
    }

    /**
     * Display the next queued dialogue line, or end dialogue mode.
     * @private
     */
    _nextDialogue() {
        if (this.dialogueQueue.length === 0) {
            // Dialogue finished — return to previous state
            this.currentDialogue = null;
            this.state = this._stateBeforeDialogue || 'player_select';
            this._stateBeforeDialogue = null;
            this._dialogueTimer = 0;
            this._emit('dialogue_end', {});
            return;
        }

        const line = this.dialogueQueue.shift();
        this.currentDialogue = line;

        if (this.state !== 'dialogue' && this.state !== 'intro') {
            this._stateBeforeDialogue = this.state;
        }
        this.state = 'dialogue';

        // Reset auto-advance timer and compute display time from text length
        this._dialogueTimer = 0;
        this._dialogueAutoTime = Math.max(2.0, Math.min(6.0, line.text.length * 0.04 + 1.5));

        this._emit('dialogue', { speaker: line.speaker, text: line.text, portrait: line.portrait });
    }

    /**
     * Advance to the next dialogue line (player tapped / pressed confirm).
     */
    advanceDialogue() {
        this._nextDialogue();
    }

    /**
     * Tick the auto-advance timer for dialogue.
     * Call this every frame with the delta-time in seconds.
     * When the timer exceeds _dialogueAutoTime, the dialogue auto-advances.
     * @param {number} dt  — elapsed seconds since last frame
     */
    tickDialogue(dt) {
        if (this.state !== 'dialogue' && this.state !== 'intro') return;
        this._dialogueTimer += dt;
        if (this._dialogueTimer >= this._dialogueAutoTime) {
            this._nextDialogue();
        }
    }

    // =========================================================================
    // Story triggers
    // =========================================================================

    /**
     * Check all unfired story triggers and fire any whose conditions are met.
     * Should be called after every combat/movement action.
     */
    checkStoryTriggers() {
        for (const trigger of this.storyTriggers) {
            if (trigger.fired) continue;
            if (typeof trigger.condition === 'function' && trigger.condition()) {
                trigger.fired = true;
                if (typeof trigger.action === 'function') {
                    trigger.action();
                }
            }
        }
    }

    // =========================================================================
    // Input handling — the main interaction entry point
    // =========================================================================

    /**
     * Handle a player tap at the given grid coordinates.
     *
     * This is the primary input method. The renderer translates pixel
     * coordinates to grid coordinates and forwards them here.
     *
     * @param {number} gridX
     * @param {number} gridY
     */
    handleTap(gridX, gridY) {
        this.cursor.x = gridX;
        this.cursor.y = gridY;

        // ── Dialogue: any tap advances to the next line ───────────────────────
        if (this.state === 'dialogue' || this.state === 'intro') {
            this.advanceDialogue();
            return;
        }

        // ── Animating: ignore taps ────────────────────────────────────────────
        if (this.state === 'animating') return;

        // ── Enemy turn: ignore taps ───────────────────────────────────────────
        if (this.state === 'enemy_turn') return;

        // ── Victory / defeat ──────────────────────────────────────────────────
        if (this.state === 'victory' || this.state === 'defeat') return;

        // ── player_select: pick a friendly unit ───────────────────────────────
        if (this.state === 'player_select') {
            const unit = this.getUnitAt(gridX, gridY);
            if (unit && unit.team === 'player' && !unit.acted && unit.alive) {
                this.selectUnit(unit);
            }
            return;
        }

        // ── player_move: choose destination or switch unit ────────────────────
        if (this.state === 'player_move') {
            // Tapped a movable tile?
            const inMovable = this.movableTiles.some(t => t.x === gridX && t.y === gridY);
            if (inMovable) {
                this.moveUnit(gridX, gridY);
                return;
            }

            // Tapped the currently selected unit → deselect
            if (this.selectedUnit && this.selectedUnit.x === gridX && this.selectedUnit.y === gridY) {
                this.cancelSelection();
                return;
            }

            // Tapped a different friendly unit → switch selection
            const other = this.getUnitAt(gridX, gridY);
            if (other && other.team === 'player' && !other.acted && other.alive) {
                this.selectUnit(other);
                return;
            }

            return;
        }

        // ── player_action: action menu is visible — renderer handles the menu
        //    buttons, but a tap on the map while the menu is open deselects
        //    only if we explicitly support that (we don't consume taps here).
        if (this.state === 'player_action') {
            // Renderer presents buttons; tapping the map elsewhere = undo move
            const unit = this.selectedUnit;
            if (unit && !unit.acted) {
                this.undoMove();
            }
            return;
        }

        // ── player_target: choose a target tile ───────────────────────────────
        if (this.state === 'player_target') {
            const inRange = this.attackableTiles.some(t => t.x === gridX && t.y === gridY);

            if (!inRange) {
                // Tapped outside range — cancel targeting and return to action
                this._pendingAbility = null;
                this.state = 'player_action';
                this._emit('targeting_cancelled', {});
                return;
            }

            if (this._pendingAbility && this._pendingAbility !== 'attack') {
                // Ability targeting
                this.useAbility(this.selectedUnit, this._pendingAbility, gridX, gridY);
                this._pendingAbility = null;
                // After ability, end the unit's turn and return to player_select
                this.selectedUnit    = null;
                this.movableTiles    = [];
                this.attackableTiles = [];
                this.state = 'player_select';
                this.checkPhaseEnd();
            } else {
                // Regular attack
                const target = this.getUnitAt(gridX, gridY);
                if (target && target.team === 'enemy' && target.alive) {
                    const result = this.executeAttack(this.selectedUnit, target);

                    // Clean up selection after attack
                    this.selectedUnit    = null;
                    this.movableTiles    = [];
                    this.attackableTiles = [];

                    if (this.state !== 'victory' && this.state !== 'defeat') {
                        this.state = 'player_select';
                        this.checkPhaseEnd();
                    }
                }
            }

            return;
        }
    }

    /**
     * Convenience method: enter attack-targeting mode for the selected unit.
     * Called by the renderer when the player chooses "Attack" from the menu.
     */
    beginAttackTarget() {
        if (!this.selectedUnit) return;

        this._pendingAbility = 'attack';
        this.attackableTiles = this.calcAttackRange(
            this.selectedUnit.x,
            this.selectedUnit.y,
            this.selectedUnit.atkRange
        );
        this.state = 'player_target';
        this._emit('attack_targeting', { unit: this.selectedUnit, attackableTiles: this.attackableTiles });
    }

    // =========================================================================
    // Serialisation helpers (for save/restore)
    // =========================================================================

    /**
     * Return a plain-object snapshot of the engine state.
     * Suitable for JSON.stringify / localStorage persistence.
     */
    getSnapshot() {
        return {
            state:      this.state,
            turnNumber: this.turnNumber,
            map:        this.map,
            units:      this.units.map(u => ({ ...u })),
        };
    }

    /**
     * Restore engine state from a snapshot produced by getSnapshot().
     * NOTE: storyTriggers and onEvent must be re-attached after restoring.
     * @param {object} snapshot
     */
    restoreSnapshot(snapshot) {
        this.state      = snapshot.state;
        this.turnNumber = snapshot.turnNumber;
        this.map        = snapshot.map;
        this.units      = snapshot.units.map(u => ({ ...u }));

        this.selectedUnit    = null;
        this.movableTiles    = [];
        this.attackableTiles = [];
        this.animations      = [];
        this.dialogueQueue   = [];
        this.currentDialogue = null;
        this._enemyQueue     = [];
    }

    // =========================================================================
    // Debug helpers
    // =========================================================================

    /**
     * Print a simple ASCII representation of the current map state to console.
     * P = player unit, E = enemy unit, . = empty passable, # = impassable
     */
    debugPrintMap() {
        if (!this.map) { console.log('[TacticsEngine] No map loaded.'); return; }

        const { width, height } = this.map;
        let out = `Turn ${this.turnNumber} | State: ${this.state}\n`;

        for (let y = 0; y < height; y++) {
            let row = '';
            for (let x = 0; x < width; x++) {
                const unit = this.getUnitAt(x, y);
                if (unit) {
                    row += unit.team === 'player' ? 'P' : 'E';
                } else {
                    const t = this.getTerrain(x, y);
                    row += t.moveCost >= 99 ? '#' : '.';
                }
            }
            out += row + '\n';
        }

        console.log(out);
    }
}

// =============================================================================
// Module export — works in both Node.js (for testing) and browser globals
// =============================================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TacticsEngine, TERRAIN, ABILITY_DEFS };
}
