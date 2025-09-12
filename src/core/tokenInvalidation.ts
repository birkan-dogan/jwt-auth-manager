import { AuthContext } from "../types";

// Logout user from all devices
export const logoutUser = async (
  userId: string | number,
  context: AuthContext
): Promise<void> => {
  await context.storage.invalidateAllUserTokens(userId);
};

// Logout from specific device
export const logoutDevice = async (
  refreshToken: string,
  context: AuthContext
): Promise<void> => {
  await context.storage.invalidateRefreshToken(refreshToken);
};

// Cleanup expired tokens
export const cleanupExpiredTokens = async (
  context: AuthContext
): Promise<void> => {
  await context.storage.cleanupExpiredTokens();
};