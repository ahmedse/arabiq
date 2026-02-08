'use client';

/**
 * AI Chat Drawer
 * Sliding panel with AI-powered chat interface for virtual tours
 * Powered by the new AI Agent Engine (/api/ai-agent)
 * 
 * Features:
 * - Real CMS data loading
 * - Intent classification
 * - Model routing (local/standard/advanced)
 * - Session memory (no need to send history)
 * - Smart suggestions
 * - Action buttons (navigate, WhatsApp, contact)
 * - Bilingual support (English/Arabic)
 * - Rich markdown rendering (T5)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles, Trash2, Navigation, MessageCircle, Mail, BarChart3 } from 'lucide-react';
import type { DemoConfig, TourItem } from '@/lib/matterport/types';

// Response shape from /api/ai-agent
interface AgentResponse {
  message: string;
  sessionId: string;
  timestamp: string;
  intent?: string;
  actions?: AgentAction[];
  suggestions?: string[];
  usage?: {
    model?: string;
    tier: 'local' | 'standard' | 'advanced';
    tokensEstimate?: number;
  };
  error?: string;
}

interface AgentAction {
  type: 'flyTo' | 'showComparison' | 'openWhatsApp' | 'showContactForm' | 'showLeadForm' | 'addToCart';
  payload: Record<string, any>;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: AgentAction[];
  usage?: AgentResponse['usage'];
}

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  demo: DemoConfig;
  currentLocation?: string;
  locale: string;
  // Items kept ONLY for local navigation lookup, NOT sent to server
  items?: TourItem[];
  // Callback to navigate to an item
  onNavigateToItem?: (item: TourItem) => void;
  // Callback to add item to cart
  onAddToCart?: (itemId: string, title: string, price: number, quantity: number, imageUrl?: string) => void;
}

/**
 * Lightweight Markdown Renderer for Chat Messages
 * Supports: bold, italic, lists, links, line breaks
 * Strips action markers: [[FLY_TO:...]], [[WHATSAPP:...]], etc.
 */
function renderMarkdown(text: string, isAssistant: boolean): React.ReactNode {
  // Strip action markers first
  const cleanText = text.replace(/\[\[(?:FLY_TO|WHATSAPP|LEAD|COMPARE|TOOL)[^\]]*\]\]/g, '');
  
  const lines = cleanText.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  
  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType;
      elements.push(
        <ListTag key={`list-${elements.length}`} className="my-1 pl-5 space-y-0.5">
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ListTag>
      );
      listItems = [];
      listType = null;
    }
  };
  
  const renderInline = (line: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;
    
    // Process inline formatting: bold, italic, links
    while (remaining.length > 0) {
      // Bold: **text**
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        parts.push(<strong key={key++} className="font-semibold">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }
      
      // Italic: *text*
      const italicMatch = remaining.match(/^\*(.+?)\*/);
      if (italicMatch) {
        parts.push(<em key={key++} className="italic opacity-90">{italicMatch[1]}</em>);
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }
      
      // Links: [text](url)
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^\)]+)\)/);
      if (linkMatch) {
        const linkClass = isAssistant 
          ? 'text-blue-300 hover:text-blue-200 underline'
          : 'text-white underline opacity-90 hover:opacity-100';
        parts.push(
          <a 
            key={key++} 
            href={linkMatch[2]} 
            target="_blank" 
            rel="noopener noreferrer"
            className={linkClass}
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }
      
      // Regular text
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    }
    
    return parts;
  };
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Bullet list: - item or • item
    if (trimmed.match(/^[-•]\s+/)) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(trimmed.replace(/^[-•]\s+/, ''));
      return;
    }
    
    // Numbered list: 1. item
    if (trimmed.match(/^\d+\.\s+/)) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(trimmed.replace(/^\d+\.\s+/, ''));
      return;
    }
    
    // Not a list - flush any pending list
    flushList();
    
    // Empty line - preserve spacing
    if (trimmed === '') {
      elements.push(<br key={`br-${index}`} />);
      return;
    }
    
    // Regular paragraph
    elements.push(
      <span key={`p-${index}`}>
        {renderInline(line)}
        {index < lines.length - 1 && <br />}
      </span>
    );
  });
  
  // Flush any remaining list
  flushList();
  
  return <>{elements}</>;
}

