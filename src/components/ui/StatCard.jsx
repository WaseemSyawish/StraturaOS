/**
 * StatCard - KPI/metric card component matching landing/auth design language
 * 
 * Usage:
 * <StatCard
 *   label="GPA"
 *   value="3.7"
 *   icon={Award}
 *   trend="+0.2"
 *   color="purple" // purple, blue, green, amber, rose
 * />
 */
import React from 'react';

const colorMap = {
  purple: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    value: 'text-purple-300',
    border: 'border-purple-500/20',
  },
  blue: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    value: 'text-blue-300',
    border: 'border-blue-500/20',
  },
  green: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    value: 'text-emerald-300',
    border: 'border-emerald-500/20',
  },
  amber: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    value: 'text-amber-300',
    border: 'border-amber-500/20',
  },
  rose: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    value: 'text-rose-300',
    border: 'border-rose-500/20',
  },
};

export function StatCard({ 
  label, 
  value, 
  icon: Icon,
  subtext,
  trend,
  color = 'purple',
  className = '' 
}) {
  const colors = colorMap[color] || colorMap.purple;
  
  return (
    <div className={`
      bg-[#12121a] rounded-2xl p-5 
      border border-white/5
      transition-all duration-200
      hover:border-white/10
      ${className}
    `}>
      <div className="flex items-start justify-between mb-3">
        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>
        )}
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend.startsWith('+') ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
          }`}>
            {trend}
          </span>
        )}
      </div>
      <div className={`text-2xl sm:text-3xl font-bold ${colors.value} tracking-tight`}>
        {value}
      </div>
      <div className="text-sm text-gray-400 font-medium mt-1">
        {label}
      </div>
      {subtext && (
        <div className="text-xs text-gray-500 mt-1">
          {subtext}
        </div>
      )}
    </div>
  );
}

export default StatCard;
