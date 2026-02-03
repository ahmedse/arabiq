'use client';

/**
 * Chat Panel Component
 * Chat interface for owner to communicate with visitors
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, X, User, Loader2 } from 'lucide-react';

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

interface Visitor {
  id: string;
  sessionId: string;
  name?: string;
  isRequestingHelp: boolean;
}

interface ChatPanelProps {
  demoSlug: string;
  visitor: Visitor | null;
  messages: ChatMessage[];
  onClose: () => void;
  locale: string;
}

export function ChatPanel({ demoSlug, visitor, messages, onClose, locale }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const isRTL = locale === 'ar';
  
  const labels = {
    chatWith: locale === 'ar' ? 'محادثة مع' : 'Chat with',
    placeholder: locale === 'ar' ? 'اكتب رسالتك...' : 'Type a message...',
    noVisitor: locale === 'ar' ? 'اختر زائراً للمحادثة' : 'Select a visitor to chat',
    send: locale === 'ar' ? 'إرسال' : 'Send',
  };
  
  // Filter messages for this visitor
  const visitorMessages = visitor 
    ? messages.filter(m => m.visitorId === visitor.sessionId)
    : [];
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visitorMessages]);
  
  // Focus input when visitor changes
  useEffect(() => {
    if (visitor) {
      inputRef.current?.focus();
    }
  }, [visitor]);
  
  // Send message
  const handleSendMessage = async () => {
    if (!visitor || !input.trim() || isSending) return;
    
    const content = input.trim();
    setIsSending(true);
    setInput('');
    
    try {
      await fetch('/api/live-chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          slug: demoSlug,
          visitorId: visitor.sessionId,
          senderId: 'owner',
          senderType: 'owner',
          senderName: locale === 'ar' ? 'المالك' : 'Owner',
          content,
        }),
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setInput(content);
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
  
  if (!visitor) {
    return (
      <div className="bg-white rounded-xl shadow-lg h-full flex items-center justify-center">
        <div className="text-center text-gray-400 p-8">
          <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>{labels.noVisitor}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-lg h-full flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="px-4 py-3 bg-blue-600 text-white flex items-center justify-between rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium">
              {labels.chatWith} {visitor.name || `Visitor ${visitor.sessionId.slice(-4)}`}
            </h3>
            {visitor.isRequestingHelp && (
              <span className="text-xs text-blue-200">
                {locale === 'ar' ? '🔔 يطلب المساعدة' : '🔔 Requesting help'}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
        {visitorMessages.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">
            {locale === 'ar' ? 'ابدأ المحادثة...' : 'Start the conversation...'}
          </p>
        ) : (
          visitorMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderType === 'owner' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.senderType === 'owner'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.senderType === 'owner' ? 'text-blue-200' : 'text-gray-400'
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
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-3 border-t bg-gray-50 flex gap-2 rounded-b-xl">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={labels.placeholder}
          disabled={isSending}
          className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          dir={isRTL ? 'rtl' : 'ltr'}
        />
        <button
          onClick={handleSendMessage}
          disabled={!input.trim() || isSending}
          className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full transition-colors"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          )}
        </button>
      </div>
    </div>
  );
}
