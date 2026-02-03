'use client';

/**
 * Position Picker Tool
 * Allows admins to click in 3D space and get exact coordinates
 */

import { useState, useEffect, useCallback } from 'react';
import { useMatterport } from './MatterportProvider';
import { Crosshair, Copy, Check, X, Save } from 'lucide-react';
import type { Vector3 } from '@/lib/matterport/types';

interface PositionPickerProps {
  isActive: boolean;
  onClose: () => void;
  onPositionSave: (position: Vector3) => Promise<void>;
  productName?: string;
}

export function PositionPicker({ 
  isActive, 
  onClose, 
  onPositionSave,
  productName 
}: PositionPickerProps) {
  const { sdk, isReady } = useMatterport();
  const [pickedPosition, setPickedPosition] = useState<Vector3 | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Listen for sweep changes to capture position
  useEffect(() => {
    if (!sdk || !isReady || !isActive) return;
    
    const handleCameraMove = async () => {
      if (!isActive) return;
      
      try {
        const pose = await sdk.Camera.getPose();
        // Capture position with precision
        setPickedPosition({
          x: Math.round(pose.position.x * 100) / 100,
          y: Math.round(pose.position.y * 100) / 100,
          z: Math.round(pose.position.z * 100) / 100,
        });
      } catch (error) {
        console.error('[PositionPicker] Error getting pose:', error);
      }
    };
    
    // Subscribe to sweep.enter as a proxy for movement
    sdk.on('sweep.enter', handleCameraMove as (event: unknown) => void);
    
    // Get initial position
    handleCameraMove();
    
    return () => {
      sdk.off('sweep.enter', handleCameraMove as (event: unknown) => void);
    };
  }, [sdk, isReady, isActive]);
  
  // Copy position to clipboard
  const handleCopy = useCallback(() => {
    if (!pickedPosition) return;
    
    const text = JSON.stringify(pickedPosition, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [pickedPosition]);
  
  // Save position
  const handleSave = useCallback(async () => {
    if (!pickedPosition) return;
    
    setSaving(true);
    try {
      await onPositionSave(pickedPosition);
      setPickedPosition(null);
      onClose();
    } catch (error) {
      console.error('[PositionPicker] Error saving position:', error);
    } finally {
      setSaving(false);
    }
  }, [pickedPosition, onPositionSave, onClose]);
  
  if (!isActive) return null;
  
  return (
    <div className="absolute top-20 left-4 bg-white rounded-lg shadow-xl p-4 z-50 w-80">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-primary-600" />
          <h3 className="font-bold text-gray-900">Position Picker</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Instructions */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
        <p className="font-medium mb-1">How to use:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Navigate to the product location</li>
          <li>Position captured automatically</li>
          <li>Click &quot;Save Position&quot; to save</li>
        </ol>
      </div>
      
      {/* Product name */}
      {productName && (
        <div className="mb-4">
          <label className="text-xs text-gray-500 uppercase">Saving for:</label>
          <p className="font-medium text-gray-900">{productName}</p>
        </div>
      )}
      
      {/* Position display */}
      {pickedPosition ? (
        <div className="mb-4 p-3 bg-gray-100 rounded-lg font-mono text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500">Position:</span>
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-gray-200 rounded"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-red-600">X:</span>
              <span>{pickedPosition.x.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600">Y:</span>
              <span>{pickedPosition.y.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600">Z:</span>
              <span>{pickedPosition.z.toFixed(3)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-gray-100 rounded-lg text-center text-gray-500">
          Navigate to a location to capture position
        </div>
      )}
      
      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!pickedPosition || saving}
          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Position
            </>
          )}
        </button>
      </div>
    </div>
  );
}
