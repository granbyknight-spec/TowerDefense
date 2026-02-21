// Grid management - open map with tower placement

class Grid {
    constructor() {
        this.cols = CONFIG.GRID_COLS;
        this.rows = CONFIG.GRID_ROWS;
        this.entry = { ...CONFIG.ENTRY };
        this.exit = { ...CONFIG.EXIT };
        this.cells = [];
        this.currentPath = null;
        this.init();
    }

    init() {
        // 0 = empty/walkable, 1 = tower
        this.cells = [];
        for (let r = 0; r < this.rows; r++) {
            this.cells[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.cells[r][c] = 0;
            }
        }
        this.recalcPath();
    }

    recalcPath() {
        this.currentPath = findPath(
            this.cells, this.entry, this.exit,
            this.cols, this.rows
        );
        return this.currentPath;
    }

    canPlace(col, row) {
        // Out of bounds
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
        // Already occupied
        if (this.cells[row][col] !== 0) return false;
        // Can't place on entry or exit
        if (col === this.entry.col && row === this.entry.row) return false;
        if (col === this.exit.col && row === this.exit.row) return false;
        // Would block path?
        if (wouldBlockPath(this.cells, col, row, this.cols, this.rows, this.entry, this.exit)) {
            return false;
        }
        return true;
    }

    placeTower(col, row) {
        this.cells[row][col] = 1;
        this.recalcPath();
    }

    removeTower(col, row) {
        this.cells[row][col] = 0;
        this.recalcPath();
    }
}
