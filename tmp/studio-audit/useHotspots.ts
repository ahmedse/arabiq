// useHotspots.ts

import { useState, useEffect, useRef, useCallback } from "react";
import { useAdminApi } from "@/lib/hooks/useAdminApi";
import type { Hotspot, MatterportHotspot, MarzipanoHotspot, BaseHotspot } from "./types";
import { isMatterportHotspot, isMarzipanoHotspot } from "./types";

// Tour type to determine which hotspot type to create
type TourType = 'matterport' | 'marzipano' | 'custom_360' | 'virtual';

interface UseHotspotsResult {
  hotspots: Hotspot[];
  create: (h: Partial<Hotspot>, tourType?: TourType) => Promise<Hotspot | null>;
  update: (id: string, h: Partial<Hotspot>) => Promise<Hotspot | null>;
  remove: (id: string) => Promise<void>;
  apiLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * useHotspots
 * - Fetches and manages hotspots for a given tour.
 * - Supports polymorphic hotspot types (Matterport, Marzipano).
 * - All network calls are abort-safe (per-call AbortController).
 */
export function useHotspots(tourId: string | null): UseHotspotsResult {
  const api = useAdminApi<Hotspot>({ endpoint: "hotspots" });
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [error, setError] = useState<string | null>(null);

  const listAbortRef = useRef<AbortController | null>(null);

  const toNumber = useCallback((value: unknown, fallback = 0): number => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  }, []);

  /**
   * Normalize raw API response to typed Hotspot (Matterport or Marzipano)
   */
  const normalizeHotspot = useCallback(
    (raw: any): Hotspot => {
      // Base fields common to all hotspot types
      const base: BaseHotspot = {
        id: String(raw?.id ?? ""),
        title: typeof raw?.title === "string" ? raw.title : "",
        description: typeof raw?.description === "string" ? raw.description : "",
        hotspot_type: typeof raw?.hotspot_type === "string" ? raw.hotspot_type : "info",
        content_type: typeof raw?.content_type === "string" ? raw.content_type : "text",
        content_data: raw?.content_data ?? {},
        action_type: typeof raw?.action_type === "string" ? raw.action_type : undefined,
        action_data: raw?.action_data ?? {},
        is_active: raw?.is_active !== undefined ? Boolean(raw.is_active) : true,
        tour: typeof raw?.tour === "string" ? raw.tour : String(raw?.tour ?? ""),
        resourcetype: raw?.resourcetype,
        // Backend-uploaded audio file URL
        audio_file_url: typeof raw?.audio_file_url === "string" ? raw.audio_file_url : undefined,
      };

      // Determine type based on resourcetype or presence of specific fields
      if (raw?.resourcetype === 'MarzipanoHotspot' || (raw?.yaw !== undefined && raw?.pitch !== undefined)) {
        return {
          ...base,
          resourcetype: 'MarzipanoHotspot',
          yaw: toNumber(raw?.yaw),
          pitch: toNumber(raw?.pitch),
          fov: raw?.fov !== undefined ? toNumber(raw.fov) : undefined,
          scene_id: typeof raw?.scene_id === "string" ? raw.scene_id : undefined,
        } as MarzipanoHotspot;
      }
      
      // Default to Matterport
      return {
        ...base,
        resourcetype: 'MatterportHotspot',
        position_x: toNumber(raw?.position_x),
        position_y: toNumber(raw?.position_y),
        position_z: toNumber(raw?.position_z),
        normal_x: toNumber(raw?.normal_x),
        normal_y: toNumber(raw?.normal_y),
        normal_z: toNumber(raw?.normal_z, 1),
        rotation_x: raw?.rotation_x !== undefined && raw?.rotation_x !== null ? toNumber(raw.rotation_x) : undefined,
        rotation_y: raw?.rotation_y !== undefined && raw?.rotation_y !== null ? toNumber(raw.rotation_y) : undefined,
        sweep_id: typeof raw?.sweep_id === "string" && raw.sweep_id ? raw.sweep_id : undefined,
      } as MatterportHotspot;
    },
    [toNumber]
  );

