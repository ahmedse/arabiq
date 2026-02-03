'use client';

/**
 * React Hooks for Matterport SDK
 * 
 * Uses the setupSdk approach which handles iframe creation/connection.
 * The SDK connects to an existing iframe via the iframe option.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MATTERPORT_SDK_KEY } from './config';
import type { 
  MatterportSDK, 
  CameraState, 
  MattertagData,
  SweepData,
  FloorData,
  MattertagDescriptor,
  Vector3
} from './types';

// SDK loading state
interface SdkState {
  sdk: MatterportSDK | null;
  isLoading: boolean;
  isReady: boolean;
  error: Error | null;
}

/**
 * Hook to manage Matterport SDK instance
 * Uses setupSdk from @matterport/sdk
 */
export function useMatterportSdk(
  modelId: string | undefined,
  containerRef: React.RefObject<HTMLElement | null>,
  retryTrigger: number = 0
) {
  const [state, setState] = useState<SdkState>({
    sdk: null,
    isLoading: true,
    isReady: false,
    error: null,
  });
  
  const sdkRef = useRef<MatterportSDK | null>(null);
  
  useEffect(() => {
    if (!modelId || !containerRef.current) {
      setState({
        sdk: null,
        isLoading: false,
        isReady: false,
        error: new Error('No model ID or container provided'),
      });
      return;
    }
    
    let mounted = true;
    
    // Clean up previous iframe if exists (for retry)
    if (containerRef.current) {
      const existingIframe = containerRef.current.querySelector('iframe');
      if (existingIframe) {
        existingIframe.remove();
      }
    }
    
    const connectSdk = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Import and connect SDK
        const { setupSdk } = await import('@matterport/sdk');
        
        const sdk = await setupSdk(MATTERPORT_SDK_KEY, {
          space: modelId,
          container: containerRef.current!,
          iframeAttributes: {
            style: 'width: 100%; height: 100%; border: none;',
          },
          iframeQueryParams: {
            qs: 1,
            play: 1,
            title: 0,
            brand: 0,
            mls: 2,
            mt: 0,
          },
        });
        
        if (mounted) {
          sdkRef.current = sdk as unknown as MatterportSDK;
          setState({
            sdk: sdk as unknown as MatterportSDK,
            isLoading: false,
            isReady: true,
            error: null,
          });
        }
      } catch (err) {
        console.error('[Matterport SDK] Connection error:', err);
        if (mounted) {
          setState({
            sdk: null,
            isLoading: false,
            isReady: false,
            error: err instanceof Error ? err : new Error('Failed to connect SDK'),
          });
        }
      }
    };
    
    connectSdk();
    
    return () => {
      mounted = false;
      // Clean up iframe if SDK created one
      if (containerRef.current) {
        const iframe = containerRef.current.querySelector('iframe');
        if (iframe) {
          iframe.remove();
        }
      }
    };
  }, [modelId, containerRef, retryTrigger]);
  
  return state;
}

/**
 * Hook to track camera position
 */
export function useCamera(sdk: MatterportSDK | null) {
  const [camera, setCamera] = useState<CameraState | null>(null);
  
  useEffect(() => {
    if (!sdk) return;
    
    // Get initial camera state
    sdk.Camera.getPose().then(setCamera);
    
    // Subscribe to camera updates
    const handleMove = () => {
      sdk.Camera.getPose().then(setCamera);
    };
    
    sdk.on('camera.move', handleMove as (event: unknown) => void);
    
    return () => {
      sdk.off('camera.move', handleMove as (event: unknown) => void);
    };
  }, [sdk]);
  
  const moveTo = useCallback(async (sweepId: string) => {
    if (!sdk) return;
    await sdk.Camera.moveToSweep(sweepId, { transition: 'fly' });
  }, [sdk]);
  
  const rotate = useCallback(async (rotation: { x: number; y: number }) => {
    if (!sdk) return;
    await sdk.Camera.setRotation(rotation);
  }, [sdk]);
  
  return { camera, moveTo, rotate };
}

/**
 * Hook to manage Mattertags (hotspots)
 */
