import { recordAttempt } from "../security/rateLimiting/utils/rateLimitingFunctions";
import { RateLimitContext } from "../types/security/rateLimiting";

export const createRecordAttemptMiddleware = (context: RateLimitContext) => {
  return (req: any, res: any, next: any) => {
    const originalSend = res.send;

    res.send = async function (body: any) {
      // Determine if request was successful based on status code
      const success = res.statusCode >= 200 && res.statusCode < 400;

      if (req.rateLimitData) {
        await recordAttempt(
          req.rateLimitData.identifier,
          context,
          success,
          req.rateLimitData.userId
        );
      }

      return originalSend.call(this, body);
    };

    next();
  };
};
