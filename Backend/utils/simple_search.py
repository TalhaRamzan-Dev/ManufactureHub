# utils/simple_search.py - Simple, user-friendly search functionality

import logging
from sqlalchemy import or_, func, cast, String
from typing import Dict, Any

def simple_search(model, query, search_term: str, searchable_fields: list = None):
    """
    Simple search that filters data based on a single search term.
    
    Args:
        model: SQLAlchemy model class
        query: Base query object
        search_term: String to search for
        searchable_fields: List of field names to search in (if None, searches all string fields)
    
    Returns:
        Modified query object
    """
    if not search_term or not search_term.strip():
        return query
    
    search_term = search_term.strip().lower()
    
    try:
        search_conditions = []
        
        if searchable_fields:
            # Search only in specified fields
            for field_name in searchable_fields:
                if hasattr(model, field_name):
                    field = getattr(model, field_name)
                    search_conditions.append(
                        func.lower(cast(field, String)).contains(search_term)
                    )
        else:
            # Search in all string/text fields automatically
            for column in model.__table__.columns:
                if column.type.python_type == str:
                    search_conditions.append(
                        func.lower(cast(column, String)).contains(search_term)
                    )
        
        if search_conditions:
            query = query.filter(or_(*search_conditions))
            logging.info(f"Applied search filter for term: '{search_term}' on {len(search_conditions)} fields")
        
        return query
        
    except Exception as e:
        logging.error(f"Error applying search filter: {e}")
        return query

def get_searchable_fields(model):
    """
    Get a list of searchable field names for a model.
    Useful for frontend to know which fields are searchable.
    
    Args:
        model: SQLAlchemy model class
    
    Returns:
        List of field names that can be searched
    """
    try:
        searchable_fields = []
        for column in model.__table__.columns:
            if column.type.python_type == str:
                searchable_fields.append(column.name)
        return searchable_fields
    except Exception as e:
        logging.error(f"Error getting searchable fields: {e}")
        return []
