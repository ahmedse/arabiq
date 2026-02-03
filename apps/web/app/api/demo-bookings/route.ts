/**
 * Demo Bookings API Route
 * Proxies booking requests to Strapi
 */

import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const required = ['demoId', 'roomId', 'customerName', 'customerEmail', 'customerPhone', 'checkInDate', 'checkOutDate', 'guests', 'nights', 'totalAmount'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { message: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Submit to Strapi
    const response = await fetch(`${STRAPI_URL}/api/demo-bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({
        data: {
          demo: body.demoId,
          room: body.roomId,
          roomName: body.roomName,
          customerName: body.customerName,
          customerEmail: body.customerEmail,
          customerPhone: body.customerPhone,
          checkInDate: body.checkInDate,
          checkOutDate: body.checkOutDate,
          guests: body.guests,
          nights: body.nights,
          totalAmount: body.totalAmount,
          currency: body.currency || 'EGP',
          specialRequests: body.specialRequests || '',
          status: 'pending',
        },
      }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Strapi booking error:', error);
      return NextResponse.json(
        { message: error?.error?.message || 'Failed to create booking' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    
    return NextResponse.json({
      bookingNumber: result.data?.bookingNumber || `BKG-${Date.now()}`,
      id: result.data?.id,
    });
  } catch (error) {
    console.error('Booking API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
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
        { message: 'demoId is required' },
        { status: 400 }
      );
    }
    
    const response = await fetch(
      `${STRAPI_URL}/api/demo-bookings?filters[demo][id][$eq]=${demoId}&populate=room&sort=createdAt:desc`,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }
    
    const result = await response.json();
    
    const bookings = (result.data || []).map((item: any) => ({
      id: item.id,
      bookingNumber: item.bookingNumber,
      customerName: item.customerName,
      customerEmail: item.customerEmail,
      customerPhone: item.customerPhone,
      checkInDate: item.checkInDate,
      checkOutDate: item.checkOutDate,
      guests: item.guests,
      nights: item.nights,
      totalAmount: item.totalAmount,
      currency: item.currency,
      specialRequests: item.specialRequests,
      status: item.status,
      createdAt: item.createdAt,
      room: item.room ? { id: item.room.id, name: item.room.name } : null,
    }));
    
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Fetch bookings error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
