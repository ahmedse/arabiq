'use client';

/**
 * VoiceOverPlayer Component
 * Audio player UI with play/pause, progress bar, volume controls
 */

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward, 
  Mic, 
  ChevronDown, 
  ChevronUp,
  X,
  AudioLines
} from 'lucide-react';
import { useVoiceOver, formatTime, type AudioClip } from '@/lib/voiceover';

interface VoiceOverPlayerProps {
  clips: AudioClip[];
  locale?: string;
  className?: string;
  autoPlayIntro?: boolean;
}

export function VoiceOverPlayer({ 
  clips, 
  locale = 'en',
  className = '',
  autoPlayIntro = true
}: VoiceOverPlayerProps) {
  const isRTL = locale === 'ar';
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const {
    currentClip,
    playback,
    isMinimized,
    isVisible,
    autoPlayEnabled,
    play,
    pause,
    resume,
    seek,
    setVolume,
    toggleMute,
    setAutoPlay,
    next,
    previous,
    toggleMinimize,
    hide,
  } = useVoiceOver(clips, {
    autoPlayEnabled: true,
  });
  
  // Auto-play intro on first interaction
  useEffect(() => {
    if (autoPlayIntro && hasInteracted && clips.length > 0 && !playback.clipId) {
      const introClip = clips.find(c => c.sortOrder === 0) || clips[0];
      if (introClip?.autoPlay) {
        play(introClip.id);
      }
    }
  }, [hasInteracted, clips, autoPlayIntro, play, playback.clipId]);
  
  // Handle first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      document.removeEventListener('click', handleInteraction);
    };
    document.addEventListener('click', handleInteraction);
    return () => document.removeEventListener('click', handleInteraction);
  }, []);
  
  // Don't render if no clips or hidden
  if (clips.length === 0 || !isVisible) {
    return null;
  }
  
  const progressPercent = playback.duration > 0 
    ? (playback.currentTime / playback.duration) * 100 
    : 0;
  
  const currentIndex = currentClip 
    ? clips.findIndex(c => c.id === currentClip.id) 
    : -1;
  const hasNext = currentIndex >= 0 && currentIndex < clips.length - 1;
  const hasPrevious = currentIndex > 0;
  
  // Minimized view - just a small button
  if (isMinimized) {
    return (
      <button
        onClick={toggleMinimize}
        className={`
          fixed bottom-20 ${isRTL ? 'left-4' : 'right-4'}
          z-50 w-12 h-12 rounded-full
          bg-primary text-white shadow-lg
          flex items-center justify-center
          hover:bg-primary/90 transition-all
          ${playback.isPlaying ? 'animate-pulse' : ''}
          ${className}
        `}
        aria-label="Open audio player"
      >
        <Mic className="w-5 h-5" />
        {playback.isPlaying && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
        )}
      </button>
    );
  }
  
  return (
    <div 
      className={`
        fixed bottom-4 ${isRTL ? 'left-4' : 'right-4'}
        z-50 w-80 bg-card rounded-xl shadow-2xl border border-border
        overflow-hidden
        ${className}
      `}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <AudioLines className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isRTL ? 'الدليل الصوتي' : 'Audio Guide'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMinimize}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Minimize"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={hide}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Current clip info */}
      <div className="px-4 py-3 border-b border-border">
        {currentClip ? (
          <>
            <h4 className="font-medium text-sm text-foreground truncate">
              {currentClip.title}
            </h4>
            {currentClip.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {currentClip.description}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isRTL ? 'اختر مقطعًا للاستماع' : 'Select a clip to listen'}
          </p>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="px-4 py-2">
        <div 
          className="relative h-2 bg-muted rounded-full cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = isRTL 
              ? rect.right - e.clientX 
              : e.clientX - rect.left;
            const percent = x / rect.width;
            seek(percent * playback.duration);
          }}
        >
          <div 
            className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ 
              [isRTL ? 'right' : 'left']: `calc(${progressPercent}% - 6px)` 
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatTime(playback.currentTime)}</span>
          <span>{formatTime(playback.duration)}</span>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={previous}
            disabled={!hasPrevious}
            className="p-2 hover:bg-muted rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          
          {/* Play/Pause */}
          <button
            onClick={() => {
              if (playback.isPlaying) {
                pause();
              } else if (playback.isPaused) {
                resume();
              } else if (clips.length > 0) {
                play(clips[0].id);
              }
            }}
            className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
            aria-label={playback.isPlaying ? 'Pause' : 'Play'}
          >
            {playback.isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : playback.isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>
          
          <button
            onClick={next}
            disabled={!hasNext}
            className="p-2 hover:bg-muted rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
        
        {/* Volume */}
        <div className="relative">
          <button
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            onBlur={() => setTimeout(() => setShowVolumeSlider(false), 200)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            aria-label="Volume"
          >
            {playback.isMuted ? (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          
          {showVolumeSlider && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg shadow-lg p-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={playback.volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-24 h-2 accent-primary rotate-[-90deg] origin-center"
              />
              <button
                onClick={toggleMute}
                className="mt-2 text-xs text-center w-full text-muted-foreground hover:text-foreground"
              >
                {playback.isMuted 
                  ? (isRTL ? 'إلغاء الكتم' : 'Unmute')
                  : (isRTL ? 'كتم' : 'Mute')}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Auto-play toggle */}
      <div className="px-4 py-2 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {isRTL ? 'تشغيل تلقائي' : 'Auto-play'}
        </span>
        <button
          onClick={() => setAutoPlay(!autoPlayEnabled)}
          className={`
            relative w-10 h-5 rounded-full transition-colors
            ${autoPlayEnabled ? 'bg-primary' : 'bg-muted'}
          `}
          aria-label={autoPlayEnabled ? 'Disable auto-play' : 'Enable auto-play'}
        >
          <span 
            className={`
              absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all
              ${autoPlayEnabled ? (isRTL ? 'left-0.5' : 'right-0.5') : (isRTL ? 'right-0.5' : 'left-0.5')}
            `}
          />
        </button>
      </div>
      
      {/* Clip list (if more than 1) */}
      {clips.length > 1 && (
        <div className="border-t border-border max-h-40 overflow-y-auto">
          {clips.map((clip, index) => (
            <button
              key={clip.id}
              onClick={() => play(clip.id)}
              className={`
                w-full px-4 py-2 text-left flex items-center gap-2
                hover:bg-muted/50 transition-colors
                ${currentClip?.id === clip.id ? 'bg-primary/10' : ''}
              `}
            >
              <span className="text-xs text-muted-foreground w-5">
                {index + 1}.
              </span>
              <span className="text-sm flex-1 truncate">
                {clip.title}
              </span>
              {currentClip?.id === clip.id && playback.isPlaying && (
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
