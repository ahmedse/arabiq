/**
 * @fileoverview Context Builder
 * 
 * Builds optimized context for LLM calls including system prompt,
 * conversation history, business data, and available tools.
 */

import type {
  AgentContext,
  DemoConfig,
  TourItem,
  SessionMemory,
  IntentResult,
  PoeMessage,
  AgentConfig,
  KnowledgeEntry,
} from './types';

// ========================================
// System Prompt Templates
// ========================================

const SYSTEM_PROMPT_EN = `You are {agentName}, an AI assistant for {businessName}.

ROLE: {persona}

STRICT RULES:
1. ONLY answer from the provided business data below. NEVER make up products, prices, or information.
2. NEVER answer general questions outside this business (weather, news, coding, etc.).
3. If asked about something not in the catalog, say "We don't carry that item."
4. If asked an out-of-scope question, politely redirect to business topics.
5. Be helpful, professional, and concise. Keep responses SHORT — 2-4 sentences max.
6. ALWAYS use the exact item IDs from the catalog when referring to items.

ACTION MARKERS (use these in your response — they become interactive buttons):
- To show a "Go to item" button: [[FLY_TO:itemId:Item Title]]
- To show a WhatsApp button: [[WHATSAPP:{whatsapp}:Your message here]]
- To show a lead/contact form: [[LEAD:inquiry]] or [[LEAD:booking]]
- When listing items, put [[FLY_TO:id:title]] after EACH item.

CONVERSATION AWARENESS:
- If user says "the first one", "the second", "that one", "it" — look at what items you showed previously in this conversation and resolve the reference.
- If user says "cheaper" or "more expensive" — compare against the last discussed item's price.
- If user says "show me the [adjective] one" — match against your previously listed items.
- Handle typos naturally — "show ,e" means "show me", "ovn" means "oven".

AVAILABLE ITEMS:
{items}

{knowledge}

CONTACT INFO:
{contact}

Respond in English. Be conversational but professional.`;

const SYSTEM_PROMPT_AR = `أنت {agentName}، مساعد ذكي لـ {businessName}.

الدور: {persona}

قواعد صارمة:
1. أجب فقط من بيانات العمل المتوفرة أدناه. لا تختلق منتجات أو أسعار أو معلومات.
2. لا تجب على أسئلة عامة خارج هذا العمل (الطقس، الأخبار، البرمجة، إلخ).
3. إذا سُئلت عن شيء غير موجود في الكتالوج، قل "نحن لا نحمل هذا المنتج."
4. إذا سُئلت سؤالاً خارج النطاق، أعد التوجيه بأدب إلى مواضيع العمل.
5. كن مفيداً ومحترفاً ومختصراً. اجعل الردود قصيرة — 2-4 جمل كحد أقصى.
6. استخدم دائماً معرّفات العناصر من الكتالوج عند الإشارة إليها.

علامات الإجراءات (استخدمها في ردك — تصبح أزراراً تفاعلية):
- لعرض زر "اذهب للعنصر": [[FLY_TO:معرف_العنصر:عنوان العنصر]]
- لعرض زر واتساب: [[WHATSAPP:{whatsapp}:رسالتك هنا]]
- لعرض نموذج تواصل: [[LEAD:inquiry]] أو [[LEAD:booking]]
- عند سرد العناصر، ضع [[FLY_TO:id:title]] بعد كل عنصر.

الوعي بالمحادثة:
- إذا قال المستخدم "الأول"، "الثاني"، "هذا"، "ذلك" — ابحث في العناصر التي عرضتها سابقاً.
- إذا قال "أرخص" أو "أغلى" — قارن بسعر العنصر الأخير.
- تعامل مع الأخطاء الإملائية بشكل طبيعي.

العناصر المتوفرة:
{items}

{knowledge}

معلومات الاتصال:
{contact}

أجب بالعربية. كن محادثاً ولكن محترفاً.`;

// ========================================
// Context Building
// ========================================

/**
 * Build complete context for agent processing
 */
export function buildContext(
  demo: DemoConfig,
  items: TourItem[],
  session: SessionMemory,
  intent: IntentResult,
  locale: string,
  knowledgeEntries: KnowledgeEntry[] = []
): {
  systemPrompt: string;
  messages: PoeMessage[];
  toolDescriptions: string;
  itemsMap: Map<string, TourItem>;
} {
  const config = demo.agentConfig || getDefaultConfig(demo);
  const isArabic = locale === 'ar';
  
  // Build system prompt
  const systemPrompt = buildSystemPrompt(demo, items, config, isArabic, knowledgeEntries);
  
  // Build conversation messages
  const messages = buildMessages(session, systemPrompt, isArabic);
  
  // Build tool descriptions (for future use)
  const toolDescriptions = buildToolDescriptions(demo.type, isArabic);
  
  // Create items map for quick lookup
  const itemsMap = new Map(items.map(item => [item.id, item]));
  
  return {
    systemPrompt,
    messages,
    toolDescriptions,
    itemsMap,
  };
}

/**
 * Build system prompt with business context
 */
