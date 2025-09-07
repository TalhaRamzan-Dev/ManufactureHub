interface CsvColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'status' | 'currency';
  required?: boolean;
}

interface ValidationError {
  row: number;
  column: string;
  message: string;
}

// Define required fields for each table
const requiredFields: { [key: string]: string[] } = {
  clients: ['name', 'business_name', 'phone_number', 'email'],
  clientorders: ['client_id', 'design_description', 'num_units', 'deadline', 'material_type'],
  lots: ['order_id', 'lot_status', 'start_date', 'total_cost'],
  workers: ['name', 'rate_per_hour'],
  lotworkers: ['lot_id', 'worker_id', 'units_produced', 'hours_worked'],
  inventory: ['lot_id', 'material_name', 'quantity_used', 'unit_cost', 'date_used'],
  lotexpenses: ['lot_id', 'expense_type', 'amount', 'expense_date'],
  clientledger: ['lot_id', 'client_id', 'payment_date', 'amount_paid', 'payment_method'],
  daybook: ['date', 'transaction_type', 'amount', 'description', 'lot_id']
};

export function exportToCsv(data: any[], columns: CsvColumn[], filename: string): void {
  if (data.length === 0) return;

  // Create CSV header
  const headers = columns.map(col => col.label).join(',');
  
  // Create CSV rows
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col.key];
      if (value === null || value === undefined) return '';
      
      // Format based on column type
      let formattedValue = value;
      switch (col.type) {
        case 'currency':
          formattedValue = typeof value === 'number' ? value.toString() : value;
          break;
        case 'date':
          formattedValue = value;
          break;
        default:
          formattedValue = value.toString();
      }
      
      // Escape commas and quotes
      if (formattedValue.includes(',') || formattedValue.includes('"')) {
        formattedValue = `"${formattedValue.replace(/"/g, '""')}"`;
      }
      
      return formattedValue;
    }).join(',');
  });

  // Combine header and rows
  const csvContent = [headers, ...rows].join('\n');
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function parseCsvFile(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n').map(row => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
              if (inQuotes && row[i + 1] === '"') {
                current += '"';
                i++; // Skip next quote
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        }).filter(row => row.some(cell => cell.length > 0));
        
        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}

export function validateCsvData(
  data: string[][],
  columns: CsvColumn[],
  tableKey: string
): { isValid: boolean; errors: ValidationError[]; validData: any[] } {
  const errors: ValidationError[] = [];
  const validData: any[] = [];
  const currentRequiredFields = requiredFields[tableKey] || [];
  
  if (data.length === 0) {
    errors.push({ row: 0, column: 'general', message: 'CSV file is empty' });
    return { isValid: false, errors, validData };
  }

  const headers = data[0];
  const columnMap = new Map<string, number>();
  columns.forEach(col => {
    const headerIndex = headers.findIndex(h => h.toLowerCase() === col.label.toLowerCase());
    if (headerIndex !== -1) {
      columnMap.set(col.key, headerIndex);
    }
  });

  // Check for missing required columns
  currentRequiredFields.forEach(field => {
    const column = columns.find(col => col.key === field);
    if (column && !columnMap.has(field)) {
      errors.push({ 
        row: 0, 
        column: column.label, 
        message: `Required column "${column.label}" is missing` 
      });
    }
  });

  if (errors.length > 0) {
    return { isValid: false, errors, validData };
  }

  // Validate data rows
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const item: any = {};
    let hasValidData = false;

    columns.forEach(col => {
      const cellIndex = columnMap.get(col.key);
      const cellValue = cellIndex !== undefined ? row[cellIndex]?.trim() : '';
      
      if (cellValue) {
        hasValidData = true;
        
        // Type validation and conversion
        switch (col.type) {
          case 'number':
          case 'currency':
            const numValue = parseFloat(cellValue);
            if (isNaN(numValue)) {
              errors.push({
                row: i + 1,
                column: col.label,
                message: `"${cellValue}" is not a valid number`
              });
            } else {
              item[col.key] = numValue;
            }
            break;
          case 'date':
            const dateValue = new Date(cellValue);
            if (isNaN(dateValue.getTime())) {
              errors.push({
                row: i + 1,
                column: col.label,
                message: `"${cellValue}" is not a valid date`
              });
            } else {
              item[col.key] = cellValue; // Keep as string for consistency
            }
            break;
          default:
            item[col.key] = cellValue;
        }
      }
      
      // Check required fields
      if (currentRequiredFields.includes(col.key) && !cellValue) {
        errors.push({
          row: i + 1,
          column: col.label,
          message: `${col.label} is required`
        });
      }
    });

    if (hasValidData) {
      validData.push(item);
    }
  }

  return { isValid: errors.length === 0, errors, validData };
}

// Generate sample CSV template
export function generateCsvTemplate(columns: CsvColumn[]): string {
  const headers = columns.map(col => col.label).join(',');
  const sampleRow = columns.map(col => {
    switch (col.type) {
      case 'date':
        return '2024-01-15';
      case 'number':
        return '100';
      case 'currency':
        return '1500';
      case 'status':
        return 'Active';
      default:
        return `Sample ${col.label}`;
    }
  }).join(',');
  
  return `${headers}\n${sampleRow}`;
}