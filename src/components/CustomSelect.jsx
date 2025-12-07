import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Minimal accessible custom select to replace native <select> where styling of options matters.
// Features: keyboard navigation (up/down/enter/escape), click outside to close, basic aria attributes.
// Not a drop-in for all HTML select features (no form submission integration). Use for UI selection.
// Variants: 'default' (standard card styling), 'hero' (transparent/frosted for hero banners)

export default function CustomSelect({ options = [], value = '', onChange = () => {}, placeholder = 'Select...', className = '', id, variant = 'default' }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  // Calculate dropdown position when opened
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [open]);

  useEffect(() => {
    function onDocClick(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    if (!open) setHighlighted(-1);
  }, [open]);

  const onToggle = () => setOpen(v => !v);
  const handleSelect = (opt) => {
    onChange(opt.value);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlighted(h => Math.min(h + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && highlighted >= 0) {
        handleSelect(options[highlighted]);
      } else {
        setOpen(true);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const selected = options.find(o => String(o.value) === String(value));

  // Styling based on variant
  const buttonStyles = variant === 'hero'
    ? 'w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-2 text-left flex justify-between items-center hover:bg-white/30 transition-colors'
    : 'w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-left flex justify-between items-center';
  
  const textStyles = variant === 'hero'
    ? (selected ? 'text-white font-medium' : 'text-white/70')
    : (selected ? 'text-gray-900 dark:text-slate-100' : 'text-gray-500 dark:text-slate-400');
  
  const chevronStyles = variant === 'hero'
    ? 'ml-2 h-4 w-4 text-white/80'
    : 'ml-2 h-4 w-4 text-gray-500 dark:text-slate-300';

  // Dropdown rendered in portal to escape overflow:hidden containers
  const dropdownContent = open && typeof document !== 'undefined' ? createPortal(
    <ul 
      role="listbox" 
      tabIndex={-1} 
      className="fixed z-[9999] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-lg max-h-64 overflow-auto"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
      }}
      onMouseDown={(e) => e.preventDefault()} // Prevent blur on button
    >
      {options.length === 0 ? (
        <li className="px-3 py-2 text-sm text-gray-500 dark:text-slate-400">No options</li>
      ) : options.map((opt, idx) => (
        <li key={opt.value} role="option" aria-selected={String(opt.value) === String(value)}
          onMouseEnter={() => setHighlighted(idx)}
          onMouseLeave={() => setHighlighted(-1)}
          onClick={() => handleSelect(opt)}
          className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between ${String(opt.value) === String(value) ? 'bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' : highlighted === idx ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100' : 'text-gray-800 dark:text-slate-100'}`}>
          <span>{opt.label}</span>
        </li>
      ))}
    </ul>,
    document.body
  ) : null;

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`} id={id}>
      <div>
        <button ref={buttonRef} type="button" aria-haspopup="listbox" aria-expanded={open} onClick={onToggle} onKeyDown={handleKeyDown}
          className={buttonStyles}>
          <span className={textStyles}>{selected ? selected.label : placeholder}</span>
          <svg className={chevronStyles} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 12a1 1 0 01-.707-.293l-3-3a1 1 0 111.414-1.414L10 9.586l2.293-2.293a1 1 0 111.414 1.414l-3 3A1 1 0 0110 12z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {dropdownContent}
    </div>
  );
}
