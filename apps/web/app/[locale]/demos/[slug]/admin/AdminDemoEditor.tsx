'use client';

/**
 * Admin Demo Editor
 * SDK-based position editor with click-to-place functionality
 */

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Check, 
  AlertCircle, 
  Save, 
  MousePointer2, 
  Crosshair,
  Eye,
  Loader2 
} from 'lucide-react';
import { useMatterportSDK, type SDKStatus } from '@/lib/matterport/useMatterportSDK';
import { updateProductPosition } from '@/lib/api/products';
import type { DemoConfig, TourItem, Vector3 } from '@/lib/matterport/types';

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

// Click position indicator
function ClickPositionIndicator({ 
  position, 
  selectedProduct,
  onUse,
  saving 
}: { 
  position: Vector3 | null; 
  selectedProduct: TourItem | null;
  onUse: () => void;
  saving: boolean;
}) {
  if (!position) return null;

  const canUse = selectedProduct !== null && !saving;

  return (
    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Crosshair className="w-4 h-4 text-green-600" />
        <span className="text-sm font-medium text-green-800">Clicked Position</span>
      </div>
      <div className="font-mono text-xs text-green-700 mb-3">
        X: {position.x.toFixed(3)}, Y: {position.y.toFixed(3)}, Z: {position.z.toFixed(3)}
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

// Product list item
function ProductItem({ 
  item, 
  isSelected,
  isSaved,
  onSelect,
  onSave,
  onViewPosition,
  clickedPosition,
  saving,
}: {
  item: TourItem;
  isSelected: boolean;
  isSaved: boolean;
  onSelect: () => void;
  onSave: (position: Vector3) => Promise<void>;
  onViewPosition: () => void;
  clickedPosition: Vector3 | null;
  saving: boolean;
}) {
  const [manualX, setManualX] = useState(item.hotspotPosition?.x?.toString() || '0');
  const [manualY, setManualY] = useState(item.hotspotPosition?.y?.toString() || '0');
  const [manualZ, setManualZ] = useState(item.hotspotPosition?.z?.toString() || '0');
  const [error, setError] = useState<string | null>(null);

  const hasPosition = item.hotspotPosition && 
    (item.hotspotPosition.x !== 0 || item.hotspotPosition.y !== 0 || item.hotspotPosition.z !== 0);

  const handleSaveManual = async () => {
    setError(null);
    try {
      await onSave({
        x: parseFloat(manualX) || 0,
        y: parseFloat(manualY) || 0,
        z: parseFloat(manualZ) || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleUseClicked = async () => {
    if (!clickedPosition) return;
    setError(null);
    try {
      await onSave(clickedPosition);
      setManualX(clickedPosition.x.toFixed(3));
      setManualY(clickedPosition.y.toFixed(3));
      setManualZ(clickedPosition.z.toFixed(3));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
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
      {hasPosition && item.hotspotPosition && !isSelected && (
        <div className="mt-2 text-xs font-mono text-gray-500">
          X: {item.hotspotPosition.x.toFixed(2)}, 
          Y: {item.hotspotPosition.y.toFixed(2)}, 
          Z: {item.hotspotPosition.z.toFixed(2)}
        </div>
      )}

      {/* Edit form (when selected) */}
      {isSelected && (
        <div className="mt-3 space-y-3">
          {/* Use clicked position */}
          {clickedPosition && (
            <button
              onClick={handleUseClicked}
              disabled={saving}
              className="w-full py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Crosshair className="w-4 h-4" />
              Use Clicked Position
              <span className="font-mono text-xs opacity-75">
                ({clickedPosition.x.toFixed(1)}, {clickedPosition.y.toFixed(1)}, {clickedPosition.z.toFixed(1)})
              </span>
            </button>
          )}

          {/* Manual input */}
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
        </div>
      )}
    </div>
  );
}

export function AdminDemoEditor({ demo, items, locale }: AdminDemoEditorProps) {
  const [selectedProduct, setSelectedProduct] = useState<TourItem | null>(null);
  const [savedProducts, setSavedProducts] = useState<Set<number>>(new Set());
  const [localItems, setLocalItems] = useState<TourItem[]>(items);
  const [clickedPosition, setClickedPosition] = useState<Vector3 | null>(null);
  const [saving, setSaving] = useState(false);

  const tourUrl = buildTourUrl(demo.matterportModelId);

  // Stable click handler
  const handleTourClick = useCallback((position: Vector3, normal: Vector3) => {
    console.log('[AdminEditor] Click:', position, 'Normal:', normal);
    setClickedPosition({
      x: Math.round(position.x * 1000) / 1000,
      y: Math.round(position.y * 1000) / 1000,
      z: Math.round(position.z * 1000) / 1000,
    });
  }, []);

  // SDK connection with click handler
  const {
    iframeRef,
    controller,
    status,
    currentPose,
    lastError,
    moveTo,
  } = useMatterportSDK({
    tourUrl,
    onClick: handleTourClick,
  });

  // Add markers for products with positions (only on status change)
  useEffect(() => {
    if (status !== 'ready') return;

    // Add markers for items with positions
    const addMarkers = async () => {
      for (const item of localItems) {
        if (item.hotspotPosition && 
            (item.hotspotPosition.x !== 0 || item.hotspotPosition.y !== 0 || item.hotspotPosition.z !== 0)) {
          await controller.addMarker(`product-${item.id}`, item.hotspotPosition, {
            label: item.name,
            color: { r: 0.2, g: 0.6, b: 1.0 },
          });
        }
      }
    };
    addMarkers();

    return () => {
      controller.clearMarkers();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Save position handler
  const handlePositionSave = useCallback(async (productId: number, position: Vector3) => {
    setSaving(true);
    try {
      await updateProductPosition(productId, position);
      setSavedProducts(prev => new Set([...prev, productId]));
      
      // Update local state
      setLocalItems(prev => {
        const item = prev.find(i => i.id === productId);
        if (item && status === 'ready') {
          // Add marker in the tour
          controller.addMarker(`product-${productId}`, position, {
            label: item.name,
            color: { r: 0.2, g: 0.8, b: 0.4 },
          });
        }
        return prev.map(i => 
          i.id === productId 
            ? { ...i, hotspotPosition: position }
            : i
        );
      });

      setSelectedProduct(null);
      setClickedPosition(null);
    } finally {
      setSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Navigate to product position
  const handleViewPosition = useCallback(async (item: TourItem) => {
    if (!item.hotspotPosition) return;
    await moveTo(item.hotspotPosition);
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
              <MousePointer2 className="w-4 h-4" />
              Click-to-Place Mode
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-blue-700">
              <li>Click on a <strong>product</strong> in the list below</li>
              <li>Navigate to where it should appear in the tour</li>
              <li>Click on the surface to capture position</li>
              <li>Click the green button to assign</li>
            </ol>
          </div>
        </div>

        {/* Clicked Position */}
        {clickedPosition && (
          <div className="p-4 border-b">
            <ClickPositionIndicator 
              position={clickedPosition}
              selectedProduct={selectedProduct}
              saving={saving}
              onUse={() => {
                if (selectedProduct && clickedPosition) {
                  handlePositionSave(selectedProduct.id, clickedPosition);
                }
              }}
            />
          </div>
        )}

        {/* Current Camera Pose (debug) */}
        {currentPose && (
          <div className="px-4 py-2 bg-gray-50 border-b text-xs font-mono text-gray-500">
            Camera: {currentPose.position.x.toFixed(1)}, {currentPose.position.y.toFixed(1)}, {currentPose.position.z.toFixed(1)}
            {currentPose.sweep && <span className="ml-2">Sweep: {currentPose.sweep.slice(0, 8)}...</span>}
          </div>
        )}

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="font-medium text-gray-700 mb-3">Products ({localItems.length})</h2>
          
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
                  onSave={(pos) => handlePositionSave(item.id, pos)}
                  onViewPosition={() => handleViewPosition(item)}
                  clickedPosition={clickedPosition}
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
              <span>Has position</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <span>No position</span>
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
