import React from 'react';

const LoadingSpinner: React.FC<{ size?: number; className?: string }> = ({ size = 40, className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ height: '100%' }} role="status" aria-live="polite">
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        className="animate-spin text-blue-600 dark:text-blue-400"
        aria-hidden="true"
        focusable="false"
      >
        {/* Background ring */}
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeOpacity="0.15"
        />
        {/* Foreground arc: use dasharray to show partial arc, rounded linecaps for smooth ends */}
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="94 188" /* ~25% arc */
          strokeDashoffset="0"
        />
      </svg>
      <span className="sr-only">Cargando...</span>
    </div>
  );
};

export default LoadingSpinner;
