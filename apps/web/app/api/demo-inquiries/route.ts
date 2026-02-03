/**
 * Demo Inquiries API Route
 * Proxies inquiry submissions to Strapi
 */

import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { 
      demoId, 
      propertyTitle,
      customerName, 
      customerEmail, 
      customerPhone,
    } = body;
    
    if (!demoId || !propertyTitle || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: { message: 'Missing required fields' } },
        { status: 400 }
      );
    }
    
    // Submit to Strapi
    const response = await fetch(`${STRAPI_URL}/api/demo-inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({
        data: {
          demo: demoId,
          propertyTitle,
          customerName,
          customerEmail,
          customerPhone,
          message: body.message || '',
          preferredContact: body.preferredContact || 'email',
          status: 'new',
        },
      }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Strapi inquiry error:', error);
      return NextResponse.json(
        { error: error.error || { message: 'Failed to submit inquiry' } },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    
    return NextResponse.json({
      id: result.data.id,
      inquiryNumber: result.data.inquiryNumber || `INQ-${Date.now()}`,
    });
    
  } catch (error) {
    console.error('[API] Inquiry submission error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const demoId = searchParams.get('demoId');
    
    if (!demoId) {
      return NextResponse.json(
        { error: { message: 'demoId is required' } },
        { status: 400 }
      );
    }
    
    const response = await fetch(
      `${STRAPI_URL}/api/demo-inquiries?filters[demo][id][$eq]=${demoId}&sort=createdAt:desc`,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch inquiries');
    }
    
    const result = await response.json();
    
    const inquiries = (result.data || []).map((item: Record<string, unknown>) => ({
      id: item.id,
      inquiryNumber: item.inquiryNumber,
      propertyTitle: item.propertyTitle,
      customerName: item.customerName,
      customerEmail: item.customerEmail,
      customerPhone: item.customerPhone,
      message: item.message,
      preferredContact: item.preferredContact,
      status: item.status,
      createdAt: item.createdAt,
    }));
    
    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error('[API] Fetch inquiries error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
