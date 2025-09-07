# models/day_book.py - Defines the DayBook model.
# Tracks daily financial transactions.

from .db import db
import datetime

class DayBook(db.Model):
    __tablename__ = 'day_book'
    transaction_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    date = db.Column(db.Date, nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    description = db.Column(db.Text)
    lot_id = db.Column(db.Integer, db.ForeignKey('lot.lot_id', ondelete='SET NULL'))
    reference = db.Column(db.String(50))
    balance_after_transaction = db.Column(db.Numeric(10, 2))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)