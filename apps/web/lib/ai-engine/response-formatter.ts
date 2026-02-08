/**
 * @fileoverview Response Formatter
 * 
 * Parses raw LLM output and formats it into structured AgentResponse.
 * Extracts navigation commands, tool calls, and generates follow-up suggestions.
 */

import type {
  AgentResponse,
  AgentAction,
  IntentResult,
  TourItem,
  DemoConfig,
  SessionMemory,
} from './types';

// ========================================
// Command Patterns
// ========================================

// Navigation command: [[FLY_TO:itemId]] or [[FLY_TO:itemId:title]]
const FLY_TO_PATTERN = /\[\[FLY_TO:([^:\]]+)(?::[^\]]*)?\]\]/g;

// Tool call command: [[TOOL:toolName:params]]
const TOOL_PATTERN = /\[\[TOOL:([^:]+):([^\]]+)\]\]/g;

// Lead capture signal: [[LEAD:type]] (phone, email, both, inquiry, booking, etc.)
const LEAD_PATTERN = /\[\[LEAD:([^\]]+)\]\]/g;

// WhatsApp command: [[WHATSAPP]] or [[WHATSAPP:phone:message]]
const WHATSAPP_PATTERN = /\[\[WHATSAPP(?::([^:\]]+)(?::([^\]]+))?)?\]\]/g;

// Comparison command: [[COMPARE:id1,id2]]
const COMPARE_PATTERN = /\[\[COMPARE:([^,]+),([^\]]+)\]\]/g;

// Add to cart command: [[ADD_TO_CART:itemId:quantity]]
const ADD_TO_CART_PATTERN = /\[\[ADD_TO_CART:([^:\]]+)(?::([^\]]*))?\]\]/g;

// ========================================
// Response Formatting
// ========================================

/**
 * Format raw LLM response into structured AgentResponse
 */
export function formatResponse(
  rawResponse: string,
  intent: IntentResult,
  items: TourItem[],
  locale: string,
  session: SessionMemory,
  sessionId: string,
  modelUsed?: string,
  tier?: string,
  demo?: DemoConfig
): AgentResponse {
  // Extract actions from response
  const actions: AgentAction[] = [];
  let cleanedText = rawResponse;
  
  // Extract navigation commands
  const flyToMatches = [...rawResponse.matchAll(FLY_TO_PATTERN)];
  for (const match of flyToMatches) {
    const itemId = match[1];
    const item = items.find(i => i.id === itemId);
    
    if (item) {
      actions.push({
        type: 'flyTo',
        payload: {
          itemId,
          title: locale === 'ar' && item.titleAr ? item.titleAr : item.title,
        },
      });
    }
    
    // Remove command from text
    cleanedText = cleanedText.replace(match[0], '');
  }
  
  // Extract comparison commands
  const compareMatches = [...rawResponse.matchAll(COMPARE_PATTERN)];
  for (const match of compareMatches) {
    const [, id1, id2] = match;
    const item1 = items.find(i => i.id === id1);
    const item2 = items.find(i => i.id === id2);
    
    if (item1 && item2) {
      actions.push({
        type: 'showComparison',
        payload: {
          items: [id1, id2],
          titles: [
            locale === 'ar' && item1.titleAr ? item1.titleAr : item1.title,
            locale === 'ar' && item2.titleAr ? item2.titleAr : item2.title,
          ],
        },
      });
    }
    
    cleanedText = cleanedText.replace(match[0], '');
  }
  
  // Extract WhatsApp commands — supports [[WHATSAPP]] and [[WHATSAPP:phone:message]]
  const whatsappMatches = [...rawResponse.matchAll(WHATSAPP_PATTERN)];
  if (whatsappMatches.length > 0) {
    // Use phone/msg from marker if present, otherwise fall back to demo config
    const firstMatch = whatsappMatches[0];
    const markerPhone = firstMatch[1]; // capture group 1: phone
    const markerMsg = firstMatch[2];   // capture group 2: message
    const whatsappPhone = markerPhone || demo?.businessWhatsapp || demo?.businessPhone;
    actions.push({
      type: 'openWhatsApp',
      payload: {
        phone: whatsappPhone || '',
        message: markerMsg || (locale === 'ar'
          ? `مرحباً، أتواصل معكم من الجولة الافتراضية لـ ${demo?.businessName || ''}`
          : `Hi, I'm reaching out from the ${demo?.businessName || ''} virtual tour`),
      },
    });
    
    for (const match of whatsappMatches) {
      cleanedText = cleanedText.replace(match[0], '');
    }
  }
  
  // Extract lead capture signals
  const leadMatches = [...rawResponse.matchAll(LEAD_PATTERN)];
  for (const match of leadMatches) {
    const captureType = match[1];
    actions.push({
      type: 'showLeadForm',
      payload: {
        captureType,
      },
    });
    
    cleanedText = cleanedText.replace(match[0], '');
  }
  
  // Extract add-to-cart commands
  const cartMatches = [...rawResponse.matchAll(ADD_TO_CART_PATTERN)];
  for (const match of cartMatches) {
    const itemId = match[1];
    const quantity = parseInt(match[2] || '1', 10) || 1;
    const item = items.find(i => i.id === itemId);
    
    if (item) {
      actions.push({
        type: 'addToCart',
        payload: {
          itemId,
          title: locale === 'ar' && item.titleAr ? item.titleAr : item.title,
          price: item.price,
          quantity,
          imageUrl: item.imageUrl,
        },
      });
    }
    
    cleanedText = cleanedText.replace(match[0], '');
  }
  
  // Clean up text
  cleanedText = cleanedText
    .replace(/\[\[TOOL:[^\]]+\]\]/g, '') // Remove any tool commands
    .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
    .trim();
  
  // Generate suggestions
  const suggestions = generateSuggestions(intent, items, locale, session);
  
  // Build response
  const response: AgentResponse = {
    message: cleanedText,
    sessionId,
    timestamp: new Date().toISOString(),
    intent: intent.intent,
    actions: actions.length > 0 ? actions : undefined,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
    usage: modelUsed ? {
      model: modelUsed,
      tier: (tier as any) || 'standard',
      tokensEstimate: estimateTokens(rawResponse),
    } : undefined,
  };
  
  return response;
}

