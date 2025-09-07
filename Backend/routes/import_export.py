# routes/import_export.py - Routes for CSV import/export.

import logging
from flask import Blueprint, jsonify, request, make_response, abort
from io import StringIO
import csv
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from models.db import db
from models.client import Client
from models.client_orders import ClientOrders
from models.lot import Lot
from models.worker import Worker
from models.lot_worker import LotWorker
from models.inventory import Inventory
from models.lot_expenses import LotExpenses
from models.client_ledger import ClientLedger
from models.day_book import DayBook
from utils.serialization import serialize_model
from utils.helpers import update_lot_progress, calculate_lot_total_cost, update_ledger_balance, update_daybook_balance, auto_set_worker_rate, generate_invoice_number

import_export_bp = Blueprint('import_export', __name__)

models = {
    'client': Client,
    'client_orders': ClientOrders,
    'lot': Lot,
    'worker': Worker,
    'lot_worker': LotWorker,
    'inventory': Inventory,
    'lot_expenses': LotExpenses,
    'client_ledger': ClientLedger,
    'day_book': DayBook,
}

@import_export_bp.route('/export/<string:table>', methods=['GET'])
def export_csv(table):
    if table not in models:
        abort(400, description="Invalid table name")
    model = models[table]
    items = model.query.all()
    output = StringIO()
    writer = csv.writer(output)
    fields = [column.key for column in model.__table__.columns if column.key not in ['created_at', 'updated_at']]
    writer.writerow(fields)
    for item in items:
        row = [getattr(item, field) for field in fields]
        writer.writerow(row)
    response = make_response(output.getvalue())
    response.headers['Content-Type'] = 'text/csv'
    response.headers['Content-Disposition'] = f'attachment; filename={table}.csv'
    logging.info(f"Exported CSV for table {table}")
    return response

@import_export_bp.route('/import/<string:table>', methods=['POST'])
def import_csv(table):
    if table not in models:
        abort(400, description="Invalid table name")
    model = models[table]
    if 'file' not in request.files:
        abort(400, description="No file part")
    file = request.files['file']
    if file.filename == '':
        abort(400, description="No selected file")
    if not file.filename.endswith('.csv'):
        abort(400, description="Invalid file type; CSV required")
    try:
        input = StringIO(file.stream.read().decode('utf-8'))
        reader = csv.DictReader(input)
        for row in reader:
            row.pop('created_at', None)
            row.pop('updated_at', None)
            row.pop(model.__table__.primary_key.columns.keys()[0], None)
            new_item = model(**row)
            db.session.add(new_item)
            db.session.commit()
            if table == 'lot_worker':
                auto_set_worker_rate(row.get('worker_id'), new_item)
                update_lot_progress(new_item.lot_id)
            elif table in ['inventory', 'lot_expenses']:
                lot = Lot.query.get(row.get('lot_id'))
                if lot:
                    lot.total_cost = calculate_lot_total_cost(row.get('lot_id'))
                    db.session.commit()
            elif table == 'client_ledger':
                new_item.invoice_number = generate_invoice_number(row.get('lot_id'))
                update_ledger_balance(new_item.payment_id)
            elif table == 'day_book':
                update_daybook_balance(new_item.transaction_id)
        logging.info(f"Imported CSV for table {table}")
        return jsonify({'message': 'Imported successfully'})
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error importing CSV for {table}: {e}")
        abort(500, description="Import error")
