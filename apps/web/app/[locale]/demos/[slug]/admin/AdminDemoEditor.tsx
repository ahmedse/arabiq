'use client';

/**
 * Admin Demo Editor - Enhanced Version
 * SDK-based position editor with click-to-place functionality
 * 
 * Features:
 * - Stores full position data (anchorPosition + stemVector + nearestSweepId)
 * - Uses new Tag API instead of deprecated Mattertag
 * - Fixed navigation (flyTo works reliably via nearest sweep)
 * - Reset position to zero functionality
 * - Better visual feedback
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Check, 
  AlertCircle, 
  Save, 
  MousePointer2, 
  Crosshair,
  Eye,
  Loader2,
  RotateCcw,
  Navigation,
  X,
  ImageIcon,
  ChevronDown,
  ChevronUp,
  Lock,
  MousePointerClick,
} from 'lucide-react';
import { useMatterportSDK, type SDKStatus } from '@/lib/matterport/useMatterportSDK';
import { updateProductPosition } from '@/lib/api/products';
import type { DemoConfig, TourItem, Vector3, PointerIntersection, HotspotPositionData } from '@/lib/matterport/types';

// Calculate stem vector from surface normal for natural tag appearance
function calculateStemVector(normal: Vector3, height: number = 0.3): Vector3 {
  const length = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
  if (length === 0) {
    return { x: 0, y: height, z: 0 };
  }
  return {
    x: (normal.x / length) * height,
    y: Math.max(0.1, (normal.y / length) * height + 0.1),
    z: (normal.z / length) * height,
  };
}

interface AdminDemoEditorProps {
  demo: DemoConfig;
  items: TourItem[];
  locale: string;
}

// Build Matterport embed URL with SDK parameters
function buildTourUrl(modelId: string): string {
  const params = new URLSearchParams({
    m: modelId,
    play: '1',
    qs: '1',
    log: '0',
    help: '0',
    brand: '0',
    dh: '0', // Disable default hotspots
  });
  return `https://my.matterport.com/show?${params.toString()}`;
}

// Status indicator component
function SDKStatusBadge({ status, error }: { status: SDKStatus; error: string | null }) {
  const config = {
    idle: { color: 'bg-gray-400', text: 'Idle' },
    connecting: { color: 'bg-yellow-500 animate-pulse', text: 'Connecting...' },
    retrying: { color: 'bg-orange-500 animate-pulse', text: 'Retrying...' },
    ready: { color: 'bg-green-500', text: 'Connected' },
    failed: { color: 'bg-red-500', text: 'Failed' },
  }[status];

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
      <span className="text-xs text-gray-600">{config.text}</span>
      {error && status === 'failed' && (
        <span className="text-xs text-red-500 truncate max-w-32" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}

// Click position indicator - enhanced with full intersection data
// Shows locked position with visual confirmation
function ClickPositionIndicator({ 
  intersection, 
  selectedProduct,
  nearestSweepId,
  onUse,
  onClear,
  saving 
}: { 
  intersection: PointerIntersection | null; 
  selectedProduct: TourItem | null;
  nearestSweepId: string | null;
  onUse: () => void;
  onClear: () => void;
  saving: boolean;
}) {
  if (!intersection) return null;

  const { position, normal, floorIndex } = intersection;

  return (
    <div className="p-3 bg-green-50 border-2 border-green-400 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">Position Locked</span>
        </div>
        <button onClick={onClear} className="p-1 hover:bg-green-200 rounded" title="Clear">
          <X className="w-3 h-3 text-green-600" />
        </button>
      </div>
      
      {/* Enhanced position data display */}
      <div className="space-y-1 mb-3 text-xs font-mono">
        <div className="text-green-700">
          <span className="text-green-500">Pos:</span> {position.x.toFixed(3)}, {position.y.toFixed(3)}, {position.z.toFixed(3)}
        </div>
        <div className="text-blue-700">
          <span className="text-blue-500">Normal:</span> {normal.x.toFixed(2)}, {normal.y.toFixed(2)}, {normal.z.toFixed(2)}
        </div>
        {nearestSweepId && (
          <div className="text-orange-700 flex items-center gap-1">
            <Navigation className="w-3 h-3" />
            <span className="truncate">{nearestSweepId.slice(0, 16)}...</span>
          </div>
        )}
      </div>
      
      {selectedProduct ? (
        <button
          onClick={onUse}
          disabled={saving}
          className="w-full py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Assign to "{selectedProduct.name}"
        </button>
      ) : (
        <div className="text-center py-2 bg-yellow-100 text-yellow-800 text-xs rounded border border-yellow-200">
          👆 Select a product below to assign this position
        </div>
      )}
    </div>
  );
}

