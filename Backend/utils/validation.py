# utils/validation.py - Input validation for routes.
# Basic checks; expand with regex for email, etc.

def validate_client(data, update=False):
    required = ['name'] if not update else []  # Only name is required
    
    # Check if required fields are present
    if not all(k in data for k in required):
        return False
    
    # Check if name is a string and not empty
    name = data.get('name', '')
    if not isinstance(name, str) or not name.strip():
        return False
    
    # Email is optional but if provided, must be valid
    email = data.get('email', '')
    if email and (not isinstance(email, str) or not email.strip()):
        return False
    
    return True

def validate_client_orders(data, update=False):
    required = ['client_id', 'num_units', 'deadline'] if not update else []
    return all(k in data for k in required)

def validate_lot(data, update=False):
    required = ['order_id'] if not update else []
    return all(k in data for k in required)

def validate_worker(data, update=False):
    required = ['name', 'rate_per_hour'] if not update else []
    return all(k in data for k in required)

def validate_lot_worker(data, update=False):
    required = ['lot_id', 'worker_id'] if not update else []
    return all(k in data for k in required)

def validate_inventory(data, update=False):
    required = ['lot_id', 'material_name', 'quantity_used', 'unit_cost', 'date_used'] if not update else []
    return all(k in data for k in required)

def validate_lot_expenses(data, update=False):
    required = ['lot_id', 'expense_type', 'amount', 'expense_date'] if not update else []
    return all(k in data for k in required)

def validate_client_ledger(data, update=False):
    required = ['lot_id', 'client_id', 'payment_date', 'amount_paid'] if not update else []
    return all(k in data for k in required)

def validate_day_book(data, update=False):
    required = ['date', 'transaction_type', 'amount'] if not update else []
    return all(k in data for k in required) and data.get('transaction_type') in ['Debit', 'Credit']