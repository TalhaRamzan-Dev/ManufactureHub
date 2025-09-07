# utils/data_cleaning.py - Data cleaning and conversion utilities for all tables

import logging
from datetime import datetime
from typing import Any, Dict, Any

def clean_table_data(data: Dict[str, Any], table_name: str) -> Dict[str, Any]:
    """
    Clean and convert data for any table before database operations.
    Handles dates, images, numbers, and other data types.
    """
    clean_data = {}
    
    for key, value in data.items():
        logging.info(f"[{table_name}] Processing field '{key}' with value: {type(value)} = {str(value)[:100] if isinstance(value, str) else value}")
        
        # Handle image fields (any field ending with '_image')
        if key.endswith('_image'):
            if value and isinstance(value, str) and value.startswith('data:'):
                # This is base64 image data, we can't store it directly
                logging.info(f"[{table_name}] Skipping base64 image data for field '{key}'")
                continue
            elif not value or value == '':
                clean_data[key] = None
            else:
                clean_data[key] = value
        
        # Handle date fields (any field ending with '_date' or 'date' or 'deadline')
        elif any(key.endswith(suffix) for suffix in ['_date', 'date', 'deadline']):
            if value and isinstance(value, str):
                try:
                    parsed_date = parse_date_string(value)
                    clean_data[key] = parsed_date
                    logging.info(f"[{table_name}] Converted {key} from '{value}' to {parsed_date}")
                except ValueError as e:
                    logging.warning(f"[{table_name}] Could not parse {key} '{value}': {e}")
                    continue  # Skip this field if we can't parse it
            else:
                clean_data[key] = value
        
        # Handle datetime fields (any field ending with '_at' or 'timestamp')
        elif any(key.endswith(suffix) for suffix in ['_at', 'timestamp']):
            if value and isinstance(value, str):
                try:
                    parsed_datetime = parse_datetime_string(value)
                    clean_data[key] = parsed_datetime
                    logging.info(f"[{table_name}] Converted {key} from '{value}' to {parsed_datetime}")
                except ValueError as e:
                    logging.warning(f"[{table_name}] Could not parse {key} '{value}': {e}")
                    continue
            else:
                clean_data[key] = value
        
        # Handle numeric fields (any field ending with '_cost', '_amount', '_price', '_rate', '_quantity', '_units', '_percent')
        elif any(key.endswith(suffix) for suffix in ['_cost', '_amount', '_price', '_rate', '_quantity', '_units', '_percent', 'num_']):
            if value and isinstance(value, str):
                try:
                    clean_data[key] = float(value)
                except ValueError:
                    logging.warning(f"[{table_name}] Could not convert {key} '{value}' to float")
                    continue
            else:
                clean_data[key] = value
        
        # Handle integer fields (any field ending with '_id' or specific integer fields)
        elif key.endswith('_id') or key in ['num_units', 'progress_percent']:
            if value and isinstance(value, str):
                try:
                    clean_data[key] = int(value)
                except ValueError:
                    logging.warning(f"[{table_name}] Could not convert {key} '{value}' to int")
                    continue
            else:
                clean_data[key] = value
        
        # Handle boolean fields
        elif key.endswith('_active') or key.endswith('_enabled') or key in ['is_active', 'enabled']:
            if isinstance(value, str):
                clean_data[key] = value.lower() in ['true', '1', 'yes', 'on']
            else:
                clean_data[key] = bool(value)
        
        # For all other fields, pass through as-is
        else:
            clean_data[key] = value
    
    logging.info(f"[{table_name}] Cleaned data: {clean_data}")
    return clean_data

