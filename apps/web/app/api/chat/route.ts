/**
 * AI Chat API Route
 * Integrates with Poe.com API for context-aware AI chat with product intelligence
 * 
 * Features:
 * - Context-aware responses based on demo type
 * - Product/item knowledge for intelligent recommendations
 * - Navigation commands to fly to products in the tour
 */

import { NextRequest, NextResponse } from 'next/server';

const POE_API_KEY = process.env.POE_API_KEY;
// Use OpenRouter as fallback (more reliable API)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Simplified item info for AI context
interface ItemInfo {
  id: number;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  category?: string;
  // Additional fields for different demo types
  extras?: Record<string, unknown>;
}

interface ChatRequest {
  message: string;
  demoId: string;
  demoType: string;
  demoTitle: string;
  businessName?: string;
  currentLocation?: string;
  history: ChatMessage[];
  locale: string;
  // NEW: Items/products in the tour for AI context
  items?: ItemInfo[];
}

// Response with optional navigation command
interface ChatResponse {
  message: string;
  timestamp: string;
  // Navigation command to fly to a specific item
  navigation?: {
    action: 'flyTo';
    itemId: number;
    itemName: string;
  };
}

// Build context-aware system prompt based on demo type
function buildSystemPrompt(
  demoType: string,
  demoTitle: string,
  businessName?: string,
  currentLocation?: string,
  locale: string = 'en'
): string {
  const isArabic = locale === 'ar';
  const locationContext = currentLocation 
    ? isArabic 
      ? `المستخدم حالياً يشاهد: ${currentLocation}.`
      : `The user is currently viewing: ${currentLocation}.`
    : '';

  const prompts: Record<string, { en: string; ar: string }> = {
    ecommerce: {
      en: `You are a friendly and knowledgeable shopping assistant for ${businessName || demoTitle}, an electronics store. You help customers find products, answer questions about specifications, compare items, and guide them through the virtual store. ${locationContext}

Key behaviors:
- Be helpful, concise, and enthusiastic about products
- Suggest relevant products based on customer needs
- Offer to navigate them to product locations
- Provide pricing and availability information when asked
- If asked about checkout, explain you can guide them through the process
- Keep responses brief (2-3 sentences max unless explaining technical details)`,
      ar: `أنت مساعد تسوق ودود ومطلع في ${businessName || demoTitle}، متجر إلكترونيات. تساعد العملاء في العثور على المنتجات والإجابة على الأسئلة حول المواصفات ومقارنة العناصر وإرشادهم خلال المتجر الافتراضي. ${locationContext}

السلوكيات الرئيسية:
- كن مفيداً وموجزاً ومتحمساً للمنتجات
- اقترح منتجات ذات صلة بناءً على احتياجات العميل
- اعرض توجيههم إلى مواقع المنتجات
- قدم معلومات الأسعار والتوافر عند السؤال
- إذا سُئلت عن الدفع، اشرح أنه يمكنك إرشادهم خلال العملية
- اجعل الردود مختصرة (2-3 جمل كحد أقصى إلا عند شرح التفاصيل التقنية)`
    },
    showroom: {
      en: `You are an interior design consultant for ${businessName || demoTitle}, a premium furniture showroom. You help customers explore furniture collections, discuss materials and dimensions, and create the perfect space for their homes. ${locationContext}

Key behaviors:
- Be sophisticated and knowledgeable about design
- Discuss materials, craftsmanship, and design philosophy
- Help customers visualize pieces in their space
- Suggest complementary items and complete looks
- Provide pricing and delivery information
- Keep responses elegant and concise`,
      ar: `أنت مستشار تصميم داخلي في ${businessName || demoTitle}، معرض أثاث فاخر. تساعد العملاء في استكشاف مجموعات الأثاث ومناقشة المواد والأبعاد وإنشاء المساحة المثالية لمنازلهم. ${locationContext}

السلوكيات الرئيسية:
- كن أنيقاً ومطلعاً على التصميم
- ناقش المواد والحرفية وفلسفة التصميم
- ساعد العملاء في تصور القطع في مساحتهم
- اقترح عناصر مكملة ومظهراً متكاملاً
- قدم معلومات الأسعار والتوصيل
- اجعل الردود أنيقة وموجزة`
    },
    cafe: {
      en: `You are a friendly host at ${businessName || demoTitle}, a welcoming café. You help guests explore the menu, make recommendations based on their preferences, and take reservations. ${locationContext}

Key behaviors:
- Be warm, welcoming, and conversational
- Share enthusiasm about signature dishes and drinks
- Ask about dietary preferences and allergies
- Recommend daily specials and popular items
- Help with table reservations
- Keep a casual, friendly tone`,
      ar: `أنت مضيف ودود في ${businessName || demoTitle}، مقهى ترحيبي. تساعد الضيوف في استكشاف القائمة وتقديم التوصيات بناءً على تفضيلاتهم وإجراء الحجوزات. ${locationContext}

السلوكيات الرئيسية:
- كن دافئاً ومرحباً ومحادثاً
- شارك الحماس حول الأطباق والمشروبات المميزة
- اسأل عن التفضيلات الغذائية والحساسية
- أوصِ بالعروض اليومية والعناصر الشائعة
- ساعد في حجوزات الطاولات
- حافظ على نبرة ودية غير رسمية`
    },
    hotel: {
      en: `You are a professional concierge at ${businessName || demoTitle}, a luxury hotel. You help guests explore room options, amenities, and make bookings. ${locationContext}

Key behaviors:
- Be professional, courteous, and attentive
- Describe room features and amenities in detail
- Help compare room types and pricing
- Answer questions about hotel services
- Assist with booking and special requests
- Maintain a refined, helpful demeanor`,
      ar: `أنت كونسيرج محترف في ${businessName || demoTitle}، فندق فاخر. تساعد الضيوف في استكشاف خيارات الغرف ووسائل الراحة وإجراء الحجوزات. ${locationContext}

السلوكيات الرئيسية:
- كن محترفاً ومهذباً ومنتبهاً
- صف ميزات الغرفة ووسائل الراحة بالتفصيل
- ساعد في مقارنة أنواع الغرف والأسعار
- أجب عن الأسئلة حول خدمات الفندق
- ساعد في الحجز والطلبات الخاصة
- حافظ على سلوك راقٍ ومفيد`
    },
    realestate: {
      en: `You are a professional real estate agent showing ${businessName || demoTitle}. You provide detailed information about the property, its features, location, and help potential buyers or renters make informed decisions. ${locationContext}

Key behaviors:
- Be professional and knowledgeable
- Highlight key property features and benefits
- Discuss the neighborhood and local amenities
- Answer questions about pricing, financing, and terms
- Schedule viewings and follow-up discussions
- Be honest about pros and cons`,
      ar: `أنت وكيل عقارات محترف تعرض ${businessName || demoTitle}. تقدم معلومات مفصلة عن العقار وميزاته وموقعه وتساعد المشترين أو المستأجرين المحتملين في اتخاذ قرارات مستنيرة. ${locationContext}

السلوكيات الرئيسية:
- كن محترفاً ومطلعاً
- أبرز الميزات والفوائد الرئيسية للعقار
- ناقش الحي والمرافق المحلية
- أجب عن الأسئلة حول التسعير والتمويل والشروط
- جدول المشاهدات ومناقشات المتابعة
- كن صادقاً بشأن الإيجابيات والسلبيات`
    }
  };

  const demoPrompt = prompts[demoType] || prompts.ecommerce;
  return isArabic ? demoPrompt.ar : demoPrompt.en;
}

