import json
import azure.functions as func
import numpy as np
from ..shared import load_model, inference

inference_session = None

def main(req: func.HttpRequest, context: func.Context)  -> func.HttpResponse:
    sess = get_inference_session()

    data = req.params.get("data")

    if data is not None:
        try:
            data = json.loads(data)
            data = inference.predict(sess, np.array([data], dtype=np.float32))
            data = np.argmax(data[0], axis=1)
            data = data.tolist()[0]
        except JSONDecodeError:
            data = null

    return func.HttpResponse(json.dumps(inference.ormat_results(sess, data), indent=4), status_code=200)

def get_inference_session():
    global inference_session

    if inference_session is None:
        inference_session = load_model.initialize('mnist', 'mnist.onnx')

    return inference_session
