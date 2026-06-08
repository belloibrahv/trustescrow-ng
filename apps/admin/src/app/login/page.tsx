'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: 'username' | 'password') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError(''); // Clear error on input
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/api/admin/auth/login', formData);
      
      if (data.success && data.token) {
        localStorage.setItem('admin_token', data.token);
        router.push('/');
        router.refresh();
      } else {
        setError('Invalid response from server');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 
        'Unable to sign in. Please check your credentials and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo size="lg" variant="full" className="justify-center mb-6" theme="light" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Admin Portal
            </h1>
            <p className="text-slate-600">
              Secure access to your operations dashboard
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl shadow-xl shadow-slate-200/50 p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Display */}
            {error && (
              <ErrorMessage
                message={error}
                variant="card"
                size="sm"
                title="Authentication Failed"
                className="mb-6"
              />
            )}

            {/* Username Field */}
            <div className="space-y-2">
              <label 
                htmlFor="username" 
                className="block text-sm font-semibold text-slate-700"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange('username')}
                  disabled={loading}
                  className="block w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 bg-white/60 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className="block text-sm font-semibold text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  disabled={loading}
                  className="block w-full pl-12 pr-12 py-3.5 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 bg-white/60 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none disabled:opacity-50"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.username.trim() || !formData.password.trim()}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700 disabled:hover:shadow-blue-500/25"
            >
              {loading ? (
                <LoadingSpinner size="sm" variant="minimal" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-center text-xs text-slate-500 leading-relaxed">
              Need assistance? Contact your system administrator for access.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
