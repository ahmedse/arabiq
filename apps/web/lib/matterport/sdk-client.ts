'use client';

/**
 * Matterport SDK Client
 * Wrapper for Matterport SDK with multiple fallback strategies
 * Updated to use new Tag API (replaces deprecated Mattertag)
 * Ported from vmall studio pattern
 */

import type { Vector3, Rotation, SweepData, CameraState, PointerIntersection, TagDescriptor, HotspotPositionData } from './types';

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
  
  // Raw SDK access for advanced operations
  getSDK(): any;
  
  // Position & Camera
  getCameraPose(): Promise<CameraState>;
  moveTo(position: Vector3, rotation?: Rotation, sweepId?: string): Promise<boolean>;
  moveToSweep(sweepId: string, rotation?: Rotation): Promise<boolean>;
  
  // Click handling - returns full intersection data
  onClick(callback: (intersection: PointerIntersection) => void): () => void;
  
  // Subscriptions
  subscribeToPose(callback: (pose: CameraState) => void): () => void;
  subscribeToSweep(callback: (sweep: SweepData) => void): () => void;
  
  // New Tag API (replaces deprecated Mattertag)
  addTag(id: string, descriptor: TagDescriptor, options?: TagOptions): Promise<string>;
  editTagPosition(tagId: string, position: HotspotPositionData): Promise<void>;
  removeTag(id: string): Promise<void>;
  clearTags(): Promise<void>;
  
  // Legacy Mattertag support (fallback)
  addMarker(id: string, position: Vector3, options?: MarkerOptions): Promise<void>;
  removeMarker(id: string): Promise<void>;
  clearMarkers(): Promise<void>;
  
  // Sweep/Navigation utilities
  getSweepData(): Promise<SweepData[]>;
  findNearestSweep(position: Vector3): Promise<SweepData | null>;
  
  // Attachments for rich media in tags
  registerAttachment(src: string): Promise<string>;
}

export interface MarkerOptions {
  label?: string;
  description?: string;
  color?: { r: number; g: number; b: number };
  normal?: Vector3;
}

export interface TagOptions {
  /** Image/media URL to attach */
  attachmentSrc?: string;
  /** Allow navigation when clicking tag */
  allowNavigation?: boolean;
  /** Allow opening billboard on hover */
  allowOpening?: boolean;
  /** Custom icon ID */
  iconId?: string;
}

/**
 * Calculate distance between two 3D points
 */
function distance3D(a: Vector3, b: Vector3): number {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
    Math.pow(a.y - b.y, 2) +
    Math.pow(a.z - b.z, 2)
  );
}

/**
 * Calculate stem vector from surface normal
 * Ensures the tag points outward from the surface naturally
 */
function calculateStemVector(normal: Vector3, height: number = 0.3): Vector3 {
  // Normalize the normal vector
  const length = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
  if (length === 0) {
    // Default to pointing up if no normal
    return { x: 0, y: height, z: 0 };
  }
  
  return {
    x: (normal.x / length) * height,
    y: Math.max(0.1, (normal.y / length) * height + 0.1), // Ensure some upward component
    z: (normal.z / length) * height,
  };
}

/**
 * Create Matterport Controller
 */
