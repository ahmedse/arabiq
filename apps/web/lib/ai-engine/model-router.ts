/**
 * @fileoverview Model Router
 * 
 * Routes requests to the appropriate AI model tier based on intent complexity
 * and budget constraints. Handles Poe API (SSE) + OpenRouter (REST) integration.
 * 
 * Poe API returns Server-Sent Events (SSE), not JSON.
 * OpenRouter returns standard OpenAI-compatible JSON.
 * Strategy: Try Poe first (user's subscription) → OpenRouter fallback → local fallback
 */

import type { IntentType, ModelRoute, ModelTier, PoeMessage, AgentConfig, UsageRecord } from './types';

// ========================================
// Configuration
// ========================================

const POE_API_KEY = process.env.POE_API_KEY || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const POE_BASE_URL = 'https://api.poe.com/bot';

// Poe model names (must match Poe bot handles exactly)
const POE_MODELS = {
  standard: 'Claude-3-Haiku',
  advanced: 'GPT-4o-Mini',
} as const;

// OpenRouter model IDs (fallback - proper REST API)
const OPENROUTER_MODELS = {
  standard: 'meta-llama/llama-3.1-70b-instruct:free',
  advanced: 'google/gemini-2.0-flash-exp:free',
} as const;

// Daily budget limits (messages)
const DAILY_LIMITS = {
  standard: 1000,
  advanced: 200,
  total: 1500,
};

// ========================================
// Intent to Tier Mapping
// ========================================

/**
 * Determine which model tier to use based on intent
 */
export function routeToModel(
  intent: IntentType,
  config: AgentConfig,
  usage?: UsageRecord
): ModelRoute {
  // Check budget first
  if (usage && isBudgetExceeded(usage)) {
    return {
      model: 'local',
      tier: 'local',
      isLocal: true,
      estimatedCost: 0,
    };
  }
  
  // Local intents (no API call needed — handled before reaching model)
  // These are ONLY used when agent-core fast-paths them with high confidence
  const localIntents: IntentType[] = ['greeting', 'farewell', 'confirmation', 'help'];
  if (localIntents.includes(intent)) {
    return {
      model: 'local',
      tier: 'local',
      isLocal: true,
      estimatedCost: 0,
    };
  }
  
  // Out of scope - handle locally with redirect
  if (intent === 'out_of_scope') {
    return {
      model: 'local',
      tier: 'local',
      isLocal: true,
      estimatedCost: 0,
    };
  }
  
  // ALL business intents go through LLM for intelligent understanding
  // Standard tier (most intents — fast + cheap)
  const standardIntents: IntentType[] = [
    'product_search',
    'price_inquiry',
    'navigation',
    'availability',
    'business_info',
    'general_question', // Needs LLM for follow-ups, references, typos
  ];
  if (standardIntents.includes(intent)) {
    return {
      model: POE_MODELS.standard,
      tier: 'standard',
      isLocal: false,
      estimatedCost: 1,
    };
  }
  
  // Advanced tier (complex reasoning)
  const advancedIntents: IntentType[] = ['comparison', 'lead_capture'];
  if (advancedIntents.includes(intent)) {
    return {
      model: POE_MODELS.advanced,
      tier: 'advanced',
      isLocal: false,
      estimatedCost: 3,
    };
  }
  
  // Default to standard
  return {
    model: POE_MODELS.standard,
    tier: 'standard',
    isLocal: false,
    estimatedCost: 1,
  };
}

/**
 * Check if daily budget is exceeded
 */
function isBudgetExceeded(usage: UsageRecord): boolean {
  const standardCalls = usage.modelCalls[POE_MODELS.standard] || 0;
  const advancedCalls = usage.modelCalls[POE_MODELS.advanced] || 0;
  const totalCalls = usage.messageCount;
  
  if (advancedCalls >= DAILY_LIMITS.advanced) return true;
  if (standardCalls >= DAILY_LIMITS.standard) return true;
  if (totalCalls >= DAILY_LIMITS.total) return true;
  
  return false;
}

// ========================================
// Poe SSE Parser
// ========================================

/**
 * Parse Server-Sent Events from Poe API response
 * 
 * Poe returns SSE stream with events:
 *   event: meta   → {"content_type": "text/markdown"}
 *   event: text   → {"text": "partial response"}
 *   event: done   → {}
 * 
 * We concatenate all "text" events to get the full response.
 */
