import logging
from django.db import IntegrityError
from django.core.exceptions import ObjectDoesNotExist, ValidationError as DjangoValidationError
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import APIException
from .middleware import request_id_var

logger = logging.getLogger(__name__)

def _format_error_data(data):
    errors = []
    if isinstance(data, dict):
        for key, val in data.items():
            if isinstance(val, list):
                msgs = [str(v.get('message', v)) if isinstance(v, dict) else str(v) for v in val]
                errors.append({'field': str(key), 'messages': msgs})
            elif isinstance(val, dict):
                sub_errs = _format_error_data(val)
                for se in sub_errs:
                    errors.append({'field': f"{key}.{se['field']}", 'messages': se['messages']})
            else:
                errors.append({'field': str(key), 'messages': [str(val)]})
    elif isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                errors.extend(_format_error_data(item))
            else:
                errors.append({'field': 'non_field', 'messages': [str(item)]})
    return errors

def custom_exception_handler(exc, context):
    req_id = None
    request = context.get('request') if context else None
    if request and hasattr(request, 'request_id'):
        req_id = request.request_id
    if not req_id:
        req_id = request_id_var.get() or '-'

    # First attempt DRF standard handler
    response = exception_handler(exc, context)

    # Handle non-DRF database or Django exceptions
    if response is None:
        if isinstance(exc, IntegrityError):
            msg = str(exc)
            status_code = status.HTTP_409_CONFLICT if 'unique' in msg.lower() or 'duplicate' in msg.lower() else status.HTTP_400_BAD_REQUEST
            response = Response(
                {'message': 'Database integrity conflict.', 'detail': msg},
                status=status_code
            )
        elif isinstance(exc, ObjectDoesNotExist):
            response = Response(
                {'message': 'Requested resource does not exist.'},
                status=status.HTTP_404_NOT_FOUND
            )
        elif isinstance(exc, DjangoValidationError):
            msg = exc.message_dict if hasattr(exc, 'message_dict') else exc.messages
            response = Response(
                {'message': 'Validation error occurred.', 'detail': msg},
                status=status.HTTP_400_BAD_REQUEST
            )
        else:
            logger.exception("Unhandled server exception [Request-ID: %s]: %s", req_id, str(exc), exc_info=exc)
            response = Response(
                {'message': 'An unexpected internal server error occurred.', 'detail': 'Internal Server Error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    custom_data = {
        'success': False,
        'status_code': response.status_code,
        'message': '',
        'errors': [],
        'request_id': req_id
    }

    if isinstance(response.data, dict):
        if 'message' in response.data and response.data['message']:
            custom_data['message'] = str(response.data['message'])
        elif 'detail' in response.data and isinstance(response.data['detail'], str):
            custom_data['message'] = str(response.data['detail'])
        else:
            custom_data['message'] = 'An error occurred.'

        # Extract structured errors
        detail_data = response.data.get('errors') or response.data.get('detail') or response.data
        if isinstance(detail_data, (dict, list)) and detail_data != custom_data['message']:
            if isinstance(detail_data, dict) and ('message' in detail_data or 'detail' in detail_data):
                data_copy = detail_data.copy()
                data_copy.pop('message', None)
                data_copy.pop('detail', None)
                if data_copy:
                    custom_data['errors'] = _format_error_data(data_copy)
            else:
                custom_data['errors'] = _format_error_data(detail_data)

    elif isinstance(response.data, list):
        custom_data['message'] = 'Validation failed.'
        custom_data['errors'] = _format_error_data(response.data)

    response.data = custom_data
    return response
