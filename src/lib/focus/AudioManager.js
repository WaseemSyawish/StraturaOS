/**
 * Focus Audio Manager
 * 
 * Handles audio preloading, playback, and management for focus sessions.
 * Uses Web Audio API for reliable playback even when tab is in background.
 * 
 * Features professionally-designed notification sounds using synthesis.
 */

// Sound types available for user selection
// These are the main notification sounds users can choose from
const SOUND_TYPES = {
  // Calm & Relaxing
  zen: { name: 'Zen Bowl', category: 'calm', description: 'Peaceful singing bowl tone' },
  forest: { name: 'Forest Chime', category: 'calm', description: 'Soft wind chime melody' },
  ocean: { name: 'Ocean Wave', category: 'calm', description: 'Gentle wave-like tone' },
  meditation: { name: 'Meditation Bell', category: 'calm', description: 'Deep resonant bell' },
  
  // Musical & Pleasant
  piano: { name: 'Piano Chord', category: 'musical', description: 'Warm piano chord' },
  harp: { name: 'Harp Glissando', category: 'musical', description: 'Elegant harp sweep' },
  marimba: { name: 'Marimba', category: 'musical', description: 'Wooden marimba tone' },
  music_box: { name: 'Music Box', category: 'musical', description: 'Nostalgic music box' },
  
  // Modern & Clean
  soft_ping: { name: 'Soft Ping', category: 'modern', description: 'Gentle notification' },
  bubble: { name: 'Bubble Pop', category: 'modern', description: 'Playful bubble sound' },
  synth: { name: 'Synth Pad', category: 'modern', description: 'Smooth synthesizer' },
  glow: { name: 'Glow', category: 'modern', description: 'Warm glowing tone' },
  
  // Classic
  bell: { name: 'Classic Bell', category: 'classic', description: 'Traditional bell' },
  chime: { name: 'Wind Chime', category: 'classic', description: 'Classic chime sound' },
  gong: { name: 'Soft Gong', category: 'classic', description: 'Gentle gong' },
  
  // System sounds
  tick: { name: 'Tick', category: 'system', description: 'Timer tick' },
  complete: { name: 'Complete', category: 'system', description: 'Session complete' },
  start: { name: 'Start', category: 'system', description: 'Session start' },
};

