import React from 'react';

// StraturaOS Logo SVG Component
const StraturaLogo = ({ size = 40 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 64 64" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="brandLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3730A3"/>
        <stop offset="50%" stopColor="#4F46E5"/>
        <stop offset="100%" stopColor="#6366F1"/>
      </linearGradient>
    </defs>
    <g transform="translate(0,64) scale(0.1,-0.1)" fill="url(#brandLogoGradient)">
      <path d="M169 567 c-75 -40 -144 -78 -153 -86 -13 -11 -16 -36 -16 -160 0 -80 4 -151 8 -157 4 -6 76 -46 160 -89 l154 -79 145 74 c80 41 152 80 159 88 20 20 20 305 0 324 -19 19 -291 158 -307 157 -8 0 -75 -33 -150 -72z m271 -74 l110 -58 0 -67 c0 -40 -4 -68 -10 -68 -6 0 -56 23 -112 51 l-102 51 28 23 28 22 -31 12 c-27 12 -36 10 -100 -25 -39 -21 -71 -41 -71 -44 0 -3 81 -45 180 -92 99 -48 180 -91 179 -95 0 -4 -49 -32 -108 -62 l-108 -53 -114 58 c-107 55 -114 61 -117 92 -2 18 1 32 8 32 5 0 56 -23 112 -51 l102 -51 35 17 36 17 -148 74 -148 75 3 42 3 42 110 57 c61 32 113 57 117 58 5 0 57 -26 118 -57z"/>
    </g>
  </svg>
);

// StraturaOS brand logo component - hexagonal shield with S
export default function Brand({ size = 'md', className = '' }) {
  const pixelSize = size === 'lg' ? 56 : size === 'sm' ? 28 : 40;
  const containerClass = size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-7 h-7' : 'w-10 h-10';
  
  return (
    <div className={`brand-logo ${className}`} role="img" aria-label="StraturaOS logo">
      <div className={`avatar ${containerClass} flex items-center justify-center`} aria-hidden>
        <StraturaLogo size={pixelSize} />
      </div>
    </div>
  );
}
