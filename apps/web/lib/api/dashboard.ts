/**
 * Dashboard API Functions
 * Fetch demos, orders, stats for business owners
 */

import 'server-only';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';

interface StrapiResponse<T> {
  data: T[];
  meta?: {
    pagination?: {
      total: number;
      page: number;
      pageSize: number;
      pageCount: number;
    };
  };
}

// ============================================================================
// TYPES
// ============================================================================

export interface DemoSummary {
  id: number;
  slug: string;
  title: string;
  demoType: string;
  isActive: boolean;
  featuredImage?: string;
  stats: {
    orders: number;
    bookings: number;
    inquiries: number;
    reservations: number;
    revenue: number;
  };
}

export interface OrderItem {
  id: number;
  type: 'order' | 'booking' | 'inquiry' | 'reservation';
  referenceNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  status: string;
  total?: number;
  currency?: string;
  date: string;
  createdAt: string;
  details?: Record<string, unknown>;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  todayOrders: number;
  activeVisitors: number;
}

// ============================================================================
// HELPER
// ============================================================================

async function fetchFromCms<T>(endpoint: string): Promise<T | null> {
  try {
    const url = `${STRAPI_URL}${endpoint}`;
    const res = await fetch(url, {
      headers: STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {},
      next: { revalidate: 30 },
    });
    
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('[Dashboard API] Fetch error:', error);
    return null;
  }
}

// ============================================================================
// DEMOS FOR OWNER
// ============================================================================

interface StrapiDemo {
  id: number;
  slug: string;
  title: string;
  demoType: string;
  isActive: boolean;
  featuredImage?: { url: string };
  ownerUser?: { id: number };
}

/**
 * Get all demos owned by a user
 */
export async function getOwnerDemos(userId: number, locale: string): Promise<DemoSummary[]> {
  const endpoint = `/api/demos?filters[ownerUser][id][$eq]=${userId}&locale=${locale}&populate=featuredImage`;
  const response = await fetchFromCms<StrapiResponse<StrapiDemo>>(endpoint);
  
  if (!response?.data) return [];
  
  // Fetch stats for each demo
  const demos = await Promise.all(
    response.data.map(async (demo) => {
      const stats = await getDemoStats(demo.id);
      return {
        id: demo.id,
        slug: demo.slug,
        title: demo.title,
        demoType: demo.demoType,
        isActive: demo.isActive ?? true,
        featuredImage: demo.featuredImage?.url 
          ? `${STRAPI_URL}${demo.featuredImage.url}`
          : undefined,
        stats,
      };
    })
  );
  
  return demos;
}

/**
 * Get a single demo by slug for owner
 */
export async function getOwnerDemoBySlug(
  userId: number, 
  slug: string, 
  locale: string
): Promise<DemoSummary | null> {
  const endpoint = `/api/demos?filters[slug][$eq]=${slug}&filters[ownerUser][id][$eq]=${userId}&locale=${locale}&populate=featuredImage`;
  const response = await fetchFromCms<StrapiResponse<StrapiDemo>>(endpoint);
  
  const demo = response?.data?.[0];
  if (!demo) return null;
  
  const stats = await getDemoStats(demo.id);
  
  return {
    id: demo.id,
    slug: demo.slug,
    title: demo.title,
    demoType: demo.demoType,
    isActive: demo.isActive ?? true,
    featuredImage: demo.featuredImage?.url 
      ? `${STRAPI_URL}${demo.featuredImage.url}`
      : undefined,
    stats,
  };
}

// ============================================================================
// STATS
// ============================================================================

interface StatsResult {
  orders: number;
  bookings: number;
  inquiries: number;
  reservations: number;
  revenue: number;
}

/**
 * Get stats for a demo
 */
