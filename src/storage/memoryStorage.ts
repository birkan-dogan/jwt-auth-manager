// In-memory storage implementation (for development/testing)

import { RefreshTokenData, TokenStorage } from "../types";

export const createMemoryStorage = (): TokenStorage => {
  const tokens = new Map<string, RefreshTokenData>();
  let idCounter = 1;

  return {
    async saveRefreshToken(data: Omit<RefreshTokenData, 'id'>): Promise<string> {
      const id = (idCounter++).toString();
      const tokenData: RefreshTokenData = { ...data, id };
      tokens.set(data.token, tokenData);
      return id;
    },

    async getRefreshToken(token: string): Promise<RefreshTokenData | null> {
      return tokens.get(token) || null;
    },

    async invalidateRefreshToken(token: string): Promise<void> {
      tokens.delete(token);
    },

    async invalidateAllUserTokens(userId: string | number): Promise<void> {
      for (const [token, data] of tokens.entries()) {
        if (data.userId === userId) {
          tokens.delete(token);
        }
      }
    },

    async markTokenAsUsed(token: string): Promise<void> {
      const tokenData = tokens.get(token);
      if (tokenData) {
        tokenData.isUsed = true;
        tokens.set(token, tokenData);
      }
    },

    async cleanupExpiredTokens(): Promise<void> {
      const now = new Date();
      for (const [token, data] of tokens.entries()) {
        if (data.expiresAt < now) {
          tokens.delete(token);
        }
      }
    }
  };
};