// functions
import { performSecurityChecks } from "./securityChecks";
import { generateTokenPair } from "./tokenGeneration";
import { verifyRefreshToken } from "./tokenVerification";

// types
import { AuthContext, DeviceInfo, TokenPair, User } from "../types";


// Refresh token pair
export const refreshTokens = async (
  refreshToken: string,
  context: AuthContext,
  deviceInfo?: DeviceInfo
): Promise<TokenPair> => {
  // Verify refresh token
  const verificationResult = verifyRefreshToken(refreshToken, context);
  if (!verificationResult.success) {
    throw verificationResult.error;
  }
  
  const decoded = verificationResult.data;
  
  // Get token data from storage
  const tokenData = await context.storage.getRefreshToken(refreshToken);
  if (!tokenData) {
    throw new Error('Invalid refresh token');
  }

  // Perform security checks
  await performSecurityChecks(tokenData, decoded, context, deviceInfo);

  // Create user object (you might want to fetch full user data)
  const user: User = { id: decoded.userId };

  // Mark old token as used if rotation is enabled
  if (context.securityOptions.enableTokenRotation) {
    await context.storage.markTokenAsUsed(refreshToken);
  }

  // Generate new token pair
  return generateTokenPair(user, context, deviceInfo);
};