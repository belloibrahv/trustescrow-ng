import React from 'react';
import { AlertTriangle, XCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  variant?: 'default' | 'card' | 'inline' | 'page';
  size?: 'sm' | 'md' | 'lg';
  actionLabel?: string;
  onAction?: () => void;
  showIcon?: boolean;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Something went wrong',
  message,
  variant = 'default',
  size = 'md',
  actionLabel = 'Try again',
  onAction,
  showIcon = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm p-3',
    md: 'text-base p-4', 
    lg: 'text-lg p-6'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  if (variant === 'page') {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-slate-50 px-4 ${className}`}>
        <div className="text-center max-w-md">
          {showIcon && (
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          )}
          <h1 className="text-2xl font-bold text-slate-900 mb-4">{title}</h1>
          <p className="text-slate-600 mb-8 leading-relaxed">{message}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onAction && (
              <button
                onClick={onAction}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                {actionLabel}
              </button>
            )}
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl ${sizeClasses[size]} ${className}`}>
        <div className="flex items-start gap-3">
          {showIcon && (
            <AlertTriangle className={`${iconSizes[size]} text-red-600 flex-shrink-0 mt-0.5`} />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-red-900 mb-1">{title}</h3>
            <p className="text-red-800 text-sm leading-relaxed">{message}</p>
            {onAction && (
              <button
                onClick={onAction}
                className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                {actionLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-red-600 ${className}`}>
        {showIcon && <AlertTriangle className={iconSizes[size]} />}
        <span className="text-sm font-medium">{message}</span>
        {onAction && (
          <button
            onClick={onAction}
            className="text-red-700 hover:text-red-800 underline text-sm"
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-red-50 border-l-4 border-red-500 rounded-r-xl ${sizeClasses[size]} ${className}`}>
      <div className="flex items-start gap-3">
        {showIcon && (
          <AlertTriangle className={`${iconSizes[size]} text-red-600 flex-shrink-0`} />
        )}
        <div className="flex-1">
          <h4 className="font-medium text-red-900">{title}</h4>
          <p className="text-red-800 text-sm mt-1 leading-relaxed">{message}</p>
          {onAction && (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-1 mt-2 text-sm text-red-700 hover:text-red-800 font-medium"
            >
              <RefreshCw className="w-3 h-3" />
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Specialized error components
export const NotFoundError: React.FC<{ 
  resource?: string; 
  onBack?: () => void;
  onHome?: () => void;
}> = ({ 
  resource = 'page', 
  onBack,
  onHome 
}) => (
  <div className="text-center py-12">
    <XCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
    <h2 className="text-xl font-semibold text-slate-900 mb-2">
      {resource.charAt(0).toUpperCase() + resource.slice(1)} not found
    </h2>
    <p className="text-slate-600 mb-6">
      The {resource} you're looking for doesn't exist or has been removed.
    </p>
    <div className="flex gap-3 justify-center">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      )}
      <button
        onClick={onHome || (() => window.location.href = '/')}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Home className="w-4 h-4" />
        Home
      </button>
    </div>
  </div>
);

export const NetworkError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorMessage
    title="Connection Error"
    message="Unable to connect to the server. Please check your internet connection and try again."
    variant="card"
    actionLabel="Retry"
    onAction={onRetry}
  />
);

export const ApiError: React.FC<{ 
  error?: string; 
  onRetry?: () => void 
}> = ({ 
  error = 'An unexpected error occurred while processing your request.', 
  onRetry 
}) => (
  <ErrorMessage
    title="Service Error"
    message={error}
    variant="card"
    actionLabel="Try Again"
    onAction={onRetry}
  />
);

export { ErrorMessage };