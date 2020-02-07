import os
import onnxruntime as rt
from azure.storage.file import FileService

FILE_ACCOUNT_NAME = os.getenv('FILE_ACCOUNT_NAME')
FILE_ACCOUNT_KEY = os.getenv('FILE_ACCOUNT_KEY')

def initialize(folder, filename, share="models-share") -> rt.InferenceSession:
    file_service = FileService(account_name=FILE_ACCOUNT_NAME, account_key=FILE_ACCOUNT_KEY)

    onnx_file = file_service.get_file_to_bytes(share, folder, filename)
    
    print(f"Inference session initialized")
    inference_session = rt.InferenceSession(onnx_file.content)

    return inference_session
