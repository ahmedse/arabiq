/**
 * Voice-Over Hooks
 * React hooks for voice-over playback and location-based triggers
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMatterport } from '@/components/matterport';
import AudioManager from './AudioManager';
import type { 
  AudioClip, 
  PlaybackState, 
  UseVoiceOverReturn,
  AudioManagerEvent 
} from './types';

const initialPlaybackState: PlaybackState = {
  clipId: null,
  isPlaying: false,
  isPaused: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  isLoading: false,
  hasEnded: false,
};

/**
 * Main voice-over hook
 * Manages playback state and location-based auto-play
 */
export function useVoiceOver(
  clips: AudioClip[],
  options: {
    autoPlayEnabled?: boolean;
    onClipStart?: (clip: AudioClip) => void;
    onClipEnd?: (clip: AudioClip) => void;
  } = {}
): UseVoiceOverReturn {
  const { sdk, isReady } = useMatterport();
  const audioManager = useRef<AudioManager | null>(null);
  
  // State
  const [currentClip, setCurrentClip] = useState<AudioClip | null>(null);
  const [playback, setPlayback] = useState<PlaybackState>(initialPlaybackState);
  const [autoPlayEnabled, setAutoPlayEnabledState] = useState(options.autoPlayEnabled ?? true);
  const [playedClips, setPlayedClips] = useState<Set<number>>(new Set());
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  // Initialize audio manager
  useEffect(() => {
    audioManager.current = AudioManager.getInstance();
    
    // Preload all audio clips
    if (clips.length > 0) {
      audioManager.current.preload(clips);
    }
    
    // Subscribe to audio events
    const unsubscribe = audioManager.current.subscribe((event: AudioManagerEvent) => {
      handleAudioEvent(event);
    });
    
    return () => {
      unsubscribe();
    };
  }, [clips]);
  
  // Handle audio manager events
  const handleAudioEvent = useCallback((event: AudioManagerEvent) => {
    switch (event.type) {
      case 'play':
        setPlayback(prev => ({
          ...prev,
          clipId: event.clipId,
          isPlaying: true,
          isPaused: false,
          isLoading: false,
          hasEnded: false,
        }));
        break;
        
      case 'pause':
        setPlayback(prev => ({
          ...prev,
          isPlaying: false,
          isPaused: true,
        }));
        break;
        
      case 'ended':
        setPlayback(prev => ({
          ...prev,
          isPlaying: false,
          isPaused: false,
          hasEnded: true,
        }));
        // Track played clip
        setPlayedClips(prev => new Set([...prev, event.clipId]));
        // Callback
        const clip = clips.find(c => c.id === event.clipId);
        if (clip && options.onClipEnd) {
          options.onClipEnd(clip);
        }
        break;
        
      case 'timeupdate':
        setPlayback(prev => ({
          ...prev,
          currentTime: event.currentTime,
          duration: event.duration,
        }));
        break;
        
      case 'loading':
        setPlayback(prev => ({
          ...prev,
          clipId: event.clipId,
          isLoading: true,
        }));
        break;
        
      case 'loaded':
        setPlayback(prev => ({
          ...prev,
          isLoading: false,
        }));
        break;
        
      case 'error':
        setPlayback(prev => ({
          ...prev,
          isPlaying: false,
          isLoading: false,
          error: event.error,
        }));
        break;
    }
  }, [clips, options]);
  
  // Location-based auto-play using sweep changes
  useEffect(() => {
    if (!sdk || !isReady || !autoPlayEnabled) return;
    
    let isMounted = true;
    let lastSweepId: string | null = null;
    
    // Poll for sweep changes (since SDK subscription is limited)
    const checkSweep = async () => {
      if (!isMounted) return;
      
      try {
        const pose = await sdk.Camera?.getPose?.();
        const currentSweep = pose?.sweep;
        
        if (currentSweep && currentSweep !== lastSweepId) {
          lastSweepId = currentSweep;
          
          // Find clip for this sweep
          const clip = clips.find(
            c => c.triggerType === 'location' && 
                 c.sweepId === currentSweep &&
                 !playedClips.has(c.id)
          );
          
          if (clip && clip.autoPlay) {
            play(clip.id);
          }
        }
      } catch {
        // Ignore errors
      }
    };
    
    // Check every 2 seconds
    const interval = setInterval(checkSweep, 2000);
    checkSweep(); // Initial check
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [sdk, isReady, clips, autoPlayEnabled, playedClips]);
  
  // Playback controls
  const play = useCallback((clipId?: number) => {
    if (!audioManager.current) return;
    
    const clip = clipId 
      ? clips.find(c => c.id === clipId)
      : clips[0];
      
    if (clip) {
      setCurrentClip(clip);
      audioManager.current.play(clip);
      
      if (options.onClipStart) {
        options.onClipStart(clip);
      }
    }
  }, [clips, options]);
  
  const pause = useCallback(() => {
    audioManager.current?.pause();
  }, []);
  
  const resume = useCallback(() => {
    audioManager.current?.resume();
  }, []);
  
  const stop = useCallback(() => {
    audioManager.current?.stop();
    setCurrentClip(null);
    setPlayback(initialPlaybackState);
  }, []);
  
  const seek = useCallback((time: number) => {
    audioManager.current?.seek(time);
  }, []);
  
  const setVolume = useCallback((volume: number) => {
    audioManager.current?.setVolume(volume);
    setPlayback(prev => ({ ...prev, volume }));
  }, []);
  
  const toggleMute = useCallback(() => {
    const isMuted = audioManager.current?.toggleMute() ?? false;
    setPlayback(prev => ({ ...prev, isMuted }));
  }, []);
  
  // Auto-play toggle
  const setAutoPlay = useCallback((enabled: boolean) => {
    setAutoPlayEnabledState(enabled);
  }, []);
  
  // Navigation
  const next = useCallback(() => {
    const currentIndex = currentClip 
      ? clips.findIndex(c => c.id === currentClip.id)
      : -1;
    const nextClip = clips[currentIndex + 1];
    if (nextClip) {
      play(nextClip.id);
    }
  }, [clips, currentClip, play]);
  
  const previous = useCallback(() => {
    const currentIndex = currentClip 
      ? clips.findIndex(c => c.id === currentClip.id)
      : 1;
    const prevClip = clips[currentIndex - 1];
    if (prevClip) {
      play(prevClip.id);
    }
  }, [clips, currentClip, play]);
  
  // UI controls
  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);
  
  const show = useCallback(() => {
    setIsVisible(true);
  }, []);
  
  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);
  
  // Load clips
  const loadClips = useCallback((newClips: AudioClip[]) => {
    // Reset played clips when loading new ones
    setPlayedClips(new Set());
    // Preload new clips
    if (audioManager.current) {
      audioManager.current.preload(newClips);
    }
  }, []);
  
  return {
    // State
    clips,
    currentClip,
    playback,
    autoPlayEnabled,
    playedClips,
    isMinimized,
    isVisible,
    
    // Actions
    play,
    pause,
    resume,
    stop,
    seek,
    setVolume,
    toggleMute,
    setAutoPlay,
    next,
    previous,
    toggleMinimize,
    show,
    hide,
    loadClips,
  };
}

/**
 * Format seconds to MM:SS display
 */
export function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
