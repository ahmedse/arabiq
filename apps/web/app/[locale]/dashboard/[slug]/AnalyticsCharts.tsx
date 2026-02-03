'use client';

/**
 * Analytics Charts Component
 * Simple charts for dashboard analytics
 */

import React from 'react';
import { TrendingUp, BarChart3, PieChart } from 'lucide-react';
import type { AnalyticsData } from '@/lib/api/dashboard';

interface AnalyticsChartsProps {
  analytics: AnalyticsData;
  locale: string;
}

export function AnalyticsCharts({ analytics, locale }: AnalyticsChartsProps) {
  const isRTL = locale === 'ar';
  
  const t = {
    dailyVisitors: isRTL ? 'الزوار اليومي' : 'Daily Visitors',
    ordersByStatus: isRTL ? 'الطلبات حسب الحالة' : 'Orders by Status',
    revenueByDay: isRTL ? 'الإيرادات اليومية' : 'Daily Revenue',
    last7Days: isRTL ? 'آخر 7 أيام' : 'Last 7 days',
  };
  
  // Find max values for scaling
  const maxVisitors = Math.max(...analytics.dailyVisitors.map(d => d.count), 1);
  const maxRevenue = Math.max(...analytics.revenueByDay.map(d => d.amount), 1);
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      weekday: 'short',
    });
  };
  
  const formatCurrency = (amount: number) => {
    if (amount === 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      notation: 'compact',
    }).format(amount);
  };
  
  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    confirmed: '#22c55e',
    completed: '#3b82f6',
    cancelled: '#ef4444',
    new: '#8b5cf6',
  };
  
  const totalOrders = analytics.ordersByStatus.reduce((sum, s) => sum + s.count, 0);
  
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Daily Visitors Bar Chart */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">{t.dailyVisitors}</h3>
          <span className="text-sm text-muted-foreground">({t.last7Days})</span>
        </div>
        
        <div className="flex items-end justify-between gap-2 h-40">
          {analytics.dailyVisitors.map((day, i) => (
            <div 
              key={day.date}
              className="flex-1 flex flex-col items-center gap-2"
            >
              <span className="text-xs text-muted-foreground">
                {day.count}
              </span>
              <div 
                className="w-full bg-primary/20 rounded-t relative overflow-hidden"
                style={{ height: `${(day.count / maxVisitors) * 100}%`, minHeight: '4px' }}
              >
                <div 
                  className="absolute inset-0 bg-primary"
                  style={{ 
                    opacity: 0.5 + (i / analytics.dailyVisitors.length) * 0.5 
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(day.date)}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Revenue Bar Chart */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-green-500" />
          <h3 className="font-semibold">{t.revenueByDay}</h3>
          <span className="text-sm text-muted-foreground">({t.last7Days})</span>
        </div>
        
        <div className="flex items-end justify-between gap-2 h-40">
          {analytics.revenueByDay.map((day, i) => (
            <div 
              key={day.date}
              className="flex-1 flex flex-col items-center gap-2"
            >
              <span className="text-xs text-muted-foreground">
                {formatCurrency(day.amount)}
              </span>
              <div 
                className="w-full bg-green-500/20 rounded-t relative overflow-hidden"
                style={{ height: `${(day.amount / maxRevenue) * 100}%`, minHeight: '4px' }}
              >
                <div 
                  className="absolute inset-0 bg-green-500"
                  style={{ 
                    opacity: 0.5 + (i / analytics.revenueByDay.length) * 0.5 
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(day.date)}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Orders by Status */}
      {analytics.ordersByStatus.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold">{t.ordersByStatus}</h3>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {/* Simple horizontal bar representation */}
            <div className="flex-1 min-w-[200px]">
              <div className="h-8 flex rounded-lg overflow-hidden">
                {analytics.ordersByStatus.map((status) => (
                  <div
                    key={status.status}
                    className="h-full flex items-center justify-center text-xs text-white font-medium"
                    style={{ 
                      width: `${(status.count / totalOrders) * 100}%`,
                      backgroundColor: statusColors[status.status] || '#6b7280',
                      minWidth: status.count > 0 ? '40px' : '0'
                    }}
                  >
                    {status.count > 0 && status.count}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4">
              {analytics.ordersByStatus.map((status) => (
                <div key={status.status} className="flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: statusColors[status.status] || '#6b7280' }}
                  />
                  <span className="text-sm capitalize">{status.status}</span>
                  <span className="text-sm text-muted-foreground">({status.count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
