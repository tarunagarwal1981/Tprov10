# AWS Migration Strategy - Travel Agent Dashboard Implementation

## 🎯 Current Situation

- **Tour Operator System**: Running on Supabase (PostgreSQL + Auth)
- **New Feature**: Travel Agent Dashboard (to be implemented)
- **Goal**: Eventually migrate everything from Supabase to AWS

---

## 📊 Strategic Options Analysis

### Option 1: Hybrid Approach (RECOMMENDED ✅)

**Strategy**: Build Travel Agent Dashboard in AWS while keeping Tour Operator in Supabase, with a unified API layer.

#### Architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│           Unified API Layer (Next.js API Routes)        │
│  - /api/operators/* → Supabase                          │
│  - /api/agents/* → AWS RDS                              │
│  - /api/bookings/* → Cross-system queries                │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌──────────────┐               ┌──────────────┐
│   Supabase   │               │     AWS      │
│              │               │              │
│ - Operators  │               │ - Agents     │
│ - Packages   │               │ - Agent DB   │
│ - Auth       │               │ - Cognito    │
└──────────────┘               └──────────────┘
```

#### Implementation Steps:

1. **Setup AWS Infrastructure** (Week 1)
   - AWS RDS PostgreSQL for Travel Agent database
   - AWS Cognito for Travel Agent authentication
   - AWS S3 for file storage
   - AWS Lambda for serverless functions (optional)

2. **Create Unified API Layer** (Week 2)
   - Create abstraction layer in Next.js API routes
   - Implement data source routing logic
   - Cross-system query handlers

3. **Build Travel Agent Dashboard** (Week 3+)
   - Use AWS RDS for agent data
   - Use AWS Cognito for agent auth
   - All new features in AWS

4. **Gradual Migration** (Ongoing)
   - Migrate tour operator tables one by one
   - Migrate authentication last
   - Test thoroughly at each step

#### Pros:
- ✅ Can start immediately without touching existing system
- ✅ Clean separation between old and new systems
- ✅ Gradual migration reduces risk
- ✅ Learn AWS incrementally
- ✅ Unified API hides complexity from frontend

#### Cons:
- ⚠️ Need to maintain two databases temporarily
- ⚠️ Cross-system queries require API layer logic
- ⚠️ More complex initially

---

### Option 2: Complete AWS Migration First (NOT RECOMMENDED ⚠️)

**Strategy**: Migrate everything to AWS before building Travel Agent Dashboard.

#### Pros:
- ✅ Single system, no complexity
- ✅ No data silos

#### Cons:
- ❌ High risk - existing system downtime
- ❌ Long migration time before new features
- ❌ All-or-nothing approach
- ❌ Cannot start new development

**Verdict**: Too risky for active development.

---

### Option 3: Keep Supabase for Everything (ALTERNATIVE ✅)

**Strategy**: Build Travel Agent Dashboard in Supabase, migrate everything to AWS later.

#### Pros:
- ✅ Fastest to implement
- ✅ No infrastructure complexity
- ✅ Same authentication system
- ✅ Easy cross-system queries

#### Cons:
- ⚠️ Still need to migrate later
- ⚠️ Learn AWS migration anyway

**Verdict**: Good if you want to ship fast, but you'll still do the migration later.

---

## 🏆 RECOMMENDED APPROACH: Option 1 (Hybrid with Unified API)

### Phase 1: Setup AWS for Travel Agent (Week 1-2)

#### AWS Services Needed:

1. **AWS RDS PostgreSQL**
   - Database: `travel_agent_db`
   - Instance: `db.t3.micro` (for dev) or `db.t3.small` (for prod)
   - Multi-AZ: No for dev, Yes for prod

2. **AWS Cognito**
   - User Pool: `travel-agents-pool`
   - Authentication for travel agents

3. **AWS S3**
   - Bucket: `travel-agent-uploads`
   - For file storage (agent documents, etc.)

4. **AWS Secrets Manager** (optional but recommended)
   - Store database credentials securely

#### Migration Files Structure:

```
project-root/
├── supabase/
│   └── migrations/          # Tour Operator migrations (Supabase)
├── aws/
│   ├── migrations/          # Travel Agent migrations (AWS RDS)
│   │   └── 001_create_agent_tables.sql
│   ├── infrastructure/      # Infrastructure as Code (optional)
│   │   ├── rds.tf          # Terraform for RDS
│   │   ├── cognito.tf      # Terraform for Cognito
│   │   └── s3.tf           # Terraform for S3
│   └── scripts/
│       └── setup.sh        # Setup script
└── src/
    └── lib/
        ├── supabase.ts     # Supabase client (existing)
        ├── aws-rds.ts      # AWS RDS client (new)
        └── aws-cognito.ts  # AWS Cognito client (new)
```

---

### Phase 2: Create Unified API Layer (Week 2-3)

#### API Routing Strategy:

```typescript
// src/app/api/agents/route.ts
export async function GET(request: NextRequest) {
  // Route to AWS RDS
  const db = await getAwsRdsConnection();
  // ... query agent data
}

// src/app/api/operators/route.ts
export async function GET(request: NextRequest) {
  // Route to Supabase
  const supabase = getSupabaseAdmin();
  // ... query operator data
}

// src/app/api/bookings/route.ts
export async function GET(request: NextRequest) {
  // Cross-system query
  const agentData = await getAwsRdsConnection().query(...);
  const packageData = await getSupabaseAdmin().from('packages').select(...);
  // Merge and return
}
```

#### Benefits:
- Frontend doesn't need to know about multiple databases
- Easy to migrate data later (change one API route)
- Consistent error handling
- Single authentication middleware

---

### Phase 3: Build Travel Agent Dashboard (Week 3+)

- All new features use AWS
- No impact on existing Supabase system
- Can develop in parallel with migration

---

### Phase 4: Gradual Migration (Ongoing, as time permits)

#### Migration Order (Recommended):

1. **Low-Risk Tables First** (Week 4-6)
   - `multi_city_hotel_package_addons` → AWS
   - `multi_city_hotel_package_exclusions` → AWS
   - Test thoroughly

2. **Medium-Risk Tables** (Week 7-10)
   - `multi_city_hotel_packages` → AWS
   - `multi_city_hotel_package_cities` → AWS
   - Update API routes to point to AWS

3. **High-Risk Tables** (Week 11-14)
   - `users` table → AWS
   - Authentication migration (Supabase Auth → Cognito)
   - **This is the riskiest part - do it last**

4. **Cleanup** (Week 15+)
   - Remove Supabase dependencies
   - Update all API routes
   - Archive Supabase project

---

## 📝 Implementation Checklist

### Week 1: AWS Setup
- [ ] Create AWS account (if not exists)
- [ ] Setup AWS RDS PostgreSQL instance
- [ ] Setup AWS Cognito User Pool
- [ ] Setup AWS S3 bucket
- [ ] Create database migration files for travel agent tables
- [ ] Test database connection from local machine

### Week 2: API Layer
- [ ] Create AWS RDS client library
- [ ] Create AWS Cognito client library
- [ ] Create unified API routing layer
- [ ] Implement authentication middleware (handles both Supabase + Cognito)
- [ ] Create travel agent API routes
- [ ] Test API routes

### Week 3: Frontend Integration
- [ ] Build travel agent dashboard UI
- [ ] Integrate with AWS Cognito auth
- [ ] Connect to travel agent API routes
- [ ] Test end-to-end flow

### Week 4+: Gradual Migration
- [ ] Migrate one table at a time
- [ ] Update API routes after each migration
- [ ] Test thoroughly before next migration
- [ ] Keep Supabase as backup

---

## 💰 Cost Considerations

### AWS vs Supabase

**Supabase (Current):**
- Free tier: $0/month (limited)
- Pro tier: $25/month
- Simpler setup
- Managed PostgreSQL + Auth

**AWS (Future):**
- RDS PostgreSQL: ~$15-30/month (t3.micro/small)
- Cognito: $0.0055 per MAU (Monthly Active User)
- S3: ~$1-5/month (depends on storage)
- More control, more setup required

**Verdict**: Costs are similar. AWS gives more control but requires more setup.

---

## ⚠️ Important Considerations

### 1. **Data Synchronization**
If travel agents need to access tour operator packages:
- Option A: API layer queries both databases
- Option B: Replicate critical data (adds complexity)
- Option C: Migrate package tables early

**Recommendation**: Option A (API layer) is cleanest.

### 2. **Authentication Complexity**
You'll have two auth systems temporarily:
- Supabase Auth for tour operators
- AWS Cognito for travel agents

**Solution**: Create unified auth wrapper:
```typescript
// Unified auth check
const user = await getAuthenticatedUser(request);
if (user.source === 'supabase') { /* operator */ }
if (user.source === 'cognito') { /* agent */ }
```

### 3. **Database Connection Pooling**
You'll need connection pools for both databases:
- Supabase: Handled by Supabase client
- AWS RDS: Use `pg` library with connection pooling

---

## 🚀 Quick Start Guide

### Step 1: Setup AWS RDS (Travel Agent Database)

```bash
# 1. Create RDS instance via AWS Console or CLI
aws rds create-db-instance \
  --db-instance-identifier travel-agent-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourPassword123! \
  --allocated-storage 20

