# Start Here - Complete Project Overview

## What You Have

A complete **Brand Intelligence API** with a modern **React frontend** for generating ad context from website analysis.

```
webapp/
├── Backend (Node.js + Fastify)    # API server on port 3000
└── Frontend (React + Vite)         # UI on port 5173
    └── ad-gen-front/
```

## Quick Start (5 Minutes)

### Terminal 1: Start Backend

```bash
cd /home/user/webapp

# Start databases (first time only)
docker-compose up -d
sleep 10

# Run migrations (first time only)
npm run db:migrate

# Start backend
npm start
```

Backend runs on: `http://localhost:3000`

### Terminal 2: Start Frontend

```bash
cd /home/user/webapp/ad-gen-front

# Configure API key (first time only)
# Edit src/lib/api.js line 5 with key from backend .env

# Start frontend
npm run dev
```

Frontend runs on: `http://localhost:5173`

### Test It

1. Open: `http://localhost:5173`
2. Enter: `stripe.com`
3. Wait: 30-60 seconds
4. Review brand summary
5. Try Edit/Save/Approve

## Project Structure

```
webapp/
├── src/                      # Backend API
│   ├── config/              # Environment, DB, Redis
│   ├── db/                  # Migrations, models
│   ├── services/            # Business logic
│   ├── routes/              # API endpoints
│   ├── middleware/          # Auth, logging, errors
│   └── utils/               # Helpers, validation
│
├── ad-gen-front/            # Frontend UI
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── lib/            # API client, utils
│   │   └── App.jsx         # Main app
│   ├── README.md           # Frontend docs
│   ├── TESTING.md          # Test procedures
│   └── QUICKSTART.md       # 2-min setup
│
├── README.md               # Backend docs
├── DEPLOYMENT.md           # Deploy to Railway
├── TESTING.md              # Backend testing
├── FRONTEND_COMPLETE.md    # Frontend summary
└── docker-compose.yml      # PostgreSQL + Redis
```

## Key Files

### Backend Configuration
- `.env` - Environment variables (API keys, DB config)
- `src/config/environment.js` - Config validation
- `docker-compose.yml` - Local databases

### Frontend Configuration
- `ad-gen-front/src/lib/api.js` - Backend connection
- `ad-gen-front/vite.config.js` - Dev proxy
- `ad-gen-front/.env.example` - Config template

## API Endpoints (Backend)

```bash
# Health check
GET /health

# Analyze brand (returns summary)
POST /v1/brand-summary
Body: {"brand_url": "https://stripe.com"}

# Discover competitors
POST /v1/competitors
Body: {"run_id": "run_xxx"}

# Analyze competitors
POST /v1/competitors/analyze
Body: {"run_id": "run_xxx"}

# Generate intelligence kernel
POST /v1/kernel
Body: {"run_id": "run_xxx"}
```

## Frontend Flow

1. **Landing** - Hero with title
2. **Input** - URL entry with validation
3. **Processing** - LLM-style thinking animation
4. **Summary** - Brand data with Edit/Approve
5. **Approved** - Coming soon placeholder

## Tech Stack

### Backend
- Node.js 18+ with Fastify
- PostgreSQL 16 (persistent storage)
- Redis 7 (caching)
- Playwright (web scraping)
- OpenAI GPT-4o (analysis)

### Frontend
- React 19 + Vite
- Tailwind CSS + Shadcn/ui
- Framer Motion (animations)
- Axios (HTTP client)
- React Hook Form + Zod (forms)

## Documentation

### Backend
- `README.md` - Complete backend guide
- `DEPLOYMENT.md` - Railway deployment
- `TESTING.md` - Testing procedures
- `QUICKSTART.md` - Quick setup

### Frontend
- `ad-gen-front/README.md` - Frontend guide
- `ad-gen-front/TESTING.md` - Test procedures
- `ad-gen-front/QUICKSTART.md` - 2-min setup
- `FRONTEND_COMPLETE.md` - Build summary

## Environment Variables

### Backend (.env)
```bash
NODE_ENV=development
PORT=3000
API_KEY=your-api-key-here
OPENAI_API_KEY=sk-proj-xxx
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
```

### Frontend
API key configured in `src/lib/api.js` (matches backend)

## Common Commands

### Backend
```bash
npm start              # Start server
npm run dev           # Dev with nodemon
npm run db:migrate    # Run migrations
npm run db:cleanup    # Clean old data
npm test              # Run tests
```

### Frontend
```bash
npm run dev           # Start dev server
npm run build         # Build for production
npm run preview       # Preview build
```

## Troubleshooting

### Backend won't start
```bash
# Check databases
docker-compose ps

# Check migrations
npm run db:migrate

# Check logs
tail -f logs/app.log
```

### Frontend errors
```bash
# Check backend is running
curl http://localhost:3000/health

# Check API key matches
cat /home/user/webapp/.env | grep API_KEY
# Compare with ad-gen-front/src/lib/api.js

# Restart frontend
npm run dev
```

### CORS issues
- Vite proxy should handle this automatically
- Restart frontend dev server
- Check vite.config.js proxy settings

## Next Steps

### Development
1. Test with multiple websites
2. Add OpenAI API key to backend `.env`
3. Verify all screens work smoothly
4. Test on mobile devices

### Production Deployment
1. Backend → Railway (see DEPLOYMENT.md)
2. Frontend → Vercel (see ad-gen-front/README.md)
3. Set environment variables
4. Connect frontend to production backend

### Future Features
- [ ] Audience segment generation
- [ ] Ad copy generation
- [ ] Export to PDF
- [ ] Analysis history
- [ ] User authentication
- [ ] Dark mode

## Support

Check documentation:
1. Backend: `README.md`, `DEPLOYMENT.md`, `TESTING.md`
2. Frontend: `ad-gen-front/README.md`, `TESTING.md`, `QUICKSTART.md`
3. Summary: `FRONTEND_COMPLETE.md`

## Ready to Go!

Both backend and frontend are complete and ready to test locally.

Start with:
1. Backend: `cd /home/user/webapp && npm start`
2. Frontend: `cd /home/user/webapp/ad-gen-front && npm run dev`
3. Open: `http://localhost:5173`

Enjoy! 🚀
