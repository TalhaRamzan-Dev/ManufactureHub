# models/client_ledger.py - Defines the ClientLedger model.
# Tracks payments and balances.
from .db import db
import datetime

class ClientLedger(db.Model):
    __tablename__ = 'client_ledger'
    payment_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    lot_id = db.Column(db.Integer, db.ForeignKey('lot.lot_id', ondelete='CASCADE'), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('client.client_id', ondelete='CASCADE'), nullable=False)
    payment_date = db.Column(db.Date, nullable=False)
    amount_paid = db.Column(db.Numeric(10, 2), nullable=False)
    payment_method = db.Column(db.String(50))
    notes = db.Column(db.Text)
    total_due = db.Column(db.Numeric(10, 2))
    balance_remaining = db.Column(db.Numeric(10, 2))
    payment_status = db.Column(db.String(20), default='Pending')
    invoice_number = db.Column(db.String(50), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)