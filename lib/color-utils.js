/**
 * Color utilities - consolidates Tailwind color conversions
 * Used across API routes and components to normalize course colors
 */

/**
 * Tailwind color class to hex color mapping
 */
export const TAILWIND_TO_HEX = {
  'indigo-500': '#6366F1',
  'indigo-600': '#4F46E5',
  'blue-500': '#3B82F6',
  'blue-600': '#2563EB',
  'green-500': '#10B981',
  'green-600': '#059669',
  'red-500': '#EF4444',
  'red-600': '#DC2626',
  'yellow-500': '#F59E0B',
  'yellow-600': '#D97706',
  'gray-500': '#6B7280',
  'gray-600': '#4B5563',
  'purple-500': '#8B5CF6',
  'purple-600': '#7C3AED',
  'pink-500': '#EC4899',
  'pink-600': '#DB2777',
  'teal-500': '#14B8A6',
  'teal-600': '#0D9488',
  'orange-500': '#F97316',
  'orange-600': '#EA580C',
  'cyan-500': '#06B6D4',
  'cyan-600': '#0891B2',
};

/**
 * Default fallback color
 */
export const DEFAULT_COLOR = '#94a3b8';

/**
 * Convert a color value (Tailwind class, bg-* class, or hex) to a hex color
 * @param {string} colorValue - Color value to normalize
 * @returns {string|null} Hex color or null if invalid
 */
export function normalizeColorToHex(colorValue) {
  if (!colorValue || typeof colorValue !== 'string') {
    return null;
  }
  
  const value = colorValue.trim();
  
  // Already a hex color
  if (value.startsWith('#')) {
    return value;
  }
  
  // RGB/RGBA color
  if (value.startsWith('rgb')) {
    return value;
  }
  
  // Tailwind bg-* class (e.g., 'bg-indigo-500')
  if (value.startsWith('bg-')) {
    const key = value.replace(/^bg-/, '');
    return TAILWIND_TO_HEX[key] || null;
  }
  
  // Shorthand token like 'indigo-500'
  if (/^[a-z]+-\d{3,4}$/i.test(value)) {
    return TAILWIND_TO_HEX[value] || null;
  }
  
  // Named color or other format - return as-is
  return value;
}

/**
 * Attach normalized colorHex to a course object
 * @param {object} course - Course object with color field
 * @returns {object} Course with colorHex attached
 */
export function normalizeCourseColor(course) {
  if (!course) return course;
  
  const colorHex = normalizeColorToHex(course.color);
  return {
    ...course,
    colorHex,
  };
}

/**
 * Get a random color from the palette
 * @returns {string} Hex color
 */
export function getRandomColor() {
  const colors = Object.values(TAILWIND_TO_HEX);
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Check if a color is dark (for text contrast)
 * @param {string} hexColor - Hex color string
 * @returns {boolean} True if color is dark
 */
export function isDarkColor(hexColor) {
  if (!hexColor || !hexColor.startsWith('#')) return false;
  
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

export default {
  TAILWIND_TO_HEX,
  DEFAULT_COLOR,
  normalizeColorToHex,
  normalizeCourseColor,
  getRandomColor,
  isDarkColor,
};