// Build items context for the AI to know about available products
function buildItemsContext(items: ItemInfo[], demoType: string, locale: string): string {
  if (!items || items.length === 0) return '';
  
  const isArabic = locale === 'ar';
  const typeLabels: Record<string, { en: string; ar: string }> = {
    ecommerce: { en: 'Products', ar: 'المنتجات' },
    showroom: { en: 'Furniture Items', ar: 'قطع الأثاث' },
    cafe: { en: 'Menu Items', ar: 'عناصر القائمة' },
    hotel: { en: 'Rooms', ar: 'الغرف' },
    realestate: { en: 'Property Features', ar: 'ميزات العقار' },
  };
  
  const label = typeLabels[demoType] || typeLabels.ecommerce;
  const header = isArabic ? `\n\n${label.ar} المتاحة:` : `\n\nAvailable ${label.en}:`;
  
  const itemsList = items.map((item, idx) => {
    const priceStr = item.price 
      ? ` - ${item.currency || 'EGP'} ${item.price.toLocaleString()}`
      : '';
    const categoryStr = item.category ? ` (${item.category})` : '';
    const desc = item.description ? ` - ${item.description.slice(0, 100)}${item.description.length > 100 ? '...' : ''}` : '';
    return `${idx + 1}. [ID:${item.id}] ${item.name}${categoryStr}${priceStr}${desc}`;
  }).join('\n');
  
  const navInstruction = isArabic
    ? '\n\nعندما يسأل المستخدم عن منتج محدد، يمكنك عرض التنقل إليه. استخدم التنسيق: [[FLY_TO:ID]] حيث ID هو رقم المنتج.'
    : '\n\nWhen a user asks about a specific product, you can offer to navigate to it. Use the format: [[FLY_TO:ID]] where ID is the product number.';
  
  return header + '\n' + itemsList + navInstruction;
}

