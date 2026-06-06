'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, AlertCircle, Users, LogOut, User, Menu, X } from 'lucide-react';
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
        'flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
        isActive
          ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 shadow-sm border border-emerald-200'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      )}
    >
      <Icon className="w-5 h-5" />
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Logo size="sm" />
            <div>
              <span className="text-lg font-bold text-gray-900">TrustEscrow</span>
              <span className="text-lg font-bold text-emerald-600 ml-1">NG</span>
            </div>
          </Link>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100"
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
          'fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 transition-transform duration-300 flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="transition-transform group-hover:scale-105">
              <Logo size="md" />
            </div>
            <div>
              <div>
                <span className="text-xl font-bold text-gray-900">TrustEscrow</span>
                <span className="text-xl font-bold text-emerald-600 ml-1">NG</span>
              </div>
              <p className="text-xs text-gray-500 font-medium">Admin Portal</p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  'flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 shadow-sm border border-emerald-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info Section */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          {/* User Card */}
          <div className="flex items-center space-x-3 px-3 py-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-md">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.username}</p>
              <p className="text-xs text-emerald-600 font-medium">
                {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center justify-center space-x-2 w-full px-4 py-3 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-200 hover:border-red-300"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
