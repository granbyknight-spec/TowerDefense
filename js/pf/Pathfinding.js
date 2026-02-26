'use strict';
// =============================================================================
// Puppy Force — Pathfinding.js
// Flood-fill movement range + A* path finding
// =============================================================================

// Compact binary min-heap for pathfinding priority queue
class MinHeap {
  constructor() { this._d = []; }
  push(item) {
    this._d.push(item);
    let i = this._d.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this._d[p].cost <= this._d[i].cost) break;
      [this._d[p], this._d[i]] = [this._d[i], this._d[p]];
      i = p;
    }
  }
  pop() {
    const top = this._d[0];
    const last = this._d.pop();
    if (this._d.length > 0) {
      this._d[0] = last;
      let i = 0;
      while (true) {
        let s = i, l = 2*i+1, r = 2*i+2;
        if (l < this._d.length && this._d[l].cost < this._d[s].cost) s = l;
        if (r < this._d.length && this._d[r].cost < this._d[s].cost) s = r;
        if (s === i) break;
        [this._d[s], this._d[i]] = [this._d[i], this._d[s]];
        i = s;
      }
    }
    return top;
  }
  get size() { return this._d.length; }
}

// Returns terrain movement cost, with optional per-unit-class overrides
function getMovCost(terrainId, unitClass) {
  const base = (TERRAIN[terrainId] || TERRAIN[0]).movCost;
  // Cavalry (HUSKY_RIDER class) moves through forest at cost 1 instead of 2
  if ((unitClass === 'Cavalry' || unitClass === 'Champion') && terrainId === 1 /* FOREST */) return 1;
  return base;
}

/**
 * Returns true if ALL tiles of `unit`'s footprint anchored at (nc, nr) are:
 *  - within map bounds
 *  - not impassable terrain (movCost < 99)
 *  - not occupied by an enemy unit
 * Friendly-occupied tiles are allowed (pass-through).
 */
function _footprintClear(unit, nc, nr, mapGrid, occupied) {
  const sz = 1; // bosses move as 1x1 (visual 2x2 footprint doesn't restrict movement)
  const rows = mapGrid.length;
  const cols = mapGrid[0].length;
  for (let dc = 0; dc < sz; dc++) {
    for (let dr = 0; dr < sz; dr++) {
      const c = nc + dc, r = nr + dr;
      if (c < 0 || c >= cols || r < 0 || r >= rows) return false;
      // terrain check — use unit's moveCostFor if available, else raw tile value
      const tileId = mapGrid[r][c];
      const cost = unit.moveCostFor ? unit.moveCostFor(tileId) : (tileId === 10 || tileId === 3 ? 99 : 1);
      if (cost >= 99) return false;
      const blocker = occupied.get(`${c},${r}`);
      if (blocker && blocker.team !== unit.team) return false;
    }
  }
  return true;
}

/**
 * Returns array of {col, row} tiles a unit can reach, excluding its own tile.
 * Friendly units can be passed through but not stopped on.
 * Enemy-occupied tiles block movement.
 */
function getReachableTiles(unit, mapGrid, allUnits) {
  const rows = mapGrid.length;
  const cols = mapGrid[0].length;

  // Build occupancy map (register all tiles each unit occupies)
  const occupied = new Map();
  allUnits.forEach(u => {
    if (!u.dead && u !== unit) {
      u.getTilesOccupied().forEach(({ col, row }) => {
        occupied.set(`${col},${row}`, u);
      });
    }
  });

  const visited  = new Map(); // key -> min cost spent
  const reachable = [];
  const queue = new MinHeap();
  queue.push({ col: unit.col, row: unit.row, cost: 0 });
  visited.set(`${unit.col},${unit.row}`, 0);

  const DIR = [[0,1],[0,-1],[1,0],[-1,0]];

  while (queue.size > 0) {
    const cur = queue.pop();

    // Can we stop here?
    const occ = occupied.get(`${cur.col},${cur.row}`);
    const isOwnTile = cur.col === unit.col && cur.row === unit.row;
    if (!isOwnTile) {
      if (!occ) {
        reachable.push({ col: cur.col, row: cur.row });
      }
      // Friendly tile: can pass through but not stop
    }

    if (cur.cost >= unit.mov) continue;

    for (const [dc, dr] of DIR) {
      const nc = cur.col + dc;
      const nr = cur.row + dr;

      // Validate the full footprint at (nc, nr)
      if (!_footprintClear(unit, nc, nr, mapGrid, occupied)) continue;

      const terrainId = mapGrid[nr][nc];
      const movCost   = getMovCost(terrainId, unit && unit.unitClass);

      const newCost = cur.cost + movCost;
      if (newCost > unit.mov) continue;

      const key = `${nc},${nr}`;
      if (!visited.has(key) || visited.get(key) > newCost) {
        visited.set(key, newCost);
        queue.push({ col: nc, row: nr, cost: newCost });
      }
    }
  }

  return reachable;
}

