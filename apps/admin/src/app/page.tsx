'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { 
  BarChart3, Users, AlertCircle, CheckCircle, TrendingUp, DollarSign, 
  Activity, ArrowUpRight, ShieldCheck, Clock, FileText
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { adminApi } from '@/lib/api';
import { useRequireAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalDeals: number;
  activeDeals: number;
  completedDeals: number;
  openDisputes: number;
  totalRevenue: number;
  todayDeals: number;
  totalUsers?: number;
}

interface WeeklyData {
  name: string;
  date: string;
  totalDeals: number;
  completedDeals: number;
  activeDeals: number;
  disputedDeals: number;
  totalValue: number;
  totalFees: number;
}

interface RecentActivity {
  id: string;
  dealRef: string;
  status: string;
  amountKobo: string;
  feeKobo: string;
  itemDescription: string;
  buyer: string;
  seller: string;
  createdAt: string;
}

interface StatusDistribution {
  status: string;
  count: number;
}

export default function DashboardPage() {
  const { loading: authLoading } = useRequireAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [metricsRes, weeklyRes, statusRes, activityRes] = await Promise.allSettled([
        adminApi.getMetrics(),
        adminApi.getWeeklyAnalytics(),
        adminApi.getStatusDistribution(),
        adminApi.getRecentActivity(),
      ]);
      
      // Handle metrics
      if (metricsRes.status === 'fulfilled') {
        setStats(metricsRes.value.data);
      } else {
        console.error('Metrics failed:', metricsRes.reason);
      }

      // Handle weekly data
      if (weeklyRes.status === 'fulfilled') {
        setWeeklyData(weeklyRes.value.data);
      } else {
        console.error('Weekly analytics failed:', weeklyRes.reason);
        setWeeklyData([]);
      }

      // Handle status distribution
      if (statusRes.status === 'fulfilled') {
        setStatusDistribution(statusRes.value.data);
      } else {
        console.error('Status distribution failed:', statusRes.reason);
        setStatusDistribution([]);
      }

      // Handle recent activity
      if (activityRes.status === 'fulfilled') {
        setRecentActivity(activityRes.value.data);
      } else {
        console.error('Recent activity failed:', activityRes.reason);
        setRecentActivity([]);
      }

      // Only set error if all requests failed
      const allFailed = [metricsRes, weeklyRes, statusRes, activityRes].every(
        (res) => res.status === 'rejected'
      );
      
      if (allFailed) {
        setError('Failed to load dashboard data. Please try refreshing the page.');
      } else {
        setError(null);
      }
    } catch (error: any) {
      console.error('Dashboard fetch error:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      fetchDashboardData();
    }
  }, [authLoading, fetchDashboardData]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600" />
          <div>
            <h3 className="text-yellow-900 font-semibold">Partial Data Load Issue</h3>
            <p className="text-yellow-700 text-sm">{error}</p>
            <p className="text-yellow-600 text-xs mt-1">Some dashboard data may be missing. Check console for details.</p>
          </div>
        </div>
      </div>
    );
  }

  const totalRevenueNGN = ((stats?.totalRevenue || 0) / 100);
  const completionRate = stats?.totalDeals ? ((stats.completedDeals / stats.totalDeals) * 100).toFixed(1) : '0';
  const disputeRate = stats?.totalDeals ? ((stats.openDisputes / stats.totalDeals) * 100).toFixed(1) : '0';

  // Ensure we have at least empty arrays for rendering
  const safeWeeklyData = weeklyData.length > 0 ? weeklyData : [];
  const safeStatusData = statusDistribution.length > 0 ? statusDistribution : [];
  const safeActivityData = recentActivity.length > 0 ? recentActivity : [];

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`₦${totalRevenueNGN.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          subtitle="Platform fees collected"
          icon={DollarSign}
          color="emerald"
          trend={`${stats?.completedDeals || 0} completed`}
        />
        <StatCard
          title="Total Deals"
          value={stats?.totalDeals || 0}
          subtitle={`${stats?.todayDeals || 0} created today`}
          icon={FileText}
          color="blue"
          trend={`${completionRate}% completion rate`}
        />
        <StatCard
          title="Active Deals"
          value={stats?.activeDeals || 0}
          subtitle="In progress"
          icon={Activity}
          color="orange"
          trend="Awaiting resolution"
        />
        <StatCard
          title="Open Disputes"
          value={stats?.openDisputes || 0}
          subtitle={`${disputeRate}% of total deals`}
          icon={AlertCircle}
          color="red"
          trend="Require attention"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Performance Chart - 8 columns */}
        <div className="lg:col-span-8">
          <WeeklyPerformanceChart data={safeWeeklyData} />
        </div>

        {/* Deal Status Distribution - 4 columns */}
        <div className="lg:col-span-4">
          <StatusDistributionChart data={safeStatusData} totalDeals={stats?.totalDeals || 0} />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Platform Stats - 4 columns */}
        <div className="lg:col-span-4">
          <PlatformStatsCard stats={stats} completionRate={completionRate} />
        </div>

        {/* Recent Activity - 8 columns */}
        <div className="lg:col-span-8">
          <RecentActivityFeed activities={safeActivityData} />
        </div>
      </div>
    </div>
  );
}

// Stat Card Component - Memoized
const StatCard = memo(function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  subtitle: string; 
  icon: any; 
  color: 'emerald' | 'blue' | 'orange' | 'red'; 
  trend: string;
}) {
  const colorClasses = {
    emerald: 'from-emerald-500 to-green-600',
    blue: 'from-blue-500 to-blue-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={cn(
          "flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br shadow-lg",
          `${colorClasses[color]}`
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-1">{subtitle}</p>
      <p className="text-xs text-gray-500 font-medium">{trend}</p>
    </div>
  );
});

// Weekly Performance Chart - Memoized
const WeeklyPerformanceChart = memo(function WeeklyPerformanceChart({ data }: { data: WeeklyData[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Weekly Deal Performance</h2>
            <p className="text-sm text-gray-600 mt-1">Last 7 days deal activity breakdown</p>
          </div>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No data available</p>
            <p className="text-gray-400 text-sm">Deal activity will appear here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Weekly Deal Performance</h2>
          <p className="text-sm text-gray-600 mt-1">Last 7 days deal activity breakdown</p>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#9ca3af' }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#9ca3af' }} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb', 
                borderRadius: '12px', 
                fontSize: '12px',
                padding: '12px'
              }}
              cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
              iconType="circle"
            />
            <Bar dataKey="completedDeals" name="Completed" fill="#10b981" radius={[8, 8, 0, 0]} />
            <Bar dataKey="activeDeals" name="Active" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            <Bar dataKey="disputedDeals" name="Disputed" fill="#ef4444" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

// Status Distribution Pie Chart - Memoized
const StatusDistributionChart = memo(function StatusDistributionChart({ data, totalDeals }: { data: StatusDistribution[]; totalDeals: number }) {
  const statusColors: Record<string, string> = {
    COMPLETED: '#10b981',
    FUNDS_HELD: '#3b82f6',
    AWAITING_CONFIRMATION: '#f59e0b',
    PAYMENT_PENDING: '#8b5cf6',
    DISPUTE_OPEN: '#ef4444',
    TERMS_AGREED: '#06b6d4',
    BOTH_VERIFIED: '#ec4899',
    INITIATED: '#6366f1',
  };

  const chartData = data.map((item) => ({
    name: item.status.replace(/_/g, ' '),
    value: item.count,
    color: statusColors[item.status] || '#9ca3af',
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Deal Status Distribution</h3>
      <p className="text-sm text-gray-600 mb-6">Current breakdown of all deals</p>
      
      <div className="flex items-center justify-center mb-6">
        <div className="relative" style={{ width: 200, height: 200 }}>
          <PieChart width={200} height={200}>
            <Pie
              data={chartData}
              cx={100}
              cy={100}
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{totalDeals}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {chartData.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-gray-700 font-medium">{item.name}</span>
            </div>
            <span className="font-bold text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// Platform Stats Card - Memoized
const PlatformStatsCard = memo(function PlatformStatsCard({ stats, completionRate }: { stats: DashboardStats | null; completionRate: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Platform Health</h3>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Verified Deals</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.completedDeals || 0}</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <Link 
            href="/deals"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 font-medium transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
          >
            View All Deals <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
});

// Recent Activity Feed - Memoized
const RecentActivityFeed = memo(function RecentActivityFeed({ activities }: { activities: RecentActivity[] }) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-800',
      FUNDS_HELD: 'bg-blue-100 text-blue-800',
      DISPUTE_OPEN: 'bg-red-100 text-red-800',
      PAYMENT_PENDING: 'bg-yellow-100 text-yellow-800',
      AWAITING_CONFIRMATION: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'COMPLETED') return '✅';
    if (status === 'DISPUTE_OPEN') return '⚠️';
    if (status === 'FUNDS_HELD') return '🔒';
    if (status === 'PAYMENT_PENDING') return '⏳';
    return '📝';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-600 mt-1">Latest deal transactions</p>
        </div>
        <Link href="/deals" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
          View all
        </Link>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <Link
              key={activity.id}
              href={`/deals/${activity.id}`}
              className="flex items-start justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100 hover:border-emerald-200"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="text-2xl">{getStatusIcon(activity.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{activity.dealRef}</p>
                    <span className={cn(
                      "px-2 py-0.5 text-xs font-semibold rounded-lg",
                      getStatusColor(activity.status)
                    )}>
                      {activity.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate mb-1">{activity.itemDescription}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>👤 {activity.buyer}</span>
                    <span>→</span>
                    <span>🛒 {activity.seller}</span>
                  </div>
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="font-bold text-gray-900 mb-1">
                  ₦{(Number(activity.amountKobo) / 100).toLocaleString('en-NG')}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
});
