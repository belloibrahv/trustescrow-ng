import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'minimal';
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className = '',
  text
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const containerSizes = {
    xs: 'gap-1 text-xs',
    sm: 'gap-2 text-sm',
    md: 'gap-3 text-base',
    lg: 'gap-4 text-lg', 
    xl: 'gap-6 text-xl'
  };

  if (variant === 'dots') {
    return (
      <div className={`flex items-center justify-center ${containerSizes[size]} ${className}`}>
        <div className="flex space-x-1">
          <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
          <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
          <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
        </div>
        {text && <span className="text-slate-600 font-medium">{text}</span>}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`flex items-center justify-center ${containerSizes[size]} ${className}`}>
        <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-pulse`}></div>
        {text && <span className="text-slate-600 font-medium animate-pulse">{text}</span>}
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center justify-center ${containerSizes[size]} ${className}`}>
        <div className={`${sizeClasses[size]} border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin`}></div>
        {text && <span className="text-slate-500 text-sm">{text}</span>}
      </div>
    );
  }

  // Default spinner
  return (
    <div className={`flex items-center justify-center ${containerSizes[size]} ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 border-3 border-slate-200 rounded-full"></div>
        <div className="absolute inset-0 border-3 border-transparent border-t-blue-600 border-r-blue-600 rounded-full animate-spin"></div>
      </div>
      {text && (
        <span className="text-slate-700 font-medium tracking-wide">
          {text}
        </span>
      )}
    </div>
  );
};

// Full page loading component
export const PageLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="text-center space-y-4">
      <LoadingSpinner size="xl" text={text} />
    </div>
  </div>
);

// Inline loading for components
export const InlineLoader: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex items-center justify-center py-8">
    <LoadingSpinner size="lg" variant="dots" text={text} />
  </div>
);

// Card loading skeleton
export const CardSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="animate-pulse">
    <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="h-3 bg-slate-200 rounded mb-2" style={{width: `${Math.random() * 40 + 60}%`}}></div>
    ))}
  </div>
);

// Table loading skeleton
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => (
  <div className="animate-pulse space-y-3">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, colIndex) => (
          <div key={colIndex} className="h-4 bg-slate-200 rounded"></div>
        ))}
      </div>
    ))}
  </div>
);

export { LoadingSpinner };