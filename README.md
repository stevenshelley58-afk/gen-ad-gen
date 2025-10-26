# 🚀 Brand Intelligence API v3.0

Production-ready Brand Intelligence API with PostgreSQL, Redis caching, and Playwright web scraping.

## ✨ Features

- **5x Faster Scraping**: Parallel processing with browser pool (40s vs 200s for 20 pages)
- **Two-Tier Caching**: Redis (fast) + PostgreSQL (persistent) with 24-hour TTL
- **PostgreSQL Storage**: Production-ready persistent storage replacing file-based system
- **Browser Pool**: Reusable Playwright browsers for efficient scraping
- **OpenAI Integration**: GPT-4o for brand and competitor analysis
- **Evidence Validation**: Automatic URL validation with confidence adjustment
- **Structured Logging**: Pino logger with correlation IDs
- **Prometheus Metrics**: Built-in performance monitoring
- **Rate Limiting**: 20 requests per minute per IP/API key
- **Graceful Shutdown**: Proper cleanup of all resources

## 📊 Performance Improvements vs v2.0

| Metric | v2.0 | v3.0 | Improvement |
|--------|------|------|-------------|
| Scraping 20 pages | 200s | 40s | **5x faster** |
| Evidence check | 12s | 1.2s | **10x faster** |
| Repeat brand query | 200s | <1s | **Instant (cached)** |
| Storage | Files | PostgreSQL | **Production-ready** |
| Concurrent users | 1-2 | 20+ | **10x more** |

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Fastify 4.x
- **Database**: PostgreSQL 16+
- **Cache**: Redis 7+
- **Scraping**: Playwright (Chromium)
- **AI**: OpenAI GPT-4o
- **Logging**: Pino
- **Metrics**: Prometheus (prom-client)

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- Docker & Docker Compose (for PostgreSQL & Redis)
- OpenAI API key
- 8GB+ RAM recommended

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd webapp
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install chromium
```

### 3. Start Database Services

```bash
docker-compose up -d
```

Wait 10 seconds for services to start, then verify:

```bash
docker-compose ps
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set:

```bash
# Required
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
API_KEY=$(openssl rand -hex 32)  # Generate secure key

# Database (already configured for Docker)
DATABASE_URL=postgresql://brand_user:brand_pass_dev@localhost:5432/brand_intelligence
REDIS_URL=redis://localhost:6379
```

### 5. Run Database Migration

```bash
npm run db:migrate
```

### 6. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## 🧪 Testing the API

### Health Check

```bash
curl http://localhost:3000/health | jq
```

### Brand Analysis

```bash
curl -X POST http://localhost:3000/v1/brand-summary \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"brand_url": "https://allbirds.com"}' \
  | jq
```

This will:
- Scrape 20+ pages from allbirds.com (30-60 seconds)
- Analyze brand with GPT-4o
- Validate evidence URLs
- Return structured brand analysis
- Cache results for 24 hours

### Competitor Discovery

```bash
curl -X POST http://localhost:3000/v1/competitors \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "brand_domain": "allbirds.com",
    "run_id": "run_xxx-xxx-xxx"
  }' \
  | jq
```

### Competitor Analysis

```bash
curl -X POST http://localhost:3000/v1/competitors/analyze \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "run_id": "run_xxx-xxx-xxx",
    "domains": ["rothys.com", "vessi.com", "atoms.com"]
  }' \
  | jq
```

### Kernel Assembly

```bash
curl -X POST http://localhost:3000/v1/kernel \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"run_id": "run_xxx-xxx-xxx"}' \
  | jq
```

## 📁 Project Structure

```
webapp/
├── src/
│   ├── server.js              # Main entry point
│   ├── config/                # Configuration
│   │   ├── environment.js     # Environment variables
│   │   ├── database.js        # PostgreSQL pool
│   │   └── redis.js           # Redis client
│   ├── db/                    # Database
│   │   ├── migrations/        # SQL migrations
│   │   ├── models/            # Database models
│   │   ├── migrate.js         # Migration runner
│   │   └── cleanup.js         # Cleanup script
│   ├── services/              # Business logic
│   │   ├── browser-pool.service.js   # Playwright pool
│   │   ├── cache.service.js          # Two-tier caching
│   │   ├── scraper.service.js        # Web scraping
│   │   ├── openai.service.js         # OpenAI integration
│   │   ├── evidence.service.js       # URL validation
│   │   ├── storage.service.js        # Database operations
│   │   └── card.service.js           # UI card generation
│   ├── middleware/            # Fastify middleware
│   │   ├── auth.js            # API key auth
│   │   ├── error-handler.js   # Global error handling
│   │   ├── logger.js          # Request logging
│   │   └── request-timeout.js # Request timeout
│   ├── routes/                # API endpoints
│   │   ├── stage1.routes.js   # Main API routes
│   │   ├── health.routes.js   # Health checks
│   │   └── metrics.routes.js  # Prometheus metrics
│   └── utils/                 # Utilities
│       ├── logger.js          # Pino logger
│       ├── metrics.js         # Prometheus metrics
│       ├── validation.js      # Request validation
│       ├── errors.js          # Custom errors
│       └── helpers.js         # Helper functions
├── docker-compose.yml         # Local dev environment
├── package.json               # Dependencies
├── .env.example               # Environment template
└── README.md                  # This file
```

