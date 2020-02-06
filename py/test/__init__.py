import os
import json
import azure.functions as func

SCRIPT_PATH = os.getenv('USER_DATA_HOME')
print(f"SCRIPT_PATH : {SCRIPT_PATH}")

MODEL_FILENAME = os.path.join(SCRIPT_PATH, "mnist.onnx")
print(f"MODEL_FILENAME : {MODEL_FILENAME}")

def main(req: func.HttpRequest, context: func.Context)  -> func.HttpResponse:
    return func.HttpResponse(json.dumps({ 'SCRIPT_PATH': SCRIPT_PATH, 'MODEL_FILENAME': 'MODEL_FILENAME'  }, sort_keys=True, indent=4), status_code=200)