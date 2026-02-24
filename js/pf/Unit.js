'use strict';
// =============================================================================
// Puppy Force — Unit.js
// Unit class: stats, combat, EXP, promotion, save/load
// =============================================================================

class Unit {
  constructor(def, col, row) {
    this.id       = def.id;
    this.name     = def.name;
    this.emoji    = def.emoji;
    this.unitClass = def.unitClass;
    this.team     = def.team;
    this.col      = col;
    this.row      = row;

    // Stats (copy from def)
    const s = def.baseStats;
    this.maxHp = s.maxHp;
    this.hp    = s.maxHp;
    this.atk   = s.atk;
    this.def   = s.def;
    this.mov   = s.mov;
    this.agi   = s.agi;
    this.level = s.level || 1;
    this.exp   = s.exp   || 0;

    this.maxMp = def.maxMp || 0;
    this.mp    = def.maxMp || 0;

    this._skillsAtLevel         = def.skillsAtLevel         || [];
    this._promotedSkillsAtLevel = def.promotedSkillsAtLevel || [];

    this.weapon   = def.weapon || 'sword';
    this.range    = def.range  || 1;
    this.skills   = Array.from(def.skills  || []);
    this.items    = Array.from(def.items   || []);
    this.growth   = def.growth || { hp:3, atk:2, def:1, agi:1 };
    this.ai       = def.ai    || 'aggressive';
    this.isBoss   = def.isBoss || false;
    this.expReward= def.expReward || 20;
    this.promoted = false;
    this.promotedData = def.promotedData || null;
    this.specialMovement = def.specialMovement || [];

    // Battle history (persisted)
    this.battlesParticipated = s.battlesParticipated || 0;
    this.killCount           = s.killCount           || 0;

    // Turn state
    this.hasMoved  = false;
    this.hasActed  = false;
    this.dead      = false;
    this.skipTurn  = false;  // guard buff used

    // Phaser display objects (assigned by scene)
    this.sprite      = null; // text object (emoji)
    this.hpBarBg     = null;
    this.hpBar       = null;
    this.highlight   = null;

    // Temporary buffs [{stat, amount, turns}]
    this.buffs = [];
  }

  // --------------------------------------------------------------------------
  get canAct()  { return !this.dead && !this.hasMoved && !this.hasActed; }
  get isPlayer(){ return this.team === 'player'; }
  get isEnemy() { return this.team === 'enemy'; }

  // --------------------------------------------------------------------------
  // Movement cost for a terrain tile (with special movement overrides)
  moveCostFor(terrainId) {
    const td = TERRAIN[terrainId];
    if (!td) return 1;
    // Special movement: can traverse normally-impassable tiles
    if (td.movCost === 99 && this.specialMovement.includes(td.name)) return 2;
    return td.movCost;
  }

  // --------------------------------------------------------------------------
  // EXP and leveling
  gainExp(amount) {
    const maxLvl = this.promoted ? 20 : 10;
    if (this.level >= maxLvl) { this.exp = 0; return false; }
    this.exp += amount;
    let leveled = false;
    while (this.exp >= 100 && this.level < maxLvl) {
      this.exp -= 100;
      this.level++;
      this._applyLevelUp();
      leveled = true;
    }
    if (this.level >= maxLvl) this.exp = 0;
    return leveled;
  }

  _applyLevelUp() {
    const g = this.growth;
    const hpBonus = Math.random() < 0.5 ? 1 : 0;
    const hpGain = g.hp + hpBonus;
    this.maxHp += hpGain;
    this.hp    = Math.min(this.hp + Math.ceil(hpGain / 2), this.maxHp);
    this.atk   += g.atk;
    this.def   += g.def;
    this.agi   += g.agi;
    if (this.level % 4 === 0) this.mov = Math.min(this.mov + 1, 9);

    // Unlock skills at level milestones
    const progressionList = this.promoted ? this._promotedSkillsAtLevel : this._skillsAtLevel;
    progressionList.forEach(entry => {
      if (entry.level === this.level && !this.skills.includes(entry.skill)) {
        this.skills.push(entry.skill);
      }
    });
  }

