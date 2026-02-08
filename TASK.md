# TASK: AI Agent Engine — T6: CMS AI Config + Knowledge Base

> **Task ID**: AI-T6  
> **Priority**: 🔴 HIGH  
> **Design Doc**: `docs/AI-AGENT-ENGINE.md` Sections 3.5, 3.6, 6 (T2+T3+T8 merged)  
> **Depends On**: AI-T1 ✅, AI-T2 ✅, AI-T3 ✅, AI-T4 ✅, T5 ✅, LLM-First Rewrite ✅  
> **Estimated Effort**: Medium-High  

---

## Objective

Move the AI agent's **persona, configuration, and knowledge** from hardcoded TypeScript into **Strapi CMS** so business owners can manage their own AI assistant without touching code.

Currently:
- Agent name, persona, greeting, suggested prompts → all hardcoded in `context-builder.ts` `getDefaultConfig()`
- Only 2 demo types have configs (`retail`, `real-estate`) — the other 4 (cafe, hotel, showroom, training) fall back to generic `retail`
- **Zero knowledge base** — the agent has NO FAQ/policy/info entries; it relies entirely on the product catalog and LLM reasoning
- Contact info has hardcoded strings like `demo.businessName?.includes('Awni')` — fragile

After this task:
- Each demo gets a CMS-managed `ai-agent-config` entry (persona, greeting, model tier, limits, suggested prompts)
- Each demo gets CMS-managed `ai-knowledge-entry` items (FAQs, policies, business info)
- `context-builder.ts` loads config + knowledge from CMS via `strapi-loader.ts`
- Knowledge entries are injected into the LLM system prompt for grounded answers
- Seed data for Awni Electronics demo with real FAQs and agent config

---

## ⚠️ CRITICAL RULES (Read First)

1. **Strapi v5 i18n**: Every content type must have `pluginOptions.i18n.localized: true`. Each locale gets a **separate database row** with a different `id` but same `documentId`. Fetch by `locale` query param. See existing `demo-product` schema for reference.

2. **Existing patterns**: Follow the exact same content type structure as existing types — look at `apps/cms/src/api/demo-product/` for the 4-file pattern: `schema.json`, `controller.ts`, `service.ts`, `routes.ts`.

3. **No new dependencies**: Use existing `strapi-loader.ts` fetch patterns. No new npm packages.

4. **Backward compatible**: If a demo has no `ai-agent-config` in CMS, fall back to current hardcoded defaults. Never crash.

5. **Token-efficient**: Knowledge base entries must be injected into the system prompt in a compressed format. Each knowledge entry ≈ 50-100 tokens. Budget: max 2000 tokens for all knowledge entries (roughly 20 entries max).

---

## Architecture

```
Strapi CMS                          AI Engine
┌──────────────────┐               ┌──────────────────┐
│ ai-agent-config  │──── fetch ───►│ strapi-loader.ts  │
│ (per demo)       │               │   loadAgentConfig()│
├──────────────────┤               │   loadKnowledge()  │
│ ai-knowledge-    │──── fetch ───►│                    │
│ entry (per demo) │               └────────┬───────────┘
└──────────────────┘                        │
                                            ▼
                                   ┌──────────────────┐
                                   │context-builder.ts │
                                   │ buildSystemPrompt()│
                                   │                    │
                                   │ System Prompt:     │
                                   │ - Persona          │
                                   │ - Items catalog    │
                                   │ - Knowledge base   │
                                   │ - Contact info     │
                                   │ - Action markers   │
                                   └──────────────────┘
```

---

## Files to Create

### 1. `apps/cms/src/api/ai-agent-config/` (NEW — 4 files)

CMS content type for per-demo agent configuration.

**Schema** (`content-types/ai-agent-config/schema.json`):