async function getDemoStats(demoId: number): Promise<StatsResult> {
  const [orders, bookings, inquiries, reservations] = await Promise.all([
    fetchFromCms<StrapiResponse<{ total?: number }>>(`/api/demo-orders?filters[demo][id][$eq]=${demoId}&pagination[pageSize]=1`),
    fetchFromCms<StrapiResponse<{ totalPrice?: number }>>(`/api/demo-bookings?filters[demo][id][$eq]=${demoId}&pagination[pageSize]=1`),
    fetchFromCms<StrapiResponse<unknown>>(`/api/demo-inquiries?filters[demo][id][$eq]=${demoId}&pagination[pageSize]=1`),
    fetchFromCms<StrapiResponse<unknown>>(`/api/demo-reservations?filters[demo][id][$eq]=${demoId}&pagination[pageSize]=1`),
  ]);
  
  // Get order totals for revenue
  const ordersForRevenue = await fetchFromCms<StrapiResponse<{ total: number }>>(`/api/demo-orders?filters[demo][id][$eq]=${demoId}&filters[status][$eq]=completed&pagination[pageSize]=100`);
  const bookingsForRevenue = await fetchFromCms<StrapiResponse<{ totalPrice: number }>>(`/api/demo-bookings?filters[demo][id][$eq]=${demoId}&filters[status][$eq]=confirmed&pagination[pageSize]=100`);
  
  const orderRevenue = ordersForRevenue?.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
  const bookingRevenue = bookingsForRevenue?.data?.reduce((sum, b) => sum + (b.totalPrice || 0), 0) || 0;
  
  return {
    orders: orders?.meta?.pagination?.total || 0,
    bookings: bookings?.meta?.pagination?.total || 0,
    inquiries: inquiries?.meta?.pagination?.total || 0,
    reservations: reservations?.meta?.pagination?.total || 0,
    revenue: orderRevenue + bookingRevenue,
  };
}

/**
 * Get dashboard stats for a demo
 */
export async function getDashboardStats(demoId: number): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0];
  
  const [allOrders, pendingOrders, todayOrders, allBookings] = await Promise.all([
    fetchFromCms<StrapiResponse<{ total: number }>>(`/api/demo-orders?filters[demo][id][$eq]=${demoId}&pagination[pageSize]=100`),
    fetchFromCms<StrapiResponse<unknown>>(`/api/demo-orders?filters[demo][id][$eq]=${demoId}&filters[status][$eq]=pending&pagination[pageSize]=1`),
    fetchFromCms<StrapiResponse<unknown>>(`/api/demo-orders?filters[demo][id][$eq]=${demoId}&filters[createdAt][$gte]=${today}&pagination[pageSize]=1`),
    fetchFromCms<StrapiResponse<{ totalPrice: number }>>(`/api/demo-bookings?filters[demo][id][$eq]=${demoId}&filters[status][$eq]=confirmed&pagination[pageSize]=100`),
  ]);
  
  const orderRevenue = allOrders?.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
  const bookingRevenue = allBookings?.data?.reduce((sum, b) => sum + (b.totalPrice || 0), 0) || 0;
  
  return {
    totalOrders: allOrders?.meta?.pagination?.total || 0,
    totalRevenue: orderRevenue + bookingRevenue,
    pendingOrders: pendingOrders?.meta?.pagination?.total || 0,
    todayOrders: todayOrders?.meta?.pagination?.total || 0,
    activeVisitors: 0, // Will be fetched from presence API
  };
}

// ============================================================================
// ORDERS
// ============================================================================

interface StrapiOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  items?: unknown;
}

interface StrapiBooking {
  id: number;
  bookingNumber: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  status: string;
  totalPrice: number;
  currency: string;
  checkIn: string;
  checkOut: string;
  createdAt: string;
}

interface StrapiInquiry {
  id: number;
  inquiryNumber: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  inquiryType: string;
  message: string;
  createdAt: string;
}

interface StrapiReservation {
  id: number;
  reservationNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  status: string;
  date: string;
  time: string;
  partySize: number;
  createdAt: string;
}

/**
 * Get all orders/bookings/inquiries for a demo
 */
