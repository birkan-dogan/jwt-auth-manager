export { generateTokenPair } from "./core/tokenGeneration";
export { refreshTokens } from "./core/tokenRefresh";

export {
  verifyAccessToken,
  verifyRefreshToken,
} from "./core/tokenVerification";

export {
  logoutUser,
  logoutDevice,
  cleanupExpiredTokens,
} from "./core/tokenInvalidation";

// Middlewares
export { createAuthMiddleware } from "./middleware/authMiddleware";
export { createRateLimitMiddleware } from "./middleware/createRateLimitMiddleware";
export { createRecordAttemptMiddleware } from "./middleware/createRecordAttemptMiddleware";

// Rate Limiting & Security
export { createRateLimitContext } from "./security/rateLimiting/createRateLimitContext";
export { checkRateLimit } from "./security/rateLimiting/utils/rateLimitingFunctions";
export { recordAttempt } from "./security/rateLimiting/utils/rateLimitingFunctions";
export { unlockUser } from "./security/rateLimiting/utils/managementFunctions";
export { unlockIP } from "./security/rateLimiting/utils/managementFunctions";
export { getRateLimitStatus } from "./security/rateLimiting/utils/managementFunctions";
export { createRateLimitPipeline } from "./security/rateLimiting/utils/createRateLimitPipeline";

// Storage implementations
export { createMemoryStorage } from "./storage/memoryStorage";

// Utils
export { createAuthContext } from "./utils/helper";

// Types
export * from "./types";
export * from "./types/security/rateLimiting"; // Rate limiting types
