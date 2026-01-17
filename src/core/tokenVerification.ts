import jwt, { VerifyOptions, JwtPayload } from "jsonwebtoken";

// types
import { AuthContext, Result, AccessTokenPayload, RefreshTokenPayload } from "../types";

// verifying access token
export const verifyAccessToken = (
  token: string,
  context: AuthContext
): Result<AccessTokenPayload> => {
  try {
    const options: VerifyOptions = {
      // JWT verification options if needed
    };

    const decoded = jwt.verify(
      token,
      context.config.accessTokenSecret,
      options
    ) as JwtPayload & AccessTokenPayload;
    
    if (decoded.type !== "access") {
      return {
        success: false,
        error: new Error("Invalid token type"),
      };
    }
    
    return { success: true, data: decoded };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Invalid or expired access token"),
    };
  }
};

// verifying refresh token
export const verifyRefreshToken = (
  token: string,
  context: AuthContext
): Result<RefreshTokenPayload> => {
  try {
    const options: VerifyOptions = {
      // JWT verification options if needed
    };

    const decoded = jwt.verify(
      token,
      context.config.refreshTokenSecret,
      options
    ) as JwtPayload & RefreshTokenPayload;
    
    if (decoded.type !== "refresh") {
      return {
        success: false,
        error: new Error("Invalid token type"),
      };
    }
    
    return { success: true, data: decoded };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Invalid or expired refresh token"),
    };
  }
};
