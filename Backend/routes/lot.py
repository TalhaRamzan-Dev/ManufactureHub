# routes/lot.py - Lot CRUD routes.
# Includes automation for total_cost and progress_percent.

import logging
from flask import Blueprint, request, jsonify, abort
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from models.db import db
from models.lot import Lot
from utils.serialization import serialize_model
from utils.validation import validate_lot
from utils.helpers import calculate_lot_total_cost, update_lot_progress
from utils.simple_search import simple_search
from utils.data_cleaning import clean_table_data
from search_config import get_search_config

lot_bp = Blueprint('lot', __name__)

@lot_bp.route('/lots', methods=['GET', 'POST'])
def lots():
    if request.method == 'POST':
        data = request.json
        if not data or not validate_lot(data):
            abort(400, description="Invalid or missing data")
        try:
            # Clean the data before creating the lot
            clean_data = clean_table_data(data, 'lots')
            new_lot = Lot(**clean_data)
            db.session.add(new_lot)
            db.session.commit()
            new_lot.total_cost = calculate_lot_total_cost(new_lot.lot_id)
            update_lot_progress(new_lot.lot_id)
            db.session.commit()
            logging.info(f"Created Lot ID {new_lot.lot_id}")
            return jsonify({'message': 'Created', 'id': new_lot.lot_id}), 201
        except IntegrityError:
            db.session.rollback()
            logging.error("Integrity error creating Lot")
            abort(400, description="Invalid data")
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error creating Lot: {e}")
            abort(500, description="Database error")
        # Handle simple search
    search_term = request.args.get('search', '').strip()
    
    # Apply search filter
    query = Lot.query
    search_config = get_search_config('lot')
    
    if search_term:
        query = simple_search(Lot, query, search_term, search_config['searchable_fields'])
    
    lots = query.all()
    
    # Add search metadata to help frontend
    response_data = {
        'lots': [serialize_model(l) for l in lots],
        'search_info': {
            'search_term': search_term,
            'total_results': len(lots),
            'searchable_fields': search_config['searchable_fields'],
            'description': search_config['description'],
            'placeholder': search_config['placeholder']
        }
    }
    
    return jsonify(response_data)

@lot_bp.route('/lots/<int:lot_id>', methods=['GET', 'PUT', 'DELETE'])
def lot_detail(lot_id):
    lot = Lot.query.get_or_404(lot_id)
    if request.method == 'PUT':
        data = request.json
        if not data or not validate_lot(data, update=True):
            abort(400, description="Invalid or missing data")
        try:
            # Clean the data before updating the lot
            clean_data = clean_table_data(data, 'lots')
            for key, value in clean_data.items():
                if hasattr(lot, key):
                    setattr(lot, key, value)
            lot.total_cost = calculate_lot_total_cost(lot_id)
            update_lot_progress(lot_id)
            db.session.commit()
            logging.info(f"Updated Lot ID {lot_id}")
            return jsonify({'message': 'Updated'})
        except IntegrityError:
            db.session.rollback()
            logging.error("Integrity error updating Lot")
            abort(400, description="Invalid data")
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error updating Lot: {e}")
            abort(500, description="Database error")
    elif request.method == 'DELETE':
        try:
            db.session.delete(lot)
            db.session.commit()
            logging.info(f"Deleted Lot ID {lot_id}")
            return jsonify({'message': 'Deleted'})
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error deleting Lot: {e}")
            abort(500, description="Database error")
    return jsonify(serialize_model(lot))