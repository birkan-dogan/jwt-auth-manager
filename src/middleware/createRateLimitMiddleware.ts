import { checkRateLimit } from "../security/rateLimiting/utils/rateLimitingFunctions";
import { RateLimitContext } from "../types/security/rateLimiting";

export const createRateLimitMiddleware = (context: RateLimitContext) => {
  return async (req: any, res: any, next: any) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const userId = req.user?.id || req.body?.userId;

    try {
      const result = await checkRateLimit(identifier, context, userId);

      // Set rate limit headers
      res.set({
        "X-RateLimit-Limit": context.options.maxAttempts,
        "X-RateLimit-Remaining": result.remaining,
        "X-RateLimit-Reset": result.resetTime.toISOString(),
      });

      if (!result.allowed) {
        if (result.retryAfter) {
          res.set("Retry-After", Math.ceil(result.retryAfter / 1000));
        }

        return res.status(429).json({
          error: "Too Many Requests",
          message: result.reason,
          retryAfter: result.retryAfter,
        });
      }

      // Store data for recording attempt later
      req.rateLimitData = { identifier, userId };
      next();
    } catch (error) {
      console.error("Rate limiting error:", error);
      // Continue on error to avoid breaking the application
      next();
    }
  };
};
