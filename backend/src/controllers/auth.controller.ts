import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth/auth.service';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, username, password, bankroll, risk_appetite } = req.body;

      if (!email || !username || !password) {
        throw new AppError('Email, username, and password are required', 400);
      }

      if (password.length < 8) {
        throw new AppError('Password must be at least 8 characters long', 400);
      }

      const result = await this.authService.register({
        email,
        username,
        password,
        bankroll,
        risk_appetite,
      });

      res.status(201).json({
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        logger.error('Registration error', error);
        next(new AppError((error as Error).message, 400));
      }
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      const result = await this.authService.login({ email, password });

      res.json({
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        logger.error('Login error', error);
        next(new AppError((error as Error).message, 401));
      }
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
      }

      const tokens = await this.authService.refreshToken(refreshToken);

      res.json({
        message: 'Token refreshed successfully',
        data: tokens,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        logger.error('Token refresh error', error);
        next(new AppError((error as Error).message, 401));
      }
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { UserModel } = await import('../models/User');
      const userModel = new UserModel();
      const user = await userModel.findById(req.user.userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const { password_hash, ...userWithoutPassword } = user;

      res.json({
        data: userWithoutPassword,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        logger.error('Get profile error', error);
        next(new AppError('Failed to get user profile', 500));
      }
    }
  };
}
