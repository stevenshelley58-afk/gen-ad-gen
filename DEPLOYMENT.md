# 🚀 Deployment Guide - Brand Intelligence API v3.0

## Deployment Options

### Option 1: Railway.app (Recommended)

Railway is ideal for this project as it supports Docker, PostgreSQL, and Redis natively.

#### Steps:

1. **Create Railway Account**
   - Visit https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Add PostgreSQL Service**
   - Click "+ New"
   - Select "Database" → "PostgreSQL"
   - Railway will provision a PostgreSQL instance
   - Copy the `DATABASE_URL` from the service settings

4. **Add Redis Service**
   - Click "+ New"
   - Select "Database" → "Redis"
   - Copy the `REDIS_URL` from the service settings

5. **Configure Environment Variables**
   - Go to your app service → Variables
   - Add all required variables from `.env.example`:
     ```
     NODE_ENV=production
     PORT=3000
     OPENAI_API_KEY=sk-proj-your-key
     API_KEY=your-generated-key
     DATABASE_URL=(copied from PostgreSQL service)
     REDIS_URL=(copied from Redis service)
     ```

6. **Deploy**
   - Railway will automatically build and deploy
   - Run migration: `railway run npm run db:migrate`
   - Access your API at the Railway-provided URL

**Cost**: ~$5-10/month (with PostgreSQL + Redis)

---

### Option 2: Render.com

Render offers a good free tier for testing.

#### Steps:

1. **Create Render Account**
   - Visit https://render.com
   - Sign up with GitHub

2. **Create PostgreSQL Database**
   - Dashboard → "New" → "PostgreSQL"
   - Choose instance type (Free tier available)
   - Copy the Internal Database URL

3. **Create Redis Instance**
   - Dashboard → "New" → "Redis"
   - Choose instance type
   - Copy the Redis URL

4. **Create Web Service**
   - Dashboard → "New" → "Web Service"
   - Connect GitHub repository
   - Configure:
     - **Build Command**: `npm install && npx playwright install chromium && npm run db:migrate`
     - **Start Command**: `npm start`
     - **Environment**: Node

5. **Set Environment Variables**
   - Add all variables from `.env.example`
   - Use the database URLs from previous steps

6. **Deploy**
   - Render will build and deploy automatically
   - Access your API at the Render URL

**Cost**: Free tier available (with limitations)

---

### Option 3: DigitalOcean App Platform

#### Steps:

1. **Create DigitalOcean Account**
   - Visit https://www.digitalocean.com
   - Sign up and add payment method

2. **Create Managed PostgreSQL**
   - Create → Databases → PostgreSQL
   - Choose plan (starts at $15/month)
   - Copy connection string

3. **Create Managed Redis**
   - Create → Databases → Redis
   - Choose plan (starts at $15/month)
   - Copy connection string

4. **Create App**
   - Create → Apps → GitHub
   - Connect repository
   - Configure build settings:
     - Build Command: `npm install && npx playwright install chromium`
     - Run Command: `npm start`

5. **Add Environment Variables**
   - Settings → Environment Variables
   - Add all required variables

6. **Run Migration**
   - Use the console to run: `npm run db:migrate`

**Cost**: ~$30-40/month (App + PostgreSQL + Redis)

---

### Option 4: Self-Hosted (VPS)

For maximum control, deploy to your own VPS.

#### Requirements:
- Ubuntu 22.04+ or Debian 11+
- 4GB+ RAM
- 2+ CPU cores
- Docker and Docker Compose installed

#### Steps:

