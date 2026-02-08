/**
 * @fileoverview Tool Execution System
 * 
 * Implements the 6 core tools that make this an AGENT (not just a chatbot):
 * 1. search_items - Search/filter items by criteria
 * 2. get_item_details - Get full details about a specific item
 * 3. navigate_to_item - Navigate user to item in 3D tour
 * 4. compare_items - Compare 2+ items side-by-side
 * 5. get_contact_info - Get business contact info (phone, WhatsApp, email)
 * 6. capture_lead - Capture user lead/inquiry
 * 
 * CRITICAL: Tools work WITHOUT LLM. They operate on in-memory CMS data.
 */

import type {
  AgentTool,
  ToolResult,
  AgentContext,
  TourItem,
  DemoConfig,
  IntentType,
} from './types';

// ========================================
// Tool Definitions
// ========================================

/**
 * Tool 1: Search/Filter Items
 * Find items matching criteria (category, price range, availability, etc.)
 */
const SEARCH_ITEMS_TOOL: AgentTool = {
  name: 'search_items',
  description: 'Search and filter items in the demo. Use this when user asks to see products, browse items, or find specific categories.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query (product name, category, brand)',
      },
      category: {
        type: 'string',
        description: 'Filter by category',
      },
      minPrice: {
        type: 'number',
        description: 'Minimum price',
      },
      maxPrice: {
        type: 'number',
        description: 'Maximum price',
      },
      available: {
        type: 'boolean',
        description: 'Only show available items',
      },
    },
    required: [],
  },
};

function executeSearchItems(
  params: Record<string, any>,
  context: AgentContext
): ToolResult {
  const { query, category, minPrice, maxPrice, available } = params;
  const items = context.items || [];
  
  if (items.length === 0) {
    return {
      success: false,
      displayText: context.locale === 'ar' 
        ? 'عذراً، لا توجد عناصر متاحة حالياً.'
        : 'Sorry, no items are currently available.',
      data: { items: [] },
    };
  }
  
  // Filter items
  let filtered = [...items];
  
  // Synonym map for common product terms → also search these aliases
  const SYNONYMS: Record<string, string[]> = {
    fridge: ['refrigerator', 'freezer'],
    refrigerator: ['fridge', 'freezer'],
    tv: ['television', 'screen', 'display'],
    television: ['tv', 'screen'],
    ac: ['air conditioner', 'air conditioning', 'cooling'],
    'air conditioner': ['ac', 'cooling'],
    oven: ['stove', 'cooker', 'microwave', 'gas oven'],
    stove: ['oven', 'cooker'],
    washer: ['washing machine', 'laundry'],
    'washing machine': ['washer', 'laundry'],
    heater: ['water heater', 'heating'],
    'water heater': ['heater'],
  };
  
  // Text search (fuzzy: check title, titleAr, description, descriptionAr, category, specs)
  if (query) {
    const q = query.toLowerCase();
    // Build search terms: original + synonyms
    const searchTerms = [q];
    for (const [term, aliases] of Object.entries(SYNONYMS)) {
      if (q.includes(term)) {
        searchTerms.push(...aliases);
      }
    }
    
    filtered = filtered.filter(item => {
      const title = item.title.toLowerCase();
      const desc = item.description?.toLowerCase() || '';
      const cat = item.category?.toLowerCase() || '';
      const titleAr = item.titleAr || '';
      const descAr = item.descriptionAr || '';
      const specValues = item.specifications 
        ? Object.values(item.specifications).map(v => String(v).toLowerCase())
        : [];
      
      return searchTerms.some(term =>
        title.includes(term) ||
        titleAr.includes(query) ||
        desc.includes(term) ||
        descAr.includes(query) ||
        cat.includes(term) ||
        specValues.some(v => v.includes(term))
      );
    });
  }
  
  // Category filter
  if (category) {
    const cat = category.toLowerCase();
    filtered = filtered.filter(item =>
      item.category?.toLowerCase().includes(cat)
    );
  }
  
  // Price filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    filtered = filtered.filter(item => {
      if (!item.price) return false;
      if (minPrice && item.price < minPrice) return false;
      if (maxPrice && item.price > maxPrice) return false;
      return true;
    });
  }
  
  // Availability filter
  if (available !== undefined) {
    filtered = filtered.filter(item => item.available === available);
  }
  
  // Build response
  if (filtered.length === 0) {
    return {
      success: true,
      displayText: context.locale === 'ar'
        ? 'لم أجد عناصر تطابق معاييرك. هل تريد رؤية جميع المنتجات المتاحة؟'
        : "I couldn't find any items matching your criteria. Would you like to see all available products?",
      data: { items: [] },
    };
  }
  
  // Format item list with navigation actions
  const isArabic = context.locale === 'ar';
  const itemList = filtered.slice(0, 5).map(item => {
    const priceStr = item.price 
      ? `${item.price} ${item.currency || 'EGP'}`
      : (isArabic ? 'السعر عند الطلب' : 'Price on request');
    const availStr = item.available !== false 
      ? (isArabic ? '✓ متوفر' : '✓ Available')
      : (isArabic ? '✗ غير متوفر' : '✗ Not available');
    
    return `• **${item.title}** - ${priceStr} - ${availStr}\n  [[FLY_TO:${item.id}:${item.title}]]`;
  }).join('\n');
  
  const header = isArabic
    ? `وجدت ${filtered.length} عنصر${filtered.length > 1 ? '' : ''}:`
    : `Found ${filtered.length} item${filtered.length > 1 ? 's' : ''}:`;
  
  const more = filtered.length > 5
    ? (isArabic ? `\n\nوهناك ${filtered.length - 5} عنصر آخر. هل تريد رؤية المزيد؟` : `\n\nAnd ${filtered.length - 5} more. Would you like to see more?`)
    : '';
  
  return {
    success: true,
    displayText: `${header}\n\n${itemList}${more}`,
    data: { items: filtered, count: filtered.length },
  };
}

