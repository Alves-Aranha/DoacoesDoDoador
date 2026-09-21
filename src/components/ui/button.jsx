import React from 'react';

export const Button = ({ children, onClick, disabled, className = '', variant = 'primary' }) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed';
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--primary-pastel-blue)',
          color: 'white',
          boxShadow: 'var(--shadow)'
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--header-bg)',
          color: 'var(--text-color)',
          border: '1px solid var(--border-color)'
        };
      case 'outline':
        return {
          border: '1px solid var(--border-color)',
          color: 'var(--text-color)',
          backgroundColor: 'transparent'
        };
      default:
        return {};
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${className}`}
      style={getVariantStyles()}
    >
      {children}
    </button>
  );
};