  canPromote() {
    return !this.promoted && this.level >= 10 && this.promotedData !== null;
  }

  promote() {
    if (!this.canPromote()) return false;
    const pd = this.promotedData;
    this.promoted  = true;
    this.name      = pd.name;
    this.emoji     = pd.emoji;
    this.unitClass = pd.unitClass;
    const b = pd.bonus;
    this.maxHp += b.hp;
    this.hp     = Math.min(this.hp + b.hp, this.maxHp);
    this.atk   += b.atk;
    this.def   += b.def;
    this.mov    = Math.min(this.mov + (b.mov || 0), 9);
    this.agi   += b.agi;
    this.level  = 1;
    this.exp    = 0;

    // Unlock promoted level-1 skills immediately
    this._promotedSkillsAtLevel.forEach(entry => {
      if (entry.level === 1 && !this.skills.includes(entry.skill)) {
        this.skills.push(entry.skill);
      }
    });
    return true;
  }

  recoverMp(amount) {
    this.mp = Math.min(this.mp + amount, this.maxMp);
  }

  useMp(amount) {
    this.mp = Math.max(0, this.mp - amount);
  }

  // --------------------------------------------------------------------------
  // Buff management
  applyBuff(stat, amount, turns) {
    this[stat] += amount;
    this.buffs.push({ stat, amount, turns });
  }

  tickBuffs() {
    this.buffs = this.buffs.filter(b => {
      b.turns--;
      if (b.turns <= 0) {
        this[b.stat] -= b.amount;
        return false;
      }
      return true;
    });
  }

  // --------------------------------------------------------------------------
  // Turn management
  resetTurn() {
    this.hasMoved = false;
    this.hasActed = false;
    this.skipTurn = false;
    this.tickBuffs();
  }

  endTurn() {
    this.hasMoved = true;
    this.hasActed = true;
  }

  // --------------------------------------------------------------------------
  // Damage/healing
  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp === 0) this.dead = true;
    return this.hp === 0;
  }

  heal(amount) {
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - before;
  }

  // --------------------------------------------------------------------------
  // Use item
  useItem(itemId) {
    const idx = this.items.indexOf(itemId);
    if (idx < 0) return false;
    const item = ITEMS[itemId];
    if (!item) return false;
    if (item.heal) this.heal(item.heal);
    if (item.promote) this.promote();
    this.items.splice(idx, 1);
    return true;
  }

  // --------------------------------------------------------------------------
  // Serialization for save/load
  toSave() {
    return {
      id: this.id,
      name: this.name,
      emoji: this.emoji,
      hp: this.hp,
      maxHp: this.maxHp,
      atk: this.atk,
      def: this.def,
      mov: this.mov,
      agi: this.agi,
      level: this.level,
      exp: this.exp,
      promoted: this.promoted,
      items: [...this.items],
      skills: [...this.skills],
      mp: this.mp,
      maxMp: this.maxMp,
      battlesParticipated: this.battlesParticipated,
      killCount: this.killCount,
    };
  }

  static fromSave(saveData, def) {
    const unit = new Unit(def, 0, 0);
    unit.name     = saveData.name;
    unit.emoji    = saveData.emoji;
    unit.hp       = saveData.hp;
    unit.maxHp    = saveData.maxHp;
    unit.atk      = saveData.atk;
    unit.def      = saveData.def;
    unit.mov      = saveData.mov;
    unit.agi      = saveData.agi;
    unit.level    = saveData.level;
    unit.exp      = saveData.exp;
    unit.promoted = saveData.promoted;
    unit.items    = [...(saveData.items || [])];
    unit.skills   = [...(saveData.skills || [])];
    if (saveData.mp    !== undefined) unit.mp    = saveData.mp;
    if (saveData.maxMp !== undefined) unit.maxMp = saveData.maxMp;
    if (saveData.battlesParticipated !== undefined) unit.battlesParticipated = saveData.battlesParticipated;
    if (saveData.killCount           !== undefined) unit.killCount           = saveData.killCount;
    return unit;
  }
}
