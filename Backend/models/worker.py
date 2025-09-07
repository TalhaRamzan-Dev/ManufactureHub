# models/worker.py - Defines the Worker model.
# Stores worker details.

from .db import db
import datetime

class Worker(db.Model):
    __tablename__ = 'worker'
    worker_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    rate_per_hour = db.Column(db.Numeric(10, 2), nullable=False)
    skill_type = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)