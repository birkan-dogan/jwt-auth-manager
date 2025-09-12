import jwt, { SignOptions } from "jsonwebtoken";

// functions
import { parseExpiry, generateDeviceHash, generateJti } from "../utils/helper";

// types
import {
  User,
  TokenPair,
  AuthContext,
  DeviceInfo,
  RefreshTokenData,
} from "../types";

// Generating access token
export const generateAccessToken = (
  user: User,
  context: AuthContext
): string => {
  const payload = {
    userId: user.id,
    email: user.email,
    type: "access",
  };

  const options: SignOptions = {
    expiresIn: context.config.accessTokenExpiry as any,
  };

  return jwt.sign(payload, context.config.accessTokenSecret, options);
};

// Generating refresh token
export const generateRefreshToken = (
  user: User,
  context: AuthContext,
  deviceInfo?: DeviceInfo
): string => {
  const payload: any = {
    userId: user.id,
    type: "refresh",
    jti: generateJti(),
  };

  if (
    context.securityOptions.enableDeviceFingerprinting &&
    deviceInfo?.fingerprint
  ) {
    payload.deviceHash = generateDeviceHash(deviceInfo.fingerprint);
  }

  const options: SignOptions = {
    expiresIn: context.config.accessTokenExpiry as any,
  };

  return jwt.sign(payload, context.config.refreshTokenSecret, options);
};

// Generating both access and refresh tokens
export const generateTokenPair = async (
  user: User,
  context: AuthContext,
  deviceInfo?: DeviceInfo
): Promise<TokenPair> => {
  const accessToken = generateAccessToken(user, context);
  const refreshToken = generateRefreshToken(user, context, deviceInfo);

  // Save refresh token to storage
  const refreshTokenData: Omit<RefreshTokenData, "id"> = {
    userId: user.id,
    token: refreshToken,
    deviceFingerprint: deviceInfo?.fingerprint,
    ipAddress: deviceInfo?.ipAddress,
    userAgent: deviceInfo?.userAgent,
    isUsed: false,
    createdAt: new Date(),
    expiresAt: new Date(
      Date.now() + parseExpiry(context.config.refreshTokenExpiry)
    ),
  };

  await context.storage.saveRefreshToken(refreshTokenData);

  return { accessToken, refreshToken };
};
