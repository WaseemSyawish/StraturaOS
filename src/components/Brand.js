import React from 'react';

// StraturaOS brand logo component - purple hexagon with S
export default function Brand({ size = 'md', className = '' }) {
  const sizeClass = size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-7 h-7' : 'w-10 h-10';
  return (
    <div className={`brand-logo ${className}`} role="img" aria-label="StraturaOS logo">
      <div className={`avatar ${sizeClass}`} aria-hidden>
        {/* StraturaOS purple hexagon brand */}
        <div
          className={`rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-extrabold`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            lineHeight: 1,
            fontSize: size === 'lg' ? 28 : size === 'sm' ? 14 : 20,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          S
        </div>
      </div>
    </div>
  );
}
