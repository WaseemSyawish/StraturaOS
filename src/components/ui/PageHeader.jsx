/**
 * PageHeader - Consistent page header component matching landing/auth design language
 * 
 * Usage:
 * <PageHeader
 *   title="Tasks"
 *   description="Manage your assignments and deadlines"
 *   actions={<button>Add Task</button>}
 * />
 */
import React from 'react';

export function PageHeader({ 
  title, 
  description, 
  icon: Icon,
  actions,
  className = '' 
}) {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 flex items-center justify-center">
              <Icon className="w-6 h-6 text-purple-400" />
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-sm sm:text-base text-gray-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
