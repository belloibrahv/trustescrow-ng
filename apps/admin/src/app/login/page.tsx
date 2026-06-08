'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { api } from '@/lib/api';

const benefits = [
  'Review deals, disputes, and user activity in one workspace',
  'JWT-protected access for trusted administrators only',
  'Accessible interface with strong contrast and keyboard support',
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/api/admin/auth/login', { username, password });
      localStorage.setItem('admin_token', data.token);
      router.push('/');
      router.refresh();
    } catch (err) {
      const errorMessage =
        (err as any)?.response?.data?.error ||
        'Unable to sign in. Please check your credentials and try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center">
        <section className="grid w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:grid-cols-[1.05fr_0.95fr]">
          {/* Brand panel */}
          <aside className="relative hidden flex-col justify-between border-b border-slate-200 bg-slate-950 px-8 py-10 text-white lg:flex lg:px-10 xl:px-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_34%)]" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-emerald-100">
                <ShieldCheck className="h-4 w-4" />
                TrustEscrow NG Admin
              </div>

              <div className="mt-10 flex items-center gap-4">
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 backdrop-blur-sm">
                  <Logo size="md" className="brightness-0 invert" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-200/80">
                    Trusted operations
                  </p>
                  <h1 className="mt-2 max-w-md text-4xl font-semibold leading-tight tracking-tight text-white">
                    Manage escrow operations with speed, confidence, and clarity.
                  </h1>
                </div>
              </div>

              <p className="mt-6 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
                A focused workspace for monitoring deals, reviewing disputes, and keeping every
                administrative action secure and auditable.
              </p>
            </div>

            <div className="relative z-10 space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3 rounded-2xl bg-white/5 px-4 py-4 ring-1 ring-white/10">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-300" />
                  <p className="text-sm leading-6 text-slate-200">{benefit}</p>
                </div>
              ))}
            </div>
          </aside>

          {/* Form panel */}
          <section className="flex flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 lg:px-10 xl:px-12">
            <div className="mx-auto w-full max-w-md lg:max-w-lg">
              <div className="mb-8 lg:hidden">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                  TrustEscrow NG Admin
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <Logo size="md" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-600">
                      Secure sign in
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                      Welcome back
                    </h1>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-600">
                  Administrator access
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                  Welcome back
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Sign in with your assigned admin credentials to continue.
                </p>
              </div>

              <form
                onSubmit={handleLogin}
                className="mt-8 space-y-5"
                aria-describedby={error ? 'login-error login-help' : 'login-help'}
              >
                {error && (
                  <div
                    id="login-error"
                    role="alert"
                    aria-live="assertive"
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                      <div>
                        <p className="text-sm font-semibold text-red-900">Sign-in failed</p>
                        <p className="mt-1 text-sm leading-6 text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                    Username
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? 'login-error login-help' : 'login-help'}
                      className="block w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-base text-slate-900 placeholder:text-slate-400 shadow-sm transition duration-200 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                      placeholder="Enter your username"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                      aria-pressed={showPassword}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? 'login-error login-help' : 'login-help'}
                      className="block w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-base text-slate-900 placeholder:text-slate-400 shadow-sm transition duration-200 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Protected with JWT authentication
                  </span>
                  <span className="hidden font-medium text-slate-500 sm:inline">
                    Accessible keyboard flow
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-slate-950/10 transition duration-200 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in to dashboard
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              <p id="login-help" className="mt-6 text-sm leading-6 text-slate-500">
                Need help accessing the dashboard? Contact your platform administrator for access.
              </p>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
