import {
  calculateRemainingAttempts,
  calculateRetryAfter,
  isBlacklisted,
  isBlocked,
  isWhitelisted,
  isWindowExpired,
  sendAlert,
} from "./helperFunctions";

import {
  RateLimitContext,
  RateLimitResult,
} from "../../../types/security/rateLimiting";

export const checkIPSecurity = (
  identifier: string,
  context: RateLimitContext
): RateLimitResult | null => {
  const { options } = context;

  if (isWhitelisted(identifier, options.whitelist)) {
    return {
      allowed: true,
      remaining: options.maxAttempts,
      resetTime: new Date(Date.now() + options.windowMs),
    };
  }

  if (isBlacklisted(identifier, options.blacklist)) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: new Date(Date.now() + options.blockDurationMs),
      retryAfter: options.blockDurationMs,
      reason: "IP blacklisted",
    };
  }

  return null; // Continue with normal rate limiting
};

export const checkBruteForceProtection = async (
  userId: string,
  context: RateLimitContext
): Promise<RateLimitResult | null> => {
  const { options, storage } = context;

  if (!options.bruteForce.enabled) {
    return null; // Continue with normal rate limiting
  }

  const entry = await storage.getBruteForceEntry(userId);
  const now = new Date();

  if (!entry) {
    return null; // No brute force entry, continue
  }

  // Check if account is locked
  if (entry.lockedUntil && entry.lockedUntil > now) {
    const retryAfter = calculateRetryAfter(entry.lockedUntil);
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.lockedUntil,
      retryAfter,
      reason: "Account locked due to too many failed attempts",
    };
  }

  // Check if max failed attempts exceeded
  if (entry.failedAttempts >= options.bruteForce.maxFailedAttempts) {
    const lockedUntil = new Date(
      now.getTime() + options.bruteForce.lockoutDurationMs
    );

    // Update entry with lock time
    await storage.saveBruteForceEntry(
      userId,
      {
        ...entry,
        lockedUntil,
      },
      options.bruteForce.lockoutDurationMs
    );

    return {
      allowed: false,
      remaining: 0,
      resetTime: lockedUntil,
      retryAfter: options.bruteForce.lockoutDurationMs,
      reason: "Account locked due to too many failed attempts",
    };
  }

  return null; // Continue with normal rate limiting
};

export const checkRateLimitEntry = async (
  identifier: string,
  context: RateLimitContext
): Promise<RateLimitResult> => {
  const { options, storage } = context;
  const key = options.keyGenerator(identifier);
  const entry = await storage.getRateLimitEntry(key);
  const now = new Date();

  if (!entry) {
    // First request
    return {
      allowed: true,
      remaining: options.maxAttempts - 1,
      resetTime: new Date(now.getTime() + options.windowMs),
    };
  }

  // Check if blocked
  if (isBlocked(entry.blockedUntil)) {
    const retryAfter = calculateRetryAfter(entry.blockedUntil!);
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.blockedUntil!,
      retryAfter,
      reason: "Rate limit exceeded",
    };
  }

  // Check if window expired
  if (isWindowExpired(entry.firstAttempt, options.windowMs)) {
    // Reset counter
    return {
      allowed: true,
      remaining: options.maxAttempts - 1,
      resetTime: new Date(now.getTime() + options.windowMs),
    };
  }

  // Check if max attempts exceeded
  if (entry.attempts >= options.maxAttempts) {
    const blockedUntil = new Date(now.getTime() + options.blockDurationMs);

    // Update entry with block time
    await storage.saveRateLimitEntry(
      key,
      {
        ...entry,
        blockedUntil,
      },
      options.blockDurationMs
    );

    // Send alert if configured
    await sendAlert(identifier, entry.attempts, context);

    return {
      allowed: false,
      remaining: 0,
      resetTime: blockedUntil,
      retryAfter: options.blockDurationMs,
      reason: "Rate limit exceeded",
    };
  }

  // Calculate remaining attempts
  const remaining = calculateRemainingAttempts(
    entry.attempts,
    options.maxAttempts
  );
  const resetTime = new Date(entry.firstAttempt.getTime() + options.windowMs);

  return {
    allowed: true,
    remaining,
    resetTime,
  };
};

// Main rate limiting check function
export const checkRateLimit = async (
  identifier: string,
  context: RateLimitContext,
  userId?: string
): Promise<RateLimitResult> => {
  // 1. Check IP security (whitelist/blacklist)
  const ipSecurityResult = checkIPSecurity(identifier, context);
  if (ipSecurityResult) {
    return ipSecurityResult;
  }

  // 2. Check brute force protection for user account
  if (userId) {
    const bruteForceResult = await checkBruteForceProtection(userId, context);
    if (bruteForceResult) {
      return bruteForceResult;
    }
  }

  // 3. Check rate limiting
  return checkRateLimitEntry(identifier, context);
};

// Attempt recording functions
export const recordRateLimitAttempt = async (
  identifier: string,
  context: RateLimitContext,
  success: boolean
): Promise<void> => {
  const { options, storage } = context;

  // Skip recording based on options
  if (success && options.skipSuccessfulRequests) return;
  if (!success && options.skipFailedRequests) return;

  const key = options.keyGenerator(identifier);
  const ttl = Math.max(options.windowMs, options.blockDurationMs);

  await storage.incrementAttempts(key, ttl);
};

export const recordBruteForceAttempt = async (
  userId: string,
  context: RateLimitContext,
  success: boolean
): Promise<void> => {
  const { options, storage } = context;

  if (!options.bruteForce.enabled) return;

  if (success) {
    // Reset failed attempts on success
    if (options.bruteForce.resetCountOnSuccess) {
      await storage.clearBruteForceEntry(userId);
    }
  } else {
    // Increment failed attempts
    await storage.incrementFailedAttempts(
      userId,
      options.bruteForce.lockoutDurationMs
    );
  }
};

export const recordAttempt = async (
  identifier: string,
  context: RateLimitContext,
  success: boolean,
  userId?: string
): Promise<void> => {
  // Record rate limiting attempt
  await recordRateLimitAttempt(identifier, context, success);

  // Record brute force attempt for user
  if (userId) {
    await recordBruteForceAttempt(userId, context, success);
  }
};
