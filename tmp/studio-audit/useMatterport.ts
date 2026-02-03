// hooks/useMatterport.ts

"use client";

import { useEffect, useRef, useState } from "react";
import { createMatterportController } from "./sdkClient";

type MatterportStatus =
  | "idle"
  | "connecting"
  | "retrying"
  | "ready"
  | "failed";

interface UseMatterportOptions {
  tourUrl: string | null;
  onClick?: (coords: { x: number; y: number; z: number }) => void;
  maxAttempts?: number;
  baseRetryDelayMs?: number; // for exponential backoff
}

/**
 * useMatterport
 * Initializes and manages a single Matterport viewer instance.
 * - Auto-retry connection with exponential backoff.
 * - Tracks camera pose, current sweep, total sweeps.
 * - Handles cleanup on unmount.
 */
export function useMatterport({
  tourUrl,
  onClick,
  maxAttempts = 3,
  baseRetryDelayMs = 1000,
}: UseMatterportOptions) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [controller] = useState(() => createMatterportController());
  const [status, setStatus] = useState<MatterportStatus>("idle");
  const [currentPose, setCurrentPose] = useState<any>(null);
  const [currentSweep, setCurrentSweep] = useState<any>(null);
  const [totalSweeps, setTotalSweeps] = useState<number>(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const attemptRef = useRef(0);
  const cancelRef = useRef(false);
  const onClickRef = useRef(onClick);
  const clickSubscriptionCleanupRef = useRef<(() => void) | void>(undefined);

  // Update the onClick ref when it changes
  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  // Update click handler when onClick changes (without reconnecting)
  useEffect(() => {
    if (status === "ready" && controller && onClickRef.current) {
      try {
        // Remove existing click handler
        if (typeof clickSubscriptionCleanupRef.current === "function") {
          clickSubscriptionCleanupRef.current();
        }
        // Set up new click handler
        clickSubscriptionCleanupRef.current = controller.onClick(onClickRef.current);
      } catch (err) {
        console.debug("[useMatterport] Click handler update failed:", err instanceof Error ? err.message : String(err));
      }
    }
  }, [onClick, status, controller]);

  useEffect(() => {
    if (!tourUrl || !iframeRef.current) {
      setStatus("idle");
      setCurrentPose(null);
      setCurrentSweep(null);
      setTotalSweeps(0);
      setLastError(null);
      return;
    }

    cancelRef.current = false;
    attemptRef.current = 0;

    let unsubscribePose: (() => void) | null = null;
    let unsubscribeSweep: (() => void) | null = null;

    async function connectWithRetry() {
      while (!cancelRef.current && attemptRef.current < maxAttempts) {
        try {
          attemptRef.current += 1;
          setStatus(attemptRef.current === 1 ? "connecting" : "retrying");
          setLastError(null);

          console.log(
            `[useMatterport] Connecting to ${tourUrl}${attemptRef.current > 1 ? ` (attempt ${attemptRef.current})` : ''}`
          );

          await controller.connect(iframeRef.current!);
          if (cancelRef.current) return;

          console.log("[useMatterport] Connected successfully");
          setStatus("ready");

          // Subscriptions with graceful degradation
          try {
            unsubscribePose = controller.subscribeToPose((pose) => {
              if (!cancelRef.current) {
                setCurrentPose(pose);
              }
            });
          } catch (err) {
            console.debug("[useMatterport] Pose subscription unavailable:", err instanceof Error ? err.message : String(err));
          }

          try {
            unsubscribeSweep = controller.subscribeToSweep((sweep) => {
              if (!cancelRef.current) {
                setCurrentSweep(sweep);
              }
            });
          } catch (err) {
            console.debug("[useMatterport] Sweep subscription unavailable:", err instanceof Error ? err.message : String(err));
          }

          // Initial sweep data - treat as optional/non-critical
          try {
            const sweepData = await controller.getSweepData();
            if (!cancelRef.current) {
              setTotalSweeps(sweepData.length);
              // Only log if we actually found sweeps, otherwise keep quiet
              if (sweepData.length > 0) {
                console.log(`[useMatterport] Found ${sweepData.length} sweep points`);
              }
            }
          } catch (err) {
            // Sweep data is optional - don't treat as error
            console.debug("[useMatterport] Sweep data not available:", err instanceof Error ? err.message : String(err));
            if (!cancelRef.current) {
              setTotalSweeps(0);
            }
          }

          // Click handler with graceful degradation
          if (onClickRef.current) {
            try {
              clickSubscriptionCleanupRef.current = controller.onClick(onClickRef.current);
            } catch (err) {
              console.debug("[useMatterport] Click handler unavailable:", err instanceof Error ? err.message : String(err));
            }
          }

          // Connected successfully; break out of retry loop
          return;
        } catch (err: any) {
          console.error(
            "[useMatterport] Matterport SDK connection failed:",
            err
          );
          setLastError(err?.message || "Failed to connect to Matterport SDK");

          if (attemptRef.current >= maxAttempts) {
            setStatus("failed");
            return;
          }

          // Exponential backoff
          const delay =
            baseRetryDelayMs * Math.pow(2, attemptRef.current - 1);
          await new Promise((res) => setTimeout(res, delay));
        }
      }
    }

    connectWithRetry();

    return () => {
      cancelRef.current = true;
      if (unsubscribePose) unsubscribePose();
      if (unsubscribeSweep) unsubscribeSweep();
      if (typeof clickSubscriptionCleanupRef.current === "function") {
        try {
          clickSubscriptionCleanupRef.current();
        } catch {
          // ignore
        }
      }
    };
  }, [tourUrl, controller, maxAttempts, baseRetryDelayMs]);

  // Move camera to a position with optional rotation and sweep ID
  const moveTo = async (
    pos: { x: number; y: number; z: number },
    rotation?: { x: number; y: number },
    sweepId?: string
  ) => {
    if (status !== "ready" || !controller) {
      console.warn("[useMatterport] Cannot moveTo - not ready");
      return;
    }
    try {
      const before = await controller.getCameraPose().catch(() => null);
      if (before) console.log("[useMatterport] Before move pose:", before);

      // Single call with rotation and sweep passed to SDK
      await controller.moveTo(pos, rotation, sweepId);

      const after = await controller.getCameraPose().catch(() => null);
      if (after) console.log("[useMatterport] After move pose:", after);
    } catch (err) {
      console.error("[useMatterport] moveTo failed:", err);
    }
  };

  return {
    iframeRef,
    controller,
    status,
    currentPose,
    currentSweep,
    totalSweeps,
    lastError,
    moveTo,
  };
}