/**
 * Matterport SDK Type Definitions
 * Based on @matterport/sdk v3.x
 */

// Vector types
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Rotation {
  x: number;
  y: number;
}

// Camera types
export interface CameraState {
  position: Vector3;
  rotation: Rotation;
  sweep: string;
  mode: CameraMode;
}

export type CameraMode = 
  | 'mode.inside'
  | 'mode.outside'
  | 'mode.dollhouse'
  | 'mode.floorplan';

// Tag/Mattertag types
export interface MattertagData {
  sid: string;
  label: string;
  description: string;
  anchorPosition: Vector3;
  stemVector: Vector3;
  floorIndex: number;
  color?: { r: number; g: number; b: number };
  iconId?: string;
  stemHeight?: number;
  enabled?: boolean;
}

export interface MattertagDescriptor {
  label: string;
  description?: string;
  anchorPosition: Vector3;
  stemVector?: Vector3;
  color?: { r: number; g: number; b: number };
  iconId?: string;
  stemHeight?: number;
  floorIndex?: number;
  media?: {
    type: 'photo' | 'video' | 'rich';
    src: string;
  };
}

// Sweep (panorama position) types
export interface SweepData {
  sid: string;
  position: Vector3;
  rotation: Rotation;
  floor: number;
  neighbors: string[];
  enabled: boolean;
}

// Floor types
export interface FloorData {
  id: string;
  name: string;
  sequence: number;
}

// Model types
export interface ModelData {
  sid: string;
  name: string;
  presentedBy: string;
  images: {
    [key: string]: string;
  };
}

// SDK Event types
export type SdkEvent = 
  | 'camera.move'
  | 'sweep.enter'
  | 'mattertag.click'
  | 'model.loaded'
  | 'floor.change';

export interface CameraMoveEvent {
  position: Vector3;
  rotation: Rotation;
  sweep: string;
}

export interface SweepEnterEvent {
  from: string;
  to: string;
}

export interface MattertagClickEvent {
  sid: string;
  tagData: MattertagData;
}

// SDK Interface (subset of full SDK)
export interface MatterportSDK {
  // App
  App: {
    getState: () => Promise<{ phase: string }>;
    getLoadTimes: () => Promise<{ [key: string]: number }>;
  };
  
  // Camera
  Camera: {
    getPose: () => Promise<CameraState>;
    setRotation: (rotation: Rotation) => Promise<void>;
    moveToSweep: (sweepId: string, options?: { transition?: string }) => Promise<void>;
    zoomTo: (zoom: number) => Promise<void>;
  };
  
  // Mattertag (hotspots)
  Mattertag: {
    getData: () => Promise<MattertagData[]>;
    add: (descriptors: MattertagDescriptor[]) => Promise<string[]>;
    remove: (sids: string[]) => Promise<void>;
    navigateToTag: (sid: string, options?: { transition?: string }) => Promise<void>;
    registerIcon: (iconId: string, iconSrc: string) => Promise<void>;
  };
  
  // Sweep (panorama positions)
  Sweep: {
    current: { sid: string };
    data: SweepData[];
    enable: (sweepIds: string[]) => Promise<void>;
    disable: (sweepIds: string[]) => Promise<void>;
    moveTo: (sweepId: string) => Promise<void>;
  };
  
  // Floor
  Floor: {
    current: { id: string; sequence: number };
    data: FloorData[];
    moveTo: (floorId: string) => Promise<void>;
  };
  
  // Model
  Model: {
    getData: () => Promise<ModelData>;
  };
  
  // Events
  on: <T>(event: SdkEvent, callback: (data: T) => void) => void;
  off: (event: SdkEvent, callback: (data: unknown) => void) => void;
}

// Component Props
export interface MatterportViewerProps {
  modelId: string;
  sdkKey?: string;
  className?: string;
  onReady?: (sdk: MatterportSDK) => void;
  onError?: (error: Error) => void;
  onCameraMove?: (event: CameraMoveEvent) => void;
  onSweepEnter?: (event: SweepEnterEvent) => void;
  onTagClick?: (event: MattertagClickEvent) => void;
  options?: MatterportOptions;
}

export interface MatterportOptions {
  play?: boolean;           // Autoplay on load
  qs?: boolean;            // Quick start (skip intro)
  sr?: string;             // Start rotation
  ss?: string;             // Start sweep
  dh?: boolean;            // Disable highlight reel
  gt?: boolean;            // Guided tour
  hr?: boolean;            // Highlight reel
  mls?: boolean;           // MLS mode (limited features)
  mt?: boolean;            // Mattertags visible
  pin?: boolean;           // Pin (GPS) visible
  portal?: boolean;        // Portal visible
  title?: boolean;         // Title visible
  vr?: boolean;            // VR mode available
  help?: boolean;          // Help button visible
  hl?: boolean;            // Highlight on hover
  brand?: boolean;         // Branding visible
  search?: boolean;        // Search visible
  ts?: number;             // Tour start time
  lp?: boolean;            // Loop playback
  lang?: string;           // Language code
}

// Demo configuration from CMS
export interface DemoConfig {
  id: number;
  slug: string;
  title: string;
  summary?: string;
  matterportModelId: string;
  demoType: 'ecommerce' | 'cafe' | 'hotel' | 'realestate' | 'showroom' | 'office' | 'tour3d' | 'vfair' | 'aichat' | 'training';
  featuredImage?: string;
  businessName?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessWhatsapp?: string;
  enableVoiceOver: boolean;
  enableLiveChat: boolean;
  enableAiChat: boolean;
  config?: Record<string, unknown>;
}

// Enhanced position data for accurate tag placement
export interface HotspotPositionData {
  anchorPosition: Vector3;        // Where the tag connects to the surface
  stemVector: Vector3;            // Direction the tag points (from surface normal)
  roomId?: string;                // Associated room for visibility
  nearestSweepId?: string;        // Nearest panorama for navigation
  floorIndex?: number;            // Floor for multi-floor spaces
  cameraRotation?: Rotation;      // Camera facing direction when captured
}

// Product/Item displayed in tour
export interface TourItem {
  id: number;
  documentId: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  /** @deprecated Use hotspotData for accurate positioning */
  hotspotPosition?: Vector3;
  /** Enhanced position data with normal and sweep info */
  hotspotData?: HotspotPositionData;
  category?: string;
}

// Pointer intersection data from Matterport
export interface PointerIntersection {
  position: Vector3;
  normal: Vector3;
  floorIndex?: number;
  floorId?: string;
  object: 'model' | 'tag' | 'sweep' | 'none';
}

// Tag descriptor for new Tag API
export interface TagDescriptor {
  id?: string;
  label: string;
  description?: string;
  anchorPosition: Vector3;
  stemVector: Vector3;
  color?: { r: number; g: number; b: number };
  iconId?: string;
  enabled?: boolean;
  stemVisible?: boolean;
  opacity?: number;
  attachments?: string[];
}