async function parsePoeSSE(response: Response): Promise<string> {
  const body = response.body;
  if (!body) throw new Error('Empty response body from Poe');
  
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Normalize \r\n to \n (Poe sends \r\n line endings)
      buffer = buffer.replace(/\r\n/g, '\n');
      
      // Process complete SSE events (separated by double newlines)
      const events = buffer.split('\n\n');
      // Keep the last potentially incomplete event in buffer
      buffer = events.pop() || '';
      
      for (const event of events) {
        if (!event.trim()) continue;
        
        const lines = event.split('\n');
        let eventType = '';
        let eventData = '';
        
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            eventData = line.substring(5).trim();
          }
        }
        
        if (eventType === 'text' && eventData) {
          try {
            const parsed = JSON.parse(eventData);
            if (parsed.text) {
              fullText += parsed.text;
            }
          } catch {
            // If JSON parse fails, try using raw data
            fullText += eventData;
          }
        } else if (eventType === 'done') {
          // Stream complete
          break;
        } else if (eventType === 'error') {
          try {
            const errorData = JSON.parse(eventData);
            throw new Error(`Poe API error: ${errorData.text || errorData.message || 'Unknown'}`);
          } catch (e) {
            if (e instanceof Error && e.message.startsWith('Poe API error:')) throw e;
            throw new Error(`Poe API error: ${eventData}`);
          }
        }
      }
    }
    
    // Process any remaining buffer
    if (buffer.trim()) {
      const normalized = buffer.replace(/\r\n/g, '\n');
      const lines = normalized.split('\n');
      let eventData = '';
      for (const line of lines) {
        if (line.startsWith('data:')) {
          eventData = line.substring(5).trim();
        }
      }
      if (eventData) {
        try {
          const parsed = JSON.parse(eventData);
          if (parsed.text) fullText += parsed.text;
        } catch {
          // ignore incomplete final event
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  
  return fullText;
}

// ========================================
// Model API Calls
// ========================================

/**
 * Call the selected model with messages
 * Strategy: Poe SSE → OpenRouter REST → throw error
 */
export async function callModel(
  model: string,
  messages: PoeMessage[],
  config: AgentConfig
): Promise<string> {
  // Try Poe first
  if (POE_API_KEY) {
    try {
      const result = await callPoeAPI(model, messages, config);
      if (result && result.trim().length > 0) {
        console.log(`[Model Router] Poe API success (${model})`);
        return result;
      }
    } catch (error) {
      console.error('[Model Router] Poe API failed:', error instanceof Error ? error.message : error);
    }
  }
  
  // Fallback to OpenRouter
  if (OPENROUTER_API_KEY) {
    try {
      // Map Poe model name to OpenRouter equivalent
      const openRouterModel = model === POE_MODELS.advanced
        ? OPENROUTER_MODELS.advanced
        : OPENROUTER_MODELS.standard;
      
      const result = await callOpenRouterAPI(openRouterModel, messages, config);
      if (result && result.trim().length > 0) {
        console.log(`[Model Router] OpenRouter success (${openRouterModel})`);
        return result;
      }
    } catch (error) {
      console.error('[Model Router] OpenRouter failed:', error instanceof Error ? error.message : error);
    }
  }
  
  // Both APIs failed
  throw new Error('All LLM APIs unavailable');
}

/**
 * Call Poe API (SSE streaming response)
 * 
 * Poe Protocol: POST to /bot/{botName} with query messages
 * Response: Server-Sent Events with text chunks
 * Roles: system, user, bot (NOT assistant)
 */
async function callPoeAPI(
  model: string,
  messages: PoeMessage[],
  config: AgentConfig
): Promise<string> {
  // Map roles: Poe uses "bot" instead of "assistant"
  const poeMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'bot' : m.role,
    content: m.content,
    content_type: 'text/markdown',
  }));
  
  const response = await fetch(`${POE_BASE_URL}/${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${POE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: '1.0',
      type: 'query',
      query: poeMessages,
      temperature: config.temperature || 0.7,
      user_id: '', // Will be assigned by Poe
      conversation_id: '', // Stateless — each call is independent
      message_id: '',
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Poe API HTTP ${response.status}: ${errorText.slice(0, 200)}`);
  }
  
  // Parse SSE response
  return parsePoeSSE(response);
}

/**
 * Call OpenRouter API (standard OpenAI-compatible REST)
 * This is the reliable fallback — proper JSON request/response
 */