// Format messages for OpenAI-compatible API
function formatMessages(
  systemPrompt: string,
  itemsContext: string,
  history: ChatMessage[],
  newMessage: string
): Array<{ role: string; content: string }> {
  return [
    { role: 'system', content: systemPrompt + itemsContext },
    ...history.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: newMessage }
  ];
}

// Parse AI response for navigation commands
function parseNavigationCommand(
  response: string,
  items: ItemInfo[]
): { cleanedResponse: string; navigation?: ChatResponse['navigation'] } {
  // Look for [[FLY_TO:123]] pattern
  const flyToMatch = response.match(/\[\[FLY_TO:(\d+)\]\]/);
  
  if (flyToMatch) {
    const itemId = parseInt(flyToMatch[1], 10);
    const item = items.find(i => i.id === itemId);
    
    if (item) {
      // Remove the command from the visible response
      const cleanedResponse = response.replace(/\[\[FLY_TO:\d+\]\]/g, '').trim();
      return {
        cleanedResponse,
        navigation: {
          action: 'flyTo',
          itemId: item.id,
          itemName: item.name,
        }
      };
    }
  }
  
  return { cleanedResponse: response };
}

// Call AI API using Poe's API (via fastapi_poe compatible endpoint)
async function callAI(messages: Array<{ role: string; content: string }>): Promise<string> {
  // Try Poe API first - using their REST endpoint
  if (POE_API_KEY) {
    try {
      // Poe uses a specific API format - we'll use their GraphQL-based API
      // Combine messages into a single query for Poe
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      const userMessages = messages.filter(m => m.role !== 'system');
      const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';
      
      // Build context with system prompt + conversation history
      const conversationContext = userMessages.slice(0, -1).map(m => 
        `${m.role === 'user' ? 'Customer' : 'Assistant'}: ${m.content}`
      ).join('\n');
      
      const fullQuery = `${systemMessage}\n\n${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ''}Customer: ${lastUserMessage}`;
      
      // Call Poe API using their bot query endpoint
      const response = await fetch('https://api.poe.com/bot/GPT-3.5-Turbo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${POE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: '1.0',
          type: 'query',
          query: [{ role: 'user', content: fullQuery }],
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.text || data.response || data.content || '';
        if (text) return text;
      } else {
        console.error('Poe API response not ok:', response.status, await response.text().catch(() => ''));
      }
    } catch (error) {
      console.error('Poe API error:', error);
    }
  }

  // Try OpenRouter as backup (for future setup)
  if (OPENROUTER_API_KEY) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://arabiq.io',
          'X-Title': 'ArabIQ Virtual Tours',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free', // Free tier model
          messages,
          temperature: 0.7,
          max_tokens: 400,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
      }
    } catch (error) {
      console.error('OpenRouter API error:', error);
    }
  }

  // Use intelligent fallback with product knowledge
  return generateSmartFallback(messages);
}

