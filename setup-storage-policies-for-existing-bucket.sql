-- Setup Storage Policies for Existing Bucket: activity-packages-images
-- Since you already have the bucket, we just need to add RLS policies

-- NOTE: You CANNOT run storage.objects policies from SQL Editor due to permissions
-- Instead, use the Supabase Dashboard UI (instructions below)
-- This file is for reference only

-- ========================================
-- POLICIES NEEDED FOR: activity-packages-images
-- ========================================

-- Policy 1: Allow authenticated users to upload images
-- CREATE POLICY ON storage.objects
-- Policy name: "Allow authenticated uploads to activity-packages-images"
-- Operation: INSERT
-- Target: authenticated
-- WITH CHECK expression:
(bucket_id = 'activity-packages-images'::text) 
AND ((storage.foldername(name))[1] = (auth.uid())::text)

-- Policy 2: Allow public read access
-- CREATE POLICY ON storage.objects
-- Policy name: "Public read access for activity-packages-images"
-- Operation: SELECT
-- Target: public
-- USING expression:
(bucket_id = 'activity-packages-images'::text)

-- Policy 3: Allow authenticated users to update their own images
-- CREATE POLICY ON storage.objects
-- Policy name: "Allow authenticated update to activity-packages-images"
-- Operation: UPDATE
-- Target: authenticated
-- USING expression:
(bucket_id = 'activity-packages-images'::text) 
AND ((storage.foldername(name))[1] = (auth.uid())::text)

-- Policy 4: Allow authenticated users to delete their own images
-- CREATE POLICY ON storage.objects
-- Policy name: "Allow authenticated delete from activity-packages-images"
-- Operation: DELETE
-- Target: authenticated
-- USING expression:
(bucket_id = 'activity-packages-images'::text) 
AND ((storage.foldername(name))[1] = (auth.uid())::text)

-- ========================================
-- HOW TO ADD THESE POLICIES (Dashboard UI)
-- ========================================

/*
1. Go to: https://supabase.com/dashboard/project/megmjzszmqnmzdxwzigt/storage/buckets

2. Click on your "activity-packages-images" bucket

3. Click "Policies" tab at the top

4. Click "New Policy" for each policy above

5. For each policy, fill in:
   - Policy name (from above)
   - Allowed operation (INSERT, SELECT, UPDATE, or DELETE)
   - Target roles (authenticated or public)
   - Policy definition (the expression from above)

6. Make sure the bucket is set to PUBLIC in settings
*/

