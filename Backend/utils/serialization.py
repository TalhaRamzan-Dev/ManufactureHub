# utils/serialization.py - Serialization helper for JSON responses.
from datetime import datetime

def serialize_model(instance):
    result = {}
    for k, v in instance.__dict__.items():
        if k == '_sa_instance_state':
            continue
        elif isinstance(v, datetime):
            result[k] = v.isoformat()
        else:
            result[k] = v
    return result