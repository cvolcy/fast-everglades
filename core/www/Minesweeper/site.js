/**
 * @class Cell
 */
class Cell {
    /**
     * @param {CanvasRenderingContext2D} context2D
     * @param {number} i
     * @param {number} j
     * @param {number} w
     */
    constructor(context2D, i, j, w) {
        /** @type {CanvasRenderingContext2D} */
        this.context2D = context2D;
        this.i = i;
        this.j = j;
        this.x = i * w;
        this.y = j * w;
        this.w = w;
        this.hasAMine = false;
        this.revealed = false;
        this.flagged = false;
        this.neighborsCount = null;
    }

    /**
     * @param {boolean} darkMode
     */
    show(darkMode = false) {
        const ctx = this.context2D;
        const C = darkMode ? {
            unrevealed:  '#1c1c08',
            stroke:      '#4b5563',
            revealedBg:  '#2d2d0f',
            mineFill:    '#eab308',
            mineGlow:    'rgba(234,179,8,0.5)',
        } : {
            unrevealed:  '#f8fafc',
            stroke:      '#9ca3af',
            revealedBg:  '#e2e8f0',
            mineFill:    '#ca8a04',
            mineGlow:    'rgba(202,138,4,0.45)',
        };

        // Cell background
        ctx.fillStyle = this.revealed ? C.revealedBg : C.unrevealed;
        ctx.fillRect(this.x, this.y, this.w, this.w);

        // Cell border
        ctx.lineWidth = 1;
        ctx.strokeStyle = C.stroke;
        ctx.strokeRect(this.x, this.y, this.w, this.w);

        const cx = this.x + this.w * 0.5;
        const cy = this.y + this.w * 0.5;

        // Flag: drawn before reveal check so flagged unrevealed cells show the flag
        if (this.flagged && !this.revealed) {
            this._drawFlag(ctx, cx, cy, darkMode);
            return;
        }

        if (!this.revealed) return;

        if (this.hasAMine) {
            const r = this.w * 0.26;
            // Glow halo
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2);
            grad.addColorStop(0, C.mineGlow);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, r * 2, 0, 2 * Math.PI);
            ctx.fill();
            // Mine body
            ctx.fillStyle = C.mineFill;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, 2 * Math.PI);
            ctx.fill();
        } else if (this.neighborsCount > 0) {
            // Number colors: 1-8 mapped to a yellow-silver palette
            const numColors = darkMode
                ? ['#facc15','#cbd5e1','#f87171','#a5b4fc','#fb923c','#67e8f9','#f472b6','#94a3b8']
                : ['#ca8a04','#475569','#dc2626','#7c3aed','#ea580c','#0891b2','#be185d','#334155'];
            ctx.fillStyle = numColors[Math.min(this.neighborsCount - 1, 7)];
            ctx.font = `bold ${Math.floor(this.w * 0.6)}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.neighborsCount, cx, cy);
        }
    }

    /**
     * Draws a small flag (pole + triangular pennant) centered on the cell.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} cx  cell center x
     * @param {number} cy  cell center y
     * @param {boolean} darkMode
     */
    _drawFlag(ctx, cx, cy, darkMode) {
        const h = this.w * 0.65;
        const poleX = cx - this.w * 0.05;
        const poleTop = cy - h * 0.5;
        const poleBot = cy + h * 0.5;

        // Pole
        ctx.strokeStyle = darkMode ? '#94a3b8' : '#475569';
        ctx.lineWidth = Math.max(1.5, this.w * 0.07);
        ctx.beginPath();
        ctx.moveTo(poleX, poleTop);
        ctx.lineTo(poleX, poleBot);
        ctx.stroke();

        // Base line
        ctx.lineWidth = Math.max(1, this.w * 0.05);
        ctx.beginPath();
        ctx.moveTo(poleX - this.w * 0.2, poleBot);
        ctx.lineTo(poleX + this.w * 0.2, poleBot);
        ctx.stroke();

        // Pennant (triangle pointing right)
        const flagH = h * 0.45;
        ctx.fillStyle = darkMode ? '#eab308' : '#ca8a04';
        ctx.beginPath();
        ctx.moveTo(poleX, poleTop);
        ctx.lineTo(poleX + flagH * 0.8, poleTop + flagH * 0.4);
        ctx.lineTo(poleX, poleTop + flagH * 0.8);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    contains(x, y) {
        return x > this.x && x < this.x + this.w &&
               y > this.y && y < this.y + this.w;
    }

    /** @param {Cell[][]} grid */
    reveal(grid) {
        if (this.flagged) return; // flagged cells cannot be accidentally revealed
        this.revealed = true;

        if (this.neighborsCount === 0) {
            for (let xoff = -1; xoff <= 1; xoff++) {
                for (let yoff = -1; yoff <= 1; yoff++) {
                    const i = this.i + xoff;
                    const j = this.j + yoff;
                    if (i > -1 && i < grid.length && j > -1 && j < grid[0].length) {
                        const neighbor = grid[i][j];
                        if (!neighbor.hasAMine && !neighbor.revealed && !neighbor.flagged) {
                            neighbor.reveal(grid);
                        }
                    }
                }
            }
        }
    }

    /** @param {Cell[][]} grid */
    minesCount(grid) {
        if (this.neighborsCount !== null) return this.neighborsCount;

        if (this.hasAMine) {
            this.neighborsCount = -1;
            return this.neighborsCount;
        }

        let total = 0;
        for (let xoff = -1; xoff <= 1; xoff++) {
            for (let yoff = -1; yoff <= 1; yoff++) {
                const i = this.i + xoff;
                const j = this.j + yoff;
                if (i > -1 && i < grid.length && j > -1 && j < grid[0].length) {
                    if (grid[i][j].hasAMine) total++;
                }
            }
        }

        this.neighborsCount = total;
        return this.neighborsCount;
    }
}

const GAME_STATE = {
    PENDING: 0,
    STARTED: 1,
    WIN: 2,
    OVER: 3
};

const { createApp } = Vue;

createApp({
    data() {
        return {
            cols: 15,
            rows: 15,
            mines: 10,
            flagCount: 0,
            state: GAME_STATE.PENDING,
            width: null,
            grid: null,
            GAME_STATE: GAME_STATE,
            darkMode: false,
            mobileMenuOpen: false,
        };
    },
    computed: {
        flagsRemaining() {
            return this.mines - this.flagCount;
        }
    },
    mounted() {
        const saved = localStorage.getItem('darkMode');
        this.darkMode = saved !== null
            ? saved === 'true'
            : window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.applyDark();
    },
    updated() {
        if (this.state === GAME_STATE.STARTED ||
            this.state === GAME_STATE.OVER ||
            this.state === GAME_STATE.WIN) {
            this.draw();
        }
    },
    methods: {
        toggleDark() {
            this.darkMode = !this.darkMode;
            localStorage.setItem('darkMode', this.darkMode);
            this.applyDark();
            if (this.grid) this.draw();
        },
        applyDark() {
            document.documentElement.classList.toggle('dark', this.darkMode);
        },
        startGame() {
            const grid = this.makeArray(this.cols, this.rows);
            this.width = Math.floor(this.$refs.canvas.width / this.cols);
            this.$refs.canvas.height = this.rows * this.width;
            this.$refs.canvas.width = this.cols * this.width;
            this.flagCount = 0;

            for (let i = 0; i < this.cols; i++) {
                for (let j = 0; j < this.rows; j++) {
                    grid[i][j] = new Cell(
                        this.$refs.canvas.getContext('2d'), i, j, this.width
                    );
                }
            }

            this.mines = Math.min(this.mines, Math.floor(this.cols * this.rows * 0.9));

            let n = 0;
            while (n < Math.min(this.mines, this.cols * this.rows)) {
                const i = Math.floor(Math.random() * this.cols);
                const j = Math.floor(Math.random() * this.rows);
                const cell = grid[i][j];
                if (!cell.hasAMine) { cell.hasAMine = true; n++; }
            }

            grid.forEach(row => row.forEach(cell => cell.minesCount(grid)));

            this.grid = grid;
            this.draw();
            this.state = GAME_STATE.STARTED;
        },
        /**
         * @param {number} cols
         * @param {number} rows
         */
        makeArray(cols, rows) {
            const arr = new Array(cols);
            for (let i = 0; i < arr.length; i++) arr[i] = new Array(rows);
            return arr;
        },
        draw() {
            const canvas = this.$refs.canvas;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = this.darkMode ? '#1c1c08' : '#f8fafc';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < this.cols; i++) {
                for (let j = 0; j < this.rows; j++) {
                    this.grid[i][j].show(this.darkMode);
                }
            }
        },
        /**
         * Left-click: reveal cell
         * @param {MouseEvent} e
         */
        onCellClick(e) {
            if (this.state !== GAME_STATE.STARTED) return;

            for (let i = 0; i < this.cols; i++) {
                for (let j = 0; j < this.rows; j++) {
                    const cell = this.grid[i][j];
                    if (cell.contains(e.offsetX, e.offsetY)) {
                        if (cell.flagged) return; // respect the flag

                        cell.reveal(this.grid);

                        if (cell.hasAMine) {
                            this.gameOver();
                            return;
                        }
                    }
                }
            }

            this.draw();
            this.checkWin();
        },
        /**
         * Right-click: toggle flag on unrevealed cell
         * @param {MouseEvent} e
         */
        onCellRightClick(e) {
            if (this.state !== GAME_STATE.STARTED) return;

            for (let i = 0; i < this.cols; i++) {
                for (let j = 0; j < this.rows; j++) {
                    const cell = this.grid[i][j];
                    if (cell.contains(e.offsetX, e.offsetY) && !cell.revealed) {
                        if (cell.flagged) {
                            cell.flagged = false;
                            this.flagCount--;
                        } else {
                            cell.flagged = true;
                            this.flagCount++;
                        }
                        this.draw();
                        return;
                    }
                }
            }
        },
        checkWin() {
            const allSafeRevealed = this.grid.every(row =>
                row.every(cell => cell.hasAMine || cell.revealed)
            );
            if (allSafeRevealed) this.state = GAME_STATE.WIN;
        },
        restart() {
            this.state = GAME_STATE.PENDING;
            this.flagCount = 0;
        },
        gameOver() {
            this.grid.forEach(row => row.forEach(cell => cell.reveal(this.grid)));
            this.draw();
            this.state = GAME_STATE.OVER;
        }
    }
}).mount('#app');