/**
 * Tool 2: Get Item Details
 * Get full information about a specific item
 */
const GET_ITEM_DETAILS_TOOL: AgentTool = {
  name: 'get_item_details',
  description: 'Get detailed information about a specific item. Use when user asks about a particular product, room, or property.',
  parameters: {
    type: 'object',
    properties: {
      itemId: {
        type: 'string',
        description: 'Item ID or document ID',
      },
      itemName: {
        type: 'string',
        description: 'Item name (if ID not known)',
      },
    },
    required: [],
  },
};

function executeGetItemDetails(
  params: Record<string, any>,
  context: AgentContext
): ToolResult {
  const { itemId, itemName } = params;
  const items = context.items || [];
  const isArabic = context.locale === 'ar';
  
  // Find item by ID or name
  let item: TourItem | undefined;
  
  if (itemId) {
    item = items.find(i => String(i.id) === String(itemId));
  }
  
  if (!item && itemName) {
    const name = itemName.toLowerCase();
    item = items.find(i =>
      i.title.toLowerCase().includes(name) ||
      (i.titleAr && i.titleAr.includes(itemName))
    );
  }
  
  if (!item) {
    return {
      success: false,
      displayText: isArabic
        ? 'عذراً، لم أجد هذا العنصر. هل يمكنك توضيح الاسم؟'
        : "Sorry, I couldn't find that item. Could you clarify the name?",
      data: {},
    };
  }
  
  // Build detailed response
  const details: string[] = [];
  
  // Title
  details.push(`**${item.title}**`);
  
  // Description
  if (item.description) {
    details.push(item.description);
  }
  
  // Price
  if (item.price) {
    const label = isArabic ? 'السعر' : 'Price';
    details.push(`${label}: **${item.price} ${item.currency || 'EGP'}**`);
  }
  
  // Specifications
  if (item.specifications && Object.keys(item.specifications).length > 0) {
    const label = isArabic ? 'المواصفات' : 'Specifications';
    details.push(`\n${label}:`);
    Object.entries(item.specifications).forEach(([key, value]) => {
      details.push(`• ${key}: ${value}`);
    });
  }
  
  // Availability
  const availLabel = isArabic ? 'التوفر' : 'Availability';
  const availValue = item.available !== false
    ? (isArabic ? 'متوفر' : 'Available')
    : (isArabic ? 'غير متوفر' : 'Not available');
  details.push(`\n${availLabel}: ${availValue}`);
  
  // Add navigation action
  details.push(`\n[[FLY_TO:${item.id}:${item.title}]]`);
  
  // Add WhatsApp action if business contact available
  if (context.demo.businessWhatsapp) {
    details.push(`[[WHATSAPP:${context.demo.businessWhatsapp}:Inquiry about ${item.title}]]`);
  }
  
  return {
    success: true,
    displayText: details.join('\n'),
    data: { item },
  };
}

