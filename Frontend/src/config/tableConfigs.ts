export const tableConfigs = {
  clients: {
    title: 'Clients',
    columns: [
      { key: 'client_id', label: 'Client ID' },
      { key: 'name', label: 'Client Name', required: true },
      { key: 'business_name', label: 'Business Name', required: true },
      { key: 'phone_number', label: 'Phone Number', validation: 'phone' },
      { key: 'shop_address', label: 'Shop Address' },
      { key: 'email', label: 'Email', validation: 'email' },
      { key: 'created_at', label: 'Created Date', type: 'date' as const },
      { key: 'updated_at', label: 'Updated Date', type: 'date' as const },
    ]
  },
  clientOrders: {
    title: 'Client Orders',
    columns: [
      { key: 'order_id', label: 'Order ID' },
      { key: 'client_id', label: 'Client', type: 'lookup' as const, lookupTable: 'clients', displayField: 'name', secondaryField: 'business_name', required: true },
      { key: 'design_description', label: 'Design Description', required: true },
      { key: 'num_units', label: 'Number of Units', type: 'number' as const, required: true, min: 1 },
      { key: 'deadline', label: 'Deadline', type: 'date' as const, required: true },
      { key: 'color', label: 'Color' },
      { key: 'material_type', label: 'Material Type' },
      { key: 'design_image', label: 'Design Image', type: 'image' as const },
      { key: 'order_status', label: 'Order Status', type: 'status' as const },
      { key: 'total_estimated_cost', label: 'Estimated Cost', type: 'currency' as const, min: 0 },
      { key: 'created_at', label: 'Created Date', type: 'date' as const },
      { key: 'updated_at', label: 'Updated Date', type: 'date' as const },
    ]
  },
  lots: {
    title: 'Production Lots',
    columns: [
      { key: 'lot_id', label: 'Lot ID' },
      { key: 'order_id', label: 'Order', type: 'lookup' as const, lookupTable: 'clientOrders', displayField: 'design_description', secondaryField: 'client_id', required: true },
      { key: 'lot_status', label: 'Lot Status', type: 'status' as const, required: true },
      { key: 'start_date', label: 'Start Date', type: 'date' as const, required: true },
      { key: 'end_date', label: 'End Date', type: 'date' as const },
      { key: 'total_cost', label: 'Total Cost', type: 'currency' as const },
      { key: 'progress_percent', label: 'Progress %', type: 'number' as const, min: 0, max: 100 },
      { key: 'current_stage', label: 'Current Stage' },
      { key: 'notes', label: 'Notes' },
      { key: 'created_at', label: 'Created Date', type: 'date' as const },
      { key: 'updated_at', label: 'Updated Date', type: 'date' as const },
    ]
  },
  workers: {
    title: 'Workers',
    columns: [
      { key: 'worker_id', label: 'Worker ID' },
      { key: 'name', label: 'Worker Name', required: true },
      { key: 'rate_per_hour', label: 'Rate Per Hour', type: 'currency' as const, required: true, min: 0 },
      { key: 'skill_type', label: 'Skill Type', required: true },
      { key: 'created_at', label: 'Created Date', type: 'date' as const },
      { key: 'updated_at', label: 'Updated Date', type: 'date' as const },
    ]
  },
  lotWorkers: {
    title: 'Lot Worker Assignments',
    columns: [
      { key: 'lot_worker_id', label: 'Assignment ID' },
      { key: 'lot_id', label: 'Production Lot', type: 'lookup' as const, lookupTable: 'lots', displayField: 'lot_id', secondaryField: 'current_stage', required: true },
      { key: 'worker_id', label: 'Worker', type: 'lookup' as const, lookupTable: 'workers', displayField: 'name', secondaryField: 'skill_type', required: true },
      { key: 'units_produced', label: 'Units Produced', type: 'number' as const, min: 0 },
      { key: 'hours_worked', label: 'Hours Worked', type: 'number' as const, min: 0 },
      { key: 'rate_per_hour', label: 'Rate Per Hour', type: 'currency' as const, min: 0 },
      { key: 'created_at', label: 'Created Date', type: 'date' as const },
      { key: 'updated_at', label: 'Updated Date', type: 'date' as const },
    ]
  },
  inventory: {
    title: 'Inventory Usage',
    columns: [
      { key: 'inventory_id', label: 'Inventory ID' },
      { key: 'lot_id', label: 'Production Lot', type: 'lookup' as const, lookupTable: 'lots', displayField: 'lot_id', secondaryField: 'current_stage', required: true },
      { key: 'material_name', label: 'Material Name', required: true },
      { key: 'quantity_used', label: 'Quantity Used', type: 'number' as const, required: true, min: 0 },
      { key: 'unit_cost', label: 'Unit Cost', type: 'currency' as const, required: true, min: 0 },
      { key: 'date_used', label: 'Date Used', type: 'date' as const, required: true },
      { key: 'supplier_name', label: 'Supplier Name' },
      { key: 'created_at', label: 'Created Date', type: 'date' as const },
      { key: 'updated_at', label: 'Updated Date', type: 'date' as const },
    ]
  },
  lotExpenses: {
    title: 'Lot Expenses',
    columns: [
      { key: 'expense_id', label: 'Expense ID' },
      { key: 'lot_id', label: 'Production Lot', type: 'lookup' as const, lookupTable: 'lots', displayField: 'lot_id', secondaryField: 'current_stage', required: true },
      { key: 'expense_type', label: 'Expense Type', required: true },
      { key: 'amount', label: 'Amount', type: 'currency' as const, required: true, min: 0 },
      { key: 'expense_date', label: 'Expense Date', type: 'date' as const, required: true },
      { key: 'notes', label: 'Notes' },
      { key: 'vendor', label: 'Vendor' },
      { key: 'created_at', label: 'Created Date', type: 'date' as const },
      { key: 'updated_at', label: 'Updated Date', type: 'date' as const },
    ]
  },
  clientLedger: {
    title: 'Client Ledger',
    columns: [
      { key: 'payment_id', label: 'Payment ID' },
      { key: 'lot_id', label: 'Production Lot', type: 'lookup' as const, lookupTable: 'lots', displayField: 'lot_id', secondaryField: 'current_stage', required: true },
      { key: 'client_id', label: 'Client', type: 'lookup' as const, lookupTable: 'clients', displayField: 'name', secondaryField: 'business_name', required: true },
      { key: 'payment_date', label: 'Payment Date', type: 'date' as const, required: true },
      { key: 'amount_paid', label: 'Amount Paid', type: 'currency' as const, required: true, min: 0 },
      { key: 'payment_method', label: 'Payment Method', required: true },
      { key: 'notes', label: 'Notes' },
      { key: 'total_due', label: 'Total Due', type: 'currency' as const, min: 0 },
      { key: 'balance_remaining', label: 'Balance Remaining', type: 'currency' as const, min: 0 },
      { key: 'payment_status', label: 'Payment Status', type: 'status' as const },
      { key: 'invoice_number', label: 'Invoice Number' },
      { key: 'created_at', label: 'Created Date', type: 'date' as const },
      { key: 'updated_at', label: 'Updated Date', type: 'date' as const },
    ]
  },
  dayBook: {
    title: 'Day Book',
    columns: [
      { key: 'transaction_id', label: 'Transaction ID' },
      { key: 'date', label: 'Date', type: 'date' as const, required: true },
      { key: 'transaction_type', label: 'Transaction Type', required: true },
      { key: 'amount', label: 'Amount', type: 'currency' as const, required: true, min: 0 },
      { key: 'description', label: 'Description', required: true },
      { key: 'lot_id', label: 'Related Lot', type: 'lookup' as const, lookupTable: 'lots', displayField: 'lot_id', secondaryField: 'current_stage' },
      { key: 'reference', label: 'Reference' },
      { key: 'balance_after_transaction', label: 'Balance After Transaction', type: 'currency' as const },
      { key: 'created_at', label: 'Created Date', type: 'date' as const },
      { key: 'updated_at', label: 'Updated Date', type: 'date' as const },
    ]
  }
};