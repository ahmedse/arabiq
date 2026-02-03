'use client';

/**
 * Visitors Panel Component
 * Real-time visitors using presence system
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  Clock, 
  MessageSquare,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';

interface Visitor {
  sessionId: string;
  name: string;
  currentLocation?: string;
  position?: { x: number; y: number; z: number };
  joinedAt: string;
  lastSeen: string;
  helpRequested?: boolean;
  locale?: string;
}

interface VisitorsPanelProps {
  demoSlug: string;
  locale: string;
}

export function VisitorsPanel({ demoSlug, locale }: VisitorsPanelProps) {
  const isRTL = locale === 'ar';
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const t = {
    liveVisitors: isRTL ? 'الزوار النشطين' : 'Live Visitors',
    noVisitors: isRTL ? 'لا يوجد زوار حالياً' : 'No visitors currently',
    connected: isRTL ? 'متصل' : 'Connected',
    disconnected: isRTL ? 'غير متصل' : 'Disconnected',
    helpRequested: isRTL ? 'طلب مساعدة' : 'Help Requested',
    viewingFor: isRTL ? 'يشاهد منذ' : 'Viewing for',
    minutes: isRTL ? 'دقائق' : 'minutes',
    chat: isRTL ? 'دردشة' : 'Chat',
  };
  
  useEffect(() => {
    let eventSource: EventSource | null = null;
    
    const connect = () => {
      eventSource = new EventSource(`/api/presence?slug=${demoSlug}&role=owner`);
      
      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'init' || data.type === 'state') {
            setVisitors(data.visitors || []);
          } else if (data.type === 'visitor_join') {
            setVisitors(prev => [...prev.filter(v => v.sessionId !== data.visitor.sessionId), data.visitor]);
          } else if (data.type === 'visitor_leave') {
            setVisitors(prev => prev.filter(v => v.sessionId !== data.sessionId));
          } else if (data.type === 'visitor_move') {
            setVisitors(prev => prev.map(v => 
              v.sessionId === data.sessionId 
                ? { ...v, position: data.position, currentLocation: data.currentLocation, lastSeen: new Date().toISOString() }
                : v
            ));
          } else if (data.type === 'help_request') {
            setVisitors(prev => prev.map(v =>
              v.sessionId === data.sessionId
                ? { ...v, helpRequested: true }
                : v
            ));
          } else if (data.type === 'help_cancel') {
            setVisitors(prev => prev.map(v =>
              v.sessionId === data.sessionId
                ? { ...v, helpRequested: false }
                : v
            ));
          }
        } catch (e) {
          // Ignore parse errors (like ping messages)
        }
      };
      
      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();
        // Reconnect after 5 seconds
        setTimeout(connect, 5000);
      };
    };
    
    connect();
    
    return () => {
      eventSource?.close();
    };
  }, [demoSlug]);
  
  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return isRTL ? 'الآن' : 'Just now';
    if (diffMins < 60) return `${diffMins} ${t.minutes}`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
  };
  
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">{t.liveVisitors}</h3>
          <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
            {visitors.length}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 text-sm">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-green-500">{t.connected}</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-red-500">{t.disconnected}</span>
            </>
          )}
        </div>
      </div>
      
      {/* Visitors list */}
      <div className="divide-y divide-border max-h-80 overflow-y-auto">
        {visitors.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{t.noVisitors}</p>
          </div>
        ) : (
          visitors.map((visitor) => (
            <div 
              key={visitor.sessionId}
              className={`p-4 hover:bg-muted/30 transition-colors ${visitor.helpRequested ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${visitor.helpRequested ? 'bg-amber-500' : 'bg-primary'}`}>
                    {visitor.name.slice(-2).toUpperCase()}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{visitor.name}</p>
                      {visitor.helpRequested && (
                        <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          {t.helpRequested}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      {visitor.currentLocation && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {visitor.currentLocation}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {t.viewingFor} {getTimeAgo(visitor.joinedAt)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <button
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title={t.chat}
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
