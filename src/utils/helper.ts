import crypto from "crypto";

// types
import {
  AuthContext,
  SecurityOptions,
  TokenConfig,
  TokenStorage,
} from "../types";

// Parsing expiry string to milliseconds
export const parseExpiry = (expiry: string): number => {
  const units: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

  const [, amount, unit] = match;
  return parseInt(amount) * units[unit];
};

// Generating device hash from fingerprint

export const generateDeviceHash = (fingerprint: string): string =>
  crypto.createHash("sha256").update(fingerprint).digest("hex");

// Generating random JWT ID
export const generateJti = (): string => crypto.randomUUID();

// Creating auth context with default values
export const createAuthContext = (
  config: TokenConfig,
  storage: TokenStorage,
  securityOptions: SecurityOptions = {}
): AuthContext => ({
  config: {
    accessTokenSecret: config.accessTokenSecret,
    refreshTokenSecret: config.refreshTokenSecret,
    accessTokenExpiry: config.accessTokenExpiry || "15m",
    refreshTokenExpiry: config.refreshTokenExpiry || "7d",
  },
  securityOptions: {
    enableTokenRotation: securityOptions.enableTokenRotation ?? true,
    enableConcurrentUsageDetection:
      securityOptions.enableConcurrentUsageDetection ?? true,
    enableDeviceFingerprinting:
      securityOptions.enableDeviceFingerprinting ?? false,
    enableLocationTracking: securityOptions.enableLocationTracking ?? false,
    maxConcurrentTokens: securityOptions.maxConcurrentTokens ?? 5,
  },
  storage,
});
