# Amplify Setup - Quick Reference Card 🚀

## 🔗 Quick Links

- **Amplify Console**: https://console.aws.amazon.com/amplify/
- **Your App**: Will be created during setup

---

## 📋 VPC Configuration (Copy This!)

When configuring VPC in Amplify:

```
VPC ID: vpc-035de28e2067ea386

Subnets:
  - subnet-03492171db95e0412
  - subnet-0a9c5d406940f11d2

Security Group: sg-0351956ce61a8d1f1
```

---

## 🔑 Environment Variables (Copy All!)

```env
NEXT_PUBLIC_COGNITO_DOMAIN=travel-app-auth-2285.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=20t43em6vuke645ka10s4slgl9
COGNITO_USER_POOL_ID=us-east-1_oF5qfa2IX
AWS_REGION=us-east-1
RDS_HOST=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com
RDS_PORT=5432
RDS_USERNAME=postgres
RDS_PASSWORD=ju3vrLHJUW8PqDG4
RDS_DATABASE=postgres
S3_BUCKET_NAME=travel-app-storage-1769
```

---

## ✅ Setup Checklist

- [ ] Open Amplify Console
- [ ] Connect Git repository
- [ ] Configure build settings
- [ ] Add environment variables
- [ ] Connect VPC (use info above)
- [ ] Deploy
- [ ] Test: `/api/test-db`
- [ ] Test: Login page

---

## 🧪 After Deployment

**Test RDS Connection:**
```
https://your-app.amplifyapp.com/api/test-db
```

**Expected Response:**
```json
{
  "success": true,
  "message": "RDS connection successful!",
  "data": {
    "currentTime": "...",
    "postgresVersion": "..."
  }
}
```

---

## 📖 Full Guide

See: `AMPLIFY_SETUP_COMPLETE_GUIDE.md`

---

**Ready?** Start at: https://console.aws.amazon.com/amplify/ 🚀

