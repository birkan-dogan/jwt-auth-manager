import { Response, NextFunction } from "express";
import { recordAttempt } from "../security/rateLimiting/utils/rateLimitingFunctions";
import { RateLimitContext } from "../types/security/rateLimiting";
import { RateLimitRequest } from "./createRateLimitMiddleware";

export const createRecordAttemptMiddleware = (context: RateLimitContext) => {
  return (req: RateLimitRequest, res: Response, next: NextFunction): void => {
    const originalSend = res.send.bind(res);

    res.send = async function (
      body?: unknown
    ): Promise<Response<any, Record<string, any>> | void> {
      // Determine if request was successful based on status code
      const success = res.statusCode >= 200 && res.statusCode < 400;

      if (req.rateLimitData) {
        try {
          await recordAttempt(
            req.rateLimitData.identifier,
            context,
            success,
            req.rateLimitData.userId
          );
        } catch (error) {
          console.error("Failed to record attempt:", error);
        }
      }

      return originalSend(body);
    } as unknown as typeof res.send;

    next();
  };
};
