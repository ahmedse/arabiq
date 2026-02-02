import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 3; // Max submissions
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function getClientIP(request: NextRequest): string {
  // Try various headers for real IP (behind proxies)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Clean up expired entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!record || record.resetTime < now) {
    // New window
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return true;
  }

  record.count++;
  return false;
}

// Validation helpers
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone: string): boolean {
  if (!phone) return true; // Optional field
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

function sanitize(str: string): string {
  return str.trim().slice(0, 5000); // Limit length
}

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  locale?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);

    // Check rate limit
    if (isRateLimited(clientIP)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many submissions. Please try again later.',
          code: 'RATE_LIMITED'
        },
        { status: 429 }
      );
    }

    // Parse request body
    let body: ContactFormData;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', code: 'INVALID_BODY' },
        { status: 400 }
      );
    }

    const { name, email, phone, message, locale } = body;

    // Validate required fields
    const errors: Record<string, string> = {};

    if (!name || name.trim().length < 2) {
      errors.name = 'Name is required and must be at least 2 characters';
    }

    if (!email || !validateEmail(email)) {
      errors.email = 'A valid email address is required';
    }

    if (phone && !validatePhone(phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (!message || message.trim().length < 10) {
      errors.message = 'Message is required and must be at least 10 characters';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Prepare data for Strapi
    const submissionData = {
      data: {
        name: sanitize(name),
        email: sanitize(email).toLowerCase(),
        phone: phone ? sanitize(phone) : null,
        message: sanitize(message),
        locale: locale || 'en',
        source: 'website',
        ipAddress: clientIP !== 'unknown' ? clientIP : null,
        userAgent: request.headers.get('user-agent')?.slice(0, 500) || null,
        status: 'new',
      },
    };

    // Submit to Strapi
    if (!STRAPI_URL) {
      console.error('[Contact API] STRAPI_URL is not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error', code: 'CONFIG_ERROR' },
        { status: 500 }
      );
    }

    const strapiResponse = await fetch(`${STRAPI_URL}/api/contact-submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {}),
      },
      body: JSON.stringify(submissionData),
    });

    if (!strapiResponse.ok) {
      const errorText = await strapiResponse.text().catch(() => 'Unknown error');
      console.error('[Contact API] Strapi submission failed:', strapiResponse.status, errorText);
      
      // Don't expose internal errors to client
      return NextResponse.json(
        { success: false, error: 'Failed to submit message. Please try again.', code: 'SUBMISSION_FAILED' },
        { status: 500 }
      );
    }

    // Success
    console.log(`[Contact API] New submission from ${email} (${clientIP})`);
    
    return NextResponse.json({
      success: true,
      message: 'Thank you for your message. We will get back to you soon.',
    });

  } catch (error) {
    console.error('[Contact API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
