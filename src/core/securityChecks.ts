// functions
import { generateDeviceHash } from '../utils/helper';

// types
import { RefreshTokenData, DeviceInfo, AuthContext } from '../types';

// Controlling for concurrent token usage
export const checkConcurrentUsage = async (
  tokenData: RefreshTokenData,
  context: AuthContext
): Promise<void> => {
  if (context.securityOptions.enableConcurrentUsageDetection && tokenData.isUsed) {
    await context.storage.invalidateAllUserTokens(tokenData.userId);
    throw new Error('Concurrent token usage detected. All tokens invalidated.');
  }
};

// Checking device fingerprint
export const checkDeviceFingerprint = (
  decoded: any,
  deviceInfo?: DeviceInfo
): void => {
  if (decoded.deviceHash && deviceInfo?.fingerprint) {
    const currentDeviceHash = generateDeviceHash(deviceInfo.fingerprint);
    if (decoded.deviceHash !== currentDeviceHash) {
      throw new Error('Device mismatch detected');
    }
  }
};

// Checking token expiry
export const checkTokenExpiry = async (
  tokenData: RefreshTokenData,
  context: AuthContext
): Promise<void> => {
  if (tokenData.expiresAt < new Date()) {
    await context.storage.invalidateRefreshToken(tokenData.token);
    throw new Error('Refresh token expired');
  }
};

// Performing all security checks
export const performSecurityChecks = async (
  tokenData: RefreshTokenData,
  decoded: any,
  context: AuthContext,
  deviceInfo?: DeviceInfo
): Promise<void> => {
  await checkConcurrentUsage(tokenData, context);
  
  if (context.securityOptions.enableDeviceFingerprinting) {
    checkDeviceFingerprint(decoded, deviceInfo);
  }
  
  await checkTokenExpiry(tokenData, context);
};