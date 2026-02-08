/**
 * @fileoverview Type definitions for the AI Agent Engine
 * 
 * This file contains all TypeScript interfaces and types used throughout
 * the AI agent system including requests, responses, memory, configuration,
 * and internal data structures.
 */

// ========================================
// Agent Request/Response Types
// ========================================

/**
 * Request payload for the AI agent
 */
export interface AgentRequest {
  /** User's message text */
  message: string;
  /** Demo/tour slug identifier */
  demoSlug: string;
  /** Session identifier for conversation continuity */
  sessionId?: string;
  /** Locale (en or ar) */
  locale: string;
  /** Optional: current location in tour (item ID) */
  currentLocation?: string;
  /** Optional: authenticated user ID */
  userId?: string;
  /** Optional: current item context */
  currentItem?: string;
}

/**
 * Response from the AI agent
 */
export interface AgentResponse {
  /** Agent's response message */
  message: string;
  /** Session identifier */
  sessionId: string;
  /** Response timestamp */
  timestamp: string;
  /** Detected intent (optional) */
  intent?: string;
  /** Actions to perform (navigation, forms, etc.) */
  actions?: AgentAction[];
  /** Suggested follow-up prompts */
  suggestions?: string[];
  /** Usage information */
  usage?: {
    model?: string;
    tier: 'local' | 'standard' | 'advanced';
    tokensEstimate?: number;
  };
  /** Error message if applicable */
  error?: string;
}

/**
 * Action to be performed by the frontend
 */
export interface AgentAction {
  /** Type of action */
  type: 'flyTo' | 'showComparison' | 'openWhatsApp' | 'showContactForm' | 'showLeadForm';
  /** Action-specific data */
  payload: Record<string, any>;
}

// ========================================
// Internal Agent Types
// ========================================

/**
 * Complete context for agent processing
 */
export interface AgentContext {
  /** Demo configuration */
  demo: DemoConfig;
  /** Tour items/products */
  items: TourItem[];
  /** Locale (en or ar) */
  locale: string;
  /** Session memory */
  session: SessionMemory;
  /** Optional: user memory for authenticated users */
  userMemory?: UserMemory;
  /** Optional: knowledge base entries */
  knowledgeEntries?: KnowledgeEntry[];
}

/**
 * Demo configuration for the agent
 */
export interface DemoConfig {
  /** Demo slug */
  slug: string;
  /** Demo type (e.g., retail, real-estate, etc.) */
  type: string;
  /** Business name */
  businessName: string;
  /** Business name in Arabic */
  businessNameAr?: string;
  /** Business description */
  description?: string;
  /** Business description in Arabic */
  descriptionAr?: string;
  /** Agent configuration */
  agentConfig?: AgentConfig;
  /** Strapi numeric ID (needed for API calls) */
  strapiId?: number;
  /** Business phone */
  businessPhone?: string;
  /** Business email */
  businessEmail?: string;
  /** Business WhatsApp */
  businessWhatsapp?: string;
  /** Whether AI chat is enabled for this demo */
  enableAiChat?: boolean;
}

/**
 * Tour item/product representation
 */
