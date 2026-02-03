/**
 * Matterport Components - Public API
 */

export { MatterportProvider, useMatterport } from './MatterportProvider';
export { MatterportViewer } from './MatterportViewer';
export { ProductTag } from './ProductTag';
export { InfoPanel } from './InfoPanel';
export { Hotspot } from './Hotspot';
export { MiniMap } from './MiniMap';
export { HotspotManager } from './HotspotManager';
export { PositionPicker } from './PositionPicker';

// Re-export types
export type {
  MatterportSDK,
  MatterportOptions,
  MatterportViewerProps,
  DemoConfig,
  TourItem,
  Vector3,
  CameraState,
  MattertagData,
  MattertagDescriptor,
  SweepData,
  FloorData,
} from '@/lib/matterport/types';

// Re-export hooks
export {
  useMatterportSdk,
  useCamera,
  useMattertags,
  useSweeps,
  useFloors,
  useVisitorPosition,
} from '@/lib/matterport/hooks';

// Re-export config
export {
  MATTERPORT_SDK_KEY,
  DEFAULT_OPTIONS,
  buildShowcaseUrl,
  DEMO_TOURS,
  type DemoSlug,
} from '@/lib/matterport/config';