```json
{
  "kind": "collectionType",
  "collectionName": "ai_agent_configs",
  "info": {
    "singularName": "ai-agent-config",
    "pluralName": "ai-agent-configs",
    "displayName": "AI Agent Config",
    "description": "Per-demo AI agent configuration"
  },
  "options": { "draftAndPublish": true },
  "pluginOptions": { "i18n": { "localized": true } },
  "attributes": {
    "demo": {
      "type": "relation",
      "relation": "oneToOne",
      "target": "api::demo.demo"
    },
    "agentName": {
      "type": "string",
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "persona": {
      "type": "text",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "greeting": {
      "type": "text",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "modelTier": {
      "type": "enumeration",
      "enum": ["local", "standard", "advanced"],
      "default": "standard"
    },
    "dailyMsgLimit": {
      "type": "integer",
      "default": 200
    },
    "monthlyMsgLimit": {
      "type": "integer",
      "default": 6000
    },
    "enableLeadCapture": {
      "type": "boolean",
      "default": true
    },
    "enableNavigation": {
      "type": "boolean",
      "default": true
    },
    "enableComparison": {
      "type": "boolean",
      "default": true
    },
    "suggestedPrompts": {
      "type": "json",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "temperature": {
      "type": "decimal",
      "default": 0.7,
      "min": 0,
      "max": 1
    },
    "maxResponseLen": {
      "type": "integer",
      "default": 500
    }
  }
}
```

Plus standard `controllers/ai-agent-config.ts`, `services/ai-agent-config.ts`, `routes/ai-agent-config.ts` (copy pattern from `demo-product`).

### 2. `apps/cms/src/api/ai-knowledge-entry/` (NEW — 4 files)

CMS content type for FAQ / knowledge entries per demo.

**Schema** (`content-types/ai-knowledge-entry/schema.json`):

```json
{
  "kind": "collectionType",
  "collectionName": "ai_knowledge_entries",
  "info": {
    "singularName": "ai-knowledge-entry",
    "pluralName": "ai-knowledge-entries",
    "displayName": "AI Knowledge Entry",
    "description": "Knowledge base entries for AI agent"
  },
  "options": { "draftAndPublish": true },
  "pluginOptions": { "i18n": { "localized": true } },
  "attributes": {
    "demo": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::demo.demo"
    },
    "category": {
      "type": "enumeration",
      "enum": ["faq", "policy", "info", "hours", "shipping", "returns", "warranty", "custom"],
      "default": "faq",
      "required": true
    },
    "question": {
      "type": "string",
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "answer": {
      "type": "text",
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "keywords": {
      "type": "json"
    },
    "priority": {
      "type": "integer",
      "default": 5,
      "min": 1,
      "max": 10
    },
    "isActive": {
      "type": "boolean",
      "default": true
    }
  }
}
```

Plus standard controller, service, routes files.

---

## Files to Modify

### 3. `apps/web/lib/ai-engine/strapi-loader.ts` (MODIFY)

Add two new fetch functions:

```typescript
/**
 * Load AI agent config for a demo from CMS
 * Returns null if not found (caller uses hardcoded defaults)
 */
export async function loadAgentConfig(
  demoSlug: string, 
  locale: string
): Promise<AgentConfig | null>

/**
 * Load knowledge base entries for a demo from CMS
 * Returns empty array if none found
 */
export async function loadKnowledgeEntries(
  demoSlug: string, 
  locale: string
): Promise<KnowledgeEntry[]>
```

**Implementation notes:**
- Use the same `fetchStrapi()` helper already in the file
- Filter by `demo.slug` (stable across locales — see T2 audit fix)
- Cache with same 5-minute TTL as existing demo data
- Knowledge entries: filter `isActive: true`, sort by `priority` desc, limit to 30

### 4. `apps/web/lib/ai-engine/types.ts` (MODIFY)

Add new interface:

```typescript
export interface KnowledgeEntry {
  id: string;
  category: 'faq' | 'policy' | 'info' | 'hours' | 'shipping' | 'returns' | 'warranty' | 'custom';
  question: string;
  answer: string;
  keywords?: string[];
  priority: number;
}
```

