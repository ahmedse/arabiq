'use client';

/**
 * MiniMap Component
 * Shows floor plan with current position
 */

import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useMatterport } from './MatterportProvider';
import { useFloors } from '@/lib/matterport/hooks';

interface MiniMapProps {
  className?: string;
}

export function MiniMap({ className = '' }: MiniMapProps) {
  const { sdk } = useMatterport();
  const { floors, currentFloor, moveTo } = useFloors(sdk);
  
  // Safety check: ensure floors is an array
  if (!Array.isArray(floors) || floors.length <= 1) return null;
  
  const currentIndex = floors.findIndex(f => f.id === currentFloor);
  const canGoUp = currentIndex < floors.length - 1;
  const canGoDown = currentIndex > 0;
  
  const handleUp = () => {
    if (canGoUp) {
      moveTo(floors[currentIndex + 1].id);
    }
  };
  
  const handleDown = () => {
    if (canGoDown) {
      moveTo(floors[currentIndex - 1].id);
    }
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-lg p-2 ${className}`}>
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={handleUp}
          disabled={!canGoUp}
          className={`p-1 rounded ${canGoUp ? 'hover:bg-gray-100' : 'opacity-30 cursor-not-allowed'}`}
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col gap-1">
          {floors.slice().reverse().map((floor) => (
            <button
              key={floor.id}
              onClick={() => moveTo(floor.id)}
              className={`
                w-8 h-8 rounded text-xs font-medium
                ${floor.id === currentFloor 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
              `}
            >
              {floor.sequence + 1}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleDown}
          disabled={!canGoDown}
          className={`p-1 rounded ${canGoDown ? 'hover:bg-gray-100' : 'opacity-30 cursor-not-allowed'}`}
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