## 🔧 Configuration

All configuration is done via environment variables in `.env`:

### Required

- `OPENAI_API_KEY` - Your OpenAI API key
- `API_KEY` - API key for authentication
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

### Optional (with defaults)

- `SCRAPE_CONCURRENCY=5` - Pages to scrape simultaneously
- `BROWSER_POOL_SIZE=3` - Number of browsers in pool
- `CACHE_TTL_SCRAPING=86400` - Scraping cache TTL (24 hours)
- `RATE_LIMIT_MAX=20` - Max requests per window
- `LOG_LEVEL=info` - Logging level

See `.env.example` for complete list.

## 📊 Monitoring

### Health Endpoints

- `GET /health` - Full health check (database, Redis, browser pool)
- `GET /health/ready` - Readiness check
- `GET /health/live` - Liveness check

### Metrics Endpoint

```bash
curl http://localhost:3000/metrics
```

Provides Prometheus-compatible metrics:
- HTTP request duration
- Scraping duration
- Cache hit rate
- OpenAI token usage
- Browser pool statistics
- Active runs count

## 🗄️ Database Management

### View Active Runs

```bash
docker-compose exec postgres psql -U brand_user -d brand_intelligence \
  -c "SELECT * FROM active_runs_summary;"
```

### View Cache Statistics

```bash
docker-compose exec postgres psql -U brand_user -d brand_intelligence \
  -c "SELECT * FROM cache_statistics;"
```

### Cleanup Expired Data

```bash
npm run db:cleanup
```

Removes expired runs, cache entries, and old metrics.

## 🚨 Troubleshooting

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres
```

### Redis Connection Failed

```bash
# Check if Redis is running
docker-compose ps

# Restart Redis
docker-compose restart redis
```

### Playwright Browser Not Found

```bash
# Install Chromium
npx playwright install chromium

# On Linux, install system dependencies
npx playwright install-deps chromium
```

### Scraping Too Slow

Increase `SCRAPE_CONCURRENCY` in `.env` (try 7-10).

### Out of Memory

Reduce `BROWSER_POOL_SIZE` to 2 or 1 in `.env`.

## 🔐 Security

- API key authentication on all protected endpoints
- Rate limiting (20 req/min per IP + API key)
- CORS protection (configurable)
- Helmet security headers
- Environment variable validation
- SQL injection protection (parameterized queries)
- XSS protection (input validation)

## 📈 Performance Tips

1. **Cache Warm-up**: Pre-scrape common brands during off-peak hours
2. **Increase Concurrency**: Adjust `SCRAPE_CONCURRENCY` based on your resources
3. **Database Tuning**: Increase PostgreSQL `max_connections` for high load
4. **Redis Persistence**: Enable RDB snapshots for cache persistence
5. **Monitor Metrics**: Use Prometheus + Grafana for observability

## 🚀 Deployment

### Option 1: Railway.app

1. Create new project on Railway
2. Add PostgreSQL and Redis services
3. Connect GitHub repository
4. Set environment variables
5. Deploy

### Option 2: Render.com

1. Create web service from repository
2. Add PostgreSQL and Redis services
3. Set environment variables
4. Deploy

### Option 3: Docker

```bash
# Build image
docker build -t brand-intelligence-api .

# Run with docker-compose (includes PostgreSQL & Redis)
docker-compose up
```

## 📝 API Documentation

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/brand-summary` | Analyze a brand |
| POST | `/v1/competitors` | Discover 10 competitors |
| POST | `/v1/competitors/analyze` | Analyze 3 competitors |
| POST | `/v1/kernel` | Assemble final kernel |
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

All protected endpoints require `X-API-Key` header.

### Response Format

All endpoints return JSON with:
- `run_id` - Unique run identifier
- Main data object
- `meta` - Metadata (duration, timestamp, etc.)

Error responses include:
- `error` - Error code
- `message` - Human-readable message
- `details` - Additional context (optional)
- `correlationId` - Request correlation ID

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- OpenAI for GPT-4o API
- Playwright team for excellent browser automation
- Fastify team for high-performance framework
- PostgreSQL and Redis communities

---

**Built with ❤️ for production use**

For questions or issues, please open a GitHub issue.
