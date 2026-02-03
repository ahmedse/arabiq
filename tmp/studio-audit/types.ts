// types.ts - vMall Tour Studio Type Definitions
// Re-exports shared types and adds studio-specific types

// Re-export shared tour types from /lib/tour/
export type {
  ActionType,
  ActionData,
  OpenUrlActionData,
  ShowInfoActionData,
  ShowProductActionData,
  OpenBookingActionData,
  PlayAudioActionData,
  OpenChatbotActionData,
  NavigateActionData,
  BaseHotspot,
  MatterportHotspot,
  MarzipanoHotspot,
  Hotspot,
  LegacyHotspot,
  Tour,
  NavigationMode,
  Waypoint,
  GreeterData,
  MinimapConfig,
  WaypointHUDProps,
  GreeterTooltipProps,
} from "@/lib/tour";

export {
  ACTION_TYPE_CONFIG,
  validateActionData,
  getDefaultActionData,
  cleanActionData,
  isMatterportHotspot,
  isMarzipanoHotspot,
} from "@/lib/tour";
