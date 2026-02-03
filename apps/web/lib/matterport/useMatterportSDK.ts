'use client';

/**
 * useMatterportSDK Hook
 * React hook for Matterport SDK connection with retry logic
 * Updated to support enhanced position data and new Tag API
 * Ported from vmall studio pattern
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { createMatterportController, type MatterportController } from './sdk-client';
import type { Vector3, CameraState, PointerIntersection, HotspotPositionData } from './types';

export type SDKStatus = 'idle' | 'connecting' | 'retrying' | 'ready' | 'failed';

interface UseMatterportSDKOptions {
  /** Matterport showcase URL */
  tourUrl: string | null;
  /** Callback when user clicks in the tour - receives full intersection data */
  onClick?: (intersection: PointerIntersection) => void;
  /** Legacy callback (deprecated) */
  onClickLegacy?: (position: Vector3, normal: Vector3) => void;
  /** Max connection attempts (default: 3) */
  maxAttempts?: number;
  /** Base retry delay in ms (default: 1000) */
  baseRetryDelayMs?: number;
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
}

interface UseMatterportSDKResult {
  /** Ref to attach to iframe */
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  /** SDK controller instance */
  controller: MatterportController;
  /** Connection status */
  status: SDKStatus;
  /** Current camera pose */
  currentPose: CameraState | null;
  /** Current sweep ID */
  currentSweep: string | null;
  /** Total number of sweeps in model */
  totalSweeps: number;
  /** Last error message */
  lastError: string | null;
  /** Move camera to position (finds nearest sweep automatically) */
  moveTo: (position: Vector3, rotation?: { x: number; y: number }, sweepId?: string) => Promise<void>;
  /** Move to a specific sweep */
  moveToSweep: (sweepId: string, rotation?: { x: number; y: number }) => Promise<void>;
  /** Manually trigger connection */
  connect: () => Promise<void>;
  /** Find nearest sweep to a position */
  findNearestSweep: (position: Vector3) => Promise<{ sweepId: string; position: Vector3 } | null>;
}

/**
 * Hook to manage Matterport SDK connection
 */
