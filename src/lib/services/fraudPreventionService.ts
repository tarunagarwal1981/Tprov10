/**
 * Fraud Prevention Service
 * Implements fraud detection and prevention measures
 * Velocity checks, amount validation, IP reputation, etc.
 */

import { query, queryOne } from '@/lib/aws/lambda-database';

export enum FraudCheckType {
  VELOCITY = 'velocity',
  AMOUNT = 'amount',
  IP_REPUTATION = 'ip_reputation',
  DEVICE_FINGERPRINT = 'device_fingerprint',
  BEHAVIORAL = 'behavioral',
}

export enum FraudCheckResult {
  PASSED = 'passed',
  FAILED = 'failed',
  FLAGGED = 'flagged',
}

export interface FraudCheckResult {
  passed: boolean;
  checkType: FraudCheckType;
  result: FraudCheckResult;
  riskScore: number; // 0-100
  reason?: string;
  details?: Record<string, any>;
}

export interface FraudPreventionConfig {
  maxPurchasesPerHour: number;
  maxPurchasesPerDay: number;
  maxAmountPerTransaction: number;
  maxAmountPerDay: number;
  suspiciousAmountThreshold: number;
}

// Default fraud prevention configuration
const DEFAULT_CONFIG: FraudPreventionConfig = {
  maxPurchasesPerHour: 5,
  maxPurchasesPerDay: 20,
  maxAmountPerTransaction: 10000, // $10,000
  maxAmountPerDay: 50000, // $50,000
  suspiciousAmountThreshold: 5000, // $5,000
};

/**
 * Fraud Prevention Service Class
 */
export class FraudPreventionService {
  private static config: FraudPreventionConfig = DEFAULT_CONFIG;

  /**
   * Update fraud prevention configuration
   */
  static setConfig(config: Partial<FraudPreventionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Perform all fraud checks for a payment
   */
  static async performFraudChecks(params: {
    userId: string;
    amount: number;
    ipAddress?: string;
    userAgent?: string;
    deviceFingerprint?: string;
    paymentId?: string;
  }): Promise<{
    passed: boolean;
    riskScore: number;
    checks: FraudCheckResult[];
    logId?: string;
  }> {
    const { userId, amount, ipAddress, userAgent, deviceFingerprint, paymentId } = params;

    const checks: FraudCheckResult[] = [];
    let totalRiskScore = 0;

    // 1. Velocity Check
    const velocityCheck = await this.checkVelocity(userId);
    checks.push(velocityCheck);
    totalRiskScore += velocityCheck.riskScore;

    // 2. Amount Check
    const amountCheck = await this.checkAmount(userId, amount);
    checks.push(amountCheck);
    totalRiskScore += amountCheck.riskScore;

    // 3. IP Reputation Check (if IP provided)
    if (ipAddress) {
      const ipCheck = await this.checkIPReputation(ipAddress, userId);
      checks.push(ipCheck);
      totalRiskScore += ipCheck.riskScore;
    }

    // 4. Device Fingerprint Check (if provided)
    if (deviceFingerprint) {
      const deviceCheck = await this.checkDeviceFingerprint(deviceFingerprint, userId);
      checks.push(deviceCheck);
      totalRiskScore += deviceCheck.riskScore;
    }

    // Calculate final risk score (average)
    const finalRiskScore = Math.min(100, Math.round(totalRiskScore / checks.length));

    // Determine if passed (risk score < 70)
    const passed = finalRiskScore < 70 && checks.every((c) => c.result !== FraudCheckResult.FAILED);

    // Log fraud check
    const logId = await this.logFraudCheck({
      userId,
      paymentId,
      ipAddress,
      userAgent,
      deviceFingerprint,
      checks,
      finalRiskScore,
      passed,
    });

    return {
      passed,
      riskScore: finalRiskScore,
      checks,
      logId,
    };
  }

  /**
   * Check velocity (too many purchases in short time)
   */
  private static async checkVelocity(userId: string): Promise<FraudCheckResult> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Count purchases in last hour
    const hourlyCount = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM payments 
       WHERE user_id = $1 
         AND created_at >= $2 
         AND status IN ('completed', 'processing', 'pending')`,
      [userId, oneHourAgo.toISOString()]
    );

    // Count purchases in last day
    const dailyCount = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM payments 
       WHERE user_id = $1 
         AND created_at >= $2 
         AND status IN ('completed', 'processing', 'pending')`,
      [userId, oneDayAgo.toISOString()]
    );

