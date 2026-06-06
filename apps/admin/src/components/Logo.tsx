import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizes = {
    sm: 32,
    md: 48,
    lg: 64,
  };

  const dimension = sizes[size];
  // Generate a simple unique ID based on size
  const uniqueId = `${size}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Gradient Definitions */}
      <defs>
        <linearGradient id={`emeraldGradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id={`lightGradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#34d399', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
        </linearGradient>
        <filter id={`shadow-${uniqueId}`}>
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Background Circle with Gradient */}
      <circle
        cx="32"
        cy="32"
        r="30"
        fill={`url(#emeraldGradient-${uniqueId})`}
        filter={`url(#shadow-${uniqueId})`}
      />

      {/* Shield Shape - Main Security Symbol */}
      <path
        d="M32 12L20 18V28C20 36 24 42 32 46C40 42 44 36 44 28V18L32 12Z"
        fill="white"
        opacity="0.95"
      />

      {/* Lock/Keyhole Symbol in Shield Center */}
      <circle cx="32" cy="28" r="3.5" fill={`url(#emeraldGradient-${uniqueId})`} />
      <path
        d="M32 31.5V36.5"
        stroke={`url(#emeraldGradient-${uniqueId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Transaction Arrows - Left to Right Flow */}
      <g opacity="0.9">
        {/* Left Arrow */}
        <path
          d="M14 32H22"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M20 30L22 32L20 34"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right Arrow */}
        <path
          d="M42 32H50"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M48 30L50 32L48 34"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Checkmark for Trust/Verification */}
      <path
        d="M28 28L30.5 31L36 25"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.3"
      />
    </svg>
  );
}

// Alternative Logo Design - More Modern
export function LogoAlt({ className = '', size = 'md' }: LogoProps) {
  const sizes = {
    sm: 32,
    md: 48,
    lg: 64,
  };

  const dimension = sizes[size];

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="gradAlt" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Rounded Square Background */}
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="14"
        fill="url(#gradAlt)"
      />

      {/* Stylized "TE" Monogram */}
      <g fill="white" opacity="0.95">
        {/* Letter T */}
        <path d="M18 20H28V24H24V44H22V24H18V20Z" />
        
        {/* Letter E with escrow box design */}
        <path d="M36 20H46V24H40V30H45V34H40V40H46V44H36V20Z" />
      </g>

      {/* Secure Lock Icon Overlay */}
      <circle cx="50" cy="14" r="8" fill="#059669" />
      <path
        d="M50 11V13M48 16H52V19H48V16Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Minimalist Logo - Clean and Professional
export function LogoMinimal({ className = '', size = 'md' }: LogoProps) {
  const sizes = {
    sm: 32,
    md: 48,
    lg: 64,
  };

  const dimension = sizes[size];

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="gradMin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#047857', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Hexagon Shape - Represents Security and Structure */}
      <path
        d="M32 6L52 18V46L32 58L12 46V18L32 6Z"
        fill="url(#gradMin)"
      />

      {/* Inner Safe/Vault Design */}
      <g transform="translate(32, 32)">
        {/* Vault Door Circle */}
        <circle cx="0" cy="0" r="14" fill="white" opacity="0.2" />
        <circle cx="0" cy="0" r="11" fill="white" opacity="0.95" />
        
        {/* Lock Mechanism */}
        <circle cx="0" cy="0" r="4" fill="url(#gradMin)" />
        <line x1="0" y1="0" x2="0" y2="7" stroke="url(#gradMin)" strokeWidth="2" />
        <line x1="0" y1="0" x2="-5" y2="4" stroke="url(#gradMin)" strokeWidth="1.5" />
        <line x1="0" y1="0" x2="5" y2="4" stroke="url(#gradMin)" strokeWidth="1.5" />
        
        {/* Checkmark */}
        <path
          d="M-4 -2L-1 1L4 -4"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
        />
      </g>

      {/* Corner Accents - Representing Transaction Flow */}
      <circle cx="16" cy="32" r="2" fill="white" opacity="0.6" />
      <circle cx="48" cy="32" r="2" fill="white" opacity="0.6" />
    </svg>
  );
}
