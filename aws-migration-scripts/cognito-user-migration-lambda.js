/**
 * AWS Cognito User Migration Lambda Function
 * 
 * This Lambda function is triggered when a user tries to login to Cognito
 * but doesn't exist in the Cognito User Pool yet.
 * 
 * It verifies the password against Supabase, and if valid, creates the user
 * in Cognito with the same password.
 * 
 * Setup:
 * 1. Deploy this Lambda function
 * 2. Configure it as a "Migrate User" trigger in Cognito User Pool
 * 3. Users can then login with their Supabase passwords
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Lambda handler for Cognito User Migration
 * 
 * @param {Object} event - Cognito event
 * @param {Object} context - Lambda context
 * @returns {Object} Migration result
 */
exports.handler = async (event) => {
  console.log('🔄 User Migration Trigger:', JSON.stringify(event, null, 2));

  const { userName, password, userAttributes } = event;

  try {
    // Verify user exists in Supabase and password is correct
    console.log(`🔍 Verifying user in Supabase: ${userName}`);
    
    // Sign in with Supabase to verify password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userName,
      password: password,
    });

    if (authError || !authData.user) {
      console.log(`❌ Supabase authentication failed: ${authError?.message}`);
      // Return null to indicate migration failed - user will get "Incorrect username or password"
      throw new Error('Invalid credentials');
    }

    console.log(`✅ Supabase authentication successful for: ${userName}`);

    // Get user details from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role, phone')
      .eq('id', authData.user.id)
      .single();

    // Prepare user attributes for Cognito
    const finalUserAttributes = [
      { Name: 'email', Value: userName },
      { Name: 'email_verified', Value: 'true' },
    ];

    // Add name if available
    if (userData?.name) {
      finalUserAttributes.push({ Name: 'name', Value: userData.name });
    }

    // Add role if available
    if (userData?.role) {
      finalUserAttributes.push({ Name: 'custom:role', Value: userData.role });
    }

    // Add phone if available
    if (userData?.phone) {
      finalUserAttributes.push({ Name: 'phone_number', Value: userData.phone });
      finalUserAttributes.push({ Name: 'phone_number_verified', Value: 'true' });
    }

    // Add Supabase user ID for mapping
    if (userData?.id) {
      finalUserAttributes.push({ Name: 'custom:supabase_user_id', Value: userData.id });
    }

    // Return user attributes - Cognito will create the user with the provided password
    const response = {
      userAttributes: finalUserAttributes,
      finalUserStatus: 'CONFIRMED', // User is confirmed (email already verified in Supabase)
      messageAction: 'SUPPRESS', // Don't send welcome email
      desiredDeliveryMediums: [], // No delivery needed
    };

    console.log(`✅ User migration successful: ${userName}`);
    return response;

  } catch (error) {
    console.error(`❌ Migration failed for ${userName}:`, error.message);
    // Return null to indicate migration failed
    // Cognito will return "Incorrect username or password" to the user
    throw error;
  }
};

