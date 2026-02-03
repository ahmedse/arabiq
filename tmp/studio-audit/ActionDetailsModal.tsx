'use client';

import { useState, useRef, useCallback } from 'react';
import type { ActionType } from './types';
import { ACTION_TYPE_CONFIG, validateActionData, getDefaultActionData } from './types';
import type { Hotspot } from '@/lib/tour';

interface ActionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (actionType: ActionType, actionData: Record<string, unknown>) => void;
  actionType: ActionType;
  actionData: Record<string, unknown>;
  hotspots?: Hotspot[]; // For navigate action target selection
  currentHotspotId?: string; // To exclude from navigation targets
}

// Action types with their config
const ACTION_TYPES: { value: ActionType; label: string; icon: string; description: string }[] = [
  { value: '', label: 'None', icon: '○', description: 'No action triggered' },
  { value: 'open_url', label: 'Open URL', icon: '🔗', description: 'Opens an external link' },
  { value: 'show_info', label: 'Show Info', icon: 'ℹ️', description: 'Display information panel' },
  { value: 'show_product', label: 'Show Product', icon: '🛒', description: 'Product catalog view' },
  { value: 'open_booking', label: 'Open Booking', icon: '📅', description: 'Booking/reservation form' },
  { value: 'play_audio', label: 'Play Audio', icon: '🎵', description: 'Audio guide narration' },
  { value: 'open_chatbot', label: 'Open Chatbot', icon: '🤖', description: 'AI assistant chat' },
  { value: 'navigate', label: 'Navigate', icon: '🧭', description: 'Navigate to location' },
];

