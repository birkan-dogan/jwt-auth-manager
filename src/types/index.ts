export interface User {
  id: string | number;
  email?: string;
  [key: string]: any;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiry?: string;
  refreshTokenExpiry?: string;
}

export interface RefreshTokenData {
  id: string;
  userId: string | number;
  token: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  isUsed: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export interface SecurityOptions {
  enableTokenRotation?: boolean;
  enableConcurrentUsageDetection?: boolean;
  enableDeviceFingerprinting?: boolean;
  enableLocationTracking?: boolean;
  maxConcurrentTokens?: number;
}

export interface DeviceInfo {
  fingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}

export interface TokenStorage {
  saveRefreshToken(data: Omit<RefreshTokenData, "id">): Promise<string>;
  getRefreshToken(token: string): Promise<RefreshTokenData | null>;
  invalidateRefreshToken(token: string): Promise<void>;
  invalidateAllUserTokens(userId: string | number): Promise<void>;
  markTokenAsUsed(token: string): Promise<void>;
  cleanupExpiredTokens(): Promise<void>;
}

export interface AuthContext {
  config: Required<TokenConfig>;
  securityOptions: Required<SecurityOptions>;
  storage: TokenStorage;
}

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export interface AccessTokenPayload {
  userId: string | number;
  email?: string;
  type: "access";
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string | number;
  type: "refresh";
  jti: string;
  deviceHash?: string;
  iat?: number;
  exp?: number;
}
