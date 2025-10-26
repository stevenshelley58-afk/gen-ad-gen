# 🧪 Testing Guide - Brand Intelligence API v3.0

## Quick Test Script

Save this as `test-api.sh` and run it to test all endpoints:

```bash
#!/bin/bash

API_URL="http://localhost:3000"
API_KEY="your-api-key-here"

echo "=== Health Check ==="
curl -s "$API_URL/health" | jq

echo -e "\n=== Brand Analysis ==="
BRAND_RESPONSE=$(curl -s -X POST "$API_URL/v1/brand-summary" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"brand_url": "https://allbirds.com"}')

echo "$BRAND_RESPONSE" | jq
RUN_ID=$(echo "$BRAND_RESPONSE" | jq -r '.run_id')

echo -e "\n=== Competitor Discovery ==="
curl -s -X POST "$API_URL/v1/competitors" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"brand_domain\": \"allbirds.com\", \"run_id\": \"$RUN_ID\"}" | jq

echo -e "\n=== Competitor Analysis ==="
curl -s -X POST "$API_URL/v1/competitors/analyze" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"run_id\": \"$RUN_ID\", \"domains\": [\"rothys.com\", \"vessi.com\"]}" | jq

echo -e "\n=== Kernel Assembly ==="
curl -s -X POST "$API_URL/v1/kernel" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"run_id\": \"$RUN_ID\"}" | jq

echo -e "\n=== Metrics ==="
curl -s "$API_URL/metrics" | head -20
```

## Manual Testing Steps

### 1. Verify Installation

```bash
# Check Node.js version
node --version  # Should be 18+

# Check Docker services
docker-compose ps  # Both should be "Up"

# Check Playwright
npx playwright --version
```

### 2. Start the API

```bash
# Terminal 1: Start services
docker-compose up

# Terminal 2: Start API
npm run dev
```

### 3. Test Health Endpoint

```bash
curl http://localhost:3000/health | jq
```

**Expected Response:**
```json
{
  "status": "healthy",
  "checks": {
    "openai": { "status": "ok" },
    "browser": { "status": "ok", "pool": { "total": 3, "available": 3 } },
    "database": { "status": "ok" },
    "redis": { "status": "ok" }
  }
}
```

### 4. Test Brand Analysis

```bash
curl -X POST http://localhost:3000/v1/brand-summary \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"brand_url": "https://allbirds.com"}' \
  | jq '.' > brand_response.json
```

**What to verify:**
- ✅ Response time: 30-60 seconds
- ✅ `run_id` present
- ✅ `brand.name` = "Allbirds"
- ✅ `brand.confidence_0_1` >= 0.6
- ✅ `brand.evidence_refs` has 5-15 URLs
- ✅ `meta.pages_scraped` >= 8

### 5. Test Cache Hit

```bash
# Run same request again
curl -X POST http://localhost:3000/v1/brand-summary \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"brand_url": "https://allbirds.com"}' \
  | jq '.meta.duration_ms'
```

**Expected:** < 1000ms (instant from cache)

### 6. Test Competitor Discovery

```bash
# Extract run_id from previous response
RUN_ID="run_xxx-xxx-xxx"

curl -X POST http://localhost:3000/v1/competitors \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d "{
    \"brand_domain\": \"allbirds.com\",
    \"run_id\": \"$RUN_ID\"
  }" \
  | jq '.' > competitors_response.json
```

**What to verify:**
- ✅ `competitors` array has 10 items
- ✅ Each has `name`, `domain`, `confidence_0_1`
- ✅ All confidence >= 0.6

### 7. Test Competitor Analysis

```bash
curl -X POST http://localhost:3000/v1/competitors/analyze \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d "{
    \"run_id\": \"$RUN_ID\",
    \"domains\": [\"rothys.com\", \"vessi.com\", \"atoms.com\"]
  }" \
  | jq '.' > competitors_analyzed.json
```

**What to verify:**
- ✅ Response time: 60-120 seconds (parallel processing)
- ✅ `competitors` array has 3 items
- ✅ Detailed analysis for each

### 8. Test Kernel Assembly

```bash
curl -X POST http://localhost:3000/v1/kernel \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d "{\"run_id\": \"$RUN_ID\"}" \
  | jq '.' > kernel_response.json
```

**What to verify:**
- ✅ `kernel.keyword_map` present
- ✅ `kernel.gap_map` array present
- ✅ `kernel.insights` with strengths, opportunities, risks
- ✅ All files references present

## Error Handling Tests

### Test Invalid URL

```bash
curl -X POST http://localhost:3000/v1/brand-summary \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"brand_url": "not-a-url"}' \
  | jq
```

**Expected:** HTTP 400, `error: "VALIDATION_ERROR"`

