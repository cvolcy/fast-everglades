import random
import logging
import azure.functions as func

import sys
from cowpy import cow

DEFAULT_MSG = 'Hello World, This is Fast Everglades.\nYou can update this message by setting\nthe query string parameter \'message\'.'

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    msg = cow.Cowacter(eyes=random.choice(list(cow.eye_options()))).milk(get_message(req))

    return func.HttpResponse(msg, status_code=200)

def get_message(req):
    message = req.params.get('message')
    if not message:
        try:
            req_body = req.get_json()
            message = req_body.get('message')
        except (ValueError, AttributeError) as e:
            message = DEFAULT_MSG
    return message
