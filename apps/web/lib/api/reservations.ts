/**
 * Reservation API Functions
 * Submit reservations to Strapi CMS
 */

export interface SubmitReservationData {
  demoId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  specialRequests?: string;
}

export interface ReservationResult {
  id: number;
  reservationNumber: string;
}

/**
 * Submit a reservation to the API route
 */
export async function submitReservation(data: SubmitReservationData): Promise<ReservationResult> {
  const response = await fetch('/api/demo-reservations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      demoId: data.demoId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      partySize: data.partySize,
      reservationDate: data.reservationDate,
      reservationTime: data.reservationTime,
      specialRequests: data.specialRequests,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to submit reservation');
  }
  
  const result = await response.json();
  
  return {
    id: result.id,
    reservationNumber: result.reservationNumber,
  };
}

/**
 * Fetch reservations for a demo (admin only)
 */
export async function fetchDemoReservations(demoId: number): Promise<any[]> {
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
  
  const response = await fetch(
    `${strapiUrl}/api/demo-reservations?filters[demo][id][$eq]=${demoId}&sort=reservationDate:asc`,
    {
      next: { revalidate: 60 },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch reservations');
  }
  
  const result = await response.json();
  return result.data || [];
}