async function callOpenRouterAPI(
  model: string,
  messages: PoeMessage[],
  config: AgentConfig
): Promise<string> {
  // OpenRouter uses standard OpenAI roles: system, user, assistant
  const openAiMessages = messages.map(m => ({
    role: m.role,
    content: m.content,
  }));
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://arabiq.tech',
      'X-Title': 'ArabIQ AI Agent',
    },
    body: JSON.stringify({
      model,
      messages: openAiMessages,
      temperature: config.temperature || 0.7,
      max_tokens: config.maxResponseLen || 500,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenRouter HTTP ${response.status}: ${errorText.slice(0, 200)}`);
  }
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Generate local response without API call
 */
export function generateLocalResponse(
  intent: IntentType,
  locale: string,
  config: AgentConfig,
  entities: string[] = []
): string {
  const isArabic = locale === 'ar';
  
  switch (intent) {
    case 'greeting':
      return isArabic
        ? config.greetingAr || `مرحباً! أنا ${config.agentNameAr || config.agentName}، مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟`
        : config.greeting || `Hello! I'm ${config.agentName}, your AI assistant. How can I help you today?`;
    
    case 'farewell':
      return isArabic
        ? 'شكراً لك! يسعدني خدمتك دائماً. مع السلامة!'
        : 'Thank you! I\'m always here to help. Goodbye!';
    
    case 'confirmation':
      return isArabic
        ? 'تمام! كيف يمكنني مساعدتك أكثر؟'
        : 'Great! How else can I assist you?';
    
    case 'help':
      return isArabic
        ? `يمكنني مساعدتك في:\n• البحث عن المنتجات\n• الاستفسار عن الأسعار\n• التنقل في المعرض\n• مقارنة المنتجات\n• معلومات التواصل\n\nما الذي تود معرفته؟`
        : `I can help you with:\n• Searching for products\n• Price inquiries\n• Navigating the showroom\n• Comparing items\n• Contact information\n\nWhat would you like to know?`;
    
    case 'product_search': {
      const entityStr = entities.length > 0 ? entities.join(', ') : '';
      return isArabic
        ? `يسعدني مساعدتك في البحث${entityStr ? ` عن ${entityStr}` : ''}! يمكنني عرض منتجاتنا المتوفرة. ماذا تبحث عنه تحديداً؟`
        : `I'd love to help you ${entityStr ? `find ${entityStr}` : 'browse our products'}! What specifically are you looking for?`;
    }
    
    case 'price_inquiry': {
      const item = entities.length > 0 ? entities[0] : '';
      return isArabic
        ? `سأساعدك بمعلومات الأسعار${item ? ` لـ ${item}` : ''}. هل يمكنك تحديد المنتج الذي تريد معرفة سعره؟`
        : `I'll help you with pricing${item ? ` for ${item}` : ''}. Could you specify which product you'd like to know the price of?`;
    }
    
    case 'navigation': {
      const target = entities.length > 0 ? entities[0] : '';
      return isArabic
        ? `سأوجهك${target ? ` إلى ${target}` : ' في الجولة'}! أخبرني أين تريد الذهاب.`
        : `I'll guide you${target ? ` to ${target}` : ' through the tour'}! Tell me where you'd like to go.`;
    }
    
    case 'comparison':
      return isArabic
        ? 'يمكنني مساعدتك في المقارنة بين المنتجات. حدد لي المنتجين الذين تريد مقارنتهما.'
        : 'I can help you compare products. Which two items would you like to compare?';
    
    case 'availability': {
      const product = entities.length > 0 ? entities[0] : '';
      return isArabic
        ? `سأتحقق من التوفر${product ? ` لـ ${product}` : ''} لك. يمكنني عرض جميع المنتجات المتوفرة حالياً.`
        : `I'll check availability${product ? ` for ${product}` : ''} for you. I can show you all currently available items.`;
    }
    
    case 'business_info':
      return isArabic
        ? 'يمكنني تزويدك بمعلومات التواصل وساعات العمل. ماذا تريد أن تعرف تحديداً؟ [[WHATSAPP]]'
        : 'I can provide you with contact information and business hours. What would you like to know specifically? [[WHATSAPP]]';
    
    case 'lead_capture':
      return isArabic
        ? 'ممتاز! يسعدنا خدمتك. يمكنك التواصل معنا مباشرة: [[WHATSAPP]] [[LEAD:both]]'
        : 'Excellent! We\'d love to help you. You can reach us directly: [[WHATSAPP]] [[LEAD:both]]';
    
    case 'out_of_scope':
      return isArabic
        ? 'عذراً، أنا متخصص في مساعدتك بخصوص منتجاتنا وخدماتنا فقط. هل يمكنني مساعدتك بشيء متعلق بمعرضنا؟'
        : 'I apologize, but I\'m specialized in helping with our products and services only. Can I assist you with something related to our store?';
    
    case 'general_question':
    default:
      return isArabic
        ? 'أنا هنا لمساعدتك! يمكنني البحث عن المنتجات، تقديم الأسعار، أو ربطك بفريق التواصل. ما الذي تريده؟'
        : 'I\'m here to help! I can search for products, provide pricing, or connect you with our team. What would you like?';
  }
}

/**
 * Get model information
 */
export function getModelInfo(tier: ModelTier): {
  name: string;
  description: string;
  tokensPerMinute: number;
} {
  const info = {
    local: {
      name: 'Local Templates',
      description: 'Fast template-based responses',
      tokensPerMinute: 999999,
    },
    standard: {
      name: POE_MODELS.standard,
      description: 'Fast and efficient for common queries',
      tokensPerMinute: 100000,
    },
    advanced: {
      name: POE_MODELS.advanced,
      description: 'Advanced reasoning for complex queries',
      tokensPerMinute: 50000,
    },
  };
  
  return info[tier] || info.standard;
}

/**
 * Estimate tokens for a message
 */
export function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token for English, ~2 for Arabic
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const totalChars = text.length;
  const englishChars = totalChars - arabicChars;
  
  return Math.ceil(englishChars / 4 + arabicChars / 2);
}

/**
 * Check if any LLM API is available
 */
export function isPoeApiAvailable(): boolean {
  return (!!POE_API_KEY && POE_API_KEY.length > 0) || (!!OPENROUTER_API_KEY && OPENROUTER_API_KEY.length > 0);
}
