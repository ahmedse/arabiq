// OverlaySVG.tsx - Hotspot marker overlay for Matterport tours
"use client";

import { useEffect, useRef, useState } from "react";
import type { MatterportHotspot, NavigationMode } from "./types";
import type { TourSDKController } from "@/lib/tour-sdk";

interface OverlaySVGProps {
  hotspots: MatterportHotspot[];
  controller: TourSDKController | null;
  onMarkerClick: (hotspot: MatterportHotspot) => void;
  activeHotspotId?: string | null;
  navigationMode?: NavigationMode; // 'free' | 'guided'
  showGuidedNumbers?: boolean; // Show sequence numbers for guided hotspots
}

// Color mapping by action_type (priority) or hotspot_type (fallback)
const ACTION_COLORS: Record<string, string> = {
  // Action types
  open_url: "fill-blue-500",
  show_info: "fill-sky-400",
  show_product: "fill-emerald-500",
  open_booking: "fill-amber-500",
  play_audio: "fill-pink-500",
  open_chatbot: "fill-purple-500",
  navigate: "fill-cyan-400",
  // Hotspot types (fallback)
  info: "fill-blue-500",
  chatbot: "fill-purple-500",
  ecommerce: "fill-emerald-500",
  booking: "fill-amber-500",
  education: "fill-sky-500",
  product: "fill-emerald-500",
  action: "fill-green-500",
  navigation: "fill-cyan-400",
};

// Animation classes by action_type
const ACTION_ANIMATIONS: Record<string, string> = {
  show_product: "animate-pulse",
  open_chatbot: "animate-pulse",
  play_audio: "animate-bounce",
  open_booking: "animate-pulse",
};

/**
 * OverlaySVG
 * Uses <svg> to render live, interactive hotspot markers that stick
 * to their 3D positions as the Matterport camera moves.
 * 
 * Color coding:
 * - Blue: URLs, Info
 * - Emerald: Products (pulsing)
 * - Purple: Chatbot (pulsing)
 * - Amber: Booking (pulsing)
 * - Pink: Audio (bouncing)
 * - Cyan: Navigation
 * 
 * Guided mode:
 * - Highlighted hotspots shown with full opacity and sequence numbers
 * - Non-guided hotspots dimmed (30% opacity)
 */
export function OverlaySVG({
  hotspots,
  controller,
  onMarkerClick,
  activeHotspotId,
  navigationMode = 'free',
  showGuidedNumbers = true,
}: OverlaySVGProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [screenPositions, setScreenPositions] = useState<
    Record<string, { x: number; y: number } | null>
  >({});

  useEffect(() => {
    let animationFrame: number;
    let running = true;

    async function updatePositions() {
      if (!running) return;

      if (!hotspots.length) {
        setScreenPositions({});
        animationFrame = requestAnimationFrame(updatePositions);
        return;
      }

      const entries = await Promise.all(
        hotspots.map(async (hotspot) => {
          if (!hotspot.is_active) {
            return [hotspot.id, null] as const;
          }

          try {
            if (!controller) {
              return [hotspot.id, null] as const;
            }
            
            const projected = await controller.projectToScreen({
              x: hotspot.position_x,
              y: hotspot.position_y,
              z: hotspot.position_z,
            });

            if (
              projected &&
              projected.x >= 0 &&
              projected.x <= 1 &&
              projected.y >= 0 &&
              projected.y <= 1
            ) {
              return [hotspot.id, projected] as const;
            }
          } catch {
            // ignore projection errors for off-screen hotspots
          }

          return [hotspot.id, null] as const;
        })
      );

      if (!running) return;

      const mapped: Record<string, { x: number; y: number } | null> = {};
      for (const [id, pos] of entries) {
        mapped[id] = pos;
      }
      setScreenPositions(mapped);

      animationFrame = requestAnimationFrame(updatePositions);
    }

    updatePositions();

    return () => {
      running = false;
      cancelAnimationFrame(animationFrame);
    };
  }, [hotspots, controller]);

  // Get color class - prioritize action_type, fall back to hotspot_type
  const getColorForHotspot = (h: MatterportHotspot) => {
    if (h.action_type && ACTION_COLORS[h.action_type]) {
      return ACTION_COLORS[h.action_type];
    }
    return ACTION_COLORS[h.hotspot_type] || "fill-blue-500";
  };

  // Get animation class based on action_type
  const getAnimationForHotspot = (h: MatterportHotspot, isActive: boolean) => {
    if (isActive) return ""; // No animation when active/selected
    if (h.action_type && ACTION_ANIMATIONS[h.action_type]) {
      return ACTION_ANIMATIONS[h.action_type];
    }
    return "animate-pulse"; // Default pulse for inactive markers
  };

  // Get icon/label for hotspot
  const getIconForHotspot = (h: MatterportHotspot) => {
    const icons: Record<string, string> = {
      open_url: "🔗",
      show_info: "ℹ️",
      show_product: "🛒",
      open_booking: "📅",
      play_audio: "🎵",
      open_chatbot: "🤖",
      navigate: "🧭",
    };
    return h.action_type ? icons[h.action_type] || "" : "";
  };

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {hotspots.map((h) => {
        const pos = screenPositions[h.id];
        if (!pos) return null;

        const isActive = h.id === activeHotspotId;
        const colorClass = getColorForHotspot(h);
        const animationClass = getAnimationForHotspot(h, isActive);
        const icon = getIconForHotspot(h);
        
        // In guided mode, dim non-guided hotspots
        const isGuided = h.is_guided ?? false;
        const guidedOpacity = navigationMode === 'guided' && !isGuided ? 0.3 : 1;
        const showNumber = navigationMode === 'guided' && isGuided && showGuidedNumbers && h.guided_order !== undefined;

        return (
          <g
            key={h.id}
            transform={`translate(${pos.x * 100}, ${pos.y * 100})`}
            className="cursor-pointer transition-all duration-300"
            onClick={() => onMarkerClick(h)}
            style={{ pointerEvents: "auto", opacity: guidedOpacity }}
          >
            {/* Outer glow ring for active marker */}
            {isActive && (
              <circle
                cx="0"
                cy="0"
                r="3"
                className="fill-none stroke-white stroke-[0.3] opacity-50"
              />
            )}
            
            {/* Guided sequence number badge */}
            {showNumber && (
              <>
                <circle
                  cx="-1.5"
                  cy="-1.5"
                  r="1.2"
                  className="fill-purple-600 stroke-white stroke-[0.15]"
                />
                <text
                  x="-1.5"
                  y="-1.1"
                  textAnchor="middle"
                  className="fill-white text-[1.2px] select-none font-bold"
                >
                  {h.guided_order}
                </text>
              </>
            )}
            
            {/* Main marker circle */}
            <circle
              cx="0"
              cy="0"
              r={isActive ? 2.2 : 1.7}
              className={`${colorClass} stroke-white stroke-[0.2] ${animationClass}`}
            />
            {/* Label with icon */}
            <text
              x="2.4"
              y="0.6"
              className="fill-white text-[2px] select-none font-semibold drop-shadow-sm"
            >
              {icon} {h.title || h.hotspot_type}
            </text>
          </g>
        );
      })}
    </svg>
  );
}