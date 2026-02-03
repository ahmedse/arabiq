'use client';

/**
 * ResizablePanel Component
 * A resizable panel with drag handle for adjustable width
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  side?: 'left' | 'right';
  className?: string;
  onWidthChange?: (width: number) => void;
}

export function ResizablePanel({
  children,
  defaultWidth = 320,
  minWidth = 280,
  maxWidth = 600,
  side = 'right',
  className = '',
  onWidthChange,
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  }, [width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const diff = side === 'right' 
      ? startXRef.current - e.clientX
      : e.clientX - startXRef.current;
    
    const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + diff));
    setWidth(newWidth);
    onWidthChange?.(newWidth);
  }, [isDragging, side, minWidth, maxWidth, onWidthChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={panelRef}
      className={`relative flex ${className}`}
      style={{ width: `${width}px` }}
    >
      {/* Resize Handle */}
      <div
        className={`
          absolute top-0 bottom-0 w-4 cursor-col-resize z-10
          flex items-center justify-center
          ${side === 'right' ? 'left-0 -ml-2' : 'right-0 -mr-2'}
          group
        `}
        onMouseDown={handleMouseDown}
      >
        <div className={`
          w-1 h-16 rounded-full transition-colors
          ${isDragging ? 'bg-primary-500' : 'bg-gray-300 group-hover:bg-primary-400'}
        `}>
          <GripVertical className={`
            w-4 h-4 -ml-1.5 mt-5 text-gray-400 
            ${isDragging ? 'text-primary-600' : 'group-hover:text-primary-500'}
          `} />
        </div>
      </div>
      
      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export default ResizablePanel;
