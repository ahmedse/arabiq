// modules/WorkflowEngine.tsx
"use client";

import React from "react";
import type { Hotspot } from "./types";

export type WorkflowType =
  | "info"
  | "chatbot"
  | "ecommerce"
  | "booking"
  | "education";

export interface WorkflowEditorProps {
  hotspot: Hotspot;
  value: any; // current content_data
  onChange: (next: any) => void;
}

/**
 * INFO WORKFLOW EDITOR
 */
function InfoWorkflowEditor({ value, onChange }: WorkflowEditorProps) {
  const text = value?.text ?? "";
  const imageUrl = value?.imageUrl ?? "";

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-300">
        Text
        <textarea
          className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
          rows={3}
          value={text}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
        />
      </label>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-300">
        Image URL (optional)
        <input
          type="text"
          className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
          value={imageUrl}
          onChange={(e) => onChange({ ...value, imageUrl: e.target.value })}
        />
      </label>
    </div>
  );
}

/**
 * CHATBOT WORKFLOW EDITOR
 */
function ChatbotWorkflowEditor({ value, onChange }: WorkflowEditorProps) {
  const botId = value?.botId ?? "";
  const initialMessage = value?.initialMessage ?? "";

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-300">
        Bot ID
        <input
          type="text"
          className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
          value={botId}
          onChange={(e) => onChange({ ...value, botId: e.target.value })}
        />
      </label>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-300">
        Initial Message (optional)
        <textarea
          className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
          rows={2}
          value={initialMessage}
          onChange={(e) =>
            onChange({ ...value, initialMessage: e.target.value })
          }
        />
      </label>
    </div>
  );
}

/**
 * ECOMMERCE WORKFLOW EDITOR
 */
function EcommerceWorkflowEditor({ value, onChange }: WorkflowEditorProps) {
  const productId = value?.productId ?? "";
  const label = value?.label ?? "";

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-300">
        Product ID
        <input
          type="text"
          className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
          value={productId}
          onChange={(e) => onChange({ ...value, productId: e.target.value })}
        />
      </label>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-300">
        Label (optional)
        <input
          type="text"
          className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
          value={label}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
        />
      </label>
    </div>
  );
}

/**
 * BOOKING WORKFLOW EDITOR
 */
function BookingWorkflowEditor({ value, onChange }: WorkflowEditorProps) {
  const bookingUrl = value?.bookingUrl ?? "";
  const provider = value?.provider ?? "";

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-300">
        Booking URL
        <input
          type="text"
          className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
          value={bookingUrl}
          onChange={(e) => onChange({ ...value, bookingUrl: e.target.value })}
        />
      </label>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-300">
        Provider (optional)
        <input
          type="text"
          className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
          value={provider}
          onChange={(e) => onChange({ ...value, provider: e.target.value })}
        />
      </label>
    </div>
  );
}

/**
 * EDUCATION WORKFLOW EDITOR
 */
function EducationWorkflowEditor({ value, onChange }: WorkflowEditorProps) {
  const topicId = value?.topicId ?? "";
  const title = value?.title ?? "";

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-300">
        Topic / Lesson ID
        <input
          type="text"
          className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
          value={topicId}
          onChange={(e) => onChange({ ...value, topicId: e.target.value })}
        />
      </label>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-300">
        Display Title (optional)
        <input
          type="text"
          className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
          value={title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </label>
    </div>
  );
}

interface WorkflowDefinition {
  label: string;
  adminEditor: React.ComponentType<WorkflowEditorProps>;
  getDefaultContent: () => any;
}

/**
 * Workflow registry – v1.
 * Later, this can be split into separate files or even dynamic plugin loading.
 */
export const WORKFLOWS: Record<WorkflowType, WorkflowDefinition> = {
  info: {
    label: "Info",
    adminEditor: InfoWorkflowEditor,
    getDefaultContent: () => ({
      text: "",
      imageUrl: "",
    }),
  },
  chatbot: {
    label: "Chatbot",
    adminEditor: ChatbotWorkflowEditor,
    getDefaultContent: () => ({
      botId: "",
      initialMessage: "",
    }),
  },
  ecommerce: {
    label: "Ecommerce",
    adminEditor: EcommerceWorkflowEditor,
    getDefaultContent: () => ({
      productId: "",
      label: "",
    }),
  },
  booking: {
    label: "Booking",
    adminEditor: BookingWorkflowEditor,
    getDefaultContent: () => ({
      bookingUrl: "",
      provider: "",
    }),
  },
  education: {
    label: "Education",
    adminEditor: EducationWorkflowEditor,
    getDefaultContent: () => ({
      topicId: "",
      title: "",
    }),
  },
};