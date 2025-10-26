-- Brand Intelligence API v3.0 - Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================================
-- MAIN TABLES
-- ============================================================================

-- Runs table (replaces file-based storage)
CREATE TABLE IF NOT EXISTS runs (
    run_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    
    -- Brand data
    brand_data JSONB,
    brand_summary TEXT,
    
    -- Competitor data
    competitors_10 JSONB,
    competitors_selected JSONB,
    
    -- Kernel data
    kernel_data JSONB,
    report_md TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Indexes for runs table
CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_expires_at ON runs(expires_at);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_brand_domain ON runs((brand_data->>'domain')) WHERE brand_data IS NOT NULL;

-- GIN indexes for JSONB search
CREATE INDEX IF NOT EXISTS idx_brand_data_gin ON runs USING GIN (brand_data jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_competitors_gin ON runs USING GIN (competitors_selected jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_metadata_gin ON runs USING GIN (metadata jsonb_path_ops);

-- ============================================================================
-- CACHE TABLE
-- ============================================================================

-- Scraping cache table (two-tier caching with Redis)
CREATE TABLE IF NOT EXISTS scraping_cache (
    url_hash VARCHAR(64) PRIMARY KEY,
    url TEXT NOT NULL,
    content JSONB NOT NULL,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    page_count INTEGER,
    total_tokens INTEGER,
    access_count INTEGER DEFAULT 1,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scraping_cache_expires ON scraping_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_scraping_cache_url ON scraping_cache(url);
CREATE INDEX IF NOT EXISTS idx_scraping_cache_accessed ON scraping_cache(last_accessed_at DESC);

-- ============================================================================
-- METRICS TABLE
-- ============================================================================

-- API metrics table (for monitoring and analytics)
CREATE TABLE IF NOT EXISTS api_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    endpoint VARCHAR(100) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL,
    tokens_used INTEGER,
    run_id UUID REFERENCES runs(run_id) ON DELETE SET NULL,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON api_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_endpoint ON api_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_metrics_run_id ON api_metrics(run_id) WHERE run_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_metrics_status ON api_metrics(status_code);

-- Partition metrics table by month (for better performance)
-- Note: Manual partitioning - consider using pg_partman for automation
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp_brin ON api_metrics USING BRIN(timestamp);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Cleanup function for expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data() 
RETURNS TABLE(deleted_runs INTEGER, deleted_cache INTEGER, deleted_metrics INTEGER) AS $$
DECLARE
    deleted_runs_count INTEGER;
    deleted_cache_count INTEGER;
    deleted_metrics_count INTEGER;
BEGIN
    -- Delete expired runs
    DELETE FROM runs WHERE expires_at < CURRENT_TIMESTAMP AND status != 'archived';
    GET DIAGNOSTICS deleted_runs_count = ROW_COUNT;
    
    -- Delete expired cache entries
    DELETE FROM scraping_cache WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_cache_count = ROW_COUNT;
    
    -- Delete old metrics (keep 30 days)
    DELETE FROM api_metrics WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_metrics_count = ROW_COUNT;
    
    RETURN QUERY SELECT deleted_runs_count, deleted_cache_count, deleted_metrics_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_runs_updated_at ON runs;
CREATE TRIGGER update_runs_updated_at
    BEFORE UPDATE ON runs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to increment cache access count
CREATE OR REPLACE FUNCTION increment_cache_access()
RETURNS TRIGGER AS $$
BEGIN
    NEW.access_count = OLD.access_count + 1;
    NEW.last_accessed_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger is intentionally not created as it would fire on every access
-- Instead, cache access tracking should be done in application code for performance

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for active runs with summary
CREATE OR REPLACE VIEW active_runs_summary AS
SELECT 
    run_id,
    created_at,
    updated_at,
    expires_at,
    brand_data->>'name' as brand_name,
    brand_data->>'domain' as brand_domain,
    brand_data->>'category' as category,
    (brand_data->>'confidence_0_1')::FLOAT as brand_confidence,
    jsonb_array_length(COALESCE(competitors_10, '[]'::jsonb)) as competitors_found,
    jsonb_array_length(COALESCE(competitors_selected, '[]'::jsonb)) as competitors_analyzed,
    CASE 
        WHEN kernel_data IS NOT NULL THEN 'completed'
        WHEN competitors_selected IS NOT NULL THEN 'competitors_analyzed'
        WHEN competitors_10 IS NOT NULL THEN 'competitors_found'
        WHEN brand_data IS NOT NULL THEN 'brand_analyzed'
        ELSE 'started'
    END as pipeline_stage,
    CASE 
        WHEN expires_at < CURRENT_TIMESTAMP THEN true
        ELSE false
    END as is_expired
FROM runs
WHERE status = 'active';

-- View for cache statistics
CREATE OR REPLACE VIEW cache_statistics AS
SELECT 
    COUNT(*) as total_entries,
    COUNT(CASE WHEN expires_at > CURRENT_TIMESTAMP THEN 1 END) as valid_entries,
    COUNT(CASE WHEN expires_at <= CURRENT_TIMESTAMP THEN 1 END) as expired_entries,
    SUM(page_count) as total_pages_cached,
    SUM(total_tokens) as total_tokens_cached,
    SUM(access_count) as total_accesses,
    AVG(page_count) as avg_pages_per_entry,
    MAX(scraped_at) as last_scrape,
    pg_size_pretty(pg_total_relation_size('scraping_cache')) as table_size
FROM scraping_cache;

-- View for API performance metrics (last 24 hours)
CREATE OR REPLACE VIEW api_performance_24h AS
SELECT 
    endpoint,
    method,
    COUNT(*) as request_count,
    AVG(duration_ms) as avg_duration_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) as p50_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) as p99_duration_ms,
    MIN(duration_ms) as min_duration_ms,
    MAX(duration_ms) as max_duration_ms,
    AVG(tokens_used) as avg_tokens,
    SUM(tokens_used) as total_tokens,
    COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) as success_count,
    COUNT(CASE WHEN status_code >= 400 AND status_code < 500 THEN 1 END) as client_error_count,
    COUNT(CASE WHEN status_code >= 500 THEN 1 END) as server_error_count
FROM api_metrics
WHERE timestamp > CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY endpoint, method
ORDER BY request_count DESC;

-- ============================================================================
-- INITIAL DATA / CONFIGURATION
-- ============================================================================

-- Create a test run (optional, can be removed)
-- INSERT INTO runs (brand_data) VALUES ('{"name": "Test Brand", "domain": "test.com"}'::JSONB);

-- ============================================================================
-- PERMISSIONS (adjust based on your security needs)
-- ============================================================================

-- Grant permissions to brand_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO brand_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO brand_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO brand_user;

-- ============================================================================
-- MAINTENANCE TASKS
-- ============================================================================

-- Schedule cleanup (example using pg_cron extension - requires installation)
-- SELECT cron.schedule('cleanup-expired-data', '0 2 * * *', 'SELECT cleanup_expired_data()');

-- Analyze tables for better query planning
ANALYZE runs;
ANALYZE scraping_cache;
ANALYZE api_metrics;

-- Vacuum to reclaim space
VACUUM ANALYZE runs;
VACUUM ANALYZE scraping_cache;
VACUUM ANALYZE api_metrics;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify indexes created
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Verify views created
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check database size
SELECT 
    pg_database.datname as database_name,
    pg_size_pretty(pg_database_size(pg_database.datname)) as size
FROM pg_database
WHERE datname = current_database();

-- Migration complete message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Database schema migration completed successfully!';
    RAISE NOTICE '📊 Tables: runs, scraping_cache, api_metrics';
    RAISE NOTICE '👁️  Views: active_runs_summary, cache_statistics, api_performance_24h';
    RAISE NOTICE '🔧 Functions: cleanup_expired_data(), update_updated_at_column()';
END $$;
