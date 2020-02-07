import onnxruntime as rt
from datetime import datetime, timezone

def predict(sess: rt.InferenceSession, data: list[any]):
    input_name = sess.get_inputs()[0].name
    label_name = sess.get_outputs()[0].name

    return sess.run([label_name], { input_name: data) })[0]

def format_results(sess: rt.InferenceSession, data: list[any]) -> dict:
    input_name = sess.get_inputs()[0].name
    input_shape = sess.get_inputs()[0].shape
    label_name = sess.get_outputs()[0].name

    return {
        'input_name': input_name,
        'input_shape': input_shape[1:],
        'output_name': label_name,
        'prediction': data,
        'createdAt': datetime.now(timezone.utc).astimezone().isoformat()
    }