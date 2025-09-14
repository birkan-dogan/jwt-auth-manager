import {
  BruteForceEntry,
  RateLimitContext,
  RateLimitEntry,
} from "../../../types/security/rateLimiting";

export const unlockUser = async (
  userId: string,
  context: RateLimitContext
): Promise<void> => {
  await context.storage.clearBruteForceEntry(userId);
};

export const unlockIP = async (
  identifier: string,
  context: RateLimitContext
): Promise<void> => {
  const key = context.options.keyGenerator(identifier);
  await context.storage.clearRateLimitEntry(key);
};

export const getRateLimitStatus = async (
  identifier: string,
  context: RateLimitContext,
  userId?: string
): Promise<{
  rateLimit: RateLimitEntry | null;
  bruteForce: BruteForceEntry | null;
}> => {
  const key = context.options.keyGenerator(identifier);
  const rateLimit = await context.storage.getRateLimitEntry(key);
  const bruteForce = userId
    ? await context.storage.getBruteForceEntry(userId)
    : null;

  return { rateLimit, bruteForce };
};
