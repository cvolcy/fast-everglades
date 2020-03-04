
class DrawableImage {
    constructor(ctx, source, x, y, w, h) {
        this.ctx = ctx;
        this.source = source;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;

    }

    draw() {
        this.ctx.drawImage(this.source, this.x, this.y, this.w, this.h);
    }
}

class CrossHair {
    constructor(ctx, x, y, w, h) {
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;

        this.onHoverCb = [];
    }

    draw(event) {
        this.ctx.beginPath();
        
        this.ctx.moveTo(this.x, this.y + this.h * 0.25);
        this.ctx.lineTo(this.x, this.y);
        this.ctx.lineTo(this.x + this.w * 0.25, this.y);

        this.ctx.moveTo(this.x + this.w * 0.75, this.y);
        this.ctx.lineTo(this.x + this.w, this.y);
        this.ctx.lineTo(this.x + this.w, this.y + this.h * 0.25);

        this.ctx.moveTo(this.x + this.w, this.y + this.h * 0.75);
        this.ctx.lineTo(this.x + this.w, this.y + this.h);
        this.ctx.lineTo(this.x + this.w * 0.75, this.y + this.h);

        this.ctx.moveTo(this.x + this.w * 0.25, this.y + this.h);
        this.ctx.lineTo(this.x, this.y + this.h);
        this.ctx.lineTo(this.x, this.y + this.h * 0.75);
        
        let strokeStyle = "black";
        let lineWidth = 1;
        if (event && this.contains(event.mouse.x, event.mouse.y)) {
            strokeStyle = "red";
            lineWidth = 4;
        }

        this.ctx.strokeStyle = strokeStyle;
        this.ctx.lineWidth = lineWidth;

        this.ctx.stroke();
    }

    contains(x, y) {
        if (x < this.x || this.x + this.w < x) return false;
        if (y < this.y || this.y + this.h < y) return false;

        this.onHoverCb.forEach(func => {
            func(this.x, this.y, this.w, this.h, this.ctx);
        });

        return true;
    }

    onHover(func) {
        this.onHoverCb.push(func);
    }
}

let app = new Vue({
    el: "#detection-demo",
    data() {
        return {
            canvas: null,
            detectionCanvas: null,
            drawingPool: [],
            state: 0,
            STATES: {
                MOUNTED: 0,
                LOADING: 1
            }
        }
    },
    mounted() {
        let $context = this;
        this.canvas = document.querySelector("#my-canvas");
        this.detectionCanvas = document.querySelector("#detection-canvas");

        const ctx = this.canvas.getContext('2d');

        this.canvas.onmousemove = function(e) {
            var rect = $context.canvas.getBoundingClientRect(),
                x = (e.clientX - rect.left) / ($context.canvas.offsetWidth / $context.canvas.width),
                y = (e.clientY - rect.top) / ($context.canvas.offsetHeight / $context.canvas.height);

            ctx.clearRect(0, 0, $context.canvas.width, $context.canvas.height);
            $context.drawingPool.forEach(element => {
                element.draw({ mouse: { x: x, y: y }});
            });
        };
    },
    methods: {
        drawBoxes: function(data) {
            const $context = this;

            const ctx = $context.canvas.getContext('2d');
            const detectCtx = $context.detectionCanvas.getContext('2d');

            data.forEach((detection) => {
                const dx = detection.boxe[1],
                      dy = detection.boxe[0],
                      dw = detection.boxe[3] - detection.boxe[1],
                      dh = detection.boxe[2] - detection.boxe[0];
                var crosshair = new CrossHair(ctx, dx, dy, dw, dh);
                crosshair.draw(null);

                crosshair.onHover((x, y, w, h) => {
                    $context.detectionCanvas.width = w+10;
                    $context.detectionCanvas.height = h+10;
                    const imageData = ctx.getImageData(x-5, y-5, w+10, h+10);
                    detectCtx.putImageData(imageData, 0, 0);
                });

                $context.drawingPool.push(crosshair); 
            });
        },
        loadData: function(image_url) {
            let detectionPromise = new Promise((res, rej) => {
                var xhr = new XMLHttpRequest();
                var url = "https://fast-everglades.azurewebsites.net/api/detection";
                xhr.open("POST", url, true);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            var json = JSON.parse(xhr.responseText);
                            res(json.prediction);
                        } else {
                            rej(JSON.parse(xhr.responseText))
                        }
                    }
                };
                var data = JSON.stringify({ "input": image_url });
                xhr.send(data);
            });

            return detectionPromise;
        },
        processFile(e) {
            if (!e.target.files.length) return;

            const ctx = this.canvas.getContext('2d');
            const detectionCtx = this.detectionCanvas.getContext('2d');

            loadImage(
                e.target.files[0],
                async (img) => {
                    this.drawingPool.length = 0;
                    ctx.canvas.width = img.width;
                    ctx.canvas.height = img.height;

                    ctx.drawImage(img, 0, 0);
                    const { data } = ctx.getImageData(0, 0, img.width, img.height);

                    let image = new DrawableImage(ctx, img, 0, 0, img.width, img.height);
                    image.draw();
                    this.drawingPool.push(image);

                    this.state = this.STATES.LOADING;

                    let results = await this.loadData(this.canvas.toDataURL());

                    this.state = this.STATES.MOUNTED;

                    this.drawBoxes(results);
                },
                { maxWidth: 400, maxHeight: 400, cover: false, crop: false, canvas: true }
            );
        },
    }
});

let navigation = new Vue({
    el: "#navigation",
    methods: {
        w3_open() {
            document.getElementById("mySidebar").style.display = "block";
            document.getElementById("myOverlay").style.display = "block";
        },
        w3_close() {
            document.getElementById("mySidebar").style.display = "none";
            document.getElementById("myOverlay").style.display = "none";
        }
    }
});
