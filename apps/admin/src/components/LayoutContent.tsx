'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Navigation } from './Navigation';
import { useAuth } from '@/lib/auth';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';

export function LayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  // Don't show navigation on login page or when loading
  const showNavigation = pathname !== '/login' && !loading && user;

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.08),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.04),_transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-grid-slate-100 opacity-35 [mask-image:linear-gradient(to_bottom,black,transparent_92%)]" />
      {showNavigation && <Navigation />}
      
      {/* Main Content with Sidebar Offset */}
      <main className={showNavigation ? 'relative lg:pl-72' : 'relative'}>
        {/* Mobile Top Spacing */}
        <div className={showNavigation ? 'h-20 lg:hidden' : ''}></div>
        
        <div className="relative px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {loading ? (
            <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
              <div className="w-full overflow-hidden rounded-[30px] border border-white/70 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-3xl bg-slate-950 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
                    <Logo size="md" theme="dark" />
                  </div>
                  <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                    <ShieldCheck className="h-4 w-4" />
                    Securing your workspace
                  </div>
                  <div className="mt-6 flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                    <p className="text-base font-medium text-slate-700">Loading dashboard data...</p>
                  </div>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                    Preparing your admin workspace and checking live service status. This usually
                    takes only a moment.
                  </p>
                  <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-100/80" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-[1600px]">{children}</div>
          )}
        </div>
      </main>
    </div>
  );
}
