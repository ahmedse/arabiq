// sdkClient.ts
const MATTERPORT_API_KEY =
  process.env.NEXT_PUBLIC_MATTERPORT_SDK_KEY ||
  "pfy903dxym1nyt737xy6uuqwb";

const MATTERPORT_SDK_URL =
  process.env.NEXT_PUBLIC_MATTERPORT_SDK_URL ||
  "https://static.matterport.com/showcase-sdk/latest.js";

export async function loadMatterportSDK(): Promise<void> {
  if (typeof window === "undefined") return;

  const w = window as any;

  if (w.MP_SDK) return;

  if (w.__MP_SDK_LOAD_PROMISE__) return w.__MP_SDK_LOAD_PROMISE__ as Promise<void>;

  w.__MP_SDK_LOAD_PROMISE__ = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${MATTERPORT_SDK_URL}"]`
    );
    if (existing && w.MP_SDK) {
      console.log("[MatterportSDK] Script tag already present, SDK available");
      resolve();
      return;
    }

    const script = existing || document.createElement("script");
    script.src = MATTERPORT_SDK_URL;
    script.async = true;

    script.onload = () => {
      console.log("[MatterportSDK] Script loaded successfully");
      resolve();
    };

    script.onerror = (err) => {
      console.error("[MatterportSDK] Failed to load script:", err);
      reject(new Error("Failed to load Matterport SDK"));
    };

    if (!existing) {
      document.head.appendChild(script);
    }
  });

  return w.__MP_SDK_LOAD_PROMISE__;
}

export interface MatterportController {
  connect(iframe: HTMLIFrameElement): Promise<any>;
  addMarker(
    id: string,
    pos: { x: number; y: number; z: number },
    options?: {
      label?: string;
      description?: string;
      color?: { r: number; g: number; b: number };
      normal?: { x: number; y: number; z: number };
    }
  ): Promise<void>;
  removeMarker(id: string): Promise<void>;
  clearMarkers(): Promise<void>;
  projectToScreen(pos: { x: number; y: number; z: number }): Promise<{ x: number; y: number } | null>;
  getCameraPose(): Promise<{ x: number; y: number; z: number }>;
  moveTo(pos: { x: number; y: number; z: number }, rotation?: { x: number; y: number }, sweepId?: string): Promise<void>;
  setRotation(rotation: { x: number; y: number }): Promise<void>;
  onClick(callback: (coords: { x: number; y: number; z: number }) => void): () => void;
  subscribeToPose(callback: (pose: any) => void): () => void;
  subscribeToSweep(callback: (sweep: any) => void): () => void;
  getSweepData(): Promise<any[]>;
}