function buildSystemPrompt(
  demo: DemoConfig,
  items: TourItem[],
  config: AgentConfig,
  isArabic: boolean,
  knowledgeEntries: KnowledgeEntry[] = []
): string {
  const template = isArabic ? SYSTEM_PROMPT_AR : SYSTEM_PROMPT_EN;
  
  // Format items list (token-efficient) with specifications
  const itemsList = items
    .slice(0, 50) // Limit to first 50 items to save tokens
    .map(item => formatItemForContext(item, isArabic))
    .join('\n');
  
  // Format contact info - include direct business contact if available
  const contact = formatContactInfo(demo, config, isArabic);
  
  // Format knowledge base entries
  const knowledge = formatKnowledgeBase(knowledgeEntries, isArabic);
  
  // Replace placeholders
  return template
    .replace(/{agentName}/g, isArabic ? (config.agentNameAr || config.agentName) : config.agentName)
    .replace(/{businessName}/g, isArabic ? (demo.businessNameAr || demo.businessName) : demo.businessName)
    .replace(/{persona}/g, isArabic ? (config.personaAr || config.persona) : config.persona)
    .replace(/{items}/g, itemsList || (isArabic ? 'لا توجد عناصر متوفرة حالياً.' : 'No items available currently.'))
    .replace(/{knowledge}/g, knowledge)
    .replace(/{contact}/g, contact)
    .replace(/{whatsapp}/g, demo.businessWhatsapp || demo.businessPhone || '');
}

/**
 * Format a single item for context (with specifications)
 */
function formatItemForContext(item: TourItem, isArabic: boolean): string {
  const title = isArabic && item.titleAr ? item.titleAr : item.title;
  const desc = isArabic && item.descriptionAr ? item.descriptionAr : item.description;
  const price = item.price ? ` - ${item.price} ${item.currency || 'EGP'}` : '';
  const available = item.available === false ? (isArabic ? ' (غير متوفر)' : ' (unavailable)') : '';
  
  let result = `• ${title} [ID: ${item.id}]${price}${available} → use [[FLY_TO:${item.id}:${title}]]`;
  
  // Add description if available
  if (desc) {
    result += `\n  ${desc}`;
  }
  
  // Add specifications if available
  if (item.specifications && Object.keys(item.specifications).length > 0) {
    const specs = Object.entries(item.specifications)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    result += `\n  ${isArabic ? 'المواصفات' : 'Specs'}: ${specs}`;
  }
  
  return result;
}

/**
 * Format contact information (includes business contact from demo)
 */
function formatContactInfo(
  demo: DemoConfig,
  config: AgentConfig,
  isArabic: boolean
): string {
  const lines: string[] = [];
  
  // Try business contact from demo first
  if (demo.businessPhone) {
    lines.push(isArabic ? `الهاتف: ${demo.businessPhone}` : `Phone: ${demo.businessPhone}`);
  } else if (config.contact?.phone) {
    lines.push(isArabic ? `الهاتف: ${config.contact.phone}` : `Phone: ${config.contact.phone}`);
  }
  
  if (demo.businessWhatsapp) {
    lines.push(isArabic ? `واتساب: ${demo.businessWhatsapp}` : `WhatsApp: ${demo.businessWhatsapp}`);
  } else if (config.contact?.whatsapp) {
    lines.push(isArabic ? `واتساب: ${config.contact.whatsapp}` : `WhatsApp: ${config.contact.whatsapp}`);
  }
  
  if (demo.businessEmail) {
    lines.push(isArabic ? `البريد: ${demo.businessEmail}` : `Email: ${demo.businessEmail}`);
  } else if (config.contact?.email) {
    lines.push(isArabic ? `البريد: ${config.contact.email}` : `Email: ${config.contact.email}`);
  }
  
  if (config.contact?.address) {
    const address = isArabic && config.contact.addressAr ? config.contact.addressAr : config.contact.address;
    lines.push(isArabic ? `العنوان: ${address}` : `Address: ${address}`);
  }
  
  return lines.join('\n') || (isArabic ? 'معلومات الاتصال غير متوفرة.' : 'Contact info not available.');
}

/**
 * Format knowledge base entries (token-efficient)
 */
function formatKnowledgeBase(
  entries: KnowledgeEntry[],
  isArabic: boolean
): string {
  if (!entries || entries.length === 0) {
    return '';
  }
  
  const header = isArabic ? 'قاعدة المعرفة:' : 'KNOWLEDGE BASE:';
  const formatted = entries.map(entry => {
    return `Q: ${entry.question}\nA: ${entry.answer}`;
  }).join('\n\n');
  
  return `${header}\n${formatted}`;
}

/**
 * Build conversation messages for API
 */
function buildMessages(
  session: SessionMemory,
  systemPrompt: string,
  isArabic: boolean
): PoeMessage[] {
  const messages: PoeMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
  ];
  
  // Add recent conversation history (last 10 messages to save tokens)
  const recentMessages = session.messages.slice(-10);
  
  for (const msg of recentMessages) {
    if (msg.role === 'system') continue; // Skip system messages from history
    
    messages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    });
  }
  
  return messages;
}

