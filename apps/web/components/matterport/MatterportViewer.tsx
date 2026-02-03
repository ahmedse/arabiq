'use client';

/**
 * Main Matterport 3D Viewer Component
 * Uses iframe-first approach for reliability
 * SDK features added as enhancement when available
 */

import React, { useEffect, useState, useRef } from 'react';
import { useMatterport } from './MatterportProvider';
import { MATTERPORT_SDK_KEY } from '@/lib/matterport/config';

interface MatterportViewerProps {
  className?: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
  /** Use simple iframe mode (no SDK). Default: true for reliability */
  useIframeMode?: boolean;
}

/**
 * Build Matterport showcase URL
 */
function buildMatterportUrl(modelId: string): string {
  const params = new URLSearchParams({
    m: modelId,
    play: '1',
    qs: '1',
    title: '0',
    brand: '0',
    help: '0',
  });
  
  return `https://my.matterport.com/show?${params.toString()}`;
}

export function MatterportViewer({
  className = '',
  onReady,
  onError,
  useIframeMode = true, // Default to iframe mode for reliability
}: MatterportViewerProps) {
  const { containerRef, isReady, isLoading, error, demo } = useMatterport();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Check for model ID first
  if (!demo?.matterportModelId) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 text-white ${className}`}>
        <div className="text-center p-8">
          <h3 className="text-xl font-bold mb-2">No 3D Tour Available</h3>
          <p className="text-gray-400">
            This demo does not have a 3D tour configured yet.
          </p>
        </div>
      </div>
    );
  }

  // IFRAME MODE - Simple, reliable, always works
  if (useIframeMode) {
    const iframeUrl = buildMatterportUrl(demo.matterportModelId);
    
    return (
      <div className={`relative ${className}`}>
        {/* Loading state */}
        {!iframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="text-center text-white">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
              <p>Loading 3D Tour...</p>
            </div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={iframeUrl}
          className="w-full h-full border-none"
          allow="fullscreen; xr-spatial-tracking"
          allowFullScreen
          title={demo.title || 'Matterport 3D Tour'}
          onLoad={() => {
            setIframeLoaded(true);
            onReady?.();
          }}
          onError={() => {
            onError?.(new Error('Failed to load 3D tour'));
          }}
        />
      </div>
    );
  }

  // SDK MODE - Advanced features (hotspots, interactions)
  // Only used when useIframeMode=false
  return (
    <div className={`relative ${className}`}>
      {/* Container for SDK to mount iframe */}
      <div 
        ref={containerRef}
        className="w-full h-full"
        aria-label="Matterport 3D Tour"
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 pointer-events-none">
          <div className="text-center text-white">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p>Loading 3D Tour...</p>
          </div>
        </div>
      )}
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/80">
          <div className="text-center text-white p-8">
            <h3 className="text-xl font-bold mb-2">Failed to Load Tour</h3>
            <p className="text-red-200 text-sm mb-4">{error.message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white text-red-900 rounded-lg hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