/**
 * Tool 3: Navigate to Item
 * Navigate user to a specific location in the 3D tour
 */
const NAVIGATE_TO_ITEM_TOOL: AgentTool = {
  name: 'navigate_to_item',
  description: 'Navigate to a specific item in the 3D tour. Use when user asks to see, go to, or visit an item.',
  parameters: {
    type: 'object',
    properties: {
      itemId: {
        type: 'string',
        description: 'Item ID to navigate to',
      },
    },
    required: ['itemId'],
  },
};

function executeNavigateToItem(
  params: Record<string, any>,
  context: AgentContext
): ToolResult {
  const { itemId } = params;
  const items = context.items || [];
  const isArabic = context.locale === 'ar';
  
  const item = items.find(i => String(i.id) === String(itemId));
  
  if (!item) {
    return {
      success: false,
      displayText: isArabic
        ? 'عذراً، لا يمكنني إيجاد هذا العنصر.'
        : "Sorry, I can't find that item.",
      data: {},
    };
  }
  
  const message = isArabic
    ? `سأنقلك إلى ${item.title}...`
    : `Taking you to ${item.title}...`;
  
  return {
    success: true,
    displayText: `${message}\n\n[[FLY_TO:${item.id}:${item.title}]]`,
    data: { item },
  };
}

/**
 * Tool 4: Compare Items
 * Compare multiple items side-by-side
 */
const COMPARE_ITEMS_TOOL: AgentTool = {
  name: 'compare_items',
  description: 'Compare 2 or more items. Use when user asks for comparisons, differences, or which is better.',
  parameters: {
    type: 'object',
    properties: {
      itemIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of item IDs to compare',
      },
    },
    required: ['itemIds'],
  },
};

function executeCompareItems(
  params: Record<string, any>,
  context: AgentContext
): ToolResult {
  const { itemIds } = params;
  const items = context.items || [];
  const isArabic = context.locale === 'ar';
  
  if (!Array.isArray(itemIds) || itemIds.length < 2) {
    return {
      success: false,
      displayText: isArabic
        ? 'يرجى تحديد عنصرين على الأقل للمقارنة.'
        : 'Please specify at least 2 items to compare.',
      data: {},
    };
  }
  
  // Find items
  const compareItems = itemIds
    .map(id => items.find(i => String(i.id) === String(id)))
    .filter((item): item is TourItem => item !== undefined);
  
  if (compareItems.length < 2) {
    return {
      success: false,
      displayText: isArabic
        ? 'عذراً، لم أجد العناصر المطلوبة.'
        : "Sorry, couldn't find the requested items.",
      data: {},
    };
  }
  
  // Build comparison
  const header = isArabic ? 'مقارنة:' : 'Comparison:';
  const comparison: string[] = [header];
  
  compareItems.forEach(item => {
    const details: string[] = [`\n**${item.title}**`];
    
    if (item.price) {
      details.push(`${isArabic ? 'السعر' : 'Price'}: ${item.price} ${item.currency || 'EGP'}`);
    }
    
    if (item.specifications && Object.keys(item.specifications).length > 0) {
      const specs = Object.entries(item.specifications).slice(0, 3)
        .map(([k, v]) => `${k}: ${v}`).join(', ');
      details.push(specs);
    }
    
    details.push(`[[FLY_TO:${item.id}:${item.title}]]`);
    
    comparison.push(details.join('\n'));
  });
  
  // Add comparison action
  const ids = compareItems.map(i => i.id).join(',');
  comparison.push(`\n[[COMPARE:${ids}]]`);
  
  return {
    success: true,
    displayText: comparison.join('\n'),
    data: { items: compareItems },
  };
}

