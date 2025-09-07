# models/client_orders.py - Defines the ClientOrders model.
# Manages client orders with links to Client.

from .db import db
import datetime

class ClientOrders(db.Model):
    __tablename__ = 'client_orders'
    order_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    client_id = db.Column(db.Integer, db.ForeignKey('client.client_id', ondelete='CASCADE'), nullable=False)
    design_description = db.Column(db.Text)
    num_units = db.Column(db.Integer, nullable=False)
    deadline = db.Column(db.Date, nullable=False)
    color = db.Column(db.String(50))
    material_type = db.Column(db.String(100))
    design_image = db.Column(db.String(255))
    order_status = db.Column(db.String(20), default='New')
    total_estimated_cost = db.Column(db.Numeric(10, 2))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)