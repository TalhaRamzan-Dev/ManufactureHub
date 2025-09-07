# routes/lot_worker.py - LotWorker CRUD routes.
# Automates rate_per_hour and lot progress.

import logging
from flask import Blueprint, request, jsonify, abort
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from models.db import db
from models.lot_worker import LotWorker
from utils.serialization import serialize_model
from utils.validation import validate_lot_worker
from utils.helpers import auto_set_worker_rate, update_lot_progress
from utils.simple_search import simple_search
from search_config import get_search_config

lot_worker_bp = Blueprint('lot_worker', __name__)

@lot_worker_bp.route('/lot_workers', methods=['GET', 'POST'])
def lot_workers():
    if request.method == 'POST':
        data = request.json
        if not data or not validate_lot_worker(data):
            abort(400, description="Invalid or missing data")
        try:
            new_lot_worker = LotWorker(**data)
            db.session.add(new_lot_worker)
            auto_set_worker_rate(data.get('worker_id'), new_lot_worker)
            db.session.commit()
            update_lot_progress(new_lot_worker.lot_id)
            logging.info(f"Created LotWorker ID {new_lot_worker.lot_worker_id}")
            return jsonify({'message': 'Created', 'id': new_lot_worker.lot_worker_id}), 201
        except IntegrityError:
            db.session.rollback()
            logging.error("Integrity error creating LotWorker")
            abort(400, description="Invalid data")
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error creating LotWorker: {e}")
            abort(500, description="Database error")
        # Handle simple search
    search_term = request.args.get('search', '').strip()
    
    # Apply search filter
    query = LotWorker.query
    search_config = get_search_config('lot_worker')
    
    if search_term:
        query = simple_search(LotWorker, query, search_term, search_config['searchable_fields'])
    
    lot_workers = query.all()
    
    # Add search metadata to help frontend
    response_data = {
        'lot_workers': [serialize_model(lw) for lw in lot_workers],
        'search_info': {
            'search_term': search_term,
            'total_results': len(lot_workers),
            'searchable_fields': search_config['searchable_fields'],
            'description': search_config['description'],
            'placeholder': search_config['placeholder']
        }
    }
    
    return jsonify(response_data)

@lot_worker_bp.route('/lot_workers/<int:lot_worker_id>', methods=['GET', 'PUT', 'DELETE'])
def lot_worker_detail(lot_worker_id):
    lot_worker = LotWorker.query.get_or_404(lot_worker_id)
    if request.method == 'PUT':
        data = request.json
        if not data or not validate_lot_worker(data, update=True):
            abort(400, description="Invalid or missing data")
        try:
            for key, value in data.items():
                if hasattr(lot_worker, key):
                    setattr(lot_worker, key, value)
            auto_set_worker_rate(data.get('worker_id', lot_worker.worker_id), lot_worker)
            db.session.commit()
            update_lot_progress(lot_worker.lot_id)
            logging.info(f"Updated LotWorker ID {lot_worker_id}")
            return jsonify({'message': 'Updated'})
        except IntegrityError:
            db.session.rollback()
            logging.error("Integrity error updating LotWorker")
            abort(400, description="Invalid data")
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error updating LotWorker: {e}")
            abort(500, description="Database error")
    elif request.method == 'DELETE':
        try:
            lot_id = lot_worker.lot_id
            db.session.delete(lot_worker)
            db.session.commit()
            update_lot_progress(lot_id)
            logging.info(f"Deleted LotWorker ID {lot_worker_id}")
            return jsonify({'message': 'Deleted'})
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error deleting LotWorker: {e}")
            abort(500, description="Database error")
    return jsonify(serialize_model(lot_worker))