/*

import { TokenStorage, RefreshTokenData } from 'jwt-auth-manager';
import { createClient, RedisClientType } from 'redis';

// Create Redis client
const redisClient: RedisClientType = createClient();

// Redis storage implementation for JWT Auth Manager
//
// Features:
// - Automatic token expiration using Redis TTL
// - High performance with in-memory storage
// - Atomic operations for concurrent safety
// - Built-in cleanup (no manual cleanup needed)
// - Scalable for distributed systems


export interface RedisRefreshToken {
  userId: string | number;
  token: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  isUsed: boolean;
  usedAt?: string; // ISO string
  createdAt: string; // ISO string
  expiresAt: string; // ISO string
}

// Create Redis storage with automatic TTL management

export const createRedisStorage = (redis: RedisClientType): TokenStorage => {
  // Key prefixes for organization
  const TOKEN_PREFIX = 'jwt:token:';
  const USER_PREFIX = 'jwt:user:';
  const USED_PREFIX = 'jwt:used:';

  // Helper functions
  const getTokenKey = (token: string) => `${TOKEN_PREFIX}${token}`;
  const getUserKey = (userId: string | number) => `${USER_PREFIX}${userId}`;
  const getUsedKey = (token: string) => `${USED_PREFIX}${token}`;

  const calculateTTL = (expiresAt: Date): number => {
    const now = Date.now();
    const expiry = expiresAt.getTime();
    return Math.max(1, Math.ceil((expiry - now) / 1000)); // TTL in seconds
  };

  return {
    async saveRefreshToken(data: Omit<RefreshTokenData, 'id'>): Promise<string> {
      const id = crypto.randomUUID();
      const ttl = calculateTTL(data.expiresAt);

      const redisData: RedisRefreshToken = {
        userId: data.userId,
        token: data.token,
        deviceFingerprint: data.deviceFingerprint,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        isUsed: data.isUsed,
        usedAt: data.isUsed ? new Date().toISOString() : undefined,
        createdAt: data.createdAt.toISOString(),
        expiresAt: data.expiresAt.toISOString()
      };

      // Use Redis transaction for atomic operations
      const multi = redis.multi();

      // Save token data with TTL
      multi.setEx(
        getTokenKey(data.token), 
        ttl, 
        JSON.stringify(redisData)
      );

      // Add token to user's token set with TTL
      multi.sAdd(getUserKey(data.userId), data.token);
      multi.expire(getUserKey(data.userId), ttl);

      await multi.exec();
      return id;
    },

    async getRefreshToken(token: string): Promise<RefreshTokenData | null> {
      const tokenKey = getTokenKey(token);
      const data = await redis.get(tokenKey);

      if (!data) return null;

      try {
        const parsed: RedisRefreshToken = JSON.parse(data);

        // Redis TTL handles expiry, but double-check
        const now = new Date();
        const expiresAt = new Date(parsed.expiresAt);

        if (expiresAt < now) {
          // Token expired, clean up
          await redis.del(tokenKey);
          return null;
        }

        return {
          id: token, // Use token as ID for Redis
          userId: parsed.userId,
          token: parsed.token,
          deviceFingerprint: parsed.deviceFingerprint,
          ipAddress: parsed.ipAddress,
          userAgent: parsed.userAgent,
          isUsed: parsed.isUsed,
          createdAt: new Date(parsed.createdAt),
          expiresAt: new Date(parsed.expiresAt)
        };
      } catch (error) {
        console.error('Redis token parsing error:', error);
        await redis.del(tokenKey);
        return null;
      }
    },

    async invalidateRefreshToken(token: string): Promise<void> {
      const tokenKey = getTokenKey(token);
      
      // Get token data to find userId
      const data = await redis.get(tokenKey);
      if (data) {
        try {
          const parsed: RedisRefreshToken = JSON.parse(data);
          
          // Use transaction for atomic cleanup
          const multi = redis.multi();
          multi.del(tokenKey);
          multi.sRem(getUserKey(parsed.userId), token);
          await multi.exec();
        } catch (error) {
          // If parsing fails, just delete the token
          await redis.del(tokenKey);
        }
      }
    },

    async invalidateAllUserTokens(userId: string | number): Promise<void> {
      const userKey = getUserKey(userId);
      
      // Get all user tokens
      const tokens = await redis.sMembers(userKey);
      
      if (tokens.length > 0) {
        // Use transaction for atomic cleanup
        const multi = redis.multi();
        
        // Delete all token data
        tokens.forEach(token => {
          multi.del(getTokenKey(token));
          multi.del(getUsedKey(token));
        });
        
        // Delete user token set
        multi.del(userKey);
        
        await multi.exec();
      }
    },

    async markTokenAsUsed(token: string): Promise<void> {
      const tokenKey = getTokenKey(token);
      const usedKey = getUsedKey(token);
      
      // Get current token data
      const data = await redis.get(tokenKey);
      if (!data) return;

      try {
        const parsed: RedisRefreshToken = JSON.parse(data);
        parsed.isUsed = true;
        parsed.usedAt = new Date().toISOString();

        // Calculate remaining TTL
        const remainingTTL = await redis.ttl(tokenKey);
        
        // Use transaction for atomic update
        const multi = redis.multi();
        
        // Update token data
        multi.setEx(tokenKey, remainingTTL, JSON.stringify(parsed));
        
        // Mark as used with same TTL
        multi.setEx(usedKey, remainingTTL, '1');
        
        await multi.exec();
      } catch (error) {
        console.error('Redis mark token as used error:', error);
      }
    },

    async cleanupExpiredTokens(): Promise<void> {
      // Redis TTL handles cleanup automatically
      // This method can be empty or used for additional cleanup logic
      console.log('Redis TTL handles expired tokens automatically');
    }
  };
};

// Enhanced Redis storage with additional features

export const createEnhancedRedisStorage = (redis: RedisClientType): TokenStorage & {
  getUserTokens: (userId: string | number) => Promise<RefreshTokenData[]>;
  getTokenStats: () => Promise<{ total: number; active: number; used: number }>;
  revokeTokensByDevice: (deviceFingerprint: string) => Promise<number>;
  getTokensByIP: (ipAddress: string) => Promise<RefreshTokenData[]>;
  flushAllTokens: () => Promise<void>;
} => {
  const baseStorage = createRedisStorage(redis);
  const TOKEN_PREFIX = 'jwt:token:';
  const USER_PREFIX = 'jwt:user:';
  const DEVICE_PREFIX = 'jwt:device:';
  const IP_PREFIX = 'jwt:ip:';

  return {
    ...baseStorage,

    // Override saveRefreshToken to add device and IP tracking
    async saveRefreshToken(data: Omit<RefreshTokenData, 'id'>): Promise<string> {
      const id = await baseStorage.saveRefreshToken(data);
      const ttl = Math.max(1, Math.ceil((data.expiresAt.getTime() - Date.now()) / 1000));

      // Additional indexing for enhanced features
      const multi = redis.multi();

      if (data.deviceFingerprint) {
        multi.sAdd(`${DEVICE_PREFIX}${data.deviceFingerprint}`, data.token);
        multi.expire(`${DEVICE_PREFIX}${data.deviceFingerprint}`, ttl);
      }

      if (data.ipAddress) {
        multi.sAdd(`${IP_PREFIX}${data.ipAddress}`, data.token);
        multi.expire(`${IP_PREFIX}${data.ipAddress}`, ttl);
      }

      await multi.exec();
      return id;
    },

    // Get all tokens for a user
    async getUserTokens(userId: string | number): Promise<RefreshTokenData[]> {
      const userKey = `${USER_PREFIX}${userId}`;
      const tokens = await redis.sMembers(userKey);

      const tokenDataPromises = tokens.map(async (token) => {
        const data = await redis.get(`${TOKEN_PREFIX}${token}`);
        if (!data) return null;

        try {
          const parsed: RedisRefreshToken = JSON.parse(data);
          return {
            id: token,
            userId: parsed.userId,
            token: parsed.token,
            deviceFingerprint: parsed.deviceFingerprint,
            ipAddress: parsed.ipAddress,
            userAgent: parsed.userAgent,
            isUsed: parsed.isUsed,
            createdAt: new Date(parsed.createdAt),
            expiresAt: new Date(parsed.expires
*/
