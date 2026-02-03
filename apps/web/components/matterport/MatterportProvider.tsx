'use client';

/**
 * Matterport SDK Context Provider
 * Provides SDK instance to all child components
 */

import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import type { MatterportSDK, DemoConfig, TourItem } from '@/lib/matterport/types';
import { useMatterportSdk } from '@/lib/matterport/hooks';

interface MatterportContextValue {
  // SDK state
  sdk: MatterportSDK | null;
  isLoading: boolean;
  isReady: boolean;
  error: Error | null;
  
  // Demo config
  demo: DemoConfig | null;
  setDemo: (demo: DemoConfig) => void;
  
  // Items in tour (products, menu items, rooms, etc.)
  items: TourItem[];
  setItems: (items: TourItem[]) => void;
  selectedItem: TourItem | null;
  selectItem: (item: TourItem | null) => void;
  
  // Container ref for SDK to mount iframe
  containerRef: React.RefObject<HTMLDivElement | null>;
  
  // UI state
  isPanelOpen: boolean;
  togglePanel: () => void;
  isCartOpen: boolean;
  toggleCart: () => void;
  
  // Retry connection
  retryConnection: () => void;
}

const MatterportContext = createContext<MatterportContextValue | null>(null);

export function useMatterport() {
  const context = useContext(MatterportContext);
  if (!context) {
    throw new Error('useMatterport must be used within MatterportProvider');
  }
  return context;
}

interface MatterportProviderProps {
  children: React.ReactNode;
  initialDemo?: DemoConfig;
}

export function MatterportProvider({ children, initialDemo }: MatterportProviderProps) {
  // Container ref for SDK to mount iframe
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Demo config
  const [demo, setDemoState] = useState<DemoConfig | null>(initialDemo || null);
  
  // Retry trigger
  const [retryTrigger, setRetryTrigger] = useState(0);
  
  // SDK state - pass model ID and container ref
  const { sdk, isLoading, isReady, error } = useMatterportSdk(
    demo?.matterportModelId,
    containerRef,
    retryTrigger
  );
  
  // Retry connection function
  const retryConnection = useCallback(() => {
    setRetryTrigger(prev => prev + 1);
  }, []);
  
  // Wrapper for setDemo that also resets retry
  const setDemo = useCallback((newDemo: DemoConfig) => {
    setDemoState(newDemo);
    setRetryTrigger(0);
  }, []);
  
  // Tour items
  const [items, setItems] = useState<TourItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<TourItem | null>(null);
  
  const selectItem = useCallback((item: TourItem | null) => {
    setSelectedItem(item);
  }, []);
  
  // UI state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const togglePanel = useCallback(() => setIsPanelOpen(prev => !prev), []);
  const toggleCart = useCallback(() => setIsCartOpen(prev => !prev), []);
  
  const value: MatterportContextValue = {
    sdk,
    isLoading,
    isReady,
    error,
    demo,
    setDemo,
    items,
    setItems,
    selectedItem,
    selectItem,
    containerRef,
    isPanelOpen,
    togglePanel,
    isCartOpen,
    toggleCart,
    retryConnection,
  };
  
  return (
    <MatterportContext.Provider value={value}>
      {children}
    </MatterportContext.Provider>
  );
}
