import React from 'react';

const LoadingSpinner: React.FC<{ size?: number }> = ({ size = 40 }) => {
  return (
    <div className="flex items-center justify-center" style={{ height: '100%' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        className="animate-spin"
        aria-hidden
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeOpacity="0.25"
        />
        <path
          fill="currentColor"
          d="M25 5a20 20 0 0 1 20 20h-5a15 15 0 1 0-15  -15V5z"
        />
      </svg>
    </div>
  );
};

export default LoadingSpinner;
