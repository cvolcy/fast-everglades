import os
import json
import azure.functions as func
import onnxruntime as rt
import numpy as np
from azure.storage.file import FileService
from datetime import datetime, timezone

inferenceSession = None

FILE_ACCOUNT_NAME = os.getenv('FILE_ACCOUNT_NAME')
FILE_ACCOUNT_KEY = os.getenv('FILE_ACCOUNT_KEY')

def main(req: func.HttpRequest, context: func.Context)  -> func.HttpResponse:
    sess = getInferenceSession()

    input_name = sess.get_inputs()[0].name
    input_shape = sess.get_inputs()[0].shape
    label_name = sess.get_outputs()[0].name

    data = req.params.get("data")

    if data is not None:
        try:
            data = json.loads(data)
            data = np.argmax(sess.run([label_name], { input_name: np.array([data], dtype=np.float32) })[0], axis=1)
            data = data.tolist()[0]
        except JSONDecodeError:
            data = null

    return func.HttpResponse(json.dumps({ 'input_name': input_name, 'input_shape': input_shape[1:], 'output_name': label_name, 'prediction': data, 'createdAt': datetime.now(timezone.utc).astimezone().isoformat() }, indent=4), status_code=200)

def getInferenceSession():
    return _initialize()

def _initialize():
    global inferenceSession

    if inferenceSession is None:
        file_service = FileService(account_name=FILE_ACCOUNT_NAME, account_key=FILE_ACCOUNT_KEY)

        onnx_file = file_service.get_file_to_bytes('models-share', 'mnist', 'mnist.onnx')
        
        print(f"Inference session initialized")
        inferenceSession = rt.InferenceSession(onnx_file.content)

    return inferenceSession