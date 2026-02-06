'use client';

/**
 * React Hooks for Matterport SDK
 * 
 * Uses iframe + MP_SDK.connect() approach for reliability
 * (setupSdk approach has loading issues)
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
 * Build Matterport showcase URL with SDK bundle enabled
 */
function buildShowcaseUrl(modelId: string): string {
  const params = new URLSearchParams({
    m: modelId,
    play: '1',
    qs: '1',
    title: '0',
    brand: '0',
    help: '0',
    applicationKey: MATTERPORT_SDK_KEY,
  });
  return `https://my.matterport.com/show?${params.toString()}`;
}

// Extend Window interface for Matterport SDK
declare global {
  interface Window {
    MP_SDK: any;
  }
}

/**
 * Load MP_SDK script into the main window
 * Returns a promise that resolves when MP_SDK is available on window
 */
function loadMPSDK(): Promise<typeof window.MP_SDK> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).MP_SDK) {
      resolve((window as any).MP_SDK);
      return;
    }
    
    // Check if script is already loading
    const existing = document.querySelector('script[src*="matterport.com/sdk"]');
    if (existing) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if ((window as any).MP_SDK) {
          clearInterval(checkInterval);
          resolve((window as any).MP_SDK);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('MP_SDK script load timeout'));
      }, 15000);
      return;
    }
    
    // Load the script
    const script = document.createElement('script');
    script.src = `https://static.matterport.com/showcase-sdk/latest.js?m=latest&applicationKey=${MATTERPORT_SDK_KEY}`;
    script.async = true;
    script.onload = () => {
      if ((window as any).MP_SDK) {
        resolve((window as any).MP_SDK);
      } else {
        reject(new Error('MP_SDK not found after script load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load MP_SDK script'));
    document.head.appendChild(script);
  });
}

/**
 * Hook to manage Matterport SDK instance
 * Uses iframe + MP_SDK.connect() approach (more reliable than setupSdk)
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
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  
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
    let attemptCount = 0;
    const maxAttempts = 3;
    
    // Clean up previous iframe if exists
    if (containerRef.current) {
      const existingIframe = containerRef.current.querySelector('iframe');
      if (existingIframe) {
        existingIframe.remove();
      }
    }
    
    const connectSdk = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Step 1: Load MP_SDK script into main window
        console.log('[Matterport SDK] Loading MP_SDK script...');
        const MP_SDK = await loadMPSDK();
        if (!mounted) return;
        
        console.log('[Matterport SDK] MP_SDK loaded, creating iframe...');
        
        // Step 2: Create iframe
        const iframe = document.createElement('iframe');
        iframe.src = buildShowcaseUrl(modelId);
        iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
        iframe.allow = 'fullscreen; xr-spatial-tracking';
        iframe.allowFullscreen = true;
        
        containerRef.current!.appendChild(iframe);
        iframeRef.current = iframe;
        
        // Step 3: Wait for iframe to load
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Iframe load timeout')), 30000);
          iframe.onload = () => {
            clearTimeout(timeout);
            resolve();
          };
          iframe.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Iframe failed to load'));
          };
        });
        
        if (!mounted) return;
        
        console.log('[Matterport SDK] Iframe loaded, connecting SDK...');
        
        // Step 4: Connect SDK to iframe (pass iframe element, not contentWindow)
        const sdk = await MP_SDK.connect(iframe, MATTERPORT_SDK_KEY, '');
        
        if (mounted) {
          sdkRef.current = sdk as unknown as MatterportSDK;
          console.log('[Matterport SDK] Connected successfully');
          setState({
            sdk: sdk as unknown as MatterportSDK,
            isLoading: false,
            isReady: true,
            error: null,
          });
        }
      } catch (err) {
        console.error('[Matterport SDK] Connection error:', err);
        
        // Retry logic
        attemptCount++;
        if (attemptCount < maxAttempts && mounted) {
          console.log(`[Matterport SDK] Retrying... (${attemptCount}/${maxAttempts})`);
          const delay = 1000 * Math.pow(2, attemptCount - 1);
          await new Promise(r => setTimeout(r, delay));
          if (mounted) {
            // Clean up and retry
            if (iframeRef.current) {
              iframeRef.current.remove();
              iframeRef.current = null;
            }
            connectSdk();
          }
          return;
        }
        
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
      // Clean up iframe
      if (iframeRef.current) {
        iframeRef.current.remove();
        iframeRef.current = null;
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

    type MoveToFn = (id: string, options?: unknown) => Promise<unknown> | unknown;
    const sdkObj = sdk as unknown as Record<string, unknown>;
    const sweepObj = sdkObj['Sweep'];
    const sweepMoveTo =
      sweepObj && typeof sweepObj === 'object'
        ? (sweepObj as Record<string, unknown>)['moveTo']
        : undefined;

    if (typeof sweepMoveTo === 'function') {
      await (sweepMoveTo as MoveToFn)(sweepId, {
        transition: 'fly',
        transitionTime: 1500,
      });
      return;
    }

    // Fallback: if the SDK doesn't support sweep navigation, do nothing.
    console.warn('[useCamera] Sweep.moveTo not available on this SDK instance');
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
    
    // Get existing tags using Mattertag API
    sdk.Mattertag.getData().then(setTags).catch(err => {
      console.error('[useMattertags] Failed to get tags:', err);
      setTags([]);
    });
    
    // Subscribe to tag clicks
    const handleClick = (event: unknown) => {
      const tagEvent = event as { sid: string };
      console.log('[Matterport] Tag clicked:', tagEvent.sid);
    };
    
    sdk.on('mattertag.click', handleClick as (event: unknown) => void);
    
    return () => {
      sdk.off('mattertag.click', handleClick as (event: unknown) => void);
    };
  }, [sdk]);
  
  const addTag = useCallback(async (descriptor: MattertagDescriptor): Promise<string | null> => {
    if (!sdk) return null;
    try {
      const [sid] = await sdk.Mattertag.add([descriptor]);
      setTags(prev => [...prev, { 
        sid, 
        ...descriptor,
        floorIndex: descriptor.floorIndex ?? 0,
        stemVector: descriptor.stemVector ?? { x: 0, y: 0.3, z: 0 },
        enabled: true,
      } as MattertagData]);
      return sid;
    } catch (error) {
      console.error('[useMattertags] Failed to add tag:', error);
      return null;
    }
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
    if (!sdk) {
      setFloors([]);
      setCurrentFloor(null);
      return;
    }
    
    // Access Floor data directly (it's a property, not a method)
    try {
      if (sdk.Floor && sdk.Floor.data) {
        const floorData = sdk.Floor.data;
        setFloors(Array.isArray(floorData) ? floorData : []);
      } else {
        setFloors([]);
      }
      
      // Access current floor directly
      if (sdk.Floor && sdk.Floor.current) {
        setCurrentFloor(sdk.Floor.current.id || null);
      }
    } catch (err) {
      console.warn('[useFloors] Floor API error:', err);
      setFloors([]);
    }
    
    const handleChange = () => {
      if (sdk.Floor?.current) {
        setCurrentFloor(sdk.Floor.current.id || null);
      }
    };
    
    sdk.on('floor.change', handleChange as (event: unknown) => void);
    
    return () => {
      sdk.off('floor.change', handleChange as (event: unknown) => void);
    };
  }, [sdk]);
  
  const moveTo = useCallback(async (floorId: string) => {
    if (!sdk || !sdk.Floor) return;
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
