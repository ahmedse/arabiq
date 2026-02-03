/**
 * Voice-Over System Types
 * TypeScript definitions for audio tour guide feature
 */

/**
 * Audio clip from CMS
 */
export interface AudioClip {
  id: number;
  title: string;
  description?: string;
  audioUrl: string;
  duration?: number; // in seconds
  transcript?: string;
  triggerType: 'hotspot' | 'location' | 'manual';
  hotspotPosition?: {
    x: number;
    y: number;
    z: number;
  };
  sweepId?: string; // For location-based triggers
  autoPlay: boolean;
  sortOrder: number;
  locale: string;
}

/**
 * Playback state for a single audio clip
 */
export interface PlaybackState {
  clipId: number | null;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  hasEnded: boolean;
  error?: string;
}

/**
 * Voice-over context state
 */
export interface VoiceOverState {
  // Clips
  clips: AudioClip[];
  currentClip: AudioClip | null;
  
  // Playback
  playback: PlaybackState;
  
  // Auto-play
  autoPlayEnabled: boolean;
  playedClips: Set<number>; // Track which clips have been played
  
  // UI
  isMinimized: boolean;
  isVisible: boolean;
}

/**
 * Voice-over actions
 */
export interface VoiceOverActions {
  // Playback controls
  play: (clipId?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  
  // Auto-play
  setAutoPlay: (enabled: boolean) => void;
  
  // Navigation
  next: () => void;
  previous: () => void;
  
  // UI
  toggleMinimize: () => void;
  show: () => void;
  hide: () => void;
  
  // Load clips
  loadClips: (clips: AudioClip[]) => void;
}

/**
 * Combined voice-over hook return type
 */
export interface UseVoiceOverReturn extends VoiceOverState, VoiceOverActions {}

/**
 * Audio manager event types
 */
export type AudioManagerEvent = 
  | { type: 'play'; clipId: number }
  | { type: 'pause'; clipId: number }
  | { type: 'ended'; clipId: number }
  | { type: 'timeupdate'; currentTime: number; duration: number }
  | { type: 'error'; error: string }
  | { type: 'loading'; clipId: number }
  | { type: 'loaded'; clipId: number };

/**
 * Audio manager listener
 */
export type AudioManagerListener = (event: AudioManagerEvent) => void;

/**
 * Strapi voice-over response
 */
export interface StrapiVoiceOver {
  id: number;
  title: string;
  description?: string;
  transcript?: string;
  duration?: number;
  triggerType: 'hotspot' | 'location' | 'manual';
  hotspotPosition?: {
    x: number;
    y: number;
    z: number;
  };
  autoPlay: boolean;
  sortOrder: number;
  audioFile?: {
    url: string;
    alternativeText?: string;
  };
}