  useEffect(() => {
    if (!tourId) {
      setHotspots([]);
      setError(null);
      return;
    }

    refresh();

    return () => {
      if (listAbortRef.current) {
        listAbortRef.current.abort();
        listAbortRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId]);

  async function refresh() {
    if (!tourId) return;
    if (listAbortRef.current) {
      listAbortRef.current.abort();
    }
    const controller = new AbortController();
    listAbortRef.current = controller;

    try {
      setError(null);
      const response = await api.fetchList({ tour: tourId });
      if (controller.signal.aborted) return;

      const payload = Array.isArray(response?.results)
        ? response.results
        : Array.isArray(response)
          ? response
          : [];
      setHotspots(payload.map(normalizeHotspot));
    } catch (e: any) {
      if (controller.signal.aborted) return;
      console.error("[useHotspots] Failed to fetch hotspots:", e);
      setError(e?.message || "Failed to fetch hotspots");
    } finally {
      if (listAbortRef.current === controller) {
        listAbortRef.current = null;
      }
    }
  }

  /**
   * Check if action_data contains any file references that need FormData upload.
   * Returns { hasFile: boolean, file: File | null, cleanedActionData: object }
   */
  const extractFileFromActionData = useCallback((actionData: Record<string, unknown>) => {
    const cleanedData = { ...actionData };
    let audioFile: File | null = null;

    // Check for audio file (from play_audio action)
    if (cleanedData.audioUrl_file instanceof File) {
      audioFile = cleanedData.audioUrl_file;
      delete cleanedData.audioUrl_file;
      // Clear the blob URL since we'll use the uploaded file URL
      if (typeof cleanedData.audioUrl === 'string' && cleanedData.audioUrl.startsWith('blob:')) {
        delete cleanedData.audioUrl;
      }
    }

    // Check for image file (from show_info/show_product actions)
    if (cleanedData.imageUrl_file instanceof File) {
      // TODO: Handle image uploads when needed
      delete cleanedData.imageUrl_file;
    }

    return { hasFile: !!audioFile, file: audioFile, cleanedActionData: cleanedData };
  }, []);

  /**
   * Build FormData for multipart upload (when files are present).
   */
  const buildFormData = useCallback((payload: Record<string, unknown>, audioFile: File | null): FormData => {
    const formData = new FormData();
    
    Object.entries(payload).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      
      if (typeof value === 'object' && !(value instanceof File)) {
        // JSON-encode nested objects (content_data, action_data)
        formData.append(key, JSON.stringify(value));
      } else if (typeof value === 'boolean') {
        formData.append(key, value ? 'true' : 'false');
      } else if (typeof value === 'number') {
        formData.append(key, String(value));
      } else {
        formData.append(key, value as string);
      }
    });

    // Add the audio file if present
    if (audioFile) {
      formData.append('audio_file', audioFile, audioFile.name);
    }

    return formData;
  }, []);

