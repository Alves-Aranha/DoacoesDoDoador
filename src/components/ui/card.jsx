import React from 'react';

export const Card = ({ children, className = '' }) => (
  <div className={`rounded-xl shadow-sm border overflow-hidden ${className}`} 
       style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-color)' }}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b ${className}`}
       style={{ borderColor: 'var(--border-color)' }}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-bold ${className}`}
      style={{ color: 'var(--text-color)' }}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm mt-1 ${className}`}
      style={{ opacity: 0.7, color: 'var(--text-color)' }}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);
