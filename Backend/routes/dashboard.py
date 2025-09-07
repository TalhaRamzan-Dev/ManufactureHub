# routes/dashboard.py - Dashboard stats route.
# Provides aggregates for UI landing page.

import logging
from flask import Blueprint, jsonify, abort
from sqlalchemy import func, extract, case
from sqlalchemy.exc import SQLAlchemyError
from models.db import db
import datetime
from models.client import Client
from models.client_orders import ClientOrders
from models.lot import Lot
from models.lot_worker import LotWorker
from models.client_ledger import ClientLedger
from models.inventory import Inventory
from models.worker import Worker
from models.lot_expenses import LotExpenses

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard/stats', methods=['GET'])
def dashboard_stats():
    try:
        current_year = datetime.datetime.now().year
        
        stats = {
            'total_clients': Client.query.count(),
            'active_orders': ClientOrders.query.filter(ClientOrders.order_status != 'Completed').count(),
            'ongoing_lots': Lot.query.filter(Lot.lot_status.in_(['Pending', 'In Progress'])).count(),
            'total_revenue': db.session.query(func.sum(ClientLedger.amount_paid)).filter(
                extract('year', ClientLedger.payment_date) == current_year).scalar() or 0,
            'overdue_payments': ClientLedger.query.filter(ClientLedger.payment_status == 'Overdue').count(),
            'worker_productivity': db.session.query(func.avg(LotWorker.units_produced)).scalar() or 0,
        }
        logging.info("Fetched dashboard stats successfully")
        return jsonify(stats)
    except SQLAlchemyError as e:
        logging.error(f"Error fetching dashboard stats: {e}")
        abort(500, description="Database error fetching stats")

@dashboard_bp.route('/dashboard/monthly-data', methods=['GET'])
def monthly_data():
    try:
        current_year = datetime.datetime.now().year
        
        # Get monthly data for the current year
        monthly_stats = db.session.query(
            extract('month', ClientOrders.created_at).label('month'),
            func.count(ClientOrders.order_id).label('orders'),
            func.sum(ClientLedger.amount_paid).label('revenue'),
            func.sum(LotExpenses.amount).label('expenses'),
            func.count(Lot.lot_id).label('lots')
        ).outerjoin(
            Lot, ClientOrders.order_id == Lot.order_id
        ).outerjoin(
            ClientLedger, Lot.lot_id == ClientLedger.lot_id
        ).outerjoin(
            LotExpenses, Lot.lot_id == LotExpenses.lot_id
        ).filter(
            extract('year', ClientOrders.created_at) == current_year
        ).group_by(
            extract('month', ClientOrders.created_at)
        ).all()
        
        # Format the data
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        monthly_data = []
        for stat in monthly_stats:
            monthly_data.append({
                'name': month_names[int(stat.month) - 1],
                'orders': int(stat.orders or 0),
                'revenue': float(stat.revenue or 0),
                'expenses': float(stat.expenses or 0),
                'lots': int(stat.lots or 0)
            })
        
        logging.info("Fetched monthly data successfully")
        return jsonify(monthly_data)
    except SQLAlchemyError as e:
        logging.error(f"Error fetching monthly data: {e}")
        abort(500, description="Database error fetching monthly data")

@dashboard_bp.route('/dashboard/lot-status', methods=['GET'])
def lot_status():
    try:
        # Get lot status distribution
        status_stats = db.session.query(
            Lot.lot_status,
            func.count(Lot.lot_id).label('count')
        ).group_by(Lot.lot_status).all()
        
        # Define colors for different statuses
        status_colors = {
            'Completed': '#10b981',
            'In Progress': '#3b82f6',
            'Pending': '#f59e0b',
            'Delivered': '#8b5cf6',
            'Cancelled': '#ef4444'
        }
        
        lot_status_data = []
        for stat in status_stats:
            lot_status_data.append({
                'name': stat.lot_status,
                'value': int(stat.count),
                'color': status_colors.get(stat.lot_status, '#6b7280')
            })
        
        logging.info("Fetched lot status data successfully")
        return jsonify(lot_status_data)
    except SQLAlchemyError as e:
        logging.error(f"Error fetching lot status data: {e}")
        abort(500, description="Database error fetching lot status data")

