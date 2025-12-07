/**
 * Secure Secrets Manager
 * 
 * Fetches secrets from AWS Secrets Manager at runtime (not build time)
 * Caches secrets in memory to avoid repeated API calls
 * Falls back to environment variables for local development
 */

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// In-memory cache for secrets
const secretsCache: Map<string, { value: any; expiresAt: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Initialize Secrets Manager client
const getSecretsClient = () => {
  return new SecretsManagerClient({
    region: process.env.DEPLOYMENT_REGION || process.env.REGION || 'us-east-1',
  });
};

/**
 * Get a secret from AWS Secrets Manager
 * @param secretName - Name of the secret in Secrets Manager
 * @param key - Optional key within the JSON secret (if secret is JSON)
 * @returns The secret value
 */
export async function getSecret(secretName: string, key?: string): Promise<string> {
  // Check cache first
  const cacheKey = key ? `${secretName}:${key}` : secretName;
  const cached = secretsCache.get(cacheKey);
  
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  // For local development, fall back to environment variables
  if (process.env.NODE_ENV === 'development' || !process.env.AWS_EXECUTION_ENV) {
    const envVarName = key ? key.toUpperCase() : secretName.split('/').pop()?.toUpperCase().replace(/-/g, '_');
    const envValue = process.env[envVarName || ''];
    
    if (envValue) {
      console.log(`[Secrets] Using environment variable for ${cacheKey} (local dev)`);
      return envValue;
    }
    
    // If no env var, try to fetch from Secrets Manager anyway (for testing)
    console.warn(`[Secrets] Environment variable ${envVarName} not found, attempting Secrets Manager...`);
  }

  try {
    const client = getSecretsClient();
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });

    const response = await client.send(command);
    
    if (!response.SecretString) {
      throw new Error(`Secret ${secretName} has no SecretString`);
    }

    let secretValue: string;
    
    // Try to parse as JSON (if it's a JSON secret with multiple keys)
    try {
      // Strip BOM (Byte Order Mark) if present
      let secretString = response.SecretString;
      if (secretString.charCodeAt(0) === 0xFEFF) {
        secretString = secretString.slice(1);
      }
      // Also handle UTF-8 BOM (ï»¿)
      if (secretString.startsWith('\uFEFF')) {
        secretString = secretString.replace(/^\uFEFF/, '');
      }
      // Handle common BOM patterns
      secretString = secretString.replace(/^[\uFEFF\u200B\u200C\u200D\u2060]+/, '');
      
      const parsed = JSON.parse(secretString);
      secretValue = key ? parsed[key] : response.SecretString;
      
      if (key && !secretValue) {
        throw new Error(`Key ${key} not found in secret ${secretName}`);
      }
    } catch {
      // Not JSON, use as-is
      secretValue = response.SecretString;
    }

    // Cache the result
    secretsCache.set(cacheKey, {
      value: secretValue,
      expiresAt: Date.now() + CACHE_TTL,
    });

    console.log(`[Secrets] Successfully fetched ${cacheKey} from Secrets Manager`);
    return secretValue;
  } catch (error: any) {
    console.error(`[Secrets] Error fetching secret ${secretName}:`, error.message);
    
    // Fallback to environment variable as last resort
    const envVarName = key ? key.toUpperCase() : secretName.split('/').pop()?.toUpperCase().replace(/-/g, '_');
    const envValue = process.env[envVarName || ''];
    
    if (envValue) {
      console.warn(`[Secrets] Falling back to environment variable ${envVarName}`);
      return envValue;
    }
    
    throw new Error(`Failed to fetch secret ${secretName} and no environment variable fallback available`);
  }
}

/**
 * Get all secrets at once (for initialization)
 * This is more efficient than calling getSecret multiple times
 */
export async function getSecrets(secretName: string): Promise<Record<string, string>> {
  try {
    const client = getSecretsClient();
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });

    const response = await client.send(command);
    
    if (!response.SecretString) {
      throw new Error(`Secret ${secretName} has no SecretString`);
    }

    // Strip BOM (Byte Order Mark) if present
    let secretString = response.SecretString;
    if (secretString.charCodeAt(0) === 0xFEFF) {
      secretString = secretString.slice(1);
    }
    // Also handle UTF-8 BOM (ï»¿)
    if (secretString.startsWith('\uFEFF')) {
      secretString = secretString.replace(/^\uFEFF/, '');
    }
    // Handle common BOM patterns
    secretString = secretString.replace(/^[\uFEFF\u200B\u200C\u200D\u2060]+/, '');

    const parsed = JSON.parse(secretString);
    
    // Cache all keys
    Object.keys(parsed).forEach(key => {
      const cacheKey = `${secretName}:${key}`;
      secretsCache.set(cacheKey, {
        value: parsed[key],
        expiresAt: Date.now() + CACHE_TTL,
      });
    });

    return parsed;
  } catch (error: any) {
    console.error(`[Secrets] Error fetching secrets ${secretName}:`, error.message);
    throw error;
  }
}

/**
 * Clear the secrets cache (useful for testing or after secret rotation)
 */
export function clearSecretsCache(): void {
  secretsCache.clear();
}

