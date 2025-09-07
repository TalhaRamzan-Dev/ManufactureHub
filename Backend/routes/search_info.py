# routes/search_info.py - Search information and configuration endpoints

from flask import Blueprint, jsonify
from search_config import get_all_search_configs, get_search_config

search_info_bp = Blueprint('search_info', __name__)

@search_info_bp.route('/search/config', methods=['GET'])
def get_search_configs():
    """
    Get all search configurations for the frontend.
    This helps the frontend know what fields are searchable for each model.
    """
    configs = get_all_search_configs()
    return jsonify({
        'search_configs': configs,
        'message': 'Search configurations retrieved successfully'
    })

@search_info_bp.route('/search/config/<string:model_name>', methods=['GET'])
def get_model_search_config(model_name):
    """
    Get search configuration for a specific model.
    
    Args:
        model_name: Name of the model (e.g., 'client', 'client_orders')
    """
    config = get_search_config(model_name)
    return jsonify({
        'model': model_name,
        'config': config,
        'message': f'Search configuration for {model_name} retrieved successfully'
    })

@search_info_bp.route('/search/help', methods=['GET'])
def get_search_help():
    """
    Get general search help information.
    """
    return jsonify({
        'search_help': {
            'description': 'Simple search functionality across all tables',
            'usage': 'Use the search parameter in your GET requests',
            'example': '/api/clients?search=john',
            'features': [
                'Real-time filtering',
                'Searches across relevant text fields',
                'Case-insensitive search',
                'Partial matching support'
            ],
            'tips': [
                'Search is performed on the most relevant fields for each table',
                'Empty search returns all results',
                'Search works with partial text (e.g., "john" matches "Johnson")'
            ]
        }
    })
