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
    const now = new Date();
    const ACTIVE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
    const liveVisitors = visitors.filter(v => 
      (now.getTime() - new Date(v.lastSeenAt).getTime()) < ACTIVE_THRESHOLD_MS
    ).length;
    const totalToday = visitors.length;
    
    // Cart stats (mock - presence system doesn't track carts)
    const cartAbandonment = 0;
    
    // Avg session duration based on actual connected/lastSeen times
    const avgSessionDuration = visitors.length > 0
      ? Math.round(visitors.reduce((sum, v) => 
          sum + (new Date(v.lastSeenAt).getTime() - new Date(v.connectedAt).getTime()) / 1000, 0
        ) / visitors.length)
      : 0;
    
    // Top locations visitors are viewing
    const locationViews = new Map<string, number>();
    visitors.forEach(v => {
      if (v.currentLocation) {
        locationViews.set(v.currentLocation, (locationViews.get(v.currentLocation) || 0) + 1);
      }
    });
    const topProducts = Array.from(locationViews.entries())
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
