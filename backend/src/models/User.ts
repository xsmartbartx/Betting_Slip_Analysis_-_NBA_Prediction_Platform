import { Pool } from 'pg';
import { getDatabasePool } from '../config/database';
import { User, UserPreferences } from '../types';

export class UserModel {
  private pool: Pool;

  constructor() {
    this.pool = getDatabasePool();
  }

  async create(userData: {
    email: string;
    username: string;
    password_hash: string;
    bankroll?: number;
    risk_appetite?: string;
  }): Promise<User> {
    const query = `
      INSERT INTO users (email, username, password_hash, bankroll, risk_appetite)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      userData.email,
      userData.username,
      userData.password_hash,
      userData.bankroll || 0,
      userData.risk_appetite || 'balanced',
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.pool.query(query, [email]);
    return result.rows[0] || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await this.pool.query(query, [username]);
    return result.rows[0] || null;
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async updateLastLogin(id: string): Promise<void> {
    const query = `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await this.pool.query(query, [id]);
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const query = 'SELECT * FROM user_preferences WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  async createUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    const query = `
      INSERT INTO user_preferences (user_id, preferred_sports, notification_enabled, email_notifications, dashboard_layout)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      userId,
      preferences.preferred_sports || ['NBA'],
      preferences.notification_enabled ?? true,
      preferences.email_notifications ?? false,
      preferences.dashboard_layout || null,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    Object.entries(preferences).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'user_id' && key !== 'created_at') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.getUserPreferences(userId);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `
      UPDATE user_preferences
      SET ${fields.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }
}
