import { Request, Response, NextFunction } from "express";
import { checkRateLimit } from "../security/rateLimiting/utils/rateLimitingFunctions";
import { RateLimitContext } from "../types/security/rateLimiting";
import { AuthRequest } from "./authMiddleware";

export interface RateLimitRequest extends AuthRequest {
  rateLimitData?: {
    identifier: string;
    userId?: string;
  };
}

export const createRateLimitMiddleware = (context: RateLimitContext) => {
  return async (req: RateLimitRequest, res: Response, next: NextFunction): Promise<void> => {
    const identifier = req.ip || (req.socket.remoteAddress as string) || "unknown";
    const userId = req.user?.userId?.toString() || req.body?.userId?.toString();

    try {
      const result = await checkRateLimit(identifier, context, userId);

      // Set rate limit headers
      res.set({
        "X-RateLimit-Limit": context.options.maxAttempts.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.resetTime.toISOString(),
      });

      if (!result.allowed) {
        if (result.retryAfter) {
          res.set("Retry-After", Math.ceil(result.retryAfter / 1000).toString());
        }

        res.status(429).json({
          error: "Too Many Requests",
          message: result.reason,
          retryAfter: result.retryAfter,
        });
        return;
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
