import colorsys
import json
import logging
import time
import urllib
import azure.functions as func
import numpy as np
import onnxruntime as rt
from io import BytesIO
from os.path import dirname
from PIL import Image

MODEL_IMAGE_SIZE = (416, 416)
CLASS_NAMES = ['Face']
sess = rt.InferenceSession(dirname(__file__) + "/models/yolov3.onnx")

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    start_time = time.time()
    input_value = validate_input(req)
    
    t = time.time() - start_time
    logging.info(f'Input parsed in {t}ms')
    start_time = t

    if input_value is None:
        return func.HttpResponse(json.dumps({ 'error': 'invalid input in param `input`' }, sort_keys=True, indent=4), status_code=400)

    t = time.time() - start_time
    image = get_image(input_value)
    logging.info(f'Input parsed in {t}ms')
    start_time = t

    result = detection(sess, image)

    t = time.time() - start_time
    logging.info(f'Dectection in {t}ms')

    data = []
    for i in range(len(result[0])):
        data.append({
            'boxe': result[0][i].tolist(),
            'class': {
                'id': int(result[1][i]),
                'label': CLASS_NAMES[int(result[1][i])]
            },
            'score': float(result[2][i]),
        })

    return func.HttpResponse(json.dumps({ 'results': data }, sort_keys=True, indent=4), status_code=200)

def validate_input(req: func.HttpRequest, req_key: str = 'input') -> str:
    req_input = req.params.get(req_key)

    if not req_input:
        try:
            req_body = req.get_json()
        except ValueError:
            pass
        else:
            req_input = req_body.get(req_key)

    if req_input:
        if not isinstance(req_input,(str)):
            return None
        return req_input
    else:
        return None

def get_image(image_url):
    response = urllib.request.urlopen(image_url)
    
    try:
        response_data = response.file.read()
    except AttributeError:
        response_data = response.read()

    image = Image.open(BytesIO(response_data))

    return image

def letterbox_image(image, size):
    '''resize image with unchanged aspect ratio using padding'''
    iw, ih = image.size
    w, h = size
    scale = min(w/iw, h/ih)
    nw = int(iw*scale)
    nh = int(ih*scale)

    image = image.resize((nw,nh), Image.BICUBIC)
    new_image = Image.new('RGB', size, (128,128,128))
    new_image.paste(image, ((w-nw)//2, (h-nh)//2))
    return new_image

def preprocess(img):
    boxed_image = letterbox_image(img, tuple(reversed(MODEL_IMAGE_SIZE)))
    image_data = np.array(boxed_image, dtype='float32')
    image_data /= 255.
    image_data = np.expand_dims(image_data, 0)
    return image_data

def detection(model, image):
    image_data = preprocess(image)

    input_name = model.get_inputs()[0].name
    label_name = model.get_outputs()[0].name

    logging.info(f'Executing onnx with input: `{input_name}`, output: `{label_name}`')

    feed_f = dict(zip(['input_2', 'image_shape'],
                        (image_data, np.array([image.size[1], image.size[0]], dtype='float32').reshape(1, 2))))
    all_boxes, all_scores, indices = model.run(None, input_feed=feed_f)

    out_boxes, out_scores, out_classes = [], [], []
    for idx_ in indices:
        out_classes.append(idx_[1])
        out_scores.append(all_scores[tuple(idx_)])
        idx_1 = (idx_[0], idx_[2])
        out_boxes.append(all_boxes[idx_1])

    return out_boxes, out_classes, out_scores
