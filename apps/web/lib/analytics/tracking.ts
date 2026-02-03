/**
 * User Behavior Tracking Service
 * Tracks user actions in the virtual tour for analytics
 */

export interface UserAction {
  type: 'view' | 'click' | 'add_to_cart' | 'remove_from_cart' | 'checkout' | 'navigation' | 'tag_click' | 'time_spent';
  demoId: number;
  sessionId: string;
  productId?: number;
  productName?: string;
  position?: { x: number; y: number; z: number };
  sweepId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

interface TrackingQueue {
  actions: UserAction[];
  timer: NodeJS.Timeout | null;
}

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 5000;
const API_ENDPOINT = '/api/analytics/track';

// Queue for batching actions
const queue: TrackingQueue = {
  actions: [],
  timer: null,
};

/**
 * Track a user action
 */
export function trackAction(action: Omit<UserAction, 'timestamp'>) {
  const fullAction: UserAction = {
    ...action,
    timestamp: new Date().toISOString(),
  };
  
  queue.actions.push(fullAction);
  
  // Send immediately if batch is full
  if (queue.actions.length >= BATCH_SIZE) {
    flushQueue();
    return;
  }
  
  // Otherwise, schedule a flush
  if (!queue.timer) {
    queue.timer = setTimeout(() => {
      flushQueue();
    }, BATCH_DELAY_MS);
  }
}

/**
 * Flush queued actions to the server
 */
async function flushQueue() {
  if (queue.timer) {
    clearTimeout(queue.timer);
    queue.timer = null;
  }
  
  if (queue.actions.length === 0) return;
  
  const actionsToSend = [...queue.actions];
  queue.actions = [];
  
  try {
    await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actions: actionsToSend }),
      keepalive: true, // Ensures request completes even on page unload
    });
  } catch (error) {
    console.error('[Tracking] Failed to send actions:', error);
    // Re-queue failed actions
    queue.actions = [...actionsToSend, ...queue.actions];
  }
}

/**
 * Track page view
 */
export function trackPageView(demoId: number, sessionId: string) {
  trackAction({
    type: 'view',
    demoId,
    sessionId,
  });
}

/**
 * Track product click (tag or sidebar)
 */
export function trackProductClick(
  demoId: number,
  sessionId: string,
  productId: number,
  productName: string,
  source: 'tag' | 'sidebar'
) {
  trackAction({
    type: 'click',
    demoId,
    sessionId,
    productId,
    productName,
    metadata: { source },
  });
}

/**
 * Track tag click in tour
 */
export function trackTagClick(
  demoId: number,
  sessionId: string,
  productId: number,
  position: { x: number; y: number; z: number }
) {
  trackAction({
    type: 'tag_click',
    demoId,
    sessionId,
    productId,
    position,
  });
}

/**
 * Track navigation to sweep
 */
export function trackNavigation(
  demoId: number,
  sessionId: string,
  sweepId: string,
  position: { x: number; y: number; z: number }
) {
  trackAction({
    type: 'navigation',
    demoId,
    sessionId,
    sweepId,
    position,
  });
}

/**
 * Track add to cart
 */
export function trackAddToCart(
  demoId: number,
  sessionId: string,
  productId: number,
  productName: string,
  quantity: number,
  price: number
) {
  trackAction({
    type: 'add_to_cart',
    demoId,
    sessionId,
    productId,
    productName,
    metadata: { quantity, price },
  });
}

/**
 * Track checkout
 */
export function trackCheckout(
  demoId: number,
  sessionId: string,
  cartTotal: number,
  itemCount: number
) {
  trackAction({
    type: 'checkout',
    demoId,
    sessionId,
    metadata: { cartTotal, itemCount },
  });
}

/**
 * Track time spent (call periodically or on unload)
 */
export function trackTimeSpent(
  demoId: number,
  sessionId: string,
  durationSeconds: number
) {
  trackAction({
    type: 'time_spent',
    demoId,
    sessionId,
    metadata: { durationSeconds },
  });
}

/**
 * Flush on page unload
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushQueue();
  });
  
  // Also flush on visibility change (tab switch)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushQueue();
    }
  });
}

export default {
  trackAction,
  trackPageView,
  trackProductClick,
  trackTagClick,
  trackNavigation,
  trackAddToCart,
  trackCheckout,
  trackTimeSpent,
};
