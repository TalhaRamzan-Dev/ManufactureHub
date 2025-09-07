# routes/__init__.py - Registers all blueprints for API routes.

from flask import Blueprint
from .client import client_bp
from .client_orders import client_orders_bp
from .lot import lot_bp
from .worker import worker_bp
from .lot_worker import lot_worker_bp
from .inventory import inventory_bp
from .lot_expenses import lot_expenses_bp
from .client_ledger import client_ledger_bp
from .day_book import day_book_bp
from .lookups import lookups_bp
from .dashboard import dashboard_bp
from .import_export import import_export_bp
from .search_info import search_info_bp

def register_blueprints(app):
    app.register_blueprint(client_bp, url_prefix='/api')
    app.register_blueprint(client_orders_bp, url_prefix='/api')
    app.register_blueprint(lot_bp, url_prefix='/api')
    app.register_blueprint(worker_bp, url_prefix='/api')
    app.register_blueprint(lot_worker_bp, url_prefix='/api')
    app.register_blueprint(inventory_bp, url_prefix='/api')
    app.register_blueprint(lot_expenses_bp, url_prefix='/api')
    app.register_blueprint(client_ledger_bp, url_prefix='/api')
    app.register_blueprint(day_book_bp, url_prefix='/api')
    app.register_blueprint(lookups_bp, url_prefix='/api')
    app.register_blueprint(dashboard_bp, url_prefix='/api')
    app.register_blueprint(import_export_bp, url_prefix='/api')
    app.register_blueprint(search_info_bp, url_prefix='/api')