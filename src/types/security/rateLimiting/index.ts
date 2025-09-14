export interface RateLimitOptions {
  // Basic rate limiting
  maxAttempts: number; // Maximum attempts in window
  windowMs: number; // Time window in milliseconds
  blockDurationMs: number; // Block duration after max attempts
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests

  // Advanced options
  progressiveDelay?: boolean; // Increase delay with each attempt
  keyGenerator?: (identifier: string) => string; // Custom key generation
  whitelist?: string[]; // IP whitelist
  blacklist?: string[]; // IP blacklist

  // Brute force protection
  bruteForce?: {
    enabled: boolean;
    maxFailedAttempts: number; // Max failed attempts before account lock
    lockoutDurationMs: number; // Account lockout duration
    resetCountOnSuccess?: boolean; // Reset counter on successful login
  };

  // Notifications
  alerts?: {
    enabled: boolean;
    threshold: number; // Alert after N attempts
    webhook?: string; // Webhook URL for alerts
    email?: string; // Email for alerts
  };
}

export interface RateLimitEntry {
  attempts: number;
  firstAttempt: Date;
  lastAttempt: Date;
  blockedUntil?: Date;
  successfulAttempts?: number;
  failedAttempts?: number;
}

export interface BruteForceEntry {
  userId: string;
  failedAttempts: number;
  lockedUntil?: Date;
  lastFailedAttempt: Date;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
  reason?: string;
}

export interface RateLimitStorage {
  // Rate limiting storage
  getRateLimitEntry(key: string): Promise<RateLimitEntry | null>;
  saveRateLimitEntry(
    key: string,
    entry: RateLimitEntry,
    ttl: number
  ): Promise<void>;
  incrementAttempts(key: string, ttl: number): Promise<RateLimitEntry>;
  clearRateLimitEntry(key: string): Promise<void>;

  // Brute force storage
  getBruteForceEntry(userId: string): Promise<BruteForceEntry | null>;
  saveBruteForceEntry(
    userId: string,
    entry: BruteForceEntry,
    ttl: number
  ): Promise<void>;
  incrementFailedAttempts(
    userId: string,
    ttl: number
  ): Promise<BruteForceEntry>;
  clearBruteForceEntry(userId: string): Promise<void>;

  // Cleanup
  cleanupExpiredEntries(): Promise<void>;
}

export interface RateLimitContext {
  options: Required<RateLimitOptions>;
  storage: RateLimitStorage;
}
