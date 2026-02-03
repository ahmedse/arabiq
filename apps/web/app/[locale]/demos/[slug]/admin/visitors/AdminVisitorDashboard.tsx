'use client';

/**
 * Admin Visitor Dashboard
 * Real-time view of visitors in the virtual store with engagement capabilities
 */

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Users,
  Eye,
  ShoppingCart,
  MessageCircle,
  MapPin,
  Clock,
  TrendingUp,
  DollarSign,
  Activity,
  Send,
  RefreshCw,
  Filter,
  MoreVertical,
  Zap,
} from 'lucide-react';
import type { DemoConfig } from '@/lib/matterport/types';

interface Visitor {
  sessionId: string;
  name: string;
  position: { x: number; y: number; z: number } | null;
  sweepId: string | null;
  cartItems: number;
  cartTotal: number;
  viewedProducts: string[];
  joinedAt: string;
  lastActivity: string;
  isActive: boolean;
  country?: string;
}

interface DashboardStats {
  liveVisitors: number;
  totalToday: number;
  cartAbandonment: number;
  avgSessionDuration: number;
  topProducts: { name: string; views: number }[];
  conversions: number;
}

interface AdminVisitorDashboardProps {
  demo: DemoConfig;
  locale: string;
}

export function AdminVisitorDashboard({ demo, locale }: AdminVisitorDashboardProps) {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'cart'>('all');
  
  const isRtl = locale === 'ar';

  // Fetch visitors
  const fetchVisitors = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/demos/${demo.slug}/visitors`);
      if (response.ok) {
        const data = await response.json();
        setVisitors(data.visitors || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch visitors:', error);
    } finally {
      setIsLoading(false);
    }
  }, [demo.slug]);

  // Auto-refresh visitors
  useEffect(() => {
    fetchVisitors();
    
    if (autoRefresh) {
      const interval = setInterval(fetchVisitors, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchVisitors, autoRefresh]);

  // Filter visitors
  const filteredVisitors = visitors.filter((v) => {
    if (filter === 'active') return v.isActive;
    if (filter === 'cart') return v.cartItems > 0;
    return true;
  });

  // Send message to visitor
  const sendMessage = async () => {
    if (!selectedVisitor || !chatMessage.trim()) return;
    
    try {
      await fetch(`/api/admin/demos/${demo.slug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedVisitor.sessionId,
          message: chatMessage,
          isAdmin: true,
        }),
      });
      setChatMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Navigate visitor to a product (if we have control)
  const guideVisitor = async (visitor: Visitor, productId: number) => {
    try {
      await fetch(`/api/admin/demos/${demo.slug}/guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: visitor.sessionId,
          action: 'navigate',
          productId,
        }),
      });
    } catch (error) {
      console.error('Failed to guide visitor:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return isRtl ? 'الآن' : 'now';
    if (mins < 60) return isRtl ? `${mins} دقيقة` : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return isRtl ? `${hours} ساعة` : `${hours}h ago`;
  };

  return (
    <div className={`min-h-screen bg-gray-100 ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/demos/${demo.slug}/admin`}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {isRtl ? 'لوحة الزوار' : 'Visitor Dashboard'}
                </h1>
                <p className="text-sm text-gray-500">{demo.title}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Auto-refresh toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                {isRtl ? 'تحديث تلقائي' : 'Auto-refresh'}
              </button>
              
              {/* Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">{isRtl ? 'الكل' : 'All Visitors'}</option>
                <option value="active">{isRtl ? 'نشط الآن' : 'Active Now'}</option>
                <option value="cart">{isRtl ? 'لديه سلة' : 'Has Cart'}</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.liveVisitors}</p>
                  <p className="text-xs text-gray-500">{isRtl ? 'مباشر الآن' : 'Live Now'}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalToday}</p>
                  <p className="text-xs text-gray-500">{isRtl ? 'اليوم' : 'Today'}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ShoppingCart className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.cartAbandonment}%</p>
                  <p className="text-xs text-gray-500">{isRtl ? 'سلات متروكة' : 'Cart Abandon'}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatDuration(stats.avgSessionDuration)}</p>
                  <p className="text-xs text-gray-500">{isRtl ? 'متوسط الجلسة' : 'Avg Session'}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.conversions}</p>
                  <p className="text-xs text-gray-500">{isRtl ? 'تحويلات' : 'Conversions'}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 truncate">{stats.topProducts[0]?.name || '-'}</p>
                  <p className="text-xs text-gray-500">{isRtl ? 'الأكثر مشاهدة' : 'Most Viewed'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visitor List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                {isRtl ? 'الزوار' : 'Visitors'} ({filteredVisitors.length})
              </h2>
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                {isRtl ? 'جاري التحميل...' : 'Loading...'}
              </div>
            ) : filteredVisitors.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>{isRtl ? 'لا يوجد زوار حاليًا' : 'No visitors right now'}</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredVisitors.map((visitor) => (
                  <div
                    key={visitor.sessionId}
                    onClick={() => setSelectedVisitor(visitor)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedVisitor?.sessionId === visitor.sessionId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Status dot */}
                        <div className={`w-3 h-3 rounded-full ${
                          visitor.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                        }`} />
                        
                        <div>
                          <p className="font-medium text-gray-900">{visitor.name}</p>
                          <p className="text-xs text-gray-500">
                            {getTimeSince(visitor.lastActivity)}
                            {visitor.country && ` • ${visitor.country}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Viewed products */}
                        <div className="flex items-center gap-1 text-gray-500" title={`${visitor.viewedProducts.length} products viewed`}>
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">{visitor.viewedProducts.length}</span>
                        </div>
                        
                        {/* Cart */}
                        {visitor.cartItems > 0 && (
                          <div className="flex items-center gap-1 text-orange-600" title={formatCurrency(visitor.cartTotal)}>
                            <ShoppingCart className="w-4 h-4" />
                            <span className="text-sm font-medium">{visitor.cartItems}</span>
                          </div>
                        )}
                        
                        {/* Position indicator */}
                        {visitor.position && (
                          <div className="text-blue-500" title="In tour">
                            <MapPin className="w-4 h-4" />
                          </div>
                        )}
                        
                        {/* Chat button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVisitor(visitor);
                          }}
                          className="p-1.5 hover:bg-blue-100 rounded-full text-blue-600"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Cart preview */}
                    {visitor.cartItems > 0 && (
                      <div className="mt-2 p-2 bg-orange-50 rounded-lg text-sm">
                        <span className="text-orange-700 font-medium">
                          {isRtl ? 'السلة:' : 'Cart:'} {formatCurrency(visitor.cartTotal)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Visitor Detail / Chat */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {selectedVisitor ? (
              <>
                <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{selectedVisitor.name}</h3>
                      <p className="text-sm text-blue-100">
                        {isRtl ? 'انضم' : 'Joined'} {getTimeSince(selectedVisitor.joinedAt)}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      selectedVisitor.isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                    }`} />
                  </div>
                </div>
                
                {/* Visitor stats */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{selectedVisitor.viewedProducts.length}</p>
                      <p className="text-xs text-gray-500">{isRtl ? 'منتجات' : 'Products'}</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{selectedVisitor.cartItems}</p>
                      <p className="text-xs text-gray-500">{isRtl ? 'السلة' : 'In Cart'}</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedVisitor.cartTotal)}</p>
                      <p className="text-xs text-gray-500">{isRtl ? 'القيمة' : 'Value'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Quick actions */}
                <div className="p-4 border-b">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    {isRtl ? 'إجراءات سريعة' : 'Quick Actions'}
                  </p>
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                      <Zap className="w-3.5 h-3.5" />
                      {isRtl ? 'عرض خاص' : 'Send Offer'}
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                      <MapPin className="w-3.5 h-3.5" />
                      {isRtl ? 'دليل' : 'Guide'}
                    </button>
                  </div>
                </div>
                
                {/* Chat */}
                <div className="flex-1 p-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    {isRtl ? 'إرسال رسالة' : 'Send Message'}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder={isRtl ? 'اكتب رسالة...' : 'Type a message...'}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!chatMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Viewed products */}
                {selectedVisitor.viewedProducts.length > 0 && (
                  <div className="p-4 border-t bg-gray-50">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      {isRtl ? 'المنتجات المعروضة' : 'Viewed Products'}
                    </p>
                    <div className="space-y-1">
                      {selectedVisitor.viewedProducts.slice(0, 5).map((product, i) => (
                        <p key={i} className="text-sm text-gray-700 truncate">{product}</p>
                      ))}
                      {selectedVisitor.viewedProducts.length > 5 && (
                        <p className="text-xs text-gray-400">
                          +{selectedVisitor.viewedProducts.length - 5} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>{isRtl ? 'اختر زائرًا للتفاعل' : 'Select a visitor to engage'}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminVisitorDashboard;
