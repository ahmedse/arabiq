/**
 * Real-time Presence & Live Chat Types
 */

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Visitor {
  id: string;
  sessionId: string;
  demoSlug: string;
  name?: string;
  avatar?: string;
  position?: Position3D;
  currentLocation?: string; // Human-readable location (e.g., "Living Room")
  connectedAt: Date;
  lastSeenAt: Date;
  isRequestingHelp: boolean;
  userAgent?: string;
  locale?: string;
}

export interface ChatMessage {
  id: string;
  demoSlug: string;
  visitorId: string;
  senderId: string; // 'owner' or visitor's sessionId
  senderType: 'owner' | 'visitor';
  senderName: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface PresenceEvent {
  type: 'visitor_join' | 'visitor_leave' | 'visitor_move' | 'help_request' | 'help_cancel';
  visitor: Visitor;
  timestamp: Date;
}

export interface ChatEvent {
  type: 'new_message' | 'message_read' | 'typing';
  message?: ChatMessage;
  visitorId?: string;
  isTyping?: boolean;
  timestamp: Date;
}

export interface DemoPresenceState {
  slug: string;
  visitors: Map<string, Visitor>;
  messages: ChatMessage[];
  ownerOnline: boolean;
  ownerLastSeen?: Date;
}