export function useMatterportSDK({
  tourUrl,
  onClick,
  onClickLegacy,
  maxAttempts = 3,
  baseRetryDelayMs = 1000,
  autoConnect = true,
}: UseMatterportSDKOptions): UseMatterportSDKResult {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [controller] = useState(() => createMatterportController());
  const [status, setStatus] = useState<SDKStatus>('idle');
  const [currentPose, setCurrentPose] = useState<CameraState | null>(null);
  const [currentSweep, setCurrentSweep] = useState<string | null>(null);
  const [totalSweeps, setTotalSweeps] = useState<number>(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const attemptRef = useRef(0);
  const cancelRef = useRef(false);
  const onClickRef = useRef(onClick);
  const onClickLegacyRef = useRef(onClickLegacy);
  const clickCleanupRef = useRef<(() => void) | null>(null);

  // Keep onClick ref updated
  useEffect(() => {
    onClickRef.current = onClick;
    onClickLegacyRef.current = onClickLegacy;
  }, [onClick, onClickLegacy]);

  // Update click handler when SDK is ready (only when status changes)
  useEffect(() => {
    if (status === 'ready' && controller) {
      // Clean up previous handler
      if (clickCleanupRef.current) {
        clickCleanupRef.current();
      }
      // Set up new handler using ref - receives full intersection data
      clickCleanupRef.current = controller.onClick((intersection) => {
        onClickRef.current?.(intersection);
        // Also call legacy handler if provided
        onClickLegacyRef.current?.(intersection.position, intersection.normal);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Main connection effect
  const connectToSDK = useCallback(async () => {
    if (!tourUrl || !iframeRef.current) {
      setStatus('idle');
      return;
    }

    cancelRef.current = false;
    attemptRef.current = 0;

    let unsubscribePose: (() => void) | null = null;
    let unsubscribeSweep: (() => void) | null = null;

    while (!cancelRef.current && attemptRef.current < maxAttempts) {
      try {
        attemptRef.current += 1;
        setStatus(attemptRef.current === 1 ? 'connecting' : 'retrying');
        setLastError(null);

        console.log(
          `[useMatterportSDK] Connecting${attemptRef.current > 1 ? ` (attempt ${attemptRef.current})` : ''}...`
        );

        await controller.connect(iframeRef.current);
        if (cancelRef.current) return;

        console.log('[useMatterportSDK] Connected successfully');
        setStatus('ready');

        // Subscribe to camera pose
        try {
          unsubscribePose = controller.subscribeToPose((pose) => {
            if (!cancelRef.current) {
              setCurrentPose(pose);
              setCurrentSweep(pose.sweep || null);
            }
          });
        } catch (err) {
          console.debug('[useMatterportSDK] Pose subscription unavailable');
        }

        // Get sweep count
        try {
          const sweeps = await controller.getSweepData();
          if (!cancelRef.current) {
            setTotalSweeps(sweeps.length);
          }
        } catch (err) {
          console.debug('[useMatterportSDK] Sweep data unavailable');
        }

        // Set up click handler if provided
        if (onClickRef.current || onClickLegacyRef.current) {
          clickCleanupRef.current = controller.onClick((intersection) => {
            onClickRef.current?.(intersection);
            onClickLegacyRef.current?.(intersection.position, intersection.normal);
          });
        }

        return; // Success, exit loop

      } catch (err: any) {
        console.error('[useMatterportSDK] Connection failed:', err);
        setLastError(err?.message || 'Failed to connect');

        if (attemptRef.current >= maxAttempts) {
          setStatus('failed');
          return;
        }

        // Exponential backoff
        const delay = baseRetryDelayMs * Math.pow(2, attemptRef.current - 1);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }, [tourUrl, controller, maxAttempts, baseRetryDelayMs]);

  // Auto-connect on mount/URL change
  useEffect(() => {
    if (!tourUrl) {
      setStatus('idle');
      setCurrentPose(null);
      setCurrentSweep(null);
      setTotalSweeps(0);
      setLastError(null);
      return;
    }

    if (autoConnect) {
      // Wait for iframe to be ready
      const timer = setTimeout(() => {
        connectToSDK();
      }, 500);

      return () => {
        clearTimeout(timer);
        cancelRef.current = true;
        if (clickCleanupRef.current) {
          clickCleanupRef.current();
          clickCleanupRef.current = null;
        }
        controller.disconnect();
      };
    }
  }, [tourUrl, autoConnect, connectToSDK, controller]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRef.current = true;
      if (clickCleanupRef.current) {
        clickCleanupRef.current();
      }
      controller.disconnect();
    };
  }, [controller]);

  // Move camera helper
  const moveTo = useCallback(async (
    position: Vector3,
    rotation?: { x: number; y: number },
    sweepId?: string
  ) => {
    if (status !== 'ready') {
      console.warn('[useMatterportSDK] Cannot moveTo - not ready');
      return;
    }

    try {
      await controller.moveTo(position, rotation, sweepId);
    } catch (err) {
      console.error('[useMatterportSDK] moveTo failed:', err);
    }
  }, [status, controller]);
  
  // Move to specific sweep
  const moveToSweep = useCallback(async (
    sweepId: string,
    rotation?: { x: number; y: number }
  ) => {
    if (status !== 'ready') {
      console.warn('[useMatterportSDK] Cannot moveToSweep - not ready');
      return;
    }

    try {
      await controller.moveToSweep(sweepId, rotation);
    } catch (err) {
      console.error('[useMatterportSDK] moveToSweep failed:', err);
    }
  }, [status, controller]);
  
  // Find nearest sweep to a position
  const findNearestSweepHelper = useCallback(async (position: Vector3) => {
    if (status !== 'ready') {
      return null;
    }

    try {
      const sweep = await controller.findNearestSweep(position);
      if (sweep) {
        return { sweepId: sweep.sid, position: sweep.position };
      }
      return null;
    } catch (err) {
      console.error('[useMatterportSDK] findNearestSweep failed:', err);
      return null;
    }
  }, [status, controller]);

  return {
    iframeRef,
    controller,
    status,
    currentPose,
    currentSweep,
    totalSweeps,
    lastError,
    moveTo,
    moveToSweep,
    connect: connectToSDK,
    findNearestSweep: findNearestSweepHelper,
  };
}
