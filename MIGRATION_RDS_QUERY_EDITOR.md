# Database Migration Using AWS RDS Query Editor

AWS RDS Query Editor is built into the AWS Console and doesn't require any external tools or connection setup.

## Step 1: Access RDS Query Editor

1. Go to [AWS RDS Console](https://console.aws.amazon.com/rds/)
2. Click on your RDS instance: `travel-app-db`
3. In the **Connectivity & security** tab, find **Query Editor**
4. Click **Open query editor**

## Step 2: Connect to Database

1. In the Query Editor, you'll see connection settings
2. Select your database: `postgres`
3. Enter credentials:
   - **Database username**: `postgres`
   - **Database password**: `ju3vrLHJUW8PqDG4`
4. Click **Connect**

## Step 3: Prepare the Migration SQL

The migration file (`migrations/001_phone_auth_schema.sql`) is quite large. RDS Query Editor works best with smaller chunks.

### Option A: Copy Entire File (Recommended)

1. Open `migrations/001_phone_auth_schema.sql` in a text editor
2. Copy the entire contents (Ctrl+A, Ctrl+C)
3. Paste into the Query Editor
4. Click **Run** (or press F5)

**Note:** If you get an error about statement limits, use Option B below.

### Option B: Run in Sections (If Option A Fails)

Run the migration in these sections:

#### Section 1: Users Table Updates
```sql
-- Add phone authentication columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS country_code VARCHAR(5),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auth_method VARCHAR(20) DEFAULT 'email_password' CHECK (auth_method IN ('email_password', 'phone_otp', 'both'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(country_code, phone_number) 
WHERE phone_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique 
ON users(country_code, phone_number) 
WHERE phone_number IS NOT NULL;

-- Update existing users
UPDATE users 
SET email_verified = TRUE 
WHERE email IS NOT NULL AND email_verified IS NULL;
```

#### Section 2: OTP Codes Table
```sql
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
```

#### Section 3: Profile Tables
```sql
-- Account Details
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
  customer_acquisition JSONB DEFAULT '[]',
  international_destinations JSONB DEFAULT '[]',
  domestic_destinations JSONB DEFAULT '[]',
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Documents
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
```

#### Section 4: Profile Completion & Rate Limiting
```sql
-- Add profile completion columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100),
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Rate limiting table
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
```

#### Section 5: Functions and Triggers
```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
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
```

#### Section 6: Profile Completion Function
```sql
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
```

## Step 4: Verify Migration

After running all sections, verify with these queries:

```sql
-- Check users table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('country_code', 'phone_number', 'phone_verified', 'email_verified', 'auth_method', 'profile_completion_percentage', 'onboarding_completed')
ORDER BY column_name;

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('otp_codes', 'account_details', 'brand_details', 'business_details', 'documents', 'otp_rate_limits')
ORDER BY table_name;

-- Check functions exist
SELECT proname 
FROM pg_proc 
WHERE proname IN ('calculate_profile_completion', 'update_updated_at_column');
```

## Troubleshooting

### Error: "Statement limit exceeded"
- RDS Query Editor has limits on statement size
- Solution: Use Option B (run in sections) instead of pasting the entire file

### Error: "Function already exists"
- This is normal if you've run parts of the migration before
- The migration uses `IF NOT EXISTS` and `CREATE OR REPLACE`, so it's safe

### Error: "Permission denied"
- Your database user needs CREATE TABLE, ALTER TABLE, CREATE FUNCTION permissions
- Contact your database administrator

## Tips

1. **Save your work**: RDS Query Editor has a save feature - use it to save each section
2. **Check results**: After each section, review the results tab for any errors
3. **Run in order**: Execute sections 1-6 in order for best results
4. **Verify after each section**: Run the verification queries after completing all sections

## After Migration

Once verified:

1. ✅ All tables and columns created
2. ✅ Configure AWS services (SNS, SES, S3, reCAPTCHA)
3. ✅ Add environment variables from `.env.example.phone-auth`
4. ✅ Test the phone login/signup flow

---

**That's it!** RDS Query Editor is convenient since it's already in AWS and doesn't require any connection setup.

