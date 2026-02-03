'use client';

/**
 * Matterport SDK Client
 * Wrapper for Matterport SDK with multiple fallback strategies
 * Ported from vmall studio pattern
 */

import type { Vector3, Rotation, SweepData, CameraState } from './types';

const MATTERPORT_SDK_KEY = process.env.NEXT_PUBLIC_MATTERPORT_SDK_KEY || '';
const MATTERPORT_SDK_URL = 'https://static.matterport.com/showcase-sdk/latest.js';

/**
 * Load Matterport SDK script
 */
export async function loadMatterportSDK(): Promise<void> {
  if (typeof window === 'undefined') return;

  const w = window as any;

  if (w.MP_SDK) return;

  if (w.__MP_SDK_LOAD_PROMISE__) {
    return w.__MP_SDK_LOAD_PROMISE__ as Promise<void>;
  }

  w.__MP_SDK_LOAD_PROMISE__ = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${MATTERPORT_SDK_URL}"]`
    );
    
    if (existing && w.MP_SDK) {
      console.log('[MatterportSDK] Script already loaded');
      resolve();
      return;
    }

    const script = existing || document.createElement('script');
    script.src = MATTERPORT_SDK_URL;
    script.async = true;

    script.onload = () => {
      console.log('[MatterportSDK] Script loaded successfully');
      resolve();
    };

    script.onerror = (err) => {
      console.error('[MatterportSDK] Failed to load script:', err);
      reject(new Error('Failed to load Matterport SDK'));
    };

    if (!existing) {
      document.head.appendChild(script);
    }
  });

  return w.__MP_SDK_LOAD_PROMISE__;
}

/**
 * Matterport SDK Controller Interface
 */
export interface MatterportController {
  connect(iframe: HTMLIFrameElement): Promise<any>;
  disconnect(): void;
  isConnected(): boolean;
  
  // Position & Camera
  getCameraPose(): Promise<CameraState>;
  moveTo(position: Vector3, rotation?: Rotation, sweepId?: string): Promise<void>;
  
  // Click handling
  onClick(callback: (position: Vector3, normal: Vector3) => void): () => void;
  
  // Subscriptions
  subscribeToPose(callback: (pose: CameraState) => void): () => void;
  subscribeToSweep(callback: (sweep: SweepData) => void): () => void;
  
  // Markers
  addMarker(id: string, position: Vector3, options?: MarkerOptions): Promise<void>;
  removeMarker(id: string): Promise<void>;
  clearMarkers(): Promise<void>;
  
  // Data
  getSweepData(): Promise<SweepData[]>;
}

export interface MarkerOptions {
  label?: string;
  description?: string;
  color?: { r: number; g: number; b: number };
  normal?: Vector3;
}

/**
 * Create Matterport Controller
 */
