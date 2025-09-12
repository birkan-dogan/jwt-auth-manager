import jwt, { VerifyOptions } from "jsonwebtoken";

// types
import { AuthContext, Result } from "../types";

// verifying access token
export const verifyAccessToken = (
  token: string,
  context: AuthContext
): Result<any> => {
  try {
    const options: VerifyOptions = {
      // JWT verification options if needed
    };

    const decoded = jwt.verify(
      token,
      context.config.accessTokenSecret,
      options
    );
    return { success: true, data: decoded };
  } catch (error) {
    return {
      success: false,
      error: new Error("Invalid or expired access token"),
    };
  }
};

// verifying refresh token
export const verifyRefreshToken = (
  token: string,
  context: AuthContext
): Result<any> => {
  try {
    const options: VerifyOptions = {
      // JWT verification options if needed
    };

    const decoded = jwt.verify(
      token,
      context.config.refreshTokenSecret,
      options
    );
    return { success: true, data: decoded };
  } catch (error) {
    return {
      success: false,
      error: new Error("Invalid or expired refresh token"),
    };
  }
};
