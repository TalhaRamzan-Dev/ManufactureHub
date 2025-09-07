import { apiService } from './api';

export interface LookupData {
  [key: string]: any[];
}

class LookupService {
  private cache: Map<string, any[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private setCache(key: string, data: any[]): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  async getLookupData(table: string): Promise<any[]> {
    // Check cache first
    if (this.cache.has(table) && this.isCacheValid(table)) {
      return this.cache.get(table)!;
    }

    try {
      let response;
      
      // Use direct API calls instead of lookup views for better reliability
      switch (table) {
        case 'clients':
          response = await apiService.getClients();
          break;
        case 'clientOrders':
          response = await apiService.getClientOrders();
          break;
        case 'lots':
          response = await apiService.getLots();
          break;
        case 'workers':
          response = await apiService.getWorkers();
          break;
        default:
          console.error(`No API mapping found for table: ${table}`);
          return [];
      }

      if (response.error) {
        throw new Error(response.error);
      }

      // Handle nested response structure from backend
      let data: any[] = [];
      if (response.data) {
        // Check if response has nested structure (e.g., {clients: [...]})
        const tableKey = Object.keys(response.data).find(key => 
          key.includes(table.replace('_', '')) || 
          key === table || 
          key === table.slice(0, -1) // Handle singular/plural
        );
        
        if (tableKey && Array.isArray(response.data[tableKey])) {
          data = response.data[tableKey];
        } else if (Array.isArray(response.data)) {
          // Direct array response
          data = response.data;
        } else {
          // Try to find any array in the response
          const arrayKey = Object.keys(response.data).find(key => Array.isArray(response.data[key]));
          if (arrayKey) {
            data = response.data[arrayKey];
          }
        }
      }
      
      this.setCache(table, data);
      return data;
    } catch (error) {
      console.error(`Failed to fetch lookup data for ${table}:`, error);
      return [];
    }
  }

  async getLookupOptions(table: string, displayField: string, secondaryField?: string): Promise<{ value: string; label: string; secondary?: string }[]> {
    const data = await this.getLookupData(table);
    
    return data.map(item => {
      // Find the ID field dynamically
      const idField = Object.keys(item).find(key => 
        key.includes('_id') || key === 'id'
      ) || 'id';
      
      return {
        value: item[idField]?.toString() || '',
        label: item[displayField] || item.name || 'Unknown',
        secondary: secondaryField ? item[secondaryField] : undefined
      };
    });
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  clearCacheForTable(table: string): void {
    this.cache.delete(table);
    this.cacheExpiry.delete(table);
  }
}

export const lookupService = new LookupService();
