import React from 'react';

// StraturaOS brand logo component - purple hexagon with S
export default function Brand({ size = 'md', className = '' }) {
  const sizeClass = size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-7 h-7' : 'w-10 h-10';
  return (
    <div className={`brand-logo ${className}`} role="img" aria-label="StraturaOS logo">
      <div className={`avatar ${sizeClass}`} aria-hidden>
        {/* StraturaOS purple hexagon brand - matches logo gradient */}
        <div
          className={`rounded-xl text-white font-extrabold`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            lineHeight: 1,
            fontSize: size === 'lg' ? 28 : size === 'sm' ? 14 : 20,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            background: 'linear-gradient(135deg, #3730A3 0%, #4F46E5 50%, #6366F1 100%)',
          }}
        >
          S
        </div>
      </div>
    </div>
  );
}
