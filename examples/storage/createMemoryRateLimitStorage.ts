import {
  RateLimitStorage,
  RateLimitEntry,
  BruteForceEntry,
} from "../../src/types/security/rateLimiting";

// Memory-based storage implementation
export const createMemoryRateLimitStorage = (): RateLimitStorage => {
  const rateLimitEntries = new Map<string, RateLimitEntry>();
  const bruteForceEntries = new Map<string, BruteForceEntry>();

  return {
    async getRateLimitEntry(key: string): Promise<RateLimitEntry | null> {
      return rateLimitEntries.get(key) || null;
    },

    async saveRateLimitEntry(
      key: string,
      entry: RateLimitEntry,
      ttl: number
    ): Promise<void> {
      rateLimitEntries.set(key, entry);

      // Auto-cleanup after TTL
      setTimeout(() => {
        rateLimitEntries.delete(key);
      }, ttl);
    },

    async incrementAttempts(key: string, ttl: number): Promise<RateLimitEntry> {
      const now = new Date();
      const existing = rateLimitEntries.get(key);

      const entry: RateLimitEntry = existing
        ? {
            ...existing,
            attempts: existing.attempts + 1,
            lastAttempt: now,
          }
        : {
            attempts: 1,
            firstAttempt: now,
            lastAttempt: now,
          };

      await this.saveRateLimitEntry(key, entry, ttl);
      return entry;
    },

    async clearRateLimitEntry(key: string): Promise<void> {
      rateLimitEntries.delete(key);
    },

    async getBruteForceEntry(userId: string): Promise<BruteForceEntry | null> {
      return bruteForceEntries.get(userId) || null;
    },

    async saveBruteForceEntry(
      userId: string,
      entry: BruteForceEntry,
      ttl: number
    ): Promise<void> {
      bruteForceEntries.set(userId, entry);

      // Auto-cleanup after TTL
      setTimeout(() => {
        bruteForceEntries.delete(userId);
      }, ttl);
    },

    async incrementFailedAttempts(
      userId: string,
      ttl: number
    ): Promise<BruteForceEntry> {
      const now = new Date();
      const existing = bruteForceEntries.get(userId);

      const entry: BruteForceEntry = existing
        ? {
            ...existing,
            failedAttempts: existing.failedAttempts + 1,
            lastFailedAttempt: now,
          }
        : {
            userId,
            failedAttempts: 1,
            lastFailedAttempt: now,
          };

      await this.saveBruteForceEntry(userId, entry, ttl);
      return entry;
    },

    async clearBruteForceEntry(userId: string): Promise<void> {
      bruteForceEntries.delete(userId);
    },

    async cleanupExpiredEntries(): Promise<void> {
      const now = new Date();

      // Cleanup rate limit entries
      for (const [key, entry] of rateLimitEntries.entries()) {
        if (entry.blockedUntil && entry.blockedUntil < now) {
          rateLimitEntries.delete(key);
        }
      }

      // Cleanup brute force entries
      for (const [userId, entry] of bruteForceEntries.entries()) {
        if (entry.lockedUntil && entry.lockedUntil < now) {
          bruteForceEntries.delete(userId);
        }
      }
    },
  };
};