export function createMatterportController(): MatterportController {
  let sdk: any = null;
  let connectedIframe: HTMLIFrameElement | null = null;
  let clickSubscription: any = null;
  const markers = new Map<string, string>();
  const tags = new Map<string, string>();
  const attachments = new Map<string, string>();
  let cachedSweeps: SweepData[] = [];

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
    
    // Pre-cache sweep data for navigation
    try {
      cachedSweeps = await getSweepData();
      console.log(`[MatterportController] Cached ${cachedSweeps.length} sweeps`);
    } catch (err) {
      console.debug('[MatterportController] Could not cache sweeps');
    }

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
    tags.clear();
    attachments.clear();
    cachedSweeps = [];
    sdk = null;
    connectedIframe = null;
  }

  function isConnected(): boolean {
    return sdk !== null;
  }
  
  function getSDK(): any {
    return sdk;
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

  /**
   * Move camera to position with multiple fallback strategies
   * @returns true if navigation succeeded, false otherwise
   */
  async function moveTo(
    position: Vector3,
    rotation?: Rotation,
    sweepId?: string
  ): Promise<boolean> {
    // Defensive check: SDK must be connected
    if (!sdk) {
      console.error('[MatterportController] moveTo failed: SDK not connected');
      return false;
    }

    // Validate position
    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number' || typeof position.z !== 'number') {
      console.error('[MatterportController] moveTo failed: Invalid position', position);
      return false;
    }

    const rot = rotation ?? { x: 0, y: 0 };

    // If no sweep ID provided, find the nearest one
    let targetSweepId = sweepId;
    if (!targetSweepId) {
      try {
        const nearestSweep = await findNearestSweep(position);
        if (nearestSweep) {
          targetSweepId = nearestSweep.sid;
          console.log(`[MatterportController] Found nearest sweep: ${targetSweepId}`);
        }
      } catch (e) {
        console.warn('[MatterportController] Failed to find nearest sweep:', e);
      }
    }

    // Strategy 1: Use Sweep.moveTo with sweep ID (MOST RELIABLE)
    if (targetSweepId && sdk.Sweep?.moveTo) {
      try {
        await sdk.Sweep.moveTo(targetSweepId, {
          rotation: rot,
          transition: sdk.Sweep?.Transition?.FLY ?? sdk.Camera?.TransitionType?.FLY ?? 1,
          transitionTime: 1500,
        });
        console.log('[MatterportController] ✅ Sweep.moveTo succeeded');
        return true;
      } catch (e) {
        console.warn('[MatterportController] Sweep.moveTo failed, trying fallback:', e);
      }
    }

    // Strategy 2: Use Mode.moveTo
    if (sdk.Mode?.moveTo) {
      try {
        await sdk.Mode.moveTo(sdk.Mode.Mode?.INSIDE ?? 'mode.inside', {
          position,
          rotation: rot,
          transition: sdk.Mode.TransitionType?.FLY ?? 1,
        });
        console.log('[MatterportController] ✅ Mode.moveTo succeeded');
        return true;
      } catch (e) {
        console.warn('[MatterportController] Mode.moveTo failed, trying fallback:', e);
      }
    }

    // Strategy 3: Camera API
    if (sdk.Camera?.moveTo) {
      try {
        await sdk.Camera.moveTo(position, { transitionType: 'fly' });
        if (rotation && sdk.Camera.rotateTo) {
          await new Promise(r => setTimeout(r, 300));
          await sdk.Camera.rotateTo(rot);
        }
        console.log('[MatterportController] ✅ Camera.moveTo succeeded');
        return true;
      } catch (e) {
        console.warn('[MatterportController] Camera.moveTo failed:', e);
      }
    }

    // Strategy 4: Last resort - try to at least change the sweep if we have one
    if (targetSweepId && sdk.Sweep?.data) {
      try {
        // Try simple sweep change without rotation
        const sweepData = sdk.Sweep.data;
        const sweep = Array.isArray(sweepData) 
          ? sweepData.find((s: any) => s.sid === targetSweepId)
          : null;
        
        if (sweep && sdk.Sweep.moveTo) {
          await sdk.Sweep.moveTo(targetSweepId);
          console.log('[MatterportController] ⚠️ Basic sweep navigation succeeded (no rotation)');
          return true;
        }
      } catch (e) {
        console.warn('[MatterportController] Last resort sweep navigation failed:', e);
      }
    }
    
    console.error('[MatterportController] ❌ All navigation methods failed');
    return false;
  }
  
  /**
   * Move to a specific sweep (panorama position)
   * @returns true if navigation succeeded, false otherwise
   */
  async function moveToSweep(sweepId: string, rotation?: Rotation): Promise<boolean> {
    // Defensive check: SDK must be connected
    if (!sdk) {
      console.error('[MatterportController] moveToSweep failed: SDK not connected');
      return false;
    }

    // Validate sweep ID
    if (!sweepId || typeof sweepId !== 'string') {
      console.error('[MatterportController] moveToSweep failed: Invalid sweepId', sweepId);
      return false;
    }
    
    const rot = rotation ?? { x: 0, y: 0 };
    
    // Try Sweep.moveTo with rotation
    if (sdk.Sweep?.moveTo) {
      try {
        await sdk.Sweep.moveTo(sweepId, {
          rotation: rot,
          transition: sdk.Sweep?.Transition?.FLY ?? 1,
          transitionTime: 1500,
        });
        console.log('[MatterportController] ✅ moveToSweep succeeded');
        return true;
      } catch (e) {
        console.warn('[MatterportController] moveToSweep with rotation failed, trying without:', e);
        
        // Fallback: Try without rotation options
        try {
          await sdk.Sweep.moveTo(sweepId);
          console.log('[MatterportController] ⚠️ moveToSweep succeeded (no rotation)');
          return true;
        } catch (e2) {
          console.error('[MatterportController] moveToSweep fallback failed:', e2);
        }
      }
    }
    
    console.error('[MatterportController] ❌ Sweep.moveTo not available');
    return false;
  }

  function onClick(
    callback: (intersection: PointerIntersection) => void
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
        // Build full intersection data
        const data: PointerIntersection = {
          position: intersection.position,
          normal: intersection.normal || { x: 0, y: 1, z: 0 },
          floorIndex: intersection.floorIndex,
          floorId: intersection.floorId,
          object: intersection.object || 'model',
        };
        callback(data);
      }
    });
    
    console.log('[MatterportController] Pointer.intersection subscription active');

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
      // Try new observable API first
      if (sdk.Sweep?.data) {
        return new Promise((resolve) => {
          const sweeps: SweepData[] = [];
          let resolved = false;
          
          const sub = sdk.Sweep.data.subscribe({
            onCollectionUpdated: (collection: any) => {
              if (resolved) return;
              
              try {
                // Handle different collection types from Matterport SDK
                let items: any[] = [];
                
                if (Array.isArray(collection)) {
                  items = collection;
                } else if (collection instanceof Map) {
                  items = Array.from(collection.values());
                } else if (typeof collection === 'object' && collection !== null) {
                  // Plain object - get values
                  items = Object.values(collection);
                }
                
                for (const sweep of items) {
                  if (sweep && sweep.position) {
                    sweeps.push({
                      sid: sweep.sid || sweep.id || '',
                      position: sweep.position,
                      rotation: sweep.rotation || { x: 0, y: 0 },
                      floor: sweep.floorInfo?.sequence ?? sweep.floor ?? 0,
                      neighbors: sweep.neighbors || [],
                      enabled: sweep.enabled !== false,
                    });
                  }
                }
                
                resolved = true;
                try { sub.cancel(); } catch {}
                resolve(sweeps);
              } catch (e) {
                console.warn('[MatterportController] Error processing sweep collection:', e);
                resolved = true;
                try { sub.cancel(); } catch {}
                resolve([]);
              }
            },
          });
          
          // Timeout fallback
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              try { sub.cancel(); } catch {}
              resolve(sweeps);
            }
          }, 2000);
        });
      }
      
      if (sdk.Model?.getData) {
        const modelData = await sdk.Model.getData();
        if (modelData?.sweeps) {
          return modelData.sweeps;
        }
      }
      return [];
    } catch (err) {
      console.debug('[MatterportController] Sweep data unavailable:', err);
      return cachedSweeps;
    }
  }
  
  /**
   * Find the nearest sweep (panorama position) to a given 3D position
   * @returns SweepData if found, null otherwise
   */
  async function findNearestSweep(position: Vector3): Promise<SweepData | null> {
    // Validate position
    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number' || typeof position.z !== 'number') {
      console.error('[MatterportController] findNearestSweep: Invalid position', position);
      return null;
    }
    
    try {
      let sweeps = cachedSweeps;
      if (sweeps.length === 0) {
        sweeps = await getSweepData();
        cachedSweeps = sweeps;
      }
      
      if (!sweeps || sweeps.length === 0) {
        console.warn('[MatterportController] findNearestSweep: No sweeps available');
        return null;
      }
      
      let nearest: SweepData | null = null;
      let minDist = Infinity;
      
      for (const sweep of sweeps) {
        // Skip disabled sweeps or sweeps with invalid positions
        if (!sweep || !sweep.enabled || !sweep.position) continue;
        
        try {
          const dist = distance3D(position, sweep.position);
          if (dist < minDist) {
            minDist = dist;
            nearest = sweep;
          }
        } catch (err) {
          // Skip this sweep if distance calculation fails
          console.warn('[MatterportController] Failed to calculate distance for sweep:', sweep.sid, err);
          continue;
        }
      }
      
      if (nearest) {
        console.log(`[MatterportController] Found nearest sweep: ${nearest.sid} at distance ${minDist.toFixed(2)}m`);
      } else {
        console.warn('[MatterportController] No enabled sweep found near position');
      }
      
      return nearest;
    } catch (err) {
      console.error('[MatterportController] findNearestSweep failed:', err);
      return null;
    }
  }
  
  // NEW TAG API (replaces deprecated Mattertag)
  async function addTag(
    id: string,
    descriptor: TagDescriptor,
    options: TagOptions = {}
  ): Promise<string> {
    if (!sdk) throw new Error('SDK not connected');
    
    // Try new Tag API first
    if (sdk.Tag?.add) {
      try {
        // Register attachment if provided
        let attachmentIds: string[] = [];
        if (options.attachmentSrc) {
          const attId = await registerAttachment(options.attachmentSrc);
          attachmentIds = [attId];
        }
        
        const [tagId] = await sdk.Tag.add({
          label: descriptor.label,
          description: descriptor.description || '',
          anchorPosition: descriptor.anchorPosition,
          stemVector: descriptor.stemVector,
          color: descriptor.color || { r: 0.2, g: 0.5, b: 1.0 },
          enabled: descriptor.enabled !== false,
          stemVisible: descriptor.stemVisible !== false,
          attachments: attachmentIds,
        });
        
        tags.set(id, tagId);
        
        // Configure tag behavior
        if (sdk.Tag.allowAction) {
          await sdk.Tag.allowAction(tagId, {
            opening: options.allowOpening !== false,
            navigating: options.allowNavigation !== false,
            docking: true,
            sharing: false,
          });
        }
        
        console.log('[MatterportController] Added tag via Tag API:', id);
        return tagId;
      } catch (err) {
        console.warn('[MatterportController] Tag.add failed, falling back to Mattertag:', err);
      }
    }
    
    // Fallback to Mattertag (deprecated but may still work)
    await addMarker(id, descriptor.anchorPosition, {
      label: descriptor.label,
      description: descriptor.description,
      color: descriptor.color,
      normal: descriptor.stemVector,
    });
    
    return id;
  }
  
  async function editTagPosition(tagId: string, position: HotspotPositionData): Promise<void> {
    if (!sdk) throw new Error('SDK not connected');
    
    const internalId = tags.get(tagId);
    if (!internalId) {
      console.warn('[MatterportController] Tag not found:', tagId);
      return;
    }
    
    if (sdk.Tag?.editPosition) {
      await sdk.Tag.editPosition(internalId, {
        anchorPosition: position.anchorPosition,
        stemVector: position.stemVector,
        roomId: position.roomId,
      });
      console.log('[MatterportController] Updated tag position:', tagId);
    }
  }
  
  async function removeTag(id: string): Promise<void> {
    const tagId = tags.get(id);
    if (!tagId) return;
    
    if (sdk?.Tag?.remove) {
      try {
        await sdk.Tag.remove(tagId);
        tags.delete(id);
        console.log('[MatterportController] Removed tag:', id);
        return;
      } catch (err) {
        console.warn('[MatterportController] Tag.remove failed:', err);
      }
    }
    
    // Fallback
    await removeMarker(id);
  }
  
  async function clearTags(): Promise<void> {
    const tagIds = Array.from(tags.values());
    
    if (sdk?.Tag?.remove && tagIds.length > 0) {
      try {
        await sdk.Tag.remove(...tagIds);
        tags.clear();
        return;
      } catch (err) {
        console.warn('[MatterportController] Tag.remove failed:', err);
      }
    }
    
    await clearMarkers();
  }
  
  async function registerAttachment(src: string): Promise<string> {
    if (!sdk) throw new Error('SDK not connected');
    
    if (attachments.has(src)) {
      return attachments.get(src)!;
    }
    
    if (sdk.Tag?.registerAttachment) {
      const [attachmentId] = await sdk.Tag.registerAttachment(src);
      attachments.set(src, attachmentId);
      return attachmentId;
    }
    
    throw new Error('Tag.registerAttachment not available');
  }

  return {
    connect,
    disconnect,
    isConnected,
    getSDK,
    getCameraPose,
    moveTo,
    moveToSweep,
    onClick,
    subscribeToPose,
    subscribeToSweep,
    // New Tag API
    addTag,
    editTagPosition,
    removeTag,
    clearTags,
    registerAttachment,
    // Legacy Mattertag support
    addMarker,
    removeMarker,
    clearMarkers,
    // Sweep utilities
    getSweepData,
    findNearestSweep,
  };
}
