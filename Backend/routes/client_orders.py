# routes/client_orders.py - ClientOrders CRUD routes.

import logging
import os
from datetime import datetime
from flask import Blueprint, request, jsonify, abort, current_app, send_from_directory
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from werkzeug.utils import secure_filename
from models.db import db
from models.client_orders import ClientOrders
from utils.serialization import serialize_model
from utils.validation import validate_client_orders
from utils.simple_search import simple_search
from utils.data_cleaning import clean_table_data
from search_config import get_search_config

client_orders_bp = Blueprint('client_orders', __name__)

# Configure allowed file extensions
from config import Config

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def save_image(file, order_id):
    """Save uploaded image and return the filename"""
    if file and allowed_file(file.filename):
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join(current_app.instance_path, 'uploads', 'client_orders')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate secure filename
        filename = secure_filename(file.filename)
        # Add order_id to make filename unique
        name, ext = os.path.splitext(filename)
        filename = f"{name}_{order_id}{ext}"
        
        filepath = os.path.join(upload_dir, filename)
        file.save(filepath)
        
        # Return relative path for storage in database
        return f"uploads/client_orders/{filename}"
    return None

@client_orders_bp.route('/client_orders', methods=['GET', 'POST'])
def client_orders():
    if request.method == 'POST':
        data = request.json
        if not data or not validate_client_orders(data):
            abort(400, description="Invalid or missing data")
        try:
            # Clean up the data before creating the order
            clean_data = clean_table_data(data, 'client_orders')
            
            new_order = ClientOrders(**clean_data)
            db.session.add(new_order)
            db.session.commit()
            logging.info(f"Created ClientOrder ID {new_order.order_id}")
            
            # Return the created order with its ID for potential immediate image upload
            return jsonify({
                'message': 'Created', 
                'id': new_order.order_id,
                'order': serialize_model(new_order)
            }), 201
        except IntegrityError:
            db.session.rollback()
            logging.error("Integrity error creating ClientOrder")
            abort(400, description="Invalid data")
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error creating ClientOrder: {e}")
            abort(500, description="Database error")
    # Handle simple search
    search_term = request.args.get('search', '').strip()
    
    # Apply search filter
    query = ClientOrders.query
    search_config = get_search_config('client_orders')
    
    if search_term:
        query = simple_search(ClientOrders, query, search_term, search_config['searchable_fields'])
    
    orders = query.all()
    
    # Add search metadata to help frontend
    # Add search metadata to help frontend
    response_data = {
        'orders': [serialize_model(o) for o in orders],
        'search_info': {
            'search_term': search_term,
            'total_results': len(orders),
            'searchable_fields': search_config['searchable_fields'],
            'description': search_config['description'],
            'placeholder': search_config['placeholder']
        }
    }
    
    return jsonify(response_data)

@client_orders_bp.route('/client_orders/<int:order_id>', methods=['GET', 'PUT', 'DELETE'])
def client_order_detail(order_id):
    order = ClientOrders.query.get_or_404(order_id)
    if request.method == 'PUT':
        # Check if this is a multipart form data request (image upload)
        if request.content_type and 'multipart/form-data' in request.content_type:
            try:
                # Handle image upload
                if 'design_image' in request.files:
                    file = request.files['design_image']
                    if file and file.filename:
                        # Delete old image if it exists
                        if order.design_image:
                            old_file_path = os.path.join(current_app.instance_path, order.design_image)
                            if os.path.exists(old_file_path):
                                os.remove(old_file_path)
                        
                        # Save new image
                        image_path = save_image(file, order_id)
                        if image_path:
                            order.design_image = image_path
                            db.session.commit()
                            logging.info(f"Updated image for ClientOrder ID {order_id}")
                            return jsonify({'message': 'Image updated', 'design_image': image_path})
                        else:
                            abort(400, description="Invalid file type")
                    else:
                        abort(400, description="No file provided")
                else:
                    abort(400, description="No image file in request")
            except Exception as e:
                db.session.rollback()
                logging.error(f"Error updating image for ClientOrder ID {order_id}: {e}")
                abort(500, description="Failed to update image")
        else:
            # Handle regular JSON update
            data = request.json
            if not data or not validate_client_orders(data, update=True):
                abort(400, description="Invalid or missing data")
            try:
                # Clean and convert data before updating
                logging.info(f"Raw update data received: {data}")
                clean_data = clean_table_data(data, 'client_orders')
                
                # Update the order with cleaned data
                for key, value in clean_data.items():
                    if hasattr(order, key):
                        setattr(order, key, value)
                
                db.session.commit()
                logging.info(f"Updated ClientOrder ID {order_id}")
                return jsonify({'message': 'Updated'})
            except IntegrityError:
                db.session.rollback()
                logging.error("Integrity error updating ClientOrder")
                abort(400, description="Invalid data")
            except SQLAlchemyError as e:
                db.session.rollback()
                logging.error(f"DB error updating ClientOrder: {e}")
                abort(500, description="Database error")
    elif request.method == 'DELETE':
        try:
            # Delete associated image file if it exists
            if order.design_image:
                image_path = os.path.join(current_app.instance_path, order.design_image)
                if os.path.exists(image_path):
                    os.remove(image_path)
            
            db.session.delete(order)
            db.session.commit()
            logging.info(f"Deleted ClientOrder ID {order_id}")
            return jsonify({'message': 'Deleted'})
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error deleting ClientOrder: {e}")
            abort(500, description="Database error")
    return jsonify(serialize_model(order))

@client_orders_bp.route('/client_orders/<int:order_id>/image', methods=['POST'])
def upload_order_image(order_id):
    """Dedicated endpoint for uploading order images"""
    order = ClientOrders.query.get_or_404(order_id)
    
    if 'design_image' not in request.files:
        abort(400, description="No image file provided")
    
    file = request.files['design_image']
    if file.filename == '':
        abort(400, description="No file selected")
    
    try:
        # Delete old image if it exists
        if order.design_image:
            old_file_path = os.path.join(current_app.instance_path, order.design_image)
            if os.path.exists(old_file_path):
                os.remove(old_file_path)
        
        # Save new image
        image_path = save_image(file, order_id)
        if image_path:
            order.design_image = image_path
            db.session.commit()
            logging.info(f"Uploaded image for ClientOrder ID {order_id}")
            return jsonify({
                'message': 'Image uploaded successfully',
                'design_image': image_path
            })
        else:
            abort(400, description="Invalid file type. Allowed: " + ", ".join(Config.ALLOWED_EXTENSIONS))
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error uploading image for ClientOrder ID {order_id}: {e}")
        abort(500, description="Failed to upload image")

@client_orders_bp.route('/uploads/<path:filename>')
def serve_upload(filename):
    """Serve uploaded files"""
    try:
        upload_dir = os.path.join(current_app.instance_path, 'uploads')
        return send_from_directory(upload_dir, filename)
    except Exception as e:
        logging.error(f"Error serving file {filename}: {e}")
        abort(404, description="File not found")