/**
 * @fileoverview Intent Classification Engine
 * 
 * TWO-TIER intent classification:
 * 1. FAST PATH: Local keyword matching (handles 80% of cases instantly)
 * 2. SMART PATH: LLM classification via Poe API (handles misspellings, semantic understanding)
 * 
 * Falls back to local if LLM unavailable. Supports English and Arabic with entity extraction.
 */

import type { IntentResult, IntentType } from './types';

// ========================================
// LLM-Based Intent Classification
// ========================================

const POE_API_KEY = process.env.POE_API_KEY;
const POE_BOT = 'GPT-4o-Mini'; // Fast, cheap model for intent classification

/**
 * Use LLM to classify intent - handles misspellings and semantic meaning
 */
async function classifyIntentWithLLM(
  message: string,
  locale: string
): Promise<IntentResult | null> {
  if (!POE_API_KEY) return null;

  const systemPrompt = `You are an intent classifier. Classify user messages into ONE of these intents:
- greeting: Hello, hi, greetings
- farewell: Goodbye, thanks, bye
- confirmation: Yes, ok, sure
- help: Help me, what can you do
- product_search: Show products, what do you have, looking for items
- product_inquiry: Tell me about [item], details about [item]
- price_inquiry: How much, what's the price
- navigation: Take me to, go to, where is
- comparison: Compare X and Y, difference between
- availability: Is X available, do you have X
- booking: Book, reserve, schedule
- business_info: Contact, phone, address, hours
- general_question: Other questions

Respond ONLY with JSON: {"intent": "intent_name", "confidence": 0.0-1.0, "entities": []}

Examples:
"wht prodcts u hav?" → {"intent":"product_search","confidence":0.9,"entities":[]}
"tell me abot the tv" → {"intent":"product_inquiry","confidence":0.8,"entities":["tv"]}
"r u open?" → {"intent":"business_info","confidence":0.9,"entities":[]}`;

  try {
    const response = await fetch('https://api.poe.com/bot/fetch_stream', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '1.0',
        type: 'query',
        query: [{
          role: 'system',
          content: systemPrompt,
        }, {
          role: 'user',
          content: message,
        }],
        bot: POE_BOT,
        temperature: 0.1, // Low temperature for consistent classification
        user_id: 'intent-classifier',
      }),
    });

    if (!response.ok) return null;

    let fullText = '';
    const reader = response.body?.getReader();
    if (!reader) return null;

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) {
              fullText += data.text;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    // Parse JSON response from LLM
    const jsonMatch = fullText.match(/\{[^}]+\}/);
    if (!jsonMatch) return null;

    const result = JSON.parse(jsonMatch[0]);
    
    // Map LLM intents to valid IntentType (LLM may return aliases)
    const INTENT_ALIASES: Record<string, IntentType> = {
      product_inquiry: 'product_search',  // treat product detail queries as search
      booking: 'lead_capture',            // booking = lead capture
    };
    const mappedIntent = INTENT_ALIASES[result.intent] || result.intent;
    
    return {
      intent: mappedIntent as IntentType,
      confidence: result.confidence || 0.7,
      entities: result.entities || [],
    };
  } catch (error) {
    console.error('[Intent] LLM classification failed:', error);
    return null;
  }
}

// ========================================
// Intent Patterns
// ========================================

interface IntentPattern {
  intent: IntentType;
  keywords: {
    en: string[];
    ar: string[];
  };
  patterns?: {
    en: RegExp[];
    ar: RegExp[];
  };
  confidence: number;
}

