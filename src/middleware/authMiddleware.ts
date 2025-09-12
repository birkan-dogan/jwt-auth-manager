// authentication middleware

import { Request, Response, NextFunction } from 'express';

// functions
import { verifyAccessToken } from '../core/tokenVerification';

// types
import { AuthContext } from '../types';

export interface AuthRequest extends Request {
  user?: any;
}


export const createAuthMiddleware = (context: AuthContext) => 
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      res.status(401).json({ 
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
      return;
    }

    const verificationResult = verifyAccessToken(token, context);
    
    if (!verificationResult.success) {
      res.status(403).json({ 
        error: verificationResult.error.message,
        code: 'TOKEN_INVALID'
      });
      return;
    }

    req.user = verificationResult.data;
    next();
  };