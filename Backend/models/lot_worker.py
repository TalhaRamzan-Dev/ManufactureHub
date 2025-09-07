# models/lot_worker.py - Defines the LotWorker model.
# Links workers to lots for productivity tracking.

from .db import db
import datetime

class LotWorker(db.Model):
    __tablename__ = 'lot_worker'
    lot_worker_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    lot_id = db.Column(db.Integer, db.ForeignKey('lot.lot_id', ondelete='CASCADE'), nullable=False)
    worker_id = db.Column(db.Integer, db.ForeignKey('worker.worker_id', ondelete='CASCADE'), nullable=False)
    units_produced = db.Column(db.Integer, default=0)
    hours_worked = db.Column(db.Numeric(10, 2), default=0)
    rate_per_hour = db.Column(db.Numeric(10, 2))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)