from flask import Blueprint, jsonify
from sqlalchemy import func, select
from models.db import db
from models.client import Client
from models.client_orders import ClientOrders
from models.lot import Lot
from models.lot_worker import LotWorker
from models.inventory import Inventory
from models.lot_expenses import LotExpenses
from models.client_ledger import ClientLedger
from models.day_book import DayBook
from utils.serialization import serialize_model as serialize

custom_bp = Blueprint("custom", __name__, url_prefix="/api")

@custom_bp.get("/clients/<int:client_id>/orders")
def client_orders(client_id):
    q = (
        select(ClientOrders)
        .where(ClientOrders.client_id == client_id)
        .order_by(ClientOrders.order_id.desc())
    )
    rows = db.session.execute(q).scalars().all()
    return jsonify([serialize(r) for r in rows])

@custom_bp.get("/orders/<int:order_id>/lots")
def order_lots(order_id):
    q = select(Lot).where(Lot.order_id == order_id).order_by(Lot.lot_id.desc())
    rows = db.session.execute(q).scalars().all()
    return jsonify([serialize(r) for r in rows])

@custom_bp.get("/lots/<int:lot_id>/summary")
def lot_summary(lot_id):
    # Worker time & output
    q_work = select(
        func.coalesce(func.sum(LotWorker.hours_worked), 0.0),
        func.coalesce(func.sum(LotWorker.units_produced), 0),
        func.coalesce(func.sum(
            func.coalesce(LotWorker.rate_per_hour, 0.0) * LotWorker.hours_worked
        ), 0.0)
    ).where(LotWorker.lot_id == lot_id)
    hours_worked, units_produced, labor_cost = db.session.execute(q_work).one()

    # Inventory material cost
    q_inv = select(func.coalesce(func.sum(Inventory.quantity_used * Inventory.unit_cost), 0.0)).where(Inventory.lot_id == lot_id)
    material_cost = db.session.execute(q_inv).scalar_one()

    # Other expenses
    q_exp = select(func.coalesce(func.sum(LotExpenses.amount), 0.0)).where(LotExpenses.lot_id == lot_id)
    other_expenses = db.session.execute(q_exp).scalar_one()

    # Payments received
    q_pay = select(func.coalesce(func.sum(ClientLedger.amount_paid), 0.0)).where(ClientLedger.lot_id == lot_id)
    total_payments = db.session.execute(q_pay).scalar_one()

    # Day book (debit/credit totals) tied to this lot
    q_db = select(
        func.coalesce(func.sum(func.case((DayBook.transaction_type == "Debit", DayBook.amount), else_=0.0)), 0.0),
        func.coalesce(func.sum(func.case((DayBook.transaction_type == "Credit", DayBook.amount), else_=0.0)), 0.0)
    ).where(DayBook.lot_id == lot_id)
    total_debit, total_credit = db.session.execute(q_db).one()

    total_cost = (labor_cost or 0) + (material_cost or 0) + (other_expenses or 0)
    balance = (total_payments or 0) - total_cost

    return {
        "lot_id": lot_id,
        "units_produced": int(units_produced or 0),
        "hours_worked": float(hours_worked or 0),
        "labor_cost": float(labor_cost or 0),
        "material_cost": float(material_cost or 0),
        "other_expenses": float(other_expenses or 0),
        "total_cost": float(total_cost or 0),
        "total_payments": float(total_payments or 0),
        "balance_payments_minus_cost": float(balance or 0),
        "daybook_debit": float(total_debit or 0),
        "daybook_credit": float(total_credit or 0),
    }

@custom_bp.get("/clients/<int:client_id>/balance")
def client_balance(client_id):
    # Sum of client payments
    q_pay = select(func.coalesce(func.sum(ClientLedger.amount_paid), 0.0)).where(ClientLedger.client_id == client_id)
    total_paid = db.session.execute(q_pay).scalar_one()

    # Sum of costs of all lots belonging to this client's orders
    q_lots = (
        select(Lot.lot_id)
        .join(ClientOrders, Lot.order_id == ClientOrders.order_id)
        .where(ClientOrders.client_id == client_id)
    )
    lot_ids = [lid for (lid,) in db.session.execute(q_lots).all()]
    total_cost = 0.0
    for lid in lot_ids:
        # reuse the same calculation as lot_summary (simplified)
        q_work = select(
            func.coalesce(func.sum(LotWorker.rate_per_hour * LotWorker.hours_worked), 0.0)
        ).where(LotWorker.lot_id == lid)
        labor_cost = db.session.execute(q_work).scalar_one() or 0.0

        q_inv = select(func.coalesce(func.sum(Inventory.quantity_used * Inventory.unit_cost), 0.0)).where(Inventory.lot_id == lid)
        material_cost = db.session.execute(q_inv).scalar_one() or 0.0

        q_exp = select(func.coalesce(func.sum(LotExpenses.amount), 0.0)).where(LotExpenses.lot_id == lid)
        other_expenses = db.session.execute(q_exp).scalar_one() or 0.0

        total_cost += labor_cost + material_cost + other_expenses

    return {
        "client_id": client_id,
        "total_paid": float(total_paid or 0),
        "estimated_total_cost": float(total_cost or 0),
        "client_balance_paid_minus_cost": float((total_paid or 0) - total_cost)
    }