  async function create(h: Partial<Hotspot>, tourType?: TourType): Promise<Hotspot | null> {
    if (!tourId) throw new Error("Tour ID is required to create hotspot");

    try {
      console.log("[useHotspots] Creating hotspot with data:", { ...h, tour: tourId, tourType });
      
      // Extract any file references from action_data
      const { hasFile, file: audioFile, cleanedActionData } = extractFileFromActionData(
        (h.action_data || {}) as Record<string, unknown>
      );

      // Base payload for all hotspot types
      const payload: Record<string, unknown> = {
        tour: tourId,
        title: h.title,
        description: h.description || "",
        hotspot_type: h.hotspot_type,
        content_type: h.content_type,
        content_data: h.content_data || {},
        action_data: cleanedActionData,
        is_active: h.is_active ?? true,
      };
      
      // Only include action_type if it has a non-empty value
      if (h.action_type && h.action_type.trim() !== "") {
        payload.action_type = h.action_type;
      }

      // Add type-specific fields based on tour type or hotspot data
      const isMarzipano = tourType === 'marzipano' || 
        (isMarzipanoHotspot(h as Hotspot)) ||
        ('yaw' in h && 'pitch' in h);

      if (isMarzipano) {
        // Marzipano hotspot - spherical coordinates
        const marzipanoData = h as Partial<MarzipanoHotspot>;
        payload.yaw = marzipanoData.yaw !== undefined ? toNumber(marzipanoData.yaw) : 0;
        payload.pitch = marzipanoData.pitch !== undefined ? toNumber(marzipanoData.pitch) : 0;
        if (marzipanoData.fov !== undefined) {
          payload.fov = toNumber(marzipanoData.fov);
        }
        if (marzipanoData.scene_id && marzipanoData.scene_id.trim() !== "") {
          payload.scene_id = marzipanoData.scene_id;
        }
        // Backend auto-detects type, but we can hint
        payload.resourcetype = 'MarzipanoHotspot';
      } else {
        // Matterport hotspot - 3D coordinates
        const matterportData = h as Partial<MatterportHotspot>;
        payload.position_x = matterportData.position_x !== undefined ? toNumber(matterportData.position_x) : 0;
        payload.position_y = matterportData.position_y !== undefined ? toNumber(matterportData.position_y) : 0;
        payload.position_z = matterportData.position_z !== undefined ? toNumber(matterportData.position_z) : 0;
        payload.normal_x = matterportData.normal_x !== undefined ? toNumber(matterportData.normal_x) : 0;
        payload.normal_y = matterportData.normal_y !== undefined ? toNumber(matterportData.normal_y) : 0;
        payload.normal_z = matterportData.normal_z !== undefined ? toNumber(matterportData.normal_z, 1) : 1;
        
        // Include rotation if available - round to 2 decimal places (backend constraint)
        if (matterportData.rotation_x !== undefined && matterportData.rotation_x !== null) {
          payload.rotation_x = Number(toNumber(matterportData.rotation_x).toFixed(2));
        }
        if (matterportData.rotation_y !== undefined && matterportData.rotation_y !== null) {
          payload.rotation_y = Number(toNumber(matterportData.rotation_y).toFixed(2));
        }
        // Include sweep ID if available
        if (matterportData.sweep_id && matterportData.sweep_id.trim() !== "") {
          payload.sweep_id = matterportData.sweep_id;
        }
        // Backend auto-detects type, but we can hint
        payload.resourcetype = 'MatterportHotspot';
      }

      // Use FormData for multipart upload if file is present
      let requestPayload: Record<string, unknown> | FormData = payload;
      if (hasFile && audioFile) {
        console.log("[useHotspots] Using FormData upload for audio file:", audioFile.name);
        requestPayload = buildFormData(payload, audioFile);
      } else {
        console.log("[useHotspots] Sending JSON payload:", JSON.stringify(payload, null, 2));
      }

      const res = await api.create(requestPayload as any);
      console.log("[useHotspots] Hotspot created successfully:", res);
      const normalized = normalizeHotspot(res);
      setHotspots((prev) => [...prev, normalized]);
      return normalized;
    } catch (e: any) {
      console.error("[useHotspots] Failed to create hotspot:", e);
      console.error("[useHotspots] Error details:", JSON.stringify(e.details || e, null, 2));
      console.error("[useHotspots] Full error object:", e);
      setError(e?.message || "Failed to create hotspot");
      return null;
    }
  }