### Test Missing API Key

```bash
curl -X POST http://localhost:3000/v1/brand-summary \
  -H "Content-Type: application/json" \
  -d '{"brand_url": "https://example.com"}' \
  | jq
```

**Expected:** HTTP 401, `error: "UNAUTHORIZED"`

### Test Rate Limiting

```bash
# Send 25 requests quickly
for i in {1..25}; do
  curl -X GET http://localhost:3000/health \
    -H "X-API-Key: YOUR_API_KEY" \
    -w "\nStatus: %{http_code}\n"
  sleep 0.1
done
```

**Expected:** First 20 succeed (200), then 429 (rate limited)

### Test Invalid Run ID

```bash
curl -X POST http://localhost:3000/v1/kernel \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"run_id": "run_fake-id"}' \
  | jq
```

**Expected:** HTTP 424, `error: "UPSTREAM_ARTIFACT_MISSING"`

## Performance Tests

### Test Scraping Speed

```bash
time curl -X POST http://localhost:3000/v1/brand-summary \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"brand_url": "https://patagonia.com"}'
```

**Expected:** < 60 seconds total

### Test Concurrent Requests

```bash
# Test 5 concurrent requests
for i in {1..5}; do
  (curl -s -X POST http://localhost:3000/v1/brand-summary \
    -H "Content-Type: application/json" \
    -H "X-API-Key: YOUR_API_KEY" \
    -d "{\"brand_url\": \"https://example$i.com\"}" \
    > response_$i.json) &
done
wait
```

**Expected:** All 5 complete successfully

## Database Tests

### Check Active Runs

```bash
docker-compose exec postgres psql -U brand_user -d brand_intelligence \
  -c "SELECT run_id, brand_data->>'name' as brand, created_at FROM runs ORDER BY created_at DESC LIMIT 5;"
```

### Check Cache Statistics

```bash
docker-compose exec postgres psql -U brand_user -d brand_intelligence \
  -c "SELECT * FROM cache_statistics;"
```

### Check API Metrics

```bash
docker-compose exec postgres psql -U brand_user -d brand_intelligence \
  -c "SELECT endpoint, COUNT(*), AVG(duration_ms) FROM api_metrics GROUP BY endpoint;"
```

## Load Testing (Optional)

### Using Artillery

```bash
# Install Artillery
npm install -g artillery

# Create test config
cat > artillery-test.yml << EOF
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 5
  defaults:
    headers:
      X-API-Key: "YOUR_API_KEY"

scenarios:
  - name: "Health Check"
    flow:
      - get:
          url: "/health"
EOF

# Run load test
artillery run artillery-test.yml
```

**Expected:**
- All requests successful
- p95 latency < 100ms for health check
- No errors

## Monitoring Tests

### Check Prometheus Metrics

```bash
curl http://localhost:3000/metrics
```

Look for these metrics:
- `http_request_duration_ms`
- `scraping_duration_ms`
- `cache_hits_total`
- `cache_misses_total`
- `openai_tokens_used_total`
- `browser_pool_size`

### Check Logs

```bash
# View structured logs
tail -f logs/app.log | jq

# Or if using nodemon in dev
# Logs appear in console
```

**Verify:**
- ✅ Correlation IDs present
- ✅ API keys redacted
- ✅ Performance metrics included
- ✅ Errors logged with stack traces

## Cleanup After Testing

```bash
# Stop services
docker-compose down

# Clear test data
docker-compose exec postgres psql -U brand_user -d brand_intelligence \
  -c "DELETE FROM runs; DELETE FROM scraping_cache; DELETE FROM api_metrics;"

# Or full cleanup
docker-compose down -v  # Remove volumes too
```

## Automated Test Suite (Future)

Create `tests/` directory with Jest tests:

```javascript
// tests/integration/api.test.js
const { createServer } = require('../../src/server');

describe('API Integration Tests', () => {
  let server;

  beforeAll(async () => {
    server = await createServer();
  });

  afterAll(async () => {
    await server.close();
  });

  test('GET /health returns 200', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload).status).toBe('healthy');
  });

  // Add more tests...
});
```

Run with: `npm test`

---

## Success Criteria

Your API is working correctly when:

1. ✅ Health check returns "healthy"
2. ✅ Brand analysis completes in < 60s
3. ✅ Cache hit is instant (< 1s)
4. ✅ All 4 endpoints work correctly
5. ✅ Rate limiting blocks after 20 requests
6. ✅ Invalid requests return proper error codes
7. ✅ Logs show structured output with correlation IDs
8. ✅ Metrics are collected and accessible
9. ✅ Database stores data correctly
10. ✅ Graceful shutdown works

---

**Happy Testing!** 🧪
