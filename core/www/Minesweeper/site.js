/**
 * @class Cell
 * 
 */
class Cell {
    /**
     * 
     * @param {CanvasRenderingContext2D} context2D 
     * @param {number} i 
     * @param {number} j 
     * @param {number} w 
     */
    constructor(context2D, i, j, w) {
        /**
         * @type {CanvasRenderingContext2D}
         */
        this.context2D = context2D;

        this.i = i;
        this.j = j;

        this.x = i * w;
        this.y = j * w;
        this.w = w;

        this.hasAMine = false;
        this.revealed = false;
        this.neighborsCount = null;
    }

    show() {
        this.context2D.beginPath();
        this.context2D.lineWidth = "1";
        this.context2D.strokeStyle = "gray";
        this.context2D.rect(this.x, this.y, this.w, this.w);
        this.context2D.stroke();

        if (this.revealed) {
            this.context2D.beginPath();

            if (this.hasAMine) {
                this.context2D.fillStyle = "lightgray";
                this.context2D.ellipse(
                    this.x + (this.w * 0.5),
                    this.y + (this.w * 0.5),
                    (this.w * 0.25),
                    (this.w * 0.25), 
                    0, 0, 2 * Math.PI);
                this.context2D.fill();
            } else {
                this.context2D.fillStyle = "lightgray";
                this.context2D.rect(this.x+1, this.y+1, this.w-1, this.w-1);
                this.context2D.fill();

                this.context2D.fillStyle = "black";
                if (this.neighborsCount > 0) {
                    this.context2D.font = `${Math.floor(this.w/2)}px Aria`;
                    this.context2D.textAlign = "center";
                    this.context2D.fillText(this.neighborsCount, 
                        this.x + (this.w * 0.5), this.y + (this.w * 0.7));
                }
            }
            this.context2D.stroke();
        }

    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     */
    contains(x, y) {
        return x > this.x && x < this.x + this.w &&
               y > this.y && y < this.y + this.w;
    }

    reveal(grid) {
        this.revealed = true;

        if (this.neighborsCount === 0) {
            for (let xoff = -1; xoff <= 1; xoff++) {
                for(let yoff = -1; yoff <= 1; yoff++) {
                    const i = this.i + xoff;
                    const j = this.j + yoff;
    
                    if (i > -1 && i < grid.length && j > -1 && j < grid[0].length) {
                        let neighbor = grid[i][j];

                        if (!neighbor.hasAMine && !neighbor.revealed) {
                            neighbor.reveal(grid);
                        }
                    }
                }
            }
        }
    }

    minesCount(grid) {
        if (this.neighborsCount)
        {
            return this.neighborsCount;
        }

        if (this.hasAMine) {
            this.neighborsCount = -1;
            return this.neighborsCount;
        }
        
        var total = 0;

        for (let xoff = -1; xoff <= 1; xoff++) {
            for(let yoff = -1; yoff <= 1; yoff++) {
                const i = this.i + xoff;
                const j = this.j + yoff;

                if (i > -1 && i < grid.length && j > -1 && j < grid[0].length) {
                    let neighbor = grid[i][j];

                    if (neighbor.hasAMine) {
                        total++;
                    }
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

var app = new Vue({
    el: "#app",
    data() {
        return {
            cols: 15,
            rows: 15,
            mines: 10,
            state: GAME_STATE.PENDING,
            width: null,
            grid: null,
            GAME_STATE: GAME_STATE
        };
    },
    mounted() {
        
    },
    updated() {
        if (this.state == GAME_STATE.STARTED) {
            this.draw();
        }
    },
    methods: {
        startGame() {
            let grid = this.makeArray(this.cols, this.rows);
            this.width = Math.floor(this.$refs.canvas.width / this.cols);
            this.$refs.canvas.height = this.rows * this.width;
            this.$refs.canvas.width = this.cols * this.width;

            for (let i = 0; i < this.cols; i++) {
                for (let j = 0; j < this.rows; j++) {
                    grid[i][j] = new Cell(
                        this.$refs.canvas.getContext('2d'),
                        i, j, this.width
                    );
                }
            }

            this.mines = Math.min(this.mines, Math.floor(this.cols * this.rows * 0.9));

            let n = 0
            while(n < Math.min(this.mines, this.cols * this.rows)) {
                let i = Math.floor(Math.random() * this.cols);
                let j = Math.floor(Math.random() * this.rows);

                let cell = grid[i][j];
                if (cell.hasAMine == false) {
                    cell.hasAMine = true;
                    n++;
                }
            }

            grid.forEach(row => {
                row.forEach(cell => {
                    cell.minesCount(grid);
                });
            });

            this.grid = grid;
            this.draw();
            this.state = GAME_STATE.STARTED;
        },
        /**
         * 
         * @param {number} cols 
         * @param {number} rows 
         */
        makeArray(cols, rows) {
            let arr = new Array(cols);
            for (let i = 0; i < arr.length; i++) {
                arr[i] = new Array(rows);
            }

            return arr;
        },
        draw() {
            const ctx = this.$refs.canvas.getContext('2d');
            ctx.clearRect ( 0 , 0 , this.$refs.canvas.width , this.$refs.canvas.height );
            
            for (let i = 0; i < this.cols; i++) {
                for (let j = 0; j < this.rows; j++) {
                    this.grid[i][j].show();
                }
            }
        },
        /**
         * 
         * @param {MouseEvent} e 
         */
        onCellClick(e) {
            for (let i = 0; i < this.cols; i++) {
                for (let j = 0; j < this.rows; j++) {
                    if (this.grid[i][j].contains(e.offsetX, e.offsetY)) {
                        this.grid[i][j].reveal(this.grid);

                        if (this.grid[i][j].hasAMine) {
                            this.gameOver();
                        }
                    }
                }
            }

            this.draw();
        },
        restart() {
            this.state = GAME_STATE.PENDING;
        },
        gameOver() {
            this.grid.forEach(row => {
                row.forEach(cell => {
                    cell.reveal(this.grid);
                });
            });

            this.state = GAME_STATE.OVER;
        }
    }
});