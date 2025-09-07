# routes/lookups.py - Routes for fetching lookup view data.
# Used for UI dropdowns (e.g., readable client names).

import logging
from flask import Blueprint, jsonify, abort
from utils.helpers import get_lookup_data

lookups_bp = Blueprint('lookups', __name__)

@lookups_bp.route('/lookups/<string:view>', methods=['GET'])
def lookups(view):
    # Whitelist views to prevent SQL injection.
    allowed_views = ['client_lookup_view', 'order_lookup_view', 'lot_lookup_view', 'worker_lookup_view']
    if view not in allowed_views:
        logging.error(f"Invalid view requested: {view}")
        abort(400, description="Invalid view name")
    data = get_lookup_data(view)
    return jsonify(data)