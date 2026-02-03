"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTours } from "./useTours";
import { useHotspots } from "./useHotspots";
import { useTourSDK } from "@/app/mall/[shopId]/tour/useTourSDK";
import { useMarzipanoBridge } from "./useMarzipanoBridge";
import { getTourEmbedUrl } from "@/lib/tour-sdk";
import { OverlaySVG } from "./OverlaySVG";
import { ActionDetailsModal } from "./ActionDetailsModal";
// Note: WaypointHUD and GreeterTooltip are visitor components in /mall/[shopId]/tour/
import type { Hotspot, ActionType, MatterportHotspot, MarzipanoHotspot } from "./types";
import { ACTION_TYPE_CONFIG, validateActionData, getDefaultActionData, cleanActionData, isMatterportHotspot, isMarzipanoHotspot } from "./types";

type ConsoleLevel = "info" | "warn" | "error";

interface ConsoleEntry {
  id: number;
  level: ConsoleLevel;
  message: string;
  timestamp: number;
}

interface HotspotFormData {
  title: string;
  description: string;
  hotspot_type: string;
  content_type: string;
  content_data: Record<string, unknown>;
  action_type: ActionType;
  action_data: Record<string, unknown>;
  position_x: number;
  position_y: number;
  position_z: number;
  normal_x: number;
  normal_y: number;
  normal_z: number;
  rotation_x?: number;
  rotation_y?: number;
  sweep_id?: string;
  is_active: boolean;
}

// Form validation errors
interface FormErrors {
  title?: string;
  action_data?: string[];
  general?: string;
}

const HOTSPOT_TYPES = [
  { value: "info", label: "Information" },
  { value: "product", label: "Product" },
  { value: "action", label: "Action" },
  { value: "navigation", label: "Navigation" },
];

const CONTENT_TYPES = [
  { value: "text", label: "Text" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "link", label: "Link" },
];

const MATTERTAG_COLORS: Record<string, { r: number; g: number; b: number }> = {
  info: { r: 0.2, g: 0.5, b: 1.0 },
  product: { r: 0.6, g: 0.4, b: 1.0 },
  action: { r: 0.2, g: 0.8, b: 0.5 },
  navigation: { r: 0.95, g: 0.65, b: 0.2 },
};

const MAX_CONSOLE_LINES = 80;

const getMattertagColor = (type: string) => MATTERTAG_COLORS[type] ?? MATTERTAG_COLORS.info;

const getDefaultFormData = (): HotspotFormData => ({
  title: "",
  description: "",
  hotspot_type: "info",
  content_type: "text",
  content_data: {},
  action_type: "" as ActionType,
  action_data: {},
  position_x: 0,
  position_y: 0,
  position_z: 0,
  normal_x: 0,
  normal_y: 0,
  normal_z: 1,
  rotation_x: undefined,
  rotation_y: undefined,
  sweep_id: undefined,
  is_active: true,
});

// Validate form before save
function validateHotspotForm(data: HotspotFormData): FormErrors {
  const errors: FormErrors = {};
  
  if (!data.title.trim()) {
    errors.title = "Title is required";
  }
  
  if (data.action_type) {
    const actionErrors = validateActionData(data.action_type, data.action_data);
    if (actionErrors.length > 0) {
      errors.action_data = actionErrors;
    }
  }
  
  return errors;
}

