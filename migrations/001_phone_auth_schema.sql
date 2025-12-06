-- Migration: Phone OTP Authentication Schema
-- Description: Adds phone authentication support without affecting existing users
-- Date: 2025-01-XX

-- ============================================
-- 1. Update users table for phone auth
-- ============================================

-- Add phone authentication columns (all nullable/optional for backward compatibility)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS country_code VARCHAR(5),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auth_method VARCHAR(20) DEFAULT 'email_password' CHECK (auth_method IN ('email_password', 'phone_otp', 'both'));

-- Create index for phone lookups (for OTP flow)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(country_code, phone_number) 
WHERE phone_number IS NOT NULL;

-- Create unique constraint on phone (country_code + phone_number combination)
-- Only enforce uniqueness when phone_number is not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique 
ON users(country_code, phone_number) 
WHERE phone_number IS NOT NULL;

-- Update existing users to have email_verified = true if they have email
UPDATE users 
SET email_verified = TRUE 
WHERE email IS NOT NULL AND email_verified IS NULL;

-- ============================================
-- 2. Create OTP codes table
-- ============================================

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) NOT NULL,
  country_code VARCHAR(5) NOT NULL,
  email VARCHAR(255),
  code VARCHAR(6) NOT NULL,
  purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('login', 'signup', 'verify_phone', 'verify_email')),
  expires_at TIMESTAMP NOT NULL,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 5,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  ip_address VARCHAR(45), -- IPv6 support
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT otp_expires_check CHECK (expires_at > created_at)
);

-- Indexes for OTP lookups
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(country_code, phone_number, purpose, verified);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email, purpose, verified) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes(expires_at) WHERE verified = FALSE;

-- Auto-cleanup expired OTPs (runs every hour via cron or Lambda)
-- This index helps with cleanup queries
CREATE INDEX IF NOT EXISTS idx_otp_cleanup ON otp_codes(created_at) WHERE expires_at < NOW();

-- ============================================
-- 3. Create profile tables for onboarding
-- ============================================

-- Account Details (extends users table, but separate for flexibility)
CREATE TABLE IF NOT EXISTS account_details (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  profile_photo_url TEXT,
  about_me TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Brand Details
CREATE TABLE IF NOT EXISTS brand_details (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255),
  contact_person VARCHAR(255),
  contact_number VARCHAR(20),
  contact_email VARCHAR(255),
  organisation_website VARCHAR(500),
  google_business_profile_id VARCHAR(255),
  google_business_profile_url TEXT,
  logo_url TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Business Details
CREATE TABLE IF NOT EXISTS business_details (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  product_sold VARCHAR(100),
  company_incorporation_year INTEGER,
  city VARCHAR(100),
  number_of_employees INTEGER,
  customer_acquisition JSONB DEFAULT '[]', -- Array of strings: ['Facebook', 'Google Ads', 'Word of mouth']
  international_destinations JSONB DEFAULT '[]', -- Array of destination names
  domestic_destinations JSONB DEFAULT '[]', -- Array of destination names
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('aadhar_card', 'pan_card', 'incorporation_certificate', 'owner_pan_card', 'business_license', 'other')),
  document_name VARCHAR(255) NOT NULL,
  s3_key TEXT NOT NULL, -- S3 object key
  s3_url TEXT, -- Pre-signed URL (temporary, not stored long-term)
  file_size BIGINT, -- Bytes
  mime_type VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES users(id), -- Admin who reviewed
  reviewed_at TIMESTAMP,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(user_id, document_type);

-- ============================================
-- 4. Profile completion tracking
-- ============================================

-- Add profile completion percentage to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100);

-- Add onboarding status
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- ============================================
-- 5. Rate limiting for OTP requests
-- ============================================

CREATE TABLE IF NOT EXISTS otp_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(255) NOT NULL, -- phone_number, email, or ip_address
  identifier_type VARCHAR(20) NOT NULL CHECK (identifier_type IN ('phone', 'email', 'ip')),
  request_count INT DEFAULT 1,
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(identifier, identifier_type, window_start)
);

-- Index for rate limit lookups
CREATE INDEX IF NOT EXISTS idx_otp_rate_limits ON otp_rate_limits(identifier, identifier_type, window_end);

-- ============================================
-- 6. Helper functions
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_account_details_updated_at ON account_details;
CREATE TRIGGER update_account_details_updated_at 
  BEFORE UPDATE ON account_details 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brand_details_updated_at ON brand_details;
CREATE TRIGGER update_brand_details_updated_at 
  BEFORE UPDATE ON brand_details 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_details_updated_at ON business_details;
CREATE TRIGGER update_business_details_updated_at 
  BEFORE UPDATE ON business_details 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON documents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  completion_score INTEGER := 0;
  total_fields INTEGER := 0;
BEGIN
  -- Account details (25%)
  total_fields := total_fields + 4;
  IF EXISTS (SELECT 1 FROM account_details WHERE user_id = user_uuid AND first_name IS NOT NULL) THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM account_details WHERE user_id = user_uuid AND last_name IS NOT NULL) THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM account_details WHERE user_id = user_uuid AND profile_photo_url IS NOT NULL) THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM account_details WHERE user_id = user_uuid AND about_me IS NOT NULL) THEN completion_score := completion_score + 1; END IF;

  -- Brand details (25%)
  total_fields := total_fields + 4;
  IF EXISTS (SELECT 1 FROM brand_details WHERE user_id = user_uuid AND company_name IS NOT NULL) THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM brand_details WHERE user_id = user_uuid AND contact_person IS NOT NULL) THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM brand_details WHERE user_id = user_uuid AND contact_email IS NOT NULL) THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM brand_details WHERE user_id = user_uuid AND logo_url IS NOT NULL) THEN completion_score := completion_score + 1; END IF;

  -- Business details (25%)
  total_fields := total_fields + 4;
  IF EXISTS (SELECT 1 FROM business_details WHERE user_id = user_uuid AND product_sold IS NOT NULL) THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM business_details WHERE user_id = user_uuid AND city IS NOT NULL) THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM business_details WHERE user_id = user_uuid AND jsonb_array_length(COALESCE(international_destinations, '[]'::jsonb)) > 0) THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM business_details WHERE user_id = user_uuid AND company_incorporation_year IS NOT NULL) THEN completion_score := completion_score + 1; END IF;

  -- Documents (25%)
  total_fields := total_fields + 4;
  IF EXISTS (SELECT 1 FROM documents WHERE user_id = user_uuid AND document_type = 'aadhar_card' AND status = 'approved') THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM documents WHERE user_id = user_uuid AND document_type = 'pan_card' AND status = 'approved') THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM documents WHERE user_id = user_uuid AND document_type = 'incorporation_certificate' AND status = 'approved') THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM documents WHERE user_id = user_uuid AND document_type = 'owner_pan_card' AND status = 'approved') THEN completion_score := completion_score + 1; END IF;

  RETURN (completion_score * 100 / total_fields);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Comments for documentation
-- ============================================

COMMENT ON TABLE otp_codes IS 'Stores OTP codes for phone/email verification with expiration and attempt tracking';
COMMENT ON TABLE account_details IS 'User account details (name, photo, about) for profile setup';
COMMENT ON TABLE brand_details IS 'Company/brand information for travel agents';
COMMENT ON TABLE business_details IS 'Business operational details (destinations, employees, etc.)';
COMMENT ON TABLE documents IS 'KYC documents uploaded by users with approval workflow';
COMMENT ON TABLE otp_rate_limits IS 'Rate limiting for OTP requests to prevent abuse';
