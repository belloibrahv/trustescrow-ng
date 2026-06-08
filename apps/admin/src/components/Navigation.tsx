'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, AlertCircle, Users, LogOut, User, Menu, X, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth';
import { useState, useCallback, memo } from 'react';
import { Logo } from './Logo';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/deals', label: 'Deals', icon: FileText },
  { href: '/disputes', label: 'Disputes', icon: AlertCircle },
  { href: '/users', label: 'Users', icon: Users },
];

// Memoize NavItem to prevent re-renders
const NavItem = memo(({ 
  item, 
  isActive, 
  onClick 
}: { 
  item: typeof navItems[0]; 
  isActive: boolean; 
  onClick: () => void;
}) => {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={clsx(
        'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200',
        isActive
          ? 'border border-white/10 bg-white/10 text-white shadow-[0_16px_40px_rgba(15,23,42,0.22)] ring-1 ring-white/5'
          : 'text-slate-300 hover:bg-white/5 hover:text-white'
      )}
    >
      <Icon className={clsx('h-5 w-5 transition-transform duration-200 group-hover:scale-105', isActive ? 'text-emerald-300' : 'text-slate-400')} />
      <span>{item.label}</span>
    </Link>
  );
});

NavItem.displayName = 'NavItem';

export function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-950/95 px-4 py-3 text-white backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="rounded-xl bg-white/10 p-1.5 ring-1 ring-white/10">
              <Logo size="sm" theme="dark" />
            </div>
            <div className="leading-tight">
              <span className="block text-base font-semibold tracking-tight text-white">TrustEscrow NG</span>
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-emerald-300/80">Admin portal</span>
            </div>
          </Link>
          <button
            onClick={toggleSidebar}
            className="rounded-xl p-2 text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-gray-900/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-slate-950/95 text-white shadow-[0_24px_90px_rgba(2,6,23,0.45)] backdrop-blur-xl transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.06),_transparent_36%)]" />

        {/* Logo Section */}
        <div className="relative border-b border-white/10 p-6">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="rounded-2xl bg-white/10 p-2 ring-1 ring-white/10 transition-transform group-hover:scale-105">
              <Logo size="md" theme="dark" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold tracking-tight text-white">TrustEscrow</span>
                <span className="text-xl font-semibold tracking-tight text-emerald-300">NG</span>
              </div>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-400">Admin command center</p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="relative flex-1 space-y-2 overflow-y-auto px-4 py-5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <NavItem
                key={item.href}
                item={item}
                isActive={isActive}
                onClick={closeSidebar}
              />
            );
          })}
        </nav>

        {/* User Info Section */}
        <div className="relative space-y-4 border-t border-white/10 p-4">
          {/* User Card */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 shadow-[0_16px_40px_rgba(2,6,23,0.2)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.username}</p>
              <p className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition-all hover:border-rose-400/30 hover:bg-rose-500/15 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
