import uuid
import logging
import contextvars

request_id_var = contextvars.ContextVar('request_id_var', default=None)

class RequestIDFilter(logging.Filter):
    def filter(self, record):
        record.request_id = request_id_var.get() or '-'
        return True

class RequestIDMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        header_val = request.headers.get('X-Request-ID') or request.headers.get('x-request-id')
        req_id = None
        if header_val and isinstance(header_val, str):
            clean_val = header_val.strip()
            if len(clean_val) <= 64 and all(c.isalnum() or c in '-_' for c in clean_val):
                req_id = clean_val
        if not req_id:
            req_id = str(uuid.uuid4())

        request.request_id = req_id
        token = request_id_var.set(req_id)
        try:
            response = self.get_response(request)
            response['X-Request-ID'] = req_id
            return response
        finally:
            request_id_var.reset(token)
