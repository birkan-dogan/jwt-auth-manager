// Composable rate limiting pipeline

import { createRateLimitMiddleware } from "../../../middleware/createRateLimitMiddleware";
import { createRecordAttemptMiddleware } from "../../../middleware/createRecordAttemptMiddleware";

import { RateLimitContext } from "../../../types/security/rateLimiting";

export const createRateLimitPipeline = (context: RateLimitContext) => {
  const rateLimitMiddleware = createRateLimitMiddleware(context);
  const recordMiddleware = createRecordAttemptMiddleware(context);

  return [rateLimitMiddleware, recordMiddleware];
};
