/**
 * Idempotency Service
 * Prevents duplicate payment processing
 * Ensures same request returns same result
 */

import { query, queryOne, transaction } from '@/lib/aws/lambda-database';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface IdempotencyRecord {
  id: string;
  idempotencyKey: string;
  paymentId?: string;
  requestHash: string;
  userId: string;
  responseStatus: 'pending' | 'completed' | 'failed';
  responseData?: any;
  createdAt: Date;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

interface CheckIdempotencyParams {
  idempotencyKey: string;
  userId: string;
  requestBody: any;
}

interface StoreIdempotencyParams {
  idempotencyKey: string;
  userId: string;
  requestBody: any;
  paymentId?: string;
  responseStatus: 'pending' | 'completed' | 'failed';
  responseData?: any;
  metadata?: Record<string, any>;
}

/**
 * Idempotency Service Class
 */
export class IdempotencyService {
  // Idempotency keys expire after 24 hours
  private static readonly IDEMPOTENCY_EXPIRY_HOURS = 24;

  /**
   * Generate a unique idempotency key
   */
  static generateIdempotencyKey(prefix: string = 'payment'): string {
    return `${prefix}_${uuidv4()}_${Date.now()}`;
  }

  /**
   * Hash request body for validation
   */
  static hashRequestBody(requestBody: any): string {
    const jsonString = JSON.stringify(requestBody);
    return crypto.createHash('sha256').update(jsonString).digest('hex');
  }

  /**
   * Check if idempotency key exists and is valid
   * Returns existing response if found, null if new request
   */
  static async checkIdempotency(
    params: CheckIdempotencyParams
  ): Promise<IdempotencyRecord | null> {
    const { idempotencyKey, userId, requestBody } = params;
    const requestHash = this.hashRequestBody(requestBody);

    // Check for existing idempotency record
    const existing = await queryOne<IdempotencyRecord>(
      `SELECT * FROM payment_idempotency 
       WHERE idempotency_key = $1 
         AND user_id = $2 
         AND expires_at > NOW()`,
      [idempotencyKey, userId]
    );

    if (!existing) {
      return null; // New request
    }

    // Verify request hash matches (same request)
    if (existing.request_hash !== requestHash) {
      throw new Error(
        'Idempotency key exists but request body does not match. Use a different idempotency key for different requests.'
      );
    }

    return this.mapIdempotencyFromDB(existing);
  }

  /**
   * Store idempotency record
   */
  static async storeIdempotency(params: StoreIdempotencyParams): Promise<IdempotencyRecord> {
    const {
      idempotencyKey,
      userId,
      requestBody,
      paymentId,
      responseStatus,
      responseData,
      metadata = {},
    } = params;

    const requestHash = this.hashRequestBody(requestBody);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.IDEMPOTENCY_EXPIRY_HOURS);

    const result = await queryOne<IdempotencyRecord>(
      `INSERT INTO payment_idempotency (
        idempotency_key, user_id, request_hash, payment_id,
        response_status, response_data, expires_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (idempotency_key) 
      DO UPDATE SET 
        payment_id = EXCLUDED.payment_id,
        response_status = EXCLUDED.response_status,
        response_data = EXCLUDED.response_data,
        metadata = EXCLUDED.metadata
      RETURNING *`,
      [
        idempotencyKey,
        userId,
        requestHash,
        paymentId || null,
        responseStatus,
        responseData ? JSON.stringify(responseData) : null,
        expiresAt,
        JSON.stringify(metadata),
      ]
    );

    return this.mapIdempotencyFromDB(result);
  }

  /**
   * Update idempotency record with payment result
   */
  static async updateIdempotencyResult(
    idempotencyKey: string,
    paymentId: string,
    responseStatus: 'completed' | 'failed',
    responseData: any
  ): Promise<IdempotencyRecord> {
    const result = await queryOne<IdempotencyRecord>(
      `UPDATE payment_idempotency 
       SET payment_id = $1,
           response_status = $2,
           response_data = $3
       WHERE idempotency_key = $4
       RETURNING *`,
      [paymentId, responseStatus, JSON.stringify(responseData), idempotencyKey]
    );

    return this.mapIdempotencyFromDB(result);
  }

  /**
   * Get idempotency record by key
   */
  static async getIdempotencyByKey(
    idempotencyKey: string
  ): Promise<IdempotencyRecord | null> {
    const result = await queryOne<IdempotencyRecord>(
      `SELECT * FROM payment_idempotency 
       WHERE idempotency_key = $1 
         AND expires_at > NOW()`,
      [idempotencyKey]
    );

    return result ? this.mapIdempotencyFromDB(result) : null;
  }

  /**
   * Clean up expired idempotency keys
   * Should be called by a scheduled job
   */
  static async cleanupExpiredKeys(): Promise<number> {
    const result = await query<{ deleted_count: number }>(
      `SELECT cleanup_expired_idempotency_keys() as deleted_count`
    );

    // The function returns the count, but we need to check the actual deletion
    const deleteResult = await query(
      `DELETE FROM payment_idempotency WHERE expires_at < NOW() - INTERVAL '1 day'`
    );

    return deleteResult.rowCount || 0;
  }

  /**
   * Map database row to IdempotencyRecord
   */
  private static mapIdempotencyFromDB(row: any): IdempotencyRecord {
    return {
      id: row.id,
      idempotencyKey: row.idempotency_key,
      paymentId: row.payment_id || undefined,
      requestHash: row.request_hash,
      userId: row.user_id,
      responseStatus: row.response_status,
      responseData: row.response_data
        ? typeof row.response_data === 'string'
          ? JSON.parse(row.response_data)
          : row.response_data
        : undefined,
      createdAt: new Date(row.created_at),
      expiresAt: new Date(row.expires_at),
      metadata: row.metadata
        ? typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata
        : {},
    };
  }
}
