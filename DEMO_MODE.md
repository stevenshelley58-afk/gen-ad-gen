# Demo Mode - Running Without Databases

Since Docker/databases aren't available in this environment, I've created a **demo mode** that lets you test the frontend UI/UX without PostgreSQL or Redis.

## What's Running Now

✅ **Backend Demo Server** - Port 3000 (mock data)  
✅ **Frontend React App** - Port 5173 (full UI)

## Access Your App

**Frontend URL:**  
https://5173-ipugudo804h36j96lplsl-2e1b9533.sandbox.novita.ai

## How It Works

### Demo Backend
- Runs on port 3000
- No database required
- Returns realistic mock data
- Simulates 2-second processing time
- Perfect for testing UI/UX

### Frontend
- Full React app with all features
- Smooth animations
- Edit/Approve workflow
- Mobile responsive

## Test It Now

1. Click the frontend URL above
2. Enter any website (e.g., `stripe.com`)
3. Watch the processing animation
4. Review the mock brand summary
5. Try Edit, Save, and Approve buttons

## Mock Data

The demo backend generates realistic data for any URL:
- Brand name extracted from domain
- Generic but realistic fields
- Consistent structure
- Fast response (2 seconds)

## Start/Stop Commands

### Start (Already Running)
```bash
# Backend
cd /home/user/webapp
npm run demo

# Frontend
cd /home/user/webapp/ad-gen-front
npm run dev
```

### Stop
```bash
# Kill backend
pkill -f "node src/server-demo.js"

# Kill frontend
pkill -f "vite"
```

### Check Status
```bash
# Check if running
lsof -i :3000 -i :5173

# Test backend
curl http://localhost:3000/health
```

## Logs

```bash
# Backend logs
tail -f /tmp/backend-demo.log

# Frontend logs
tail -f /tmp/frontend.log
```

## Real Backend (With Databases)

To use the real backend with actual web scraping and OpenAI:

1. **Install Docker** on your local machine
2. **Clone the repo** from GitHub
3. **Start databases**: `docker-compose up -d`
4. **Run migrations**: `npm run db:migrate`
5. **Add OpenAI key** to `.env`
6. **Start backend**: `npm start`
7. **Start frontend**: `cd ad-gen-front && npm run dev`

## What Works in Demo Mode

✅ Frontend UI/UX flow  
✅ Animations and transitions  
✅ Form validation  
✅ Edit/Save/Approve workflow  
✅ Mobile responsive design  
✅ Error handling  

## What Doesn't Work

❌ Real web scraping (returns mock data)  
❌ OpenAI analysis (returns mock data)  
❌ Data persistence (no database)  
❌ Caching (no Redis)  
❌ Competitor discovery  
❌ Kernel generation  

## Perfect For

- Testing frontend UI/UX
- Demoing to stakeholders
- Development without database setup
- Quick iteration on design
- Mobile testing

## Next Steps

1. **Test the UI** - Click the URL above
2. **Try different URLs** - Any domain works
3. **Test Edit workflow** - Modify fields and save
4. **Check mobile** - Responsive on all devices
5. **Deploy locally** - Use real backend with Docker

## Demo Server Code

Located at: `/home/user/webapp/src/server-demo.js`

Simple Fastify server that:
- Listens on port 3000
- Handles `/v1/brand-summary` endpoint
- Returns mock data based on input URL
- No external dependencies

## Production Deployment

For production with real data:
1. Deploy backend to Railway (with PostgreSQL + Redis add-ons)
2. Deploy frontend to Vercel
3. Connect frontend to production backend URL
4. Add real OpenAI API key

See `DEPLOYMENT.md` for detailed instructions.

---

**Your app is ready to test!**  
Open: https://5173-ipugudo804h36j96lplsl-2e1b9533.sandbox.novita.ai
