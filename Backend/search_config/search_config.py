# search_config/search_config.py - Search configuration for different models

# Define which fields are most relevant for search in each model
SEARCH_CONFIG = {
    'client': {
        'searchable_fields': ['name', 'business_name', 'email', 'phone_number', 'shop_address'],
        'description': 'Search by name, business, email, phone, or address',
        'placeholder': 'Search clients...'
    },
    'client_orders': {
        'searchable_fields': ['design_description', 'color', 'material_type', 'order_status'],
        'description': 'Search by design description, color, material, or status',
        'placeholder': 'Search orders...'
    },
    'lot': {
        'searchable_fields': ['lot_status', 'current_stage', 'notes'],
        'description': 'Search by lot status, stage, or notes',
        'placeholder': 'Search lots...'
    },
    'worker': {
        'searchable_fields': ['name', 'skill_type'],
        'description': 'Search by name or skill type',
        'placeholder': 'Search workers...'
    },
    'inventory': {
        'searchable_fields': ['material_name', 'supplier_name'],
        'description': 'Search by material name or supplier',
        'placeholder': 'Search inventory...'
    },
    'lot_expenses': {
        'searchable_fields': ['expense_type', 'notes', 'vendor'],
        'description': 'Search by expense type, notes, or vendor',
        'placeholder': 'Search expenses...'
    },
    'client_ledger': {
        'searchable_fields': ['payment_method', 'notes', 'invoice_number'],
        'description': 'Search by payment method, notes, or invoice number',
        'placeholder': 'Search payments...'
    },
    'day_book': {
        'searchable_fields': ['description', 'reference'],
        'description': 'Search by description or reference',
        'placeholder': 'Search transactions...'
    },
    'lot_worker': {
        'searchable_fields': ['notes', 'work_description'],
        'description': 'Search by notes or work description',
        'placeholder': 'Search lot workers...'
    }
}

def get_search_config(model_name: str) -> dict:
    """
    Get search configuration for a specific model.
    
    Args:
        model_name: Name of the model (e.g., 'client', 'client_orders')
    
    Returns:
        Dictionary containing search configuration
    """
    return SEARCH_CONFIG.get(model_name, {
        'searchable_fields': [],
        'description': 'Search in all text fields',
        'placeholder': 'Search...'
    })

def get_all_search_configs() -> dict:
    """
    Get all search configurations.
    
    Returns:
        Dictionary containing all search configurations
    """
    return SEARCH_CONFIG