export function useMattertags(sdk: MatterportSDK | null) {
  const [tags, setTags] = useState<MattertagData[]>([]);
  
  useEffect(() => {
    if (!sdk) return;
    
    // Get existing tags
    sdk.Mattertag.getData().then(setTags);
    
    // Subscribe to tag clicks
    const handleClick = (event: unknown) => {
      const tagEvent = event as { sid: string };
      // Can emit custom event here
      console.log('[Matterport] Tag clicked:', tagEvent.sid);
    };
    
    sdk.on('mattertag.click', handleClick as (event: unknown) => void);
    
    return () => {
      sdk.off('mattertag.click', handleClick as (event: unknown) => void);
    };
  }, [sdk]);
  
  const addTag = useCallback(async (descriptor: MattertagDescriptor): Promise<string | null> => {
    if (!sdk) return null;
    const [sid] = await sdk.Mattertag.add([descriptor]);
    setTags(prev => [...prev, { 
      sid, 
      ...descriptor,
      floorIndex: descriptor.floorIndex ?? 0,
      stemVector: descriptor.stemVector ?? { x: 0, y: 0.3, z: 0 },
      enabled: true,
    } as MattertagData]);
    return sid;
  }, [sdk]);
  
  const removeTag = useCallback(async (sid: string) => {
    if (!sdk) return;
    await sdk.Mattertag.remove([sid]);
    setTags(prev => prev.filter(t => t.sid !== sid));
  }, [sdk]);
  
  const navigateToTag = useCallback(async (sid: string) => {
    if (!sdk) return;
    await sdk.Mattertag.navigateToTag(sid, { transition: 'fly' });
  }, [sdk]);
  
  return { tags, addTag, removeTag, navigateToTag };
}

/**
 * Hook to manage sweeps (panorama positions)
 */
export function useSweeps(sdk: MatterportSDK | null) {
  const [sweeps, setSweeps] = useState<SweepData[]>([]);
  const [currentSweep, setCurrentSweep] = useState<string | null>(null);
  
  useEffect(() => {
    if (!sdk) return;
    
    // Get sweep data
    setSweeps(sdk.Sweep.data || []);
    setCurrentSweep(sdk.Sweep.current?.sid || null);
    
    // Subscribe to sweep changes
    const handleEnter = (event: unknown) => {
      const sweepEvent = event as { to: string };
      setCurrentSweep(sweepEvent.to);
    };
    
    sdk.on('sweep.enter', handleEnter as (event: unknown) => void);
    
    return () => {
      sdk.off('sweep.enter', handleEnter as (event: unknown) => void);
    };
  }, [sdk]);
  
  const moveTo = useCallback(async (sweepId: string) => {
    if (!sdk) return;
    await sdk.Sweep.moveTo(sweepId);
  }, [sdk]);
  
  return { sweeps, currentSweep, moveTo };
}

/**
 * Hook to manage floors
 */
export function useFloors(sdk: MatterportSDK | null) {
  const [floors, setFloors] = useState<FloorData[]>([]);
  const [currentFloor, setCurrentFloor] = useState<string | null>(null);
  
  useEffect(() => {
    if (!sdk) return;
    
    setFloors(sdk.Floor.data || []);
    setCurrentFloor(sdk.Floor.current?.id || null);
    
    const handleChange = () => {
      setCurrentFloor(sdk.Floor.current?.id || null);
    };
    
    sdk.on('floor.change', handleChange as (event: unknown) => void);
    
    return () => {
      sdk.off('floor.change', handleChange as (event: unknown) => void);
    };
  }, [sdk]);
  
  const moveTo = useCallback(async (floorId: string) => {
    if (!sdk) return;
    await sdk.Floor.moveTo(floorId);
  }, [sdk]);
  
  return { floors, currentFloor, moveTo };
}

/**
 * Hook to track visitor position for real-time presence
 */
export function useVisitorPosition(sdk: MatterportSDK | null) {
  const [position, setPosition] = useState<Vector3 | null>(null);
  const lastUpdate = useRef<number>(0);
  const THROTTLE_MS = 500; // Update at most every 500ms
  
  useEffect(() => {
    if (!sdk) return;
    
    const handleMove = async () => {
      const now = Date.now();
      if (now - lastUpdate.current < THROTTLE_MS) return;
      
      lastUpdate.current = now;
      const pose = await sdk.Camera.getPose();
      setPosition(pose.position);
    };
    
    sdk.on('camera.move', handleMove as (event: unknown) => void);
    
    // Get initial position
    sdk.Camera.getPose().then(pose => setPosition(pose.position));
    
    return () => {
      sdk.off('camera.move', handleMove as (event: unknown) => void);
    };
  }, [sdk]);
  
  return position;
}
