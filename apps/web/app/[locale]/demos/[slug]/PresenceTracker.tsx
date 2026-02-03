'use client';

/**
 * Presence Tracker
 * Tracks visitor position in 3D space and reports to server
 */

import { useEffect, useRef, useCallback } from 'react';
import { useMatterport } from '@/components/matterport';

interface PresenceTrackerProps {
  demoSlug: string;
  sessionId: string;
  visitorName?: string;
  locale?: string;
  enabled?: boolean;
}

export function PresenceTracker({ 
  demoSlug, 
  sessionId, 
  visitorName,
  locale,
  enabled = true 
}: PresenceTrackerProps) {
  const { sdk, isReady } = useMatterport();
  const isRegistered = useRef(false);
  const lastPosition = useRef<{ x: number; y: number; z: number } | null>(null);
  
  // Register visitor on mount
  useEffect(() => {
    if (!enabled || isRegistered.current) return;
    
    const registerVisitor = async () => {
      try {
        await fetch('/api/presence/visitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'join',
            slug: demoSlug,
            sessionId,
            name: visitorName,
            locale,
            userAgent: navigator.userAgent,
          }),
        });
        isRegistered.current = true;
      } catch (error) {
        console.error('Failed to register visitor:', error);
      }
    };
    
    registerVisitor();
    
    // Unregister on unmount
    return () => {
      if (isRegistered.current) {
        fetch('/api/presence/visitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'leave',
            slug: demoSlug,
            sessionId,
          }),
        }).catch(console.error);
      }
    };
  }, [demoSlug, sessionId, visitorName, locale, enabled]);
  
  // Track camera position
  const updatePosition = useCallback(async (position: { x: number; y: number; z: number }, currentLocation?: string) => {
    if (!enabled || !isRegistered.current) return;
    
    // Only update if position changed significantly
    if (lastPosition.current) {
      const dx = Math.abs(position.x - lastPosition.current.x);
      const dy = Math.abs(position.y - lastPosition.current.y);
      const dz = Math.abs(position.z - lastPosition.current.z);
      if (dx < 0.5 && dy < 0.5 && dz < 0.5) return;
    }
    
    lastPosition.current = position;
    
    try {
      await fetch('/api/presence/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move',
          slug: demoSlug,
          sessionId,
          position,
          currentLocation,
        }),
      });
    } catch (error) {
      console.error('Failed to update position:', error);
    }
  }, [demoSlug, sessionId, enabled]);
  
  // Listen to camera position changes from Matterport SDK
  useEffect(() => {
    if (!sdk || !isReady || !enabled) return;
    
    let isMounted = true;
    
    // Poll camera position every 3 seconds
    const pollPosition = async () => {
      if (!isMounted || !isRegistered.current) return;
      
      try {
        // Get current camera pose
        const pose = await sdk.Camera?.getPose?.();
        if (pose?.position) {
          updatePosition(pose.position, undefined);
        }
      } catch (error) {
        // Ignore errors - SDK might not be ready
      }
    };
    
    // Initial poll
    pollPosition();
    
    // Poll every 3 seconds
    const interval = setInterval(pollPosition, 3000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [sdk, isReady, enabled, updatePosition]);
  
  // Heartbeat to keep visitor alive
  useEffect(() => {
    if (!enabled) return;
    
    const heartbeat = setInterval(async () => {
      if (!isRegistered.current) return;
      
      try {
        await fetch('/api/presence/visitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'heartbeat',
            slug: demoSlug,
            sessionId,
          }),
        });
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, 60000); // Every minute
    
    return () => clearInterval(heartbeat);
  }, [demoSlug, sessionId, enabled]);
  
  // This component doesn't render anything
  return null;
}

// Generate a unique session ID for the visitor
export function generateSessionId(): string {
  const stored = typeof window !== 'undefined' 
    ? sessionStorage.getItem('vtour-session-id') 
    : null;
    
  if (stored) return stored;
  
  const newId = `visitor-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('vtour-session-id', newId);
  }
  
  return newId;
}