/**
 * A* pathfinding from unit position to (targetCol, targetRow).
 * Returns array of {col,row} steps INCLUDING destination, or null if no path.
 * ignoreOccupancy: if true, pass through all units (used by AI for planning).
 */
function findPath(unit, targetCol, targetRow, mapGrid, allUnits, ignoreOccupancy = false) {
  const rows = mapGrid.length;
  const cols = mapGrid[0].length;

  const occupied = new Map();
  if (!ignoreOccupancy) {
    allUnits.forEach(u => {
      if (!u.dead && u !== unit) {
        u.getTilesOccupied().forEach(({ col, row }) => {
          occupied.set(`${col},${row}`, u);
        });
      }
    });
  }

  const h = (c, r) => Math.abs(c - targetCol) + Math.abs(r - targetRow);
  const key = (c, r) => `${c},${r}`;

  // A* open set uses .cost field (= f score) for the MinHeap
  const startNode = { col: unit.col, row: unit.row, g: 0, f: h(unit.col, unit.row), path: [], cost: h(unit.col, unit.row) };
  const open   = new MinHeap();
  open.push(startNode);
  const closed = new Set();
  // Track best g score per tile for duplicate detection
  const bestG = new Map();
  bestG.set(key(unit.col, unit.row), 0);

  while (open.size > 0) {
    const cur = open.pop();

    if (cur.col === targetCol && cur.row === targetRow) {
      return [...cur.path, { col: targetCol, row: targetRow }];
    }

    const ck = key(cur.col, cur.row);
    if (closed.has(ck)) continue;
    closed.add(ck);

    const DIR = [[0,1],[0,-1],[1,0],[-1,0]];
    for (const [dc, dr] of DIR) {
      const nc = cur.col + dc;
      const nr = cur.row + dr;
      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;

      const nk = key(nc, nr);
      if (closed.has(nk)) continue;

      const terrainId = mapGrid[nr][nc];
      const movCost   = getMovCost(terrainId, unit && unit.unitClass);
      const isTarget  = nc === targetCol && nr === targetRow;

      // Allow stepping onto target even if impassable terrain (e.g. attack from side)
      if (movCost >= 99 && !isTarget) continue;

      // For non-target tiles, validate the full footprint at (nc, nr)
      if (!isTarget && !_footprintClear(unit, nc, nr, mapGrid, occupied)) continue;

      const g = cur.g + (movCost >= 99 ? 1 : movCost);
      if (bestG.has(nk) && bestG.get(nk) <= g) continue;
      bestG.set(nk, g);
      const f = g + h(nc, nr);
      open.push({ col: nc, row: nr, g, f, cost: f,
        path: [...cur.path, { col: cur.col, row: cur.row }] });
    }
  }
  return null;
}

/**
 * Returns all tiles in attack range from a given position.
 * For tileSize=1: Manhattan distance from (col, row) to candidate tile.
 * For tileSize>1: minimum Manhattan distance from ANY footprint tile to candidate tile.
 * Range window: [minRange, unit.range].
 */
function getAttackTiles(unit, mapGrid, fromCol, fromRow) {
  const col = (fromCol !== undefined) ? fromCol : unit.col;
  const row = (fromRow !== undefined) ? fromRow : unit.row;
  const sz = unit.tileSize || 1;
  const minDist = unit.minRange || 1;
  const rows = mapGrid.length;
  const cols = mapGrid[0].length;
  const result = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // find min Manhattan dist from any footprint tile to (c, r)
      let minD = Infinity;
      for (let dc = 0; dc < sz; dc++) {
        for (let dr = 0; dr < sz; dr++) {
          const d = Math.abs((col + dc) - c) + Math.abs((row + dr) - r);
          if (d < minD) minD = d;
        }
      }
      if (minD >= minDist && minD <= unit.range) {
        result.push({ col: c, row: r });
      }
    }
  }
  return result;
}

/**
 * Check if two grid positions are adjacent (Manhattan distance = 1).
 */
function isAdjacent(c1, r1, c2, r2) {
  return Math.abs(c1 - c2) + Math.abs(r1 - r2) === 1;
}
