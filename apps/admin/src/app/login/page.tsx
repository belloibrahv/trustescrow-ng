'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Lock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { api } from '@/lib/api';

const highlights = [
  {
    icon: ShieldCheck,
    title: 'Secure admin access',
    description: 'JWT-protected sign-in for trusted operators and reviewers.',
  },
  {
    icon: FileText,
    title: 'Deal visibility',
    description: 'Review transactions, statuses, and platform activity in one place.',
  },
  {
    icon: MessageSquare,
    title: 'Dispute oversight',
    description: 'Keep message history and resolution workflows easy to follow.',
  },
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
        'Unable to sign in. Check your credentials or try again in a moment.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-900">
      {/* Decorative background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.16),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]" />
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-green-400/10 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Brand / value panel */}
          <section className="flex flex-col justify-between rounded-[2rem] border border-white/60 bg-white/85 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur xl:p-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                <Sparkles className="h-4 w-4" />
                TrustEscrow NG Admin Console
              </div>

              <div className="mt-8 flex items-center gap-4">
                <Logo size="lg" className="transition-transform duration-300 hover:scale-105" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-600">
                    Secure operations
                  </p>
                  <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                    Manage escrow activity with clarity, confidence, and speed.
                  </h1>
                </div>
              </div>

              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Monitor deals, review disputes, and keep every administrative action auditable.
                The interface is designed for busy operators with accessibility, readability,
                and fast decision-making in mind.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="mt-4 text-sm font-semibold text-slate-900">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Built for administrators
                  </p>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                    Clean typography, strong contrast, visible focus states, and larger touch targets
                    help make the dashboard easier to use for everyone.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm">
                  <ShieldCheck className="h-4 w-4" />
                  Accessible by design
                </div>
              </div>
            </div>
          </section>

          {/* Form panel */}
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 sm:p-8 lg:p-10">
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/25">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
                    Administrator sign in
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">Welcome back</h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Sign in with your assigned admin credentials to continue. If you do not have access,
                contact your operations lead.
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="space-y-5"
              aria-describedby={error ? 'login-error login-help' : 'login-help'}
            >
              {error && (
                <div
                  id="login-error"
                  role="alert"
                  aria-live="assertive"
                  className="rounded-2xl border border-red-200 bg-red-50 p-4"
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

              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-700">
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
                    className="block w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 shadow-sm transition duration-200 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    placeholder="Enter your username"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
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
                    className="block w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 shadow-sm transition duration-200 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Protected by JWT authentication
                </span>
                <span className="hidden font-medium text-slate-500 sm:inline">Keyboard friendly</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-green-600 px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition duration-200 hover:from-emerald-700 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
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

            <p id="login-help" className="mt-6 text-center text-sm leading-6 text-slate-500">
              Need help accessing the dashboard? Contact the platform administrator for an account.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
