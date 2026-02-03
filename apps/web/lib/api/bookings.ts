/**
 * Booking API functions
 * For hotel room bookings
 */

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || '';

interface BookingData {
  demoId: number;
  roomId: number;
  roomName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  nights: number;
  totalAmount: number;
  currency: string;
  specialRequests?: string;
}

interface BookingResult {
  bookingNumber: string;
  id: number;
}

export async function submitBooking(data: BookingData): Promise<BookingResult> {
  const response = await fetch(`${API_BASE}/api/demo-bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to submit booking');
  }

  return response.json();
}

interface DemoBooking {
  id: number;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  nights: number;
  totalAmount: number;
  currency: string;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  room?: {
    id: number;
    name: string;
  };
}

export async function fetchDemoBookings(demoId: number): Promise<DemoBooking[]> {
  const params = new URLSearchParams({
    demoId: demoId.toString(),
  });
  
  const response = await fetch(`${API_BASE}/api/demo-bookings?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch bookings');
  }
  
  const data = await response.json();
  return data.bookings || [];
}
