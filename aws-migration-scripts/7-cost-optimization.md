# AWS Cost Optimization Guide
## Save 40-60% on Monthly AWS Bills

---

## 💰 Immediate Cost Savings (Week 1)

### 1. **Use AWS Free Tier**
**Savings: $50-100/month**

Free for first 12 months:
- RDS: 750 hours of db.t2.micro, db.t3.micro, or db.t4g.micro
- S3: 5 GB storage, 20,000 GET requests, 2,000 PUT requests
- Lambda: 1M requests/month, 400,000 GB-seconds compute
- CloudFront: 1 TB data transfer out
- Cognito: 50,000 MAU (monthly active users)

**Action:** Start with t4g.micro RDS instance, scale up as needed

---

### 2. **Reserved Instances (After 2-3 Months)**
**Savings: 30-40% on compute**

Once you confirm your usage pattern:
- RDS Reserved Instances: 1-year commitment = 30% savings
- 3-year commitment = 60% savings
- Payment options: All upfront (max savings), No upfront (flexibility)

**Example:**
- db.t4g.medium On-Demand: $92/month
- db.t4g.medium 1-year RI: $64/month (**Save $28/month**)
- db.t4g.medium 3-year RI: $37/month (**Save $55/month**)

---

### 3. **Aurora Serverless v2 (Variable Workload)**
**Savings: 50-70% during low traffic**

If your traffic varies significantly:
- Scales from 0.5 ACU to 16 ACU automatically
- Only pay for what you use
- 0.5 ACU = $0.12/hour = $43.80/month (minimum)
- 2 ACU = $0.48/hour = $175/month (peak)

**Best for:**
- Non-24/7 applications
- Variable traffic patterns
- Dev/staging environments

**Not good for:**
- Consistent 24/7 high traffic (use RDS RI instead)

---

### 4. **S3 Intelligent-Tiering**
**Savings: 40-70% on storage**

Automatically moves objects between access tiers:
- Frequent Access: $0.023/GB (first 50 TB)
- Infrequent Access: $0.0125/GB (after 30 days)
- Archive Instant Access: $0.004/GB (after 90 days)
- No retrieval fees

**Setup:**
```bash
aws s3api put-bucket-intelligent-tiering-configuration \
  --bucket travel-app-storage \
  --id EntireBucket \
  --intelligent-tiering-configuration '{
    "Id": "EntireBucket",
    "Status": "Enabled",
    "Tierings": [
      {
        "Days": 90,
        "AccessTier": "ARCHIVE_ACCESS"
      },
      {
        "Days": 180,
        "AccessTier": "DEEP_ARCHIVE_ACCESS"
      }
    ]
  }'
```

---

### 5. **CloudFront Caching Optimization**
**Savings: 60-80% on S3 GET requests**

Proper caching reduces origin (S3) requests:
- Set Cache-Control headers: `max-age=31536000` for immutable files
- Use query string cache keys for versioning
- Enable compression (automatic 50-70% size reduction)

**Implementation:**
```typescript
// When uploading to S3
await s3.putObject({
  Bucket: 'travel-app-storage',
  Key: 'images/photo.jpg',
  Body: file,
  CacheControl: 'public, max-age=31536000, immutable', // 1 year cache
  ContentType: 'image/jpeg',
});
```

**Result:**
- 10M S3 GET requests/month = $0.40
- With 90% cache hit ratio = 1M requests = $0.04
- **Savings: $0.36/month per million requests**

---

## 🔧 Medium-Term Optimizations (Month 2-3)

### 6. **RDS Proxy for Connection Pooling**
**Savings: Use smaller RDS instance = $30-50/month**

Benefits:
- Reduces database connections by 70-90%
- Can use smaller instance class
- Better for serverless (Lambda) connections

**Cost:**
- RDS Proxy: $0.015/hour = $10.80/month
- Smaller instance savings: $40-60/month
- **Net savings: $30-50/month**

---

### 7. **Compress Images Before Upload**
**Savings: 60-80% on storage and bandwidth**