/**
 * Generate follow-up suggestions based on intent
 */
function generateSuggestions(
  intent: IntentResult,
  items: TourItem[],
  locale: string,
  session: SessionMemory
): string[] {
  const isArabic = locale === 'ar';
  const suggestions: string[] = [];
  
  switch (intent.intent) {
    case 'greeting':
      suggestions.push(
        ...(isArabic
          ? ['أرني المنتجات المتاحة', 'ما هي الأسعار؟', 'معلومات التواصل']
          : ['Show me available products', 'What are the prices?', 'Contact information'])
      );
      break;
    
    case 'product_search':
      // Suggest related categories or specific items
      if (items.length > 0) {
        const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
        if (categories.length > 0 && categories.length < 5) {
          suggestions.push(
            ...(isArabic
              ? categories.map(cat => `أرني ${cat}`)
              : categories.map(cat => `Show me ${cat}`))
          );
        }
        
        suggestions.push(
          isArabic ? 'قارن بين منتجين' : 'Compare two items'
        );
      }
      break;
    
    case 'price_inquiry':
      suggestions.push(
        ...(isArabic
          ? ['هل متوفر؟', 'أريد أطلبه', 'أرني بدائل']
          : ['Is it available?', 'I want to order', 'Show me alternatives'])
      );
      break;
    
    case 'comparison':
      suggestions.push(
        ...(isArabic
          ? ['ما الفرق في السعر؟', 'أيهما أفضل؟', 'أرني المزيد']
          : ['What\'s the price difference?', 'Which is better?', 'Show me more'])
      );
      break;
    
    case 'business_info':
      suggestions.push(
        ...(isArabic
          ? ['أرني المنتجات', 'كيف أتواصل معكم؟', 'أين موقعكم؟']
          : ['Show me products', 'How do I contact you?', 'Where are you located?'])
      );
      break;
    
    case 'lead_capture':
      suggestions.push(
        ...(isArabic
          ? ['اتصلوا بي', 'أرسلوا لي على واتساب', 'أريد زيارة المعرض']
          : ['Call me', 'Send me a WhatsApp', 'I want to visit the showroom'])
      );
      break;
    
    case 'help':
      suggestions.push(
        ...(isArabic
          ? ['ابحث عن منتج', 'قارن المنتجات', 'معلومات الأسعار']
          : ['Search for a product', 'Compare products', 'Price information'])
      );
      break;
    
    default:
      // General suggestions
      if (items.length > 0) {
        suggestions.push(
          ...(isArabic
            ? ['أرني المنتجات', 'ساعدني في الاختيار', 'معلومات التواصل']
            : ['Show me products', 'Help me choose', 'Contact information'])
        );
      }
  }
  
  // Limit to 3 suggestions
  return suggestions.slice(0, 3);
}

