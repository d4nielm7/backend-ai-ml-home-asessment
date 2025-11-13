# Testing Guide

This document provides step-by-step instructions to test all implemented features.

## Prerequisites

1. **Start the server**
   ```bash
   npm run dev
   ```
   The server should start on `http://localhost:3000` (or your configured port)

2. **Verify server is running**
   ```bash
   curl http://localhost:3000/health
   ```
   Expected: JSON response with status "ok"

---

## Task 1: Cache Statistics Endpoint

### Step 1: Test Cache Statistics (Empty Cache)
```bash
curl http://localhost:3000/api/cache/stats
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "size": 0,
    "defaultTTL": 300000,
    "hits": 0,
    "misses": 0,
    "hitRate": "0%",
    "totalRequests": 0
  },
  "message": "Cache statistics retrieved successfully",
  "timestamp": "2025-11-13T12:22:47.677Z"
}
```

### Step 2: Make Some AI Requests to Populate Cache
```bash
# Request 1
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# Request 2 (same content - should hit cache)
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# Request 3 (different content - cache miss)
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"How are you?"}]}'
```

### Step 3: Check Cache Statistics Again
```bash
curl http://localhost:3000/api/cache/stats
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "size": 2,
    "defaultTTL": 300000,
    "hits": 1,
    "misses": 3,
    "hitRate": "25.00%",
    "totalRequests": 4
  },
  "message": "Cache statistics retrieved successfully",
  "timestamp": "2025-11-13T12:22:47.677Z"
}
```

**Verification:**
- ✅ `size` should be > 0 (cached entries)
- ✅ `hits` should be > 0 (cache hits)
- ✅ `misses` should be > 0 (cache misses)
- ✅ `hitRate` should be calculated correctly
- ✅ `totalRequests` = `hits` + `misses`

---

## Task 2: Model Selection

### Step 1: Test Default Model (No model parameter)
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello, what model are you?"}]}'
```

**Expected:** Response should work (defaults to `gpt-3.5-turbo`)

### Step 2: Test with gpt-3.5-turbo (Explicit)
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"model":"gpt-3.5-turbo"}'
```

**Expected:** Response should work

### Step 3: Test with gpt-4
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"model":"gpt-4"}'
```

**Expected:** Response should work (if OpenAI API key is configured)

### Step 4: Test with gpt-4-turbo-preview
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"model":"gpt-4-turbo-preview"}'
```

**Expected:** Response should work (if OpenAI API key is configured)

### Step 5: Test Invalid Model (Should Fail)
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"model":"invalid-model"}'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "path": ["model"],
      "message": "Invalid enum value. Expected 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo-preview', received 'invalid-model'"
    }
  ],
  "timestamp": "2025-11-13T12:22:47.677Z"
}
```

**Status Code:** `400 Bad Request`

### Step 6: Test Text Generation Endpoint with Model
```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Write a haiku about coding","model":"gpt-4"}'
```

**Expected:** Response should work with the specified model

### Step 7: Verify Cache Keys Include Model
Make requests with different models and check that cache treats them separately:
```bash
# Request with gpt-3.5-turbo
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Test"}],"model":"gpt-3.5-turbo"}'

# Request with gpt-4 (same message, different model)
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Test"}],"model":"gpt-4"}'
```

**Verification:**
- ✅ Both requests should work
- ✅ Cache should store them separately (different cache keys)
- ✅ Check cache stats to see both entries

---

## Task 3: Request ID Tracking

### Step 1: Test Request ID in Response Headers
```bash
curl -i http://localhost:3000/health
```

**Expected Response Headers:**
```
HTTP/1.1 200 OK
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json
...
```

**Verification:**
- ✅ `X-Request-ID` header should be present
- ✅ Value should be a valid UUID format
- ✅ Each request should have a unique ID

### Step 2: Test Multiple Requests (Different IDs)
```bash
# Request 1
curl -i http://localhost:3000/health

# Request 2
curl -i http://localhost:3000/health

