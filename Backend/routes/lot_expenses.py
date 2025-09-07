# routes/lot_expenses.py - LotExpenses CRUD routes.
# Updates lot cost on create/update.

import logging
from flask import Blueprint, request, jsonify, abort
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from models.db import db
from models.lot_expenses import LotExpenses
from models.lot import Lot
from utils.serialization import serialize_model
from utils.validation import validate_lot_expenses
from utils.helpers import calculate_lot_total_cost
from utils.simple_search import simple_search
from search_config import get_search_config

lot_expenses_bp = Blueprint('lot_expenses', __name__)

@lot_expenses_bp.route('/lot_expenses', methods=['GET', 'POST'])
def lot_expenses():
    if request.method == 'POST':
        data = request.json
        if not data or not validate_lot_expenses(data):
            abort(400, description="Invalid or missing data")
        try:
            new_expense = LotExpenses(**data)
            db.session.add(new_expense)
            db.session.commit()
            lot = Lot.query.get(new_expense.lot_id)
            if lot:
                lot.total_cost = calculate_lot_total_cost(new_expense.lot_id)
                db.session.commit()
            logging.info(f"Created LotExpense ID {new_expense.expense_id}")
            return jsonify({'message': 'Created', 'id': new_expense.expense_id}), 201
        except IntegrityError:
            db.session.rollback()
            logging.error("Integrity error creating LotExpense")
            abort(400, description="Invalid data")
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error creating LotExpense: {e}")
            abort(500, description="Database error")
        # Handle simple search
    search_term = request.args.get('search', '').strip()
    
    # Apply search filter
    query = LotExpenses.query
    search_config = get_search_config('lot_expenses')
    
    if search_term:
        query = simple_search(LotExpenses, query, search_term, search_config['searchable_fields'])
    
    expenses = query.all()
    
    # Add search metadata to help frontend
    response_data = {
        'expenses': [serialize_model(e) for e in expenses],
        'search_info': {
            'search_term': search_term,
            'total_results': len(expenses),
            'searchable_fields': search_config['searchable_fields'],
            'description': search_config['description'],
            'placeholder': search_config['placeholder']
        }
    }
    
    return jsonify(response_data)

@lot_expenses_bp.route('/lot_expenses/<int:expense_id>', methods=['GET', 'PUT', 'DELETE'])
def lot_expense_detail(expense_id):
    expense = LotExpenses.query.get_or_404(expense_id)
    if request.method == 'PUT':
        data = request.json
        if not data or not validate_lot_expenses(data, update=True):
            abort(400, description="Invalid or missing data")
        try:
            for key, value in data.items():
                if hasattr(expense, key):
                    setattr(expense, key, value)
            db.session.commit()
            lot = Lot.query.get(expense.lot_id)
            if lot:
                lot.total_cost = calculate_lot_total_cost(expense.lot_id)
                db.session.commit()
            logging.info(f"Updated LotExpense ID {expense_id}")
            return jsonify({'message': 'Updated'})
        except IntegrityError:
            db.session.rollback()
            logging.error("Integrity error updating LotExpense")
            abort(400, description="Invalid data")
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error updating LotExpense: {e}")
            abort(500, description="Database error")
    elif request.method == 'DELETE':
        try:
            lot_id = expense.lot_id
            db.session.delete(expense)
            db.session.commit()
            lot = Lot.query.get(lot_id)
            if lot:
                lot.total_cost = calculate_lot_total_cost(lot_id)
                db.session.commit()
            logging.info(f"Deleted LotExpense ID {expense_id}")
            return jsonify({'message': 'Deleted'})
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error deleting LotExpense: {e}")
            abort(500, description="Database error")
    return jsonify(serialize_model(expense))