### 5. `apps/web/lib/ai-engine/context-builder.ts` (MODIFY)

**Changes:**
1. `buildContext()` — accept optional `knowledgeEntries: KnowledgeEntry[]` parameter
2. `buildSystemPrompt()` — inject knowledge entries into the system prompt after the item catalog section
3. Knowledge format in prompt (token-efficient):
```
KNOWLEDGE BASE:
Q: What are your opening hours?
A: Saturday–Thursday 10am–10pm, Friday closed.

Q: Do you deliver?
A: Yes, free delivery within Alexandria. 50 EGP for other cities.

Q: What is your return policy?
A: 14-day return policy for unused items with receipt.
```
4. Remove the hardcoded `demo.businessName?.includes('Awni')` check from `getDefaultConfig()`

### 6. `apps/web/lib/ai-engine/agent-core.ts` (MODIFY)

**Changes:**
1. In the main `processMessage()` flow, after `loadDemoFromCMS()`, also call `loadAgentConfig()` and `loadKnowledgeEntries()`
2. Pass the CMS config to context builder (if found), otherwise keep hardcoded defaults
3. Pass knowledge entries to context builder

---

## Seed Data

### 7. `seed/awni-ai-config.json` (NEW)

Agent config for Awni Electronics:

```json
{
  "agentName": "Salma",
  "agentName_ar": "سلمى",
  "persona": "You are Salma, the friendly and knowledgeable sales assistant for Awni Electronics. You have a warm, helpful personality and deep knowledge of all products in the store. You speak naturally and enthusiastically about the products, making customers feel welcome.",
  "persona_ar": "أنتِ سلمى، مساعدة المبيعات الودودة والمطلعة في مؤسسة عوني للأجهزة الكهربائية. لديكِ شخصية دافئة ومفيدة ومعرفة عميقة بجميع المنتجات في المتجر.",
  "greeting": "Hi there! 👋 I'm Salma, your shopping assistant at Awni Electronics. I can help you find the perfect appliance, compare products, or answer any questions. What are you looking for today?",
  "greeting_ar": "أهلاً وسهلاً! 👋 أنا سلمى، مساعدتك للتسوق في عوني للأجهزة الكهربائية. أقدر أساعدك تلاقي الجهاز المناسب أو أقارن بين المنتجات أو أجاوب على أي سؤال. إيش تبحث عنه اليوم؟",
  "modelTier": "standard",
  "dailyMsgLimit": 200,
  "enableLeadCapture": true,
  "enableNavigation": true,
  "enableComparison": true,
  "suggestedPrompts": ["Show me refrigerators", "What ovens do you have?", "Compare washing machines", "Delivery information", "Contact sales team"],
  "suggestedPrompts_ar": ["أرني الثلاجات", "ما هي الأفران المتوفرة؟", "قارن بين الغسالات", "معلومات التوصيل", "تواصل مع فريق المبيعات"],
  "temperature": 0.7,
  "maxResponseLen": 500
}
```

### 8. `seed/awni-ai-knowledge.json` (NEW)

Knowledge base entries for Awni Electronics (10 FAQs):

