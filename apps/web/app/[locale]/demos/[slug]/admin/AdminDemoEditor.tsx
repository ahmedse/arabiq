'use client';

/**
 * Admin Demo Editor
 * Manual position entry for setting hotspot locations
 * Uses iframe mode for reliability, with manual X/Y/Z input
 */

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, AlertCircle, Save, X, Copy, Terminal } from 'lucide-react';
import { 
  MatterportProvider, 
  MatterportViewer, 
} from '@/components/matterport';
import { updateProductPosition } from '@/lib/api/products';
import type { DemoConfig, TourItem, Vector3 } from '@/lib/matterport/types';

// Console script to get position from Matterport
const GET_POSITION_SCRIPT = `(async()=>{if(window.MP_SDK){const s=await window.MP_SDK.connect(window);const p=await s.Camera.getPose();console.log("Position:",JSON.stringify({x:Math.round(p.position.x*100)/100,y:Math.round(p.position.y*100)/100,z:Math.round(p.position.z*100)/100}))}else console.log("Navigate inside the tour first")})()`;

interface AdminDemoEditorProps {
  demo: DemoConfig;
  items: TourItem[];
  locale: string;
}

export function AdminDemoEditor({ demo, items, locale }: AdminDemoEditorProps) {
  return (
    <MatterportProvider initialDemo={demo}>
      <AdminEditorContent demo={demo} items={items} locale={locale} />
    </MatterportProvider>
  );
}

// Manual position form component
function PositionForm({ 
  item, 
  onSave, 
  onCancel 
}: { 
  item: TourItem; 
  onSave: (position: Vector3) => Promise<void>;
  onCancel: () => void;
}) {
  const [x, setX] = useState(item.hotspotPosition?.x?.toString() || '0');
  const [y, setY] = useState(item.hotspotPosition?.y?.toString() || '0');
  const [z, setZ] = useState(item.hotspotPosition?.z?.toString() || '0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        x: parseFloat(x) || 0,
        y: parseFloat(y) || 0,
        z: parseFloat(z) || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };
  
  // Parse JSON position from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const pos = JSON.parse(text);
      if (pos.x !== undefined) setX(String(pos.x));
      if (pos.y !== undefined) setY(String(pos.y));
      if (pos.z !== undefined) setZ(String(pos.z));
    } catch {
      // Ignore parse errors
    }
  };
  
  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Set Position</span>
        <div className="flex gap-1">
          <button 
            onClick={handlePaste} 
            className="p-1 hover:bg-gray-200 rounded text-gray-500"
            title="Paste from clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={onCancel} className="p-1 hover:bg-gray-200 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <label className="text-xs text-gray-500">X</label>
          <input
            type="number"
            step="0.01"
            value={x}
            onChange={(e) => setX(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Y</label>
          <input
            type="number"
            step="0.01"
            value={y}
            onChange={(e) => setY(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Z</label>
          <input
            type="number"
            step="0.01"
            value={z}
            onChange={(e) => setZ(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded"
          />
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-600 mb-2">{error}</p>
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : 'Save Position'}
      </button>
    </div>
  );
}

function AdminEditorContent({ demo, items }: AdminDemoEditorProps) {
  const [selectedProduct, setSelectedProduct] = useState<TourItem | null>(null);
  const [savedProducts, setSavedProducts] = useState<Set<number>>(new Set());
  const [localItems, setLocalItems] = useState<TourItem[]>(items);
  const [scriptCopied, setScriptCopied] = useState(false);
  
  // Handle position save
  const handlePositionSave = useCallback(async (position: Vector3) => {
    if (!selectedProduct) return;
    
    await updateProductPosition(selectedProduct.id, position);
    setSavedProducts(prev => new Set([...prev, selectedProduct.id]));
    
    // Update local state
    setLocalItems(prev => prev.map(item => 
      item.id === selectedProduct.id 
        ? { ...item, hotspotPosition: position }
        : item
    ));
    setSelectedProduct(null);
  }, [selectedProduct]);
  
  // Copy position script to clipboard
  const copyPositionScript = async () => {
    await navigator.clipboard.writeText(GET_POSITION_SCRIPT);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 2000);
  };
  
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
          <p className="text-sm text-gray-600">{demo.title}</p>
        </div>
        
        {/* Instructions */}
        <div className="p-4 bg-blue-50 border-b">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">📍 How to Set Positions:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700 text-xs">
              <li>Navigate in the 3D tour to product location</li>
              <li>Open browser console (F12 → Console)</li>
              <li>The position will be logged when you move</li>
              <li>Copy X, Y, Z and enter below</li>
            </ol>
            <p className="mt-2 text-xs text-blue-600">
              Tip: Positions are typically X: -10 to 10, Y: 0 to 3, Z: -10 to 10
            </p>
          </div>
        </div>
        
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
              {localItems.map(item => {
                const hasPosition = item.hotspotPosition && 
                  (item.hotspotPosition.x !== 0 || item.hotspotPosition.y !== 0 || item.hotspotPosition.z !== 0);
                const isSaved = savedProducts.has(item.id);
                const isSelected = selectedProduct?.id === item.id;
                
                return (
                  <div
                    key={item.id}
                    className={`
                      p-3 rounded-lg border transition-colors
                      ${isSelected 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setSelectedProduct(isSelected ? null : item)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.category}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        {isSaved ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : hasPosition ? (
                          <div className="w-3 h-3 rounded-full bg-green-500" title="Has position" />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-gray-300" title="No position" />
                        )}
                      </div>
                    </div>
                    
                    {/* Current position info */}
                    {hasPosition && item.hotspotPosition && !isSelected && (
                      <div className="mt-2 text-xs font-mono text-gray-500">
                        X: {item.hotspotPosition.x.toFixed(2)}, 
                        Y: {item.hotspotPosition.y.toFixed(2)}, 
                        Z: {item.hotspotPosition.z.toFixed(2)}
                      </div>
                    )}
                    
                    {/* Position edit form */}
                    {isSelected && (
                      <PositionForm 
                        item={item}
                        onSave={handlePositionSave}
                        onCancel={() => setSelectedProduct(null)}
                      />
                    )}
                  </div>
                );
              })}
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
      
      {/* 3D Viewer - iframe mode for reliability */}
      <div className="flex-1 relative">
        <MatterportViewer className="w-full h-full" useIframeMode={true} />
      </div>
    </div>
  );
}
