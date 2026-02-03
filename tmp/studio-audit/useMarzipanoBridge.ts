/**
 * useMarzipanoBridge Hook
 * 
 * Manages postMessage communication with Marzipano viewer in iframe.
 * Provides hotspot CRUD operations and camera pose tracking.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface MarzipanoPose {
  yaw: number;
  pitch: number;
  fov: number;
  sceneId: string | null;
}

interface MarzipanoHotspot {
  id: string;
  position: { yaw: number; pitch: number };
  data: any;
}

interface UseMarzipanoBridgeProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onReady?: () => void;
  onPoseChange?: (pose: MarzipanoPose) => void;
  onHotspotClick?: (hotspotId: string) => void;
}

export function useMarzipanoBridge({
  iframeRef,
  onReady,
  onPoseChange,
  onHotspotClick,
}: UseMarzipanoBridgeProps) {
  const [isReady, setIsReady] = useState(false);
  const [currentPose, setCurrentPose] = useState<MarzipanoPose | null>(null);
  const requestIdCounter = useRef(0);
  const pendingRequests = useRef<Map<number, (data: any) => void>>(new Map());

  // Send message to iframe
  const sendMessage = useCallback((type: string, data: any = {}) => {
    if (!iframeRef.current?.contentWindow) {
      console.warn('[MarzipanoBridge] Iframe not ready');
      return null;
    }

    const requestId = ++requestIdCounter.current;
    const message = { type, requestId, ...data };
    
    iframeRef.current.contentWindow.postMessage(message, '*');
    return requestId;
  }, [iframeRef]);

  // Send message and wait for response
  const sendRequest = useCallback((type: string, data: any = {}): Promise<any> => {
    return new Promise((resolve, reject) => {
      const requestId = sendMessage(type, data);
      if (requestId === null) {
        reject(new Error('Failed to send message'));
        return;
      }

      pendingRequests.current.set(requestId, resolve);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (pendingRequests.current.has(requestId)) {
          pendingRequests.current.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, 5000);
    });
  }, [sendMessage]);

  // Get current camera pose
  const getPose = useCallback(async (): Promise<MarzipanoPose> => {
    const response = await sendRequest('MARZIPANO_GET_POSE');
    return response.pose;
  }, [sendRequest]);

  // Add hotspot
  const addHotspot = useCallback((hotspot: MarzipanoHotspot) => {
    sendMessage('MARZIPANO_ADD_HOTSPOT', {
      hotspotId: hotspot.id,
      position: hotspot.position,
      data: hotspot.data,
    });
  }, [sendMessage]);

  // Update hotspot
  const updateHotspot = useCallback((hotspot: MarzipanoHotspot) => {
    sendMessage('MARZIPANO_UPDATE_HOTSPOT', {
      hotspotId: hotspot.id,
      position: hotspot.position,
      data: hotspot.data,
    });
  }, [sendMessage]);

  // Delete hotspot
  const deleteHotspot = useCallback((hotspotId: string) => {
    sendMessage('MARZIPANO_DELETE_HOTSPOT', { hotspotId });
  }, [sendMessage]);

  // Highlight hotspot
  const highlightHotspot = useCallback((hotspotId: string | null) => {
    sendMessage('MARZIPANO_HIGHLIGHT_HOTSPOT', { hotspotId });
  }, [sendMessage]);

  // Look at specific yaw/pitch position
  const lookAt = useCallback((position: { yaw: number; pitch: number }) => {
    sendMessage('MARZIPANO_LOOK_AT', { position });
  }, [sendMessage]);

  // Switch to a different scene
  const switchScene = useCallback((sceneId: string) => {
    sendMessage('MARZIPANO_SWITCH_SCENE', { sceneId });
  }, [sendMessage]);

  // Get list of all scenes
  const getScenes = useCallback(async (): Promise<{ id: string; name: string }[]> => {
    try {
      const response = await sendRequest('MARZIPANO_GET_SCENES');
      return response.scenes || [];
    } catch (err) {
      console.error('[MarzipanoBridge] Failed to get scenes:', err);
      return [];
    }
  }, [sendRequest]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: Verify origin - allow localhost and the current host
      const allowedOrigins = [
        /^https?:\/\/localhost(:\d+)?$/,
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
        new RegExp(`^${window.location.protocol}//${window.location.host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
      ];
      
      const isAllowed = allowedOrigins.some(pattern => {
        if (pattern instanceof RegExp) {
          return pattern.test(event.origin);
        }
        return event.origin === pattern;
      });
      
      // Debug: Log all incoming messages
      if (event.data?.type?.startsWith('MARZIPANO_')) {
        console.log('[MarzipanoBridge Hook] Message from origin:', event.origin, 'allowed:', isAllowed, 'type:', event.data.type);
      }
      
      if (!isAllowed) {
        return;
      }

      const message = event.data;
      if (!message.type || !message.type.startsWith('MARZIPANO_')) return;

      console.log('[MarzipanoBridge Hook] Processing:', message.type);

      switch (message.type) {
        case 'MARZIPANO_READY':
          console.log('[MarzipanoBridge] Bridge connected, scenes:', message.sceneCount);
          setIsReady(true);
          onReady?.();
          break;

        case 'MARZIPANO_POSE_RESPONSE':
          setCurrentPose(message.pose);
          onPoseChange?.(message.pose);
          
          // Resolve pending request
          if (message.requestId && pendingRequests.current.has(message.requestId)) {
            const resolve = pendingRequests.current.get(message.requestId);
            resolve?.(message);
            pendingRequests.current.delete(message.requestId);
          }
          break;

        case 'MARZIPANO_HOTSPOT_CLICKED':
          onHotspotClick?.(message.hotspotId);
          break;

        case 'MARZIPANO_SCENE_CHANGED':
          // Update current pose with new scene ID
          if (message.sceneId) {
            setCurrentPose(prev => prev ? { ...prev, sceneId: message.sceneId } : null);
          }
          break;

        case 'MARZIPANO_SCENES_RESPONSE':
          // Resolve pending request for scenes list
          if (message.requestId && pendingRequests.current.has(message.requestId)) {
            const resolve = pendingRequests.current.get(message.requestId);
            resolve?.(message);
            pendingRequests.current.delete(message.requestId);
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onReady, onPoseChange, onHotspotClick]);

  // Poll for pose updates when ready
  useEffect(() => {
    if (!isReady) return;
    
    const pollPose = async () => {
      try {
        const pose = await getPose();
        // Pose will be updated via the message handler
      } catch (err) {
        // Ignore polling errors
      }
    };
    
    // Initial poll
    pollPose();
    
    // Poll every 500ms
    const interval = setInterval(pollPose, 500);
    return () => clearInterval(interval);
  }, [isReady, getPose]);

  return {
    isReady,
    currentPose,
    getPose,
    addHotspot,
    updateHotspot,
    deleteHotspot,
    highlightHotspot,
    lookAt,
    switchScene,
    getScenes,
  };
}