Use image optimization:
- Convert to WebP format (30% smaller than JPEG)
- Resize images (don't store 4K when you display 1080p)
- Use Lambda@Edge for on-the-fly resizing

**Implementation:**
```typescript
import sharp from 'sharp';

async function optimizeImage(file: Buffer) {
  return await sharp(file)
    .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}
```

**Savings:**
- 100 GB unoptimized = $2.30/month storage
- 30 GB optimized = $0.69/month
- Bandwidth savings: 70% reduction
- **Total savings: $10-20/month**

---

### 8. **Multi-AZ Only for Production**
**Savings: $90/month**

Multi-AZ doubles RDS cost:
- Single-AZ db.t4g.medium: $92/month
- Multi-AZ db.t4g.medium: $184/month

**Strategy:**
- Development: Single-AZ
- Staging: Single-AZ
- Production: Multi-AZ (only if you need 99.95% uptime)

For most startups, Single-AZ with daily backups is sufficient.

---

### 9. **CloudWatch Logs Retention**
**Savings: $10-30/month**

Default is "Never Expire" = expensive:
- Set retention to 7 days for debug logs
- 30 days for application logs
- 1 year for audit logs

**Setup:**
```bash
aws logs put-retention-policy \
  --log-group-name /aws/lambda/my-function \
  --retention-in-days 7
```

---

### 10. **Spot Instances for Background Jobs**
**Savings: 70-90% on compute**

Use EC2 Spot Instances for:
- Image processing
- Data exports
- Batch jobs
- Non-critical tasks

**Cost comparison:**
- t4g.medium On-Demand: $0.0336/hour
- t4g.medium Spot: $0.0101/hour
- **Savings: 70%**

---

## 💸 Cost Monitoring & Alerts

### Set Up Billing Alerts
```bash
# Create SNS topic for alerts
aws sns create-topic --name billing-alerts

# Subscribe to email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT-ID:billing-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# Create budget
aws budgets create-budget \
  --account-id ACCOUNT-ID \
  --budget '{
    "BudgetName": "MonthlyBudget",
    "BudgetLimit": {
      "Amount": "300",
      "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }' \
  --notifications-with-subscribers '[
    {
      "Notification": {
        "NotificationType": "ACTUAL",
        "ComparisonOperator": "GREATER_THAN",
        "Threshold": 80
      },
      "Subscribers": [
        {
          "SubscriptionType": "EMAIL",
          "Address": "your-email@example.com"
        }
      ]
    }
  ]'
```

---

## 📊 Cost Breakdown After Optimizations

### Before Optimization
| Service | Cost/Month |
|---------|------------|
| RDS db.t4g.medium (Multi-AZ) | $184 |
| S3 (100GB, unoptimized) | $15 |
| CloudFront (1TB transfer) | $85 |
| Lambda + API Gateway | $20 |
| CloudWatch | $30 |
| **TOTAL** | **$334** |

### After Optimization
| Service | Configuration | Cost/Month |
|---------|---------------|------------|
| RDS db.t4g.medium (Single-AZ, 1yr RI) | 30% savings | $64 |
| S3 (30GB, Intelligent-Tiering) | 70% reduction | $5 |
| CloudFront (1TB, optimized cache) | 90% cache hit | $50 |
| Lambda + API Gateway | Same | $20 |
| CloudWatch (7-day retention) | Reduced logs | $10 |
| RDS Proxy | Connection pooling | $11 |
| **TOTAL** | | **$160** |

**Total Savings: $174/month (52% reduction)**

---

## 🎯 Best Practices Checklist

- [ ] Use AWS Free Tier for first 12 months
- [ ] Set up billing alerts at $100, $200, $300
- [ ] Enable AWS Cost Explorer
- [ ] Tag all resources (environment, project, owner)
- [ ] Delete unused resources weekly
- [ ] Use S3 Intelligent-Tiering
- [ ] Optimize images before upload (WebP, compression)
- [ ] Set CloudWatch logs retention to 7-30 days
- [ ] Use CloudFront caching aggressively
- [ ] Buy Reserved Instances after 2-3 months
- [ ] Use Aurora Serverless v2 for variable workloads
- [ ] Implement RDS connection pooling
- [ ] Use Spot Instances for batch jobs
- [ ] Single-AZ for non-production environments
- [ ] Review AWS Cost & Usage Report monthly

---

## 🔍 Cost Monitoring Tools

### 1. AWS Cost Explorer
- View costs by service, region, tag
- Forecast future costs
- Identify cost anomalies

### 2. AWS Trusted Advisor
- Free tier: Basic checks
- Business/Enterprise: Full optimization recommendations
- Cost Optimization checks every week

### 3. Third-Party Tools
- CloudHealth by VMware
- Cloudability
- Datadog Cloud Cost Management

---

## 💡 Pro Tips

1. **Dev/Staging on Serverless:** Use Aurora Serverless v2 (0.5 ACU minimum) for non-production = $43/month vs $92/month
2. **Schedule Shutdowns:** Stop RDS instances during non-business hours for dev/staging
3. **Use AWS Savings Plans:** 1-3 year commitment for 20-40% savings on Lambda + Fargate
4. **Data Transfer:** Keep resources in same region to avoid transfer costs
5. **S3 Lifecycle Policies:** Auto-delete temp files after 30 days
6. **CloudFront Price Classes:** Use "Price Class 100" (North America + Europe only) for 30% savings if your users are regional

---

## 📈 Scaling Cost Projections

### At 2,000 Concurrent Users (Optimized)
**Monthly Cost: $160**

### At 5,000 Concurrent Users (Optimized)
| Service | Cost |
|---------|------|
| RDS db.t4g.large (1yr RI) | $128 |
| S3 + CloudFront | $80 |
| Lambda + API Gateway | $30 |
| Cognito | FREE |
| Other | $30 |
| **TOTAL** | **$268** |

### At 10,000 Concurrent Users (Optimized)
| Service | Cost |
|---------|------|
| Aurora PostgreSQL (RI) | $200 |
| S3 + CloudFront | $150 |
| Lambda + API Gateway | $50 |
| Cognito | $55 (>50K MAU) |
| ElastiCache Redis | $45 |
| Other | $50 |
| **TOTAL** | **$550** |

---

**Remember:** Start small, monitor costs weekly, optimize based on actual usage patterns!

