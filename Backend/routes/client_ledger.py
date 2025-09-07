# routes/client_ledger.py - ClientLedger CRUD routes.
# Automates invoice, balance, and status.

import logging
from flask import Blueprint, request, jsonify, abort, make_response
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from fpdf import FPDF
from models.db import db
from models.client_ledger import ClientLedger
from models.lot import Lot
from models.client import Client
from utils.serialization import serialize_model
from utils.validation import validate_client_ledger
from utils.helpers import generate_invoice_number
from utils.simple_search import simple_search
from search_config import get_search_config
from utils.helpers import update_ledger_balance

client_ledger_bp = Blueprint('client_ledger', __name__)

@client_ledger_bp.route('/client_ledger', methods=['GET', 'POST'])
def client_ledger():
    if request.method == 'POST':
        data = request.json
        if not data or not validate_client_ledger(data):
            abort(400, description="Invalid or missing data")
        try:
            new_ledger = ClientLedger(**data)
            new_ledger.invoice_number = generate_invoice_number(data.get('lot_id'))
            db.session.add(new_ledger)
            db.session.commit()
            update_ledger_balance(new_ledger.payment_id)
            logging.info(f"Created ClientLedger ID {new_ledger.payment_id}")
            return jsonify({'message': 'Created', 'id': new_ledger.payment_id}), 201
        except IntegrityError:
            db.session.rollback()
            logging.error("Integrity error creating ClientLedger")
            abort(400, description="Invalid data")
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error creating ClientLedger: {e}")
            abort(500, description="Database error")
    
    # Handle simple search
    search_term = request.args.get('search', '').strip()
    
    # Apply search filter
    query = ClientLedger.query
    search_config = get_search_config('client_ledger')
    
    if search_term:
        query = simple_search(ClientLedger, query, search_term, search_config['searchable_fields'])
    
    ledger_entries = query.all()
    
    # Add search metadata to help frontend
    response_data = {
        'ledger_entries': [serialize_model(l) for l in ledger_entries],
        'search_info': {
            'search_term': search_term,
            'total_results': len(ledger_entries),
            'searchable_fields': search_config['searchable_fields'],
            'description': search_config['description'],
            'placeholder': search_config['placeholder']
        }
    }
    
    return jsonify(response_data)

@client_ledger_bp.route('/client_ledger/<int:payment_id>', methods=['GET', 'PUT', 'DELETE'])
def client_ledger_detail(payment_id):
    ledger = ClientLedger.query.get_or_404(payment_id)
    if request.method == 'PUT':
        data = request.json
        if not data or not validate_client_ledger(data, update=True):
            abort(400, description="Invalid or missing data")
        try:
            for key, value in data.items():
                if hasattr(ledger, key):
                    setattr(ledger, key, value)
            db.session.commit()
            update_ledger_balance(payment_id)
            logging.info(f"Updated ClientLedger ID {payment_id}")
            return jsonify({'message': 'Updated'})
        except IntegrityError:
            db.session.rollback()
            logging.error("Integrity error updating ClientLedger")
            abort(400, description="Invalid data")
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error updating ClientLedger: {e}")
            abort(500, description="Database error")
    elif request.method == 'DELETE':
        try:
            db.session.delete(ledger)
            db.session.commit()
            logging.info(f"Deleted ClientLedger ID {payment_id}")
            return jsonify({'message': 'Deleted'})
        except SQLAlchemyError as e:
            db.session.rollback()
            logging.error(f"DB error deleting ClientLedger: {e}")
            abort(500, description="Database error")
    return jsonify(serialize_model(ledger))

