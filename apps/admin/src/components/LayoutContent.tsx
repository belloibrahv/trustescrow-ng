'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from './Navigation';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  // Don't show navigation on login page or when loading
  const showNavigation = pathname !== '/login' && !loading && user;

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {showNavigation && <Navigation />}
      
      {/* Main Content with Sidebar Offset */}
      <main className={showNavigation ? 'lg:pl-64' : ''}>
        {/* Mobile Top Spacing */}
        <div className={showNavigation ? 'lg:hidden h-16' : ''}></div>
        
        <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-[1600px] mx-auto">
          {loading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl shadow-emerald-500/20 mb-4">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                </div>
                <p className="text-gray-600 font-medium">Loading dashboard...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
