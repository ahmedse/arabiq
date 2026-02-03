'use client';

/**
 * Dashboard Overview Component
 * Stats cards for demo dashboard
 */

import React from 'react';
import { StatCard } from '@/components/dashboard';
import { 
  ShoppingCart, 
  Users, 
  DollarSign, 
  Clock,
  TrendingUp,
  Eye
} from 'lucide-react';
import type { DashboardStats } from '@/lib/api/dashboard';

interface DashboardOverviewProps {
  stats: DashboardStats;
  demoType: string;
  locale: string;
}

export function DashboardOverview({ stats, demoType, locale }: DashboardOverviewProps) {
  const isRTL = locale === 'ar';
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  // Labels based on demo type
  const getLabels = () => {
    switch (demoType) {
      case 'hotel':
        return {
          orders: isRTL ? 'إجمالي الحجوزات' : 'Total Bookings',
          pending: isRTL ? 'حجوزات معلقة' : 'Pending Bookings',
          today: isRTL ? 'حجوزات اليوم' : "Today's Bookings",
        };
      case 'cafe':
        return {
          orders: isRTL ? 'إجمالي الحجوزات' : 'Total Reservations',
          pending: isRTL ? 'حجوزات معلقة' : 'Pending Reservations',
          today: isRTL ? 'حجوزات اليوم' : "Today's Reservations",
        };
      case 'realestate':
      case 'training':
        return {
          orders: isRTL ? 'إجمالي الاستفسارات' : 'Total Inquiries',
          pending: isRTL ? 'استفسارات معلقة' : 'Pending Inquiries',
          today: isRTL ? 'استفسارات اليوم' : "Today's Inquiries",
        };
      default:
        return {
          orders: isRTL ? 'إجمالي الطلبات' : 'Total Orders',
          pending: isRTL ? 'طلبات معلقة' : 'Pending Orders',
          today: isRTL ? 'طلبات اليوم' : "Today's Orders",
        };
    }
  };
  
  const labels = getLabels();
  
  const t = {
    revenue: isRTL ? 'إجمالي الإيرادات' : 'Total Revenue',
    visitors: isRTL ? 'الزوار النشطين' : 'Active Visitors',
  };
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <StatCard
        label={labels.orders}
        value={stats.totalOrders}
        icon={ShoppingCart}
        color="primary"
      />
      
      <StatCard
        label={labels.pending}
        value={stats.pendingOrders}
        icon={Clock}
        color={stats.pendingOrders > 0 ? 'warning' : 'default'}
      />
      
      <StatCard
        label={labels.today}
        value={stats.todayOrders}
        icon={TrendingUp}
        color="success"
      />
      
      <StatCard
        label={t.revenue}
        value={formatCurrency(stats.totalRevenue)}
        icon={DollarSign}
        color="default"
      />
      
      <StatCard
        label={t.visitors}
        value={stats.activeVisitors}
        icon={Eye}
        color={stats.activeVisitors > 0 ? 'success' : 'default'}
      />
    </div>
  );
}
