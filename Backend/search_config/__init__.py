# search_config/__init__.py - Makes search_config directory a Python package

# Import the main functions to make them available at package level
from .search_config import get_search_config, get_all_search_configs

__all__ = ['get_search_config', 'get_all_search_configs']