# 2. Get connection endpoint (save this!)
# Example: travel-agent-db.xxxxx.us-east-1.rds.amazonaws.com:5432

# 3. Create database migration file
# aws/migrations/001_create_agent_tables.sql
```

### Step 2: Install AWS SDK

```bash
npm install @aws-sdk/client-rds @aws-sdk/client-cognito-identity-provider
npm install pg  # PostgreSQL client for Node.js
```

### Step 3: Create AWS Client Library

```typescript
// src/lib/aws-rds.ts
import { Pool } from 'pg';

let pool: Pool | null = null;

export function getAwsRdsConnection() {
  if (!pool) {
    pool = new Pool({
      host: process.env.AWS_RDS_HOST,
      port: parseInt(process.env.AWS_RDS_PORT || '5432'),
      database: process.env.AWS_RDS_DATABASE,
      user: process.env.AWS_RDS_USER,
      password: process.env.AWS_RDS_PASSWORD,
      ssl: { rejectUnauthorized: false }, // Required for RDS
    });
  }
  return pool;
}
```

### Step 4: Add Environment Variables

```env
# .env.local
# Existing Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# New AWS RDS
AWS_RDS_HOST=travel-agent-db.xxxxx.us-east-1.rds.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_DATABASE=travel_agent_db
AWS_RDS_USER=admin
AWS_RDS_PASSWORD=YourPassword123!