@client_ledger_bp.route('/client_ledger/<int:payment_id>/pdf', methods=['GET'])
def client_ledger_pdf(payment_id):
    try:
        ledger = ClientLedger.query.get_or_404(payment_id)
        lot = Lot.query.get(ledger.lot_id)
        client = Client.query.get(ledger.client_id)
        
        if not lot:
            abort(404, description="Lot not found")
        if not client:
            abort(404, description="Client not found")

        # Create PDF with better error handling
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)

        # Title
        pdf.cell(200, 10, txt="Client Ledger Invoice", ln=1, align='C')
        pdf.ln(5)

        # Company Header
        pdf.set_font("Arial", 'B', size=14)
        pdf.cell(200, 10, txt="SHANKH DASHBOARD", ln=1, align='C')
        pdf.ln(5)

        # Invoice Details
        pdf.set_font("Arial", 'B', size=12)
        pdf.cell(200, 10, txt=f"Invoice Number: {ledger.invoice_number or 'N/A'}", ln=1)
        pdf.cell(200, 10, txt=f"Payment Date: {ledger.payment_date or 'N/A'}", ln=1)
        pdf.ln(5)

        # Client Information
        pdf.set_font("Arial", 'B', size=12)
        pdf.cell(200, 10, txt="Client Information:", ln=1)
        pdf.set_font("Arial", size=10)
        pdf.cell(200, 8, txt=f"Name: {client.name or 'N/A'}", ln=1)
        pdf.cell(200, 8, txt=f"Business: {client.business_name or 'N/A'}", ln=1)
        pdf.cell(200, 8, txt=f"Phone: {client.phone_number or 'N/A'}", ln=1)
        pdf.cell(200, 8, txt=f"Email: {client.email or 'N/A'}", ln=1)
        pdf.ln(5)

        # Lot Information
        pdf.set_font("Arial", 'B', size=12)
        pdf.cell(200, 10, txt="Lot Information:", ln=1)
        pdf.set_font("Arial", size=10)
        pdf.cell(200, 8, txt=f"Lot ID: {lot.lot_id or 'N/A'}", ln=1)
        pdf.cell(200, 8, txt=f"Order ID: {lot.order_id or 'N/A'}", ln=1)
        pdf.ln(5)

        # Payment Details
        pdf.set_font("Arial", 'B', size=12)
        pdf.cell(200, 10, txt="Payment Details:", ln=1)
        pdf.set_font("Arial", size=10)
        
        # Create a table for payment details
        pdf.set_fill_color(240, 240, 240)
        pdf.cell(95, 8, "Field", border=1, fill=True)
        pdf.cell(95, 8, "Value", border=1, fill=True)
        pdf.ln()
        
        pdf.cell(95, 8, "Amount Paid", border=1)
        pdf.cell(95, 8, f"Rs. {ledger.amount_paid or 0}", border=1)
        pdf.ln()
        
        pdf.cell(95, 8, "Total Due", border=1)
        pdf.cell(95, 8, f"Rs. {ledger.total_due or 0}", border=1)
        pdf.ln()
        
        pdf.cell(95, 8, "Balance Remaining", border=1)
        pdf.cell(95, 8, f"Rs. {ledger.balance_remaining or 0}", border=1)
        pdf.ln()
        
        pdf.cell(95, 8, "Payment Status", border=1)
        pdf.cell(95, 8, f"{ledger.payment_status or 'Pending'}", border=1)
        pdf.ln()
        
        pdf.cell(95, 8, "Payment Method", border=1)
        pdf.cell(95, 8, f"{ledger.payment_method or 'N/A'}", border=1)
        pdf.ln()
        
        if ledger.notes:
            pdf.cell(95, 8, "Notes", border=1)
            pdf.cell(95, 8, f"{ledger.notes}", border=1)
            pdf.ln()

        pdf.ln(5)
        
        # Timestamps
        pdf.set_font("Arial", size=8)
        pdf.cell(200, 6, txt=f"Created: {ledger.created_at or 'N/A'}", ln=1)
        pdf.cell(200, 6, txt=f"Updated: {ledger.updated_at or 'N/A'}", ln=1)

        # Generate PDF data
        try:
            pdf_data = pdf.output(dest='S')
            # FPDF output(dest='S') returns a bytearray, no need to encode again
            if isinstance(pdf_data, bytearray):
                pdf_data = bytes(pdf_data)
            elif isinstance(pdf_data, str):
                pdf_data = pdf_data.encode('latin-1')
            elif isinstance(pdf_data, bytes):
                pdf_data = pdf_data
            else:
                # Fallback: convert to string and encode
                pdf_data = str(pdf_data).encode('latin-1')
        except Exception as e:
            logging.error(f"PDF generation error: {e}")
            # Fallback to string output
            pdf_data = str(pdf.output(dest='S')).encode('latin-1')

        response = make_response(pdf_data)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=ledger_{payment_id}.pdf'
        
        logging.info(f"Successfully generated PDF for ClientLedger ID {payment_id}")
        return response
        
    except Exception as e:
        logging.error(f"Error generating PDF for ClientLedger ID {payment_id}: {e}")
        abort(500, description=f"Failed to generate PDF: {str(e)}")