export function TourStudio() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [selectedTourUrl, setSelectedTourUrl] = useState<string | null>(null);
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [showRotationDebug, setShowRotationDebug] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state for creating/editing hotspots
  const [formMode, setFormMode] = useState<"idle" | "create" | "edit">("idle");
  const [formData, setFormData] = useState<HotspotFormData>(getDefaultFormData());
  const [formSaving, setFormSaving] = useState(false);
  
  // Modal state for action details
  const [actionModalOpen, setActionModalOpen] = useState(false);

  const logMessage = useCallback((message: string, level: ConsoleLevel = "info") => {
    setConsoleEntries((prev) => {
      const next = [...prev, { id: Date.now() + Math.random(), level, message, timestamp: Date.now() }];
      if (next.length > MAX_CONSOLE_LINES) {
        next.shift();
      }
      return next;
    });

    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    fn(`[Studio] ${message}`);
  }, []);

  const {
    data: tours,
    loading: toursLoading,
    error: toursError,
    fetchList: fetchTours,
  } = useTours();

  const {
    hotspots,
    create,
    update,
    remove,
    refresh,
    apiLoading: hotspotsLoading,
    error: hotspotsError,
  } = useHotspots(selectedTourId);

  const selectedTour = useMemo(
    () => tours?.find((tour) => tour.id === selectedTourId) ?? null,
    [tours, selectedTourId]
  );

  // Fetch tours on mount
  useEffect(() => {
    if (!authLoading && isAuthenticated && !tours && !toursLoading && !toursError) {
      fetchTours();
    }
  }, [authLoading, isAuthenticated, tours, toursLoading, toursError, fetchTours]);

  // Clear active hotspot if it no longer exists
  useEffect(() => {
    if (activeHotspotId && !hotspots.some((h) => h.id === activeHotspotId)) {
      setActiveHotspotId(null);
    }
  }, [hotspots, activeHotspotId]);

  // Handle tour selection - build tour config for unified SDK
  const [tourConfig, setTourConfig] = useState<any>(null);
  
  useEffect(() => {
    if (!selectedTourId || !tours) {
      setSelectedTourUrl(null);
      setTourConfig(null);
      setActiveHotspotId(null);
      setFormMode("idle");
      return;
    }

    const tour = tours.find((t) => t.id === selectedTourId);
    if (!tour) return;

    // Determine if we should use unified SDK or just iframe
    // Marzipano uploads are self-contained HTML apps, load in iframe like Matterport
    const isMarzipanoUpload = tour.tour_type === 'marzipano' && tour.tour_url?.includes('/media/tours/');
    const shouldUseIframe = tour.tour_type === 'matterport' || isMarzipanoUpload;
    
    if (!shouldUseIframe) {
      // Use unified SDK for programmatic tours
      const config = {
        tour_type: tour.tour_type || 'matterport',
        tour_url: tour.tour_url || '',
        external_id: tour.external_id,
        model_id: tour.external_id,
        tour_data_url: tour.tour_url,
      };
      setTourConfig(config);
    } else {
      // Use iframe for Matterport and Marzipano uploads
      setTourConfig(null); // Don't use unified SDK
    }

    if (tour.tour_type === "matterport" && tour.external_id) {
      setSelectedTourUrl(`https://my.matterport.com/show/?m=${tour.external_id}`);
      logMessage(`Loaded Matterport tour ${tour.title}`);
    } else if (tour.tour_url) {
      setSelectedTourUrl(tour.tour_url);
      logMessage(`Loaded ${tour.tour_type} tour ${tour.title}`);
    } else {
      setSelectedTourUrl(null);
      logMessage(`Tour ${tour.title} has no playable URL`, "warn");
    }

    setActiveHotspotId(null);
    setFormMode("idle");
  }, [selectedTourId, tours, logMessage]);

  // Use unified SDK for Matterport tours
  const {
    controller,
    error: sdkError,
    isConnected,
    containerCallbackRef,
  } = useTourSDK({
    tourConfig,
    onPoseChange: (pose) => {
      // Update current pose for hotspot capture
      if (pose.position && pose.rotation) {
        // Store pose for Studio
      }
    },
  });
  
  // Create iframe ref for Marzipano bridge
  const marzipanoIframeRef = useRef<HTMLIFrameElement>(null);
  
  // Use Marzipano bridge for Marzipano tours
  const isMarzipanoTour = selectedTour?.tour_type === 'marzipano' && selectedTour.tour_url?.includes('/media/tours/');
  const marzipanoBridge = useMarzipanoBridge({
    iframeRef: marzipanoIframeRef,
    onReady: () => {
      logMessage('Marzipano bridge connected');
      // Sync existing Marzipano hotspots to viewer
      const marzipanoHotspots = hotspots.filter(isMarzipanoHotspot);
      marzipanoHotspots.forEach(hotspot => {
        marzipanoBridge.addHotspot({
          id: hotspot.id,
          position: { 
            yaw: hotspot.yaw,
            pitch: hotspot.pitch
          },
          data: hotspot
        });
      });
    },
    onHotspotClick: (hotspotId) => {
      setActiveHotspotId(hotspotId);
      const hotspot = hotspots.find(h => h.id === hotspotId);
      if (hotspot) {
        startEdit(hotspotId);
      }
    }
  });
  
  // Marzipano scenes state
  const [marzipanoScenes, setMarzipanoScenes] = useState<{ id: string; name: string }[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  
  // Fetch Marzipano scenes when bridge is ready
  useEffect(() => {
    if (isMarzipanoTour && marzipanoBridge.isReady) {
      marzipanoBridge.getScenes().then(scenes => {
        setMarzipanoScenes(scenes);
        logMessage(`Loaded ${scenes.length} Marzipano scenes`);
        // Select first scene if none selected
        if (scenes.length > 0 && !selectedSceneId) {
          setSelectedSceneId(scenes[0].id);
        }
      });
    }
  }, [isMarzipanoTour, marzipanoBridge.isReady]);
  
  // Handle scene selection
  const handleSceneSelect = useCallback((sceneId: string) => {
    setSelectedSceneId(sceneId);
    marzipanoBridge.switchScene(sceneId);
    logMessage(`Switched to scene: ${sceneId}`);
  }, [marzipanoBridge, logMessage]);
  
  // Update selected scene when pose changes (scene changed via viewer interaction)
  useEffect(() => {
    if (marzipanoBridge.currentPose?.sceneId && marzipanoBridge.currentPose.sceneId !== selectedSceneId) {
      setSelectedSceneId(marzipanoBridge.currentPose.sceneId);
    }
  }, [marzipanoBridge.currentPose?.sceneId]);
  
  // Unified connection status
  const actualIsConnected = isMarzipanoTour ? marzipanoBridge.isReady : isConnected;
  
  // Sync hotspot highlighting to Marzipano viewer
  useEffect(() => {
    if (isMarzipanoTour && marzipanoBridge.isReady) {
      marzipanoBridge.highlightHotspot(activeHotspotId);
    }
  }, [activeHotspotId, isMarzipanoTour, marzipanoBridge]);
  
  // Legacy refs for compatibility - use marzipanoIframeRef directly for Marzipano
  // NOTE: Don't reassign refs like this for binding - the actual ref must be passed to JSX
  const sdkStatus = actualIsConnected ? 'connected' : sdkError ? 'error' : 'loading';
  const currentPose = controller ? { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0 } } : null;
  const currentSweep = null;
  const totalSweeps = 0;
  const sdkLastError = sdkError;
  
  // Navigation wrapper
  const moveTo = useCallback(async (position: any, rotation?: any) => {
    if (!controller) return;
    try {
      await controller.moveTo(position, rotation);
    } catch (err) {
      logMessage(`Navigation failed: ${err}`, 'error');
    }
  }, [controller, logMessage]);

  // Calculate face direction (normal) from camera rotation - defined before useEffect
  const calculateNormal = useCallback((rotation: { x?: number; y?: number } | undefined) => {
    if (!rotation) return { x: 0, y: 0, z: 1 };
    
    // Convert rotation degrees to radians
    const yaw = ((rotation.y || 0) * Math.PI) / 180;
    const pitch = ((rotation.x || 0) * Math.PI) / 180;
    
    // Calculate forward direction vector from yaw and pitch
    const nx = -Math.sin(yaw) * Math.cos(pitch);
    const ny = Math.sin(pitch);
    const nz = -Math.cos(yaw) * Math.cos(pitch);
    
    return {
      x: Number(nx.toFixed(4)),
      y: Number(ny.toFixed(4)),
      z: Number(nz.toFixed(4)),
    };
  }, []);

  // Convert normal vector back to rotation (pitch/yaw in degrees) for navigation
  // This is a FALLBACK only used when stored rotation is not available
  const calculateRotationFromNormal = useCallback((normal: { x: number; y: number; z: number }) => {
    // The normal was calculated as:
    //   nx = -sin(yaw) * cos(pitch)
    //   ny = sin(pitch)
    //   nz = -cos(yaw) * cos(pitch)
    // To reverse:
    //   pitch = asin(ny)
    //   yaw = atan2(-nx, -nz)
    const clampedY = Math.max(-1, Math.min(1, normal.y));
    const pitch = Math.asin(clampedY);
    const yaw = Math.atan2(-normal.x, -normal.z);
    
    return {
      x: Number(((pitch * 180) / Math.PI).toFixed(1)),
      y: Number(((yaw * 180) / Math.PI).toFixed(1)),
    };
  }, []);

  // Aggressive math self-test: rotation -> normal -> rotation roundtrip
  useEffect(() => {
    const deg = (r: number) => Number(((r * 180) / Math.PI).toFixed(4));
    const rad = (d: number) => (d * Math.PI) / 180;
    const cases = [
      { x: 0, y: 0 },
      { x: -10, y: -10 },
      { x: 10, y: 25 },
      { x: -30, y: 90 },
      { x: 45, y: -135 },
      { x: 0, y: 180 },
    ];
    console.log("[MathTest] Starting rotation<->normal roundtrip tests");
    for (const rot of cases) {
      const yaw = rad(rot.y);
      const pitch = rad(rot.x);
      const nx = -Math.sin(yaw) * Math.cos(pitch);
      const ny = Math.sin(pitch);
      const nz = -Math.cos(yaw) * Math.cos(pitch);
      const normal = { x: nx, y: ny, z: nz };
      const back = calculateRotationFromNormal(normal);
      const errX = Number((back.x - rot.x).toFixed(4));
      const errY = Number((back.y - rot.y).toFixed(4));
      console.log(
        "[MathTest] rot:", rot,
        " normal:", { x: nx.toFixed(4), y: ny.toFixed(4), z: nz.toFixed(4) },
        " back:", back,
        " err(x,y):",
        { x: errX, y: errY }
      );
    }
    console.log("[MathTest] Completed rotation<->normal roundtrip tests");
  }, [calculateRotationFromNormal]);

  // Update form position and normal from camera when in create mode
  useEffect(() => {
    const captureCurrentPose = async () => {
      if (formMode !== "create" || !controller) return;
      
      try {
        const pose = await controller.getCameraPose();
        if (!pose?.position) return;
        
        const normal = calculateNormal(pose.rotation);
        const capturedSweepId = undefined; // currentSweep not available with unified SDK
        
        if (showRotationDebug) {
          console.log("[CapturePosition] Pose data:", {
            pose,
            extractedSweepId: capturedSweepId,
            rotation: pose.rotation,
          });
        }
        
        setFormData((prev) => ({
          ...prev,
          position_x: Number(pose.position.x?.toFixed(4)) || 0,
          position_y: Number(pose.position.y?.toFixed(4)) || 0,
          position_z: Number(pose.position.z?.toFixed(4)) || 0,
          normal_x: normal.x,
          normal_y: normal.y,
          normal_z: normal.z,
          // Store exact SDK rotation for precise navigation
          rotation_x: pose.rotation?.x !== undefined ? Number(pose.rotation.x.toFixed(2)) : undefined,
          rotation_y: pose.rotation?.y !== undefined ? Number(pose.rotation.y.toFixed(2)) : undefined,
          // Store sweep ID if available
          sweep_id: capturedSweepId,
        }));
      } catch (err) {
        console.error("[CapturePosition] Failed to get pose:", err);
      }
    };
    
    captureCurrentPose();
  }, [formMode, controller, currentSweep, calculateNormal, showRotationDebug]);

  // Rotation debug: log rotation changes when enabled
  useEffect(() => {
    if (!showRotationDebug) return;
    if (!currentPose?.rotation) return;
    const r = currentPose.rotation;
    console.log("[RotationDebug] Current rotation:", {
      x: Number((r.x || 0).toFixed(2)),
      y: Number((r.y || 0).toFixed(2)),
    });
  }, [showRotationDebug, currentPose]);

  // Sync markers with hotspots (only for Matterport tours - Marzipano uses useMarzipanoBridge)
  useEffect(() => {
    let cancelled = false;

    async function syncMarkers() {
      if (!controller) return;

      // Filter to only Matterport hotspots
      const matterportHotspots = hotspots.filter(isMatterportHotspot);

      if (!isConnected || !matterportHotspots.length) {
        await controller.clearMarkers().catch(() => undefined);
        return;
      }

      try {
        await controller.clearMarkers();
        for (const hotspot of matterportHotspots) {
          if (cancelled || !hotspot.is_active) continue;
          await controller.addMarker(
            hotspot.id,
            {
              x: hotspot.position_x,
              y: hotspot.position_y,
              z: hotspot.position_z,
            },
            {
              label: hotspot.title || "Hotspot",
              description: hotspot.description || "",
              color: getMattertagColor(hotspot.hotspot_type),
              normal: {
                x: hotspot.normal_x ?? 0,
                y: hotspot.normal_y ?? 0,
                z: hotspot.normal_z ?? 1,
              },
            }
          );
        }
      } catch (error) {
        if (!cancelled) {
          logMessage("Unable to sync Matterport markers", "warn");
          console.debug("[TourStudio] Marker sync error", error);
        }
      }
    }

    void syncMarkers();
    return () => {
      cancelled = true;
      controller?.clearMarkers().catch(() => undefined);
    };
  }, [controller, isConnected, hotspots, logMessage]);

  // Log errors
  useEffect(() => {
    if (hotspotsError) {
      logMessage(`Hotspot API error: ${hotspotsError}`, "error");
    }
  }, [hotspotsError, logMessage]);

  useEffect(() => {
    if (toursError) {
      logMessage(`Tours API error: ${toursError}`, "error");
    }
  }, [toursError, logMessage]);

  useEffect(() => {
    if (isConnected) {
      logMessage(`Tour SDK connected (${tourConfig?.tour_type || 'unknown'})`);
    } else if (sdkError) {
      logMessage(`SDK error: ${sdkError}`, "error");
    }
  }, [isConnected, sdkError, tourConfig, logMessage]);

  // Sync Marzipano pose to form during create/edit mode
  useEffect(() => {
    if (!isMarzipanoTour || !marzipanoBridge.isReady || !marzipanoBridge.currentPose) return;
    if (formMode !== "create") return; // Only sync during create mode
    
    const pose = marzipanoBridge.currentPose;
    const yawDeg = (pose.yaw * 180) / Math.PI;
    const pitchDeg = (pose.pitch * 180) / Math.PI;
    
    setFormData((prev) => ({
      ...prev,
      rotation_x: Number(pitchDeg.toFixed(2)),  // Backend only accepts 2 decimal places
      rotation_y: Number(yawDeg.toFixed(2)),  // Backend only accepts 2 decimal places
      // Marzipano doesn't have 3D position, but we store yaw/pitch there for hotspot placement
      position_x: 0,
      position_y: 0,
      position_z: 0,
    }));
  }, [isMarzipanoTour, marzipanoBridge.isReady, marzipanoBridge.currentPose, formMode]);

  const sdkStatusLabel = useMemo(() => {
    if (isConnected) return "Connected";
    if (sdkError) return "Failed";
    return "Connecting…";
  }, [isConnected, sdkError]);

  const sdkStatusColor = useMemo(() => {
    if (isConnected) return "text-green-500";
    if (sdkError) return "text-red-500";
    return "text-orange-400";
  }, [isConnected, sdkError]);

  // Start creating a new hotspot
  const startCreate = useCallback(async () => {
    setFormMode("create");
    setActiveHotspotId(null);
    
    if (isMarzipanoTour && marzipanoBridge.isReady) {
      // Get pose from Marzipano bridge
      try {
        const pose = await marzipanoBridge.getPose();
        const yawDeg = (pose.yaw * 180) / Math.PI;
        const pitchDeg = (pose.pitch * 180) / Math.PI;
        
        setFormData({
          ...getDefaultFormData(),
          rotation_x: Number(pitchDeg.toFixed(2)),  // Backend only accepts 2 decimal places
          rotation_y: Number(yawDeg.toFixed(2)),  // Backend only accepts 2 decimal places
          position_x: 0,
          position_y: 0,
          position_z: 0,
        });
        logMessage(`Creating Marzipano hotspot – yaw: ${yawDeg.toFixed(2)}°, pitch: ${pitchDeg.toFixed(2)}°`);
      } catch (err) {
        logMessage(`Failed to get Marzipano pose: ${err}`, 'error');
      }
    } else {
      // Matterport: use current SDK pose
      const normal = calculateNormal(currentPose?.rotation);
      setFormData({
        ...getDefaultFormData(),
        position_x: Number(currentPose?.position?.x?.toFixed(4)) || 0,
        position_y: Number(currentPose?.position?.y?.toFixed(4)) || 0,
        position_z: Number(currentPose?.position?.z?.toFixed(4)) || 0,
        normal_x: normal.x,
        normal_y: normal.y,
        normal_z: normal.z,
      });
      logMessage("Creating new hotspot – position updates with camera");
    }
  }, [isMarzipanoTour, marzipanoBridge, currentPose, logMessage, calculateNormal]);

  // Start editing an existing hotspot
  const startEdit = useCallback(
    (hotspotId: string) => {
      const hotspot = hotspots.find((h) => h.id === hotspotId);
      if (!hotspot) return;

      setFormMode("edit");
      setActiveHotspotId(hotspotId);
      
      // Build form data based on hotspot type
      if (isMarzipanoHotspot(hotspot)) {
        // Marzipano: use yaw/pitch converted to degrees for rotation_x/y display
        const yawDeg = (hotspot.yaw * 180) / Math.PI;
        const pitchDeg = (hotspot.pitch * 180) / Math.PI;
        setFormData({
          title: hotspot.title || "",
          description: hotspot.description || "",
          hotspot_type: hotspot.hotspot_type || "info",
          content_type: hotspot.content_type || "text",
          content_data: hotspot.content_data || {},
          action_type: hotspot.action_type || "",
          action_data: hotspot.action_data || {},
          position_x: 0, // Not used for Marzipano
          position_y: 0,
          position_z: 0,
          normal_x: 0,
          normal_y: 0,
          normal_z: 1,
          rotation_x: Number(pitchDeg.toFixed(2)), // pitch -> rotation_x
          rotation_y: Number(yawDeg.toFixed(2)),   // yaw -> rotation_y
          sweep_id: hotspot.scene_id || '',         // scene_id for Marzipano
          is_active: hotspot.is_active,
        });
      } else if (isMatterportHotspot(hotspot)) {
        // Matterport: use 3D position fields
        setFormData({
          title: hotspot.title || "",
          description: hotspot.description || "",
          hotspot_type: hotspot.hotspot_type || "info",
          content_type: hotspot.content_type || "text",
          content_data: hotspot.content_data || {},
          action_type: hotspot.action_type || "",
          action_data: hotspot.action_data || {},
          position_x: hotspot.position_x,
          position_y: hotspot.position_y,
          position_z: hotspot.position_z,
          normal_x: hotspot.normal_x ?? 0,
          normal_y: hotspot.normal_y ?? 0,
          normal_z: hotspot.normal_z ?? 1,
          rotation_x: hotspot.rotation_x,
          rotation_y: hotspot.rotation_y,
          sweep_id: hotspot.sweep_id,
          is_active: hotspot.is_active,
        });
      } else {
        // Unknown type - shouldn't happen
        setFormData(getDefaultFormData());
      }
    },
    [hotspots]
  );

  // Cancel form
  const cancelForm = useCallback(() => {
    setFormMode("idle");
    setActiveHotspotId(null);
    setFormData(getDefaultFormData());
  }, []);

  // Validate form data - takes formData as parameter to avoid stale closure
  const validateForm = useCallback((data: HotspotFormData): string | null => {
    if (!data.title.trim()) {
      return "Title is required";
    }
    if (data.title.length > 255) {
      return "Title must be 255 characters or less";
    }
    const validHotspotTypes = HOTSPOT_TYPES.map(t => t.value);
    if (!validHotspotTypes.includes(data.hotspot_type)) {
      return "Invalid hotspot type";
    }
    const validContentTypes = CONTENT_TYPES.map(t => t.value);
    if (!validContentTypes.includes(data.content_type)) {
      return "Invalid content type";
    }
    const validActionTypes = ['', ...Object.keys(ACTION_TYPE_CONFIG)] as ActionType[];
    if (data.action_type && !validActionTypes.includes(data.action_type)) {
      return "Invalid action type";
    }
    if (data.action_type === "open_url") {
      const url = (data.action_data as { url?: string })?.url;
      if (!url || !url.trim()) {
        return "URL is required for 'Open URL' action";
      }
      try {
        new URL(url);
      } catch {
        return "Invalid URL format";
      }
    }
    return null;
  }, []);

  // Save hotspot (create or update) with validation
  const saveHotspot = useCallback(async () => {
    // Clear previous errors
    setFormErrors({});
    
    // Run validation
    const errors = validateHotspotForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      const errorMsg = errors.title || errors.action_data?.join(', ') || errors.general || 'Validation failed';
      logMessage(errorMsg, "warn");
      return;
    }
    
    // Legacy validation (title check)
    const validationError = validateForm(formData);
    if (validationError) {
      logMessage(validationError, "warn");
      return;
    }

    // Clean action_data - remove empty optional fields
    const cleanedActionData = formData.action_type 
      ? cleanActionData(formData.action_type, formData.action_data)
      : {};

    setFormSaving(true);
    try {
      if (formMode === "create") {
        // Build hotspot data based on tour type
        const tourType = selectedTour?.tour_type as 'matterport' | 'marzipano' | undefined;
        
        // For Marzipano: convert rotation degrees to radians for yaw/pitch
        // Backend expects yaw/pitch in DEGREES for MarzipanoHotspot model
        const hotspotData: any = {
          title: formData.title,
          description: formData.description,
          hotspot_type: formData.hotspot_type,
          content_type: formData.content_type,
          content_data: formData.content_data,
          action_type: formData.action_type,
          action_data: cleanedActionData,
          is_active: formData.is_active,
        };
        
        if (isMarzipanoTour) {
          // Marzipano: capture the latest pose before we save
          let currentPose = marzipanoBridge.currentPose;
          if (!currentPose && marzipanoBridge.isReady) {
            try {
              currentPose = await marzipanoBridge.getPose();
            } catch (err) {
              logMessage(`Failed to refresh Marzipano pose before save: ${err}`, "warn");
            }
          }

          const fallbackYawDeg = formData.rotation_y ?? 0;
          const fallbackPitchDeg = formData.rotation_x ?? 0;
          const yawRad = currentPose ? currentPose.yaw : ((fallbackYawDeg * Math.PI) / 180);
          const pitchRad = currentPose ? currentPose.pitch : ((fallbackPitchDeg * Math.PI) / 180);
          hotspotData.yaw = Number(yawRad.toFixed(6));
          hotspotData.pitch = Number(pitchRad.toFixed(6));

          const sceneId = currentPose?.sceneId || formData.sweep_id || marzipanoBridge.currentPose?.sceneId || '';
          if (sceneId) {
            hotspotData.scene_id = sceneId;
          }

          const fovValue = currentPose?.fov ?? marzipanoBridge.currentPose?.fov;
          if (fovValue) {
            hotspotData.fov = fovValue;
          }
        } else {
          // Matterport: use 3D coordinates
          hotspotData.position_x = formData.position_x;
          hotspotData.position_y = formData.position_y;
          hotspotData.position_z = formData.position_z;
          hotspotData.normal_x = formData.normal_x;
          hotspotData.normal_y = formData.normal_y;
          hotspotData.normal_z = formData.normal_z;
          hotspotData.rotation_x = formData.rotation_x;
          hotspotData.rotation_y = formData.rotation_y;
          hotspotData.sweep_id = formData.sweep_id;
        }
        
        const created = await create(hotspotData, tourType);

        if (created) {
          logMessage(`Created hotspot "${created.title}"`);
          
          // Sync to Marzipano viewer (if it's a Marzipano hotspot)
          if (isMarzipanoTour && marzipanoBridge.isReady && isMarzipanoHotspot(created)) {
            marzipanoBridge.addHotspot({
              id: created.id,
              position: {
                yaw: created.yaw,
                pitch: created.pitch
              },
              data: created
            });
          }
          
          setFormMode("idle");
          setActiveHotspotId(null);
          setFormData(getDefaultFormData());
        } else {
          logMessage("Failed to create hotspot", "error");
        }
      } else if (formMode === "edit" && activeHotspotId) {
        // Build update data based on tour type
        const updateData: any = {
          title: formData.title,
          description: formData.description,
          hotspot_type: formData.hotspot_type,
          content_type: formData.content_type,
          content_data: formData.content_data,
          action_type: formData.action_type,
          action_data: cleanedActionData,
          is_active: formData.is_active,
        };
        
        if (isMarzipanoTour) {
          // Marzipano: use yaw/pitch
          const yawRad = ((formData.rotation_y || 0) * Math.PI) / 180;
          const pitchRad = ((formData.rotation_x || 0) * Math.PI) / 180;
          updateData.yaw = Number(yawRad.toFixed(6));
          updateData.pitch = Number(pitchRad.toFixed(6));
          updateData.scene_id = formData.sweep_id || marzipanoBridge.currentPose?.sceneId || '';
        } else {
          // Matterport: use 3D coordinates
          updateData.position_x = formData.position_x;
          updateData.position_y = formData.position_y;
          updateData.position_z = formData.position_z;
          updateData.normal_x = formData.normal_x;
          updateData.normal_y = formData.normal_y;
          updateData.normal_z = formData.normal_z;
          updateData.rotation_x = formData.rotation_x;
          updateData.rotation_y = formData.rotation_y;
          updateData.sweep_id = formData.sweep_id;
        }
        
        const updated = await update(activeHotspotId, updateData);

        if (updated) {
          logMessage(`Updated hotspot "${updated.title}"`);
          
          // Sync to Marzipano viewer (if it's a Marzipano hotspot)
          if (isMarzipanoTour && marzipanoBridge.isReady && isMarzipanoHotspot(updated)) {
            marzipanoBridge.updateHotspot({
              id: updated.id,
              position: {
                yaw: updated.yaw,
                pitch: updated.pitch
              },
              data: updated
            });
          }
          
          setFormMode("idle");
          setFormData(getDefaultFormData());
        } else {
          logMessage("Failed to update hotspot", "error");
        }
      }
    } finally {
      setFormSaving(false);
    }
  }, [formMode, formData, activeHotspotId, create, update, logMessage, validateForm]);

  // Navigate camera to hotspot position with correct rotation
  const navigateToHotspot = useCallback(
    async (hotspot: Hotspot) => {
      if (!isConnected || sdkStatus === "error") {
        logMessage("Camera not ready", "warn");
        return;
      }
      
      // Only Matterport hotspots support 3D navigation
      if (!isMatterportHotspot(hotspot)) {
        // For Marzipano, we would need to look at the view, not move through 3D space
        if (isMarzipanoHotspot(hotspot) && marzipanoBridge.isReady) {
          marzipanoBridge.lookAt({ yaw: hotspot.yaw, pitch: hotspot.pitch });
          setActiveHotspotId(hotspot.id);
          logMessage(`Looked at "${hotspot.title}"`);
        }
        return;
      }
      
      try {
        // Prefer stored exact rotation; fall back to computed from normal
        let rotation: { x: number; y: number };
        if (hotspot.rotation_x !== undefined && hotspot.rotation_y !== undefined) {
          rotation = { x: hotspot.rotation_x, y: hotspot.rotation_y };
          if (showRotationDebug) {
            console.log("[NavigateHotspot] Using stored rotation:", rotation);
          }
        } else {
          const normal = {
            x: hotspot.normal_x ?? 0,
            y: hotspot.normal_y ?? 0,
            z: hotspot.normal_z ?? 1,
          };
          rotation = calculateRotationFromNormal(normal);
          if (showRotationDebug) {
            console.log("[NavigateHotspot] Computed rotation from normal:", rotation);
          }
        }
        
        // Use sweep_id if available for precise pano navigation
        const sweepId = hotspot.sweep_id || undefined;
        
        if (showRotationDebug) {
          console.log("[NavigateHotspot] Full navigation data:", {
            position: { x: hotspot.position_x, y: hotspot.position_y, z: hotspot.position_z },
            rotation,
            sweep_id: sweepId || "(not set)",
            has_stored_rotation: hotspot.rotation_x !== undefined,
          });
        }
        
        // Single moveTo call with position and rotation
        await moveTo(
          {
            x: hotspot.position_x,
            y: hotspot.position_y,
            z: hotspot.position_z,
          },
          rotation
        );
        setActiveHotspotId(hotspot.id);
        logMessage(`Navigated to "${hotspot.title}"`);
        if (showRotationDebug) {
          const r = currentPose?.rotation;
          if (r) {
            console.log("[RotationDebug] After navigation rotation:", {
              x: Number((r.x || 0).toFixed(2)),
              y: Number((r.y || 0).toFixed(2)),
            });
          }
        }
      } catch (err) {
        logMessage("Failed to navigate to hotspot", "error");
      }
    },
    [sdkStatus, moveTo, logMessage, calculateRotationFromNormal, showRotationDebug, currentPose]
  );

  // Delete hotspot with confirmation
  const confirmDelete = useCallback(
    async (hotspotId: string) => {
      const target = hotspots.find((h) => h.id === hotspotId);
      const label = target?.title || hotspotId;

      try {
        await remove(hotspotId);
        
        // Sync to Marzipano viewer
        if (isMarzipanoTour && marzipanoBridge.isReady) {
          marzipanoBridge.deleteHotspot(hotspotId);
        }
        
        logMessage(`Deleted hotspot "${label}"`, "warn");
        if (activeHotspotId === hotspotId) {
          setActiveHotspotId(null);
          setFormMode("idle");
          setFormData(getDefaultFormData());
        }
        setDeleteConfirmId(null);
      } catch (error) {
        console.error("[TourStudio] Failed to delete hotspot", error);
        logMessage("Failed to delete hotspot", "error");
      }
    },
    [remove, hotspots, activeHotspotId, logMessage]
  );

  // Use camera position for current form
  const useCameraPosition = useCallback(() => {
    if (currentPose?.position) {
      setFormData((prev) => ({
        ...prev,
        position_x: Number(currentPose.position.x?.toFixed(2)) || 0,
        position_y: Number(currentPose.position.y?.toFixed(2)) || 0,
        position_z: Number(currentPose.position.z?.toFixed(2)) || 0,
      }));
      logMessage("Position updated from camera");
    }
  }, [currentPose, logMessage]);

  // Handle action modal save
  const handleActionModalSave = useCallback((actionType: ActionType, actionData: Record<string, unknown>) => {
    setFormData((prev) => ({
      ...prev,
      action_type: actionType,
      action_data: actionData,
    }));
    setFormErrors((prev) => ({ ...prev, action_data: undefined }));
    setActionModalOpen(false);
    logMessage(`Action configured: ${actionType || 'None'}`);
  }, [logMessage]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-800 dark:text-gray-100">
        <div className="text-lg">Checking authentication…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600 dark:text-red-400">Authentication required</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-1">Tour</label>
            {toursLoading ? (
              <div className="text-sm text-gray-500">Loading tours…</div>
            ) : (
              <select
                value={selectedTourId ?? ""}
                onChange={(event) => setSelectedTourId(event.target.value || null)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm"
              >
                <option value="">Select a tour…</option>
                {tours?.map((tour) => (
                  <option key={tour.id} value={tour.id}>
                    {tour.title} – {tour.shop_name}
                  </option>
                ))}
              </select>
            )}
            {selectedTour && (
              <p className="mt-1 text-xs text-gray-500">URL: {selectedTourUrl ?? "Not available"}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                logMessage("Refreshing hotspots");
                await refresh();
              }}
              disabled={!selectedTourId || hotspotsLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-100 disabled:opacity-50"
            >
              Refresh
            </button>
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
              <input
                type="checkbox"
                checked={overlayEnabled}
                onChange={(event) => setOverlayEnabled(event.target.checked)}
                className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
              />
              Overlay
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
              <input
                type="checkbox"
                checked={showRotationDebug}
                onChange={(event) => setShowRotationDebug(event.target.checked)}
                className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
              />
              Rotation Debug
            </label>
            <div className={`flex items-center gap-1 text-xs font-semibold ${sdkStatusColor}`}>
              <span className="inline-flex h-2 w-2 rounded-full bg-current" />
              {sdkStatusLabel}
            </div>
          </div>
        </div>
      </section>

      {selectedTourId ? (
        <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(340px,400px)] gap-4 h-[calc(100vh-160px)]">
          {/* Viewer - iframe for Matterport/Marzipano uploads, div for programmatic tours */}
          <div className="relative w-full h-full min-h-[400px] bg-black border border-gray-800 rounded-xl overflow-hidden">
            {selectedTourUrl ? (
              <>
                {/* Iframe for Matterport and Marzipano uploads - use correct ref based on tour type */}
                <iframe
                  ref={isMarzipanoTour ? marzipanoIframeRef : undefined}
                  src={selectedTourUrl}
                  allow="xr-spatial-tracking; fullscreen"
                  className="absolute inset-0 h-full w-full border-0"
                />
                
                {/* SDK overlay for Matterport only (when connected) */}
                {selectedTour?.tour_type === 'matterport' && actualIsConnected && overlayEnabled && (
                  <OverlaySVG
                    hotspots={hotspots.filter(isMatterportHotspot)}
                    controller={controller}
                    onMarkerClick={(hotspot) => startEdit(hotspot.id)}
                    activeHotspotId={activeHotspotId}
                  />
                )}
                
                {/* Connection status overlay */}
                {selectedTour?.tour_type === 'matterport' && !isConnected && (
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    {sdkError
                      ? `SDK Error: ${sdkError}`
                      : `Connecting to Matterport…`}
                  </div>
                )}
                {isMarzipanoTour && !marzipanoBridge.isReady && (
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                    Connecting to Marzipano…
                  </div>
                )}
              </>
            ) : tourConfig && tourConfig.tour_type !== 'matterport' ? (
              <>
                {/* Div container for programmatic tours (future Marzipano custom scenes) */}
                <div 
                  ref={containerCallbackRef}
                  id="tour-viewer-studio"
                  className="absolute inset-0 h-full w-full bg-black"
                />
                {isConnected && overlayEnabled && (
                  <OverlaySVG
                    hotspots={hotspots.filter(isMatterportHotspot)}
                    controller={controller}
                    onMarkerClick={(hotspot) => startEdit(hotspot.id)}
                    activeHotspotId={activeHotspotId}
                  />
                )}
                {!isConnected && (
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    {sdkError
                      ? `SDK Error: ${sdkError}`
                      : `Connecting to ${tourConfig.tour_type}…`}
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                Selected tour has no playable URL
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="flex flex-col gap-2 overflow-y-auto">
            {/* Camera Info */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-2 text-sm text-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-xs uppercase tracking-wide text-gray-400">Camera</h3>
                {sdkLastError && !isMarzipanoTour && (
                  <span className="text-[10px] text-red-400 max-w-[140px] truncate">{sdkLastError}</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 text-xs">
                {/* Marzipano camera info */}
                {isMarzipanoTour && marzipanoBridge.isReady && (
                  <>
                    {marzipanoBridge.currentPose && (
                      <>
                        <span className="text-gray-400">Yaw: <span className="font-mono text-gray-200">{((marzipanoBridge.currentPose.yaw * 180) / Math.PI).toFixed(1)}°</span></span>
                        <span className="text-gray-400">Pitch: <span className="font-mono text-gray-200">{((marzipanoBridge.currentPose.pitch * 180) / Math.PI).toFixed(1)}°</span></span>
                        <span className="text-gray-400">FOV: <span className="font-mono text-gray-200">{((marzipanoBridge.currentPose.fov * 180) / Math.PI).toFixed(0)}°</span></span>
                      </>
                    )}
                    {!marzipanoBridge.currentPose && (
                      <span className="col-span-3 text-gray-500 italic">Move camera to update pose</span>
                    )}
                  </>
                )}
                {isMarzipanoTour && !marzipanoBridge.isReady && (
                  <span className="col-span-3 text-gray-500 italic">Connecting to Marzipano…</span>
                )}
                {/* Matterport camera info */}
                {!isMarzipanoTour && isConnected && controller && (
                  <>
                    {currentPose?.position && (
                      <>
                        <span className="text-gray-400">X: <span className="font-mono text-gray-200">{currentPose.position.x?.toFixed(2)}</span></span>
                        <span className="text-gray-400">Y: <span className="font-mono text-gray-200">{currentPose.position.y?.toFixed(2)}</span></span>
                        <span className="text-gray-400">Z: <span className="font-mono text-gray-200">{currentPose.position.z?.toFixed(2)}</span></span>
                      </>
                    )}
                    {currentPose?.rotation && (
                      <>
                        <span className="text-gray-400">Rx: <span className="font-mono text-gray-200">{currentPose.rotation.x?.toFixed(1)}°</span></span>
                        <span className="text-gray-400">Ry: <span className="font-mono text-gray-200">{currentPose.rotation.y?.toFixed(1)}°</span></span>
                        {totalSweeps > 0 ? (
                          <span className="text-gray-400">#: <span className="font-mono text-gray-200">{totalSweeps}</span></span>
                        ) : null}
                      </>
                    )}
                  </>
                )}
                {!isMarzipanoTour && !isConnected && (
                  <span className="col-span-3 text-gray-500 italic">
                    {sdkStatus === "loading" ? "Connecting…" : sdkError ? "Connection error" : "Not connected"}
                  </span>
                )}
              </div>
            </div>

            {/* Marzipano Scene Selector */}
            {isMarzipanoTour && marzipanoBridge.isReady && marzipanoScenes.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-2 text-sm text-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-xs uppercase tracking-wide text-gray-400">
                    Scenes ({marzipanoScenes.length})
                  </h3>
                  {selectedSceneId && (
                    <span className="text-[10px] text-blue-400 truncate max-w-[120px]">
                      {marzipanoScenes.find(s => s.id === selectedSceneId)?.name || selectedSceneId}
                    </span>
                  )}
                </div>
                <div className="max-h-[150px] overflow-y-auto space-y-1">
                  {marzipanoScenes.map((scene, idx) => (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() => handleSceneSelect(scene.id)}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                        selectedSceneId === scene.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      <span className="font-mono text-[10px] text-gray-400 mr-1">{idx + 1}.</span>
                      {scene.name}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 mt-2">
                  Select a scene, then create hotspots for that scene.
                </p>
              </div>
            )}

            {/* Hotspot Form */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-2 text-sm text-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">
                  {formMode === "create" ? "New Hotspot" : formMode === "edit" ? "Edit Hotspot" : "Hotspot Form"}
                </h3>
                {formMode === "idle" ? (
                  <button
                    type="button"
                    onClick={startCreate}
                    disabled={!actualIsConnected}
                    className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded"
                    title={!actualIsConnected ? 'Waiting for tour to load...' : 'Create new hotspot'}
                  >
                    + New Hotspot
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="text-xs text-gray-400 hover:text-gray-200"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {formMode !== "idle" ? (
                <div className="space-y-2">
                  {/* Title */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-0.5">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded"
                      placeholder="Hotspot title"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-0.5">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded resize-none"
                      rows={1}
                      placeholder="Optional description"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-0.5">Hotspot Type</label>
                    <select
                      value={formData.hotspot_type}
                      onChange={(e) => setFormData((prev) => ({ ...prev, hotspot_type: e.target.value }))}
                      className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded"
                    >
                      {HOTSPOT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Configuration Button */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-0.5">Action</label>
                    <button
                      type="button"
                      onClick={() => setActionModalOpen(true)}
                      className={`
                        w-full px-3 py-2 text-sm rounded-lg border transition-all
                        flex items-center justify-between
                        ${formData.action_type
                          ? 'bg-indigo-900/30 border-indigo-600 hover:bg-indigo-900/50'
                          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">
                          {formData.action_type ? ACTION_TYPE_CONFIG[formData.action_type]?.icon : '○'}
                        </span>
                        <span className="text-white">
                          {formData.action_type
                            ? ACTION_TYPE_CONFIG[formData.action_type]?.label
                            : 'No action'
                          }
                        </span>
                      </div>
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                    {formData.action_type && (
                      <p className="mt-1 text-[10px] text-gray-500">
                        Click to configure {ACTION_TYPE_CONFIG[formData.action_type]?.label?.toLowerCase()} settings
                      </p>
                    )}
                    {/* Validation errors */}
                    {formErrors.action_data && formErrors.action_data.length > 0 && (
                      <div className="mt-2 p-2 bg-red-900/30 border border-red-700 rounded text-xs text-red-300">
                        {formErrors.action_data.map((err, i) => (
                          <div key={i}>⚠️ {err}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Position - Different UI for Marzipano vs Matterport */}
                  <div>
                    {isMarzipanoTour ? (
                      <>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-xs text-gray-400">Position (Yaw°, Pitch°)</label>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <div>
                            <input
                              type="number"
                              step="0.1"
                              value={formData.rotation_y ?? 0}
                              onChange={(e) => setFormData((prev) => ({ ...prev, rotation_y: parseFloat(e.target.value) || 0 }))}
                              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded font-mono"
                              placeholder="Yaw"
                            />
                            <span className="text-[10px] text-gray-500">Yaw</span>
                          </div>
                          <div>
                            <input
                              type="number"
                              step="0.1"
                              value={formData.rotation_x ?? 0}
                              onChange={(e) => setFormData((prev) => ({ ...prev, rotation_x: parseFloat(e.target.value) || 0 }))}
                              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded font-mono"
                              placeholder="Pitch"
                            />
                            <span className="text-[10px] text-gray-500">Pitch</span>
                          </div>
                        </div>
                        {formMode === "create" && (
                          <p className="text-[10px] text-gray-500 mt-1">Position auto-updates as you move the camera</p>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-xs text-gray-400">Position (X, Y, Z)</label>
                          {formMode === "edit" && isConnected && (
                            <button
                              type="button"
                              onClick={useCameraPosition}
                              className="text-[10px] text-blue-400 hover:text-blue-300"
                            >
                              Use camera position
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <input
                            type="number"
                            step="0.01"
                            value={formData.position_x}
                            onChange={(e) => setFormData((prev) => ({ ...prev, position_x: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded font-mono"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={formData.position_y}
                            onChange={(e) => setFormData((prev) => ({ ...prev, position_y: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded font-mono"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={formData.position_z}
                            onChange={(e) => setFormData((prev) => ({ ...prev, position_z: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded font-mono"
                          />
                        </div>
                        {formMode === "create" && (
                          <p className="text-[10px] text-gray-500 mt-1">Position auto-updates as you move the camera</p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Active toggle */}
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    Active
                  </label>

                  {/* Save button */}
                  <button
                    type="button"
                    onClick={saveHotspot}
                    disabled={formSaving || !formData.title.trim()}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded"
                  >
                    {formSaving ? "Saving…" : formMode === "create" ? "Create Hotspot" : "Update Hotspot"}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  Click "New Hotspot" to create one. Position will track the camera automatically.
                </p>
              )}
            </div>

            {/* Hotspots List */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-2 flex-shrink-0">
              <div className="flex items-center justify-between text-sm text-gray-200 mb-1">
                <h3 className="font-semibold">Hotspots ({hotspots.length})</h3>
                {hotspotsLoading && <span className="text-xs text-gray-500">Syncing…</span>}
              </div>

              <div className="max-h-[150px] overflow-y-auto space-y-1">
                {hotspots.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No hotspots yet</p>
                ) : (
                  hotspots.map((h) => (
                    <div
                      key={h.id}
                      className={`p-2 rounded border text-xs cursor-pointer transition-colors ${
                        activeHotspotId === h.id
                          ? "bg-blue-900/40 border-blue-600"
                          : "bg-gray-800 border-gray-700 hover:bg-gray-700"
                      }`}
                      onClick={() => navigateToHotspot(h)}
                      title="Click to navigate to hotspot"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate flex-1">{h.title || "(untitled)"}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(h.id);
                            }}
                            className="px-1.5 py-0.5 bg-blue-900/50 text-blue-300 hover:bg-blue-800 rounded text-[10px]"
                          >
                            Edit
                          </button>
                          {deleteConfirmId === h.id ? (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDelete(h.id);
                                }}
                                className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[10px]"
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(null);
                                }}
                                className="px-1.5 py-0.5 bg-gray-600 text-white rounded text-[10px]"
                              >
                                No
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(h.id);
                              }}
                              className="px-1.5 py-0.5 bg-red-900/50 text-red-300 hover:bg-red-800 rounded text-[10px]"
                            >
                              Del
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 mt-0.5">
                        <span>{h.hotspot_type}</span>
                        <span>
                          {h.is_active ? (
                            <span className="text-green-400">●</span>
                          ) : (
                            <span className="text-gray-500">○</span>
                          )}{" "}
                          {isMatterportHotspot(h) 
                            ? `(${h.position_x.toFixed(1)}, ${h.position_y.toFixed(1)}, ${h.position_z.toFixed(1)})`
                            : isMarzipanoHotspot(h)
                              ? `yaw: ${(h.yaw * 180 / Math.PI).toFixed(1)}°, pitch: ${(h.pitch * 180 / Math.PI).toFixed(1)}°`
                              : '(unknown)'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Console */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-2 flex-shrink-0">
              <div className="flex items-center justify-between text-sm text-gray-200 mb-1">
                <h3 className="font-semibold">Console</h3>
                <button
                  type="button"
                  onClick={() => setConsoleEntries([])}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  Clear
                </button>
              </div>
              <div className="max-h-[100px] overflow-y-auto font-mono text-xs space-y-0.5">
                {consoleEntries.length === 0 ? (
                  <p className="text-gray-500">Studio log will appear here</p>
                ) : (
                  consoleEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className={
                        entry.level === "error"
                          ? "text-red-400"
                          : entry.level === "warn"
                            ? "text-amber-300"
                            : "text-gray-300"
                      }
                    >
                      [{new Date(entry.timestamp).toLocaleTimeString()}] {entry.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[60vh] rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">Select a tour to start editing</p>
            <p className="text-sm text-gray-500 max-w-md">
              Choose a Matterport tour to enable the studio workspace. You can create and edit hotspots using the form.
            </p>
          </div>
        </div>
      )}

      {/* Action Details Modal */}
      <ActionDetailsModal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        onSave={handleActionModalSave}
        actionType={formData.action_type}
        actionData={formData.action_data}
        hotspots={hotspots}
        currentHotspotId={activeHotspotId ?? undefined}
      />
    </div>
  );
}
