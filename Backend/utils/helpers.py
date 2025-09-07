# utils/helpers.py - Automation and calculation functions.

import logging
from sqlalchemy.sql import func, case
from sqlalchemy import func, text
from sqlalchemy.exc import SQLAlchemyError
from models.db import db
from models.lot import Lot
from models.client_orders import ClientOrders
from models.inventory import Inventory
from models.lot_worker import LotWorker
from models.lot_expenses import LotExpenses
from models.worker import Worker
from models.client_ledger import ClientLedger
from models.day_book import DayBook
import datetime

def get_lookup_data(view_name):
    try:
        result = db.session.execute(text(f"SELECT * FROM {view_name}")).fetchall()
        return [dict(row) for row in result]
    except SQLAlchemyError as e:
        logging.error(f"Error fetching lookup data from {view_name}: {e}")
        return []

def calculate_lot_total_cost(lot_id):
    try:
        inventory_cost = db.session.query(func.sum(Inventory.quantity_used * Inventory.unit_cost)).filter_by(lot_id=lot_id).scalar() or 0
        worker_cost = db.session.query(func.sum(LotWorker.hours_worked * LotWorker.rate_per_hour)).filter_by(lot_id=lot_id).scalar() or 0
        expense_cost = db.session.query(func.sum(LotExpenses.amount)).filter_by(lot_id=lot_id).scalar() or 0
        total = inventory_cost + worker_cost + expense_cost
        logging.info(f"Calculated total_cost for lot {lot_id}: {total}")
        return total
    except SQLAlchemyError as e:
        logging.error(f"Error calculating lot total cost: {e}")
        return 0

def update_lot_progress(lot_id):
    try:
        lot = Lot.query.get(lot_id)
        if not lot:
            logging.warning(f"Lot {lot_id} not found for progress update")
            return
        total_units = ClientOrders.query.get(lot.order_id).num_units if lot.order_id else 0
        produced = db.session.query(func.sum(LotWorker.units_produced)).filter_by(lot_id=lot_id).scalar() or 0
        progress = int((produced / total_units * 100) if total_units > 0 else 0)
        lot.progress_percent = progress
        db.session.commit()
        logging.info(f"Updated progress for lot {lot_id}: {progress}%")
    except SQLAlchemyError as e:
        logging.error(f"Error updating lot progress: {e}")

def generate_invoice_number(lot_id):
    year = datetime.datetime.now().year
    invoice = f"INV-{lot_id}-{year}"
    if ClientLedger.query.filter_by(invoice_number=invoice).first():
        logging.warning(f"Invoice {invoice} exists; appending timestamp")
        invoice += f"-{int(datetime.datetime.now().timestamp())}"
    return invoice

def auto_set_worker_rate(worker_id, lot_worker):
    try:
        worker = Worker.query.get(worker_id)
        if worker:
            lot_worker.rate_per_hour = worker.rate_per_hour
            logging.info(f"Auto-set rate_per_hour for worker {worker_id}: {worker.rate_per_hour}")
    except SQLAlchemyError as e:
        logging.error(f"Error auto-setting worker rate: {e}")

def update_ledger_balance(payment_id):
    try:
        ledger = ClientLedger.query.get(payment_id)
        if not ledger:
            return
        if not ledger.total_due:
            lot = Lot.query.get(ledger.lot_id)
            ledger.total_due = lot.total_cost if lot else 0
        payments = db.session.query(func.sum(ClientLedger.amount_paid)).filter_by(lot_id=ledger.lot_id).scalar() or 0
        ledger.balance_remaining = ledger.total_due - payments
        if ledger.balance_remaining <= 0:
            ledger.payment_status = 'Paid'
        elif ledger.balance_remaining > 0:
            order = ClientOrders.query.join(Lot).filter(Lot.lot_id == ledger.lot_id).first()
            if order and order.deadline < datetime.date.today():
                ledger.payment_status = 'Overdue'
            else:
                ledger.payment_status = 'Partial' if payments > 0 else 'Pending'
        db.session.commit()
        logging.info(f"Updated ledger {payment_id}: balance {ledger.balance_remaining}, status {ledger.payment_status}")
    except SQLAlchemyError as e:
        logging.error(f"Error updating ledger balance: {e}")

def update_daybook_balance(transaction_id):
    try:
        transaction = DayBook.query.get(transaction_id)
        if not transaction:
            logging.warning(f"No transaction found for transaction_id {transaction_id}")
            return
        prev_balance = db.session.query(func.sum(
            case([(DayBook.transaction_type == 'Credit', DayBook.amount)], elsevalue=-DayBook.amount)
        )).filter(DayBook.transaction_id < transaction_id).scalar() or 0
        sign = 1 if transaction.transaction_type == 'Credit' else -1
        transaction.balance_after_transaction = prev_balance + (sign * transaction.amount)
        db.session.commit()
        logging.info(f"Updated DayBook {transaction_id}: balance {transaction.balance_after_transaction}")
    except SQLAlchemyError as e:
        logging.error(f"Error updating DayBook balance: {e}")
        db.session.rollback()
        raise