// Focus Settings Modal
import React, { useState, useEffect, useRef } from 'react';
import { X, Volume2, VolumeX, Bell, BellOff, Play, Check } from 'lucide-react';
import { useFocusNotifications } from '@/lib/useFocusNotifications';
import AudioManager from '@/lib/focus/AudioManager';

// Get sound types from AudioManager
const soundCategories = AudioManager.getSoundTypesByCategory();

export const FocusSettingsModal = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const { playSound, showNotification } = useFocusNotifications();
  const prevIsOpen = useRef(isOpen);

  // Only reset local settings when modal opens (not on every settings change)
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      // Modal just opened - sync with prop
      setLocalSettings(settings);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, settings]);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const updateSetting = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Focus Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Timer Durations */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Timer Durations
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Focus Duration (minutes)
                </label>
                <input
                  type="range"
                  min="15"
                  max="60"
                  step="5"
                  value={localSettings.focus_duration / 60}
                  onChange={(e) => updateSetting('focus_duration', parseInt(e.target.value) * 60)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>15 min</span>
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">
                    {localSettings.focus_duration / 60} min
                  </span>
                  <span>60 min</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Short Break
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {localSettings.short_break_duration / 60} min
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fixed</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Long Break
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {localSettings.long_break_duration / 60} min
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fixed</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Long break after
                </label>
                <select
                  value={localSettings.sessions_until_long_break}
                  onChange={(e) => updateSetting('sessions_until_long_break', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="2">2 sessions</option>
                  <option value="3">3 sessions</option>
                  <option value="4">4 sessions</option>
                  <option value="5">5 sessions</option>
                </select>
              </div>
            </div>
          </section>

          {/* Sound Settings */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sound & Notifications
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {localSettings.sound_enabled ? (
                    <Volume2 className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Sound Effects</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Play sound when timer ends</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('sound_enabled', !localSettings.sound_enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localSettings.sound_enabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localSettings.sound_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {localSettings.sound_enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Notification Sound
                    </label>
                    <div className="space-y-4">
                      {Object.entries(soundCategories).map(([categoryId, category]) => (
                        <div key={categoryId}>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                            {category.name}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {category.sounds.map((sound) => (
                              <button
                                key={sound.id}
                                onClick={() => {
                                  updateSetting('sound_type', sound.id);
                                  playSound(sound.id, localSettings.sound_volume);
                                }}
                                className={`relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                                  localSettings.sound_type === sound.id
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${
                                    localSettings.sound_type === sound.id
                                      ? 'text-indigo-700 dark:text-indigo-300'
                                      : 'text-gray-900 dark:text-white'
                                  }`}>
                                    {sound.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {sound.description}
                                  </p>
                                </div>
                                {localSettings.sound_type === sound.id && (
                                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Volume: {localSettings.sound_volume}%
                    </label>
                    <div className="flex items-center gap-3">
                      <VolumeX className="w-4 h-4 text-gray-400" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={localSettings.sound_volume}
                        onChange={(e) => updateSetting('sound_volume', parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
                      />
                      <Volume2 className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => playSound(localSettings.sound_type, localSettings.sound_volume)}
                      className="w-full px-4 py-2.5 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Preview Selected Sound
                    </button>
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {localSettings.notifications_enabled ? (
                      <Bell className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <BellOff className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Browser Notifications</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Show notifications when timer ends</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting('notifications_enabled', !localSettings.notifications_enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      localSettings.notifications_enabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        localSettings.notifications_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {localSettings.notifications_enabled && (
                  <button
                    onClick={() => showNotification('Focus Session Complete!', 'This is a test notification')}
                    className="w-full px-4 py-2.5 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    Test Notification
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Auto-start Settings */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Auto-start
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Auto-start breaks</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Automatically start break timer</p>
                </div>
                <button
                  onClick={() => updateSetting('auto_start_breaks', !localSettings.auto_start_breaks)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localSettings.auto_start_breaks ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localSettings.auto_start_breaks ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Auto-start focus</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Automatically start focus after break</p>
                </div>
                <button
                  onClick={() => updateSetting('auto_start_focus', !localSettings.auto_start_focus)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localSettings.auto_start_focus ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localSettings.auto_start_focus ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Daily Goal */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Daily Goal
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target sessions per day
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={localSettings.daily_goal_sessions || ''}
                onChange={(e) => updateSetting('daily_goal_sessions', parseInt(e.target.value) || null)}
                placeholder="Optional"
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave empty to disable daily goal tracking
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
