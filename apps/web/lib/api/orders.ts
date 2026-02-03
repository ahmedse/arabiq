/**
 * Order API Functions
 * Submit orders to Strapi CMS
 */

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL || 'http://localhost:1337';

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SubmitOrderData {
  demoId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
}

export interface OrderResult {
  id: number;
  orderNumber: string;
}

/**
 * Submit an order via API route
 */
export async function submitOrder(data: SubmitOrderData): Promise<OrderResult> {
  const response = await fetch('/api/demo-orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to submit order');
  }
  
  return response.json();
}

/**
 * Fetch orders for a demo (admin only)
 */
export async function fetchDemoOrders(demoId: number, token?: string): Promise<unknown[]> {
  const response = await fetch(
    `${STRAPI_URL}/api/demo-orders?filters[demo][id][$eq]=${demoId}&sort=createdAt:desc`,
    {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }
  
  const result = await response.json();
  return result.data || [];
}
