# Cognito Password Migration Guide 🔐

## ✅ Yes, We CAN Migrate Passwords!

Using **AWS Cognito's User Migration Lambda Trigger**, users can login with their **existing Supabase passwords** during migration.

---

## 🎯 How It Works

1. **User tries to login** with Supabase credentials
2. **Cognito checks** if user exists in User Pool
3. **If user doesn't exist**, Cognito triggers the Lambda function
4. **Lambda verifies** password against Supabase
5. **If password is correct**, Lambda creates user in Cognito with the same password
6. **User can login** - seamless experience!

---

## 🚀 Setup Steps

### **Step 1: Create Lambda Function**

1. **Go to AWS Lambda Console**
   - https://console.aws.amazon.com/lambda/
   - Click **Create function**

2. **Configure Function**
   - **Function name**: `cognito-user-migration`
   - **Runtime**: Node.js 20.x (or latest)
   - **Architecture**: x86_64
   - Click **Create function**

3. **Add Environment Variables**
   - Go to **Configuration** → **Environment variables**
   - Add:
     ```
     SUPABASE_URL=https://megmjzszmqnmzdxwzigt.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
     ```

4. **Upload Code**
   - Copy code from `aws-migration-scripts/cognito-user-migration-lambda.js`
   - Paste in Lambda code editor
   - Click **Deploy**

5. **Add Dependencies**
   - In Lambda console, go to **Code** tab
   - Create `package.json`:
     ```json
     {
       "dependencies": {
         "@supabase/supabase-js": "^2.39.0"
       }
     }
     ```
   - Or use Lambda Layers (recommended for production)

---

### **Step 2: Configure Cognito User Pool**

1. **Go to Cognito Console**
   - https://console.aws.amazon.com/cognito/
   - Click your User Pool

2. **Add Lambda Trigger**
   - Go to **User pool properties** → **Lambda triggers**
   - Find **Migrate user** trigger
   - Select your Lambda function: `cognito-user-migration`
   - Click **Save changes**

---

### **Step 3: Test Migration**

1. **Try to login** with a Supabase user that doesn't exist in Cognito
2. **Lambda will be triggered** automatically
3. **User will be created** in Cognito with the same password
4. **Login succeeds** - user can now use Cognito!

---

## 📋 Lambda Function Code

The Lambda function:
- ✅ Verifies password against Supabase
- ✅ Creates user in Cognito if password is correct
- ✅ Migrates user attributes (name, role, phone)
- ✅ Maps Supabase user ID to Cognito

**Location:** `aws-migration-scripts/cognito-user-migration-lambda.js`

---

## 🔧 Alternative: Use Lambda Layers

For better dependency management, use Lambda Layers:

1. **Create Layer:**
   ```bash
   mkdir nodejs
   cd nodejs
   npm install @supabase/supabase-js
   cd ..
   zip -r supabase-layer.zip nodejs
   ```

2. **Upload to Lambda:**
   - Lambda Console → Layers → Create layer
   - Upload `supabase-layer.zip`
   - Attach to your function

---

## ⚠️ Important Notes

1. **Supabase Must Remain Active** during migration period
2. **Users Must Login** at least once to be migrated
3. **After Migration Period**, disable the trigger
4. **Users Who Never Login** will need to reset passwords

---

## 🎯 Migration Strategy

### **Phase 1: Enable Migration (Week 1-2)**
- ✅ Enable Lambda trigger
- ✅ Users login with Supabase passwords
- ✅ Users automatically migrated to Cognito
- ✅ Monitor migration progress

### **Phase 2: Transition (Week 3)**
- ✅ Most users migrated
- ✅ Send email to remaining users
- ✅ Encourage login to migrate

### **Phase 3: Complete (Week 4)**
- ✅ Disable Lambda trigger
- ✅ Remaining users must reset passwords
- ✅ Supabase can be decommissioned

---

## 📊 Monitoring Migration

Check migration progress:

```bash
# Count users in Cognito
aws cognito-idp list-users \
  --user-pool-id us-east-1_oF5qfa2IX \
  --query 'Users[].Username' \
  --output table
```

---

## ✅ Benefits

- ✅ **Users keep their passwords** (if they remember them)
- ✅ **Seamless migration** - no forced password reset
- ✅ **Automatic** - happens on first login
- ✅ **Secure** - passwords verified, not exposed

---

## 🚀 Quick Start

1. **Create Lambda function** (see Step 1 above)
2. **Configure trigger** in Cognito (see Step 2 above)
3. **Test login** with Supabase credentials
4. **User is automatically migrated!**

---

**This is the best solution for password migration!** 🎉