# Request 3
curl -i http://localhost:3000/api/cache/stats
```

**Verification:**
- ✅ Each request should have a different `X-Request-ID`
- ✅ All requests should include the header

### Step 3: Check Logs for Request ID
Look at the server console/terminal where the server is running.

**Expected Log Format:**
```
[2025-11-13 12:22:47] [INFO] [a1b2c3d4] GET /health 200 - 5ms
[2025-11-13 12:22:48] [INFO] [e5f6g7h8] GET /api/cache/stats 200 - 15ms
```

**Verification:**
- ✅ Logs should include request ID (truncated to 8 chars)
- ✅ Request ID should appear in log prefix
- ✅ All logged requests should have request IDs

### Step 4: Test Request ID with POST Requests
```bash
curl -i -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

**Verification:**
- ✅ Response should include `X-Request-ID` header
- ✅ Logs should show request ID for this request

### Step 5: Test Request ID Persistence Through Middleware Chain
```bash
curl -i http://localhost:3000/api/cache/stats
```

**Verification:**
- ✅ Request ID should be present in response header
- ✅ Request ID should appear in logs
- ✅ Same request ID should be used throughout the request lifecycle

---

## Complete Integration Test

### Test All Features Together

**Step 1:** Make an AI request with model selection
```bash
curl -i -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"model":"gpt-4"}'
```

**Verification:**
- ✅ Response includes `X-Request-ID` header
- ✅ Request uses specified model
- ✅ Logs show request ID

**Step 2:** Check cache statistics
```bash
curl -i http://localhost:3000/api/cache/stats
```

**Verification:**
- ✅ Response includes `X-Request-ID` header
- ✅ Cache stats show the cached entry
- ✅ Logs show request ID

**Step 3:** Make same request again (cache hit)
```bash
curl -i -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"model":"gpt-4"}'
```

**Verification:**
- ✅ Response includes `X-Request-ID` header (different from previous)
- ✅ Response comes from cache (faster)
- ✅ Cache stats show increased hit count

---

## Testing Checklist

### Task 1: Cache Statistics
- [ ] Empty cache returns zero stats
- [ ] Cache stats update after requests
- [ ] Hits increment on cache hits
- [ ] Misses increment on cache misses
- [ ] Hit rate calculates correctly
- [ ] Total requests = hits + misses

### Task 2: Model Selection
- [ ] Default model works (no parameter)
- [ ] gpt-3.5-turbo works
- [ ] gpt-4 works
- [ ] gpt-4-turbo-preview works
- [ ] Invalid model returns 400 error
- [ ] Different models create separate cache entries
- [ ] Works for both /chat and /generate endpoints

### Task 3: Request ID Tracking
- [ ] X-Request-ID header present in all responses
- [ ] Request IDs are unique UUIDs
- [ ] Request IDs appear in logs
- [ ] Request IDs persist through middleware chain
- [ ] Works for GET, POST, and all endpoints

---

## Troubleshooting

### Server Not Starting
- Check if port 3000 is already in use
- Verify Node.js version (18+)
- Run `npm install` to ensure dependencies are installed

### Cache Stats Not Updating
- Make sure you're making actual API requests
- Wait a moment between requests
- Check that cache TTL hasn't expired

### Request ID Not Appearing
- Check server logs (should be visible in terminal)
- Verify middleware is registered in `src/index.js`
- Check response headers using `-i` flag with curl

### Model Validation Not Working
- Verify request body is valid JSON
- Check Content-Type header is `application/json`
- Ensure model value matches exactly (case-sensitive)

---

## Using Postman

If you prefer using Postman instead of curl:

1. **Import Collection:** Create a new collection
2. **Add Requests:**
   - GET `http://localhost:3000/api/cache/stats`
   - POST `http://localhost:3000/api/ai/chat` (with JSON body)
   - POST `http://localhost:3000/api/ai/generate` (with JSON body)
   - GET `http://localhost:3000/health`

3. **Check Headers Tab:** Look for `X-Request-ID` in response headers

4. **Check Body Tab:** Verify JSON responses

5. **Check Console:** View request/response details

