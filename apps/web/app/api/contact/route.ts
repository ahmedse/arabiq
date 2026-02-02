import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rateLimit';
import { contactFormSchema, validateInput, validationErrorResponse } from '@/lib/validation';

const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request.headers);

    // Check rate limit (5 requests per minute for contact form)
    const { success: rateLimitOk, resetTime } = checkRateLimit(
      `contact:${clientIP}`,
      RATE_LIMITS.contact.limit,
      RATE_LIMITS.contact.windowMs
    );
    
    if (!rateLimitOk) {
      return rateLimitResponse(resetTime);
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', code: 'INVALID_BODY' },
        { status: 400 }
      );
    }

    // Validate input with Zod
    const validation = validateInput(contactFormSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const { name, email, phone, message, locale } = validation.data;

    // Prepare data for Strapi
    const submissionData = {
      data: {
        name,
        email,
        phone: phone || null,
        message,
        locale: locale || 'en',
        source: 'website',
        ipAddress: clientIP !== 'anonymous' ? clientIP : null,
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
