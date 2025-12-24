# Use AWS Policy Simulator to Find the Deny

## 🎯 This Will Tell You EXACTLY What's Denying Access

The AWS Policy Simulator is the fastest way to find which policy is denying access.

## 📋 Step-by-Step Instructions

### Step 1: Open Policy Simulator

1. Go to: **https://console.aws.amazon.com/iam/**
2. In the left sidebar, scroll down and click: **Policy Simulator**
   - It's under "Access management" section
   - Or search for "Policy Simulator" in the top search bar

### Step 2: Select the User

1. In the Policy Simulator page, you'll see a form
2. **Select principal type**: Choose **"User"**
3. **Select principal**: Choose **"tarunagarwal"** from the dropdown

### Step 3: Configure the Test

1. **Action**: Type `s3:GetObject`
2. **Resource**: Paste this exact ARN:
   ```
   arn:aws:s3:::travel-app-storage-1769/activity-packages-images/c39c6b66-0712-4150-a5c0-0a3d413df33b/ae522358-7c08-4935-b3f6-1d90663e2cd8/pexels-cigdem-bilgin-2154409770-35014799.jpg
   ```
3. **Additional context**: Leave empty (or add if you want to test specific conditions)

### Step 4: Run Simulation

1. Click the **"Run simulation"** button
2. Wait for results

### Step 5: Read the Results

The results will show:
- ✅ **Allowed** - If access is granted
- ❌ **Explicitly denied** - If a deny policy blocks it
- ⚠️ **Implicitly denied** - If no policy allows it

**If it shows "Explicitly denied":**
- It will tell you **WHICH POLICY** denied it
- It will show the **policy name** and **statement** that denied
- This is exactly what we need!

## 🔍 What to Do With the Results

Once you know which policy is denying:

1. **If it's a user policy**: Go to IAM → Users → tarunagarwal → Permissions → Find and fix that policy
2. **If it's a group policy**: Go to IAM → Groups → [group name] → Permissions → Find and fix that policy
3. **If it's a permissions boundary**: Go to IAM → Users → tarunagarwal → Permissions → Permissions boundary → Fix it
4. **If it's an SCP**: Go to AWS Organizations → Service control policies → Fix it

## 📸 Example Output

The simulator might show something like:

```
Result: Explicitly denied
Denied by: AllowS3TravelAppStorage (inline policy)
Statement: Statement 2
Effect: Deny
Action: s3:GetObject
Resource: arn:aws:s3:::travel-app-storage-1769/*
```

This tells you exactly where the deny is!

## ⚡ Quick Alternative: Check Groups First

Before using the simulator, quickly check:

1. **IAM → Users → tarunagarwal**
2. Click **Groups** tab
3. **Does the user belong to any groups?**
4. If yes, check each group's policies for denies

Groups are the #1 most common place people miss deny policies!

