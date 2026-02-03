'use client';

/**
 * Matterport Iframe Bridge
 * Utilities for working with Matterport embeds
 * 
 * NOTE: Cross-origin iframe limitations prevent direct position tracking
 * from the parent page. Use the console script for manual position extraction.
 */

/**
 * Console script to get camera position from Matterport
 * User must paste this into browser console while viewing the tour
 * Only works when MP_SDK is available (SDK embed mode)
 */
export const MATTERPORT_POSITION_SCRIPT = `
(async function() {
  if (window.MP_SDK) {
    const sdk = await window.MP_SDK.connect(window);
    const pose = await sdk.Camera.getPose();
    console.log('=== CAMERA POSITION ===');
    console.log('X:', pose.position.x.toFixed(3));
    console.log('Y:', pose.position.y.toFixed(3));
    console.log('Z:', pose.position.z.toFixed(3));
    console.log('Copy:', JSON.stringify({
      x: Math.round(pose.position.x * 100) / 100,
      y: Math.round(pose.position.y * 100) / 100,
      z: Math.round(pose.position.z * 100) / 100,
    }));
  } else {
    console.log('MP_SDK not available - SDK mode required');
  }
})();
`.trim();

/**
 * Position data structure from Matterport
 */
export interface MatterportPosition {
  position: { x: number; y: number; z: number };
  rotation?: { x: number; y: number };
  sweep?: string;
  floor?: number;
}

/**
 * Parse position from a JSON string (e.g., pasted from console)
 */
export function parsePositionFromJson(json: string): MatterportPosition['position'] | null {
  try {
    const data = JSON.parse(json);
    if (typeof data.x === 'number' && typeof data.y === 'number' && typeof data.z === 'number') {
      return { x: data.x, y: data.y, z: data.z };
    }
    return null;
  } catch {
    return null;
  }
}
