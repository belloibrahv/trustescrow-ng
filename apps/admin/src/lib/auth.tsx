'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AdminUser {
  id: string;
  username: string;
  role: 'admin' | 'super_admin';
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = useCallback(async (token: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Invalid token');
      }

      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      // Token is invalid, remove it
      localStorage.removeItem('admin_token');
      setUser(null);
      if (pathname !== '/login') {
        router.push('/login');
      }
    }
  }, [pathname, router]);

  const login = useCallback(async (token: string) => {
    localStorage.setItem('admin_token', token);
    await fetchUser(token);
    router.push('/');
  }, [fetchUser, router]);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    setUser(null);
    router.push('/login');
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    
    if (!token) {
      setLoading(false);
      if (pathname !== '/login') {
        router.push('/login');
      }
      return;
    }

    fetchUser(token).finally(() => setLoading(false));
  }, []); // Only run once on mount

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected pages
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, router, pathname]);

  return { user, loading };
}
