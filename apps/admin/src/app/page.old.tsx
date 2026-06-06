'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Users, AlertCircle, CheckCircle, TrendingUp, DollarSign, Activity, Calendar } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useRequireAuth } from '@/lib/auth';

interface DashboardStats {
  totalDeals: number;
  activeDeals: number;
  completedDeals: number;
  openDisputes: number;
  totalRevenue: number;
  todayDeals: number;
  totalUsers?: number;
}

export default function DashboardPage() {
  const { loading: authLoading } = useRequireAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      fetchStats();
    }
  }, [authLoading]);

  const fetchStats = async () => {
    try {
      const { data } = await adminApi.getMetrics();
      setStats(data);
      setError(null);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard data');
      // Set default values to show UI structure
      setStats({
        totalDeals: 0,
        activeDeals: 0,
        completedDeals: 0,
        openDisputes: 0,
        totalRevenue: 0,
        todayDeals: 0,
        totalUsers: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
        >
          <Activity className="w-4 h-4" />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3" />
            <div>
              <p className="text-sm font-medium text-amber-900">Database Connection Issue</p>
              <p className="text-sm text-amber-700 mt-1">{error}</p>
              <p className="text-xs text-amber-600 mt-2">Showing demo data. Check your database connection in .env.development</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<BarChart3 className="w-6 h-6" />}
          title="Total Deals"
          value={stats?.totalDeals || 0}
          subtitle={`${stats?.todayDeals || 0} created today`}
          color="blue"
          trend={stats?.todayDeals ? '+' + stats.todayDeals : undefined}
        />
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          title="Active Deals"
          value={stats?.activeDeals || 0}
          subtitle="Currently in progress"
          color="purple"
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6" />}
          title="Completed"
          value={stats?.completedDeals || 0}
          subtitle="Successfully closed"
          color="green"
        />
        <StatCard
          icon={<AlertCircle className="w-6 h-6" />}
          title="Open Disputes"
          value={stats?.openDisputes || 0}
          subtitle="Needs attention"
          color="red"
          urgent={stats ? stats.openDisputes > 0 : false}
        />
      </div>

      {/* Revenue and Users Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-xl shadow-emerald-500/30 p-8 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-32 h-32 bg-white rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm">
                <DollarSign className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
            <h2 className="text-lg font-medium opacity-90 mb-2">Total Revenue</h2>
            <div className="text-4xl font-bold mb-1">
              ₦{((stats?.totalRevenue || 0) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-emerald-100 text-sm">Platform fees collected from completed deals</p>
          </div>
        </div>

        {/* Users Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-50"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg shadow-blue-500/30">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center space-x-2 text-sm font-medium text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>All time</span>
              </div>
            </div>
            <h2 className="text-lg font-medium text-gray-600 mb-2">Total Users</h2>
            <div className="text-4xl font-bold text-gray-900 mb-1">
              {(stats?.totalUsers || 0).toLocaleString()}
            </div>
            <p className="text-gray-500 text-sm">Verified users on the platform</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            href="/deals"
            icon={<BarChart3 className="w-5 h-5" />}
            title="View All Deals"
            description="Manage escrow transactions"
            color="blue"
          />
          <QuickActionCard
            href="/disputes"
            icon={<AlertCircle className="w-5 h-5" />}
            title="Resolve Disputes"
            description="Handle open disputes"
            color="red"
            badge={stats?.openDisputes}
          />
          <QuickActionCard
            href="/users"
            icon={<Users className="w-5 h-5" />}
            title="User Management"
            description="Search and verify users"
            color="purple"
          />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
  color: 'blue' | 'purple' | 'green' | 'red';
  trend?: string;
  urgent?: boolean;
}

function StatCard({ icon, title, value, subtitle, color, trend, urgent }: StatCardProps) {
  const colors = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
    green: 'from-emerald-500 to-green-600 shadow-emerald-500/30',
    red: 'from-red-500 to-red-600 shadow-red-500/30',
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all ${urgent ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center justify-center w-12 h-12 bg-gradient-to-br ${colors[color]} rounded-xl shadow-lg`}>
          <div className="text-white">{icon}</div>
        </div>
        {trend && (
          <span className="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value.toLocaleString()}</p>
      <p className="text-gray-500 text-sm">{subtitle}</p>
    </div>
  );
}

interface QuickActionCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'blue' | 'red' | 'purple';
  badge?: number;
}

function QuickActionCard({ href, icon, title, description, color, badge }: QuickActionCardProps) {
  const colors = {
    blue: 'from-blue-500 to-blue-600 hover:shadow-blue-500/30',
    red: 'from-red-500 to-red-600 hover:shadow-red-500/30',
    purple: 'from-purple-500 to-purple-600 hover:shadow-purple-500/30',
  };

  return (
    <a
      href={href}
      className="flex items-start space-x-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all group"
    >
      <div className={`flex items-center justify-center w-10 h-10 bg-gradient-to-br ${colors[color]} rounded-lg shadow-lg text-white flex-shrink-0 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {badge !== undefined && badge > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </a>
  );
}
