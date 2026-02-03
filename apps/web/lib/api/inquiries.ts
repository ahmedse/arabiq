/**
 * Inquiry API Functions
 * Submit property inquiries
 */

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || '';

export interface SubmitInquiryData {
  demoId: number;
  propertyTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  message?: string;
  preferredContact?: 'email' | 'phone' | 'whatsapp';
}

export interface InquiryResult {
  id: number;
  inquiryNumber: string;
}

/**
 * Submit an inquiry via API route
 */
export async function submitInquiry(data: SubmitInquiryData): Promise<InquiryResult> {
  const response = await fetch(`${API_BASE}/api/demo-inquiries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to submit inquiry');
  }
  
  return response.json();
}

/**
 * Fetch inquiries for a demo (admin only)
 */
export async function fetchDemoInquiries(demoId: number): Promise<unknown[]> {
  const response = await fetch(`${API_BASE}/api/demo-inquiries?demoId=${demoId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch inquiries');
  }
  
  const result = await response.json();
  return result.inquiries || [];
}
