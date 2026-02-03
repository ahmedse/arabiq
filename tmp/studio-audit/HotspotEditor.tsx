// HotspotEditor.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import type { Hotspot } from "./types";
import { WORKFLOWS, WorkflowType } from "./WorkflowEngine";

interface HotspotEditorProps {
  hotspot: Hotspot;
  onSave: (updated: Partial<Hotspot>) => Promise<Hotspot | null | void> | Hotspot | null | void;
  onCancel: () => void;
}

/**
 * HotspotEditor
 * - Edits base fields (title, active, type).
 * - Delegates type-specific config to workflow editor.
 */
export function HotspotEditor({
  hotspot,
  onSave,
  onCancel,
}: HotspotEditorProps) {
  const initialType: WorkflowType = WORKFLOWS[hotspot.hotspot_type as WorkflowType]
    ? (hotspot.hotspot_type as WorkflowType)
    : "info";

  const [title, setTitle] = useState(hotspot.title || "");
  const [type, setType] = useState<WorkflowType>(initialType);
  const [isActive, setIsActive] = useState<boolean>(hotspot.is_active ?? true);
  const [contentData, setContentData] = useState<any>(
    hotspot.content_data ?? WORKFLOWS[initialType].getDefaultContent()
  );
  const [saving, setSaving] = useState(false);
  const previousTypeRef = useRef<WorkflowType>(initialType);

  useEffect(() => {
    const resolvedType: WorkflowType = WORKFLOWS[hotspot.hotspot_type as WorkflowType]
      ? (hotspot.hotspot_type as WorkflowType)
      : "info";

    setTitle(hotspot.title || "");
    setType(resolvedType);
    setIsActive(hotspot.is_active ?? true);
    setContentData(
      hotspot.content_data ?? WORKFLOWS[resolvedType].getDefaultContent()
    );
    previousTypeRef.current = resolvedType;
  }, [hotspot]);

  useEffect(() => {
    if (previousTypeRef.current === type) return;
    const wf = WORKFLOWS[type];
    setContentData(wf ? wf.getDefaultContent() : {});
    previousTypeRef.current = type;
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        title,
        hotspot_type: type,
        is_active: isActive,
        content_type: "json",
        content_data: contentData,
      });
    } catch (err) {
      console.error("[HotspotEditor] Failed to save hotspot", err);
    } finally {
      setSaving(false);
    }
  };

  const workflowDef = WORKFLOWS[type];

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-900 space-y-3"
    >
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Edit Hotspot
        </h3>
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none"
          onClick={onCancel}
          title="Cancel editing"
        >
          ✕
        </button>
      </div>

      {/* Basics */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-300">
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </label>

        <div className="flex items-center gap-2 text-xs">
          <label className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            Active
          </label>
        </div>

        <label className="block text-xs font-medium text-gray-500 dark:text-gray-300">
          Workflow Type
          <select
            value={type}
            onChange={(e) => setType(e.target.value as WorkflowType)}
            className="mt-1 w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {Object.entries(WORKFLOWS).map(([value, def]) => (
              <option key={value} value={value}>
                {def.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Workflow section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-300 mb-1">
          {workflowDef?.label} Configuration
        </h4>
        {workflowDef ? (
          <workflowDef.adminEditor
            hotspot={hotspot}
            value={contentData}
            onChange={setContentData}
          />
        ) : (
          <p className="text-xs text-gray-500">
            No editor defined for this workflow type.
          </p>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}