def parse_date_string(date_str: str) -> datetime.date:
    """
    Parse various date string formats and return a Python date object.
    """
    if not date_str or not isinstance(date_str, str):
        raise ValueError("Invalid date string")
    
    date_str = date_str.strip()
    
    # Handle RFC 2822 format like 'Thu, 13 Nov 2025 00:00:00 GMT'
    if 'GMT' in date_str or 'UTC' in date_str:
        try:
            parsed_date = datetime.strptime(date_str, '%a, %d %b %Y %H:%M:%S %Z')
            return parsed_date.date()
        except ValueError:
            # Try alternative format without timezone
            parsed_date = datetime.strptime(date_str.replace(' GMT', '').replace(' UTC', ''), '%a, %d %b %Y %H:%M:%S')
            return parsed_date.date()
    
    # Handle ISO format YYYY-MM-DD
    elif date_str.count('-') == 2:
        try:
            parsed_date = datetime.strptime(date_str, '%Y-%m-%d')
            return parsed_date.date()
        except ValueError:
            pass
    
    # Handle DD/MM/YYYY format
    elif date_str.count('/') == 2:
        try:
            parsed_date = datetime.strptime(date_str, '%d/%m/%Y')
            return parsed_date.date()
        except ValueError:
            pass
    
    # Handle MM/DD/YYYY format
    elif date_str.count('/') == 2:
        try:
            parsed_date = datetime.strptime(date_str, '%m/%d/%Y')
            return parsed_date.date()
        except ValueError:
            pass
    
    # Try other common formats
    formats_to_try = [
        '%Y-%m-%d',
        '%d/%m/%Y',
        '%m/%d/%Y',
        '%d-%m-%Y',
        '%m-%d-%Y',
        '%Y/%m/%d',
        '%d.%m.%Y',
        '%m.%d.%Y'
    ]
    
    for fmt in formats_to_try:
        try:
            parsed_date = datetime.strptime(date_str, fmt)
            return parsed_date.date()
        except ValueError:
            continue
    
    raise ValueError(f"Could not parse date string: {date_str}")

def parse_datetime_string(datetime_str: str) -> datetime:
    """
    Parse various datetime string formats and return a Python datetime object.
    """
    if not datetime_str or not isinstance(datetime_str, str):
        raise ValueError("Invalid datetime string")
    
    datetime_str = datetime_str.strip()
    
    # Handle ISO format with 'T' separator
    if 'T' in datetime_str:
        try:
            # Replace Z with +00:00 for proper timezone handling
            if datetime_str.endswith('Z'):
                datetime_str = datetime_str.replace('Z', '+00:00')
            return datetime.fromisoformat(datetime_str)
        except ValueError:
            pass
    
    # Handle standard datetime format YYYY-MM-DD HH:MM:SS
    elif ' ' in datetime_str and datetime_str.count('-') == 2:
        try:
            return datetime.strptime(datetime_str, '%Y-%m-%d %H:%M:%S')
        except ValueError:
            pass
    
    # Handle date-only format (add time)
    elif datetime_str.count('-') == 2:
        try:
            parsed_date = datetime.strptime(datetime_str, '%Y-%m-%d')
            return parsed_date.replace(hour=0, minute=0, second=0, microsecond=0)
        except ValueError:
            pass
    
    # Try other common formats
    formats_to_try = [
        '%Y-%m-%d %H:%M:%S',
        '%d/%m/%Y %H:%M:%S',
        '%m/%d/%Y %H:%M:%S',
        '%Y-%m-%d %H:%M',
        '%d/%m/%Y %H:%M',
        '%m/%d/%Y %H:%M'
    ]
    
    for fmt in formats_to_try:
        try:
            return datetime.strptime(datetime_str, fmt)
        except ValueError:
            continue
    
    raise ValueError(f"Could not parse datetime string: {datetime_str}")

def is_image_field(field_name: str) -> bool:
    """Check if a field name represents an image field."""
    return field_name.endswith('_image') or field_name in ['design_image', 'photo', 'avatar', 'logo']

def is_date_field(field_name: str) -> bool:
    """Check if a field name represents a date field."""
    return any(field_name.endswith(suffix) for suffix in ['_date', 'date', 'deadline'])

def is_datetime_field(field_name: str) -> bool:
    """Check if a field name represents a datetime field."""
    return any(field_name.endswith(suffix) for suffix in ['_at', 'timestamp'])

def is_numeric_field(field_name: str) -> bool:
    """Check if a field name represents a numeric field."""
    return any(field_name.endswith(suffix) for suffix in ['_cost', '_amount', '_price', '_rate', '_quantity', '_units', '_percent'])

def is_integer_field(field_name: str) -> bool:
    """Check if a field name represents an integer field."""
    return field_name.endswith('_id') or field_name in ['num_units', 'progress_percent']
