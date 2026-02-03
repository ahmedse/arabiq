"use client";

import { useEffect } from "react";
import { useMatterport } from "./useMatterport";

interface TourViewerProps {
  tourUrl: string | null;
  onSceneClick: (coords: { x: number; y: number; z: number }) => void;
}

export function TourViewer({ tourUrl, onSceneClick }: TourViewerProps) {
  const { iframeRef, controller, status } = useMatterport({ tourUrl, onClick: onSceneClick });

  if (!tourUrl)
    return (
      <div className="flex items-center justify-center h-64 border rounded text-gray-500">
        No tour selected
      </div>
    );

  const getStatusColor = () => {
    switch (status) {
      case "ready":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  return (
    <div className="relative border rounded-lg overflow-hidden h-[500px]">
      <iframe
        ref={iframeRef}
        src={tourUrl}
        allow="accelerometer; magnetometer; gyroscope; fullscreen"
        allowFullScreen
        className="w-full h-full"
      />
      <div className="absolute top-2 left-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
      </div>
    </div>
  );
}