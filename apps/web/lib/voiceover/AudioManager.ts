/**
 * Audio Manager
 * Singleton class to manage audio playback for voice-overs
 */

import type { AudioClip, AudioManagerEvent, AudioManagerListener } from './types';

class AudioManager {
  private static instance: AudioManager;
  
  private audio: HTMLAudioElement | null = null;
  private currentClip: AudioClip | null = null;
  private listeners: Set<AudioManagerListener> = new Set();
  private preloadedUrls: Map<number, string> = new Map();
  private volume: number = 1;
  private isMuted: boolean = false;
  
  private constructor() {
    // Private constructor for singleton
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.setupEventListeners();
    }
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }
  
  /**
   * Setup audio element event listeners
   */
  private setupEventListeners(): void {
    if (!this.audio) return;
    
    this.audio.addEventListener('play', () => {
      if (this.currentClip) {
        this.emit({ type: 'play', clipId: this.currentClip.id });
      }
    });
    
    this.audio.addEventListener('pause', () => {
      if (this.currentClip) {
        this.emit({ type: 'pause', clipId: this.currentClip.id });
      }
    });
    
    this.audio.addEventListener('ended', () => {
      if (this.currentClip) {
        this.emit({ type: 'ended', clipId: this.currentClip.id });
      }
    });
    
    this.audio.addEventListener('timeupdate', () => {
      if (this.audio) {
        this.emit({
          type: 'timeupdate',
          currentTime: this.audio.currentTime,
          duration: this.audio.duration || 0,
        });
      }
    });
    
    this.audio.addEventListener('error', () => {
      const errorMsg = this.audio?.error?.message || 'Audio playback error';
      this.emit({ type: 'error', error: errorMsg });
    });
    
    this.audio.addEventListener('loadstart', () => {
      if (this.currentClip) {
        this.emit({ type: 'loading', clipId: this.currentClip.id });
      }
    });
    
    this.audio.addEventListener('canplaythrough', () => {
      if (this.currentClip) {
        this.emit({ type: 'loaded', clipId: this.currentClip.id });
      }
    });
  }
  
  /**
   * Emit event to all listeners
   */
  private emit(event: AudioManagerEvent): void {
    this.listeners.forEach(listener => listener(event));
  }
  
  /**
   * Subscribe to audio events
   */
  subscribe(listener: AudioManagerListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Preload audio clips for faster playback
   */
  preload(clips: AudioClip[]): void {
    clips.forEach(clip => {
      if (!this.preloadedUrls.has(clip.id)) {
        // Create preload link
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'audio';
        link.href = clip.audioUrl;
        document.head.appendChild(link);
        this.preloadedUrls.set(clip.id, clip.audioUrl);
      }
    });
  }
  
  /**
   * Play an audio clip
   */
  async play(clip: AudioClip): Promise<void> {
    if (!this.audio) return;
    
    // Stop current playback
    this.stop();
    
    // Set new clip
    this.currentClip = clip;
    this.audio.src = clip.audioUrl;
    this.audio.volume = this.isMuted ? 0 : this.volume;
    
    try {
      await this.audio.play();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to play audio';
      this.emit({ type: 'error', error: errorMsg });
    }
  }
  
  /**
   * Pause current playback
   */
  pause(): void {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
  }
  
  /**
   * Resume playback
   */
  async resume(): Promise<void> {
    if (this.audio && this.audio.paused && this.audio.src) {
      try {
        await this.audio.play();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to resume audio';
        this.emit({ type: 'error', error: errorMsg });
      }
    }
  }
  
  /**
   * Stop playback and reset
   */
  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.src = '';
    }
    this.currentClip = null;
  }
  
  /**
   * Seek to specific time
   */
  seek(time: number): void {
    if (this.audio && this.audio.duration) {
      this.audio.currentTime = Math.min(Math.max(0, time), this.audio.duration);
    }
  }
  
  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    this.volume = Math.min(Math.max(0, volume), 1);
    if (this.audio && !this.isMuted) {
      this.audio.volume = this.volume;
    }
  }
  
  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }
  
  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.audio) {
      this.audio.volume = this.isMuted ? 0 : this.volume;
    }
    return this.isMuted;
  }
  
  /**
   * Set mute state
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.audio) {
      this.audio.volume = this.isMuted ? 0 : this.volume;
    }
  }
  
  /**
   * Check if muted
   */
  isMutedState(): boolean {
    return this.isMuted;
  }
  
  /**
   * Get current clip
   */
  getCurrentClip(): AudioClip | null {
    return this.currentClip;
  }
  
  /**
   * Check if playing
   */
  isPlaying(): boolean {
    return this.audio ? !this.audio.paused : false;
  }
  
  /**
   * Get current time
   */
  getCurrentTime(): number {
    return this.audio?.currentTime || 0;
  }
  
  /**
   * Get duration
   */
  getDuration(): number {
    return this.audio?.duration || 0;
  }
  
  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    this.listeners.clear();
    this.preloadedUrls.clear();
    if (this.audio) {
      this.audio = null;
    }
  }
}

export default AudioManager;
