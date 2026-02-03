/**
 * In-Memory Presence & Chat Store
 * MVP implementation - upgrade to Redis for production
 */

import type { 
  Visitor, 
  ChatMessage, 
  DemoPresenceState, 
  PresenceEvent, 
  ChatEvent,
  Position3D 
} from './types';

// In-memory stores
const demoStates = new Map<string, DemoPresenceState>();
const presenceSubscribers = new Map<string, Set<(event: PresenceEvent) => void>>();
const chatSubscribers = new Map<string, Set<(event: ChatEvent) => void>>();

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Get or create demo state
function getDemoState(slug: string): DemoPresenceState {
  let state = demoStates.get(slug);
  if (!state) {
    state = {
      slug,
      visitors: new Map(),
      messages: [],
      ownerOnline: false,
    };
    demoStates.set(slug, state);
  }
  return state;
}

// Emit presence event to all subscribers
function emitPresenceEvent(slug: string, event: PresenceEvent): void {
  const subscribers = presenceSubscribers.get(slug);
  if (subscribers) {
    subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Presence subscriber error:', error);
      }
    });
  }
}

// Emit chat event to all subscribers
function emitChatEvent(slug: string, event: ChatEvent): void {
  const subscribers = chatSubscribers.get(slug);
  if (subscribers) {
    subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Chat subscriber error:', error);
      }
    });
  }
}

// ============ VISITOR MANAGEMENT ============

export function addVisitor(
  slug: string, 
  sessionId: string, 
  name?: string,
  locale?: string,
  userAgent?: string
): Visitor {
  const state = getDemoState(slug);
  
  const visitor: Visitor = {
    id: generateId(),
    sessionId,
    demoSlug: slug,
    name: name || `Visitor ${state.visitors.size + 1}`,
    connectedAt: new Date(),
    lastSeenAt: new Date(),
    isRequestingHelp: false,
    locale,
    userAgent,
  };
  
  state.visitors.set(sessionId, visitor);
  
  emitPresenceEvent(slug, {
    type: 'visitor_join',
    visitor,
    timestamp: new Date(),
  });
  
  return visitor;
}

export function removeVisitor(slug: string, sessionId: string): void {
  const state = getDemoState(slug);
  const visitor = state.visitors.get(sessionId);
  
  if (visitor) {
    state.visitors.delete(sessionId);
    
    emitPresenceEvent(slug, {
      type: 'visitor_leave',
      visitor,
      timestamp: new Date(),
    });
  }
}

export function updateVisitorPosition(
  slug: string, 
  sessionId: string, 
  position: Position3D,
  currentLocation?: string
): Visitor | null {
  const state = getDemoState(slug);
  const visitor = state.visitors.get(sessionId);
  
  if (visitor) {
    visitor.position = position;
    visitor.currentLocation = currentLocation;
    visitor.lastSeenAt = new Date();
    
    emitPresenceEvent(slug, {
      type: 'visitor_move',
      visitor,
      timestamp: new Date(),
    });
    
    return visitor;
  }
  
  return null;
}

export function requestHelp(slug: string, sessionId: string): Visitor | null {
  const state = getDemoState(slug);
  const visitor = state.visitors.get(sessionId);
  
  if (visitor) {
    visitor.isRequestingHelp = true;
    visitor.lastSeenAt = new Date();
    
    emitPresenceEvent(slug, {
      type: 'help_request',
      visitor,
      timestamp: new Date(),
    });
    
    return visitor;
  }
  
  return null;
}

export function cancelHelpRequest(slug: string, sessionId: string): Visitor | null {
  const state = getDemoState(slug);
  const visitor = state.visitors.get(sessionId);
  
  if (visitor) {
    visitor.isRequestingHelp = false;
    visitor.lastSeenAt = new Date();
    
    emitPresenceEvent(slug, {
      type: 'help_cancel',
      visitor,
      timestamp: new Date(),
    });
    
    return visitor;
  }
  
  return null;
}

export function getVisitors(slug: string): Visitor[] {
  const state = getDemoState(slug);
  return Array.from(state.visitors.values());
}

export function getVisitor(slug: string, sessionId: string): Visitor | null {
  const state = getDemoState(slug);
  return state.visitors.get(sessionId) || null;
}

// ============ OWNER STATUS ============

export function setOwnerOnline(slug: string, online: boolean): void {
  const state = getDemoState(slug);
  state.ownerOnline = online;
  if (online) {
    state.ownerLastSeen = new Date();
  }
}

export function isOwnerOnline(slug: string): boolean {
  const state = getDemoState(slug);
  return state.ownerOnline;
}

// ============ CHAT MANAGEMENT ============

export function addMessage(
  slug: string,
  visitorId: string,
  senderId: string,
  senderType: 'owner' | 'visitor',
  senderName: string,
  content: string
): ChatMessage {
  const state = getDemoState(slug);
  
  const message: ChatMessage = {
    id: generateId(),
    demoSlug: slug,
    visitorId,
    senderId,
    senderType,
    senderName,
    content,
    timestamp: new Date(),
    read: false,
  };
  
  state.messages.push(message);
  
  // Keep only last 100 messages per demo
  if (state.messages.length > 100) {
    state.messages = state.messages.slice(-100);
  }
  
  emitChatEvent(slug, {
    type: 'new_message',
    message,
    timestamp: new Date(),
  });
  
  return message;
}

export function getMessages(slug: string, visitorId?: string): ChatMessage[] {
  const state = getDemoState(slug);
  
  if (visitorId) {
    return state.messages.filter(m => m.visitorId === visitorId);
  }
  
  return [...state.messages];
}

export function markMessagesRead(slug: string, visitorId: string, senderType: 'owner' | 'visitor'): void {
  const state = getDemoState(slug);
  
  state.messages.forEach(message => {
    if (message.visitorId === visitorId && message.senderType !== senderType) {
      message.read = true;
    }
  });
  
  emitChatEvent(slug, {
    type: 'message_read',
    visitorId,
    timestamp: new Date(),
  });
}

export function emitTyping(slug: string, visitorId: string, isTyping: boolean): void {
  emitChatEvent(slug, {
    type: 'typing',
    visitorId,
    isTyping,
    timestamp: new Date(),
  });
}

// ============ SUBSCRIPTIONS ============

export function subscribeToPresence(
  slug: string, 
  callback: (event: PresenceEvent) => void
): () => void {
  let subscribers = presenceSubscribers.get(slug);
  if (!subscribers) {
    subscribers = new Set();
    presenceSubscribers.set(slug, subscribers);
  }
  
  subscribers.add(callback);
  
  // Return unsubscribe function
  return () => {
    subscribers?.delete(callback);
  };
}

export function subscribeToChat(
  slug: string, 
  callback: (event: ChatEvent) => void
): () => void {
  let subscribers = chatSubscribers.get(slug);
  if (!subscribers) {
    subscribers = new Set();
    chatSubscribers.set(slug, subscribers);
  }
  
  subscribers.add(callback);
  
  // Return unsubscribe function
  return () => {
    subscribers?.delete(callback);
  };
}

// ============ CLEANUP ============

// Clean up stale visitors (no activity for 5 minutes)
export function cleanupStaleVisitors(): void {
  const staleThreshold = 5 * 60 * 1000; // 5 minutes
  const now = Date.now();
  
  demoStates.forEach((state, slug) => {
    state.visitors.forEach((visitor, sessionId) => {
      if (now - visitor.lastSeenAt.getTime() > staleThreshold) {
        removeVisitor(slug, sessionId);
      }
    });
  });
}

// Run cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupStaleVisitors, 60 * 1000);
}
