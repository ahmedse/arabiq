/**
 * Admin Visitors API Route
 * Fetches live visitor data for the admin dashboard
 * Uses the shared presence store
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVisitors } from '@/lib/presence/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Get visitors from the shared presence store
    const visitors = getVisitors(slug);
    
    // Calculate stats
    const liveVisitors = visitors.filter(v => v.isActive).length;
    const totalToday = visitors.length;
    const cartsAbandoned = visitors.filter(v => v.cartItems > 0 && !v.isActive).length;
    const cartsTotal = visitors.filter(v => v.cartItems > 0).length;
    const cartAbandonment = cartsTotal > 0 ? Math.round((cartsAbandoned / cartsTotal) * 100) : 0;
    
    // Avg session duration (mock)
    const avgSessionDuration = 180 + Math.floor(Math.random() * 120);
    
    // Top products (mock)
    const productViews = new Map<string, number>();
    visitors.forEach(v => {
      v.viewedProducts.forEach(p => {
        productViews.set(p, (productViews.get(p) || 0) + 1);
      });
    });
    const topProducts = Array.from(productViews.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, views]) => ({ name, views }));
    
    // Conversions (mock)
    const conversions = Math.floor(visitors.length * 0.05);
    
    return NextResponse.json({
      visitors,
      stats: {
        liveVisitors,
        totalToday,
        cartAbandonment,
        avgSessionDuration,
        topProducts,
        conversions,
      },
    });
  } catch (error) {
    console.error('[Admin Visitors API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visitors' },
      { status: 500 }
    );
  }
}