export function ActionDetailsModal({
  isOpen,
  onClose,
  onSave,
  actionType: initialActionType,
  actionData: initialActionData,
  hotspots = [],
  currentHotspotId,
}: ActionDetailsModalProps) {
  const [actionType, setActionType] = useState<ActionType>(initialActionType);
  const [actionData, setActionData] = useState<Record<string, unknown>>(initialActionData);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Handle action type change
  const handleActionTypeChange = (newType: ActionType) => {
    setActionType(newType);
    setActionData(getDefaultActionData(newType));
    setErrors([]);
  };

  // Update action data field
  const updateField = (field: string, value: unknown) => {
    setActionData(prev => ({ ...prev, [field]: value }));
    setErrors([]);
  };

  // File upload handler - stores file reference for upload when hotspot is saved
  const handleFileUpload = useCallback(async (
    file: File,
    fieldName: string,
    acceptedTypes: string[]
  ) => {
    // Validate file type
    const fileType = file.type.split('/')[0];
    if (!acceptedTypes.some(t => file.type.includes(t) || fileType === t)) {
      setErrors([`Invalid file type. Accepted: ${acceptedTypes.join(', ')}`]);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors(['File size must be less than 10MB']);
      return;
    }

    setUploading(fieldName);
    
    try {
      // Create preview URL for display
      const previewUrl = URL.createObjectURL(file);
      
      // Store both the file reference and preview URL
      // The file will be uploaded when the hotspot is saved
      setActionData(prev => ({
        ...prev,
        [fieldName]: previewUrl,
        [`${fieldName}_file`]: file,  // Store file reference for FormData upload
      }));
      setErrors([]);
      
      console.log(`[ActionModal] File selected: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
    } catch (err) {
      console.error('File selection failed:', err);
      setErrors(['Failed to process file']);
    } finally {
      setUploading(null);
    }
  }, []);

  // Handle save
  const handleSave = () => {
    const validationErrors = validateActionData(actionType, actionData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave(actionType, actionData);
  };

  if (!isOpen) return null;

  const config = ACTION_TYPE_CONFIG[actionType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config?.icon || '⚙️'}</span>
            <div>
              <h2 className="text-lg font-semibold text-white">Action Settings</h2>
              <p className="text-xs text-gray-400">Configure what happens when this hotspot is triggered</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Action Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Action Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ACTION_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => handleActionTypeChange(type.value)}
                  className={`
                    p-3 rounded-xl text-left transition-all
                    ${actionType === type.value
                      ? 'bg-indigo-600/30 border-2 border-indigo-500 ring-1 ring-indigo-400'
                      : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                    }
                  `}
                >
                  <span className="text-xl mb-1 block">{type.icon}</span>
                  <span className="text-sm font-medium text-white block">{type.label}</span>
                  <span className="text-[10px] text-gray-400 line-clamp-1">{type.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action-specific fields */}
          {actionType && (
            <div className="border border-gray-700 rounded-xl p-4 bg-gray-800/30">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700">
                <span className="text-lg">{config?.icon}</span>
                <span className="text-sm font-semibold text-white">{config?.label} Configuration</span>
              </div>

              {/* Open URL */}
              {actionType === 'open_url' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      URL <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="url"
                      value={(actionData.url as string) || ''}
                      onChange={(e) => updateField('url', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="https://example.com"
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(actionData.openInNewTab as boolean) ?? true}
                      onChange={(e) => updateField('openInNewTab', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-300">Open in new tab</span>
                  </label>
                </div>
              )}

              {/* Show Info */}
              {actionType === 'show_info' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Info Title</label>
                    <input
                      type="text"
                      value={(actionData.title as string) || ''}
                      onChange={(e) => updateField('title', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="Information title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Description</label>
                    <textarea
                      value={(actionData.description as string) || ''}
                      onChange={(e) => updateField('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                      placeholder="Detailed information to display..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Image</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={(actionData.imageUrl as string) || ''}
                        onChange={(e) => updateField('imageUrl', e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="https://... or upload"
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'imageUrl', ['image']);
                        }}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading === 'imageUrl'}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {uploading === 'imageUrl' ? '...' : '📤'}
                      </button>
                    </div>
                    {typeof actionData.imageUrl === 'string' && actionData.imageUrl && (
                      <div className="mt-2 relative">
                        <img
                          src={actionData.imageUrl}
                          alt="Preview"
                          className="h-20 rounded-lg object-cover"
                        />
                        <button
                          onClick={() => updateField('imageUrl', '')}
                          className="absolute top-1 right-1 p-1 bg-red-600 rounded-full text-white text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Show Product */}
              {actionType === 'show_product' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      SKU / Product ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={(actionData.sku as string) || ''}
                      onChange={(e) => updateField('sku', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="SKU-12345"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">CTA Label</label>
                    <input
                      type="text"
                      value={(actionData.ctaLabel as string) || ''}
                      onChange={(e) => updateField('ctaLabel', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="View Product"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={(actionData.price as number) || ''}
                        onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="99.99"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Currency</label>
                      <select
                        value={(actionData.currency as string) || 'SAR'}
                        onChange={(e) => updateField('currency', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="SAR">SAR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="AED">AED</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Product Image</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={(actionData.productImageUrl as string) || ''}
                        onChange={(e) => updateField('productImageUrl', e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="https://..."
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        📤
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Open Booking */}
              {actionType === 'open_booking' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      Booking Endpoint <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="url"
                      value={(actionData.endpoint as string) || ''}
                      onChange={(e) => updateField('endpoint', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="https://booking.example.com/api"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty to use built-in booking system</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Table / Resource ID</label>
                    <input
                      type="text"
                      value={(actionData.tableId as string) || ''}
                      onChange={(e) => updateField('tableId', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="table-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Service Name</label>
                    <input
                      type="text"
                      value={(actionData.serviceName as string) || ''}
                      onChange={(e) => updateField('serviceName', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="Dinner Reservation"
                    />
                  </div>
                </div>
              )}

              {/* Play Audio */}
              {actionType === 'play_audio' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      Audio File <span className="text-red-400">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={(actionData.audioUrl as string) || ''}
                        onChange={(e) => updateField('audioUrl', e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="https://cdn.example.com/audio.mp3"
                      />
                      <input
                        ref={audioInputRef}
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'audioUrl', ['audio']);
                        }}
                      />
                      <button
                        onClick={() => audioInputRef.current?.click()}
                        disabled={uploading === 'audioUrl'}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {uploading === 'audioUrl' ? '...' : '🎵'}
                      </button>
                    </div>
                    {typeof actionData.audioUrl === 'string' && actionData.audioUrl && (
                      <div className="mt-2">
                        <audio controls className="w-full h-10" src={actionData.audioUrl}>
                          Your browser does not support audio.
                        </audio>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Audio Title</label>
                    <input
                      type="text"
                      value={(actionData.audioTitle as string) || ''}
                      onChange={(e) => updateField('audioTitle', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="Welcome to our store"
                    />
                  </div>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(actionData.autoplay as boolean) ?? false}
                        onChange={(e) => updateField('autoplay', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-300">Autoplay on trigger</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(actionData.loop as boolean) ?? false}
                        onChange={(e) => updateField('loop', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-300">Loop</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Open Chatbot */}
              {actionType === 'open_chatbot' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      Bot ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={(actionData.botId as string) || ''}
                      onChange={(e) => updateField('botId', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="bot-assistant-1 (or 'demo' for demo mode)"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use 'demo' for built-in demo assistant</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Persona</label>
                    <select
                      value={(actionData.persona as string) || 'assistant'}
                      onChange={(e) => updateField('persona', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="assistant">General Assistant</option>
                      <option value="sales">Sales Representative</option>
                      <option value="support">Customer Support</option>
                      <option value="guide">Tour Guide</option>
                      <option value="concierge">Concierge</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Welcome Message</label>
                    <textarea
                      value={(actionData.welcomeMessage as string) || ''}
                      onChange={(e) => updateField('welcomeMessage', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                      placeholder="Hi! How can I help you today?"
                    />
                  </div>
                </div>
              )}

              {/* Navigate */}
              {actionType === 'navigate' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Target Hotspot</label>
                    <select
                      value={(actionData.targetHotspotId as string) || ''}
                      onChange={(e) => updateField('targetHotspotId', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">-- Select a hotspot --</option>
                      {hotspots
                        .filter(h => h.id !== currentHotspotId)
                        .map(h => (
                          <option key={h.id} value={h.id}>
                            {h.title || `Hotspot ${h.id.slice(0, 8)}`}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="text-center text-xs text-gray-500 py-2">— or —</div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Sweep ID (Matterport)</label>
                    <input
                      type="text"
                      value={(actionData.targetSweepId as string) || ''}
                      onChange={(e) => updateField('targetSweepId', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="sweep-uuid-here"
                    />
                  </div>
                </div>
              )}

              {/* Validation errors */}
              {errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
                  {errors.map((err, i) => (
                    <div key={i} className="text-sm text-red-300 flex items-center gap-2">
                      <span>⚠️</span> {err}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            {actionType && (
              <button
                onClick={() => handleActionTypeChange('')}
                className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors"
              >
                Remove Action
              </button>
            )}
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            >
              Save Action
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
