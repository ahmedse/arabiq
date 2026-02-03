'use client';

/**
 * Visitor List Component
 * Shows real-time list of visitors in the demo
 */

import React from 'react';
import { User, MapPin, HelpCircle, MessageCircle, Clock } from 'lucide-react';

interface Visitor {
  id: string;
  sessionId: string;
  name?: string;
  position?: { x: number; y: number; z: number };
  currentLocation?: string;
  connectedAt: string;
  lastSeenAt: string;
  isRequestingHelp: boolean;
  locale?: string;
}

interface VisitorListProps {
  visitors: Visitor[];
  selectedVisitorId: string | null;
  onSelectVisitor: (visitorId: string) => void;
  locale: string;
}

export function VisitorList({ visitors, selectedVisitorId, onSelectVisitor, locale }: VisitorListProps) {
  const isRTL = locale === 'ar';
  
  const labels = {
    title: locale === 'ar' ? 'الزوار النشطون' : 'Active Visitors',
    noVisitors: locale === 'ar' ? 'لا يوجد زوار حالياً' : 'No active visitors',
    requestingHelp: locale === 'ar' ? 'يطلب المساعدة' : 'Requesting help',
    viewing: locale === 'ar' ? 'يشاهد' : 'Viewing',
    connectedAgo: locale === 'ar' ? 'متصل منذ' : 'Connected',
  };
  
  const formatTimeSince = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return locale === 'ar' ? 'الآن' : 'just now';
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      return locale === 'ar' ? `${mins} دقيقة` : `${mins}m ago`;
    }
    const hours = Math.floor(seconds / 3600);
    return locale === 'ar' ? `${hours} ساعة` : `${hours}h ago`;
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
        <h2 className="font-bold text-gray-800">{labels.title}</h2>
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          {visitors.length}
        </span>
      </div>
      
      {visitors.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{labels.noVisitors}</p>
        </div>
      ) : (
        <div className="divide-y max-h-[400px] overflow-y-auto">
          {visitors.map((visitor) => (
            <button
              key={visitor.sessionId}
              onClick={() => onSelectVisitor(visitor.sessionId)}
              className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                selectedVisitorId === visitor.sessionId ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  visitor.isRequestingHelp ? 'bg-amber-100' : 'bg-gray-100'
                }`}>
                  <User className={`w-5 h-5 ${
                    visitor.isRequestingHelp ? 'text-amber-600' : 'text-gray-600'
                  }`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {visitor.name || `Visitor ${visitor.sessionId.slice(-4)}`}
                    </span>
                    {visitor.isRequestingHelp && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                        <HelpCircle className="w-3 h-3" />
                        {labels.requestingHelp}
                      </span>
                    )}
                  </div>
                  
                  {visitor.currentLocation && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{labels.viewing}: {visitor.currentLocation}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{labels.connectedAgo} {formatTimeSince(visitor.connectedAt)}</span>
                  </div>
                </div>
                
                <MessageCircle className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
