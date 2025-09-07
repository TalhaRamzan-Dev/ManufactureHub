# models/lot_expenses.py - Defines the LotExpenses model.
# Tracks non-material expenses per lot.

from .db import db
import datetime

class LotExpenses(db.Model):
    __tablename__ = 'lot_expenses'
    expense_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    lot_id = db.Column(db.Integer, db.ForeignKey('lot.lot_id', ondelete='CASCADE'), nullable=False)
    expense_type = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    expense_date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text)
    vendor = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)