    const hourlyPurchases = parseInt(hourlyCount?.count || '0', 10);
    const dailyPurchases = parseInt(dailyCount?.count || '0', 10);

    let riskScore = 0;
    let result = FraudCheckResult.PASSED;
    let reason: string | undefined;

    // Check hourly limit
    if (hourlyPurchases >= this.config.maxPurchasesPerHour) {
      riskScore = 100;
      result = FraudCheckResult.FAILED;
      reason = `Too many purchases in the last hour: ${hourlyPurchases} (max: ${this.config.maxPurchasesPerHour})`;
    } else if (hourlyPurchases >= this.config.maxPurchasesPerHour * 0.8) {
      riskScore = 70;
      result = FraudCheckResult.FLAGGED;
      reason = `High purchase velocity: ${hourlyPurchases} purchases in the last hour`;
    } else if (hourlyPurchases >= this.config.maxPurchasesPerHour * 0.5) {
      riskScore = 40;
      reason = `Moderate purchase velocity: ${hourlyPurchases} purchases in the last hour`;
    }

    // Check daily limit
    if (dailyPurchases >= this.config.maxPurchasesPerDay) {
      riskScore = Math.max(riskScore, 100);
      result = FraudCheckResult.FAILED;
      reason = `Too many purchases today: ${dailyPurchases} (max: ${this.config.maxPurchasesPerDay})`;
    } else if (dailyPurchases >= this.config.maxPurchasesPerDay * 0.8) {
      riskScore = Math.max(riskScore, 70);
      if (result === FraudCheckResult.PASSED) {
        result = FraudCheckResult.FLAGGED;
      }
      reason = `High daily purchase count: ${dailyPurchases} purchases today`;
    }