export interface TourItem {
  /** Unique item ID */
  id: string;
  /** Item title */
  title: string;
  /** Item title in Arabic */
  titleAr?: string;
  /** Item description */
  description?: string;
  /** Item description in Arabic */
  descriptionAr?: string;
  /** Category */
  category?: string;
  /** Price */
  price?: number;
  /** Currency */
  currency?: string;
  /** Availability status */
  available?: boolean;
  /** Item specifications (from CMS JSON field) */
  specifications?: Record<string, string>;
  /** Image URL */
  imageUrl?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Agent tool definition
 */
export interface AgentTool {
  /** Tool name/identifier */
  name: string;
  /** Tool description (English) */
  description: string;
  /** Tool description (Arabic) - optional */
  description_ar?: string;
  /** Parameter schema */
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  /** Demo types this tool applies to - optional */
  applicableDemoTypes?: string[];
  /** Tool execution function - optional (can be looked up in registry) */
  execute?: (params: Record<string, any>, context: AgentContext) => Promise<ToolResult> | ToolResult;
}

/**
 * Result from tool execution
 */
export interface ToolResult {
  /** Success status */
  success: boolean;
  /** Result data */
  data?: any;
  /** Display text for user */
  displayText?: string;
  /** Optional action to trigger */
  action?: AgentAction;
  /** Error message if failed */
  error?: string;
}

// ========================================
// Memory Types
// ========================================

/**
 * Session memory for conversation continuity
 */
export interface SessionMemory {
  /** Session identifier */
  sessionId: string;
  /** Demo slug */
  demoSlug: string;
  /** Conversation messages */
  messages: ConversationMessage[];
  /** Last activity timestamp */
  lastActivity: number;
  /** Locale */
  locale: string;
  /** Session metadata */
  metadata?: {
    userId?: string;
    startedAt: number;
    messageCount: number;
    leadCaptured?: boolean;
  };
}

/**
 * Individual conversation message
 */
export interface ConversationMessage {
  /** Message role */
  role: 'user' | 'assistant' | 'system';
  /** Message content */
  content: string;
  /** Message timestamp */
  timestamp: number;
  /** Detected intent (for user messages) */
  intent?: string;
  /** Actions performed (for assistant messages) */
  actions?: AgentAction[];
}

/**
 * User memory for authenticated users (future)
 */
export interface UserMemory {
  /** User ID */
  userId: string;
  /** Previous sessions */
  sessions: string[];
  /** User preferences */
  preferences?: {
    locale?: string;
    topics?: string[];
  };
  /** Last interaction timestamp */
  lastInteraction: number;
}

// ========================================
// Configuration Types
// ========================================

/**
 * Knowledge base entry from CMS
 */
export interface KnowledgeEntry {
  /** Unique ID */
  id: string;
  /** Category */
  category: 'faq' | 'policy' | 'info' | 'hours' | 'shipping' | 'returns' | 'warranty' | 'custom';
  /** Question */
  question: string;
  /** Answer */
  answer: string;
  /** Keywords for matching */
  keywords?: string[];
  /** Priority (1-10, higher = more important) */
  priority: number;
}

/**
 * Agent configuration per demo
 */
export interface AgentConfig {
  /** Agent name */
  agentName: string;
  /** Agent name in Arabic */
  agentNameAr?: string;
  /** Agent persona/description */
  persona: string;
  /** Agent persona in Arabic */
  personaAr?: string;
  /** Greeting message */
  greeting: string;
  /** Greeting message in Arabic */
  greetingAr?: string;
  /** Model tier preference */
  modelTier: 'local' | 'standard' | 'advanced';
  /** Daily message limit */
  dailyMsgLimit: number;
  /** Enable lead capture */
  enableLeadCapture: boolean;
  /** Enable navigation commands */
  enableNavigation: boolean;
  /** Suggested prompts */
  suggestedPrompts: string[];
  /** Suggested prompts in Arabic */
  suggestedPromptsAr?: string[];
  /** Temperature for model */
  temperature?: number;
  /** Max response length */
  maxResponseLen?: number;
  /** Business contact info */
  contact?: {
    phone?: string;
    whatsapp?: string;
    email?: string;
    address?: string;
    addressAr?: string;
  };
}

// ========================================
// Usage & Rate Limiting Types
// ========================================

/**
 * Usage tracking record
 */
export interface UsageRecord {
  /** Demo slug */
  demoSlug: string;
  /** Date (YYYY-MM-DD) */
  date: string;
  /** Total message count */
  messageCount: number;
  /** Model usage breakdown */
  modelCalls: Record<string, number>;
  /** Estimated tokens used */
  tokensEstimate: number;
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  /** Whether request is allowed */
  allowed: boolean;
  /** Remaining requests */
  remaining: number;
  /** Reset timestamp */
  resetAt: string;
  /** Limit type that blocked (if blocked) */
  limitType?: 'ip' | 'session' | 'demo' | 'global';
  /** Reason for blocking */
  reason?: string;
}

// ========================================
// Intent Classification Types
// ========================================

/**
 * Intent classification result
 */
export interface IntentResult {
  /** Detected intent */
  intent: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Extracted entities */
  entities: string[];
  /** Whether intent is out of scope */
  isOutOfScope?: boolean;
}

/**
 * Available intent types
 */
export type IntentType =
  | 'greeting'
  | 'farewell'
  | 'product_search'
  | 'price_inquiry'
  | 'navigation'
  | 'comparison'
  | 'availability'
  | 'business_info'
  | 'help'
  | 'lead_capture'
  | 'confirmation'
  | 'out_of_scope'
  | 'general_question';

// ========================================
// Model Router Types
// ========================================

/**
 * Model tier for routing
 */
export type ModelTier = 'local' | 'standard' | 'advanced';

/**
 * Model routing decision
 */
export interface ModelRoute {
  /** Model identifier */
  model: string;
  /** Tier level */
  tier: ModelTier;
  /** Whether to handle locally */
  isLocal: boolean;
  /** Estimated cost */
  estimatedCost?: number;
}

/**
 * Poe API message format
 */
export interface PoeMessage {
  /** Message role */
  role: 'system' | 'user' | 'assistant';
  /** Message content */
  content: string;
}