// Product list item - enhanced with reset and better UI
function ProductItem({ 
  item, 
  isSelected,
  isSaved,
  onSelect,
  onSave,
  onReset,
  onViewPosition,
  capturedPosition,
  nearestSweepId,
  saving,
}: {
  item: TourItem;
  isSelected: boolean;
  isSaved: boolean;
  onSelect: () => void;
  onSave: (data: HotspotPositionData) => Promise<void>;
  onReset: () => Promise<void>;
  onViewPosition: () => void;
  capturedPosition: PointerIntersection | null;
  nearestSweepId: string | null;
  saving: boolean;
}) {
  const currentPos = item.hotspotData?.anchorPosition || item.hotspotPosition;
  const [manualX, setManualX] = useState(currentPos?.x?.toString() || '0');
  const [manualY, setManualY] = useState(currentPos?.y?.toString() || '0');
  const [manualZ, setManualZ] = useState(currentPos?.z?.toString() || '0');
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);

  const hasPosition = useMemo(() => {
    const pos = item.hotspotData?.anchorPosition || item.hotspotPosition;
    return pos && (pos.x !== 0 || pos.y !== 0 || pos.z !== 0);
  }, [item.hotspotData, item.hotspotPosition]);

  const handleSaveManual = async () => {
    setError(null);
    try {
      await onSave({
        anchorPosition: {
          x: parseFloat(manualX) || 0,
          y: parseFloat(manualY) || 0,
          z: parseFloat(manualZ) || 0,
        },
        stemVector: { x: 0, y: 0.3, z: 0 },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleUseClicked = async () => {
    if (!capturedPosition) return;
    setError(null);
    try {
      const stemVector = calculateStemVector(capturedPosition.normal);
      await onSave({
        anchorPosition: capturedPosition.position,
        stemVector,
        floorIndex: capturedPosition.floorIndex,
        nearestSweepId: nearestSweepId || undefined,
      });
      setManualX(capturedPosition.position.x.toFixed(3));
      setManualY(capturedPosition.position.y.toFixed(3));
      setManualZ(capturedPosition.position.z.toFixed(3));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleReset = async () => {
    setError(null);
    try {
      await onReset();
      setManualX('0');
      setManualY('0');
      setManualZ('0');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset');
    }
  };

  return (
    <div
      className={`
        p-3 rounded-lg border transition-colors
        ${isSelected 
          ? 'border-primary-500 bg-primary-50' 
          : 'border-gray-200 hover:bg-gray-50'
        }
      `}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={onSelect}
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 truncate">{item.name}</p>
          <p className="text-sm text-gray-500">{item.category}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {hasPosition && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewPosition(); }}
              className="p-1 hover:bg-gray-200 rounded"
              title="Go to position"
            >
              <Eye className="w-4 h-4 text-gray-500" />
            </button>
          )}
          {isSaved ? (
            <Check className="w-5 h-5 text-green-500" />
          ) : hasPosition ? (
            <div className="w-3 h-3 rounded-full bg-green-500" title="Has position" />
          ) : (
            <div className="w-3 h-3 rounded-full bg-gray-300" title="No position" />
          )}
        </div>
      </div>

      {/* Current position */}
      {hasPosition && currentPos && !isSelected && (
        <div className="mt-2 text-xs font-mono text-gray-500">
          X: {currentPos.x.toFixed(2)}, 
          Y: {currentPos.y.toFixed(2)}, 
          Z: {currentPos.z.toFixed(2)}
        </div>
      )}

      {/* Edit form (when selected) */}
      {isSelected && (
        <div className="mt-3 space-y-3">
          {/* Use captured position */}
          {capturedPosition && (
            <button
              onClick={handleUseClicked}
              disabled={saving}
              className="w-full py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Use Captured Position
              <span className="font-mono text-xs opacity-75">
                ({capturedPosition.position.x.toFixed(1)}, {capturedPosition.position.y.toFixed(1)}, {capturedPosition.position.z.toFixed(1)})
              </span>
            </button>
          )}

          {/* Reset to zero button */}
          {hasPosition && (
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
              <span className="text-xs text-gray-600">
                Current: <span className="font-mono">{currentPos?.x.toFixed(2)}, {currentPos?.y.toFixed(2)}, {currentPos?.z.toFixed(2)}</span>
              </span>
              <button
                onClick={handleReset}
                disabled={saving}
                className="px-2 py-1 text-xs text-red-600 hover:bg-red-100 rounded flex items-center gap-1"
                title="Reset to zero (remove position)"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
          )}

          {/* Manual input toggle */}
          <button
            onClick={() => setShowManual(!showManual)}
            className="w-full flex items-center justify-between p-2 text-sm text-gray-600 hover:bg-gray-50 rounded border"
          >
            <span>Manual Position Entry</span>
            {showManual ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Manual input */}
          {showManual && (
          <div className="p-3 bg-gray-50 rounded-lg border">
            <span className="text-xs font-medium text-gray-700 mb-2 block">Manual Position</span>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <label className="text-xs text-gray-500">X</label>
                <input
                  type="number"
                  step="0.01"
                  value={manualX}
                  onChange={(e) => setManualX(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Y</label>
                <input
                  type="number"
                  step="0.01"
                  value={manualY}
                  onChange={(e) => setManualY(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Z</label>
                <input
                  type="number"
                  step="0.01"
                  value={manualZ}
                  onChange={(e) => setManualZ(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
            </div>
            
            {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
            
            <button
              onClick={handleSaveManual}
              disabled={saving}
              className="w-full py-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Position'}
            </button>
          </div>
          )}
          
          {error && !showManual && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}

export function AdminDemoEditor({ demo, items, locale }: AdminDemoEditorProps) {
  const [selectedProduct, setSelectedProduct] = useState<TourItem | null>(null);
  const [savedProducts, setSavedProducts] = useState<Set<number>>(new Set());
  const [localItems, setLocalItems] = useState<TourItem[]>(items);
  
  // Last known position from SDK - updates continuously as mouse moves in tour
  const lastIntersectionRef = useRef<PointerIntersection | null>(null);
  
  // Live position display - updates on mouse move (for UI feedback)
  const [livePosition, setLivePosition] = useState<{ x: number; y: number; z: number } | null>(null);
  
  // Captured/locked position - set when user clicks CAPTURE button
  const [capturedPosition, setCapturedPosition] = useState<PointerIntersection | null>(null);
  // Camera rotation at time of capture - for accurate flyTo
  const [capturedRotation, setCapturedRotation] = useState<{ x: number; y: number } | null>(null);
  const [nearestSweepId, setNearestSweepId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const tourUrl = buildTourUrl(demo.matterportModelId);

  // Update last known position continuously
  const handlePointerUpdate = useCallback((intersection: PointerIntersection) => {
    const pos = {
      x: Math.round(intersection.position.x * 1000) / 1000,
      y: Math.round(intersection.position.y * 1000) / 1000,
      z: Math.round(intersection.position.z * 1000) / 1000,
    };
    
    lastIntersectionRef.current = {
      position: pos,
      normal: intersection.normal,
      floorIndex: intersection.floorIndex,
      floorId: intersection.floorId,
      object: intersection.object,
    };
    
    // Update live position for UI (throttled slightly by React batching)
    setLivePosition(pos);
  }, []);

  // SDK connection
  const {
    iframeRef,
    controller,
    status,
    currentPose,
    lastError,
    moveTo,
    findNearestSweep,
  } = useMatterportSDK({
    tourUrl,
    onClick: handlePointerUpdate,
  });

  // Capture position function - takes the last known intersection OR camera position
  // Also captures camera rotation for accurate fly-to direction
  const capturePosition = useCallback(() => {
    // Always capture current camera rotation
    if (currentPose?.rotation) {
      setCapturedRotation({ ...currentPose.rotation });
    }
    
    if (lastIntersectionRef.current) {
      setCapturedPosition({ ...lastIntersectionRef.current });
      console.log('[Admin] Position captured from pointer:', lastIntersectionRef.current.position, 'rotation:', currentPose?.rotation);
    } else if (currentPose) {
      // Fallback to camera position if no pointer intersection
      const fallbackPosition: PointerIntersection = {
        position: currentPose.position,
        normal: { x: 0, y: 1, z: 0 },
        object: 'model',
      };
      setCapturedPosition(fallbackPosition);
      console.log('[Admin] Position captured from camera:', currentPose.position, 'rotation:', currentPose.rotation);
    }
  }, [currentPose]);

  // Clear captured position
  const clearCapturedPosition = useCallback(() => {
    setCapturedPosition(null);
    setCapturedRotation(null);
    setNearestSweepId(null);
  }, []);

  // Global right-click handler - captures position from anywhere on the page
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Only capture if we have a position and SDK is ready
      if (lastIntersectionRef.current && status === 'ready') {
        e.preventDefault();
        capturePosition();
      }
    };

    // Global keyboard handler
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      if (e.code === 'Space' && lastIntersectionRef.current) {
        e.preventDefault();
        capturePosition();
      }
      if (e.code === 'Escape') {
        clearCapturedPosition();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [status, capturePosition, clearCapturedPosition]);

  // Find nearest sweep when position is captured
  useEffect(() => {
    if (capturedPosition && status === 'ready') {
      findNearestSweep(capturedPosition.position).then((result) => {
        if (result) {
          setNearestSweepId(result.sweepId);
        }
      });
    }
  }, [capturedPosition, status, findNearestSweep]);

  // Add tags for products with positions (using new Tag API)
  useEffect(() => {
    if (status !== 'ready') return;

    const addTags = async () => {
      for (const item of localItems) {
        const position = item.hotspotData?.anchorPosition || item.hotspotPosition;
        if (position && (position.x !== 0 || position.y !== 0 || position.z !== 0)) {
          const stemVector = item.hotspotData?.stemVector || { x: 0, y: 0.3, z: 0 };
          await controller.addTag(`product-${item.id}`, {
            label: item.name,
            description: item.description || '',
            anchorPosition: position,
            stemVector,
            color: { r: 0.2, g: 0.6, b: 1.0 },
          });
        }
      }
    };
    addTags();

    return () => {
      controller.clearTags();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Save position handler - saves full position data
  const handlePositionSave = useCallback(async (documentId: string, productId: number, data: HotspotPositionData) => {
    setSaving(true);
    try {
      await updateProductPosition(documentId, data.anchorPosition, data);
      setSavedProducts(prev => new Set([...prev, productId]));
      
      // Update local state and add tag
      setLocalItems(prev => {
        const item = prev.find(i => i.id === productId);
        if (item && status === 'ready') {
          controller.addTag(`product-${productId}`, {
            label: item.name,
            anchorPosition: data.anchorPosition,
            stemVector: data.stemVector,
            color: { r: 0.2, g: 0.8, b: 0.4 },
          });
        }
        return prev.map(i => 
          i.id === productId 
            ? { ...i, hotspotData: data, hotspotPosition: data.anchorPosition }
            : i
        );
      });

      setSelectedProduct(null);
      setCapturedPosition(null);
      setNearestSweepId(null);
    } finally {
      setSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Reset position handler
  const handlePositionReset = useCallback(async (documentId: string, productId: number) => {
    setSaving(true);
    try {
      const zeroPosition = { x: 0, y: 0, z: 0 };
      await updateProductPosition(documentId, zeroPosition);
      
      // Remove tag from tour
      await controller.removeTag(`product-${productId}`);
      
      // Update local state
      setLocalItems(prev => 
        prev.map(i => 
          i.id === productId 
            ? { ...i, hotspotData: undefined, hotspotPosition: zeroPosition }
            : i
        )
      );
      
      setSavedProducts(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    } finally {
      setSaving(false);
    }
  }, [controller]);

  // Navigate to product position with correct facing direction
  const handleViewPosition = useCallback(async (item: TourItem) => {
    const position = item.hotspotData?.anchorPosition || item.hotspotPosition;
    if (!position) return;
    const sweepId = item.hotspotData?.nearestSweepId;
    const rotation = item.hotspotData?.cameraRotation;
    await moveTo(position, rotation, sweepId);
  }, [moveTo]);

  return (
    <div className="relative w-full h-screen flex">
      {/* Sidebar */}
      <div className="w-96 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/demos/${demo.slug}`}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-lg">Admin Editor</h1>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">{demo.title}</p>
            <SDKStatusBadge status={status} error={lastError} />
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border-b">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2 flex items-center gap-2">
              <MousePointerClick className="w-4 h-4" />
              Click-to-Place Mode
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-blue-700">
              <li>Navigate to the spot in the 3D tour</li>
              <li>Click the <strong className="text-amber-600">📍 CAPTURE</strong> button</li>
              <li>Select a product and click <strong className="text-green-600">Assign</strong></li>
            </ol>
          </div>
        </div>

        {/* Captured Position */}
        {capturedPosition && (
          <div className="p-4 border-b">
            <ClickPositionIndicator 
              intersection={capturedPosition}
              selectedProduct={selectedProduct}
              nearestSweepId={nearestSweepId}
              saving={saving}
              onClear={clearCapturedPosition}
              onUse={() => {
                if (selectedProduct && capturedPosition) {
                  const stemVector = calculateStemVector(capturedPosition.normal);
                  handlePositionSave(selectedProduct.documentId, selectedProduct.id, {
                    anchorPosition: capturedPosition.position,
                    stemVector,
                    floorIndex: capturedPosition.floorIndex,
                    nearestSweepId: nearestSweepId || undefined,
                    cameraRotation: capturedRotation || undefined,
                  });
                }
              }}
            />
          </div>
        )}

        {/* Current Camera Pose (debug) */}
        {currentPose && (
          <div className="px-4 py-2 bg-gray-50 border-b text-xs font-mono text-gray-500">
            <div className="flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              Camera: {currentPose.position.x.toFixed(1)}, {currentPose.position.y.toFixed(1)}, {currentPose.position.z.toFixed(1)}
            </div>
            {currentPose.sweep && <div className="text-gray-400 mt-1">Sweep: {currentPose.sweep.slice(0, 12)}...</div>}
          </div>
        )}

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="font-medium text-gray-700 mb-3 flex items-center justify-between">
            <span>Products ({localItems.length})</span>
            <span className="text-xs text-gray-400">
              {localItems.filter(i => {
                const pos = i.hotspotData?.anchorPosition || i.hotspotPosition;
                return pos && (pos.x !== 0 || pos.y !== 0 || pos.z !== 0);
              }).length} placed
            </span>
          </h2>
          
          {localItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No products found</p>
              <p className="text-sm">Add products in Strapi first</p>
            </div>
          ) : (
            <div className="space-y-2">
              {localItems.map(item => (
                <ProductItem
                  key={item.id}
                  item={item}
                  isSelected={selectedProduct?.id === item.id}
                  isSaved={savedProducts.has(item.id)}
                  onSelect={() => setSelectedProduct(
                    selectedProduct?.id === item.id ? null : item
                  )}
                  onSave={(data) => handlePositionSave(item.documentId, item.id, data)}
                  onReset={() => handlePositionReset(item.documentId, item.id)}
                  onViewPosition={() => handleViewPosition(item)}
                  capturedPosition={capturedPosition}
                  nearestSweepId={nearestSweepId}
                  saving={saving}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Placed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <span>Not placed</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-500" />
              <span>Just saved</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Viewer with SDK */}
      <div className="flex-1 relative bg-gray-900">
        <iframe
          ref={iframeRef}
          src={tourUrl}
          allow="accelerometer; magnetometer; gyroscope; fullscreen; xr-spatial-tracking"
          allowFullScreen
          className="w-full h-full border-0"
        />
        
        {/* CAPTURE BUTTON - Large, visible, clickable */}
        {status === 'ready' && !capturedPosition && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
            {/* Live position indicator */}
            {livePosition ? (
              <div className="px-4 py-2 bg-gray-900/80 text-green-400 text-sm font-mono rounded-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Pointer: {livePosition.x.toFixed(2)}, {livePosition.y.toFixed(2)}, {livePosition.z.toFixed(2)}
              </div>
            ) : currentPose ? (
              <div className="px-4 py-2 bg-gray-900/80 text-amber-400 text-sm font-mono rounded-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                Camera: {currentPose.position.x.toFixed(2)}, {currentPose.position.y.toFixed(2)}, {currentPose.position.z.toFixed(2)}
              </div>
            ) : null}
            <button
              onClick={capturePosition}
              disabled={!livePosition && !currentPose}
              className={`px-8 py-4 font-bold text-lg rounded-full shadow-2xl flex items-center gap-3 transition-all border-4 ${
                livePosition || currentPose
                  ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white border-amber-300 hover:scale-105 active:scale-95 cursor-pointer'
                  : 'bg-gray-500 text-gray-300 border-gray-400 cursor-not-allowed'
              }`}
            >
              <Crosshair className="w-6 h-6" />
              📍 CAPTURE THIS POSITION
            </button>
          </div>
        )}
        
        {/* Captured indicator */}
        {status === 'ready' && capturedPosition && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
            <div className="px-6 py-4 bg-green-600 text-white font-bold rounded-full shadow-2xl flex items-center gap-3 border-4 border-green-300">
              <Lock className="w-6 h-6" />
              ✓ POSITION CAPTURED
              <span className="font-mono text-sm bg-green-700 px-2 py-1 rounded">
                ({capturedPosition.position.x.toFixed(2)}, {capturedPosition.position.y.toFixed(2)}, {capturedPosition.position.z.toFixed(2)})
              </span>
              <button
                onClick={clearCapturedPosition}
                className="ml-2 p-2 hover:bg-green-700 rounded-full bg-green-500"
                title="Clear and capture again"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        
        {/* Loading overlay */}
        {(status === 'connecting' || status === 'retrying') && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary-600" />
              <p className="text-gray-700">
                {status === 'connecting' ? 'Connecting to Matterport SDK...' : 'Retrying connection...'}
              </p>
            </div>
          </div>
        )}
        
        {/* Failed overlay */}
        {status === 'failed' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 text-center max-w-sm">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-gray-700 mb-2">SDK Connection Failed</p>
              <p className="text-sm text-gray-500 mb-4">{lastError}</p>
              <p className="text-xs text-gray-400">
                You can still navigate the tour and enter positions manually.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
