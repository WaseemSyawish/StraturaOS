/**
 * Custom dialog utilities that work without React hooks/providers
 * Can be used in any component, page, or even plain JavaScript
 */

/**
 * Show a custom alert dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} type - 'info' | 'warning' | 'danger' | 'success'
 * @returns {Promise<void>}
 */
export function showCustomAlert(title, message, type = 'info') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'custom-dialog-overlay';
    
    const colors = {
      info: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800/50', icon: '💡', button: 'bg-blue-600 hover:bg-blue-700' },
      warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800/50', icon: '⚠️', button: 'bg-amber-600 hover:bg-amber-700' },
      danger: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800/50', icon: '❌', button: 'bg-red-600 hover:bg-red-700' },
      success: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800/50', icon: '✅', button: 'bg-green-600 hover:bg-green-700' }
    };
    
    const color = colors[type] || colors.info;
    
    overlay.innerHTML = `
      <style>
        .custom-dialog-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          animation: fadeIn 0.15s ease-out;
        }
        .custom-dialog-box {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          max-width: 28rem;
          width: 100%;
          animation: zoomIn 0.15s ease-out;
        }
        .dark .custom-dialog-box {
          background: rgb(17, 24, 39);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      </style>
      <div class="custom-dialog-box">
        <div class="flex items-start gap-4 p-6 rounded-t-xl border-b ${color.bg} ${color.border}">
          <div class="text-2xl">${color.icon}</div>
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${title}</h3>
            <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${message}</p>
          </div>
        </div>
        <div class="flex items-center justify-end gap-3 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
          <button class="custom-dialog-btn px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${color.button}">
            OK
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    const cleanup = () => {
      document.body.removeChild(overlay);
      resolve();
    };
    
    overlay.querySelector('.custom-dialog-btn').addEventListener('click', cleanup);
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
    const overlay = document.createElement('div');
    overlay.className = 'custom-dialog-overlay';
    
    const colors = {
      info: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800/50', icon: '💡', button: 'bg-blue-600 hover:bg-blue-700' },
      warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800/50', icon: '⚠️', button: 'bg-amber-600 hover:bg-amber-700' },
      danger: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800/50', icon: '❌', button: 'bg-red-600 hover:bg-red-700' },
      success: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800/50', icon: '✅', button: 'bg-green-600 hover:bg-green-700' }
    };
    
    const color = colors[type] || colors.warning;
    
    overlay.innerHTML = `
      <style>
        .custom-dialog-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          animation: fadeIn 0.15s ease-out;
        }
        .custom-dialog-box {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          max-width: 28rem;
          width: 100%;
          animation: zoomIn 0.15s ease-out;
        }
        .dark .custom-dialog-box {
          background: rgb(17, 24, 39);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      </style>
      <div class="custom-dialog-box">
        <div class="flex items-start gap-4 p-6 rounded-t-xl border-b ${color.bg} ${color.border}">
          <div class="text-2xl">${color.icon}</div>
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${title}</h3>
            <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${message}</p>
          </div>
        </div>
        <div class="flex items-center justify-end gap-3 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
          <button class="custom-dialog-cancel px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors">
            ${cancelText}
          </button>
          <button class="custom-dialog-confirm px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${color.button}">
            ${confirmText}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    const cleanup = (result) => {
      document.body.removeChild(overlay);
      resolve(result);
    };
    
    overlay.querySelector('.custom-dialog-confirm').addEventListener('click', () => cleanup(true));
    overlay.querySelector('.custom-dialog-cancel').addEventListener('click', () => cleanup(false));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(false);
    });
  });
}
