# models/views.py - Creates SQL views for UI dropdowns.
# Views provide readable data for foreign key fields.

import logging
from sqlalchemy import text
from .db import db

def init_db_views(app):
    with app.app_context():
        engine = db.engine
        with engine.connect() as conn:
            logging.info("Creating lookup views...")
            conn.execute(text("""
                CREATE VIEW IF NOT EXISTS client_lookup_view AS
                SELECT client_id, name || ' - ' || business_name AS display_name FROM client;
            """))
            conn.execute(text("""
                CREATE VIEW IF NOT EXISTS order_lookup_view AS
                SELECT o.order_id, 'Order #' || o.order_id || ' - Design: ' || o.design_description || ' - Client: ' || c.name AS display
                FROM client_orders o JOIN client c ON o.client_id = c.client_id;
            """))
            conn.execute(text("""
                CREATE VIEW IF NOT EXISTS lot_lookup_view AS
                SELECT l.lot_id, 'Lot #' || l.lot_id || ' - Order: ' || o.design_description || ' - Client: ' || c.name AS display
                FROM lot l JOIN client_orders o ON l.order_id = o.order_id JOIN client c ON o.client_id = c.client_id;
            """))
            conn.execute(text("""
                CREATE VIEW IF NOT EXISTS worker_lookup_view AS
                SELECT worker_id, name || ' - Skill: ' || skill_type AS display FROM worker;
            """))
            conn.commit()
            logging.info("All lookup views created.")