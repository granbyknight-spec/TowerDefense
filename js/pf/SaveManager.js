'use strict';
// =============================================================================
// Puppy Force — SaveManager.js
// localStorage save / load for roster and chapter progress
// =============================================================================

const SAVE_KEY = 'puppy_force_save_v1';

const SaveManager = {

  // Returns default fresh save
  newGame() {
    return {
      currentChapter: 1,
      completedChapters: [],
      roster: _buildDefaultRoster(),
    };
  },

  save(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Save failed:', e);
      return false;
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Load failed:', e);
      return null;
    }
  },

  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  },

  deleteSave() {
    localStorage.removeItem(SAVE_KEY);
  },

  // Serialize live Unit objects to save-friendly format
  serializeRoster(units) {
    return units.map(u => u.toSave());
  },

  // Rebuild Unit objects from save data
  deserializeRoster(saveRoster) {
    const units = [];
    for (const sd of saveRoster) {
      const def = HERO_DEFS[sd.id] || ALLY_DEFS[sd.id];
      if (!def) continue;
      const unit = Unit.fromSave(sd, def);
      // Backward compatibility: old saves without weapon/range/unitClass for promoted units
      if (sd.promoted && def.promotedData) {
        if (!sd.weapon)    unit.weapon    = def.promotedData.weapon    || def.weapon || 'sword';
        if (!sd.range)     unit.range     = def.promotedData.range     || def.range  || 1;
        if (!sd.unitClass) unit.unitClass = def.promotedData.unitClass || def.unitClass;
      }
      unit.hp = unit.maxHp;
      units.push(unit);
    }
    return units;
  },

  // Per-unit art style preference (persisted separately from save data)
  // Returns the saved style string ('dark'|'chibi'|'svg') or null (auto).
  getUnitStyle(unitId) {
    const prefs = JSON.parse(localStorage.getItem('pf_unit_styles') || '{}');
    return prefs[unitId] || null;
  },

  // Persist the chosen art style for a unit.
  setUnitStyle(unitId, style) {
    const prefs = JSON.parse(localStorage.getItem('pf_unit_styles') || '{}');
    prefs[unitId] = style;
    localStorage.setItem('pf_unit_styles', JSON.stringify(prefs));
  },

  // Global sprite style for battle map display ('chibi' | 'dark'). Defaults to 'chibi'.
  getArtStyle() {
    return localStorage.getItem('pf_art_style') || 'chibi';
  },
  setArtStyle(style) {
    localStorage.setItem('pf_art_style', style);
  },
};

// Build the starting roster from hero definitions
function _buildDefaultRoster() {
  const ids = ['PUPPY_KNIGHT','CORGI_HEALER','LABRADOR_SCOUT',
               'POODLE_MAGE','HUSKY_RIDER','BEAGLE_ARCHER','TERRIER_THIEF'];
  return ids.map(id => {
    const def  = HERO_DEFS[id];
    const unit = new Unit(def, 0, 0);
    return unit.toSave();
  });
}