/**
 * Validate and sanitize LLM response
 */
export function validateResponse(
  rawResponse: string,
  items: TourItem[]
): {
  isValid: boolean;
  issues: string[];
  sanitized: string;
} {
  const issues: string[] = [];
  let sanitized = rawResponse;
  
  // Check for hallucinated item references
  const itemMentions = sanitized.match(/\[ID:\s*([^\]]+)\]/g);
  if (itemMentions) {
    const itemIds = items.map(i => i.id);
    for (const mention of itemMentions) {
      const id = mention.replace(/\[ID:\s*|\]/g, '');
      if (!itemIds.includes(id)) {
        issues.push(`Referenced non-existent item: ${id}`);
        // Remove the reference
        sanitized = sanitized.replace(mention, '');
      }
    }
  }
  
  // Check for inappropriate content (basic)
  const inappropriate = /\b(fuck|shit|damn|ass|bitch)\b/i;
  if (inappropriate.test(sanitized)) {
    issues.push('Inappropriate language detected');
    sanitized = sanitized.replace(inappropriate, '***');
  }
  
  // Check length (should be reasonable)
  if (sanitized.length > 2000) {
    issues.push('Response too long');
    sanitized = sanitized.substring(0, 1997) + '...';
  }
  
  if (sanitized.length < 10) {
    issues.push('Response too short');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    sanitized,
  };
}

/**
 * Extract item IDs mentioned in text
 */
export function extractItemIds(text: string): string[] {
  const pattern = /\[ID:\s*([^\]]+)\]/g;
  const matches = [...text.matchAll(pattern)];
  return matches.map(m => m[1].trim());
}

/**
 * Estimate tokens in text
 */
function estimateTokens(text: string): number {
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const totalChars = text.length;
  const englishChars = totalChars - arabicChars;
  
  return Math.ceil(englishChars / 4 + arabicChars / 2);
}

/**
 * Format error response
 */
export function formatErrorResponse(
  error: string,
  locale: string,
  sessionId: string
): AgentResponse {
  const isArabic = locale === 'ar';
  
  return {
    message: isArabic
      ? `عذراً، حدث خطأ: ${error}. يرجى المحاولة مرة أخرى.`
      : `Sorry, an error occurred: ${error}. Please try again.`,
    sessionId,
    timestamp: new Date().toISOString(),
    error,
    suggestions: isArabic
      ? ['حاول مرة أخرى', 'ساعدني', 'اتصل بنا']
      : ['Try again', 'Help', 'Contact us'],
  };
}

/**
 * Format rate limit response
 */
export function formatRateLimitResponse(
  remaining: number,
  resetAt: string,
  locale: string,
  sessionId: string
): AgentResponse {
  const isArabic = locale === 'ar';
  
  const resetTime = new Date(resetAt).toLocaleTimeString(isArabic ? 'ar' : 'en');
  
  return {
    message: isArabic
      ? `عذراً، لقد وصلت إلى الحد الأقصى للرسائل. يرجى المحاولة مرة أخرى في ${resetTime}.`
      : `Sorry, you've reached the message limit. Please try again at ${resetTime}.`,
    sessionId,
    timestamp: new Date().toISOString(),
    error: 'rate_limit_exceeded',
    suggestions: [],
  };
}
