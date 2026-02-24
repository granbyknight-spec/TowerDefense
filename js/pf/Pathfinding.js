'use strict';
// =============================================================================
// Puppy Force — Pathfinding.js
// Flood-fill movement range + A* path finding
// =============================================================================

/**
 * Returns array of {col, row} tiles a unit can reach, excluding its own tile.
 * Friendly units can be passed through but not stopped on.
 * Enemy-occupied tiles block movement.
 */
function getReachableTiles(unit, mapGrid, allUnits) {
  const rows = mapGrid.length;
  const cols = mapGrid[0].length;

  // Build occupancy map
  const occupied = new Map();
  allUnits.forEach(u => {
    if (!u.dead && u !== unit) {
      occupied.set(`${u.col},${u.row}`, u);
    }
  });

  const visited  = new Map(); // key -> min cost spent
  const reachable = [];
  const queue = [{ col: unit.col, row: unit.row, cost: 0 }];
  visited.set(`${unit.col},${unit.row}`, 0);

  const DIR = [[0,1],[0,-1],[1,0],[-1,0]];

  while (queue.length > 0) {
    // Pop cheapest (simple priority)
    queue.sort((a,b) => a.cost - b.cost);
    const cur = queue.shift();

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
      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;

      const terrainId = mapGrid[nr][nc];
      const movCost   = unit.moveCostFor(terrainId);
      if (movCost >= 99) continue; // impassable

      const newCost = cur.cost + movCost;
      if (newCost > unit.mov) continue;

      // Can we pass through this tile?
      const neighbor = occupied.get(`${nc},${nr}`);
      if (neighbor && neighbor.team !== unit.team) continue; // blocked by enemy

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
        occupied.set(`${u.col},${u.row}`, u);
      }
    });
  }

  const h = (c, r) => Math.abs(c - targetCol) + Math.abs(r - targetRow);
  const key = (c, r) => `${c},${r}`;

  const open   = [{ col: unit.col, row: unit.row, g: 0, f: h(unit.col, unit.row), path: [] }];
  const closed = new Set();

  while (open.length > 0) {
    open.sort((a,b) => a.f - b.f);
    const cur = open.shift();

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
      const movCost   = unit.moveCostFor(terrainId);
      const isTarget  = nc === targetCol && nr === targetRow;

      // Allow stepping onto target even if impassable terrain (e.g. attack from side)
      if (movCost >= 99 && !isTarget) continue;

      const occ = occupied.get(nk);
      if (occ && occ.team !== unit.team && !isTarget) continue; // blocked

      const g = cur.g + (movCost >= 99 ? 1 : movCost);
      const existing = open.find(n => n.col === nc && n.row === nr);
      if (!existing || existing.g > g) {
        if (existing) open.splice(open.indexOf(existing), 1);
        open.push({ col: nc, row: nr, g, f: g + h(nc, nr),
          path: [...cur.path, { col: cur.col, row: cur.row }] });
      }
    }
  }
  return null;
}

/**
 * Returns all tiles in attack range from a given position.
 * Manhattan distance between min=1 and max=unit.range.
 */
function getAttackTiles(unit, mapGrid, fromCol, fromRow) {
  const rows = mapGrid.length;
  const cols = mapGrid[0].length;
  const col  = (fromCol !== undefined) ? fromCol : unit.col;
  const row  = (fromRow !== undefined) ? fromRow : unit.row;
  const minDist = unit.minRange || 1;  // support minRange for skills like shoot
  const result = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dist = Math.abs(c - col) + Math.abs(r - row);
      if (dist >= minDist && dist <= unit.range) {
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
