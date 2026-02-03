'use client';

/**
 * Orders Table Component
 * Displays orders/bookings/inquiries with search and filter
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown,
  Mail,
  Phone,
  Eye,
  MoreHorizontal,
  ShoppingCart,
  Calendar,
  MessageSquare,
  UtensilsCrossed
} from 'lucide-react';
import type { OrderItem } from '@/lib/api/dashboard';

interface OrdersTableProps {
  demoId: number;
  demoType: string;
  initialOrders: OrderItem[];
  locale: string;
}

const typeIcons = {
  order: ShoppingCart,
  booking: Calendar,
  inquiry: MessageSquare,
  reservation: UtensilsCrossed,
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  new: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export function OrdersTable({ 
  demoId, 
  demoType, 
  initialOrders,
  locale 
}: OrdersTableProps) {
  const isRTL = locale === 'ar';
  const [orders, setOrders] = useState<OrderItem[]>(initialOrders);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  
  const t = {
    search: isRTL ? 'بحث...' : 'Search...',
    allTypes: isRTL ? 'جميع الأنواع' : 'All Types',
    allStatus: isRTL ? 'جميع الحالات' : 'All Status',
    order: isRTL ? 'طلب' : 'Order',
    booking: isRTL ? 'حجز' : 'Booking',
    inquiry: isRTL ? 'استفسار' : 'Inquiry',
    reservation: isRTL ? 'حجز طاولة' : 'Reservation',
    customer: isRTL ? 'العميل' : 'Customer',
    type: isRTL ? 'النوع' : 'Type',
    status: isRTL ? 'الحالة' : 'Status',
    date: isRTL ? 'التاريخ' : 'Date',
    total: isRTL ? 'المجموع' : 'Total',
    actions: isRTL ? 'إجراءات' : 'Actions',
    noOrders: isRTL ? 'لا توجد طلبات' : 'No orders found',
    viewDetails: isRTL ? 'عرض التفاصيل' : 'View Details',
    close: isRTL ? 'إغلاق' : 'Close',
  };
  
  // Filter orders locally
  const filteredOrders = orders.filter(order => {
    const matchesSearch = search === '' || 
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.referenceNumber.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || order.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  const formatCurrency = (amount?: number, currency?: string) => {
    if (!amount) return '-';
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'} w-4 h-4 text-muted-foreground`} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary`}
          />
        </div>
        
        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">{t.allTypes}</option>
          <option value="order">{t.order}</option>
          <option value="booking">{t.booking}</option>
          <option value="inquiry">{t.inquiry}</option>
          <option value="reservation">{t.reservation}</option>
        </select>
        
        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">{t.allStatus}</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-xs font-medium text-muted-foreground uppercase`}>
                {t.customer}
              </th>
              <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-xs font-medium text-muted-foreground uppercase`}>
                {t.type}
              </th>
              <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-xs font-medium text-muted-foreground uppercase`}>
                {t.status}
              </th>
              <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-xs font-medium text-muted-foreground uppercase`}>
                {t.date}
              </th>
              <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-xs font-medium text-muted-foreground uppercase`}>
                {t.total}
              </th>
              <th className={`px-4 py-3 text-${isRTL ? 'right' : 'left'} text-xs font-medium text-muted-foreground uppercase`}>
                {t.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  {t.noOrders}
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const TypeIcon = typeIcons[order.type];
                return (
                  <tr key={`${order.type}-${order.id}`} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.referenceNumber}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm capitalize">
                          {t[order.type as keyof typeof t] || order.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(order.date)}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatCurrency(order.total, order.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {order.customerEmail && (
                          <a 
                            href={`mailto:${order.customerEmail}`}
                            className="p-1.5 hover:bg-muted rounded"
                            title="Email"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                        )}
                        {order.customerPhone && (
                          <a 
                            href={`tel:${order.customerPhone}`}
                            className="p-1.5 hover:bg-muted rounded"
                            title="Call"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 hover:bg-muted rounded"
                          title={t.viewDetails}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold">{selectedOrder.referenceNumber}</h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1 hover:bg-muted rounded"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t.customer}</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.status}</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[selectedOrder.status]}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.date}</p>
                  <p>{formatDate(selectedOrder.date)}</p>
                </div>
                {selectedOrder.total && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t.total}</p>
                    <p className="font-bold">{formatCurrency(selectedOrder.total, selectedOrder.currency)}</p>
                  </div>
                )}
              </div>
              
              {selectedOrder.customerEmail && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a href={`mailto:${selectedOrder.customerEmail}`} className="text-primary hover:underline">
                    {selectedOrder.customerEmail}
                  </a>
                </div>
              )}
              
              {selectedOrder.customerPhone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <a href={`tel:${selectedOrder.customerPhone}`} className="text-primary hover:underline">
                    {selectedOrder.customerPhone}
                  </a>
                </div>
              )}
              
              {selectedOrder.details && Object.keys(selectedOrder.details).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Details</p>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedOrder.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
