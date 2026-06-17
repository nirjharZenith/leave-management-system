import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/connection';
import { verifyPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// ── Zod schemas ───────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', authLimiter, async (req: any, res: Response, next: any) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const result = await query(
      `SELECT e.id, e.email, e.password_hash, e.name, r.name AS role
       FROM employees e
       JOIN roles r ON e.role_id = r.id
       WHERE e.email = $1`,
      [email]
    );

    const user = result.rows[0];

    // Use constant-time comparison path regardless of user existence
    // to prevent user enumeration via timing attacks
    const passwordHash = user?.password_hash || '$2a$10$invalidhashtopreventtiming000000000000000000000';
    const passwordMatch = await verifyPassword(password, passwordHash);

    if (!user || !passwordMatch) {
      // Same message for both "user not found" and "wrong password" — prevents enumeration
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err); // ZodError handled by errorHandler
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const result = await query(
      `SELECT e.id, e.email, e.name, r.name AS role
       FROM employees e
       JOIN roles r ON e.role_id = r.id
       WHERE e.id = $1`,
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', (_req, res: Response) => {
  res.clearCookie('authToken');
  res.json({ message: 'Logged out successfully' });
});

export default router;