/**
 * Tool 5: Get Contact Info
 * Get business contact information
 */
const GET_CONTACT_INFO_TOOL: AgentTool = {
  name: 'get_contact_info',
  description: 'Get business contact information (phone, WhatsApp, email, address). Use when user asks how to contact, call, or reach the business.',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },
};

function executeGetContactInfo(
  params: Record<string, any>,
  context: AgentContext
): ToolResult {
  const { demo } = context;
  const isArabic = context.locale === 'ar';
  
  const info: string[] = [];
  
  // Business name
  info.push(`**${demo.businessName}**`);
  
  if (demo.description) {
    info.push(demo.description);
  }
  
  // Phone
  if (demo.businessPhone) {
    const label = isArabic ? '📞 الهاتف' : '📞 Phone';
    info.push(`${label}: ${demo.businessPhone}`);
  }
  
  // WhatsApp
  if (demo.businessWhatsapp) {
    const label = isArabic ? '💬 واتساب' : '💬 WhatsApp';
    info.push(`${label}: ${demo.businessWhatsapp}`);
    info.push(`[[WHATSAPP:${demo.businessWhatsapp}:Hello, I have a question]]`);
  }
  
  // Email
  if (demo.businessEmail) {
    const label = isArabic ? '📧 البريد' : '📧 Email';
    info.push(`${label}: ${demo.businessEmail}`);
  }
  
  if (info.length === 1) {
    return {
      success: false,
      displayText: isArabic
        ? 'عذراً، معلومات التواصل غير متوفرة حالياً.'
        : 'Sorry, contact information is not available at the moment.',
      data: {},
    };
  }
  
  return {
    success: true,
    displayText: info.join('\n'),
    data: { demo },
  };
}

/**
 * Tool 6: Capture Lead
 * Capture user inquiry/lead
 */
const CAPTURE_LEAD_TOOL: AgentTool = {
  name: 'capture_lead',
  description: 'Capture user lead or inquiry. Use when user wants to book, reserve, request a call, or leave their info.',
  parameters: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['inquiry', 'booking', 'callback', 'quote'],
        description: 'Type of lead',
      },
    },
    required: ['type'],
  },
};

function executeCaptureLead(
  params: Record<string, any>,
  context: AgentContext
): ToolResult {
  const { type } = params;
  const isArabic = context.locale === 'ar';
  
  const messages = {
    inquiry: {
      ar: 'سأساعدك في تقديم استفسارك. يرجى تعبئة النموذج التالي:',
      en: "I'll help you with your inquiry. Please fill out the following form:",
    },
    booking: {
      ar: 'رائع! سأساعدك في الحجز. يرجى تعبئة بياناتك:',
      en: "Great! I'll help you with booking. Please provide your details:",
    },
    callback: {
      ar: 'سنتصل بك قريباً. يرجى ترك رقمك:',
      en: "We'll call you back soon. Please leave your number:",
    },
    quote: {
      ar: 'سأساعدك في الحصول على عرض سعر. يرجى تعبئة البيانات:',
      en: "I'll help you get a quote. Please provide details:",
    },
  };
  
  const message = messages[type as keyof typeof messages]?.[isArabic ? 'ar' : 'en'] || messages.inquiry[isArabic ? 'ar' : 'en'];
  
  return {
    success: true,
    displayText: `${message}\n\n[[LEAD:${type}]]`,
    data: { type },
  };
}

