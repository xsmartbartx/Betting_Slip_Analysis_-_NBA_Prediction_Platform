import bcrypt from 'bcrypt';
import { UserModel } from '../../models/User';
import { JWTService, JWTPayload, TokenPair } from './jwt.service';
import { User } from '../../types';
import { logger } from '../../config/logger';

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  bankroll?: number;
  risk_appetite?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  user: Omit<User, 'password_hash'>;
  tokens: TokenPair;
}

export class AuthService {
  private userModel: UserModel;

  constructor() {
    this.userModel = new UserModel();
  }

  async register(data: RegisterData): Promise<AuthResult> {
    // Check if user already exists
    const existingUserByEmail = await this.userModel.findByEmail(data.email);
    if (existingUserByEmail) {
      throw new Error('User with this email already exists');
    }

    const existingUserByUsername = await this.userModel.findByUsername(data.username);
    if (existingUserByUsername) {
      throw new Error('User with this username already exists');
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(data.password, saltRounds);

    // Create user
    const user = await this.userModel.create({
      email: data.email,
      username: data.username,
      password_hash,
      bankroll: data.bankroll,
      risk_appetite: data.risk_appetite,
    });

    // Create default preferences
    await this.userModel.createUserPreferences(user.id, {});

    // Generate tokens
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };
    const tokens = JWTService.generateTokenPair(payload);

    // Remove password_hash from user object
    const { password_hash: _, ...userWithoutPassword } = user;

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  async login(data: LoginData): Promise<AuthResult> {
    // Find user by email
    const user = await this.userModel.findByEmail(data.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await this.userModel.updateLastLogin(user.id);

    // Generate tokens
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };
    const tokens = JWTService.generateTokenPair(payload);

    // Remove password_hash from user object
    const { password_hash: _, ...userWithoutPassword } = user;

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = JWTService.verifyRefreshToken(refreshToken);
      
      // Verify user still exists and is active
      const user = await this.userModel.findById(payload.userId);
      if (!user || !user.is_active) {
        throw new Error('User not found or inactive');
      }

      // Generate new token pair
      const newPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
      };
      
      return JWTService.generateTokenPair(newPayload);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async validatePassword(userId: string, password: string): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return false;
    }

    return bcrypt.compare(password, user.password_hash);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const isValid = await this.validatePassword(userId, oldPassword);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    await this.userModel.update(userId, { password_hash });
    logger.info('Password changed successfully', { userId });
  }
}