export function createMatterportController(): MatterportController {
  const markers = new Map<string, string>(); // Store marker IDs from SDK
  let sdk: any = null;
  let clickSubscription: any = null;
  let connectedIframe: HTMLIFrameElement | null = null;

  async function connect(iframe: HTMLIFrameElement) {
    await loadMatterportSDK();
    const w = window as any;
    if (!w.MP_SDK) {
      throw new Error("MP_SDK is not available on window after script load");
    }

    console.log("[MatterportController] Connecting to MP_SDK...");
    sdk = await w.MP_SDK.connect(iframe, MATTERPORT_API_KEY, "");
    console.log("[MatterportController] Connected successfully");
    connectedIframe = iframe;

    return sdk;
  }

  async function addMarker(
    id: string,
    pos: { x: number; y: number; z: number },
    options: {
      label?: string;
      description?: string;
      color?: { r: number; g: number; b: number };
      normal?: { x: number; y: number; z: number };
    } = {}
  ) {
    if (!sdk || !sdk.Mattertag) {
      console.warn("[MatterportController] Mattertag API not available");
      return;
    }
    
    if (markers.has(id)) {
      console.log("[MatterportController] Marker already exists:", id);
      return;
    }

    try {
      const {
        label = "Hotspot",
        description = "",
        color = { r: 0.2, g: 0.5, b: 1.0 },
        normal = { x: 0, y: 0, z: 1 },
      } = options;

      // Calculate stem vector from normal - stem points in the normal direction
      // Scale stem length based on how "vertical" the normal is
      const stemLength = 0.3;
      const stemVector = {
        x: normal.x * stemLength,
        y: Math.max(0.1, normal.y * stemLength + 0.2), // Ensure some upward component
        z: normal.z * stemLength,
      };

      // Use Mattertag.add with proper positioning
      const [matterId] = await sdk.Mattertag.add([{
        label,
        description,
        anchorPosition: pos,
        stemVector,
        color,
      }]);

      markers.set(id, matterId);
      console.log("[MatterportController] Added marker:", id, matterId);
    } catch (err) {
      console.error("[MatterportController] Failed to add marker:", err);
    }
  }

  async function removeMarker(id: string) {
    if (!sdk || !sdk.Mattertag) return;
    
    const matterId = markers.get(id);
    if (matterId) {
      try {
        await sdk.Mattertag.remove([matterId]);
        markers.delete(id);
        console.log("[MatterportController] Removed marker:", id);
      } catch (err) {
        console.warn("[MatterportController] Failed to remove marker:", err);
      }
    }
  }

  async function clearMarkers() {
    if (!sdk || !sdk.Mattertag) return;
    
    const markerIds = Array.from(markers.values());
    if (markerIds.length === 0) return;

    try {
      await sdk.Mattertag.remove(markerIds);
      markers.clear();
      console.log("[MatterportController] Cleared all markers");
    } catch (err) {
      console.warn("[MatterportController] Failed to clear markers:", err);
    }
  }

  async function projectToScreen(pos: { x: number; y: number; z: number }): Promise<{ x: number; y: number } | null> {
    if (!sdk || !sdk.Conversion) {
      console.warn("[MatterportController] Conversion API not available");
      return null;
    }

    if (!connectedIframe) {
      console.warn("[MatterportController] No iframe connected for projection");
      return null;
    }

    try {
      // Use Conversion.worldToScreen
      const screenCoords = await sdk.Conversion.worldToScreen(pos);
      
      if (!screenCoords) return null;

      const { clientWidth, clientHeight } = connectedIframe;
      if (!clientWidth || !clientHeight) {
        return null;
      }

      return {
        x: screenCoords.x / clientWidth,
        y: screenCoords.y / clientHeight,
      };
    } catch (err) {
      console.debug("[MatterportController] Projection failed:", err);
      return null;
    }
  }

  async function getCameraPose() {
    if (!sdk || !sdk.Camera) {
      throw new Error("Camera API not available");
    }

    // Try multiple API shapes for camera pose across SDK versions
    let pose: any = null;
    try {
      if (sdk.Camera.pose && typeof sdk.Camera.pose.get === "function") {
        pose = await sdk.Camera.pose.get();
      } else if (typeof sdk.Camera.getPose === "function") {
        pose = await sdk.Camera.getPose();
      } else if (typeof sdk.Camera.pose?.getPose === "function") {
        pose = await sdk.Camera.pose.getPose();
      }
    } catch (e) {
      console.debug("[MatterportController] Failed to read camera pose via known APIs", e);
    }

    if (!pose || !pose.position) {
      throw new Error("Camera pose not available in this SDK version");
    }

    return {
      x: pose.position.x,
      y: pose.position.y,
      z: pose.position.z,
    };
  }

  async function moveTo(
    pos: { x: number; y: number; z: number },
    rotation?: { x: number; y: number },
    sweepId?: string
  ): Promise<void> {
    if (!sdk) {
      throw new Error("SDK not connected");
    }

    try {
      const rot = rotation ?? { x: 0, y: 0 };
      
      console.log("[MatterportController] moveTo called with:", {
        position: pos,
        rotation: rot,
        sweepId,
      });

      // Strategy 1: If we have a sweep ID, use Sweep.moveTo for exact pano navigation
      if (sweepId && sdk.Sweep && typeof sdk.Sweep.moveTo === 'function') {
        console.log("[MatterportController] Strategy 1: Using Sweep.moveTo for sweep:", sweepId);
        try {
          await sdk.Sweep.moveTo(sweepId, {
            rotation: rot,
            transition: sdk.Mode?.TransitionType?.FLY ?? 1,
          });
          console.log("[MatterportController] Sweep.moveTo succeeded");
          return;
        } catch (sweepErr) {
          console.warn("[MatterportController] Sweep.moveTo failed, trying fallback:", sweepErr);
        }
      }
      
      // Strategy 2: Use Mode.moveTo with position (SDK will snap to nearest sweep)
      if (sdk.Mode && sdk.Mode.moveTo) {
        console.log("[MatterportController] Strategy 2: Using Mode.moveTo with position");
        try {
          await sdk.Mode.moveTo(sdk.Mode.Mode.INSIDE, {
            position: pos,
            rotation: rot,
            transition: sdk.Mode.TransitionType.FLY,
          });
          console.log("[MatterportController] Mode.moveTo succeeded");
          return;
        } catch (modeErr) {
          console.warn("[MatterportController] Mode.moveTo failed:", modeErr);
        }
      }
      
      // Strategy 3: Two-step approach - move first, then rotate
      if (sdk.Camera) {
        console.log("[MatterportController] Strategy 3: Two-step Camera approach");
        
        // Step 1: Try to move camera position
        if (typeof sdk.Camera.moveTo === 'function') {
          try {
            await sdk.Camera.moveTo(
              { x: pos.x, y: pos.y, z: pos.z },
              { transitionType: "fly" }
            );
            console.log("[MatterportController] Camera.moveTo succeeded");
          } catch (camMoveErr) {
            console.warn("[MatterportController] Camera.moveTo failed:", camMoveErr);
          }
        }
        
        // Step 2: Set rotation
        if (rotation && typeof sdk.Camera.rotateTo === 'function') {
          // Small delay to let move complete
          await new Promise(resolve => setTimeout(resolve, 500));
          try {
            await sdk.Camera.rotateTo(rot);
            console.log("[MatterportController] Camera.rotateTo succeeded");
          } catch (rotErr) {
            console.warn("[MatterportController] Camera.rotateTo failed:", rotErr);
          }
        }
        return;
      }
      
      console.warn("[MatterportController] No moveTo API available");
    } catch (err) {
      console.error("[MatterportController] moveTo failed:", err);
      throw err;
    }
  }

  // Explicitly set camera rotation (pitch=x, yaw=y in degrees)
  async function setRotation(rotation: { x: number; y: number }): Promise<void> {
    if (!sdk) return;
    try {
      if (sdk.Camera && typeof sdk.Camera.rotateTo === 'function') {
        await sdk.Camera.rotateTo({ x: rotation.x, y: rotation.y });
      } else if (sdk.Mode && sdk.Mode.moveTo) {
        // Fallback: use our helper to get current camera position
        const current = await getCameraPose();
        await sdk.Mode.moveTo(sdk.Mode.Mode.INSIDE, {
          position: { x: current.x, y: current.y, z: current.z },
          rotation: { x: rotation.x, y: rotation.y },
          transition: sdk.Mode.TransitionType.FLY,
        });
      } else {
        console.warn("[MatterportController] setRotation API not available");
      }
    } catch (err) {
      console.error("[MatterportController] setRotation failed:", err);
    }
  }

  function onClick(callback: (coords: { x: number; y: number; z: number }) => void): () => void {
    if (!sdk || !sdk.Pointer || !sdk.Pointer.intersection) {
      console.warn("[MatterportController] Pointer.intersection not available");
      return () => {};
    }

    // Clear previous subscription
    if (clickSubscription) {
      try {
        clickSubscription.cancel();
      } catch (e) {
        // ignore
      }
    }

    clickSubscription = sdk.Pointer.intersection.subscribe((intersection: any) => {
      if (intersection && intersection.position) {
        callback(intersection.position);
      }
    });

    return () => {
      if (clickSubscription) {
        try {
          clickSubscription.cancel();
          clickSubscription = null;
        } catch (e) {
          // ignore
        }
      }
    };
  }

  function subscribeToPose(callback: (pose: any) => void): () => void {
    if (!sdk || !sdk.Camera || !sdk.Camera.pose) {
      console.warn("[MatterportController] Camera.pose subscription not available");
      return () => {};
    }

    const sub = sdk.Camera.pose.subscribe(callback);
    
    return () => {
      try {
        sub.cancel();
      } catch (e) {
        // ignore
      }
    };
  }

  function subscribeToSweep(callback: (sweep: any) => void): () => void {
    if (!sdk || !sdk.Sweep || !sdk.Sweep.current) {
      console.warn("[MatterportController] Sweep.current subscription not available");
      return () => {};
    }

    const sub = sdk.Sweep.current.subscribe(callback);
    
    return () => {
      try {
        sub.cancel();
      } catch (e) {
        // ignore
      }
    };
  }

  async function getSweepData(): Promise<any[]> {
    if (!sdk) {
      console.warn("[MatterportController] SDK not ready");
      return [];
    }

    // Use Model.getData() instead of Sweep.get()
    try {
      if (!sdk.Model || !sdk.Model.getData) {
        console.debug("[sdkClient] Model.getData not available");
        return [];
      }

      const modelData = await sdk.Model.getData();
      
      if (modelData && modelData.sweeps && Array.isArray(modelData.sweeps)) {
        console.log("[sdkClient] Found", modelData.sweeps.length, "sweeps");
        return modelData.sweeps;
      }
      
      return [];
    } catch (error) {
      console.debug("[sdkClient] Sweep data unavailable:", error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  return {
    connect,
    addMarker,
    removeMarker,
    clearMarkers,
    projectToScreen,
    getCameraPose,
    moveTo,
    setRotation,
    onClick,
    subscribeToPose,
    subscribeToSweep,
    getSweepData,
  };
}