  async function update(id: string, h: Partial<Hotspot>): Promise<Hotspot | null> {
    try {
      // Extract any file references from action_data
      let actionData = h.action_data;
      let audioFile: File | null = null;
      
      if (h.action_data !== undefined) {
        const { hasFile, file, cleanedActionData } = extractFileFromActionData(
          h.action_data as Record<string, unknown>
        );
        audioFile = hasFile ? file : null;
        actionData = cleanedActionData;
      }

      const payload: Record<string, any> = {};
      
      // Common fields
      if (h.title !== undefined) payload.title = h.title;
      if (h.description !== undefined) payload.description = h.description;
      if (h.hotspot_type !== undefined) payload.hotspot_type = h.hotspot_type;
      if (h.content_type !== undefined) payload.content_type = h.content_type;
      if (h.content_data !== undefined) payload.content_data = h.content_data;
      if (h.action_type !== undefined && h.action_type.trim() !== "") {
        payload.action_type = h.action_type;
      }
      if (actionData !== undefined) payload.action_data = actionData;
      if (h.is_active !== undefined) payload.is_active = h.is_active;

      // Type-specific fields based on what's in the update data
      const isMarzipano = isMarzipanoHotspot(h as Hotspot) || ('yaw' in h || 'pitch' in h);
      
      if (isMarzipano) {
        // Marzipano fields
        const marzipanoData = h as Partial<MarzipanoHotspot>;
        if (marzipanoData.yaw !== undefined) payload.yaw = toNumber(marzipanoData.yaw);
        if (marzipanoData.pitch !== undefined) payload.pitch = toNumber(marzipanoData.pitch);
        if (marzipanoData.fov !== undefined) payload.fov = toNumber(marzipanoData.fov);
        if (marzipanoData.scene_id !== undefined && marzipanoData.scene_id.trim() !== "") {
          payload.scene_id = marzipanoData.scene_id;
        }
      } else {
        // Matterport fields
        const matterportData = h as Partial<MatterportHotspot>;
        if (matterportData.position_x !== undefined) payload.position_x = toNumber(matterportData.position_x);
        if (matterportData.position_y !== undefined) payload.position_y = toNumber(matterportData.position_y);
        if (matterportData.position_z !== undefined) payload.position_z = toNumber(matterportData.position_z);
        if (matterportData.normal_x !== undefined) payload.normal_x = toNumber(matterportData.normal_x);
        if (matterportData.normal_y !== undefined) payload.normal_y = toNumber(matterportData.normal_y);
        if (matterportData.normal_z !== undefined) payload.normal_z = toNumber(matterportData.normal_z, 1);
        // Round rotation to 2 decimal places (backend constraint)
        if (matterportData.rotation_x !== undefined && matterportData.rotation_x !== null) {
          payload.rotation_x = Number(toNumber(matterportData.rotation_x).toFixed(2));
        }
        if (matterportData.rotation_y !== undefined && matterportData.rotation_y !== null) {
          payload.rotation_y = Number(toNumber(matterportData.rotation_y).toFixed(2));
        }
        if (matterportData.sweep_id !== undefined && matterportData.sweep_id.trim() !== "") {
          payload.sweep_id = matterportData.sweep_id;
        }
      }

      // Use FormData for multipart upload if file is present
      let requestPayload: Record<string, unknown> | FormData = payload;
      if (audioFile) {
        console.log("[useHotspots] Using FormData upload for audio file update:", audioFile.name);
        requestPayload = buildFormData(payload, audioFile);
      }

      const res = await api.update(id, requestPayload as any);
      const normalized = normalizeHotspot(res);
      setHotspots((prev) =>
        prev.map((hotspot) => (hotspot.id === id ? normalized : hotspot))
      );
      return normalized;
    } catch (e: any) {
      console.error("[useHotspots] Failed to update hotspot:", e);
      setError(e?.message || "Failed to update hotspot");
      return null;
    }
  }

  async function remove(id: string): Promise<void> {
    try {
      await api.remove(id);
      setHotspots((prev) => prev.filter((h) => h.id !== id));
    } catch (e: any) {
      console.error("[useHotspots] Failed to delete hotspot:", e);
      setError(e?.message || "Failed to delete hotspot");
      throw e;
    }
  }

  return {
    hotspots,
    create,
    update,
    remove,
    apiLoading: api.loading,
    error,
    refresh,
  };
}