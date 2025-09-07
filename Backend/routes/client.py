# routes/client.py - Client CRUD routes.

import logging
from flask import Blueprint, request, jsonify, abort
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from models.db import db
from models.client import Client
from utils.serialization import serialize_model
from utils.validation import validate_client
from utils.simple_search import simple_search
from utils.data_cleaning import clean_table_data
from search_config import get_search_config

client_bp = Blueprint('client', __name__)

@client_bp.route('/clients', methods=['GET', 'POST'])
def clients():
    if request.method == 'POST':
        data = request.json
        logging.info(f"Received client creation data: {data}")
        
        if not data:
            logging.error("No data received")
            abort(400, description="No data received")
            
        if not validate_client(data):
            logging.error(f"Validation failed for data: {data}")
            abort(400, description="Invalid or missing data. Required: name. Email is optional.")
            
        try:
            # Clean the data before creating the client
            clean_data = clean_table_data(data, 'clients')
            new_client = Client(**clean_data)
            db.session.add(new_client)
            db.session.commit()
            logging.info(f"Created Client ID {new_client.client_id}")
            return jsonify({'message': 'Created', 'id': new_client.client_id}), 201
        except IntegrityError as e:
            db.session.rollback()
            logging.error(f"Integrity error creating Client: {e}")
            if "UNIQUE constraint failed" in str(e):
                abort(400, description="Email address already exists")
            else:
                abort(400, description="Data integrity error")
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error creating Client: {e}")
            abort(500, description="Database error")
    
    # Handle simple search
    search_term = request.args.get('search', '').strip()
    
    # Apply search filter
    query = Client.query
    search_config = get_search_config('client')
    
    if search_term:
        query = simple_search(Client, query, search_term, search_config['searchable_fields'])
    
    clients = query.all()
    
    # Add search metadata to help frontend
    response_data = {
        'clients': [serialize_model(c) for c in clients],
        'search_info': {
            'search_term': search_term,
            'total_results': len(clients),
            'searchable_fields': search_config['searchable_fields'],
            'description': search_config['description'],
            'placeholder': search_config['placeholder']
        }
    }
    
    return jsonify(response_data)

@client_bp.route('/clients/<int:client_id>', methods=['GET', 'PUT', 'DELETE'])
def client_detail(client_id):
    client = Client.query.get_or_404(client_id)
    if request.method == 'PUT':
        data = request.json
        if not data or not validate_client(data, update=True):
            abort(400, description="Invalid or missing data")
        try:
            # Clean the data before updating the client
            clean_data = clean_table_data(data, 'clients')
            
            # Filter out fields that shouldn't be updated
            updatable_fields = ['name', 'business_name', 'phone_number', 'shop_address', 'email']
            
            for key, value in clean_data.items():
                if key in updatable_fields and hasattr(client, key):
                    setattr(client, key, value)
            
            # Set updated_at to current datetime
            from datetime import datetime
            client.updated_at = datetime.utcnow()
            
            db.session.commit()
            logging.info(f"Updated Client ID {client_id}")
            return jsonify({'message': 'Updated'})
        except IntegrityError:
            db.session.rollback()
            logging.error("Integrity error updating Client")
            abort(400, description="Duplicate email or invalid data")
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error updating Client: {e}")
            abort(500, description="Database error")
    elif request.method == 'DELETE':
        try:
            db.session.delete(client)
            db.session.commit()
            logging.info(f"Deleted Client ID {client_id}")
            return jsonify({'message': 'Deleted'})
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error deleting Client: {e}")
            abort(500, description="Database error")
    return jsonify(serialize_model(client))