/**
 * Lambda Function to Execute Database Migration
 * Deploy this to run the migration
 */

const { Pool } = require('pg');

exports.handler = async (event) => {
  console.log('🚀 Starting database migration...');

  const pool = new Pool({
    host: process.env.RDS_HOSTNAME || process.env.RDS_HOST,
    port: parseInt(process.env.RDS_PORT || '5432'),
    database: process.env.RDS_DATABASE || process.env.RDS_DB || 'postgres',
    user: process.env.RDS_USERNAME || process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    ssl: { rejectUnauthorized: false },
  });

  const migrationSQL = `
-- Migration: Phone OTP Authentication Schema
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS country_code VARCHAR(5),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auth_method VARCHAR(20) DEFAULT 'email_password' CHECK (auth_method IN ('email_password', 'phone_otp', 'both'));

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(country_code, phone_number) WHERE phone_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique ON users(country_code, phone_number) WHERE phone_number IS NOT NULL;

UPDATE users SET email_verified = TRUE WHERE email IS NOT NULL AND email_verified IS NULL;

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
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT otp_expires_check CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(country_code, phone_number, purpose, verified);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email, purpose, verified) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes(expires_at) WHERE verified = FALSE;
CREATE INDEX IF NOT EXISTS idx_otp_cleanup ON otp_codes(created_at) WHERE expires_at < NOW();

CREATE TABLE IF NOT EXISTS account_details (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  profile_photo_url TEXT,
  about_me TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS business_details (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  product_sold VARCHAR(100),
  company_incorporation_year INTEGER,
  city VARCHAR(100),
  number_of_employees INTEGER,
  customer_acquisition JSONB DEFAULT '[]',
  international_destinations JSONB DEFAULT '[]',
  domestic_destinations JSONB DEFAULT '[]',
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('aadhar_card', 'pan_card', 'incorporation_certificate', 'owner_pan_card', 'business_license', 'other')),
  document_name VARCHAR(255) NOT NULL,
  s3_key TEXT NOT NULL,
  s3_url TEXT,
  file_size BIGINT,
  mime_type VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(user_id, document_type);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100),
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS otp_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(255) NOT NULL,
  identifier_type VARCHAR(20) NOT NULL CHECK (identifier_type IN ('phone', 'email', 'ip')),
  request_count INT DEFAULT 1,
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(identifier, identifier_type, window_start)
);

CREATE INDEX IF NOT EXISTS idx_otp_rate_limits ON otp_rate_limits(identifier, identifier_type, window_end);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_account_details_updated_at ON account_details;
CREATE TRIGGER update_account_details_updated_at BEFORE UPDATE ON account_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brand_details_updated_at ON brand_details;
CREATE TRIGGER update_brand_details_updated_at BEFORE UPDATE ON brand_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_details_updated_at ON business_details;
CREATE TRIGGER update_business_details_updated_at BEFORE UPDATE ON business_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION calculate_profile_completion(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  completion_score INTEGER := 0;
  total_fields INTEGER := 0;
BEGIN
  total_fields := total_fields + 4;
  IF EXISTS (SELECT 1 FROM account_details WHERE user_id = user_uuid AND first_name IS NOT NULL) THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM account_details WHERE user_id = user_uuid AND last_name IS NOT NULL) THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM account_details WHERE user_id = user_uuid AND profile_photo_url IS NOT NULL) THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM account_details WHERE user_id = user_uuid AND about_me IS NOT NULL) THEN completion_score := completion_score + 1; END IF;
  total_fields := total_fields + 4;
  IF EXISTS (SELECT 1 FROM brand_details WHERE user_id = user_uuid AND company_name IS NOT NULL) THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM brand_details WHERE user_id = user_uuid AND contact_person IS NOT NULL) THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM brand_details WHERE user_id = user_uuid AND contact_email IS NOT NULL) THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM brand_details WHERE user_id = user_uuid AND logo_url IS NOT NULL) THEN completion_score := completion_score + 1; END IF;
  total_fields := total_fields + 4;
  IF EXISTS (SELECT 1 FROM business_details WHERE user_id = user_uuid AND product_sold IS NOT NULL) THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM business_details WHERE user_id = user_uuid AND city IS NOT NULL) THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM business_details WHERE user_id = user_uuid AND jsonb_array_length(COALESCE(international_destinations, '[]'::jsonb)) > 0) THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM business_details WHERE user_id = user_uuid AND company_incorporation_year IS NOT NULL) THEN completion_score := completion_score + 1; END IF;
  total_fields := total_fields + 4;
  IF EXISTS (SELECT 1 FROM documents WHERE user_id = user_uuid AND document_type = 'aadhar_card' AND status = 'approved') THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM documents WHERE user_id = user_uuid AND document_type = 'pan_card' AND status = 'approved') THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM documents WHERE user_id = user_uuid AND document_type = 'incorporation_certificate' AND status = 'approved') THEN completion_score := completion_score + 1; END IF;
  IF EXISTS (SELECT 1 FROM documents WHERE user_id = user_uuid AND document_type = 'owner_pan_card' AND status = 'approved') THEN completion_score := completion_score + 1; END IF;
  RETURN (completion_score * 100 / total_fields);
END;
$$ LANGUAGE plpgsql;
`;

  try {
    const statements = migrationSQL.split(';').filter(s => s.trim().length > 10);
    let success = 0;
    let errors = 0;

    for (const stmt of statements) {
      try {
        await pool.query(stmt);
        success++;
      } catch (err) {
        if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
          console.error('Error:', err.message);
          errors++;
        } else {
          success++;
        }
      }
    }

    // Verify
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('otp_codes', 'account_details', 'brand_details', 'business_details', 'documents', 'otp_rate_limits')
      ORDER BY table_name;
    `);

    await pool.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: errors === 0,
        message: 'Migration completed',
        tablesCreated: result.rows.map(r => r.table_name),
        summary: { successful: success, errors }
      })
    };
  } catch (error) {
    await pool.end();
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

