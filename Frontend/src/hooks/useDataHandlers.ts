import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { toast } from 'sonner';

// Map table names to their ID field names
const tableIdFields: Record<string, string> = {
  clients: 'client_id',
  clientOrders: 'order_id',
  lots: 'lot_id',
  workers: 'worker_id',
  lotWorkers: 'lot_worker_id',
  inventory: 'inventory_id',
  lotExpenses: 'expense_id',
  clientLedger: 'payment_id',
  dayBook: 'transaction_id'
};

// Map table names to their API endpoints
const tableEndpoints: Record<string, string> = {
  clients: 'clients',
  clientOrders: 'client_orders',
  lots: 'lots',
  workers: 'workers',
  lotWorkers: 'lot_workers',
  inventory: 'inventory',
  lotExpenses: 'lot_expenses',
  clientLedger: 'client_ledger',
  dayBook: 'day_book'
};

export function useDataHandlers() {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  // Fetch data for a specific table
  const fetchTableData = async (table: string) => {
    const endpoint = tableEndpoints[table];
    if (!endpoint) return;

    setLoading(prev => ({ ...prev, [table]: true }));
    setErrors(prev => ({ ...prev, [table]: null }));

    try {
      const response = await apiService.get(`/${endpoint}`);
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Handle nested response structure from backend
      let tableData = [];
      if (response.data) {
        // Check if response has nested structure (e.g., {clients: [...]})
        const tableKey = Object.keys(response.data).find(key => 
          key.includes(endpoint.replace('_', '')) || 
          key === endpoint || 
          key === table
        );
        
        if (tableKey && Array.isArray(response.data[tableKey])) {
          tableData = response.data[tableKey];
        } else if (Array.isArray(response.data)) {
          // Direct array response
          tableData = response.data;
        } else {
          // Try to find any array in the response
          const arrayKey = Object.keys(response.data).find(key => Array.isArray(response.data[key]));
          if (arrayKey) {
            tableData = response.data[arrayKey];
          }
        }
      }
      
      setData(prev => ({ ...prev, [table]: tableData }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
      setErrors(prev => ({ ...prev, [table]: errorMessage }));
      toast.error(`Failed to load ${table}: ${errorMessage}`);
    } finally {
      setLoading(prev => ({ ...prev, [table]: false }));
    }
  };

  // Fetch all table data
  const fetchAllData = async () => {
    const tables = Object.keys(tableEndpoints);
    await Promise.all(tables.map(table => fetchTableData(table)));
  };

  // Initialize data on mount
  useEffect(() => {
    console.log('useDataHandlers: Initializing data fetch...');
    fetchAllData();
  }, []);

  const handleAdd = async (table: string, item: any) => {
    const endpoint = tableEndpoints[table];
    if (!endpoint) return;

    try {
      const response = await apiService.post(`/${endpoint}`, item);
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Refresh the table data
      await fetchTableData(table);
      toast.success(`${table} added successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item';
      toast.error(`Failed to add ${table}: ${errorMessage}`);
    }
  };

  const handleEdit = async (table: string, id: string, updatedItem: any) => {
    const endpoint = tableEndpoints[table];
    if (!endpoint) return;

    try {
      const response = await apiService.put(`/${endpoint}/${id}`, updatedItem);
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Refresh the table data
      await fetchTableData(table);
      toast.success(`${table} updated successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update item';
      toast.error(`Failed to update ${table}: ${errorMessage}`);
    }
  };

  const handleDelete = async (table: string, id: string) => {
    const endpoint = tableEndpoints[table];
    if (!endpoint) return;

    try {
      const response = await apiService.delete(`/${endpoint}/${id}`);
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Refresh the table data
      await fetchTableData(table);
      toast.success(`${table} deleted successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete item';
      toast.error(`Failed to delete ${table}: ${errorMessage}`);
    }
  };

  const handleImport = async (table: string, importedItems: any[]) => {
    const endpoint = tableEndpoints[table];
    if (!endpoint) return;

    try {
      const response = await apiService.post(`/import/${table}`, { data: importedItems });
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Refresh the table data
      await fetchTableData(table);
      toast.success(`${importedItems.length} ${table} imported successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import items';
      toast.error(`Failed to import ${table}: ${errorMessage}`);
    }
  };

  const refreshTable = (table: string) => {
    fetchTableData(table);
  };

  const refreshAll = () => {
    fetchAllData();
  };

  return {
    data,
    loading,
    errors,
    handleAdd,
    handleEdit,
    handleDelete,
    handleImport,
    refreshTable,
    refreshAll
  };
}