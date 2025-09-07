const API_BASE_URL = '/api';

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.description || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Generic CRUD operations
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Specific API endpoints
  async getClients() {
    return this.get('/clients');
  }

  async createClient(clientData: any) {
    return this.post('/clients', clientData);
  }

  async updateClient(clientId: number, clientData: any) {
    return this.put(`/clients/${clientId}`, clientData);
  }

  async deleteClient(clientId: number) {
    return this.delete(`/clients/${clientId}`);
  }

  async getClientOrders() {
    return this.get('/client_orders');
  }

  async createClientOrder(orderData: any) {
    return this.post('/client_orders', orderData);
  }

  async updateClientOrder(orderId: number, orderData: any) {
    return this.put(`/client_orders/${orderId}`, orderData);
  }

  async deleteClientOrder(orderId: number) {
    return this.delete(`/client_orders/${orderId}`);
  }

  async getLots() {
    return this.get('/lots');
  }

  async createLot(lotData: any) {
    return this.post('/lots', lotData);
  }

  async updateLot(lotId: number, lotData: any) {
    return this.put(`/lots/${lotId}`, lotData);
  }

  async deleteLot(lotId: number) {
    return this.delete(`/lots/${lotId}`);
  }

  async getWorkers() {
    return this.get('/workers');
  }

  async createWorker(workerData: any) {
    return this.post('/workers', workerData);
  }

  async updateWorker(workerId: number, workerData: any) {
    return this.put(`/workers/${workerId}`, workerData);
  }

  async deleteWorker(workerId: number) {
    return this.delete(`/workers/${workerId}`);
  }

  async getLotWorkers() {
    return this.get('/lot_workers');
  }

  async createLotWorker(lotWorkerData: any) {
    return this.post('/lot_workers', lotWorkerData);
  }

  async updateLotWorker(lotWorkerId: number, lotWorkerData: any) {
    return this.put(`/lot_workers/${lotWorkerId}`, lotWorkerData);
  }

  async deleteLotWorker(lotWorkerId: number) {
    return this.delete(`/lot_workers/${lotWorkerId}`);
  }

  async getInventory() {
    return this.get('/inventory');
  }

  async createInventory(inventoryData: any) {
    return this.post('/inventory', inventoryData);
  }

  async updateInventory(inventoryId: number, inventoryData: any) {
    return this.put(`/inventory/${inventoryId}`, inventoryData);
  }

  async deleteInventory(inventoryId: number) {
    return this.delete(`/inventory/${inventoryId}`);
  }

  async getLotExpenses() {
    return this.get('/lot_expenses');
  }

  async createLotExpense(expenseData: any) {
    return this.post('/lot_expenses', expenseData);
  }

  async updateLotExpense(expenseId: number, expenseData: any) {
    return this.put(`/lot_expenses/${expenseId}`, expenseData);
  }

  async deleteLotExpense(expenseId: number) {
    return this.delete(`/lot_expenses/${expenseId}`);
  }

  async getClientLedger() {
    return this.get('/client_ledger');
  }

  async createClientLedger(ledgerData: any) {
    return this.post('/client_ledger', ledgerData);
  }

  async updateClientLedger(paymentId: number, ledgerData: any) {
    return this.put(`/client_ledger/${paymentId}`, ledgerData);
  }

  async deleteClientLedger(paymentId: number) {
    return this.delete(`/client_ledger/${paymentId}`);
  }

  async downloadClientLedgerInvoice(paymentId: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/client_ledger/${paymentId}/pdf`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ledger_${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { data: 'Invoice downloaded successfully' };
    } catch (error) {
      console.error('Invoice download failed:', error);
      return { error: error instanceof Error ? error.message : 'Failed to download invoice' };
    }
  }

  async getDayBook() {
    return this.get('/day_book');
  }

  async createDayBook(dayBookData: any) {
    return this.post('/day_book', dayBookData);
  }

  async updateDayBook(transactionId: number, dayBookData: any) {
    return this.put(`/day_book/${transactionId}`, dayBookData);
  }

  async deleteDayBook(transactionId: number) {
    return this.delete(`/day_book/${transactionId}`);
  }

  async getDashboardStats() {
    return this.get('/dashboard/stats');
  }

  async getDashboardMonthlyData() {
    return this.get('/dashboard/monthly-data');
  }

  async getDashboardLotStatus() {
    return this.get('/dashboard/lot-status');
  }

  async getDashboardWorkerProductivity() {
    return this.get('/dashboard/worker-productivity');
  }

  async getDashboardInventoryUsage() {
    return this.get('/dashboard/inventory-usage');
  }

  async getDashboardRecentActivities() {
    return this.get('/dashboard/recent-activities');
  }

  async getLookups(view: string) {
    return this.get(`/lookups/${view}`);
  }

  async importData(table: string, data: any[]) {
    return this.post(`/import/${table}`, { data });
  }

  async exportData(table: string) {
    return this.get(`/export/${table}`);
  }
}

export const apiService = new ApiService();