// Sound generation parameters for each type
// Each sound is carefully tuned to be pleasant and non-jarring
const SOUND_CONFIGS = {
  // Zen Bowl - Low, resonant, long decay
  zen: {
    frequencies: [174.61, 261.63, 329.63], // F3, C4, E4 - warm minor feel
    duration: 2.0,
    attack: 0.01,
    decay: 0.3,
    sustain: 0.4,
    release: 1.5,
    waveform: 'sine',
    harmonics: [1, 0.5, 0.25, 0.125],
    detune: 2,
  },
  
  // Forest Chime - Light, airy, multiple notes
  forest: {
    frequencies: [523.25, 659.25, 783.99, 1046.50], // C5, E5, G5, C6 - ascending
    duration: 1.5,
    attack: 0.005,
    decay: 0.2,
    sustain: 0.3,
    release: 1.0,
    waveform: 'sine',
    harmonics: [1, 0.3, 0.1],
    arpeggio: true,
    arpeggioDelay: 0.08,
  },
  
  // Ocean Wave - Sweeping, calming
  ocean: {
    frequencies: [146.83, 174.61, 220], // D3, F3, A3 - deep and warm
    duration: 2.5,
    attack: 0.5,
    decay: 0.5,
    sustain: 0.6,
    release: 1.5,
    waveform: 'sine',
    harmonics: [1, 0.7, 0.4, 0.2],
    sweep: true,
    sweepRange: 0.02,
  },
  
  // Meditation Bell - Deep, resonant
  meditation: {
    frequencies: [130.81, 196, 261.63], // C3, G3, C4 - perfect fifth
    duration: 3.0,
    attack: 0.001,
    decay: 0.4,
    sustain: 0.5,
    release: 2.5,
    waveform: 'sine',
    harmonics: [1, 0.8, 0.5, 0.3, 0.15],
    detune: 1.5,
  },
  
  // Piano Chord - Warm, rich
  piano: {
    frequencies: [261.63, 329.63, 392, 523.25], // C4, E4, G4, C5 - C major
    duration: 1.8,
    attack: 0.002,
    decay: 0.3,
    sustain: 0.5,
    release: 1.2,
    waveform: 'triangle',
    harmonics: [1, 0.5, 0.25, 0.125, 0.0625],
  },
  
  // Harp Glissando - Elegant sweep
  harp: {
    frequencies: [392, 440, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99], // G major scale
    duration: 1.2,
    attack: 0.001,
    decay: 0.15,
    sustain: 0.4,
    release: 0.6,
    waveform: 'sine',
    harmonics: [1, 0.4, 0.15],
    arpeggio: true,
    arpeggioDelay: 0.05,
  },
  
  // Marimba - Wooden, warm
  marimba: {
    frequencies: [392, 493.88, 587.33], // G4, B4, D5 - G major
    duration: 0.8,
    attack: 0.001,
    decay: 0.1,
    sustain: 0.3,
    release: 0.5,
    waveform: 'sine',
    harmonics: [1, 0.6, 0.2],
    decayFast: true,
  },
  
  // Music Box - Nostalgic, delicate
  music_box: {
    frequencies: [1046.50, 1318.51, 1567.98, 2093], // C6, E6, G6, C7 - high and delicate
    duration: 1.5,
    attack: 0.001,
    decay: 0.08,
    sustain: 0.2,
    release: 1.2,
    waveform: 'sine',
    harmonics: [1, 0.3, 0.1],
    arpeggio: true,
    arpeggioDelay: 0.12,
  },
  
  // Soft Ping - Modern notification
  soft_ping: {
    frequencies: [880, 1108.73], // A5, C#6
    duration: 0.4,
    attack: 0.001,
    decay: 0.1,
    sustain: 0.3,
    release: 0.25,
    waveform: 'sine',
    harmonics: [1, 0.2],
  },
  
  // Bubble Pop - Playful
  bubble: {
    frequencies: [600, 800, 1000], // Rising pitches
    duration: 0.3,
    attack: 0.001,
    decay: 0.05,
    sustain: 0.2,
    release: 0.2,
    waveform: 'sine',
    harmonics: [1, 0.3],
    pitchBend: true,
    bendAmount: 1.2,
  },
  
  // Synth Pad - Smooth electronic
  synth: {
    frequencies: [220, 277.18, 329.63, 440], // A3, C#4, E4, A4
    duration: 1.5,
    attack: 0.3,
    decay: 0.3,
    sustain: 0.7,
    release: 0.8,
    waveform: 'sine',
    harmonics: [1, 0.5, 0.25],
    chorus: true,
  },
  
  // Glow - Warm, fading in
  glow: {
    frequencies: [329.63, 392, 493.88], // E4, G4, B4
    duration: 1.2,
    attack: 0.4,
    decay: 0.2,
    sustain: 0.6,
    release: 0.5,
    waveform: 'sine',
    harmonics: [1, 0.6, 0.3],
  },
  
  // Classic Bell
  bell: {
    frequencies: [523.25, 659.25, 783.99], // C5, E5, G5
    duration: 1.0,
    attack: 0.001,
    decay: 0.2,
    sustain: 0.4,
    release: 0.6,
    waveform: 'sine',
    harmonics: [1, 0.6, 0.3, 0.15],
  },
  
  // Wind Chime
  chime: {
    frequencies: [440, 554.37, 659.25, 880], // A4, C#5, E5, A5
    duration: 1.2,
    attack: 0.001,
    decay: 0.15,
    sustain: 0.3,
    release: 0.8,
    waveform: 'sine',
    harmonics: [1, 0.4, 0.15],
    arpeggio: true,
    arpeggioDelay: 0.06,
  },
  
  // Soft Gong
  gong: {
    frequencies: [98, 130.81, 196], // G2, C3, G3
    duration: 3.0,
    attack: 0.01,
    decay: 0.5,
    sustain: 0.4,
    release: 2.5,
    waveform: 'sine',
    harmonics: [1, 0.8, 0.6, 0.4, 0.2],
    detune: 3,
  },
  
  // System Tick
  tick: {
    frequencies: [800],
    duration: 0.03,
    attack: 0.001,
    decay: 0.01,
    sustain: 0.5,
    release: 0.015,
    waveform: 'sine',
    harmonics: [1],
  },
  
  // Session Complete - Triumphant
  complete: {
    frequencies: [523.25, 659.25, 783.99, 1046.50], // C major rising
    duration: 1.0,
    attack: 0.01,
    decay: 0.15,
    sustain: 0.5,
    release: 0.5,
    waveform: 'sine',
    harmonics: [1, 0.5, 0.25],
    arpeggio: true,
    arpeggioDelay: 0.1,
  },
  
  // Session Start - Energizing
  start: {
    frequencies: [329.63, 392, 493.88], // E4, G4, B4
    duration: 0.5,
    attack: 0.01,
    decay: 0.1,
    sustain: 0.5,
    release: 0.3,
    waveform: 'sine',
    harmonics: [1, 0.4, 0.15],
  },
};