const INTENT_PATTERNS: IntentPattern[] = [
  // Greeting
  {
    intent: 'greeting',
    keywords: {
      en: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'],
      ar: ['مرحبا', 'أهلا', 'السلام عليكم', 'صباح الخير', 'مساء الخير', 'أهلين', 'هلا', 'يا هلا'],
    },
    confidence: 0.95,
  },
  
  // Farewell
  {
    intent: 'farewell',
    keywords: {
      en: ['bye', 'goodbye', 'thanks', 'thank you', 'see you', 'farewell', 'later', 'thx'],
      ar: ['وداعا', 'مع السلامة', 'شكرا', 'شكراً', 'يعطيك العافية', 'الله يعطيك العافية', 'باي'],
    },
    confidence: 0.95,
  },
  
  // Confirmation
  {
    intent: 'confirmation',
    keywords: {
      en: ['yes', 'yeah', 'yep', 'sure', 'okay', 'ok', 'fine', 'alright', 'correct', 'exactly'],
      ar: ['نعم', 'آي', 'أيوه', 'طيب', 'تمام', 'ماشي', 'موافق', 'صح', 'اوك', 'حاضر'],
    },
    confidence: 0.9,
  },
  
  // Help
  {
    intent: 'help',
    keywords: {
      en: ['help', 'assist', 'what can you do', 'how does this work', 'guide', 'tutorial', 'support'],
      ar: ['مساعدة', 'ساعدني', 'كيف تساعدني', 'شو تقدر تسوي', 'وش تقدر تسوي', 'دعم', 'إرشاد'],
    },
    confidence: 0.9,
  },
  
  // Product Search
  {
    intent: 'product_search',
    keywords: {
      en: ['show me', 'looking for', 'find', 'search', 'see', 'browse', 'view', 'display', 'list', 'available', 'products', 'what do you have', 'what do you sell', 'need', 'want', 'oven', 'ovens', 'fridge', 'refrigerator', 'washing machine', 'tv', 'television', 'microwave', 'air conditioner', 'ac', 'menu', 'rooms', 'properties'],
      ar: ['أرني', 'ابحث عن', 'عايز', 'أبي', 'أبغى', 'ورني', 'وريني', 'عرض', 'اعرض', 'موجود', 'متوفر', 'منتجات', 'شو عندكم', 'وش عندكم', 'أحتاج', 'أريد', 'ثلاجة', 'غسالة', 'فرن', 'تلفزيون', 'شاشة', 'مكيف', 'مايكرويف'],
    },
    patterns: {
      en: [
        /show\s+me\s+(.+)/i,
        /looking\s+for\s+(.+)/i,
        /find\s+(.+)/i,
        /any\s+(.+)\s+available/i,
        /what\s+(?:products?|items?)\s+(?:do\s+you|are)/i,
        /what\s+do\s+you\s+(?:have|sell|offer)/i,
        /i\s+(?:need|want)\s+(?!to\s)(?:a\s+|an\s+)?(.+)/i,
        /(?:let\s+me\s+see|give\s+me)\s+(.+)/i,
      ],
      ar: [
        /أرني\s+(.+)/,
        /ورني\s+(.+)/,
        /عندك\s+(.+)/,
        /عندكم\s+(.+)/,
        /شو\s+عندكم/,
        /وش\s+عندكم/,
        /أ(?:حتاج|ريد)\s+(.+)/,
      ],
    },
    confidence: 0.85,
  },
  
  // Price Inquiry
  {
    intent: 'price_inquiry',
    keywords: {
      en: ['price', 'cost', 'how much', 'expensive', 'cheap', 'afford', 'budget'],
      ar: ['سعر', 'بكم', 'كم سعر', 'غالي', 'رخيص', 'ثمن', 'قيمة', 'تكلفة'],
    },
    patterns: {
      en: [
        /how\s+much\s+(?:is|for|does)\s+(?:the\s+|a\s+|an\s+)?(.+)/i,
        /what(?:'s|\s+is)\s+the\s+price\s+(?:of\s+)?(?:the\s+|a\s+|an\s+)?(.+)/i,
        /price\s+of\s+(?:the\s+|a\s+|an\s+)?(.+)/i,
      ],
      ar: [
        /بكم\s+(.+)/,
        /كم\s+سعر\s+(.+)/,
        /سعر\s+(.+)/,
      ],
    },
    confidence: 0.9,
  },
  
  // Navigation
  {
    intent: 'navigation',
    keywords: {
      en: ['take me to', 'go to', 'navigate', 'show location', 'where is', 'directions'],
      ar: ['خذني إلى', 'روح', 'وديني', 'فين', 'وين', 'أين', 'مكان', 'انتقل'],
    },
    patterns: {
      en: [
        /take\s+me\s+to\s+(.+)/i,
        /go\s+to\s+(.+)/i,
        /where\s+is\s+(.+)/i,
      ],
      ar: [
        /خذني\s+إلى\s+(.+)/,
        /وديني\s+(.+)/,
        /فين\s+(.+)/,
        /وين\s+(.+)/,
      ],
    },
    confidence: 0.9,
  },
  
  // Comparison
  {
    intent: 'comparison',
    keywords: {
      en: ['compare', 'difference', 'versus', 'vs', 'better', 'which one', 'or'],
      ar: ['قارن', 'مقارنة', 'الفرق', 'أفضل', 'أحسن', 'أيهما', 'ولا'],
    },
    patterns: {
      en: [
        /compare\s+(.+)\s+(and|with|to|vs)\s+(.+)/i,
        /difference\s+between\s+(.+)\s+and\s+(.+)/i,
        /(.+)\s+or\s+(.+)/i,
      ],
      ar: [
        /قارن\s+بين\s+(.+)\s+و\s*(.+)/,
        /الفرق\s+بين\s+(.+)\s+و\s*(.+)/,
        /(.+)\s+ولا\s+(.+)/,
      ],
    },
    confidence: 0.85,
  },
  
  // Availability
  {
    intent: 'availability',
    keywords: {
      en: ['available', 'in stock', 'do you have', 'have you got', 'still have'],
      ar: ['متوفر', 'موجود', 'عندك', 'عندكم', 'في المخزون'],
    },
    patterns: {
      en: [
        /is\s+(.+)\s+available/i,
        /do\s+you\s+have\s*(.*)/i,
        /(.+)\s+in\s+stock/i,
      ],
      ar: [
        /(.+)\s+متوفر/,
        /عندك\s+(.+)/,
        /عندكم\s+(.+)/,
      ],
    },
    confidence: 0.85,
  },
  
  // Business Info
  {
    intent: 'business_info',
    keywords: {
      en: ['hours', 'open', 'close', 'location', 'address', 'contact', 'phone', 'email', 'working hours', 'whatsapp', 'call'],
      ar: ['ساعات', 'مواعيد', 'مفتوح', 'مسكر', 'العنوان', 'موقع', 'تواصل', 'هاتف', 'رقم', 'ايميل', 'واتساب', 'واتس', 'واتسب', 'واتس اب', 'تلفون', 'جوال'],
    },
    patterns: {
      en: [
        /when\s+(do\s+you\s+)?(open|close)/i,
        /what\s+(are|is)\s+your\s+(hours|address|location|phone)/i,
      ],
      ar: [
        /متى\s+(تفتح|تفتحون|تسكر|تسكرون)/,
        /ايش\s+(عنوانكم|رقمكم|موقعكم)/,
      ],
    },
    confidence: 0.9,
  },
  
  // Lead Capture
  {
    intent: 'lead_capture',
    keywords: {
      en: ['order', 'buy', 'purchase', 'contact me', 'call me', 'interested', 'reserve', 'book', 'message on whatsapp'],
      ar: ['أطلب', 'اشتري', 'شراء', 'اتصل بي', 'اتصلوا بي', 'مهتم', 'أحجز', 'احجز', 'طلب', 'أريد واتساب', 'أريد واتس', 'كلمني واتساب', 'ابي اطلب'],
    },
    patterns: {
      en: [
        /i\s+want\s+to\s+(order|buy|purchase|book|reserve|schedule)/i,
        /(call|contact)\s+me/i,
        /i('m|\s+am)\s+interested/i,
      ],
      ar: [
        /أريد\s+(أطلب|أشتري)/,
        /اتصل\s+بي/,
        /أنا\s+مهتم/,
      ],
    },
    confidence: 0.9,
  },
  
  // Out of Scope
  {
    intent: 'out_of_scope',
    keywords: {
      en: [
        'weather', 'news', 'joke', 'story', 'code', 'program', 'homework', 'math', 
        'recipe', 'health', 'medical', 'political', 'religion', 'sports', 'movie',
        'write me', 'create a', 'build a', 'develop a',
      ],
      ar: [
        'الطقس', 'الجو', 'أخبار', 'نكتة', 'قصة', 'كود', 'برمجة', 'واجب', 'رياضيات',
        'وصفة', 'صحة', 'طبي', 'سياسة', 'دين', 'رياضة', 'فيلم',
        'اكتب لي', 'انشئ', 'اصنع',
      ],
    },
    confidence: 0.95,
  },
];

// Common product categories for entity extraction
const PRODUCT_CATEGORIES = {
  en: [
    'fridge', 'refrigerator', 'freezer', 'washing machine', 'dryer', 'dishwasher',
    'oven', 'microwave', 'stove', 'cooker', 'tv', 'television', 'screen',
    'ac', 'air conditioner', 'heater', 'fan', 'vacuum', 'cleaner',
  ],
  ar: [
    'ثلاجة', 'فريزر', 'غسالة', 'نشافة', 'جلاية', 'جلايه',
    'فرن', 'مايكرويف', 'طباخ', 'تلفزيون', 'شاشة',
    'مكيف', 'تكييف', 'مدفأة', 'مروحة', 'مكنسة',
  ],
};

// ========================================
// Intent Classification Functions
// ========================================

/**
 * Classify user intent from message
 * HYBRID APPROACH: Fast local keywords first, LLM fallback for ambiguous cases
 */
export async function classifyIntent(
  message: string,
  locale: string = 'en',
  useLLM: boolean = true
): Promise<IntentResult> {
  const normalizedMessage = message.toLowerCase().trim();
  
  // Check for out-of-scope first (highest priority to save API calls)
  const outOfScopeCheck = checkOutOfScope(normalizedMessage, locale);
  if (outOfScopeCheck) {
    return outOfScopeCheck;
  }
  
  // Try pattern matching first (most accurate)
  const patternMatch = matchPatterns(normalizedMessage, locale);
  if (patternMatch && patternMatch.confidence >= 0.8) {
    console.log(`[Intent] Fast path: ${patternMatch.intent} (${patternMatch.confidence})`);
    return patternMatch;
  }
  
  // Try keyword matching (0.5 threshold — patterns already checked at 0.8+)
  const keywordMatch = matchKeywords(normalizedMessage, locale);
  if (keywordMatch && keywordMatch.confidence >= 0.5) {
    console.log(`[Intent] Fast path: ${keywordMatch.intent} (${keywordMatch.confidence})`);
    return keywordMatch;
  }
  
  // For ambiguous cases (low confidence), use LLM if available
  if (useLLM && POE_API_KEY) {
    console.log('[Intent] Using LLM for ambiguous/misspelled message');
    const llmResult = await classifyIntentWithLLM(message, locale);
    if (llmResult && llmResult.confidence >= 0.6) {
      console.log(`[Intent] LLM path: ${llmResult.intent} (${llmResult.confidence})`);
      return llmResult;
    }
  }
  
  // Fallback to keyword match even if low confidence
  if (keywordMatch) {
    console.log(`[Intent] Fallback: ${keywordMatch.intent} (${keywordMatch.confidence})`);
    return keywordMatch;
  }
  
  // Default to general question
  console.log('[Intent] Default: general_question');
  return {
    intent: 'general_question',
    confidence: 0.6,
    entities: extractEntities(normalizedMessage, locale),
  };
}

/**
 * Check if message is out of scope (not business-related)
 */
function checkOutOfScope(message: string, locale: string): IntentResult | null {
  const pattern = INTENT_PATTERNS.find(p => p.intent === 'out_of_scope');
  if (!pattern) return null;
  
  const keywords = locale === 'ar' ? pattern.keywords.ar : pattern.keywords.en;
  
  for (const keyword of keywords) {
    if (message.includes(keyword.toLowerCase())) {
      return {
        intent: 'out_of_scope',
        confidence: pattern.confidence,
        entities: [],
        isOutOfScope: true,
      };
    }
  }
  
  return null;
}

/**
 * Match against regex patterns
 */
function matchPatterns(message: string, locale: string): IntentResult | null {
  let bestMatch: IntentResult | null = null;
  let highestConfidence = 0;
  
  for (const pattern of INTENT_PATTERNS) {
    if (!pattern.patterns) continue;
    
    const patterns = locale === 'ar' ? pattern.patterns.ar : pattern.patterns.en;
    
    for (const regex of patterns) {
      const match = message.match(regex);
      if (match && pattern.confidence > highestConfidence) {
        highestConfidence = pattern.confidence;
        const entities = match.slice(1).filter(Boolean);
        
        bestMatch = {
          intent: pattern.intent,
          confidence: pattern.confidence,
          entities: entities.length > 0 ? entities : extractEntities(message, locale),
        };
      }
    }
  }
  
  return bestMatch;
}

/**
 * Match against keywords
 */
function matchKeywords(message: string, locale: string): IntentResult | null {
  let bestMatch: IntentResult | null = null;
  let highestScore = 0;
  
  for (const pattern of INTENT_PATTERNS) {
    const keywords = locale === 'ar' ? pattern.keywords.ar : pattern.keywords.en;
    let matchCount = 0;
    
    for (const keyword of keywords) {
      if (message.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    
    if (matchCount > 0) {
      // Score: base confidence scaled by match coverage, but a single keyword
      // match should still be meaningful (floor at 60% of pattern confidence)
      const coverage = matchCount / keywords.length;
      const score = pattern.confidence * (0.5 + 0.5 * Math.min(1, matchCount / 2));
      if (score > highestScore) {
        highestScore = score;
        bestMatch = {
          intent: pattern.intent,
          confidence: Math.min(score, pattern.confidence),
          entities: extractEntities(message, locale),
        };
      }
    }
  }
  
  return bestMatch;
}

/**
 * Extract entities (product names, categories, numbers)
 */
function extractEntities(message: string, locale: string): string[] {
  const entities: string[] = [];
  
  // Extract product categories
  const categories = locale === 'ar' ? PRODUCT_CATEGORIES.ar : PRODUCT_CATEGORIES.en;
  for (const category of categories) {
    if (message.includes(category.toLowerCase())) {
      entities.push(category);
    }
  }
  
  // Extract numbers (prices, quantities)
  const numbers = message.match(/\d+/g);
  if (numbers) {
    entities.push(...numbers);
  }
  
  // Remove duplicates
  return [...new Set(entities)];
}

/**
 * Get intent display name (localized)
 */
export function getIntentDisplayName(intent: IntentType, locale: string = 'en'): string {
  const names: Record<IntentType, { en: string; ar: string }> = {
    greeting: { en: 'Greeting', ar: 'تحية' },
    farewell: { en: 'Farewell', ar: 'وداع' },
    product_search: { en: 'Product Search', ar: 'البحث عن منتج' },
    price_inquiry: { en: 'Price Inquiry', ar: 'استفسار عن السعر' },
    navigation: { en: 'Navigation', ar: 'التنقل' },
    comparison: { en: 'Comparison', ar: 'مقارنة' },
    availability: { en: 'Availability', ar: 'التوفر' },
    business_info: { en: 'Business Info', ar: 'معلومات العمل' },
    help: { en: 'Help', ar: 'مساعدة' },
    lead_capture: { en: 'Lead Capture', ar: 'التواصل' },
    confirmation: { en: 'Confirmation', ar: 'تأكيد' },
    out_of_scope: { en: 'Out of Scope', ar: 'خارج النطاق' },
    general_question: { en: 'General Question', ar: 'سؤال عام' },
  };
  
  return names[intent]?.[locale as 'en' | 'ar'] || intent;
}
