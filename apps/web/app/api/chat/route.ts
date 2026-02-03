/**
 * AI Chat API Route
 * Integrates with Poe.com API for context-aware AI chat
 */

import { NextRequest, NextResponse } from 'next/server';

const POE_API_URL = 'https://api.poe.com/bot/GPT-4o-Mini';
const POE_API_KEY = process.env.POE_API_KEY;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
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

// Format messages for Poe API
function formatMessagesForPoe(
  systemPrompt: string,
  history: ChatMessage[],
  newMessage: string
): Array<{ role: string; content: string }> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: newMessage }
  ];
  
  return messages;
}

// Call Poe.com API
async function callPoeAPI(messages: Array<{ role: string; content: string }>): Promise<string> {
  if (!POE_API_KEY) {
    throw new Error('POE_API_KEY not configured');
  }

  try {
    // Poe uses a specific API format
    const response = await fetch(POE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      // Fallback to simulated response for demo purposes
      console.warn('Poe API not available, using fallback response');
      return generateFallbackResponse(messages);
    }

    const data = await response.json();
    return data.text || data.response || data.content || 'I apologize, I couldn\'t process that request.';
  } catch (error) {
    console.error('Poe API error:', error);
    // Return fallback response for demo
    return generateFallbackResponse(messages);
  }
}

// Fallback response generator for when API is unavailable
function generateFallbackResponse(messages: Array<{ role: string; content: string }>): string {
  const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
  const systemPrompt = messages[0]?.content || '';
  
  // Detect Arabic
  const isArabic = /[\u0600-\u06FF]/.test(lastUserMessage);
  
  // Simple keyword-based responses
  if (lastUserMessage.includes('price') || lastUserMessage.includes('سعر') || lastUserMessage.includes('كم')) {
    return isArabic 
      ? 'يمكنني مساعدتك في معرفة الأسعار! ما المنتج أو الخدمة التي تريد الاستفسار عنها؟'
      : 'I can help you with pricing! Which product or service would you like to know about?';
  }
  
  if (lastUserMessage.includes('help') || lastUserMessage.includes('مساعدة')) {
    return isArabic
      ? 'بالطبع! أنا هنا للمساعدة. كيف يمكنني مساعدتك اليوم؟'
      : 'Of course! I\'m here to help. What would you like to know?';
  }
  
  if (lastUserMessage.includes('book') || lastUserMessage.includes('reserve') || lastUserMessage.includes('حجز')) {
    return isArabic
      ? 'يسعدني مساعدتك في الحجز. ما التاريخ والوقت المفضلين لديك؟'
      : 'I\'d be happy to help you with a booking. What date and time would you prefer?';
  }
  
  if (lastUserMessage.includes('hello') || lastUserMessage.includes('hi') || lastUserMessage.includes('مرحبا') || lastUserMessage.includes('أهلا')) {
    return isArabic
      ? 'مرحباً بك! كيف يمكنني مساعدتك في جولتك الافتراضية اليوم؟'
      : 'Hello! How can I assist you with your virtual tour today?';
  }
  
  // Default response based on system prompt context
  if (systemPrompt.includes('furniture') || systemPrompt.includes('أثاث')) {
    return isArabic
      ? 'أنا هنا لمساعدتك في اختيار الأثاث المثالي لمنزلك. هل تبحث عن شيء محدد؟'
      : 'I\'m here to help you find the perfect furniture for your home. Are you looking for something specific?';
  }
  
  if (systemPrompt.includes('hotel') || systemPrompt.includes('فندق')) {
    return isArabic
      ? 'مرحباً بك في فندقنا! كيف يمكنني مساعدتك في اختيار الغرفة المثالية؟'
      : 'Welcome to our hotel! How can I help you choose the perfect room?';
  }
  
  return isArabic
    ? 'شكراً لرسالتك! كيف يمكنني مساعدتك اليوم؟'
    : 'Thanks for your message! How can I help you today?';
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, demoType, demoTitle, businessName, currentLocation, history, locale } = body;
    
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
    
    // Format messages for API
    const messages = formatMessagesForPoe(systemPrompt, history || [], message);
    
    // Get AI response
    const response = await callPoeAPI(messages);
    
    return NextResponse.json({
      message: response,
      timestamp: new Date().toISOString(),
    });
    
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
    configured: !!POE_API_KEY,
  });
}
