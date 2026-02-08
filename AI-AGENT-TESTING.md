# AI Agent Engine - Quick Testing Guide

## 🚀 Start the Development Server

```bash
cd apps/web
pnpm dev
```

Server runs at: `http://localhost:3000`

---

## 🧪 API Endpoint Tests

### 1. Health Check

```bash
curl http://localhost:3000/api/ai-agent
```

**Expected Response:**
```json
{
  "status": "healthy",
  "engine": "AI Agent v1.0",
  "capabilities": [...],
  "stats": {...}
}
```

---

### 2. Process a Message (English)

```bash
curl -X POST http://localhost:3000/api/ai-agent \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-en",
    "message": "What properties are available?",
    "demoSlug": "awni-electronics",
    "locale": "en"
  }'
```

**Expected Response:**
```json
{
  "message": "...",
  "intent": "property_inquiry",
  "confidence": 0.75,
  "actions": [...],
  "suggestions": [...],
  "sessionId": "test-session-en",
  "messageId": "..."
}
```

---

### 3. Process a Message (Arabic)

```bash
curl -X POST http://localhost:3000/api/ai-agent \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-ar",
    "message": "ما هي العقارات المتاحة؟",
    "demoSlug": "awni-electronics",
    "locale": "ar"
  }'
```

---

### 4. Get Session History

```bash
curl http://localhost:3000/api/ai-agent/history/test-session-en
```

**Expected Response:**
```json
{
  "sessionId": "test-session-en",
  "demoSlug": "awni-electronics",
  "locale": "en",
  "messages": [...],
  "messageCount": 2,
  "lastActivity": "2026-02-07T...",
  "metadata": {...}
}
```

---

### 5. Clear Session

```bash
curl -X DELETE http://localhost:3000/api/ai-agent/history/test-session-en
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Session cleared successfully",
  "sessionId": "test-session-en"
}
```

---

## 🧾 Test Various Intents

### Property Inquiry
```bash
curl -X POST http://localhost:3000/api/ai-agent \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-1","message":"Show me available properties","demoSlug":"awni-electronics","locale":"en"}'
```

### Booking
```bash
curl -X POST http://localhost:3000/api/ai-agent \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-2","message":"I want to book a viewing","demoSlug":"awni-electronics","locale":"en"}'
```

### Pricing
```bash
curl -X POST http://localhost:3000/api/ai-agent \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-3","message":"What is the price?","demoSlug":"awni-electronics","locale":"en"}'
```

### Contact
```bash
curl -X POST http://localhost:3000/api/ai-agent \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-4","message":"I need to talk to an agent","demoSlug":"awni-electronics","locale":"en"}'
```

### Navigation
```bash
curl -X POST http://localhost:3000/api/ai-agent \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-5","message":"Go to the kitchen","demoSlug":"awni-electronics","locale":"en"}'
```

---

## 🔍 Check Rate Limiting

Send 5+ messages rapidly to trigger rate limits:

```bash
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/ai-agent \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\":\"rate-test\",\"message\":\"Test $i\",\"demoSlug\":\"test-demo\",\"locale\":\"en\"}"
  echo ""
done
```

After 5 requests, you should see:
```json
{
  "message": "Rate limit exceeded. Please wait a moment.",
  "intent": "rate_limit",
  "retryAfter": 1000,
  "limitType": "per-second"
}
```

---

## 🌐 Frontend Integration Example

```typescript
// In your Next.js component
const sendMessage = async (message: string) => {
  const response = await fetch('/api/ai-agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: sessionId, // Store in state/localStorage
      message: message,
      demoSlug: 'awni-electronics',
      locale: locale, // From i18n context
    }),
  });

  const data = await response.json();
  
  // Handle response
  if (data.actions) {
    data.actions.forEach(action => {
      if (action.type === 'navigate') {
        // Navigate to tour item
        goToTourItem(action.data.itemId);
      } else if (action.type === 'show_form') {
        // Show form modal
        openForm(action.data.formType);
      }
    });
  }

  return data;
};
```

---

## 🐛 Debugging

### Enable Verbose Logging

All modules use `console.log` with prefixes:
- `[Intent Classifier]` - Intent classification results
- `[Model Router]` - Routing decisions
- `[Memory Manager]` - Session operations
- `[Usage Tracker]` - Rate limit checks
- `[Agent Core]` - Main processing flow
- `[API /ai-agent]` - API request handling

Check browser console or terminal output for detailed logs.

### Common Issues

**Session not found:**
- Sessions expire after 30 minutes of inactivity
- Use the same `sessionId` across requests to maintain conversation

**Rate limit errors:**
- Default limits: 1/sec, 5/min, 30/hour, 1000/day
- Adjust in `usage-tracker.ts` if needed for testing

**Intent not recognized:**
- Check keyword patterns in `intent-classifier.ts`
- Intent returns `general_inquiry` as fallback

---

## ✅ Expected Behavior

1. **First message** → New session created automatically
2. **Follow-up messages** → Previous context maintained
3. **Rate limits** → Graceful error after threshold
4. **Session expiry** → Auto-cleanup after 30min inactivity
5. **Unknown intents** → Fallback to general_inquiry
6. **API errors** → Fallback to local responses

---

## 📊 Success Criteria

- ✅ API responds within 1-2 seconds
- ✅ Intent classification works for EN + AR
- ✅ Sessions persist across requests
- ✅ Rate limiting prevents abuse
- ✅ Suggestions are contextual
- ✅ Actions are properly formatted
- ✅ No server crashes on invalid input

---

## 🔜 Next Steps

1. Test with real Strapi CMS data (T2)
2. Integrate Poe API for premium responses (T2)
3. Build frontend chat UI (T2)
4. Add comprehensive unit tests
5. Set up monitoring and analytics
