# routes/worker.py - Worker CRUD routes.

import logging
from flask import Blueprint, request, jsonify, abort
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from models.db import db
from models.worker import Worker
from utils.serialization import serialize_model
from utils.validation import validate_worker
from utils.simple_search import simple_search
from utils.data_cleaning import clean_table_data
from search_config import get_search_config

worker_bp = Blueprint('worker', __name__)

@worker_bp.route('/workers', methods=['GET', 'POST'])
def workers():
    if request.method == 'POST':
        data = request.json
        if not data or not validate_worker(data):
            abort(400, description="Invalid or missing data")
        try:
            # Clean the data before creating the worker
            clean_data = clean_table_data(data, 'workers')
            new_worker = Worker(**clean_data)
            db.session.add(new_worker)
            db.session.commit()
            logging.info(f"Created Worker ID {new_worker.worker_id}")
            return jsonify({'message': 'Created', 'id': new_worker.worker_id}), 201
        except IntegrityError:
            db.session.rollback()
            logging.error("Integrity error creating Worker")
            abort(400, description="Invalid data")
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error creating Worker: {e}")
            abort(500, description="Database error")
        # Handle simple search
    search_term = request.args.get('search', '').strip()
    
    # Apply search filter
    query = Worker.query
    search_config = get_search_config('worker')
    
    if search_term:
        query = simple_search(Worker, query, search_term, search_config['searchable_fields'])
    
    workers = query.all()
    
    # Add search metadata to help frontend
    response_data = {
        'workers': [serialize_model(w) for w in workers],
        'search_info': {
            'search_term': search_term,
            'total_results': len(workers),
            'searchable_fields': search_config['searchable_fields'],
            'description': search_config['description'],
            'placeholder': search_config['placeholder']
        }
    }
    
    return jsonify(response_data)

@worker_bp.route('/workers/<int:worker_id>', methods=['GET', 'PUT', 'DELETE'])
def worker_detail(worker_id):
    worker = Worker.query.get_or_404(worker_id)
    if request.method == 'PUT':
        data = request.json
        if not data or not validate_worker(data, update=True):
            abort(400, description="Invalid or missing data")
        try:
            # Clean the data before updating the worker
            clean_data = clean_table_data(data, 'workers')
            for key, value in clean_data.items():
                if hasattr(worker, key):
                    setattr(worker, key, value)
            db.session.commit()
            logging.info(f"Updated Worker ID {worker_id}")
            return jsonify({'message': 'Updated'})
        except IntegrityError:
            db.session.rollback()
            logging.error("Integrity error updating Worker")
            abort(400, description="Invalid data")
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error updating Worker: {e}")
            abort(500, description="Database error")
    elif request.method == 'DELETE':
        try:
            db.session.delete(worker)
            db.session.commit()
            logging.info(f"Deleted Worker ID {worker_id}")
            return jsonify({'message': 'Deleted'})
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error deleting Worker: {e}")
            abort(500, description="Database error")
    return jsonify(serialize_model(worker))