export async function getDemoOrders(
  demoId: number,
  options: {
    type?: 'all' | 'order' | 'booking' | 'inquiry' | 'reservation';
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<{ items: OrderItem[]; total: number }> {
  const { type = 'all', status, search, page = 1, pageSize = 20 } = options;
  
  const items: OrderItem[] = [];
  let total = 0;
  
  // Build filters
  const buildFilters = (searchField: string) => {
    let filters = `filters[demo][id][$eq]=${demoId}`;
    if (status) filters += `&filters[status][$eq]=${status}`;
    if (search) filters += `&filters[${searchField}][$containsi]=${search}`;
    return filters;
  };
  
  const pagination = `&pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=createdAt:desc`;
  
  // Fetch based on type
  if (type === 'all' || type === 'order') {
    const orders = await fetchFromCms<StrapiResponse<StrapiOrder>>(
      `/api/demo-orders?${buildFilters('customerName')}${pagination}`
    );
    if (orders?.data) {
      items.push(...orders.data.map(o => ({
        id: o.id,
        type: 'order' as const,
        referenceNumber: o.orderNumber,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        customerPhone: o.customerPhone,
        status: o.status,
        total: o.total,
        currency: o.currency,
        date: o.createdAt,
        createdAt: o.createdAt,
        details: { items: o.items },
      })));
      total += orders.meta?.pagination?.total || 0;
    }
  }
  
  if (type === 'all' || type === 'booking') {
    const bookings = await fetchFromCms<StrapiResponse<StrapiBooking>>(
      `/api/demo-bookings?${buildFilters('guestName')}${pagination}`
    );
    if (bookings?.data) {
      items.push(...bookings.data.map(b => ({
        id: b.id,
        type: 'booking' as const,
        referenceNumber: b.bookingNumber,
        customerName: b.guestName,
        customerEmail: b.guestEmail,
        customerPhone: b.guestPhone,
        status: b.status,
        total: b.totalPrice,
        currency: b.currency,
        date: b.checkIn,
        createdAt: b.createdAt,
        details: { checkIn: b.checkIn, checkOut: b.checkOut },
      })));
      total += bookings.meta?.pagination?.total || 0;
    }
  }
  
  if (type === 'all' || type === 'inquiry') {
    const inquiries = await fetchFromCms<StrapiResponse<StrapiInquiry>>(
      `/api/demo-inquiries?${buildFilters('name')}${pagination}`
    );
    if (inquiries?.data) {
      items.push(...inquiries.data.map(i => ({
        id: i.id,
        type: 'inquiry' as const,
        referenceNumber: i.inquiryNumber,
        customerName: i.name,
        customerEmail: i.email,
        customerPhone: i.phone,
        status: i.status,
        date: i.createdAt,
        createdAt: i.createdAt,
        details: { inquiryType: i.inquiryType, message: i.message },
      })));
      total += inquiries.meta?.pagination?.total || 0;
    }
  }
  
  if (type === 'all' || type === 'reservation') {
    const reservations = await fetchFromCms<StrapiResponse<StrapiReservation>>(
      `/api/demo-reservations?${buildFilters('customerName')}${pagination}`
    );
    if (reservations?.data) {
      items.push(...reservations.data.map(r => ({
        id: r.id,
        type: 'reservation' as const,
        referenceNumber: r.reservationNumber,
        customerName: r.customerName,
        customerEmail: r.customerEmail,
        customerPhone: r.customerPhone,
        status: r.status,
        date: r.date,
        createdAt: r.createdAt,
        details: { time: r.time, partySize: r.partySize },
      })));
      total += reservations.meta?.pagination?.total || 0;
    }
  }
  
  // Sort by createdAt
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return { items: items.slice(0, pageSize), total };
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface AnalyticsData {
  dailyVisitors: { date: string; count: number }[];
  ordersByStatus: { status: string; count: number }[];
  revenueByDay: { date: string; amount: number }[];
  topProducts: { name: string; count: number }[];
}

/**
 * Get analytics data for a demo
 * Note: This is mock data - real implementation would need visitor tracking
 */
export async function getDemoAnalytics(demoId: number): Promise<AnalyticsData> {
  // Generate last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });
  
  // Fetch orders for the demo
  const orders = await fetchFromCms<StrapiResponse<StrapiOrder>>(
    `/api/demo-orders?filters[demo][id][$eq]=${demoId}&pagination[pageSize]=100&sort=createdAt:desc`
  );
  
  // Calculate orders by status
  const statusCounts: Record<string, number> = {};
  orders?.data?.forEach(o => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });
  
  // Calculate revenue by day
  const revenueByDay: Record<string, number> = {};
  days.forEach(d => { revenueByDay[d] = 0; });
  orders?.data?.forEach(o => {
    const day = o.createdAt.split('T')[0];
    if (revenueByDay[day] !== undefined) {
      revenueByDay[day] += o.total || 0;
    }
  });
  
  return {
    dailyVisitors: days.map(date => ({
      date,
      count: Math.floor(Math.random() * 50) + 10, // Mock data
    })),
    ordersByStatus: Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    })),
    revenueByDay: days.map(date => ({
      date,
      amount: revenueByDay[date] || 0,
    })),
    topProducts: [], // Would need product aggregation
  };
}
