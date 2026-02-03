'use client';

/**
 * Owner Dashboard Client Component
 * Real-time visitor monitoring and chat interface
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Users, MessageCircle, Eye, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { VisitorList } from './VisitorList';
import { ChatPanel } from './ChatPanel';

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

interface ChatMessage {
  id: string;
  visitorId: string;
  senderId: string;
  senderType: 'owner' | 'visitor';
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface OwnerDashboardClientProps {
  demoSlug: string;
  demoTitle: string;
  locale: string;
}

export function OwnerDashboardClient({ demoSlug, demoTitle, locale }: OwnerDashboardClientProps) {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const isRTL = locale === 'ar';
  
  const labels = {
    title: locale === 'ar' ? 'لوحة تحكم المالك' : 'Owner Dashboard',
    backToDemo: locale === 'ar' ? 'العودة للعرض' : 'Back to Demo',
    visitors: locale === 'ar' ? 'الزوار' : 'Visitors',
    messages: locale === 'ar' ? 'الرسائل' : 'Messages',
    helpRequests: locale === 'ar' ? 'طلبات المساعدة' : 'Help Requests',
    connected: locale === 'ar' ? 'متصل' : 'Connected',
    disconnected: locale === 'ar' ? 'غير متصل' : 'Disconnected',
  };
  
  // Connect to presence SSE
  useEffect(() => {
    const presenceUrl = `/api/presence?slug=${demoSlug}&owner=true`;
    const presenceSource = new EventSource(presenceUrl);
    
    presenceSource.onopen = () => {
      setIsConnected(true);
    };
    
    presenceSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'init') {
          setVisitors(data.visitors || []);
        } else if (data.type === 'visitor_join') {
          setVisitors(prev => [...prev, data.visitor]);
        } else if (data.type === 'visitor_leave') {
          setVisitors(prev => prev.filter(v => v.sessionId !== data.visitor.sessionId));
          if (selectedVisitorId === data.visitor.sessionId) {
            setSelectedVisitorId(null);
          }
        } else if (data.type === 'visitor_move' || data.type === 'help_request' || data.type === 'help_cancel') {
          setVisitors(prev => prev.map(v => 
            v.sessionId === data.visitor.sessionId ? data.visitor : v
          ));
        }
      } catch (error) {
        console.error('Failed to parse presence event:', error);
      }
    };
    
    presenceSource.onerror = () => {
      setIsConnected(false);
    };
    
    return () => {
      presenceSource.close();
    };
  }, [demoSlug, selectedVisitorId]);
  
  // Connect to chat SSE
  useEffect(() => {
    const chatUrl = `/api/live-chat?slug=${demoSlug}&owner=true`;
    const chatSource = new EventSource(chatUrl);
    
    chatSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'init') {
          setMessages(data.messages || []);
        } else if (data.type === 'new_message') {
          setMessages(prev => [...prev, data.message]);
        }
      } catch (error) {
        console.error('Failed to parse chat event:', error);
      }
    };
    
    return () => {
      chatSource.close();
    };
  }, [demoSlug]);
  
  const selectedVisitor = visitors.find(v => v.sessionId === selectedVisitorId) || null;
  const helpRequestCount = visitors.filter(v => v.isRequestingHelp).length;
  const unreadCount = messages.filter(m => m.senderType === 'visitor' && !m.read).length;
  
  return (
    <div className="min-h-screen bg-gray-100" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/demos/${demoSlug}`}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-bold text-xl text-gray-900">{labels.title}</h1>
              <p className="text-sm text-gray-500">{demoTitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected ? labels.connected : labels.disconnected}
            </div>
          </div>
        </div>
      </header>
      
      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{visitors.length}</p>
              <p className="text-sm text-gray-500">{labels.visitors}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              <p className="text-sm text-gray-500">{labels.messages}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow flex items-center gap-4">
            <div className={`p-3 rounded-full ${helpRequestCount > 0 ? 'bg-amber-100' : 'bg-gray-100'}`}>
              <Eye className={`w-6 h-6 ${helpRequestCount > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{helpRequestCount}</p>
              <p className="text-sm text-gray-500">{labels.helpRequests}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visitor List */}
          <VisitorList
            visitors={visitors}
            selectedVisitorId={selectedVisitorId}
            onSelectVisitor={setSelectedVisitorId}
            locale={locale}
          />
          
          {/* Chat Panel */}
          <ChatPanel
            demoSlug={demoSlug}
            visitor={selectedVisitor}
            messages={messages}
            onClose={() => setSelectedVisitorId(null)}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}
