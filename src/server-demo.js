/**
 * Demo server - runs without PostgreSQL/Redis
 * Perfect for testing frontend UI/UX
 */

const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');

// Enable CORS
fastify.register(cors, {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
});

// Health check
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'ok',
    mode: 'demo',
    timestamp: new Date().toISOString() 
  };
});

// Mock brand summary endpoint
fastify.post('/v1/brand-summary', async (request, reply) => {
  const { brand_url } = request.body;
  
  if (!brand_url) {
    return reply.code(400).send({ error: 'brand_url is required' });
  }

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  const domain = brand_url.replace(/^https?:\/\//, '').split('/')[0];
  const brandName = domain.split('.')[0];
  const capitalizedName = brandName.charAt(0).toUpperCase() + brandName.slice(1);

  // Return mock data
  return {
    run_id: `run_${Date.now()}`,
    brand: {
      name: capitalizedName,
      tagline: `Innovative solutions for ${brandName} industry`,
      industry: 'Technology',
      founded_year: '2020',
      headquarters_location: 'San Francisco, CA',
      products_services: [
        'Cloud Platform',
        'API Services',
        'Developer Tools',
        'Analytics Dashboard'
      ],
      target_audience: [
        'Software Developers',
        'Enterprise Companies',
        'Startup Founders',
        'Tech Enthusiasts'
      ],
      brand_voice_tone: ['Professional', 'Technical', 'Innovative'],
      key_messaging_themes: [
        'Build faster with modern tools',
        'Scale without limits',
        'Developer-first approach',
        'Reliable infrastructure'
      ],
      confidence_0_1: 0.85,
      evidence_refs: [
        `https://${domain}/about`,
        `https://${domain}/products`
      ]
    },
    brand_card: `# ${capitalizedName}\n\n**${capitalizedName}** - Innovative solutions`,
    meta: {
      duration_ms: 2000,
      pages_scraped: 5,
      timestamp: new Date().toISOString()
    }
  };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('\n🚀 Demo Server Started!');
    console.log('   Port: 3000');
    console.log('   Mode: DEMO (no database required)');
    console.log('   Frontend: http://localhost:5173');
    console.log('\n   Try: npm run dev (in ad-gen-front directory)\n');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
