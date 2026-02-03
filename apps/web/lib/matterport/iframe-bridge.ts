'use client';

/**
 * Matterport Iframe Bridge
 * Communicates with Matterport iframe via postMessage to get position data
 * This works without SDK client connection issues
 */

import { useEffect, useState, useCallback, useRef } from 'react';

export interface MatterportPosition {
  // Camera pose
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number };
  // Current sweep (room/location)
  sweep?: string;
  // Floor info
  floor?: number;
}

interface UseMatterportIframeProps {
  iframeId?: string;
}

/**
 * Hook to get position from Matterport iframe
 * Uses URL hash changes and iframe messaging
 */
export function useMatterportIframe({ iframeId = 'matterport-iframe' }: UseMatterportIframeProps = {}) {
  const [position, setPosition] = useState<MatterportPosition | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Parse position from Matterport URL
  const parsePositionFromUrl = useCallback((url: string): MatterportPosition | null => {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      // Matterport stores position in URL params after navigation
      // Format: ?m=MODEL&sr=-2.84,1.13&ss=SWEEP_ID
      const sr = params.get('sr'); // camera rotation
      const ss = params.get('ss'); // sweep ID
      const f = params.get('f');   // floor
      
      if (sr) {
        const [yaw, pitch] = sr.split(',').map(Number);
        return {
          position: { x: 0, y: 0, z: 0 }, // Position not in URL directly
          rotation: { x: pitch || 0, y: yaw || 0 },
          sweep: ss || undefined,
          floor: f ? parseInt(f) : undefined,
        };
      }
      return null;
    } catch {
      return null;
    }
  }, []);
  
  // Start tracking position
  const startTracking = useCallback(() => {
    setIsTracking(true);
    
    // Poll iframe src for URL changes
    intervalRef.current = setInterval(() => {
      const iframe = document.getElementById(iframeId) as HTMLIFrameElement;
      if (iframe?.src) {
        const pos = parsePositionFromUrl(iframe.src);
        if (pos) {
          setPosition(pos);
        }
      }
    }, 500);
  }, [iframeId, parsePositionFromUrl]);
  
  // Stop tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  return {
    position,
    isTracking,
    startTracking,
    stopTracking,
  };
}

/**
 * Get current camera position by injecting script into iframe
 * Note: This only works if the iframe allows it (same-origin or CORS)
 */
export function getCameraPositionFromConsole(): string {
  return `
// Paste this in the browser console while on the Matterport viewer:
// It will log the current camera position

(async function() {
  if (window.MP_SDK) {
    const sdk = await window.MP_SDK.connect(window);
    const pose = await sdk.Camera.getPose();
    console.log('=== CAMERA POSITION ===');
    console.log('X:', pose.position.x.toFixed(3));
    console.log('Y:', pose.position.y.toFixed(3));
    console.log('Z:', pose.position.z.toFixed(3));
    console.log('Copy:', JSON.stringify({
      x: Math.round(pose.position.x * 100) / 100,
      y: Math.round(pose.position.y * 100) / 100,
      z: Math.round(pose.position.z * 100) / 100,
    }));
  } else {
    console.log('MP_SDK not available');
  }
})();
`;
}
