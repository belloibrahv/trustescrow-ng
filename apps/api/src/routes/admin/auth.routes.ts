// apps/api/src/routes/admin/auth.routes.ts
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  authenticateAdmin,
  verifyAdminToken,
  refreshAdminToken,
  changeAdminPassword,
} from '../../services/auth/admin-auth.service';
import { logger } from '../../utils/logger';

export const authRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/admin/auth/login - Admin login
  app.post('/login', async (request, reply) => {
    const loginSchema = z.object({
      username: z.string().min(3),
      password: z.string().min(6),
    });

    try {
      const credentials = loginSchema.parse(request.body);
      const result = await authenticateAdmin(credentials);

      if (!result.success) {
        return reply.code(401).send({ error: result.error });
      }

      return {
        success: true,
        token: result.token,
        message: 'Login successful',
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid credentials format' });
      }
      logger.error({ error }, 'Login error');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // GET /api/admin/auth/me - Get current admin user
  app.get('/me', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'No token provided' });
    }

    const token = authHeader.slice(7);
    const admin = verifyAdminToken(token);

    if (!admin) {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }

    return {
      id: admin.id,
      username: admin.username,
      role: admin.role,
    };
  });

  // POST /api/admin/auth/refresh - Refresh token
  app.post('/refresh', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'No token provided' });
    }

    const currentToken = authHeader.slice(7);
    const newToken = refreshAdminToken(currentToken);

    if (!newToken) {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }

    return {
      success: true,
      token: newToken,
      message: 'Token refreshed',
    };
  });

  // POST /api/admin/auth/change-password - Change password
  app.post('/change-password', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'No token provided' });
    }

    const token = authHeader.slice(7);
    const admin = verifyAdminToken(token);

    if (!admin) {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }

    const changePasswordSchema = z.object({
      currentPassword: z.string().min(6),
      newPassword: z.string().min(8),
    });

    try {
      const { currentPassword, newPassword } = changePasswordSchema.parse(request.body);
      const result = await changeAdminPassword(admin.username, currentPassword, newPassword);

      if (!result.success) {
        return reply.code(400).send({ error: result.error });
      }

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid password format' });
      }
      logger.error({ error }, 'Change password error');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // POST /api/admin/auth/logout - Logout (client-side token removal)
  app.post('/logout', async () => {
    // JWT is stateless, so logout is handled client-side by removing token
    // This endpoint exists for logging purposes
    return {
      success: true,
      message: 'Logged out successfully',
    };
  });
};