1. **Prepare VPS**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh

   # Install Docker Compose
   sudo apt install docker-compose -y

   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs

   # Install PM2 globally
   sudo npm install -g pm2
   ```

2. **Clone Repository**
   ```bash
   git clone <your-repo-url>
   cd webapp
   ```

3. **Install Dependencies**
   ```bash
   npm install
   npx playwright install chromium
   npx playwright install-deps chromium
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your values
   ```

5. **Start Services**
   ```bash
   # Start PostgreSQL and Redis
   docker-compose up -d

   # Run migration
   npm run db:migrate

   # Start app with PM2
   pm2 start src/server.js --name brand-api
   pm2 save
   pm2 startup  # Follow instructions to enable auto-start
   ```

6. **Set Up Nginx Reverse Proxy**
   ```bash
   sudo apt install nginx -y

   sudo nano /etc/nginx/sites-available/brand-api
   ```

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/brand-api /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Set Up SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d your-domain.com
   ```

**Cost**: $5-20/month (VPS only)

---

## Post-Deployment Checklist

### 1. Verify Health
```bash
curl https://your-api-url.com/health
```

Should return `"status": "healthy"`

### 2. Test API
```bash
curl -X POST https://your-api-url.com/v1/brand-summary \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"brand_url": "https://example.com"}'
```

### 3. Monitor Metrics
```bash
curl https://your-api-url.com/metrics
```

### 4. Check Logs
```bash
# Railway: View logs in dashboard
# Render: View logs in dashboard
# Self-hosted: pm2 logs brand-api
```

### 5. Set Up Monitoring
- Configure Prometheus to scrape `/metrics`
- Set up Grafana dashboards
- Configure alerts for errors and high latency

---

## Environment Variables Reference

### Required
- `OPENAI_API_KEY` - Your OpenAI API key
- `API_KEY` - API authentication key (generate with `openssl rand -hex 32`)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

### Optional (recommended for production)
- `NODE_ENV=production`
- `LOG_LEVEL=info`
- `LOG_PRETTY=false`
- `SCRAPE_CONCURRENCY=7` (increase for better performance)
- `BROWSER_POOL_SIZE=3`
- `RATE_LIMIT_MAX=50` (adjust based on your needs)

---

## Scaling Recommendations

### Horizontal Scaling
1. Deploy multiple app instances behind load balancer
2. Use shared PostgreSQL and Redis instances
3. Consider Kubernetes for advanced orchestration

### Vertical Scaling
1. Increase `BROWSER_POOL_SIZE` (4-6 for 8GB RAM)
2. Increase `SCRAPE_CONCURRENCY` (10-15 for better performance)
3. Upgrade database to larger instance

### Caching Optimization
1. Increase Redis memory allocation
2. Monitor cache hit rate in metrics
3. Pre-warm cache for popular brands

---

## Backup Strategy

### Database Backups
```bash
# Automated daily backups
pg_dump -U brand_user brand_intelligence > backup_$(date +%Y%m%d).sql
```

### Redis Persistence
Enable RDB snapshots in `docker-compose.yml`:
```yaml
redis:
  command: redis-server --save 60 1 --appendonly yes
```

---

## Security Best Practices

1. **Never commit `.env` file** - It contains secrets
2. **Use strong API keys** - Generate with `openssl rand -hex 32`
3. **Enable HTTPS** - Use SSL certificates (Let's Encrypt)
4. **Keep dependencies updated** - Run `npm audit` regularly
5. **Monitor logs** - Watch for unusual activity
6. **Rate limiting** - Adjust based on your use case
7. **Database credentials** - Use strong passwords

---

## Troubleshooting

### High Memory Usage
- Reduce `BROWSER_POOL_SIZE`
- Monitor browser pool with `/metrics`
- Consider horizontal scaling

### Slow Response Times
- Increase `SCRAPE_CONCURRENCY`
- Check cache hit rate
- Optimize database queries

### OpenAI Timeout Errors
- Increase `OPENAI_TIMEOUT` in environment
- Check your OpenAI API rate limits
- Consider retry logic tuning

---

## Support

For issues or questions:
1. Check logs first
2. Review `/health` endpoint
3. Check `/metrics` for performance issues
4. Open GitHub issue with details

---

**Good luck with your deployment!** 🚀
