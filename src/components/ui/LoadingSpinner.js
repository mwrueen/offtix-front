import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 ${sizes[size]} ${className}`} />
  );
};

const LoadingOverlay = ({ message = 'Loading...' }) => (
  <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  </div>
);

LoadingSpinner.Overlay = LoadingOverlay;

export default LoadingSpinner;