```json
[
  {
    "category": "info",
    "question": "What is Awni Electronics?",
    "question_ar": "ما هي مؤسسة عوني للأجهزة الكهربائية؟",
    "answer": "Awni Electronics is a trusted home appliances store in Alexandria, Egypt, offering a wide range of kitchen appliances, electronics, and home equipment from top brands like Toshiba, Sharp, LG, and Tornado.",
    "answer_ar": "مؤسسة عوني للأجهزة الكهربائية هي متجر موثوق للأجهزة المنزلية في الإسكندرية، مصر. نوفر مجموعة واسعة من أجهزة المطبخ والإلكترونيات والمعدات المنزلية من أفضل الماركات مثل توشيبا وشارب وإل جي وتورنادو.",
    "keywords": ["about", "who", "what", "store"],
    "priority": 10
  },
  {
    "category": "hours",
    "question": "What are your opening hours?",
    "question_ar": "ما هي ساعات العمل؟",
    "answer": "We are open Saturday to Thursday from 10:00 AM to 10:00 PM. We are closed on Fridays.",
    "answer_ar": "نحن مفتوحون من السبت إلى الخميس من الساعة 10 صباحاً حتى 10 مساءً. مغلقون يوم الجمعة.",
    "keywords": ["hours", "open", "close", "time", "when"],
    "priority": 9
  },
  {
    "category": "shipping",
    "question": "Do you offer delivery?",
    "question_ar": "هل توفرون التوصيل؟",
    "answer": "Yes! We offer free delivery within Alexandria city. For other cities in Egypt, delivery costs 50-150 EGP depending on location and item size. Delivery takes 1-3 business days.",
    "answer_ar": "نعم! نوفر توصيل مجاني داخل مدينة الإسكندرية. للمدن الأخرى في مصر، تكلفة التوصيل 50-150 جنيه حسب الموقع وحجم المنتج. التوصيل يستغرق 1-3 أيام عمل.",
    "keywords": ["delivery", "shipping", "deliver", "ship"],
    "priority": 9
  },
  {
    "category": "returns",
    "question": "What is your return policy?",
    "question_ar": "ما هي سياسة الاسترجاع؟",
    "answer": "We accept returns within 14 days of purchase for unused items in original packaging with receipt. Defective items can be returned within the warranty period.",
    "answer_ar": "نقبل الاسترجاع خلال 14 يوم من تاريخ الشراء للمنتجات غير المستخدمة في العبوة الأصلية مع الإيصال. المنتجات المعيبة يمكن إرجاعها خلال فترة الضمان.",
    "keywords": ["return", "refund", "exchange"],
    "priority": 8
  },
  {
    "category": "warranty",
    "question": "What warranty do you provide?",
    "question_ar": "ما هو الضمان الذي تقدمونه؟",
    "answer": "All products come with the manufacturer's warranty (typically 2-5 years depending on the brand). We also offer an optional extended warranty for an additional 1-2 years.",
    "answer_ar": "جميع المنتجات تأتي مع ضمان الشركة المصنعة (عادة 2-5 سنوات حسب الماركة). نوفر أيضاً ضمان ممتد اختياري لمدة 1-2 سنة إضافية.",
    "keywords": ["warranty", "guarantee", "repair"],
    "priority": 8
  },
  {
    "category": "policy",
    "question": "What payment methods do you accept?",
    "question_ar": "ما هي طرق الدفع المتاحة؟",
    "answer": "We accept cash, credit/debit cards (Visa, MasterCard), and installment plans through major banks (6-36 months). We also accept mobile wallets (Vodafone Cash, InstaPay).",
    "answer_ar": "نقبل الدفع نقداً، بطاقات الائتمان والخصم (فيزا، ماستركارد)، والتقسيط عبر البنوك الكبرى (6-36 شهر). نقبل أيضاً المحافظ الإلكترونية (فودافون كاش، إنستاباي).",
    "keywords": ["payment", "pay", "installment", "cash", "card", "credit"],
    "priority": 8
  },
  {
    "category": "faq",
    "question": "Do you install appliances?",
    "question_ar": "هل تقومون بتركيب الأجهزة؟",
    "answer": "Yes, we provide free installation for large appliances (ovens, washing machines, air conditioners). For other items, installation is available for a small fee.",
    "answer_ar": "نعم، نوفر تركيب مجاني للأجهزة الكبيرة (الأفران، الغسالات، المكيفات). للأجهزة الأخرى، التركيب متاح بمبلغ بسيط.",
    "keywords": ["install", "installation", "setup", "connect"],
    "priority": 7
  },
  {
    "category": "faq",
    "question": "Can I see the products before buying?",
    "question_ar": "هل يمكنني رؤية المنتجات قبل الشراء؟",
    "answer": "Absolutely! Visit our showroom in Alexandria to see all products in person. You can also explore our 3D virtual tour right here to browse products from anywhere.",
    "answer_ar": "بالتأكيد! زوروا معرضنا في الإسكندرية لرؤية جميع المنتجات. يمكنكم أيضاً استكشاف جولتنا الافتراضية ثلاثية الأبعاد هنا لتصفح المنتجات من أي مكان.",
    "keywords": ["visit", "showroom", "see", "tour"],
    "priority": 7
  },
  {
    "category": "faq",
    "question": "Do you have offers or discounts?",
    "question_ar": "هل لديكم عروض أو خصومات؟",
    "answer": "We regularly have seasonal promotions and bundle deals. Ask about our current offers! We also offer special discounts for bulk purchases.",
    "answer_ar": "لدينا عروض موسمية وصفقات مجمعة بشكل منتظم. اسألوا عن عروضنا الحالية! نوفر أيضاً خصومات خاصة للمشتريات بالجملة.",
    "keywords": ["offer", "discount", "sale", "deal", "promotion"],
    "priority": 7
  },
  {
    "category": "info",
    "question": "Where is the store located?",
    "question_ar": "أين يقع المتجر؟",
    "answer": "We are located in Saba Basha, Alexandria, Egypt. Our showroom is easily accessible by public transport and has parking available.",
    "answer_ar": "نقع في سبأ باشا، الإسكندرية، مصر. معرضنا سهل الوصول بالمواصلات العامة ويتوفر موقف سيارات.",
    "keywords": ["location", "address", "where", "find", "directions"],
    "priority": 9
  }
]
```