// Legacy sound paths (for backwards compatibility if MP3s exist)
const SOUNDS = {
  bell: '/sounds/bell.mp3',
  chime: '/sounds/chime.mp3',
  digital: '/sounds/digital.mp3',
  gentle: '/sounds/gentle.mp3',
  tick: '/sounds/tick.mp3',
  complete: '/sounds/complete.mp3',
  start: '/sounds/start.mp3',
  notification: '/sounds/notification.mp3',
};

class AudioManager {
  constructor() {
    this.audioContext = null;
    this.audioBuffers = new Map();
    this.audioElements = new Map();
    this.generatedBuffers = new Map();
    this.volume = 0.7;
    this.isEnabled = true;
    this.isPreloaded = false;
    this.preloadPromise = null;
    this.loadErrors = new Set();
  }
  
  /**
   * Initialize Audio Context (must be called from user gesture)
   */
  async init() {
    if (this.audioContext) return;
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      
      // Resume context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Pre-generate fallback sounds
      this._generateFallbackSounds();
      
      console.log('[AudioManager] Initialized');
    } catch (e) {
      console.warn('[AudioManager] Web Audio API not available:', e);
    }
  }
  
  /**
   * Generate a synthetic sound buffer using advanced synthesis
   */
  _generateSoundBuffer(soundName) {
    if (!this.audioContext) return null;
    
    const config = SOUND_CONFIGS[soundName];
    if (!config) return null;
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = config.duration;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate); // Stereo
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);
    
    const { 
      frequencies, 
      attack, 
      decay, 
      sustain, 
      release, 
      harmonics = [1],
      arpeggio = false,
      arpeggioDelay = 0,
      detune = 0,
      sweep = false,
      sweepRange = 0,
      pitchBend = false,
      bendAmount = 1,
      chorus = false,
    } = config;
    
    // Generate each frequency
    for (let freqIndex = 0; freqIndex < frequencies.length; freqIndex++) {
      const baseFreq = frequencies[freqIndex];
      const noteDelay = arpeggio ? freqIndex * arpeggioDelay : 0;
      const noteStartSample = Math.floor(noteDelay * sampleRate);
      
      // Generate harmonics for this frequency
      for (let harmIndex = 0; harmIndex < harmonics.length; harmIndex++) {
        const harmAmplitude = harmonics[harmIndex];
        const harmFreq = baseFreq * (harmIndex + 1);
        
        // Slight detune for richness
        const detuneL = 1 + (detune / 100) * (Math.random() - 0.5);
        const detuneR = 1 + (detune / 100) * (Math.random() - 0.5);
        
        for (let i = noteStartSample; i < length; i++) {
          const t = (i - noteStartSample) / sampleRate;
          if (t < 0) continue;
          
          const noteDuration = duration - noteDelay;
          const envelope = this._calculateEnvelope(t, noteDuration, attack, decay, sustain, release);
          
          // Apply sweep if configured
          let freqMod = 1;
          if (sweep) {
            freqMod = 1 + Math.sin(t * 2) * sweepRange;
          }
          if (pitchBend) {
            freqMod = 1 + (bendAmount - 1) * (1 - t / noteDuration);
          }
          
          // Generate sample with slight stereo detuning
          let sampleL = Math.sin(2 * Math.PI * harmFreq * freqMod * detuneL * t);
          let sampleR = Math.sin(2 * Math.PI * harmFreq * freqMod * detuneR * t);
          
          // Apply chorus effect if configured
          if (chorus) {
            const chorusMod = Math.sin(t * 3) * 0.003;
            sampleL += Math.sin(2 * Math.PI * harmFreq * (1 + chorusMod) * t) * 0.3;
            sampleR += Math.sin(2 * Math.PI * harmFreq * (1 - chorusMod) * t) * 0.3;
          }
          
          // Apply envelope and harmonic amplitude
          const amplitude = envelope * harmAmplitude * (0.4 / frequencies.length);
          dataL[i] += sampleL * amplitude;
          dataR[i] += sampleR * amplitude;
        }
      }
    }
    
    // Normalize to prevent clipping
    let maxSample = 0;
    for (let i = 0; i < length; i++) {
      maxSample = Math.max(maxSample, Math.abs(dataL[i]), Math.abs(dataR[i]));
    }
    if (maxSample > 0.95) {
      const normalize = 0.9 / maxSample;
      for (let i = 0; i < length; i++) {
        dataL[i] *= normalize;
        dataR[i] *= normalize;
      }
    }
    
    return buffer;
  }
  
  /**
   * Calculate ADSR envelope
   */
  _calculateEnvelope(t, duration, attack, decay, sustain, release) {
    const releaseStart = duration - release;
    
    if (t < attack) {
      // Attack phase - smooth curve up
      return (t / attack) * (t / attack); // Quadratic for smoother attack
    } else if (t < attack + decay) {
      // Decay phase
      const decayProgress = (t - attack) / decay;
      return 1 - (1 - sustain) * decayProgress;
    } else if (t < releaseStart) {
      // Sustain phase
      return sustain;
    } else if (t < duration) {
      // Release phase - exponential decay for natural sound
      const releaseProgress = (t - releaseStart) / release;
      return sustain * Math.pow(1 - releaseProgress, 2);
    }
    return 0;
  }
  
  /**
   * Generate fallback sounds for all types
   */
  _generateFallbackSounds() {
    if (!this.audioContext) return;
    
    for (const soundName of Object.keys(SOUND_CONFIGS)) {
      const buffer = this._generateSoundBuffer(soundName);
      if (buffer) {
        this.generatedBuffers.set(soundName, buffer);
      }
    }
    
    console.log(`[AudioManager] Generated ${this.generatedBuffers.size} synthesized sounds`);
  }
  
  /**
   * Preload all sounds
   */
  async preload() {
    if (this.preloadPromise) return this.preloadPromise;
    
    this.preloadPromise = this._doPreload();
    return this.preloadPromise;
  }
  
  async _doPreload() {
    console.log('[AudioManager] Preloading sounds...');
    
    // First, ensure we have fallback sounds generated
    await this.init();
    
    const loadPromises = Object.entries(SOUNDS).map(async ([name, path]) => {
      try {
        // First check if the file exists
        const headResponse = await fetch(path, { method: 'HEAD' }).catch(() => null);
        if (!headResponse || !headResponse.ok) {
          console.log(`[AudioManager] Sound file not found: ${name}, using generated fallback`);
          this.loadErrors.add(name);
          return;
        }
        
        // Try to load via Audio element first (more reliable fallback)
        const audio = new Audio();
        audio.preload = 'auto';
        
        await new Promise((resolve, reject) => {
          audio.oncanplaythrough = resolve;
          audio.onerror = reject;
          audio.src = path;
          
          // Timeout after 5 seconds
          setTimeout(() => resolve(), 5000);
        });
        
        this.audioElements.set(name, audio);
        console.log(`[AudioManager] Loaded: ${name}`);
        
        // Also try to load into AudioContext buffer for better performance
        if (this.audioContext) {
          try {
            const response = await fetch(path);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
              this.audioBuffers.set(name, audioBuffer);
            }
          } catch (e) {
            // Buffer loading failed, Audio element will be used as fallback
          }
        }
      } catch (e) {
        console.log(`[AudioManager] Failed to load ${name}, using generated fallback`);
        this.loadErrors.add(name);
      }
    });
    
    await Promise.allSettled(loadPromises);
    this.isPreloaded = true;
    
    const loadedCount = this.audioElements.size;
    const fallbackCount = this.loadErrors.size;
    console.log(`[AudioManager] Preloading complete: ${loadedCount} loaded, ${fallbackCount} using fallback`);
  }
  
  /**
   * Play a sound
   */
  async play(soundName, options = {}) {
    if (!this.isEnabled) return;
    
    // Ensure context is initialized
    await this.init();
    
    const volume = options.volume ?? this.volume;
    
    // Try Web Audio API first (more reliable in background)
    if (this.audioContext && this.audioBuffers.has(soundName)) {
      try {
        const buffer = this.audioBuffers.get(soundName);
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        gainNode.gain.value = volume;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start(0);
        return;
      } catch (e) {
        console.warn('[AudioManager] Web Audio playback failed, trying fallback');
      }
    }
    
    // Fall back to Audio element
    if (this.audioElements.has(soundName)) {
      try {
        const audio = this.audioElements.get(soundName);
        audio.volume = volume;
        audio.currentTime = 0;
        
        const playPromise = audio.play();
        if (playPromise) {
          await playPromise.catch(e => {
            console.warn('[AudioManager] Audio element playback failed:', e);
          });
        }
        return;
      } catch (e) {
        console.warn('[AudioManager] Fallback playback failed:', e);
      }
    }
    
    // Use generated fallback sound
    if (this.audioContext && this.generatedBuffers.has(soundName)) {
      try {
        const buffer = this.generatedBuffers.get(soundName);
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        gainNode.gain.value = volume;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start(0);
        return;
      } catch (e) {
        console.warn('[AudioManager] Generated sound playback failed:', e);
      }
    }
  }
  
  /**
   * Play a notification/completion sound
   */
  async playNotification(type = 'bell') {
    // Map old types to new if needed, otherwise use directly
    const soundName = SOUND_CONFIGS[type] ? type : 'bell';
    return this.play(soundName);
  }
  
  /**
   * Play session start sound
   */
  async playStart() {
    return this.play('start');
  }
  
  /**
   * Play session complete sound
   */
  async playComplete() {
    return this.play('complete');
  }
  
  /**
   * Play a tick sound (for countdown)
   */
  async playTick() {
    return this.play('tick', { volume: this.volume * 0.3 });
  }
  
  /**
   * Preview a specific sound type
   */
  async previewSound(soundType) {
    return this.play(soundType);
  }
  
  /**
   * Get list of available sound types for UI
   */
  static getSoundTypes() {
    return Object.entries(SOUND_TYPES)
      .filter(([key]) => !['tick', 'complete', 'start'].includes(key)) // Exclude system sounds
      .map(([key, info]) => ({
        id: key,
        ...info
      }));
  }
  
  /**
   * Get sound types grouped by category
   */
  static getSoundTypesByCategory() {
    const types = AudioManager.getSoundTypes();
    const categories = {
      calm: { name: '🧘 Calm & Relaxing', sounds: [] },
      musical: { name: '🎵 Musical', sounds: [] },
      modern: { name: '✨ Modern', sounds: [] },
      classic: { name: '🔔 Classic', sounds: [] },
    };
    
    types.forEach(sound => {
      if (categories[sound.category]) {
        categories[sound.category].sounds.push(sound);
      }
    });
    
    return categories;
  }
  
  /**
   * Set master volume
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }
  
  /**
   * Enable/disable sounds
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    this.audioElements.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.audioElements.clear();
    this.audioBuffers.clear();
    this.generatedBuffers.clear();
    this.loadErrors.clear();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance
let audioManagerInstance = null;

export function getAudioManager() {
  if (!audioManagerInstance) {
    audioManagerInstance = new AudioManager();
  }
  return audioManagerInstance;
}

export { SOUNDS, SOUND_TYPES, SOUND_CONFIGS };
export default AudioManager;
