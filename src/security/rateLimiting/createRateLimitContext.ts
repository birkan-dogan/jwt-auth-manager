import {
  RateLimitContext,
  RateLimitOptions,
  RateLimitStorage,
} from "../../types/security/rateLimiting";

export const createRateLimitContext = (
  options: RateLimitOptions,
  storage: RateLimitStorage
): RateLimitContext => ({
  options: {
    maxAttempts: options.maxAttempts,
    windowMs: options.windowMs,
    blockDurationMs: options.blockDurationMs,
    skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,
    skipFailedRequests: options.skipFailedRequests ?? false,
    progressiveDelay: options.progressiveDelay ?? false,
    keyGenerator: options.keyGenerator ?? ((id) => `rateLimit:${id}`),
    whitelist: options.whitelist ?? [],
    blacklist: options.blacklist ?? [],
    bruteForce: {
      enabled: options.bruteForce?.enabled ?? true,
      maxFailedAttempts: options.bruteForce?.maxFailedAttempts ?? 10,
      lockoutDurationMs:
        options.bruteForce?.lockoutDurationMs ?? 60 * 60 * 1000, // 1 hour
      resetCountOnSuccess: options.bruteForce?.resetCountOnSuccess ?? true,
    },
    alerts: {
      enabled: options.alerts?.enabled ?? false,
      threshold: options.alerts?.threshold ?? 5,
      webhook: options.alerts?.webhook,
      email: options.alerts?.email,
    },
  },
  storage,
});
