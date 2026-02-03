"use client";

import { useEffect, useRef } from "react";
import type { MatterportHotspot } from "./types";
import type { MatterportController } from "./sdkClient";

interface OverlayCanvasProps {
  hotspots: MatterportHotspot[];
  controller: MatterportController;
  onMarkerClick: (hotspot: MatterportHotspot) => void;
}

/**
 * OverlayCanvas
 * Draws circles in screen space corresponding to each hotspot’s 3D world position.
 * Syncs in real-time with Matterport scene via SDK projection.
 */
export function OverlayCanvas({ hotspots, controller, onMarkerClick }: OverlayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !controller) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const { clientWidth, clientHeight } = canvas;
      canvas.width = clientWidth * dpr;
      canvas.height = clientHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    let animationFrame: number;
    let frameActive = true;

    async function draw() {
      if (!frameActive || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const hotspot of hotspots) {
        if (!hotspot.is_active) continue;
        try {
          const screen = await controller.projectToScreen({
            x: hotspot.position_x,
            y: hotspot.position_y,
            z: hotspot.position_z,
          });
          if (screen && screen.x >= 0 && screen.y >= 0 && screen.x <= 1 && screen.y <= 1) {
            // Convert normalized (0-1) coordinates to pixels
            const px = screen.x * canvas.clientWidth;
            const py = screen.y * canvas.clientHeight;
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, 2 * Math.PI);
            ctx.fillStyle = hotspot.id === "selected" ? "#f87171" : "#3b82f6";
            ctx.fill();

            // Label for clarity
            ctx.font = "12px Inter, sans-serif";
            ctx.fillStyle = "white";
            ctx.fillText(hotspot.title, px + 8, py + 4);
          }
        } catch (err) {
          // Projection may fail if off-screen; no problem.
        }
      }

      animationFrame = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      frameActive = false;
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, [hotspots, controller]);

  // Allow optional click interactions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function handleClick(e: MouseEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const clickTolerance = 10;

      hotspots.forEach(async (h) => {
        try {
          const screen = await controller.projectToScreen({
            x: h.position_x,
            y: h.position_y,
            z: h.position_z,
          });
          if (!screen) return;
          const px = screen.x * canvas.clientWidth;
          const py = screen.y * canvas.clientHeight;
          const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
          if (dist < clickTolerance) onMarkerClick(h);
        } catch {
          /* ignore */
        }
      });
    }

    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, [hotspots, controller, onMarkerClick]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
    />
  );
}