/**
 * PrimaryButton - Primary action button matching landing/auth design language
 * 
 * Usage:
 * <PrimaryButton onClick={handleClick} icon={Plus}>
 *   Add Task
 * </PrimaryButton>
 */
import React from 'react';

export function PrimaryButton({ 
  children, 
  onClick, 
  icon: Icon,
  disabled = false,
  size = 'md', // sm, md, lg
  variant = 'primary', // primary, secondary, ghost
  className = '',
  ...props 
}) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-purple-600 to-purple-500
      hover:from-purple-500 hover:to-purple-400
      text-white font-semibold
      shadow-lg shadow-purple-500/25
      hover:shadow-xl hover:shadow-purple-500/30
    `,
    secondary: `
      bg-white/5 hover:bg-white/10
      text-white font-medium
      border border-white/10 hover:border-white/20
    `,
    ghost: `
      bg-transparent hover:bg-white/5
      text-gray-400 hover:text-white font-medium
    `,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center
        rounded-xl
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />}
      {children}
    </button>
  );
}

export default PrimaryButton;
