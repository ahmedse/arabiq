// modules/HotspotList.tsx
"use client";

import type { Hotspot } from "./types";

interface HotspotListProps {
  hotspots: Hotspot[];
  activeHotspotId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRequestMove?: (id: string) => void;
  onToggleActive?: (id: string, nextActive: boolean) => void;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * HotspotList
 * Lists hotspots with controls for selecting, deleting, and moving.
 */
export function HotspotList({
  hotspots,
  activeHotspotId,
  onSelect,
  onDelete,
  onRequestMove,
  onToggleActive,
  isLoading,
  error,
}: HotspotListProps) {
  if (isLoading) return <p>Loading hotspots…</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="space-y-2">
      {hotspots.map((h) => (
        <div
          key={h.id}
          className={`p-2 border rounded cursor-pointer flex justify-between items-center text-sm transition-colors ${
            h.id === activeHotspotId
              ? "bg-blue-50 border-blue-300 dark:bg-blue-900/40 dark:border-blue-500"
              : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700"
          }`}
          onClick={() => onSelect(h.id)}
        >
          <div className="flex flex-col">
            <span className="font-medium text-gray-800 dark:text-gray-100">
              {h.title || "(untitled)"}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {h.hotspot_type} • {h.is_active ? "active" : "inactive"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onToggleActive && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleActive(h.id, !h.is_active);
                }}
                className={`text-[11px] px-1.5 py-0.5 rounded ${
                  h.is_active
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-200"
                    : "bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                }`}
              >
                {h.is_active ? "Disable" : "Enable"}
              </button>
            )}
            {onRequestMove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestMove(h.id);
                }}
                className="text-[11px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800"
              >
                Move
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(h.id);
              }}
              className="text-[11px] px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800"
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {hotspots.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 italic text-sm">
          No hotspots yet. Click inside the tour to create one.
        </p>
      )}
    </div>
  );
}