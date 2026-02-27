/**
 * Custom dialog utilities that work without React hooks/providers
 * Can be used in any component, page, or even plain JavaScript
 */

const DIALOG_THEME = {
  info: {
    accent: 'from-blue-500 to-cyan-500',
    iconBg: 'bg-blue-50 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-300',
    border: 'border-blue-200/70 dark:border-blue-800/40',
    confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/40',
    icon: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5" aria-hidden="true">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    `
  },
  warning: {
    accent: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-50 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-300',
    border: 'border-amber-200/70 dark:border-amber-800/40',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/40',
    icon: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    `
  },
  danger: {
    accent: 'from-red-500 to-rose-500',
    iconBg: 'bg-red-50 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-300',
    border: 'border-red-200/70 dark:border-red-800/40',
    confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500/40',
    icon: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5" aria-hidden="true">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    `
  },
  success: {
    accent: 'from-emerald-500 to-green-500',
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-300',
    border: 'border-emerald-200/70 dark:border-emerald-800/40',
    confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/40',
    icon: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5" aria-hidden="true">
        <path d="M20 6L9 17l-5-5"></path>
      </svg>
    `
  }
};

let stylesInjected = false;

function ensureDialogStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    .custom-dialog-overlay {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(8px);
      animation: customDialogFadeIn 0.16s ease-out;
    }
    .custom-dialog-box {
      width: 100%;
      max-width: 30rem;
      border-radius: 1rem;
      border: 1px solid rgba(148, 163, 184, 0.2);
      background: rgba(255, 255, 255, 0.97);
      box-shadow: 0 24px 56px -20px rgba(15, 23, 42, 0.45);
      overflow: hidden;
      animation: customDialogScaleIn 0.16s ease-out;
    }
    .dark .custom-dialog-box {
      background: rgba(15, 23, 42, 0.97);
      border-color: rgba(71, 85, 105, 0.45);
      box-shadow: 0 24px 60px -20px rgba(2, 6, 23, 0.75);
    }
    .custom-dialog-btn:focus-visible,
    .custom-dialog-cancel:focus-visible,
    .custom-dialog-confirm:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.9), 0 0 0 6px rgba(99, 102, 241, 0.25);
    }
    @keyframes customDialogFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes customDialogScaleIn {
      from { opacity: 0; transform: translateY(6px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;
  document.head.appendChild(styleTag);
  stylesInjected = true;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTheme(type) {
  return DIALOG_THEME[type] || DIALOG_THEME.info;
}

/**
 * Show a custom alert dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} type - 'info' | 'warning' | 'danger' | 'success'
 * @returns {Promise<void>}
 */
export function showCustomAlert(title, message, type = 'info') {
  return new Promise((resolve) => {
    ensureDialogStyles();
    const overlay = document.createElement('div');
    overlay.className = 'custom-dialog-overlay';
    const color = getTheme(type);
    const safeTitle = escapeHtml(title);
    const safeMessage = escapeHtml(message);
    
    overlay.innerHTML = `
      <div class="custom-dialog-box">
        <div class="h-1.5 bg-gradient-to-r ${color.accent}"></div>
        <div class="flex items-start gap-3.5 p-6 border-b border-gray-100 dark:border-gray-800 ${color.border}">
          <div class="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${color.iconBg} ${color.iconColor}">
            ${color.icon}
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1.5">${safeTitle}</h3>
            <p class="text-sm leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-wrap">${safeMessage}</p>
          </div>
        </div>
        <div class="flex items-center justify-end gap-3 p-5 bg-gray-50/80 dark:bg-slate-900/60">
          <button class="custom-dialog-btn px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors ${color.confirmBtn}">
            OK
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    const onKeyDown = (event) => {
      if (event.key === 'Escape' || event.key === 'Enter') {
        cleanup();
      }
    };

    const cleanup = () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.removeChild(overlay);
      resolve();
    };
    
    overlay.querySelector('.custom-dialog-btn').addEventListener('click', cleanup);
    document.addEventListener('keydown', onKeyDown);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup();
    });
  });
}

/**
 * Show a custom confirm dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {Object} options - { type: 'danger' | 'warning' | 'info', confirmText: 'Delete', cancelText: 'Cancel' }
 * @returns {Promise<boolean>} - true if confirmed, false if cancelled
 */
export function showCustomConfirm(title, message, options = {}) {
  const { type = 'warning', confirmText = 'Confirm', cancelText = 'Cancel' } = options;
  
  return new Promise((resolve) => {
    ensureDialogStyles();
    const overlay = document.createElement('div');
    overlay.className = 'custom-dialog-overlay';
    const color = getTheme(type);
    const safeTitle = escapeHtml(title);
    const safeMessage = escapeHtml(message);
    const safeConfirmText = escapeHtml(confirmText);
    const safeCancelText = escapeHtml(cancelText);
    
    overlay.innerHTML = `
      <div class="custom-dialog-box">
        <div class="h-1.5 bg-gradient-to-r ${color.accent}"></div>
        <div class="flex items-start gap-3.5 p-6 border-b border-gray-100 dark:border-gray-800 ${color.border}">
          <div class="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${color.iconBg} ${color.iconColor}">
            ${color.icon}
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1.5">${safeTitle}</h3>
            <p class="text-sm leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-wrap">${safeMessage}</p>
          </div>
        </div>
        <div class="flex items-center justify-end gap-3 p-5 bg-gray-50/80 dark:bg-slate-900/60">
          <button class="custom-dialog-cancel px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors">
            ${safeCancelText}
          </button>
          <button class="custom-dialog-confirm px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors ${color.confirmBtn}">
            ${safeConfirmText}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    const onKeyDown = (event) => {
      if (event.key === 'Escape') cleanup(false);
      if (event.key === 'Enter') cleanup(true);
    };

    const cleanup = (result) => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.removeChild(overlay);
      resolve(result);
    };
    
    overlay.querySelector('.custom-dialog-confirm').addEventListener('click', () => cleanup(true));
    overlay.querySelector('.custom-dialog-cancel').addEventListener('click', () => cleanup(false));
    document.addEventListener('keydown', onKeyDown);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(false);
    });
  });
}