// ========================================
// Tool Registry
// ========================================

const TOOLS: Record<string, AgentTool> = {
  search_items: SEARCH_ITEMS_TOOL,
  get_item_details: GET_ITEM_DETAILS_TOOL,
  navigate_to_item: NAVIGATE_TO_ITEM_TOOL,
  compare_items: COMPARE_ITEMS_TOOL,
  get_contact_info: GET_CONTACT_INFO_TOOL,
  capture_lead: CAPTURE_LEAD_TOOL,
};

const TOOL_EXECUTORS: Record<string, (params: Record<string, any>, context: AgentContext) => ToolResult> = {
  search_items: executeSearchItems,
  get_item_details: executeGetItemDetails,
  navigate_to_item: executeNavigateToItem,
  compare_items: executeCompareItems,
  get_contact_info: executeGetContactInfo,
  capture_lead: executeCaptureLead,
};

// ========================================
// Public API
// ========================================

/**
 * Get available tools for the current context
 */
export function getAvailableTools(context: AgentContext): AgentTool[] {
  return Object.values(TOOLS);
}

/**
 * Execute a tool
 */
export function executeTool(
  toolName: string,
  params: Record<string, any>,
  context: AgentContext
): ToolResult {
  const executor = TOOL_EXECUTORS[toolName];
  
  if (!executor) {
    return {
      success: false,
      displayText: `Unknown tool: ${toolName}`,
      data: {},
    };
  }
  
  try {
    return executor(params, context);
  } catch (error) {
    console.error(`[Tool] Error executing ${toolName}:`, error);
    return {
      success: false,
      displayText: context.locale === 'ar'
        ? 'عذراً، حدث خطأ أثناء تنفيذ العملية.'
        : 'Sorry, an error occurred while processing your request.',
      data: {},
    };
  }
}

/**
 * Execute tool for intent (local path - no LLM)
 * Maps intents directly to tools for data-rich responses WITHOUT API calls
 */
export function executeToolForIntent(
  intent: IntentType,
  context: AgentContext,
  entities: string[] = []
): ToolResult | null {
  switch (intent) {
    case 'product_search':
    case 'availability': {
      // Pass extracted entities as search query so results are filtered
      const query = entities.length > 0 ? entities.join(' ') : undefined;
      return executeTool('search_items', { query }, context);
    }
    
    case 'price_inquiry': {
      const itemName = entities.length > 0 ? entities[0] : undefined;
      if (itemName) {
        return executeTool('get_item_details', { itemName }, context);
      }
      // No specific item mentioned — show all products with prices
      return executeTool('search_items', {}, context);
    }
    
    case 'navigation': {
      const target = entities.length > 0 ? entities[0] : undefined;
      if (target) {
        return executeTool('get_item_details', { itemName: target }, context);
      }
      return null;
    }
    
    case 'business_info':
      return executeTool('get_contact_info', {}, context);
    
    case 'lead_capture':
      return executeTool('capture_lead', { type: 'inquiry' }, context);
    
    case 'general_question': {
      // If entities extracted, try searching for them
      if (entities.length > 0) {
        const query = entities.join(' ');
        return executeTool('search_items', { query }, context);
      }
      return null;
    }
    
    // For other intents, let the LLM handle it or return null
    default:
      return null;
  }
}

/**
 * Build tool descriptions for LLM system prompt
 */
export function buildToolDescriptions(tools: AgentTool[]): string {
  return tools.map(tool => {
    const params = Object.entries(tool.parameters.properties || {})
      .map(([name, schema]: [string, any]) => `  - ${name}: ${schema.description}`)
      .join('\n');
    
    return `[[TOOL:${tool.name}:params]]\n${tool.description}\nParameters:\n${params || '  (none)'}`;
  }).join('\n\n');
}