export function createMatterportController(): MatterportController {
  let sdk: any = null;
  let connectedIframe: HTMLIFrameElement | null = null;
  let clickSubscription: any = null;
  const markers = new Map<string, string>();

  async function connect(iframe: HTMLIFrameElement): Promise<any> {
    if (!MATTERPORT_SDK_KEY) {
      throw new Error('NEXT_PUBLIC_MATTERPORT_SDK_KEY not configured');
    }

    await loadMatterportSDK();
    
    const w = window as any;
    if (!w.MP_SDK) {
      throw new Error('MP_SDK not available after script load');
    }

    console.log('[MatterportController] Connecting to SDK...');
    sdk = await w.MP_SDK.connect(iframe, MATTERPORT_SDK_KEY, '');
    connectedIframe = iframe;
    console.log('[MatterportController] Connected successfully');

    return sdk;
  }

  function disconnect(): void {
    if (clickSubscription) {
      try {
        clickSubscription.cancel();
      } catch {}
      clickSubscription = null;
    }
    markers.clear();
    sdk = null;
    connectedIframe = null;
  }

  function isConnected(): boolean {
    return sdk !== null;
  }

  async function getCameraPose(): Promise<CameraState> {
    if (!sdk?.Camera) {
      throw new Error('Camera API not available');
    }

    let pose: any = null;
    
    // Try multiple API shapes for different SDK versions
    if (sdk.Camera.pose?.get) {
      pose = await sdk.Camera.pose.get();
    } else if (sdk.Camera.getPose) {
      pose = await sdk.Camera.getPose();
    }

    if (!pose?.position) {
      throw new Error('Camera pose not available');
    }

    return {
      position: {
        x: pose.position.x,
        y: pose.position.y,
        z: pose.position.z,
      },
      rotation: {
        x: pose.rotation?.x || 0,
        y: pose.rotation?.y || 0,
      },
      sweep: pose.sweep || '',
      mode: pose.mode || 'mode.inside',
    };
  }

  async function moveTo(
    position: Vector3,
    rotation?: Rotation,
    sweepId?: string
  ): Promise<void> {
    if (!sdk) throw new Error('SDK not connected');

    const rot = rotation ?? { x: 0, y: 0 };

    // Strategy 1: Use Sweep.moveTo if we have sweep ID
    if (sweepId && sdk.Sweep?.moveTo) {
      try {
        await sdk.Sweep.moveTo(sweepId, {
          rotation: rot,
          transition: sdk.Mode?.TransitionType?.FLY ?? 1,
        });
        return;
      } catch (e) {
        console.warn('[MatterportController] Sweep.moveTo failed, trying fallback');
      }
    }

    // Strategy 2: Use Mode.moveTo
    if (sdk.Mode?.moveTo) {
      try {
        await sdk.Mode.moveTo(sdk.Mode.Mode.INSIDE, {
          position,
          rotation: rot,
          transition: sdk.Mode.TransitionType.FLY,
        });
        return;
      } catch (e) {
        console.warn('[MatterportController] Mode.moveTo failed');
      }
    }

    // Strategy 3: Camera API
    if (sdk.Camera?.moveTo) {
      await sdk.Camera.moveTo(position, { transitionType: 'fly' });
      if (rotation && sdk.Camera.rotateTo) {
        await new Promise(r => setTimeout(r, 300));
        await sdk.Camera.rotateTo(rot);
      }
    }
  }

  function onClick(
    callback: (position: Vector3, normal: Vector3) => void
  ): () => void {
    if (!sdk?.Pointer?.intersection) {
      console.warn('[MatterportController] Pointer.intersection not available');
      return () => {};
    }

    // Clear previous subscription
    if (clickSubscription) {
      try {
        clickSubscription.cancel();
      } catch {}
    }

    clickSubscription = sdk.Pointer.intersection.subscribe((intersection: any) => {
      if (intersection?.position) {
        callback(
          intersection.position,
          intersection.normal || { x: 0, y: 1, z: 0 }
        );
      }
    });

    return () => {
      if (clickSubscription) {
        try {
          clickSubscription.cancel();
          clickSubscription = null;
        } catch {}
      }
    };
  }

  function subscribeToPose(callback: (pose: CameraState) => void): () => void {
    if (!sdk?.Camera?.pose) {
      console.warn('[MatterportController] Camera.pose not available');
      return () => {};
    }

    const sub = sdk.Camera.pose.subscribe((pose: any) => {
      callback({
        position: pose.position,
        rotation: pose.rotation || { x: 0, y: 0 },
        sweep: pose.sweep || '',
        mode: pose.mode || 'mode.inside',
      });
    });

    return () => {
      try {
        sub.cancel();
      } catch {}
    };
  }

  function subscribeToSweep(callback: (sweep: SweepData) => void): () => void {
    if (!sdk?.Sweep?.current) {
      console.warn('[MatterportController] Sweep.current not available');
      return () => {};
    }

    const sub = sdk.Sweep.current.subscribe(callback);

    return () => {
      try {
        sub.cancel();
      } catch {}
    };
  }

  async function addMarker(
    id: string,
    position: Vector3,
    options: MarkerOptions = {}
  ): Promise<void> {
    if (!sdk?.Mattertag) {
      console.warn('[MatterportController] Mattertag API not available');
      return;
    }

    if (markers.has(id)) {
      await removeMarker(id);
    }

    const {
      label = 'Hotspot',
      description = '',
      color = { r: 0.2, g: 0.5, b: 1.0 },
      normal = { x: 0, y: 1, z: 0 },
    } = options;

    // Calculate stem vector from normal
    const stemLength = 0.3;
    const stemVector = {
      x: normal.x * stemLength,
      y: Math.max(0.1, normal.y * stemLength + 0.2),
      z: normal.z * stemLength,
    };

    try {
      const [matterId] = await sdk.Mattertag.add([{
        label,
        description,
        anchorPosition: position,
        stemVector,
        color,
      }]);

      markers.set(id, matterId);
      console.log('[MatterportController] Added marker:', id);
    } catch (err) {
      console.error('[MatterportController] Failed to add marker:', err);
    }
  }

  async function removeMarker(id: string): Promise<void> {
    if (!sdk?.Mattertag) return;

    const matterId = markers.get(id);
    if (matterId) {
      try {
        await sdk.Mattertag.remove([matterId]);
        markers.delete(id);
      } catch (err) {
        console.warn('[MatterportController] Failed to remove marker:', err);
      }
    }
  }

  async function clearMarkers(): Promise<void> {
    if (!sdk?.Mattertag) return;

    const markerIds = Array.from(markers.values());
    if (markerIds.length === 0) return;

    try {
      await sdk.Mattertag.remove(markerIds);
      markers.clear();
    } catch (err) {
      console.warn('[MatterportController] Failed to clear markers:', err);
    }
  }

  async function getSweepData(): Promise<SweepData[]> {
    if (!sdk) return [];

    try {
      if (sdk.Model?.getData) {
        const modelData = await sdk.Model.getData();
        if (modelData?.sweeps) {
          return modelData.sweeps;
        }
      }
      return [];
    } catch (err) {
      console.debug('[MatterportController] Sweep data unavailable:', err);
      return [];
    }
  }

  return {
    connect,
    disconnect,
    isConnected,
    getCameraPose,
    moveTo,
    onClick,
    subscribeToPose,
    subscribeToSweep,
    addMarker,
    removeMarker,
    clearMarkers,
    getSweepData,
  };
}
