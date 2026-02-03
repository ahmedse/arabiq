'use client';

/**
 * Live Chat Widget
 * Floating chat button + chat panel for visitors to communicate with owner
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, HelpCircle, Loader2, CheckCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'owner' | 'visitor';
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface LiveChatWidgetProps {
  demoSlug: string;
  sessionId: string;
  visitorName: string;
  ownerOnline?: boolean;
  locale: string;
}

export function LiveChatWidget({ 
  demoSlug, 
  sessionId, 
  visitorName,
  ownerOnline = false,
  locale 
}: LiveChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRequestingHelp, setIsRequestingHelp] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ownerTyping, setOwnerTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  
  const isRTL = locale === 'ar';
  
  const labels = {
    needHelp: locale === 'ar' ? 'تحتاج مساعدة؟' : 'Need help?',
    liveChat: locale === 'ar' ? 'الدردشة المباشرة' : 'Live Chat',
    requestHelp: locale === 'ar' ? 'طلب مساعدة' : 'Request Help',
    helpRequested: locale === 'ar' ? 'تم طلب المساعدة' : 'Help Requested',
    cancelHelp: locale === 'ar' ? 'إلغاء الطلب' : 'Cancel Request',
    ownerOnline: locale === 'ar' ? 'متصل' : 'Online',
    ownerOffline: locale === 'ar' ? 'غير متصل' : 'Offline',
    typePlaceholder: locale === 'ar' ? 'اكتب رسالتك...' : 'Type a message...',
    waitingResponse: locale === 'ar' ? 'بانتظار الرد...' : 'Waiting for response...',
    ownerTyping: locale === 'ar' ? 'يكتب...' : 'typing...',
  };
  
  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [messages, isOpen, scrollToBottom]);
  
  // Connect to SSE for real-time updates
  useEffect(() => {
    if (!isOpen) return;
    
    const url = `/api/live-chat?slug=${demoSlug}&visitorId=${sessionId}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'init') {
          setMessages(data.messages || []);
        } else if (data.type === 'new_message') {
          setMessages(prev => [...prev, data.message]);
          if (data.message.senderType === 'owner' && !isOpen) {
            setUnreadCount(prev => prev + 1);
          }
        } else if (data.type === 'typing') {
          setOwnerTyping(data.isTyping && data.visitorId === sessionId);
        }
      } catch (error) {
        console.error('Failed to parse chat event:', error);
      }
    };
    
    eventSource.onerror = () => {
      console.error('Chat SSE connection error');
      eventSource.close();
    };
    
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [demoSlug, sessionId, isOpen]);
  
  // Request help
  const handleRequestHelp = async () => {
    try {
      await fetch('/api/presence/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isRequestingHelp ? 'help_cancel' : 'help_request',
          slug: demoSlug,
          sessionId,
        }),
      });
      setIsRequestingHelp(!isRequestingHelp);
    } catch (error) {
      console.error('Failed to toggle help request:', error);
    }
  };
  
  // Send message
  const handleSendMessage = async () => {
    const content = input.trim();
    if (!content || isSending) return;
    
    setIsSending(true);
    setInput('');
    
    try {
      await fetch('/api/live-chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          slug: demoSlug,
          visitorId: sessionId,
          senderId: sessionId,
          senderType: 'visitor',
          senderName: visitorName,
          content,
        }),
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setInput(content); // Restore message on failure
    } finally {
      setIsSending(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-50 p-4 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-all ${isOpen ? 'hidden' : ''}`}
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      
      {/* Chat Panel */}
      {isOpen && (
        <div 
          className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="bg-green-600 text-white p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold">{labels.liveChat}</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${ownerOnline ? 'bg-green-300' : 'bg-gray-400'}`} />
                {ownerOnline ? labels.ownerOnline : labels.ownerOffline}
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Help Request Button */}
          <div className="p-3 border-b bg-gray-50">
            <button
              onClick={handleRequestHelp}
              className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                isRequestingHelp 
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isRequestingHelp ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {labels.helpRequested}
                </>
              ) : (
                <>
                  <HelpCircle className="w-5 h-5" />
                  {labels.requestHelp}
                </>
              )}
            </button>
            {isRequestingHelp && (
              <p className="text-xs text-center text-gray-500 mt-2">
                {labels.waitingResponse}
              </p>
            )}
          </div>
          
          {/* Messages */}
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">
                {locale === 'ar' ? 'ابدأ محادثة...' : 'Start a conversation...'}
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderType === 'visitor' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.senderType === 'visitor'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.senderType === 'visitor' ? 'text-green-200' : 'text-gray-400'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString(locale, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            
            {ownerTyping && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                {labels.ownerTyping}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-3 border-t bg-gray-50 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={labels.typePlaceholder}
              disabled={isSending}
              className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isSending}
              className="p-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-full transition-colors"
            >
              <Send className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
