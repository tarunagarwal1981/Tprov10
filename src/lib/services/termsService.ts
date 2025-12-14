/**
 * Terms Service
 * Manages Terms of Service, Privacy Policy, and Refund Policy acceptance
 */

import { query, queryOne } from '@/lib/aws/lambda-database';

export enum TermsType {
  TERMS_OF_SERVICE = 'terms_of_service',
  PRIVACY_POLICY = 'privacy_policy',
  REFUND_POLICY = 'refund_policy',
}

export interface TermsAcceptance {
  id: string;
  userId: string;
  termsVersion: string;
  termsType: TermsType;
  accepted: boolean;
  acceptedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AcceptTermsParams {
  userId: string;
  termsVersion: string;
  termsType: TermsType;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Terms Service Class
 */
export class TermsService {
  // Current terms versions
  private static readonly CURRENT_VERSIONS = {
    [TermsType.TERMS_OF_SERVICE]: '1.0',
    [TermsType.PRIVACY_POLICY]: '1.0',
    [TermsType.REFUND_POLICY]: '1.0',
  };

  /**
   * Get current terms version
   */
  static getCurrentVersion(termsType: TermsType): string {
    return this.CURRENT_VERSIONS[termsType] || '1.0';
  }

  /**
   * Check if user has accepted current terms
   */
  static async hasAcceptedCurrentTerms(
    userId: string,
    termsType: TermsType
  ): Promise<boolean> {
    const currentVersion = this.getCurrentVersion(termsType);

    const result = await queryOne<{ accepted: boolean }>(
      `SELECT accepted FROM terms_acceptance 
       WHERE user_id = $1 
         AND terms_type = $2 
         AND terms_version = $3 
         AND accepted = TRUE`,
      [userId, termsType, currentVersion]
    );

    return result?.accepted === true;
  }

  /**
   * Check if user has accepted all required terms
   */
  static async hasAcceptedAllRequiredTerms(userId: string): Promise<boolean> {
    const requiredTypes = [
      TermsType.TERMS_OF_SERVICE,
      TermsType.PRIVACY_POLICY,
    ];

    for (const termsType of requiredTypes) {
      const accepted = await this.hasAcceptedCurrentTerms(userId, termsType);
      if (!accepted) {
        return false;
      }
    }

    return true;
  }

  /**
   * Accept terms
   */
  static async acceptTerms(params: AcceptTermsParams): Promise<TermsAcceptance> {
    const { userId, termsVersion, termsType, ipAddress, userAgent } = params;

    const result = await queryOne<TermsAcceptance>(
      `INSERT INTO terms_acceptance (
        user_id, terms_version, terms_type, accepted, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, terms_version, terms_type)
      DO UPDATE SET 
        accepted = EXCLUDED.accepted,
        accepted_at = EXCLUDED.accepted_at,
        ip_address = EXCLUDED.ip_address,
        user_agent = EXCLUDED.user_agent,
        updated_at = NOW()
      RETURNING *`,
      [userId, termsVersion, termsType, true, ipAddress || null, userAgent || null]
    );

    return this.mapTermsAcceptanceFromDB(result);
  }

  /**
   * Get user's terms acceptance history
   */
  static async getUserTermsHistory(
    userId: string,
    termsType?: TermsType
  ): Promise<TermsAcceptance[]> {
    let sql = 'SELECT * FROM terms_acceptance WHERE user_id = $1';
    const params: any[] = [userId];

    if (termsType) {
      sql += ' AND terms_type = $2';
      params.push(termsType);
    }

    sql += ' ORDER BY created_at DESC';

    const results = await query<TermsAcceptance>(sql, params);

    return results.rows.map((row) => this.mapTermsAcceptanceFromDB(row));
  }

  /**
   * Get latest terms acceptance for user
   */
  static async getLatestAcceptance(
    userId: string,
    termsType: TermsType
  ): Promise<TermsAcceptance | null> {
    const result = await queryOne<TermsAcceptance>(
      `SELECT * FROM terms_acceptance 
       WHERE user_id = $1 AND terms_type = $2 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId, termsType]
    );

    return result ? this.mapTermsAcceptanceFromDB(result) : null;
  }

  /**
   * Check if user needs to accept new terms version
   */
  static async needsToAcceptNewVersion(
    userId: string,
    termsType: TermsType
  ): Promise<boolean> {
    const currentVersion = this.getCurrentVersion(termsType);
    const latest = await this.getLatestAcceptance(userId, termsType);

    if (!latest) {
      return true; // Never accepted
    }

    return latest.termsVersion !== currentVersion;
  }

  /**
   * Map database row to TermsAcceptance object
   */
  private static mapTermsAcceptanceFromDB(row: any): TermsAcceptance {
    return {
      id: row.id,
      userId: row.user_id,
      termsVersion: row.terms_version,
      termsType: row.terms_type as TermsType,
      accepted: row.accepted,
      acceptedAt: new Date(row.accepted_at),
      ipAddress: row.ip_address || undefined,
      userAgent: row.user_agent || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
