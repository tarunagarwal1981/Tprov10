-- ============================================================================
-- PAYMENT INFRASTRUCTURE MIGRATION
-- ============================================================================
-- This migration creates all tables needed for payment processing
-- WITHOUT requiring payment gateway integration
-- Payment gateway integration can be added later
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PAYMENTS TABLE
-- ============================================================================
-- Tracks all payment attempts and their states
-- Payment gateway integration will update this table via webhooks

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    purchase_id UUID NOT NULL REFERENCES lead_purchases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Payment Information
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Payment Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded')),
    
    -- Payment Gateway Information (placeholder for future integration)
    payment_method VARCHAR(50), -- 'stripe', 'paypal', 'razorpay', etc.
    payment_intent_id VARCHAR(255), -- Gateway payment ID (will be set by gateway)
    gateway_response JSONB, -- Full gateway response (for debugging/audit)
    
    -- Error Handling
    failure_reason TEXT,
    failure_code VARCHAR(50),
    
    -- Idempotency
    idempotency_key VARCHAR(255) UNIQUE,
    
    -- Fraud Prevention
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_purchase_id ON payments(purchase_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_idempotency_key ON payments(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_payment_intent_id ON payments(payment_intent_id) WHERE payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_pending ON payments(status) WHERE status IN ('pending', 'processing');

-- ============================================================================
-- 2. PAYMENT IDEMPOTENCY TABLE
-- ============================================================================
-- Prevents duplicate payment processing
-- Used to ensure same request returns same result

CREATE TABLE IF NOT EXISTS payment_idempotency (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Idempotency Key (unique constraint ensures no duplicates)
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    
    -- Related Payment
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    
    -- Request Information
    request_hash VARCHAR(255), -- Hash of request body for validation
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Response Information
    response_status VARCHAR(20) NOT NULL, -- 'pending', 'completed', 'failed'
    response_data JSONB, -- Cached response for duplicate requests
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Idempotency keys expire after 24 hours
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for idempotency table
CREATE INDEX IF NOT EXISTS idx_payment_idempotency_key ON payment_idempotency(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_payment_idempotency_user_id ON payment_idempotency(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_idempotency_expires ON payment_idempotency(expires_at) WHERE expires_at > NOW();
CREATE INDEX IF NOT EXISTS idx_payment_idempotency_payment_id ON payment_idempotency(payment_id) WHERE payment_id IS NOT NULL;

-- ============================================================================
-- 3. FRAUD PREVENTION LOGS TABLE
-- ============================================================================
-- Tracks suspicious activity and fraud prevention checks

CREATE TABLE IF NOT EXISTS fraud_prevention_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User Information
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Request Information
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    
    -- Fraud Check Information
    check_type VARCHAR(50) NOT NULL, -- 'velocity', 'amount', 'ip_reputation', 'device_fingerprint'
    check_result VARCHAR(20) NOT NULL, -- 'passed', 'failed', 'flagged'
    risk_score DECIMAL(5,2) CHECK (risk_score >= 0 AND risk_score <= 100),
    
    -- Details
    details JSONB DEFAULT '{}'::jsonb,
    reason TEXT,
    
    -- Related Payment
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fraud prevention logs
CREATE INDEX IF NOT EXISTS idx_fraud_logs_user_id ON fraud_prevention_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_payment_id ON fraud_prevention_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_check_type ON fraud_prevention_logs(check_type);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_check_result ON fraud_prevention_logs(check_result);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_created_at ON fraud_prevention_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_risk_score ON fraud_prevention_logs(risk_score DESC) WHERE risk_score > 50;

-- ============================================================================
-- 4. TERMS ACCEPTANCE TABLE
-- ============================================================================
-- Tracks when users accept Terms of Service and Privacy Policy

CREATE TABLE IF NOT EXISTS terms_acceptance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User Information
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Terms Information
    terms_version VARCHAR(20) NOT NULL, -- e.g., '1.0', '2.0'
    terms_type VARCHAR(50) NOT NULL DEFAULT 'terms_of_service' 
        CHECK (terms_type IN ('terms_of_service', 'privacy_policy', 'refund_policy')),
    
    -- Acceptance Information
    accepted BOOLEAN NOT NULL DEFAULT TRUE,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one acceptance record per user per version per type
    UNIQUE(user_id, terms_version, terms_type)
);

-- Indexes for terms acceptance
CREATE INDEX IF NOT EXISTS idx_terms_acceptance_user_id ON terms_acceptance(user_id);
CREATE INDEX IF NOT EXISTS idx_terms_acceptance_type ON terms_acceptance(terms_type);
CREATE INDEX IF NOT EXISTS idx_terms_acceptance_version ON terms_acceptance(terms_version);
CREATE INDEX IF NOT EXISTS idx_terms_acceptance_accepted ON terms_acceptance(user_id, accepted) WHERE accepted = TRUE;

-- ============================================================================
-- 5. REFUND POLICIES TABLE
-- ============================================================================
-- Stores refund policy rules and configurations

CREATE TABLE IF NOT EXISTS refund_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Policy Information
    policy_name VARCHAR(255) NOT NULL,
    policy_version VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Refund Rules (stored as JSONB for flexibility)
    rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Example rules structure:
    -- {
    --   "refund_window_days": 7,
    --   "cancellation_fee_percentage": 10,
    --   "non_refundable_after_days": 3,
    --   "partial_refund_allowed": true
    -- }
    
    -- Description
    description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    effective_until TIMESTAMP WITH TIME ZONE,
    
    -- Ensure one active policy per version
    UNIQUE(policy_name, policy_version)
);

-- Indexes for refund policies
CREATE INDEX IF NOT EXISTS idx_refund_policies_active ON refund_policies(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_refund_policies_effective ON refund_policies(effective_from, effective_until);

-- ============================================================================
-- 6. PAYMENT METRICS TABLE
-- ============================================================================
-- Aggregated metrics for monitoring and analytics
-- Can be populated by scheduled jobs or real-time updates

CREATE TABLE IF NOT EXISTS payment_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Metric Information
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'daily', 'hourly', 'weekly', 'monthly'
    
    -- Aggregated Values
    total_payments INTEGER DEFAULT 0,
    successful_payments INTEGER DEFAULT 0,
    failed_payments INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    average_payment_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Status Breakdown
    status_breakdown JSONB DEFAULT '{}'::jsonb,
    -- Example: {"pending": 5, "completed": 100, "failed": 3}
    
    -- Payment Method Breakdown
    method_breakdown JSONB DEFAULT '{}'::jsonb,
    -- Example: {"stripe": 80, "paypal": 20}
    
    -- Fraud Metrics
    fraud_checks_performed INTEGER DEFAULT 0,
    fraud_checks_failed INTEGER DEFAULT 0,
    high_risk_payments INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one metric per date per type
    UNIQUE(metric_date, metric_type)
);

-- Indexes for payment metrics
CREATE INDEX IF NOT EXISTS idx_payment_metrics_date ON payment_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_payment_metrics_type ON payment_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_payment_metrics_date_type ON payment_metrics(metric_date DESC, metric_type);

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for payments table
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_updated_at();

-- Trigger for terms_acceptance table
DROP TRIGGER IF EXISTS update_terms_acceptance_updated_at ON terms_acceptance;
CREATE TRIGGER update_terms_acceptance_updated_at
    BEFORE UPDATE ON terms_acceptance
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_updated_at();

-- Trigger for refund_policies table
DROP TRIGGER IF EXISTS update_refund_policies_updated_at ON refund_policies;
CREATE TRIGGER update_refund_policies_updated_at
    BEFORE UPDATE ON refund_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_updated_at();

-- Trigger for payment_metrics table
DROP TRIGGER IF EXISTS update_payment_metrics_updated_at ON payment_metrics;
CREATE TRIGGER update_payment_metrics_updated_at
    BEFORE UPDATE ON payment_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_updated_at();

-- ============================================================================
-- 8. FUNCTIONS
-- ============================================================================

-- Function to automatically set completed_at when payment status changes to completed
CREATE OR REPLACE FUNCTION set_payment_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    END IF;
    
    IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
        NEW.failed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set completed_at
DROP TRIGGER IF EXISTS set_payment_completed_at_trigger ON payments;
CREATE TRIGGER set_payment_completed_at_trigger
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION set_payment_completed_at();

-- Function to clean up expired idempotency keys (can be called by scheduled job)
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM payment_idempotency
    WHERE expires_at < NOW() - INTERVAL '1 day';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. COMMENTS
-- ============================================================================

COMMENT ON TABLE payments IS 'Tracks all payment attempts and their states. Payment gateway integration will update this table via webhooks.';
COMMENT ON TABLE payment_idempotency IS 'Prevents duplicate payment processing. Ensures same request returns same result.';
COMMENT ON TABLE fraud_prevention_logs IS 'Tracks suspicious activity and fraud prevention checks for analysis.';
COMMENT ON TABLE terms_acceptance IS 'Tracks when users accept Terms of Service and Privacy Policy.';
COMMENT ON TABLE refund_policies IS 'Stores refund policy rules and configurations.';
COMMENT ON TABLE payment_metrics IS 'Aggregated metrics for monitoring and analytics. Populated by scheduled jobs or real-time updates.';

COMMENT ON COLUMN payments.payment_intent_id IS 'Gateway payment ID - will be set by payment gateway integration';
COMMENT ON COLUMN payments.gateway_response IS 'Full gateway response for debugging and audit purposes';
COMMENT ON COLUMN payments.idempotency_key IS 'Unique key to prevent duplicate payment processing';
COMMENT ON COLUMN payment_idempotency.expires_at IS 'Idempotency keys expire after 24 hours';

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
-- RLS disabled (not used in AWS RDS)
-- RLS disabled (not used in AWS RDS)
-- RLS disabled (not used in AWS RDS)
-- RLS disabled (not used in AWS RDS)
-- RLS disabled (not used in AWS RDS)
-- RLS disabled (not used in AWS RDS)

-- RLS Policies will be added in a separate migration file
-- to allow for proper testing and review

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