export function AIChatDrawer({ 
  isOpen, 
  onClose, 
  demo, 
  currentLocation, 
  locale, 
  items = [], 
  onNavigateToItem,
  onAddToCart,
}: AIChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // Persistent session ID — stored in localStorage keyed by demo slug
  // So returning visitors get their conversation back (even across tabs)
  const getOrCreateSessionId = useCallback(() => {
    if (typeof window === 'undefined') return `session-${Date.now()}`;
    const key = `arabiq_chat_session_${demo.slug}`;
    const stored = localStorage.getItem(key);
    if (stored) return stored;
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, newId);
    return newId;
  }, [demo.slug]);
  
  const [sessionId, setSessionId] = useState(getOrCreateSessionId);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const isRTL = locale === 'ar';
  
  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);
  
  // Load chat history from server when drawer opens
  useEffect(() => {
    if (!isOpen || historyLoaded) return;
    
    const loadHistory = async () => {
      try {
        const res = await fetch(`/api/ai-agent/history?sessionId=${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.valid && data.messages && data.messages.length > 0) {
          // Restore previous conversation
          const restored: ChatMessage[] = data.messages
            .filter((m: any) => m.role !== 'system')
            .map((m: any, i: number) => ({
              id: `restored-${i}`,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              timestamp: new Date(m.timestamp),
              actions: m.actions,
            }));
          setMessages(restored);
          setSuggestions(getInitialSuggestions(demo.demoType, locale));
        } else {
          // No history — show welcome message
          const welcomeMessage = getWelcomeMessage(demo.demoType, demo.title, locale, items.length);
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: welcomeMessage,
            timestamp: new Date(),
          }]);
          setSuggestions(getInitialSuggestions(demo.demoType, locale));
        }
      } catch {
        // Network error — show welcome
        const welcomeMessage = getWelcomeMessage(demo.demoType, demo.title, locale, items.length);
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: welcomeMessage,
          timestamp: new Date(),
        }]);
        setSuggestions(getInitialSuggestions(demo.demoType, locale));
      }
      setHistoryLoaded(true);
    };
    
    loadHistory();
  }, [isOpen, historyLoaded, sessionId, demo.demoType, demo.title, locale, items.length]);
  
  // Handle action button click
  const handleAction = useCallback((action: AgentAction) => {
    switch (action.type) {
      case 'flyTo':
        if (onNavigateToItem) {
          // Find the item in the items prop by ID
          const itemId = String(action.payload.itemId);
          const item = items.find(i => 
            String(i.id) === itemId || 
            i.documentId === itemId
          );
          if (item) {
            onNavigateToItem(item);
          }
        }
        break;
        
      case 'openWhatsApp':
        const phone = action.payload.phone || action.payload.number;
        if (phone) {
          const cleanPhone = phone.replace(/[^0-9+]/g, '');
          const message = action.payload.message || '';
          const url = `https://wa.me/${cleanPhone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        }
        break;
        
      case 'showContactForm':
      case 'showLeadForm':
        // Future: open contact modal
        console.log('Contact form requested:', action);
        break;
        
      case 'showComparison':
        // Future: open comparison view
        console.log('Comparison requested:', action);
        break;
      
      case 'addToCart':
        if (onAddToCart) {
          const { itemId, title, price, quantity: qty, imageUrl } = action.payload;
          onAddToCart(String(itemId), title || '', price || 0, qty || 1, imageUrl);
        }
        break;
    }
  }, [items, onNavigateToItem, onAddToCart]);
  
  const sendMessage = async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || isLoading) return;
    
    // Add user message to UI
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Clear suggestions while loading
    setSuggestions([]);
    
    try {
      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          demoSlug: demo.slug,
          sessionId,
          locale,
          currentLocation,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data: AgentResponse = await response.json();
      
      // Handle error response
      if (data.error) {
        const errorMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.error,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }
      
      // Add assistant message with actions
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        actions: data.actions,
        usage: data.usage,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update suggestions for next message
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: locale === 'ar' 
          ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.'
          : 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const clearChat = () => {
    setMessages([]);
    setSuggestions([]);
    setHistoryLoaded(false);
    // Generate new session so server starts fresh
    const key = `arabiq_chat_session_${demo.slug}`;
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, newId);
    setSessionId(newId);
  };
  
  const labels = {
    title: locale === 'ar' ? 'المساعد الذكي' : 'AI Assistant',
    placeholder: locale === 'ar' ? 'اكتب رسالتك...' : 'Type your message...',
    send: locale === 'ar' ? 'إرسال' : 'Send',
    clearChat: locale === 'ar' ? 'مسح المحادثة' : 'Clear chat',
    typing: locale === 'ar' ? 'جاري الكتابة...' : 'Typing...',
    goTo: locale === 'ar' ? 'الذهاب إلى' : 'Go to',
    chatWhatsApp: locale === 'ar' ? 'الدردشة عبر واتساب' : 'Chat on WhatsApp',
    contactUs: locale === 'ar' ? 'اتصل بنا' : 'Contact us',
    compare: locale === 'ar' ? 'عرض المقارنة' : 'View comparison',
  };
  
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div 
        className={`fixed top-0 ${isRTL ? 'left-0' : 'right-0'} h-full w-full sm:w-96 bg-gray-900 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen 
            ? 'translate-x-0' 
            : isRTL ? '-translate-x-full' : 'translate-x-full'
        }`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white">{labels.title}</h2>
              {currentLocation && (
                <p className="text-xs text-gray-400">
                  {locale === 'ar' ? `الموقع: ${currentLocation}` : `Location: ${currentLocation}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 1 && (
              <button
                onClick={clearChat}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                title={labels.clearChat}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 h-[calc(100%-140px)]">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <div className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-blue-600' 
                      : 'bg-gradient-to-br from-purple-500 to-blue-500'
                  }`}>
                    {message.role === 'user' 
                      ? <User className="w-4 h-4 text-white" />
                      : <Bot className="w-4 h-4 text-white" />
                    }
                  </div>
                  <div className={`flex-1 max-w-[80%]`}>
                    <div className={`rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-100'
                    }`}>
                      <div className="text-sm">
                        {renderMarkdown(message.content, message.role === 'assistant')}
                      </div>
                      
                      {/* Action buttons */}
                      {message.actions && message.actions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.actions.map((action, idx) => (
                            <ActionButton
                              key={idx}
                              action={action}
                              onClick={() => handleAction(action)}
                              labels={labels}
                              items={items}
                            />
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs opacity-50">
                          {message.timestamp.toLocaleTimeString(locale, { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                        {/* Model tier badge */}
                        {message.usage && (
                          <span className="text-xs opacity-50" title={message.usage.model || message.usage.tier}>
                            {message.usage.model === 'tool' && '🔧'}
                            {message.usage.model !== 'tool' && message.usage.tier === 'advanced' && '✨'}
                            {message.usage.model !== 'tool' && message.usage.tier === 'standard' && '🧠'}
                            {message.usage.model !== 'tool' && message.usage.tier === 'local' && '⚡'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Suggestion chips - only show after the last assistant message */}
                {message.role === 'assistant' && 
                 message.id === messages[messages.length - 1]?.id && 
                 suggestions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 px-11">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(suggestion)}
                        disabled={isLoading}
                        className="bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-xs rounded-full px-3 py-1.5 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-800 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-gray-400">{labels.typing}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Input */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-900">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={labels.placeholder}
              disabled={isLoading}
              className="flex-1 bg-gray-800 text-white rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-full transition-colors"
            >
              <Send className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Action Button Component
function ActionButton({ 
  action, 
  onClick, 
  labels, 
  items 
}: { 
  action: AgentAction; 
  onClick: () => void; 
  labels: Record<string, string>;
  items: TourItem[];
}) {
  switch (action.type) {
    case 'flyTo':
      const itemId = String(action.payload.itemId);
      const item = items.find(i => String(i.id) === itemId || i.documentId === itemId);
      const itemName = action.payload.title || action.payload.itemName || item?.name || 'item';
      
      return (
        <button
          onClick={onClick}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-3 py-1.5 text-xs transition-colors w-full justify-center"
        >
          <Navigation className="w-3 h-3" />
          {labels.goTo} {itemName}
        </button>
      );
      
    case 'openWhatsApp':
      return (
        <button
          onClick={onClick}
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white rounded-full px-3 py-1.5 text-xs transition-colors w-full justify-center"
        >
          <MessageCircle className="w-3 h-3" />
          {labels.chatWhatsApp}
        </button>
      );
      
    case 'showContactForm':
    case 'showLeadForm':
      return (
        <button
          onClick={onClick}
          className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full px-3 py-1.5 text-xs transition-colors w-full justify-center"
        >
          <Mail className="w-3 h-3" />
          {labels.contactUs}
        </button>
      );
      
    case 'showComparison':
      return (
        <button
          onClick={onClick}
          disabled
          className="flex items-center gap-1.5 bg-gray-600 text-gray-400 rounded-full px-3 py-1.5 text-xs cursor-not-allowed w-full justify-center"
        >
          <BarChart3 className="w-3 h-3" />
          {labels.compare}
        </button>
      );
    
    case 'addToCart':
      return (
        <button
          onClick={onClick}
          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-full px-3 py-1.5 text-xs transition-colors w-full justify-center"
        >
          🛒 {action.payload.title || (labels.addToCart || 'Add to Cart')}
        </button>
      );
      
    default:
      return null;
  }
}

// Welcome message based on demo type (client-side only)
function getWelcomeMessage(demoType: string, title: string, locale: string, itemCount: number = 0): string {
  const isArabic = locale === 'ar';
  
  const itemSuffix = itemCount > 0
    ? isArabic 
      ? ` لدينا ${itemCount} عنصر متاح. اسألني عن أي شيء!`
      : ` We have ${itemCount} items available. Ask me anything!`
    : '';
  
  const messages: Record<string, { en: string; ar: string }> = {
    ecommerce: {
      en: `👋 Welcome to ${title}! I'm your smart shopping assistant.${itemSuffix || ' How can I help you today?'}`,
      ar: `👋 مرحباً بك في ${title}! أنا مساعدك الذكي للتسوق.${itemSuffix || ' كيف يمكنني مساعدتك اليوم؟'}`,
    },
    showroom: {
      en: `✨ Welcome to ${title}! I'm your interior design consultant.${itemSuffix || ' What are you looking for?'}`,
      ar: `✨ مرحباً بك في ${title}! أنا مستشارك للتصميم الداخلي.${itemSuffix || ' ماذا تبحث؟'}`,
    },
    cafe: {
      en: `☕ Welcome to ${title}! I'm your friendly host.${itemSuffix || ' What can I get you today?'}`,
      ar: `☕ مرحباً بك في ${title}! أنا مضيفك الودود.${itemSuffix || ' ماذا يمكنني أن أحضر لك اليوم؟'}`,
    },
    hotel: {
      en: `🏨 Welcome to ${title}! I'm your concierge.${itemSuffix || ' How may I assist you?'}`,
      ar: `🏨 مرحباً بك في ${title}! أنا الكونسيرج الخاص بك.${itemSuffix || ' كيف يمكنني مساعدتك؟'}`,
    },
    realestate: {
      en: `🏠 Welcome to ${title}! I'm your property specialist.${itemSuffix || ' What would you like to know?'}`,
      ar: `🏠 مرحباً بك في ${title}! أنا متخصص العقارات.${itemSuffix || ' ماذا تريد أن تعرف؟'}`,
    },
  };
  
  const message = messages[demoType] || messages.ecommerce;
  return isArabic ? message.ar : message.en;
}

// Initial suggestions based on demo type (client-side only)
function getInitialSuggestions(demoType: string, locale: string): string[] {
  const isArabic = locale === 'ar';
  
  const suggestions: Record<string, { en: string[]; ar: string[] }> = {
    ecommerce: {
      en: ['What products do you have?', 'Show me your best deals', 'How can I contact you?'],
      ar: ['ما هي المنتجات المتوفرة؟', 'أرني أفضل العروض', 'كيف يمكنني الاتصال بكم؟'],
    },
    showroom: {
      en: ['Show me your collections', 'What styles are available?', 'Can I see pricing?'],
      ar: ['أرني مجموعاتكم', 'ما الأنماط المتاحة؟', 'هل يمكنني رؤية الأسعار؟'],
    },
    cafe: {
      en: ["What's on the menu?", 'Any specials today?', 'I need recommendations'],
      ar: ['ما في القائمة؟', 'هل لديكم عروض اليوم؟', 'أحتاج توصيات'],
    },
    hotel: {
      en: ['Show me available rooms', 'What amenities do you have?', 'I want to book'],
      ar: ['أرني الغرف المتاحة', 'ما المرافق لديكم؟', 'أريد الحجز'],
    },
    realestate: {
      en: ['Tell me about this property', "What's the price?", 'Schedule a viewing'],
      ar: ['أخبرني عن هذا العقار', 'ما السعر؟', 'حدد موعد معاينة'],
    },
  };
  
  const typeSuggestions = suggestions[demoType] || suggestions.ecommerce;
  return isArabic ? typeSuggestions.ar : typeSuggestions.en;
}
