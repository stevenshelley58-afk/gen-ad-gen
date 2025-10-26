# ⚡ Quick Start - Brand Intelligence API v3.0

## 5-Minute Setup

### Prerequisites Check
```bash
node --version    # Need 18+
docker --version  # Need 20+
```

### Step 1: Install Dependencies (2 minutes)
```bash
npm install
npx playwright install chromium
```

### Step 2: Start Services (30 seconds)
```bash
docker-compose up -d
# Wait 10 seconds for services to start
```

### Step 3: Configure Environment (1 minute)
```bash
cp .env.example .env
```

Edit `.env` and set:
```bash
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE  # Get from https://platform.openai.com
API_KEY=$(openssl rand -hex 32)        # Or any secure random string
```

### Step 4: Run Migration (30 seconds)
```bash
npm run db:migrate
```

### Step 5: Start API (30 seconds)
```bash
npm run dev
```

Server starts at `http://localhost:3000`

## First API Call

```bash
curl -X POST http://localhost:3000/v1/brand-summary \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY_FROM_ENV" \
  -d '{"brand_url": "https://allbirds.com"}' \
  | jq
```

Response in 30-60 seconds with complete brand analysis!

## What Just Happened?

1. ✅ PostgreSQL database created and migrated
2. ✅ Redis cache connected
3. ✅ 3 Chromium browsers launched in pool
4. ✅ 20+ pages scraped from Allbirds.com
5. ✅ GPT-4o analyzed the brand
6. ✅ Evidence URLs validated
7. ✅ Results cached for 24 hours

## Next Steps

- [Full Documentation](README.md)
- [API Testing Guide](TESTING.md)
- [Deployment Guide](DEPLOYMENT.md)

## Troubleshooting

**PostgreSQL Error?**
```bash
docker-compose restart postgres
```

**Redis Error?**
```bash
docker-compose restart redis
```

**Playwright Error?**
```bash
npx playwright install chromium --with-deps
```

---

**You're all set!** 🎉
