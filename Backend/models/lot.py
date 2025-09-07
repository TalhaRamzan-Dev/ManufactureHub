from .db import db
import datetime

class Lot(db.Model):
    __tablename__ = 'lot'
    lot_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_id = db.Column(db.Integer, db.ForeignKey('client_orders.order_id', ondelete='CASCADE'), nullable=False)
    lot_status = db.Column(db.String(20), default='Pending')
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    total_cost = db.Column(db.Numeric(10, 2))
    progress_percent = db.Column(db.Integer, default=0)
    current_stage = db.Column(db.String(50))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)