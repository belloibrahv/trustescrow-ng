import { useId } from 'react';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type LogoTheme = 'light' | 'dark';
type LogoVariant = 'full' | 'icon' | 'wordmark';

interface LogoProps {
  size?: LogoSize;
  className?: string;
  variant?: LogoVariant;
  theme?: LogoTheme;
}

const SIZE_CONFIG: Record<
  LogoSize,
  {
    icon: number;
    gap: number;
    brandSize: number;
    pillSize: number;
    lineSize: number;
    letterSpacing: string;
  }
> = {
  xs: { icon: 20, gap: 6, brandSize: 12, pillSize: 7, lineSize: 8, letterSpacing: '-0.02em' },
  sm: { icon: 24, gap: 8, brandSize: 14, pillSize: 8, lineSize: 9, letterSpacing: '-0.025em' },
  md: { icon: 32, gap: 10, brandSize: 18, pillSize: 9, lineSize: 10, letterSpacing: '-0.03em' },
  lg: { icon: 40, gap: 12, brandSize: 22, pillSize: 10, lineSize: 11, letterSpacing: '-0.035em' },
  xl: { icon: 48, gap: 14, brandSize: 28, pillSize: 11, lineSize: 12, letterSpacing: '-0.04em' },
};

function BrandIcon({ size, className = '' }: { size: number; className?: string }) {
  const id = useId().replace(/:/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`bg-${id}`} x1="10%" y1="12%" x2="92%" y2="88%">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id={`glow-${id}`} x1="22%" y1="18%" x2="86%" y2="84%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id={`shield-${id}`} x1="20%" y1="14%" x2="78%" y2="88%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="52%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id={`emerald-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <linearGradient id={`sky-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <filter id={`shadow-${id}`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#020617" floodOpacity="0.38" />
        </filter>
      </defs>

      <rect x="4" y="4" width="56" height="56" rx="18" fill={`url(#bg-${id})`} />
      <rect x="4" y="4" width="56" height="56" rx="18" fill={`url(#glow-${id})`} opacity="0.65" />

      <circle cx="19" cy="18" r="8" fill="white" opacity="0.05" />
      <circle cx="47" cy="15" r="6" fill="#22c55e" opacity="0.08" />

      {/* Buyer -> escrow -> seller flow */}
      <circle cx="14" cy="33" r="4.2" fill={`url(#emerald-${id})`} />
      <circle cx="50" cy="33" r="4.2" fill={`url(#sky-${id})`} />

      <path
        d="M18.8 33H26.2"
        stroke={`url(#emerald-${id})`}
        strokeWidth="3.3"
        strokeLinecap="round"
      />
      <path
        d="M24.8 30.9L29 33L24.8 35.1"
        fill={`url(#emerald-${id})`}
      />

      <path
        d="M37.8 33H45.2"
        stroke={`url(#sky-${id})`}
        strokeWidth="3.3"
        strokeLinecap="round"
      />
      <path
        d="M40 30.9L44.2 33L40 35.1"
        fill={`url(#sky-${id})`}
      />

      {/* Secure escrow core */}
      <path
        d="M32 14L42.8 19.8V31.8C42.8 38.8 38.4 44.2 32 49.2C25.6 44.2 21.2 38.8 21.2 31.8V19.8L32 14Z"
        fill={`url(#shield-${id})`}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.8"
        filter={`url(#shadow-${id})`}
      />

      <rect x="27.8" y="27.8" width="8.4" height="9.2" rx="2.3" fill="#f8fafc" opacity="0.98" />
      <circle cx="32" cy="31.6" r="1.55" fill="#0f172a" />
      <path
        d="M32 33.2V35.8"
        stroke="#0f172a"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M28.3 24.8C29.4 23.6 30.7 23 32 23C33.3 23 34.6 23.6 35.7 24.8"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  size = 'md',
  className = '',
  variant = 'icon',
  theme = 'light',
}: LogoProps) {
  const config = SIZE_CONFIG[size];
  
  if (variant === 'full') {
    return (
      <div className={`flex items-center ${className}`} style={{ gap: config.gap }}>
        <BrandIcon size={config.icon} />
        <span
          className="font-bold text-slate-900 tracking-tight"
          style={{ fontSize: config.brandSize, letterSpacing: config.letterSpacing }}
        >
          TrustEscrow
        </span>
      </div>
    );
  }

  if (variant === 'wordmark') {
    return (
      <span
        className={`font-bold text-slate-900 tracking-tight ${className}`}
        style={{ fontSize: config.brandSize, letterSpacing: config.letterSpacing }}
      >
        TrustEscrow
      </span>
    );
  }

  return <BrandIcon size={config.icon} className={className} />;
}

export function LogoMark({
  size = 'md',
  className = '',
}: Pick<LogoProps, 'size' | 'className'>) {
  return <BrandIcon size={SIZE_CONFIG[size].icon} className={className} />;
}