@dashboard_bp.route('/dashboard/worker-productivity', methods=['GET'])
def worker_productivity():
    try:
        # Get worker productivity data
        worker_stats = db.session.query(
            Worker.name,
            func.sum(LotWorker.units_produced).label('units_produced'),
            func.avg(LotWorker.units_produced).label('avg_efficiency')
        ).join(
            LotWorker, Worker.worker_id == LotWorker.worker_id
        ).group_by(
            Worker.worker_id, Worker.name
        ).all()
        
        worker_productivity_data = []
        for stat in worker_stats:
            efficiency = float(stat.avg_efficiency or 0)
            # Calculate efficiency percentage (assuming 100 units = 100% efficiency)
            efficiency_percent = min(100, max(0, efficiency))
            
            worker_productivity_data.append({
                'name': stat.name,
                'unitsProduced': int(stat.units_produced or 0),
                'efficiency': round(efficiency_percent, 1)
            })
        
        logging.info("Fetched worker productivity data successfully")
        return jsonify(worker_productivity_data)
    except SQLAlchemyError as e:
        logging.error(f"Error fetching worker productivity data: {e}")
        abort(500, description="Database error fetching worker productivity data")

@dashboard_bp.route('/dashboard/inventory-usage', methods=['GET'])
def inventory_usage():
    try:
        # Get inventory usage data
        inventory_stats = db.session.query(
            Inventory.material_name,
            func.sum(Inventory.quantity_used).label('used'),
            func.sum(Inventory.quantity_used * Inventory.unit_cost).label('total_cost')
        ).group_by(Inventory.material_name).all()
        
        # Calculate remaining inventory (this would need to be based on your business logic)
        # For now, we'll use a simple calculation
        inventory_usage_data = []
        for stat in inventory_stats:
            used = float(stat.used or 0)
            # Assume remaining is 2x the used amount for demo purposes
            remaining = used * 2
            
            inventory_usage_data.append({
                'material': stat.material_name,
                'used': used,
                'remaining': remaining
            })
        
        logging.info("Fetched inventory usage data successfully")
        return jsonify(inventory_usage_data)
    except SQLAlchemyError as e:
        logging.error(f"Error fetching inventory usage data: {e}")
        abort(500, description="Database error fetching inventory usage data")

@dashboard_bp.route('/dashboard/recent-activities', methods=['GET'])
def recent_activities():
    try:
        # Get recent activities from various tables
        activities = []
        
        # Recent lot completions
        recent_lots = db.session.query(
            Lot.lot_id,
            Lot.lot_status,
            Lot.updated_at,
            ClientOrders.design_description
        ).join(
            ClientOrders, Lot.order_id == ClientOrders.order_id
        ).filter(
            Lot.lot_status == 'Completed'
        ).order_by(
            Lot.updated_at.desc()
        ).limit(5).all()
        
        for lot in recent_lots:
            activities.append({
                'type': 'lot_completed',
                'title': f'Lot #{lot.lot_id} completed - {lot.design_description}',
                'timestamp': lot.updated_at.isoformat(),
                'icon': 'CheckCircle',
                'color': 'text-green-500'
            })
        
        # Recent payments
        recent_payments = db.session.query(
            ClientLedger.payment_id,
            ClientLedger.amount_paid,
            ClientLedger.payment_date,
            Client.name
        ).join(
            Client, ClientLedger.client_id == Client.client_id
        ).order_by(
            ClientLedger.payment_date.desc()
        ).limit(3).all()
        
        for payment in recent_payments:
            activities.append({
                'type': 'payment_received',
                'title': f'Payment received - ${payment.amount_paid:,.2f}',
                'subtitle': payment.name,
                'timestamp': payment.payment_date.isoformat(),
                'icon': 'DollarSign',
                'color': 'text-green-500'
            })
        
        # Sort by timestamp
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        logging.info("Fetched recent activities successfully")
        return jsonify(activities[:10])  # Return top 10 activities
    except SQLAlchemyError as e:
        logging.error(f"Error fetching recent activities: {e}")
        abort(500, description="Database error fetching recent activities")