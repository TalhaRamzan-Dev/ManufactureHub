import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { EnhancedDataTable } from './components/EnhancedDataTable';
import { Button } from './components/ui/button';
import { SimpleSidebar } from './components/ui/simple-sidebar';
import { cn } from './components/ui/utils';
import { tableConfigs } from './config/tableConfigs';
import { sidebarItems } from './config/sidebarItems';
import { useDataHandlers } from './hooks/useDataHandlers';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { data, loading, errors, handleAdd, handleEdit, handleDelete, handleImport } = useDataHandlers();

  const getTableData = (tableKey: string) => {
    return data[tableKey] || [];
  };

  const getTableLoading = (tableKey: string) => {
    return loading[tableKey] || false;
  };

  const getTableError = (tableKey: string) => {
    return errors[tableKey] || null;
  };

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden">
      <SimpleSidebar>
        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <Button
                key={item.key}
                variant="ghost"
                className={cn(
                  "w-full justify-start h-10 px-3 transition-all duration-200 group",
                  isActive 
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
                onClick={() => setActiveTab(item.key)}
              >
                <Icon className={cn(
                  "mr-3 h-4 w-4 transition-transform duration-200",
                  isActive ? "scale-110" : "group-hover:scale-105"
                )} />
                <span className={cn(
                  "font-medium transition-all duration-200",
                  isActive ? "font-semibold" : "font-normal"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-sidebar-primary-foreground rounded-full" />
                )}
              </Button>
            );
          })}
        </nav>
      </SimpleSidebar>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center p-4 border-b border-border bg-card flex-shrink-0">
          {/* Sidebar toggle indicator */}
          <div className="mr-4 text-sm text-muted-foreground">
            <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+B</kbd> to toggle sidebar
          </div>
          <h1 className="text-primary">
            {activeTab === 'dashboard' ? 'Shankh Dashboard' : tableConfigs[activeTab as keyof typeof tableConfigs]?.title}
          </h1>
        </div>

        <div className="flex-1 p-4 overflow-hidden">
          {activeTab === 'dashboard' ? (
            <Dashboard />
          ) : (
            <div className="h-full">
              {getTableError(activeTab) ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-red-500 mb-2">Error Loading Data</h3>
                    <p className="text-gray-400">{getTableError(activeTab)}</p>
                  </div>
                </div>
              ) : (
                <EnhancedDataTable
                  title={tableConfigs[activeTab as keyof typeof tableConfigs]?.title || ''}
                  columns={tableConfigs[activeTab as keyof typeof tableConfigs]?.columns || []}
                  data={getTableData(activeTab)}
                  loading={getTableLoading(activeTab)}
                  onAdd={(item) => handleAdd(activeTab, item)}
                  onEdit={(id, item) => handleEdit(activeTab, id, item)}
                  onDelete={(id) => handleDelete(activeTab, id)}
                  onImport={(importedData) => handleImport(activeTab, importedData)}
                />
              )}
            </div>
          )}
          <Toaster position="top-right" className="toaster" />
        </div>
      </main>
    </div>
  );
}