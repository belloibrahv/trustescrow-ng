// apps/api/src/services/auth/admin-auth.service.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

interface AdminUser {
  id: string;
  username: string;
  role: 'admin' | 'super_admin';
}

interface AdminCredentials {
  username: string;
  password: string;
}

// In production, this should be in a database
// For MVP, we'll use environment variables
const ADMIN_USERS: Record<string, { passwordHash: string; role: 'admin' | 'super_admin' }> = {};

/**
 * Initialize admin users from environment variables
 * Format: ADMIN_USERS={"username":"password"}
 */
export function initializeAdminUsers(): void {
  try {
    const adminUsersEnv = process.env.ADMIN_USERS;
    if (adminUsersEnv) {
      const users = JSON.parse(adminUsersEnv);
      for (const [username, password] of Object.entries(users)) {
        // Hash password on startup
        const passwordHash = bcrypt.hashSync(password as string, 10);
        ADMIN_USERS[username] = {
          passwordHash,
          role: username === 'admin' ? 'super_admin' : 'admin',
        };
        logger.info({ username }, 'Admin user initialized');
      }
    } else {
      // Default admin for development
      const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
      ADMIN_USERS['admin'] = {
        passwordHash: bcrypt.hashSync(defaultPassword, 10),
        role: 'super_admin',
      };
      logger.warn('Using default admin credentials - CHANGE IN PRODUCTION!');
    }
  } catch (error) {
    logger.error({ error }, 'Failed to initialize admin users');
    // Fallback: create default admin
    ADMIN_USERS['admin'] = {
      passwordHash: bcrypt.hashSync('admin123', 10),
      role: 'super_admin',
    };
  }
}

/**
 * Authenticate admin user and generate JWT token
 */
export async function authenticateAdmin(
  credentials: AdminCredentials
): Promise<{ success: boolean; token?: string; error?: string }> {
  const { username, password } = credentials;

  // Check if user exists
  const user = ADMIN_USERS[username];
  if (!user) {
    logger.warn({ username }, 'Login attempt with unknown username');
    return { success: false, error: 'Invalid username or password' };
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    logger.warn({ username }, 'Login attempt with invalid password');
    return { success: false, error: 'Invalid username or password' };
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      id: username,
      username,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    } as AdminUser,
    env.ADMIN_JWT_SECRET,
    {
      expiresIn: '24h', // Token expires in 24 hours
    }
  );

  logger.info({ username, role: user.role }, 'Admin user logged in');

  return {
    success: true,
    token,
  };
}

/**
 * Verify JWT token and return admin user
 */
export function verifyAdminToken(token: string): AdminUser | null {
  try {
    const decoded = jwt.verify(token, env.ADMIN_JWT_SECRET) as AdminUser;
    return decoded;
  } catch (error) {
    logger.debug({ error }, 'Invalid admin token');
    return null;
  }
}

/**
 * Refresh JWT token (extend expiration)
 */
export function refreshAdminToken(currentToken: string): string | null {
  const admin = verifyAdminToken(currentToken);
  if (!admin) return null;

  // Issue new token
  return jwt.sign(
    {
      id: admin.id,
      username: admin.username,
      role: admin.role,
      iat: Math.floor(Date.now() / 1000),
    } as AdminUser,
    env.ADMIN_JWT_SECRET,
    {
      expiresIn: '24h',
    }
  );
}

/**
 * Change admin password
 */
export async function changeAdminPassword(
  username: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const user = ADMIN_USERS[username];
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return { success: false, error: 'Current password is incorrect' };
  }

  // Hash and update new password
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  
  logger.info({ username }, 'Admin password changed');
  
  return { success: true };
}
