/**
 * Chat API Functions
 * Client-side functions for interacting with AI chat
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SendMessageParams {
  message: string;
  demoId: string;
  demoType: string;
  demoTitle: string;
  businessName?: string;
  currentLocation?: string;
  history: ChatMessage[];
  locale: string;
}

export interface ChatResponse {
  message: string;
  timestamp: string;
}

/**
 * Send a message to the AI chat API
 */
export async function sendMessage(params: SendMessageParams): Promise<ChatResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to send message');
  }

  return response.json();
}

/**
 * Check if AI chat is available
 */
export async function checkChatHealth(): Promise<{ status: string; configured: boolean }> {
  const response = await fetch('/api/chat', {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Chat service unavailable');
  }

  return response.json();
}

/**
 * Format chat history for API
 */
export function formatHistory(messages: Array<{ role: string; content: string }>): ChatMessage[] {
  return messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
}

/**
 * Get suggested prompts based on demo type
 */
export function getSuggestedPrompts(demoType: string, locale: string): string[] {
  const isArabic = locale === 'ar';
  
  const prompts: Record<string, { en: string[]; ar: string[] }> = {
    ecommerce: {
      en: [
        'What are your best-selling products?',
        'Can you compare these two items?',
        'Do you have any deals today?',
        'Help me find a gift',
      ],
      ar: [
        'ما هي أفضل المنتجات مبيعاً؟',
        'هل يمكنك المقارنة بين هذين المنتجين؟',
        'هل هناك عروض اليوم؟',
        'ساعدني في إيجاد هدية',
      ],
    },
    showroom: {
      en: [
        'Show me your best sofas',
        'What materials do you use?',
        'Do you offer delivery?',
        'Help me design my living room',
      ],
      ar: [
        'أرني أفضل الأرائك لديكم',
        'ما المواد التي تستخدمونها؟',
        'هل تقدمون خدمة التوصيل؟',
        'ساعدني في تصميم غرفة المعيشة',
      ],
    },
    cafe: {
      en: [
        'What do you recommend?',
        'Do you have vegan options?',
        'What are today\'s specials?',
        'Can I make a reservation?',
      ],
      ar: [
        'ماذا توصي؟',
        'هل لديكم خيارات نباتية؟',
        'ما هي عروض اليوم؟',
        'هل يمكنني الحجز؟',
      ],
    },
    hotel: {
      en: [
        'What room types do you have?',
        'What amenities are included?',
        'Do you have availability this weekend?',
        'Tell me about the suite',
      ],
      ar: [
        'ما أنواع الغرف المتاحة؟',
        'ما المرافق المتضمنة؟',
        'هل هناك توفر في نهاية الأسبوع؟',
        'أخبرني عن الجناح',
      ],
    },
    realestate: {
      en: [
        'What is the asking price?',
        'Tell me about the neighborhood',
        'How many bedrooms are there?',
        'Can I schedule a viewing?',
      ],
      ar: [
        'ما هو السعر المطلوب؟',
        'أخبرني عن الحي',
        'كم عدد غرف النوم؟',
        'هل يمكنني جدولة معاينة؟',
      ],
    },
  };
  
  const demoPrompts = prompts[demoType] || prompts.ecommerce;
  return isArabic ? demoPrompts.ar : demoPrompts.en;
}
