# models/inventory.py - Defines the Inventory model.
# Tracks material usage per lot.

from .db import db
import datetime

class Inventory(db.Model):
    __tablename__ = 'inventory'
    inventory_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    lot_id = db.Column(db.Integer, db.ForeignKey('lot.lot_id', ondelete='CASCADE'), nullable=False)
    material_name = db.Column(db.String(100), nullable=False)
    quantity_used = db.Column(db.Numeric(10, 2), nullable=False)
    unit_cost = db.Column(db.Numeric(10, 2), nullable=False)
    date_used = db.Column(db.Date, nullable=False)
    supplier_name = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)