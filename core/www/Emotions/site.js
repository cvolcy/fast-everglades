const emotion_table = ['neutral', 'happiness', 'surprise', 'sadness', 'anger', 'disgust', 'fear', 'contempt'];
// load the ONNX model file
// https://onnxzoo.blob.core.windows.net/models/opset_8/emotion_ferplus/emotion_ferplus.tar.gz
function getInputs(data, width, height, dim) {
    rgbArray = []
    for (var i = 0; i < data.length; i += 4) {
        let pixel = [];
        for (let colorDataIndex = 0; colorDataIndex < dim; colorDataIndex++) {
            pixel.push(data[i + colorDataIndex]);
        }
        rgbArray.push(pixel)
    }
    const tensor = new onnx.Tensor(new Float32Array(1 * width * height), 'float32', [1, dim, width, height]);
    tensor.data.set(rgbArray);
    return tensor;
}
function softmax(arr) {
    return arr.map((value, index) => Math.exp(value) / arr.map((y) => Math.exp(y)).reduce((a, b) => a + b));
}
function argmax(array) {
    return array.reduce((acc, cval, cind, arr) => cval > arr[acc] ? cind : acc, 0);
}
function predictClass(values) {
    let soft = softmax(values);
    let max = argmax(soft);
    return [max, emotion_table[max], soft[max]];
}

var app = new Vue({
    el: "#app",
    data: {
        loadedPercent: null,
        isLoadingModel: false,
        isInitModel: false,
        isInferring: false,
        emotions: [
            { id: 0, icon: '😐', label: "neutral", score: null },
            { id: 1, icon: '😄', label: "happiness", score: null },
            { id: 2, icon: '😲', label: "surprise", score: null },
            { id: 3, icon: '😢', label: "sadness", score: null },
            { id: 4, icon: '😡', label: "anger", score: null },
            { id: 5, icon: '🤮', label: "disgust", score: null },
            { id: 6, icon: '😱', label: "fear", score: null },
            { id: 7, icon: '😌', label: "contempt", score: null }
        ],
        prediction: {
            label: "",
            accuracy: 0.0
        }
    },
    mounted: function () {
        const that = this;
        this.isLoadingModel = true;
        axios.get("https://fasteverglades.blob.core.windows.net/emotions/model.onnx", {
            onDownloadProgress: (progressEvent) => {
                if (progressEvent.lengthComputable) {
                    that.loadedPercent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                }
            },
            responseType: 'arraybuffer'
        })
        .then((response) => {
            const modelFile = response.data;  
            that.isLoadingModel = false;
            that.isInitModel = true;
            that.loadedPercent = null;
            that.initModel(modelFile);
        });
    },
    methods: {
        initModel(model) {
            const myOnnxSession = new onnx.InferenceSession();
            const canvas = document.querySelector("#image-canvas");
            const preview = document.querySelector("#preview-canvas");
            const previewCtx = preview.getContext('2d');
            const ctx = canvas.getContext('2d');
            const that = this;

            myOnnxSession.loadModel(model).then(() => {
                that.isInitModel = false;
                document.querySelector('#image-file').onchange = (e) => {
                    if (!e.target.files.length) return;

                    that.prediction.label = "";
                    that.prediction.accuracy = 0;
                    that.isInferring = true;

                    loadImage(
                        e.target.files[0],
                        (img) => {
                            ctx.drawImage(img, 0, 0);
                            const { data } = ctx.getImageData(0, 0, 64, 64);
                            const inferenceInputs = getInputs(data, 64, 64, 1);
                            // execute the model
                            myOnnxSession.run([inferenceInputs]).then(output => {
                                // consume the output
                                const outputTensor = output.values().next().value;
                                const [index, label, accuracy] = predictClass(outputTensor.data);
                                that.prediction.label = label;
                                that.prediction.accuracy = accuracy;
                                that.isInferring = false;
                                that.updateEmotions(softmax(outputTensor.data));
                                console.log(`model output tensor: ${outputTensor.data}.`);
                            });
                        },
                        { maxWidth: 64, maxHeight: 64, cover: true, crop: true, canvas: true }
                    );

                    const url = URL.createObjectURL(e.target.files[0]);
                    var img = new Image();
                    img.onload = function () {
                        previewCtx.clearRect(0, 0, preview.width, preview.height);
                        previewCtx.drawImage(img, 0, 0, preview.width, preview.height * img.height / img.width);
                    }
                    img.src = url;
                };
            })
            .catch((err) => {
                that.isInferring = false;
                that.isInitModel = false;
            });
        },
        updateEmotions(softmaxValues) {
            for (let index = 0; index < softmaxValues.length; index++) {
                const score = softmaxValues[index];
                const emotionIndex = this.emotions.findIndex((emotion) => emotion.id == index);
                let emotion = this.emotions[emotionIndex];

                emotion.score = score;

                this.$set(this.emotions, emotionIndex, emotion);
                this.emotions.sort((a, b) => b.score - a.score)
            }
        }
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