// Focus Settings Modal
import React, { useState, useEffect, useRef } from 'react';
import { X, Volume2, VolumeX, Bell, BellOff, Play, Check, Clock, Zap, Target } from 'lucide-react';
import { useFocusNotifications } from '@/lib/useFocusNotifications';
import AudioManager from '@/lib/focus/AudioManager';

// Get sound types from AudioManager
const soundCategories = AudioManager.getSoundTypesByCategory();

// Toggle switch component
const Toggle = ({ enabled, onChange }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
      enabled ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ease-out ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

// Setting row component
const SettingRow = ({ icon: Icon, iconColor, title, description, children }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center gap-3">
      {Icon && (
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
    </div>
    {children}
  </div>
);

export const FocusSettingsModal = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { playSound, showNotification } = useFocusNotifications();
  const prevIsOpen = useRef(isOpen);

  // Handle modal visibility with smooth animation
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      setLocalSettings(settings);
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else if (!isOpen && prevIsOpen.current) {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, settings]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 200);
  };

  const handleSave = () => {
    onSave(localSettings);
    handleClose();
  };

  const updateSetting = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ease-out ${
        isAnimating ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white dark:bg-[#12121a] rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden border border-gray-200/50 dark:border-white/5 transition-all duration-200 ease-out ${
          isAnimating 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[#12121a] border-b border-gray-100 dark:border-white/5 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Focus Settings
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Customize your focus experience</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-130px)] px-6 py-5 space-y-6">
          
          {/* Timer Durations Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Timer Durations
              </h3>
            </div>
            
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Focus Duration
                  </label>
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                    {localSettings.focus_duration / 60} min
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="60"
                  step="5"
                  value={localSettings.focus_duration / 60}
                  onChange={(e) => updateSetting('focus_duration', parseInt(e.target.value) * 60)}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>15 min</span>
                  <span>60 min</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="text-center p-3 bg-white dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{localSettings.short_break_duration / 60}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Short Break</p>
                </div>
                <div className="text-center p-3 bg-white dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{localSettings.long_break_duration / 60}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Long Break</p>
                </div>
                <div className="text-center p-3 bg-white dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
                  <select
                    value={localSettings.sessions_until_long_break}
                    onChange={(e) => updateSetting('sessions_until_long_break', parseInt(e.target.value))}
                    className="w-full text-lg font-bold text-gray-900 dark:text-white bg-transparent text-center appearance-none cursor-pointer focus:outline-none"
                  >
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sessions</p>
                </div>
              </div>
            </div>
          </section>

          {/* Sound & Notifications Section */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Sound & Notifications
              </h3>
            </div>
            
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl divide-y divide-gray-100 dark:divide-white/5">
              <div className="px-4">
                <SettingRow
                  icon={localSettings.sound_enabled ? Volume2 : VolumeX}
                  iconColor={localSettings.sound_enabled ? "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400" : "bg-gray-100 dark:bg-gray-700 text-gray-400"}
                  title="Sound Effects"
                  description="Play sound when timer ends"
                >
                  <Toggle 
                    enabled={localSettings.sound_enabled} 
                    onChange={() => updateSetting('sound_enabled', !localSettings.sound_enabled)} 
                  />
                </SettingRow>
              </div>

              {localSettings.sound_enabled && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(soundCategories).flatMap(([_, category]) => 
                      category.sounds.slice(0, 6).map((sound) => (
                        <button
                          key={sound.id}
                          onClick={() => {
                            updateSetting('sound_type', sound.id);
                            playSound(sound.id, localSettings.sound_volume);
                          }}
                          className={`p-2.5 rounded-lg text-xs font-medium transition-all ${
                            localSettings.sound_type === sound.id
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-500/50'
                          }`}
                        >
                          {sound.name}
                        </button>
                      ))
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <VolumeX className="w-4 h-4 text-gray-400" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={localSettings.sound_volume}
                      onChange={(e) => updateSetting('sound_volume', parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-purple-600"
                    />
                    <Volume2 className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 w-8">{localSettings.sound_volume}%</span>
                  </div>
                </div>
              )}

              <div className="px-4">
                <SettingRow
                  icon={localSettings.notifications_enabled ? Bell : BellOff}
                  iconColor={localSettings.notifications_enabled ? "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400" : "bg-gray-100 dark:bg-gray-700 text-gray-400"}
                  title="Browser Notifications"
                  description="Show alerts when timer ends"
                >
                  <Toggle 
                    enabled={localSettings.notifications_enabled} 
                    onChange={() => updateSetting('notifications_enabled', !localSettings.notifications_enabled)} 
                  />
                </SettingRow>
              </div>
            </div>
          </section>

          {/* Auto-start Section */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Automation
              </h3>
            </div>
            
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl divide-y divide-gray-100 dark:divide-white/5 px-4">
              <SettingRow
                title="Auto-start breaks"
                description="Automatically begin break timer"
              >
                <Toggle 
                  enabled={localSettings.auto_start_breaks} 
                  onChange={() => updateSetting('auto_start_breaks', !localSettings.auto_start_breaks)} 
                />
              </SettingRow>
              <SettingRow
                title="Auto-start focus"
                description="Resume focus after break ends"
              >
                <Toggle 
                  enabled={localSettings.auto_start_focus} 
                  onChange={() => updateSetting('auto_start_focus', !localSettings.auto_start_focus)} 
                />
              </SettingRow>
            </div>
          </section>

          {/* Daily Goal Section */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Daily Goal
              </h3>
            </div>
            
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={localSettings.daily_goal_sessions || ''}
                  onChange={(e) => updateSetting('daily_goal_sessions', parseInt(e.target.value) || null)}
                  placeholder="—"
                  className="w-20 px-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-center text-lg font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Sessions per day</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Leave empty to disable</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-[#0a0a0f] border-t border-gray-100 dark:border-white/5 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-purple-500/20"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
