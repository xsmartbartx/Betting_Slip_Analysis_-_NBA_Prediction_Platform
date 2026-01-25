import { Request, Response, NextFunction } from 'express';
import { JWTService, JWTPayload } from '../services/auth/jwt.service';
import { UserModel } from '../models/User';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const payload = JWTService.verifyAccessToken(token);
    
    // Verify user still exists and is active
    const userModel = new UserModel();
    const user = await userModel.findById(payload.userId);
    
    if (!user || !user.is_active) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    req.user = payload;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const payload = JWTService.verifyAccessToken(token);
      const userModel = new UserModel();
      const user = await userModel.findById(payload.userId);
      
      if (user && user.is_active) {
        req.user = payload;
      }
    }
    
    next();
  } catch {
    // If token is invalid, continue without authentication
    next();
  }
};
