import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  Factory, 
  Package, 
  DollarSign, 
  BookOpen, 
  FileText,
  UserCheck
} from 'lucide-react';

export const sidebarItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'clients', label: 'Clients', icon: Users },
  { key: 'clientOrders', label: 'Client Orders', icon: ShoppingCart },
  { key: 'lots', label: 'Lots', icon: Factory },
  { key: 'workers', label: 'Workers', icon: UserCheck },
  { key: 'lotWorkers', label: 'Lot Workers', icon: Users },
  { key: 'inventory', label: 'Inventory', icon: Package },
  { key: 'lotExpenses', label: 'Lot Expenses', icon: DollarSign },
  { key: 'clientLedger', label: 'Client Ledger', icon: BookOpen },
  { key: 'dayBook', label: 'Day Book', icon: FileText },
];