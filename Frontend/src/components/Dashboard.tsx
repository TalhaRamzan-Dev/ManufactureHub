import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Factory, Users, Package, DollarSign, Clock, TrendingUp, AlertTriangle, CheckCircle, Wrench, ShoppingCart } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { Skeleton } from './ui/skeleton';

export function Dashboard() {
  const {
    stats,
    monthlyData,
    lotStatusData,
    workerProductivityData,
    inventoryUsageData,
    recentActivities,
    loading,
    error
  } = useDashboardData();

  // Calculate computed values for financial summary
  const calculateFinancialSummary = () => {
    if (!monthlyData.length) return { totalRevenue: 0, totalExpenses: 0, netProfit: 0, pendingPayments: 0 };
    
    const totalRevenue = monthlyData.reduce((sum, month) => sum + month.revenue, 0);
    const totalExpenses = monthlyData.reduce((sum, month) => sum + month.expenses, 0);
    const netProfit = totalRevenue - totalExpenses;
    const pendingPayments = stats?.total_revenue ? stats.total_revenue * 0.4 : 0; // Estimate 40% as pending
    
    return { totalRevenue, totalExpenses, netProfit, pendingPayments };
  };

  const financialSummary = calculateFinancialSummary();

  // Get top performing workers
  const topWorkers = workerProductivityData
    .filter(worker => worker.unitsProduced > 0)
    .sort((a, b) => b.unitsProduced - a.unitsProduced)
    .slice(0, 3);

  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="space-y-4">
          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="pt-0">
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="pt-0">
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary Cards Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="flex justify-between items-center">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="bg-card border-border max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Error Loading Dashboard</h3>
              <p className="text-gray-400">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-4">
        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats?.total_clients || 0}</div>
              <p className="text-xs text-gray-300">
                Active business partners
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Active Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats?.active_orders || 0}</div>
              <p className="text-xs text-gray-300">
                Orders in production
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Production Lots</CardTitle>
              <Factory className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats?.ongoing_lots || 0}</div>
              <p className="text-xs text-gray-300">
                Active production lots
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Active Workers</CardTitle>
              <Wrench className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{workerProductivityData.filter(w => w.unitsProduced > 0).length}</div>
              <p className="text-xs text-gray-300">
                Production team members
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">Revenue vs Expenses</CardTitle>
              <CardDescription className="text-sm text-gray-300">Monthly financial overview</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#ffd700" />
                  <YAxis stroke="#ffd700" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #ffd700',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontWeight: '500'
                    }}
                    labelStyle={{ color: '#ffd700', fontWeight: '600' }}
                    formatter={(value: number, name: string) => [
                      name === 'revenue' || name === 'expenses' ? `${value.toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenue' : name === 'expenses' ? 'Expenses' : name
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#ffd700" name="revenue" />
                  <Bar dataKey="expenses" fill="#ffed4a" name="expenses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">Lot Status Distribution</CardTitle>
              <CardDescription className="text-sm text-gray-300">Current status of production lots</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={lotStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {lotStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #ffd700',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontWeight: '500'
                    }}
                    labelStyle={{ color: '#ffd700', fontWeight: '600' }}
                    itemStyle={{ color: '#ffffff' }}
                    formatter={(value: number, name: string) => [
                      `${value} lots`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">Worker Productivity</CardTitle>
              <CardDescription className="text-sm text-gray-300">Units produced by each worker</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={workerProductivityData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" stroke="#ffd700" />
                  <YAxis dataKey="name" type="category" stroke="#ffd700" width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #ffd700',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontWeight: '500'
                    }}
                    labelStyle={{ color: '#ffd700', fontWeight: '600' }}
                    itemStyle={{ color: '#ffffff' }}
                    formatter={(value: number) => [`${value} units`, 'Units Produced']}
                  />
                  <Bar dataKey="unitsProduced" fill="#ffd700" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">Inventory Usage Trends</CardTitle>
              <CardDescription className="text-sm text-gray-300">Material consumption and availability</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={inventoryUsageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="material" stroke="#ffd700" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#ffd700" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #ffd700',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontWeight: '500'
                    }}
                    labelStyle={{ color: '#ffd700', fontWeight: '600' }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                  <Bar dataKey="used" fill="#ffd700" name="Used" />
                  <Bar dataKey="remaining" fill="#ffed4a" name="Remaining" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">Recent Activities</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {recentActivities.slice(0, 4).map((activity, index) => {
                  const IconComponent = getActivityIcon(activity.icon);
                  const timeAgo = getTimeAgo(activity.timestamp);
                  
                  return (
                    <div key={index} className="flex items-center space-x-2">
                      <IconComponent className={`h-4 w-4 flex-shrink-0 ${activity.color}`} />
                      <div className="text-sm min-w-0">
                        <p className="truncate text-white">{activity.title}</p>
                        <p className="text-gray-400 text-xs">{activity.subtitle || timeAgo}</p>
                      </div>
                    </div>
                  );
                })}
                {recentActivities.length === 0 && (
                  <div className="text-sm text-gray-400">No recent activities</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">Top Performing Workers</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {topWorkers.map((worker, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-white truncate mr-2">{worker.name}</span>
                    <div className="text-right flex-shrink-0">
                      <span className="text-primary text-sm">{worker.unitsProduced} units</span>
                      <p className="text-xs text-gray-400">{worker.efficiency}% efficiency</p>
                    </div>
                  </div>
                ))}
                {topWorkers.length === 0 && (
                  <div className="text-sm text-gray-400">No worker data available</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">Total Revenue</span>
                  <span className="text-primary text-sm font-medium">PKR {financialSummary.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">Total Expenses</span>
                  <span className="text-red-400 text-sm font-medium">PKR {financialSummary.totalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">Net Profit</span>
                  <span className="text-green-400 text-sm font-medium">PKR {financialSummary.netProfit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">Pending Payments</span>
                  <span className="text-yellow-400 text-sm font-medium">PKR {financialSummary.pendingPayments.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper function to get activity icon component
function getActivityIcon(iconName: string) {
  const iconMap: Record<string, any> = {
    CheckCircle,
    Clock,
    AlertTriangle,
    DollarSign,
    TrendingUp,
    Factory,
    Users,
    Package
  };
  return iconMap[iconName] || CheckCircle;
}

// Helper function to format time ago
function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffInHours = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return '1 day ago';
  return `${diffInDays} days ago`;
}