/**
 * Build tool descriptions (for future tool use)
 */
function buildToolDescriptions(demoType: string, isArabic: boolean): string {
  const tools = getAvailableTools(demoType);
  
  if (tools.length === 0) {
    return isArabic ? 'لا توجد أدوات متاحة.' : 'No tools available.';
  }
  
  const header = isArabic ? 'الأدوات المتاحة:' : 'Available Tools:';
  const toolList = tools
    .map(tool => {
      const name = tool.name;
      const desc = isArabic ? tool.descriptionAr : tool.description;
      return `• ${name}: ${desc}`;
    })
    .join('\n');
  
  return `${header}\n${toolList}`;
}

/**
 * Get available tools for a demo type (stub for now)
 */
function getAvailableTools(demoType: string): Array<{
  name: string;
  description: string;
  descriptionAr: string;
}> {
  // Future: Real tool definitions
  return [
    {
      name: 'navigate',
      description: 'Navigate to a specific item in the tour',
      descriptionAr: 'الانتقال إلى عنصر معين في الجولة',
    },
    {
      name: 'search',
      description: 'Search for items by category or keyword',
      descriptionAr: 'البحث عن عناصر حسب الفئة أو الكلمة الرئيسية',
    },
  ];
}

// ========================================
// Default Configuration
// ========================================

/**
 * Get default agent configuration for a demo
 */
export function getDefaultConfig(demo: DemoConfig): AgentConfig {
  // Customize by demo type
  const configs: Record<string, Partial<AgentConfig>> = {
    retail: {
      agentName: 'Retail Assistant',
      agentNameAr: 'مساعد المبيعات',
      persona: 'A helpful retail sales assistant who knows the product catalog well',
      personaAr: 'مساعد مبيعات مفيد يعرف كتالوج المنتجات جيداً',
      greeting: 'Hello! How can I help you find what you need today?',
      greetingAr: 'مرحباً! كيف يمكنني مساعدتك في إيجاد ما تحتاجه اليوم؟',
      suggestedPrompts: [
        'Show me refrigerators',
        'What\'s on sale?',
        'Compare two items',
        'Contact information',
      ],
      suggestedPromptsAr: [
        'أرني الثلاجات',
        'ما هي العروض؟',
        'قارن بين منتجين',
        'معلومات التواصل',
      ],
    },
    'real-estate': {
      agentName: 'Property Consultant',
      agentNameAr: 'مستشار عقاري',
      persona: 'A knowledgeable property consultant who helps find the perfect space',
      personaAr: 'مستشار عقاري ذو خبرة يساعد في إيجاد المكان المثالي',
      greeting: 'Welcome! I\'m here to help you explore our properties.',
      greetingAr: 'مرحباً! أنا هنا لمساعدتك في استكشاف عقاراتنا.',
      suggestedPrompts: [
        'Show me available offices',
        'What are the prices?',
        'Tell me about the location',
        'Schedule a visit',
      ],
      suggestedPromptsAr: [
        'أرني المكاتب المتاحة',
        'ما هي الأسعار؟',
        'أخبرني عن الموقع',
        'جدولة زيارة',
      ],
    },
  };
  
  const typeConfig = configs[demo.type] || configs.retail;
  
  return {
    agentName: typeConfig.agentName || 'AI Assistant',
    agentNameAr: typeConfig.agentNameAr || 'المساعد الذكي',
    persona: typeConfig.persona || 'A helpful assistant',
    personaAr: typeConfig.personaAr || 'مساعد مفيد',
    greeting: typeConfig.greeting || 'Hello! How can I help?',
    greetingAr: typeConfig.greetingAr || 'مرحباً! كيف يمكنني المساعدة؟',
    modelTier: 'standard',
    dailyMsgLimit: 200,
    enableLeadCapture: true,
    enableNavigation: true,
    suggestedPrompts: typeConfig.suggestedPrompts || [],
    suggestedPromptsAr: typeConfig.suggestedPromptsAr || [],
    temperature: 0.7,
    maxResponseLen: 500,
    contact: {
      phone: demo.businessName?.includes('Awni') ? '+20 123 456 789' : undefined,
      whatsapp: demo.businessName?.includes('Awni') ? '+20 123 456 789' : undefined,
      email: 'info@example.com',
      address: 'Alexandria, Egypt',
      addressAr: 'الإسكندرية، مصر',
    },
  };
}

/**
 * Estimate total token count for context
 */
export function estimateContextTokens(
  systemPrompt: string,
  messages: PoeMessage[]
): number {
  let total = 0;
  
  // System prompt
  total += estimateTokens(systemPrompt);
  
  // Messages
  for (const msg of messages) {
    total += estimateTokens(msg.content);
    total += 4; // Overhead per message
  }
  
  return total;
}

/**
 * Estimate tokens for text (same as model-router)
 */
function estimateTokens(text: string): number {
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const totalChars = text.length;
  const englishChars = totalChars - arabicChars;
  
  return Math.ceil(englishChars / 4 + arabicChars / 2);
}