### 9. `seed/seed-awni-ai.js` (NEW)

Seed script that:
1. Finds the Awni Electronics demo by slug
2. Creates `ai-agent-config` entry linked to demo (EN + AR localizations)
3. Creates all `ai-knowledge-entry` items linked to demo (EN + AR localizations)

Follow the same pattern as `seed/seed-awni.js`.

---

## Testing Checklist

1. **CMS starts**: `cd apps/cms && pnpm develop` — no schema errors, new types visible in admin
2. **Seed runs**: `node seed/seed-awni-ai.js` — creates config + 10 knowledge entries
3. **Agent loads config**: Send a message to Awni demo — logs show CMS config loaded (not defaults)
4. **Agent knows FAQs**: Ask "what are your hours?" → responds with "Saturday to Thursday 10am-10pm" from knowledge base
5. **Agent knows policies**: Ask "do you deliver?" → responds with delivery info from knowledge base
6. **Persona works**: Agent responds as "Salma", not generic "AI Assistant"
7. **Arabic works**: `/ar` locale loads Arabic config + knowledge entries
8. **No config fallback**: Send message to a demo WITHOUT ai-agent-config → uses hardcoded defaults, no crash
9. **Build passes**: `pnpm build` in apps/web — zero errors
10. **Suggested prompts**: API returns CMS-configured prompts (not hardcoded ones)

---

## What NOT to Do

- ❌ Don't create `ai-conversation` or `ai-usage-log` CMS types yet (future tasks)
- ❌ Don't add keyword-based RAG search over knowledge entries — just inject all active entries into the prompt for now. The LLM is smart enough to find the relevant answer.
- ❌ Don't change the LLM-first architecture in agent-core.ts
- ❌ Don't modify the response-formatter or intent-classifier
- ❌ Don't change the chat UI (T5 just completed)

---

## When Done

1. Verify `pnpm build` passes with zero errors in both `apps/cms` and `apps/web`
2. Test all 10 items in the checklist above
3. Update `TASK-RESULTS.md` with T6 results
