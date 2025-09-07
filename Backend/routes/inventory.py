# routes/inventory.py - Inventory CRUD routes.
# Updates lot cost on create/update.

import logging
from flask import Blueprint, request, jsonify, abort
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from models.db import db
from models.inventory import Inventory
from models.lot import Lot
from utils.serialization import serialize_model
from utils.validation import validate_inventory
from utils.helpers import calculate_lot_total_cost
from utils.simple_search import simple_search
from search_config import get_search_config

inventory_bp = Blueprint('inventory', __name__)

@inventory_bp.route('/inventory', methods=['GET', 'POST'])
def inventory():
    if request.method == 'POST':
        data = request.json
        if not data or not validate_inventory(data):
            abort(400, description="Invalid or missing data")
        try:
            new_inventory = Inventory(**data)
            db.session.add(new_inventory)
            db.session.commit()
            lot = Lot.query.get(new_inventory.lot_id)
            if lot:
                lot.total_cost = calculate_lot_total_cost(new_inventory.lot_id)
                db.session.commit()
            logging.info(f"Created Inventory ID {new_inventory.inventory_id}")
            return jsonify({'message': 'Created', 'id': new_inventory.inventory_id}), 201
        except IntegrityError:
            db.session.rollback()
            logging.error("Integrity error creating Inventory")
            abort(400, description="Invalid data")
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error creating Inventory: {e}")
            abort(500, description="Database error")
        # Handle simple search
    search_term = request.args.get('search', '').strip()
    
    # Apply search filter
    query = Inventory.query
    search_config = get_search_config('inventory')
    
    if search_term:
        query = simple_search(Inventory, query, search_term, search_config['searchable_fields'])
    
    inventory_items = query.all()
    
    # Add search metadata to help frontend
    response_data = {
        'inventory': [serialize_model(i) for i in inventory_items],
        'search_info': {
            'search_term': search_term,
            'total_results': len(inventory_items),
            'searchable_fields': search_config['searchable_fields'],
            'description': search_config['description'],
            'placeholder': search_config['placeholder']
        }
    }
    
    return jsonify(response_data)

@inventory_bp.route('/inventory/<int:inventory_id>', methods=['GET', 'PUT', 'DELETE'])
def inventory_detail(inventory_id):
    inventory = Inventory.query.get_or_404(inventory_id)
    if request.method == 'PUT':
        data = request.json
        if not data or not validate_inventory(data, update=True):
            abort(400, description="Invalid or missing data")
        try:
            for key, value in data.items():
                if hasattr(inventory, key):
                    setattr(inventory, key, value)
            db.session.commit()
            lot = Lot.query.get(inventory.lot_id)
            if lot:
                lot.total_cost = calculate_lot_total_cost(inventory.lot_id)
                db.session.commit()
            logging.info(f"Updated Inventory ID {inventory_id}")
            return jsonify({'message': 'Updated'})
        except IntegrityError:
            db.session.rollback()
            logging.error("Integrity error updating Inventory")
            abort(400, description="Invalid data")
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error updating Inventory: {e}")
            abort(500, description="Database error")
    elif request.method == 'DELETE':
        try:
            lot_id = inventory.lot_id
            db.session.delete(inventory)
            db.session.commit()
            lot = Lot.query.get(lot_id)
            if lot:
                lot.total_cost = calculate_lot_total_cost(lot_id)
                db.session.commit()
            logging.info(f"Deleted Inventory ID {inventory_id}")
            return jsonify({'message': 'Deleted'})
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error deleting Inventory: {e}")
            abort(500, description="Database error")
    return jsonify(serialize_model(inventory))