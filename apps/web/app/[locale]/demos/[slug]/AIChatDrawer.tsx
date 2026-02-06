'use client';

/**
 * AI Chat Drawer
 * Sliding panel with AI-powered chat interface for virtual tours
 * Features:
 * - Product-aware AI responses
 * - Navigation commands to fly to products in the tour
 * - Bilingual support (English/Arabic)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles, Trash2, Navigation } from 'lucide-react';
import type { DemoConfig, TourItem } from '@/lib/matterport/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  // Navigation command from AI
  navigation?: {
    action: 'flyTo';
    itemId: number;
    itemName: string;
  };
}

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  demo: DemoConfig;
  currentLocation?: string;
  locale: string;
  // NEW: Items in the tour for AI context
  items?: TourItem[];
  // NEW: Callback to navigate to an item
  onNavigateToItem?: (item: TourItem) => void;
}

export function AIChatDrawer({ isOpen, onClose, demo, currentLocation, locale, items = [], onNavigateToItem }: AIChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
  
  // Add welcome message when drawer first opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = getWelcomeMessage(demo.demoType, demo.title, locale, items.length);
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, messages.length, demo.demoType, demo.title, locale, items.length]);
  
  // Handle navigation command from AI
  const handleNavigation = useCallback((navigation: ChatMessage['navigation']) => {
    if (!navigation || !onNavigateToItem) return;
    
    const item = items.find(i => i.id === navigation.itemId);
    if (item) {
      onNavigateToItem(item);
    }
  }, [items, onNavigateToItem]);
  
  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Prepare history (exclude welcome message)
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
      
      // Prepare items for AI context
      const itemsContext = items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        currency: item.currency,
        category: item.category,
      }));
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedInput,
          demoId: demo.id,
          demoType: demo.demoType,
          demoTitle: demo.title,
          businessName: demo.businessName,
          currentLocation,
          history,
          locale,
          items: itemsContext, // Pass items for AI context
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Add assistant message (with navigation if present)
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        navigation: data.navigation, // Navigation command from AI
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Auto-trigger navigation if AI suggested it
      if (data.navigation) {
        handleNavigation(data.navigation);
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
  };
  
  const labels = {
    title: locale === 'ar' ? 'المساعد الذكي' : 'AI Assistant',
    placeholder: locale === 'ar' ? 'اكتب رسالتك...' : 'Type your message...',
    send: locale === 'ar' ? 'إرسال' : 'Send',
    clearChat: locale === 'ar' ? 'مسح المحادثة' : 'Clear chat',
    typing: locale === 'ar' ? 'جاري الكتابة...' : 'Typing...',
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
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
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
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Navigation button if AI suggested to fly to a product */}
                  {message.navigation && onNavigateToItem && (
                    <button
                      onClick={() => handleNavigation(message.navigation)}
                      className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-full text-xs text-white transition-colors"
                    >
                      <Navigation className="w-3 h-3" />
                      {locale === 'ar' 
                        ? `الذهاب إلى ${message.navigation.itemName}`
                        : `Go to ${message.navigation.itemName}`
                      }
                    </button>
                  )}
                  
                  <p className="text-xs opacity-50 mt-1">
                    {message.timestamp.toLocaleTimeString(locale, { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
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
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
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
              onKeyPress={handleKeyPress}
              placeholder={labels.placeholder}
              disabled={isLoading}
              className="flex-1 bg-gray-800 text-white rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            <button
              onClick={sendMessage}
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

// Welcome message based on demo type
function getWelcomeMessage(demoType: string, title: string, locale: string, itemCount: number = 0): string {
  const isArabic = locale === 'ar';
  
  // Item count suffix
  const itemSuffix = itemCount > 0
    ? isArabic 
      ? ` لدينا ${itemCount} عنصر متاح. اسألني عن أي شيء أو قل "أرني شيئاً" وسآخذك إليه في الجولة!`
      : ` We have ${itemCount} items available. Ask me about anything or say "show me something" and I'll take you there in the tour!`
    : '';
  
  const messages: Record<string, { en: string; ar: string }> = {
    ecommerce: {
      en: `👋 Welcome to ${title}! I'm your smart shopping assistant.${itemSuffix || ' How can I help you find the perfect product today?'}`,
      ar: `👋 مرحباً بك في ${title}! أنا مساعدك الذكي للتسوق.${itemSuffix || ' كيف يمكنني مساعدتك في العثور على المنتج المثالي اليوم؟'}`,
    },
    showroom: {
      en: `✨ Welcome to ${title}! I'm your interior design consultant.${itemSuffix || ' Looking for something specific, or shall I show you our featured collections?'}`,
      ar: `✨ مرحباً بك في ${title}! أنا مستشارك للتصميم الداخلي.${itemSuffix || ' هل تبحث عن شيء محدد، أم أعرض عليك مجموعاتنا المميزة؟'}`,
    },
    cafe: {
      en: `☕ Welcome to ${title}! I'm your friendly host.${itemSuffix || ' Would you like to hear about today\'s specials, or can I help you find something on our menu?'}`,
      ar: `☕ مرحباً بك في ${title}! أنا مضيفك الودود.${itemSuffix || ' هل تريد معرفة عروض اليوم، أم يمكنني مساعدتك في اختيار شيء من قائمتنا؟'}`,
    },
    hotel: {
      en: `🏨 Welcome to ${title}! I'm your concierge.${itemSuffix || ' How may I assist you today? Looking for room information or ready to make a booking?'}`,
      ar: `🏨 مرحباً بك في ${title}! أنا الكونسيرج الخاص بك.${itemSuffix || ' كيف يمكنني مساعدتك اليوم؟ هل تبحث عن معلومات الغرف أو جاهز للحجز؟'}`,
    },
    realestate: {
      en: `🏠 Welcome to ${title}! I'm your property specialist.${itemSuffix || ' I\'m here to answer any questions about this property. What would you like to know?'}`,
      ar: `🏠 مرحباً بك في ${title}! أنا متخصص العقارات الخاص بك.${itemSuffix || ' أنا هنا للإجابة على أي أسئلة حول هذا العقار. ماذا تريد أن تعرف؟'}`,
    },
  };
  
  const message = messages[demoType] || messages.ecommerce;
  return isArabic ? message.ar : message.en;
}