// Smart fallback response using product knowledge
function generateSmartFallback(messages: Array<{ role: string; content: string }>): string {
  const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
  const systemPrompt = messages[0]?.content || '';
  
  // Detect Arabic
  const isArabic = /[\u0600-\u06FF]/.test(lastUserMessage);
  
  // Extract products from system prompt
  const productMatches = systemPrompt.match(/\[ID:(\d+)\]\s+([^\n-]+)/g) || [];
  const products = productMatches.map(m => {
    const match = m.match(/\[ID:(\d+)\]\s+([^-\n]+)/);
    return match ? { id: match[1], name: match[2].trim() } : null;
  }).filter(Boolean);
  
  // Check if user is asking about a specific product
  for (const product of products) {
    if (product && lastUserMessage.includes(product.name.toLowerCase().split(' ')[0])) {
      const response = isArabic
        ? `نعم! لدينا ${product.name}. هل تريدني أن آخذك إليه في الجولة؟`
        : `Yes! We have ${product.name}. Would you like me to take you there in the tour?`;
      return response + ` [[FLY_TO:${product.id}]]`;
    }
  }
  
  // Check for common queries
  if (lastUserMessage.includes('show') || lastUserMessage.includes('أرني') || lastUserMessage.includes('عرض')) {
    if (products.length > 0) {
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      if (randomProduct) {
        const response = isArabic
          ? `دعني أريك ${randomProduct.name}!`
          : `Let me show you ${randomProduct.name}!`;
        return response + ` [[FLY_TO:${randomProduct.id}]]`;
      }
    }
  }
  
  if (lastUserMessage.includes('what') || lastUserMessage.includes('ماذا') || lastUserMessage.includes('ما هي')) {
    if (products.length > 0) {
      const productNames = products.slice(0, 3).map(p => p?.name).join(', ');
      return isArabic
        ? `لدينا مجموعة رائعة بما في ذلك ${productNames}. ما الذي يثير اهتمامك؟`
        : `We have a great selection including ${productNames}. What interests you?`;
    }
  }
  
  if (lastUserMessage.includes('price') || lastUserMessage.includes('سعر') || lastUserMessage.includes('كم')) {
    return isArabic 
      ? 'يمكنني مساعدتك في معرفة الأسعار! أي منتج تريد الاستفسار عنه؟ يمكنك أيضاً الضغط على أي منتج في الجولة لرؤية تفاصيله.'
      : 'I can help you with pricing! Which product would you like to know about? You can also click on any product in the tour to see its details.';
  }
  
  if (lastUserMessage.includes('help') || lastUserMessage.includes('مساعدة')) {
    return isArabic
      ? 'بالطبع! يمكنني مساعدتك في: 🔹 العثور على منتجات معينة 🔹 معرفة الأسعار 🔹 التنقل في الجولة 🔹 الإجابة على استفساراتك. ماذا تريد أن تعرف؟'
      : 'Of course! I can help you with: 🔹 Finding specific products 🔹 Checking prices 🔹 Navigating the tour 🔹 Answering your questions. What would you like to know?';
  }
  
  if (lastUserMessage.includes('hello') || lastUserMessage.includes('hi') || lastUserMessage.includes('مرحبا') || lastUserMessage.includes('أهلا')) {
    if (products.length > 0) {
      return isArabic
        ? `مرحباً! 👋 أنا مساعدك الذكي. لدينا ${products.length} منتج متاح. اسألني عن أي شيء أو قل "أرني شيئاً" وسآخذك إليه!`
        : `Hello! 👋 I'm your smart assistant. We have ${products.length} products available. Ask me about anything or say "show me something" and I'll take you there!`;
    }
    return isArabic
      ? 'مرحباً! 👋 كيف يمكنني مساعدتك في جولتك الافتراضية اليوم؟'
      : 'Hello! 👋 How can I help you with your virtual tour today?';
  }
  
  // Default helpful response
  return isArabic
    ? 'أنا هنا لمساعدتك! يمكنني إرشادك حول المنتجات والأسعار والتنقل في الجولة. ماذا تريد أن تعرف؟'
    : 'I\'m here to help! I can guide you about products, prices, and navigate the tour. What would you like to know?';
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, demoType, demoTitle, businessName, currentLocation, history, locale, items } = body;
    
    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Build context-aware system prompt
    const systemPrompt = buildSystemPrompt(
      demoType || 'ecommerce',
      demoTitle || 'Virtual Tour',
      businessName,
      currentLocation,
      locale || 'en'
    );
    
    // Build items context
    const itemsContext = buildItemsContext(items || [], demoType || 'ecommerce', locale || 'en');
    
    // Format messages for API
    const messages = formatMessages(systemPrompt, itemsContext, history || [], message);
    
    // Get AI response
    const rawResponse = await callAI(messages);
    
    // Parse for navigation commands
    const { cleanedResponse, navigation } = parseNavigationCommand(rawResponse, items || []);
    
    const response: ChatResponse = {
      message: cleanedResponse,
      timestamp: new Date().toISOString(),
    };
    
    if (navigation) {
      response.navigation = navigation;
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    poeConfigured: !!POE_API_KEY,
    openRouterConfigured: !!OPENROUTER_API_KEY,
  });
}
