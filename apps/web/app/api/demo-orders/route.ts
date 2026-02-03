/**
 * Demo Orders API Route
 * Proxies order submissions to Strapi
 */

import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { demoId, customerName, customerEmail, customerPhone, items, totalAmount } = body;
    
    if (!demoId || !customerName || !customerEmail || !customerPhone || !items || !totalAmount) {
      return NextResponse.json(
        { error: { message: 'Missing required fields' } },
        { status: 400 }
      );
    }
    
    // Submit to Strapi
    const response = await fetch(`${STRAPI_URL}/api/demo-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(STRAPI_TOKEN && { Authorization: `Bearer ${STRAPI_TOKEN}` }),
      },
      body: JSON.stringify({
        data: {
          demo: demoId,
          customerName,
          customerEmail,
          customerPhone,
          notes: body.notes || '',
          items,
          totalAmount,
          currency: body.currency || 'SAR',
          status: 'pending',
        },
      }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.error || { message: 'Failed to submit order' } },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    
    return NextResponse.json({
      id: result.data.id,
      orderNumber: result.data.orderNumber,
    });
    
  } catch (error) {
    console.error('[API] Order submission error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
