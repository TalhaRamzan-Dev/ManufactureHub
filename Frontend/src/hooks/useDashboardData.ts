import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export interface DashboardStats {
  total_clients: number;
  active_orders: number;
  ongoing_lots: number;
  total_revenue: number;
  overdue_payments: number;
  worker_productivity: number;
}

export interface MonthlyData {
  name: string;
  orders: number;
  revenue: number;
  expenses: number;
  lots: number;
}

export interface LotStatusData {
  name: string;
  value: number;
  color: string;
}

export interface WorkerProductivityData {
  name: string;
  unitsProduced: number;
  efficiency: number;
}

export interface InventoryUsageData {
  material: string;
  used: number;
  remaining: number;
}

export interface RecentActivity {
  type: string;
  title: string;
  subtitle?: string;
  timestamp: string;
  icon: string;
  color: string;
}

export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [lotStatusData, setLotStatusData] = useState<LotStatusData[]>([]);
  const [workerProductivityData, setWorkerProductivityData] = useState<WorkerProductivityData[]>([]);
  const [inventoryUsageData, setInventoryUsageData] = useState<InventoryUsageData[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to extract data arrays from nested responses
  const extractDataArray = (responseData: any, key: string): any[] => {
    if (!responseData) return [];
    
    // Check if response has nested structure (e.g., {client_orders: [...]})
    if (responseData[key] && Array.isArray(responseData[key])) {
      return responseData[key];
    }
    
    // Check if response is directly an array
    if (Array.isArray(responseData)) {
      return responseData;
    }
    
    // Try to find any array in the response
    const arrayKey = Object.keys(responseData).find(k => Array.isArray(responseData[k]));
    if (arrayKey) {
      return responseData[arrayKey];
    }
    
    return [];
  };

  // Compute monthly data from raw data
  const computeMonthlyData = (orders: any[], ledger: any[], expenses: any[], lots: any[]): MonthlyData[] => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const monthlyData: MonthlyData[] = monthNames.map(name => ({
      name,
      orders: 0,
      revenue: 0,
      expenses: 0,
      lots: 0
    }));

    // Ensure data is arrays before processing
    const ordersArray = Array.isArray(orders) ? orders : [];
    const ledgerArray = Array.isArray(ledger) ? ledger : [];
    const expensesArray = Array.isArray(expenses) ? expenses : [];
    const lotsArray = Array.isArray(lots) ? lots : [];

    // Process orders
    ordersArray.forEach(order => {
      if (order.created_at) {
        const date = new Date(order.created_at);
        if (date.getFullYear() === currentYear) {
          const month = date.getMonth();
          monthlyData[month].orders++;
        }
      }
    });

    // Process ledger entries (revenue)
    ledgerArray.forEach(entry => {
      if (entry.payment_date) {
        const date = new Date(entry.payment_date);
        if (date.getFullYear() === currentYear) {
          const month = date.getMonth();
          monthlyData[month].revenue += parseFloat(entry.amount_paid || 0);
        }
      }
    });

    // Process expenses
    expensesArray.forEach(expense => {
      if (expense.expense_date) {
        const date = new Date(expense.expense_date);
        if (date.getFullYear() === currentYear) {
          const month = date.getMonth();
          monthlyData[month].expenses += parseFloat(expense.amount || 0);
        }
      }
    });

    // Process lots
    lotsArray.forEach(lot => {
      if (lot.created_at) {
        const date = new Date(lot.created_at);
        if (date.getFullYear() === currentYear) {
          const month = date.getMonth();
          monthlyData[month].lots++;
        }
      }
    });

    return monthlyData;
  };

  // Compute recent activities from raw data
  const computeRecentActivities = (lots: any[], ledger: any[], clients: any[]): RecentActivity[] => {
    const activities: RecentActivity[] = [];

    // Recent lot completions
    const completedLots = lots
      .filter(lot => lot.lot_status === 'Completed')
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);

    completedLots.forEach(lot => {
      activities.push({
        type: 'lot_completed',
        title: `Lot #${lot.lot_id} completed`,
        timestamp: lot.updated_at,
        icon: 'CheckCircle',
        color: 'text-green-500'
      });
    });

    // Recent payments
    const recentPayments = ledger
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
      .slice(0, 3);

    recentPayments.forEach(payment => {
      const client = clients.find(c => c.client_id === payment.client_id);
      activities.push({
        type: 'payment_received',
        title: `Payment received - $${parseFloat(payment.amount_paid || 0).toLocaleString()}`,
        subtitle: client?.name || 'Unknown Client',
        timestamp: payment.payment_date,
        icon: 'DollarSign',
        color: 'text-green-500'
      });
    });

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return activities.slice(0, 10);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all required data
      const [
        statsResponse,
        lotStatusResponse,
        workerProductivityResponse,
        inventoryUsageResponse,
        ordersResponse,
        ledgerResponse,
        expensesResponse,
        lotsResponse,
        clientsResponse
      ] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getDashboardLotStatus(),
        apiService.getDashboardWorkerProductivity(),
        apiService.getDashboardInventoryUsage(),
        apiService.getClientOrders(),
        apiService.getClientLedger(),
        apiService.getLotExpenses(),
        apiService.getLots(),
        apiService.getClients()
      ]);

      // Check for errors
      if (statsResponse.error) throw new Error(statsResponse.error);
      if (lotStatusResponse.error) throw new Error(lotStatusResponse.error);
      if (workerProductivityResponse.error) throw new Error(workerProductivityResponse.error);
      if (inventoryUsageResponse.error) throw new Error(inventoryUsageResponse.error);

      // Set data from backend
      setStats(statsResponse.data);
      setLotStatusData(lotStatusResponse.data);
      setWorkerProductivityData(workerProductivityResponse.data);
      setInventoryUsageData(inventoryUsageResponse.data);

      // Compute monthly data and recent activities from raw data
      if (!ordersResponse.error && !ledgerResponse.error && !expensesResponse.error && !lotsResponse.error) {
        // Extract data arrays from nested responses
        const ordersData = extractDataArray(ordersResponse.data, 'client_orders');
        const ledgerData = extractDataArray(ledgerResponse.data, 'ledger_entries');
        const expensesData = extractDataArray(expensesResponse.data, 'lot_expenses');
        const lotsData = extractDataArray(lotsResponse.data, 'lots');
        const clientsData = extractDataArray(clientsResponse.data, 'clients');

        const computedMonthlyData = computeMonthlyData(
          ordersData,
          ledgerData,
          expensesData,
          lotsData
        );
        setMonthlyData(computedMonthlyData);

        const computedRecentActivities = computeRecentActivities(
          lotsData,
          ledgerData,
          clientsData
        );
        setRecentActivities(computedRecentActivities);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const refreshData = () => {
    fetchDashboardData();
  };

  return {
    stats,
    monthlyData,
    lotStatusData,
    workerProductivityData,
    inventoryUsageData,
    recentActivities,
    loading,
    error,
    refreshData
  };
}
