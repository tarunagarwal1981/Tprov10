/**
 * POST /api/auth/phone/verify-otp
 * Verify OTP and authenticate user (login or signup)
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, transaction } from '@/lib/aws/lambda-database';
import { verifyOTP } from '@/lib/services/otpService';
import { signUp, signIn } from '@/lib/aws/cognito';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { countryCode, phoneNumber, code, purpose, email, name, companyName, role } = await request.json();
    
    if (!countryCode || !phoneNumber || !code) {
      return NextResponse.json(
        { error: 'Country code, phone number, and OTP code are required' },
        { status: 400 }
      );
    }
    
    // Verify OTP
    const verification = await verifyOTP({
      countryCode,
      phoneNumber,
      code,
      purpose: purpose || 'login',
    });

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.message || 'Invalid OTP' },
        { status: 400 }
      );
    }

    // OTP is valid - proceed with authentication
    if (verification.record?.purpose === 'signup') {
      // SIGNUP FLOW: Create new user
      if (!email || !name) {
      return NextResponse.json(
          { error: 'Email and name are required for signup' },
        { status: 400 }
      );
    }
      const normalizedRole = (role || '').toUpperCase();
      const allowedRoles = ['TRAVEL_AGENT', 'TOUR_OPERATOR'];
      if (!allowedRoles.includes(normalizedRole)) {
        return NextResponse.json(
          { error: 'Role is required and must be TRAVEL_AGENT or TOUR_OPERATOR' },
          { status: 400 }
        );
      }
    
      // Check if user was already created (race condition protection)
      let user = await queryOne<{ id: string; email: string; auth_method: string }>(
        `SELECT id, email, auth_method FROM users WHERE country_code = $1 AND phone_number = $2`,
        [countryCode, phoneNumber]
      );

      if (!user) {
        // Create user in database and Cognito
        const userId = uuidv4();
        const tempPassword = crypto.randomBytes(16).toString('hex') + 'A1!'; // Temporary password for Cognito

        try {
          // Create user in Cognito (we'll use email as username, but phone for auth)
          // Note: Only use standard Cognito attributes (name, phone_number)
          // Custom attributes (custom:role, custom:auth_method, etc.) must be defined in Cognito User Pool schema first
          // For now, we'll store role, auth_method, country_code, phone_number in database only
          const cognitoResult = await signUp(email, tempPassword, {
            name,
            // Use standard Cognito attribute for phone number (E.164 format)
            phone_number: `${countryCode}${phoneNumber}`,
            // Removed custom attributes - they need to be defined in Cognito User Pool schema first
            // Store role, auth_method, country_code, phone_number in database instead
          });

          // Create user in database
          await transaction(async (client) => {
            await client.query(
              `INSERT INTO users 
               (id, email, name, phone_number, country_code, role, phone_verified, email_verified, auth_method, profile, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
              [
                userId,
                email,
                name,
                phoneNumber,
                countryCode,
                normalizedRole,
                true, // phone_verified
                false, // email_verified (can be verified later)
                'phone_otp',
                JSON.stringify({
                  companyName: companyName || null,
                  role: normalizedRole,
                }),
              ]
            );

            // Create profile entries
            await client.query(
              `INSERT INTO account_details (user_id, first_name, created_at, updated_at)
               VALUES ($1, $2, NOW(), NOW())
               ON CONFLICT (user_id) DO NOTHING`,
              [userId, name.split(' ')[0] || name]
            );
          });

          user = {
            id: userId,
            email,
            auth_method: 'phone_otp',
          };
        } catch (cognitoError: any) {
          console.error('Cognito signup error:', cognitoError);
          // If Cognito fails but DB succeeds, we have a partial user
          // For now, we'll still allow login but log the error
          if (cognitoError.name === 'UsernameExistsException') {
            // User already exists in Cognito - try to get existing user
            user = await queryOne<{ id: string; email: string; auth_method: string }>(
              `SELECT id, email, auth_method FROM users WHERE email = $1`,
              [email]
            );
          } else {
            throw cognitoError;
          }
        }
      }

      // Generate tokens (we'll use a custom auth flow or create session)
      // For now, return user info - frontend will handle token generation
      if (!user) {
        return NextResponse.json(
          { error: 'User creation failed' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          role: normalizedRole,
          phoneNumber: `${countryCode}${phoneNumber}`,
          authMethod: user.auth_method,
        },
        message: 'Account created and verified successfully',
        // In a real implementation, you'd generate JWT tokens here
        // or use Cognito's custom auth flow to get tokens
      });
    } else {
      // LOGIN FLOW: Authenticate existing user
    const user = await queryOne<{ 
      id: string; 
      email: string; 
      name: string;
        role: string;
        auth_method: string;
      phone_verified: boolean;
    }>(
        `SELECT id, email, name, role, auth_method, phone_verified 
       FROM users 
       WHERE country_code = $1 AND phone_number = $2`,
        [countryCode, phoneNumber]
    );
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
      // Update phone_verified if not already verified
      if (!user.phone_verified) {
        await query(
          `UPDATE users SET phone_verified = TRUE, updated_at = NOW() WHERE id = $1`,
        [user.id]
      );
    }
    
      // Generate tokens or session
      // For phone OTP users, we might need to use Cognito's custom auth
      // For now, return user info - frontend will handle session
    const resolvedRole = user.role || 'TRAVEL_AGENT';
    return NextResponse.json({
      success: true,
        authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
          role: resolvedRole,
          phoneNumber: `${countryCode}${phoneNumber}`,
          authMethod: user.auth_method,
        },
        message: 'Login successful',
        // In a real implementation, you'd generate JWT tokens here
      });
    }
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to verify OTP',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
