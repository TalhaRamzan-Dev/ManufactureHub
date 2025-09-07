# routes/day_book.py - DayBook CRUD routes.
# Automates running balance.

import logging
from flask import Blueprint, request, jsonify, abort
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from models.db import db
from models.day_book import DayBook
from utils.serialization import serialize_model
from utils.validation import validate_day_book
from utils.helpers import update_daybook_balance
from utils.simple_search import simple_search
from search_config import get_search_config

day_book_bp = Blueprint('day_book', __name__)

@day_book_bp.route('/day_book', methods=['GET', 'POST'])
def day_book():
    if request.method == 'POST':
        data = request.json
        if not data or not validate_day_book(data):
            abort(400, description="Invalid or missing data")
        try:
            new_transaction = DayBook(**data)
            db.session.add(new_transaction)
            db.session.commit()
            update_daybook_balance(new_transaction.transaction_id)
            logging.info(f"Created DayBook ID {new_transaction.transaction_id}")
            return jsonify({'message': 'Created', 'id': new_transaction.transaction_id}), 201
        except IntegrityError:
            db.session.rollback()
            logging.error("Integrity error creating DayBook")
            abort(400, description="Invalid data")
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error creating DayBook: {e}")
            abort(500, description="Database error")
        # Handle simple search
    search_term = request.args.get('search', '').strip()
    
    # Apply search filter
    query = DayBook.query
    search_config = get_search_config('day_book')
    
    if search_term:
        query = simple_search(DayBook, query, search_term, search_config['searchable_fields'])
    
    transactions = query.all()
    
    # Add search metadata to help frontend
    response_data = {
        'transactions': [serialize_model(t) for t in transactions],
        'search_info': {
            'search_term': search_term,
            'total_results': len(transactions),
            'searchable_fields': search_config['searchable_fields'],
            'description': search_config['description'],
            'placeholder': search_config['placeholder']
        }
    }
    
    return jsonify(response_data)

@day_book_bp.route('/day_book/<int:transaction_id>', methods=['GET', 'PUT', 'DELETE'])
def day_book_detail(transaction_id):
    transaction = DayBook.query.get_or_404(transaction_id)
    if request.method == 'PUT':
        data = request.json
        if not data or not validate_day_book(data, update=True):
            abort(400, description="Invalid or missing data")
        try:
            for key, value in data.items():
                if hasattr(transaction, key):
                    setattr(transaction, key, value)
            db.session.commit()
            update_daybook_balance(transaction_id)
            logging.info(f"Updated DayBook ID {transaction_id}")
            return jsonify({'message': 'Updated'})
        except IntegrityError:
            db.session.rollback()
            logging.error("Integrity error updating DayBook")
            abort(400, description="Invalid data")
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error updating DayBook: {e}")
            abort(500, description="Database error")
    elif request.method == 'DELETE':
        try:
            db.session.delete(transaction)
            db.session.commit()
            logging.info(f"Deleted DayBook ID {transaction_id}")
            return jsonify({'message': 'Deleted'})
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error deleting DayBook: {e}")
            abort(500, description="Database error")
    return jsonify(serialize_model(transaction))