    return {
      passed: result !== FraudCheckResult.FAILED,
      checkType: FraudCheckType.VELOCITY,
      result,
      riskScore,
      reason,
      details: {
        hourlyPurchases,
        dailyPurchases,
        maxHourly: this.config.maxPurchasesPerHour,
        maxDaily: this.config.maxPurchasesPerDay,
      },
    };
  }

  /**
   * Check amount (suspiciously large purchases)
   */
  private static async checkAmount(userId: string, amount: number): Promise<FraudCheckResult> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get total amount spent today
    const dailyTotal = await queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM payments 
       WHERE user_id = $1 
         AND created_at >= $2 
         AND status IN ('completed', 'processing', 'pending')`,
      [userId, oneDayAgo.toISOString()]
    );

    const dailyAmount = parseFloat(dailyTotal?.total || '0');

    let riskScore = 0;
    let result = FraudCheckResult.PASSED;
    let reason: string | undefined;

    // Check transaction amount limit
    if (amount > this.config.maxAmountPerTransaction) {
      riskScore = 100;
      result = FraudCheckResult.FAILED;
      reason = `Transaction amount exceeds limit: $${amount} (max: $${this.config.maxAmountPerTransaction})`;
    } else if (amount > this.config.suspiciousAmountThreshold) {
      riskScore = 60;
      result = FraudCheckResult.FLAGGED;
      reason = `High transaction amount: $${amount}`;
    }

    // Check daily amount limit
    const newDailyTotal = dailyAmount + amount;
    if (newDailyTotal > this.config.maxAmountPerDay) {
      riskScore = Math.max(riskScore, 100);
      result = FraudCheckResult.FAILED;
      reason = `Daily spending limit exceeded: $${newDailyTotal} (max: $${this.config.maxAmountPerDay})`;
    } else if (newDailyTotal > this.config.maxAmountPerDay * 0.8) {
      riskScore = Math.max(riskScore, 70);
      if (result === FraudCheckResult.PASSED) {
        result = FraudCheckResult.FLAGGED;
      }
      reason = `Approaching daily spending limit: $${newDailyTotal}`;
    }

    return {
      passed: result !== FraudCheckResult.FAILED,
      checkType: FraudCheckType.AMOUNT,
      result,
      riskScore,
      reason,
      details: {
        amount,
        dailyAmount,
        newDailyTotal,
        maxTransaction: this.config.maxAmountPerTransaction,
        maxDaily: this.config.maxAmountPerDay,
      },
    };
  }

  /**
   * Check IP reputation
   * TODO: Integrate with IP reputation service
   */
  private static async checkIPReputation(
    ipAddress: string,
    userId: string
  ): Promise<FraudCheckResult> {
    // Check if this IP has been used by many different users (suspicious)
    const userCount = await queryOne<{ count: number }>(
      `SELECT COUNT(DISTINCT user_id) as count 
       FROM payments 
       WHERE ip_address = $1 
         AND created_at >= NOW() - INTERVAL '24 hours'`,
      [ipAddress]
    );

    const uniqueUsers = parseInt(userCount?.count || '0', 10);

    let riskScore = 0;
    let result = FraudCheckResult.PASSED;

    // If IP used by more than 5 different users in 24 hours, flag it
    if (uniqueUsers > 10) {
      riskScore = 90;
      result = FraudCheckResult.FAILED;
    } else if (uniqueUsers > 5) {
      riskScore = 60;
      result = FraudCheckResult.FLAGGED;
    }

    return {
      passed: result !== FraudCheckResult.FAILED,
      checkType: FraudCheckType.IP_REPUTATION,
      result,
      riskScore,
      reason: uniqueUsers > 5 ? `IP address used by ${uniqueUsers} different users in 24 hours` : undefined,
      details: {
        ipAddress,
        uniqueUsers,
      },
    };
  }

  /**
   * Check device fingerprint
   * TODO: Implement device fingerprinting
   */
  private static async checkDeviceFingerprint(
    deviceFingerprint: string,
    userId: string
  ): Promise<FraudCheckResult> {
    // Check if this device has been used by many different users (suspicious)
    const userCount = await queryOne<{ count: number }>(
      `SELECT COUNT(DISTINCT user_id) as count 
       FROM payments 
       WHERE device_fingerprint = $1 
         AND created_at >= NOW() - INTERVAL '24 hours'`,
      [deviceFingerprint]
    );

    const uniqueUsers = parseInt(userCount?.count || '0', 10);

    let riskScore = 0;
    let result = FraudCheckResult.PASSED;

    // If device used by more than 3 different users in 24 hours, flag it
    if (uniqueUsers > 5) {
      riskScore = 90;
      result = FraudCheckResult.FAILED;
    } else if (uniqueUsers > 3) {
      riskScore = 50;
      result = FraudCheckResult.FLAGGED;
    }

    return {
      passed: result !== FraudCheckResult.FAILED,
      checkType: FraudCheckType.DEVICE_FINGERPRINT,
      result,
      riskScore,
      reason: uniqueUsers > 3 ? `Device used by ${uniqueUsers} different users in 24 hours` : undefined,
      details: {
        deviceFingerprint,
        uniqueUsers,
      },
    };
  }

  /**
   * Log fraud check result
   */
  private static async logFraudCheck(params: {
    userId: string;
    paymentId?: string;
    ipAddress?: string;
    userAgent?: string;
    deviceFingerprint?: string;
    checks: FraudCheckResult[];
    finalRiskScore: number;
    passed: boolean;
  }): Promise<string> {
    const {
      userId,
      paymentId,
      ipAddress,
      userAgent,
      deviceFingerprint,
      checks,
      finalRiskScore,
      passed,
    } = params;

    // Log each check
    for (const check of checks) {
      await query(
        `INSERT INTO fraud_prevention_logs (
          user_id, payment_id, ip_address, user_agent, device_fingerprint,
          check_type, check_result, risk_score, details, reason
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          userId,
          paymentId || null,
          ipAddress || null,
          userAgent || null,
          deviceFingerprint || null,
          check.checkType,
          check.result,
          check.riskScore,
          JSON.stringify(check.details || {}),
          check.reason || null,
        ]
      );
    }

    // Return the first log ID (for reference)
    const firstLog = await queryOne<{ id: string }>(
      `SELECT id FROM fraud_prevention_logs 
       WHERE user_id = $1 
         AND payment_id = $2 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId, paymentId || null]
    );

    return firstLog?.id || '';
  }
}