# AWS Cognito (add later)
AWS_COGNITO_USER_POOL_ID=...
AWS_COGNITO_CLIENT_ID=...
```

### Step 5: Create First Travel Agent API Route

```typescript
// src/app/api/agents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAwsRdsConnection } from '@/lib/aws-rds';

export async function GET(request: NextRequest) {
  try {
    const db = getAwsRdsConnection();
    const result = await db.query('SELECT * FROM travel_agents');
    return NextResponse.json({ agents: result.rows });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}
```

---

## 📚 Migration Best Practices

1. **Test in Staging First**
   - Never migrate production data directly
   - Create staging RDS instance
   - Test full migration process

2. **Backup Before Migration**
   - Export Supabase data
   - Create RDS snapshot before migration
   - Keep backups for 30 days

3. **Zero-Downtime Migration**
   - Write to both databases temporarily
   - Read from Supabase (old)
   - Sync data to AWS (new)
   - Switch reads to AWS when ready
   - Remove Supabase writes

4. **Rollback Plan**
   - Keep Supabase active during migration
   - If issues, switch back to Supabase
   - Don't delete Supabase until 100% confident

---

## ✅ Final Recommendation

**Your Plan is GOOD**, with these improvements:

1. ✅ **Build Travel Agent Dashboard in AWS** - Yes, do this!
2. ✅ **Keep Tour Operator in Supabase** - Yes, for now!
3. ✅ **Create Unified API Layer** - This is the key improvement!
4. ✅ **Migrate Gradually** - Perfect approach!

**Additional Recommendations:**

1. **Create migration scripts** for each table (helps with gradual migration)
2. **Use infrastructure as code** (Terraform/CloudFormation) for AWS setup
3. **Document API contracts** so frontend knows what to expect
4. **Set up monitoring** for both databases
5. **Create automated tests** that work with both systems

---

## 🎯 Next Steps

1. **Decide on approach** (Option 1 recommended)
2. **Setup AWS account** if not exists
3. **Create RDS instance** for travel agent database
4. **Write first migration** for travel agent tables
5. **Build API layer** to route to correct database
6. **Start building** travel agent dashboard

Would you like me to:
- Create the AWS RDS setup scripts?
- Create the unified API layer structure?
- Create sample travel agent database migration?
- Set up AWS Cognito authentication?

Let me know what you'd like to tackle first! 🚀

