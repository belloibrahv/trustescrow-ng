'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  CheckCircle,
  Clock3,
  DollarSign,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Users,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LucideIcon } from 'lucide-react';
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

type DashboardSection = 'metrics' | 'weekly' | 'status' | 'activity';
type DashboardLoadState = 'loading' | 'ready' | 'partial' | 'error';

type BannerTone = 'success' | 'warning' | 'danger';

const panelSurface = 'rounded-[28px] border border-slate-200 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur';
const sectionLabels: Record<DashboardSection, string> = {
  metrics: 'core metrics',
  weekly: 'weekly analytics',
  status: 'status distribution',
  activity: 'recent activity',
};

function formatFailedSections(sections: DashboardSection[]) {
  return sections.map((section) => sectionLabels[section]).join(', ');
}

function formatCurrency(amountKobo: number) {
  return `₦${amountKobo.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getDashboardErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const response = (error as { response?: { data?: { error?: string; message?: string } } }).response;
    const message = response?.data?.error || response?.data?.message;
    if (message) return message;
  }

  return 'We could not reach the dashboard API. This usually means the backend is waking up, the session token expired, or an analytics query returned an error.';
}

export default function DashboardPage() {
  const { loading: authLoading } = useRequireAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadState, setLoadState] = useState<DashboardLoadState>('loading');
  const [failedSections, setFailedSections] = useState<DashboardSection[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    const blockingLoad = !silent;

    if (blockingLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const [metricsRes, weeklyRes, statusRes, activityRes] = await Promise.allSettled([
        adminApi.getMetrics(),
        adminApi.getWeeklyAnalytics(),
        adminApi.getStatusDistribution(),
        adminApi.getRecentActivity(),
      ]);

      const nextFailedSections: DashboardSection[] = [];

      if (metricsRes.status === 'fulfilled') {
        setStats(metricsRes.value.data);
      } else {
        console.error('Metrics failed:', metricsRes.reason);
        nextFailedSections.push('metrics');
      }

      if (weeklyRes.status === 'fulfilled') {
        setWeeklyData(weeklyRes.value.data);
      } else {
        console.error('Weekly analytics failed:', weeklyRes.reason);
        nextFailedSections.push('weekly');
      }

      if (statusRes.status === 'fulfilled') {
        setStatusDistribution(statusRes.value.data);
      } else {
        console.error('Status distribution failed:', statusRes.reason);
        nextFailedSections.push('status');
      }

      if (activityRes.status === 'fulfilled') {
        setRecentActivity(activityRes.value.data);
      } else {
        console.error('Recent activity failed:', activityRes.reason);
        nextFailedSections.push('activity');
      }

      setFailedSections(nextFailedSections);

      if (nextFailedSections.length === 4) {
        setLoadState('error');
        setError('We could not load any live dashboard data right now. Please retry, or check the backend service and session token.');
      } else if (nextFailedSections.length > 0) {
        setLoadState('partial');
        setError(
          `We loaded most of the dashboard, but ${formatFailedSections(nextFailedSections)} ${
            nextFailedSections.length === 1 ? 'panel is' : 'panels are'
          } temporarily unavailable.`
        );
      } else {
        setLoadState('ready');
        setError(null);
      }
    } catch (requestError) {
      console.error('Dashboard fetch error:', requestError);
      setLoadState('error');
      setError(getDashboardErrorMessage(requestError));
      setFailedSections(['metrics', 'weekly', 'status', 'activity']);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchDashboardData loads async API state on mount
      void fetchDashboardData();
    }
  }, [authLoading, fetchDashboardData]);

  const retryBlockingLoad = useCallback(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  const refreshInBackground = useCallback(() => {
    void fetchDashboardData({ silent: true });
  }, [fetchDashboardData]);

  if (authLoading || loading) {
    return <DashboardLoadingState />;
  }

  const hasRenderableData = Boolean(
    stats || weeklyData.length > 0 || statusDistribution.length > 0 || recentActivity.length > 0
  );

  if (loadState === 'error' && !hasRenderableData) {
    return (
      <DashboardFatalState
        title="Dashboard temporarily unavailable"
        message={error || 'The dashboard could not be loaded at this time.'}
        onRetry={retryBlockingLoad}
        retrying={refreshing}
      />
    );
  }

  const metricsUnavailable = failedSections.includes('metrics') && !stats;
  const weeklyUnavailable = failedSections.includes('weekly') && weeklyData.length === 0;
  const statusUnavailable = failedSections.includes('status') && statusDistribution.length === 0;
  const activityUnavailable = failedSections.includes('activity') && recentActivity.length === 0;

  const totalRevenueNGN = stats?.totalRevenue ? stats.totalRevenue / 100 : 0;
  const completionRate = stats?.totalDeals ? ((stats.completedDeals / stats.totalDeals) * 100).toFixed(1) : '0';
  const disputeRate = stats?.totalDeals ? ((stats.openDisputes / stats.totalDeals) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {loadState === 'partial' && error && (
        <DashboardBanner
          tone="warning"
          title="Partial data sync"
          message={error}
          details="The dashboard is still usable, but a few live panels need another refresh."
          actionLabel={refreshing ? 'Refreshing…' : 'Retry failed panels'}
          onAction={refreshInBackground}
          loading={refreshing}
        />
      )}

      {loadState === 'error' && hasRenderableData && error && (
        <DashboardBanner
          tone="danger"
          title="Live data connection issue"
          message={error}
          details="Previously loaded data remains visible. Refreshing again may recover the missing panels."
          actionLabel={refreshing ? 'Retrying…' : 'Try again'}
          onAction={refreshInBackground}
          loading={refreshing}
        />
      )}

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={metricsUnavailable ? '—' : formatCurrency(totalRevenueNGN)}
          subtitle={metricsUnavailable ? 'Live totals are temporarily unavailable' : 'Platform fees collected'}
          icon={DollarSign}
          color="emerald"
          trend={metricsUnavailable ? 'Retry to restore this panel' : `${stats?.completedDeals || 0} completed deals`}
          unavailable={metricsUnavailable}
        />
        <StatCard
          title="Total Deals"
          value={metricsUnavailable ? '—' : stats?.totalDeals || 0}
          subtitle={metricsUnavailable ? 'Deal count could not be refreshed' : `${stats?.todayDeals || 0} created today`}
          icon={FileText}
          color="blue"
          trend={metricsUnavailable ? 'Waiting for a fresh sync' : `${completionRate}% completion rate`}
          unavailable={metricsUnavailable}
        />
        <StatCard
          title="Active Deals"
          value={metricsUnavailable ? '—' : stats?.activeDeals || 0}
          subtitle={metricsUnavailable ? 'Operational count unavailable' : 'In progress'}
          icon={Activity}
          color="amber"
          trend={metricsUnavailable ? 'Retry to repopulate live counts' : 'Awaiting resolution'}
          unavailable={metricsUnavailable}
        />
        <StatCard
          title="Open Disputes"
          value={metricsUnavailable ? '—' : stats?.openDisputes || 0}
          subtitle={metricsUnavailable ? 'Dispute status could not be loaded' : `${disputeRate}% of total deals`}
          icon={AlertCircle}
          color="rose"
          trend={metricsUnavailable ? 'Backend sync required' : 'Needs attention'}
          unavailable={metricsUnavailable}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <WeeklyPerformanceChart
            data={weeklyData}
            isError={weeklyUnavailable}
            onRetry={refreshInBackground}
            loading={refreshing}
          />
        </div>

        <div className="xl:col-span-4">
          <StatusDistributionChart
            data={statusDistribution}
            totalDeals={stats?.totalDeals || 0}
            isError={statusUnavailable}
            onRetry={refreshInBackground}
            loading={refreshing}
          />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <PlatformStatsCard
            stats={stats}
            completionRate={completionRate}
            isError={metricsUnavailable}
            onRetry={refreshInBackground}
            loading={refreshing}
          />
        </div>

        <div className="xl:col-span-8">
          <RecentActivityFeed
            activities={recentActivity}
            isError={activityUnavailable}
            onRetry={refreshInBackground}
            loading={refreshing}
          />
        </div>
      </div>
    </div>
  );
}

function DashboardBanner({
  tone,
  title,
  message,
  details,
  actionLabel,
  onAction,
  loading,
}: {
  tone: BannerTone;
  title: string;
  message: string;
  details: string;
  actionLabel: string;
  onAction: () => void;
  loading: boolean;
}) {
  const toneStyles = {
    success: 'border-emerald-200 bg-emerald-50/90 text-emerald-950',
    warning: 'border-amber-200 bg-amber-50/90 text-amber-950',
    danger: 'border-rose-200 bg-rose-50/90 text-rose-950',
  };

  const iconStyles = {
    success: 'border-emerald-200 bg-emerald-100 text-emerald-600',
    warning: 'border-amber-200 bg-amber-100 text-amber-600',
    danger: 'border-rose-200 bg-rose-100 text-rose-600',
  };

  const Icon = tone === 'danger' ? TriangleAlert : tone === 'warning' ? AlertCircle : CheckCircle;

  return (
    <div className={cn(panelSurface, 'border-l-4 p-5', toneStyles[tone])}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border', iconStyles[tone])}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="max-w-3xl">
            <h2 className="text-base font-semibold sm:text-lg">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-700">{message}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{details}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAction}
          disabled={loading}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60',
            tone === 'danger'
              ? 'bg-slate-950 text-white hover:bg-slate-800 focus:ring-slate-200'
              : 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 focus:ring-slate-200'
          )}
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

function DashboardFatalState({
  title,
  message,
  onRetry,
  retrying,
}: {
  title: string;
  message: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-[72vh] max-w-4xl items-center">
      <div className={cn(panelSurface, 'relative w-full overflow-hidden p-8 sm:p-10')}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(244,63,94,0.1),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(15,23,42,0.04),_transparent_24%)]" />
        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-rose-200 bg-rose-50 text-rose-600 shadow-sm">
            <TriangleAlert className="h-8 w-8" />
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
            <Loader2 className={cn('h-4 w-4', retrying && 'animate-spin')} />
            Critical dashboard sync issue
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">{message}</p>

          <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
            <FallbackTip
              icon={ShieldCheck}
              title="Check the API service"
              description="The backend may still be waking up or returning a temporary error."
            />
            <FallbackTip
              icon={Clock3}
              title="Refresh the session"
              description="An expired JWT can block analytics calls and force a clean re-sync."
            />
            <FallbackTip
              icon={Sparkles}
              title="Retry after a few seconds"
              description="Transient network issues often resolve quickly on the next request."
            />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={retrying}
            >
              <RefreshCw className={cn('h-4 w-4', retrying && 'animate-spin')} />
              Retry loading
            </button>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              Return to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FallbackTip({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
          <Icon className="h-4 w-4 text-emerald-300" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

function DashboardLoadingState() {
  return (
    <div className="space-y-6">
      {/* Top Stats Cards Loading */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white/80" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <SkeletonPanel className="min-h-[28rem]" />
        </div>
        <div className="xl:col-span-4">
          <SkeletonPanel className="min-h-[28rem]" compact />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <SkeletonPanel className="min-h-[24rem]" compact />
        </div>
        <div className="xl:col-span-8">
          <SkeletonPanel className="min-h-[24rem]" />
        </div>
      </div>
    </div>
  );
}

function SkeletonPanel({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn(panelSurface, 'animate-pulse p-6', className)}>
      <div className="space-y-4">
        <div className={cn('h-5 rounded-full bg-slate-100', compact ? 'w-1/2' : 'w-1/3')} />
        <div className="h-3 w-2/3 rounded-full bg-slate-100" />
      </div>
      <div className="mt-8 space-y-4">
        {Array.from({ length: compact ? 4 : 6 }).map((_, index) => (
          <div key={index} className="h-10 rounded-2xl bg-slate-100" />
        ))}
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
  trend,
  unavailable = false,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  color: 'emerald' | 'blue' | 'amber' | 'rose';
  trend: string;
  unavailable?: boolean;
}) {
  const colorClasses = {
    emerald: 'from-emerald-500 to-emerald-600',
    blue: 'from-sky-500 to-blue-600',
    amber: 'from-amber-500 to-orange-600',
    rose: 'from-rose-500 to-rose-600',
  };

  return (
    <div
      className={cn(
        panelSurface,
        'p-6 transition-shadow hover:shadow-[0_24px_70px_rgba(15,23,42,0.08)]',
        unavailable && 'border-rose-200 bg-rose-50/70'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className={cn('text-sm font-medium', unavailable ? 'text-rose-700' : 'text-slate-600')}>
              {title}
            </p>
            {unavailable && (
              <span className="rounded-full border border-rose-200 bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">
                degraded
              </span>
            )}
          </div>
          <h3 className={cn('mt-2 text-3xl font-semibold tracking-tight sm:text-4xl', unavailable ? 'text-rose-900' : 'text-slate-950')}>
            {value}
          </h3>
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg',
            colorClasses[color]
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <p className={cn('mt-4 text-sm leading-6', unavailable ? 'text-rose-700' : 'text-slate-600')}>
        {subtitle}
      </p>
      <p className={cn('mt-2 text-xs font-semibold uppercase tracking-[0.22em]', unavailable ? 'text-rose-600' : 'text-slate-500')}>
        {trend}
      </p>
    </div>
  );
});

// Weekly Performance Chart - Memoized
const WeeklyPerformanceChart = memo(function WeeklyPerformanceChart({
  data,
  isError,
  onRetry,
  loading,
}: {
  data: WeeklyData[];
  isError: boolean;
  onRetry: () => void;
  loading: boolean;
}) {
  if (isError && data.length === 0) {
    return (
      <SectionStateCard
        icon={BarChart3}
        title="Weekly performance is unavailable"
        description="We could not load the seven-day activity breakdown from the API. Try refreshing the dashboard to re-request this panel."
        actionLabel={loading ? 'Retrying…' : 'Retry panel'}
        onAction={onRetry}
        tone="danger"
      />
    );
  }

  if (data.length === 0) {
    return (
      <SectionStateCard
        icon={BarChart3}
        title="No weekly activity yet"
        description="Once deals start flowing, the seven-day trend will appear here with completion, active, and dispute activity."
        actionLabel="Refresh dashboard"
        onAction={onRetry}
      />
    );
  }

  return (
    <div className={panelSurface + ' p-6'}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">Weekly Deal Performance</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Last 7 days deal activity breakdown</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Live trend
        </span>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                fontSize: '12px',
                padding: '12px 14px',
                boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
              }}
              cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
              iconType="circle"
            />
            <Bar dataKey="completedDeals" name="Completed" fill="#10b981" radius={[8, 8, 0, 0]} />
            <Bar dataKey="activeDeals" name="Active" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
            <Bar dataKey="disputedDeals" name="Disputed" fill="#f43f5e" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

// Status Distribution Pie Chart - Memoized
const StatusDistributionChart = memo(function StatusDistributionChart({
  data,
  totalDeals,
  isError,
  onRetry,
  loading,
}: {
  data: StatusDistribution[];
  totalDeals: number;
  isError: boolean;
  onRetry: () => void;
  loading: boolean;
}) {
  const statusColors: Record<string, string> = {
    COMPLETED: '#10b981',
    FUNDS_HELD: '#0ea5e9',
    AWAITING_CONFIRMATION: '#f59e0b',
    PAYMENT_PENDING: '#8b5cf6',
    DISPUTE_OPEN: '#f43f5e',
    TERMS_AGREED: '#06b6d4',
    BOTH_VERIFIED: '#ec4899',
    INITIATED: '#6366f1',
  };

  const chartData = data.map((item) => ({
    name: item.status.replace(/_/g, ' '),
    value: item.count,
    color: statusColors[item.status] || '#94a3b8',
  }));

  if (isError && chartData.length === 0) {
    return (
      <SectionStateCard
        icon={Activity}
        title="Status distribution unavailable"
        description="The live status breakdown could not be refreshed. This is usually a temporary API or database issue."
        actionLabel={loading ? 'Retrying…' : 'Retry panel'}
        onAction={onRetry}
        tone="danger"
      />
    );
  }

  if (chartData.length === 0) {
    return (
      <SectionStateCard
        icon={Activity}
        title="No status data yet"
        description="Status distribution will populate automatically as deals move through the escrow lifecycle."
        actionLabel="Refresh dashboard"
        onAction={onRetry}
      />
    );
  }

  return (
    <div className={panelSurface + ' p-6'}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">Deal Status Distribution</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">Current breakdown of all deals</p>
      </div>

      <div className="flex items-center justify-center">
        <div className="relative" style={{ width: 220, height: 220 }}>
          <PieChart width={220} height={220}>
            <Pie
              data={chartData}
              cx={110}
              cy={110}
              innerRadius={68}
              outerRadius={96}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-semibold tracking-tight text-slate-950">{totalDeals}</div>
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Total</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2 max-h-56 overflow-y-auto pr-1">
        {chartData.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="font-medium text-slate-700">{item.name}</span>
            </div>
            <span className="font-semibold text-slate-950">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// Platform Stats Card - Memoized
const PlatformStatsCard = memo(function PlatformStatsCard({
  stats,
  completionRate,
  isError,
  onRetry,
  loading,
}: {
  stats: DashboardStats | null;
  completionRate: string;
  isError: boolean;
  onRetry: () => void;
  loading: boolean;
}) {
  if (isError && !stats) {
    return (
      <SectionStateCard
        icon={ShieldCheck}
        title="Platform health unavailable"
        description="We could not load the live platform metrics. Use the retry action to re-check the backend and repopulate this summary."
        actionLabel={loading ? 'Retrying…' : 'Retry panel'}
        onAction={onRetry}
        tone="danger"
      />
    );
  }

  return (
    <div className={panelSurface + ' p-6'}>
      <h3 className="text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">Platform Health</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">Operational signals for the escrow platform</p>

      <div className="mt-6 space-y-4">
        <MetricRow
          icon={CheckCircle}
          label="Success Rate"
          value={`${completionRate}%`}
          tone="emerald"
        />
        <MetricRow
          icon={Users}
          label="Total Users"
          value={stats?.totalUsers || 0}
          tone="blue"
        />
        <MetricRow
          icon={ShieldCheck}
          label="Verified Deals"
          value={stats?.completedDeals || 0}
          tone="violet"
        />
      </div>

      <div className="mt-6 border-t border-slate-200 pt-4">
        <Link
          href="/deals"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          View all deals
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
});

function MetricRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: 'emerald' | 'blue' | 'violet';
}) {
  const toneClasses = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-sky-100 text-sky-600',
    violet: 'bg-violet-100 text-violet-600',
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', toneClasses[tone])}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      </div>
    </div>
  );
}

// Recent Activity Feed - Memoized
const RecentActivityFeed = memo(function RecentActivityFeed({
  activities,
  isError,
  onRetry,
  loading,
}: {
  activities: RecentActivity[];
  isError: boolean;
  onRetry: () => void;
  loading: boolean;
}) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      FUNDS_HELD: 'bg-sky-100 text-sky-800 border-sky-200',
      DISPUTE_OPEN: 'bg-rose-100 text-rose-800 border-rose-200',
      PAYMENT_PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
      AWAITING_CONFIRMATION: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  if (isError && activities.length === 0) {
    return (
      <SectionStateCard
        icon={Clock3}
        title="Recent activity unavailable"
        description="The live activity feed could not be loaded. Retry the dashboard to fetch the most recent transaction events."
        actionLabel={loading ? 'Retrying…' : 'Retry feed'}
        onAction={onRetry}
        tone="danger"
      />
    );
  }

  if (activities.length === 0) {
    return (
      <SectionStateCard
        icon={Clock3}
        title="No recent activity yet"
        description="Once new deals are created, this feed will surface the latest escrow actions and transaction updates."
        actionLabel="Refresh dashboard"
        onAction={onRetry}
      />
    );
  }

  return (
    <div className={panelSurface + ' p-6'}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">Recent Activity</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">Latest deal transactions</p>
        </div>
        <Link href="/deals" className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-700">
          View all
        </Link>
      </div>

      <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            href={`/deals/${activity.id}`}
            className="flex items-start justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-lg shadow-lg shadow-slate-950/10">
                {getStatusIcon(activity.status)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-950">{activity.dealRef}</p>
                  <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em]', getStatusColor(activity.status))}>
                    {activity.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="mb-1 truncate text-sm text-slate-600">{activity.itemDescription}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>👤 {activity.buyer}</span>
                  <span>→</span>
                  <span>🛒 {activity.seller}</span>
                </div>
              </div>
            </div>
            <div className="ml-4 text-right">
              <p className="mb-1 font-semibold text-slate-950">{formatCurrency(Number(activity.amountKobo))}</p>
              <p className="text-xs text-slate-500">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
});

function getStatusIcon(status: string) {
  if (status === 'COMPLETED') return '✅';
  if (status === 'DISPUTE_OPEN') return '⚠️';
  if (status === 'FUNDS_HELD') return '🔒';
  if (status === 'PAYMENT_PENDING') return '⏳';
  return '📝';
}

function SectionStateCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  tone = 'neutral',
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'danger';
}) {
  const toneClasses = {
    neutral: 'border-slate-200 bg-slate-50/70 text-slate-700',
    danger: 'border-rose-200 bg-rose-50/80 text-rose-800',
  };

  const iconClasses = {
    neutral: 'border-slate-200 bg-white text-slate-500',
    danger: 'border-rose-200 bg-rose-100 text-rose-600',
  };

  return (
    <div className={cn(panelSurface, 'flex min-h-[22rem] items-center justify-center p-6', toneClasses[tone])}>
      <div className="mx-auto max-w-md text-center">
        <div className={cn('mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border', iconClasses[tone])}>
          <Icon className="h-7 w-7" />
        </div>
        <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200"
          >
            <RefreshCw className="h-4 w-4" />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
