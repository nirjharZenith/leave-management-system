import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/connection';
import { hashPassword } from '../utils/password';
import { authenticateToken, authorizeRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ── Zod schemas ───────────────────────────────────────────────────────────────
const createEmployeeSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(255).trim(),
  role_id: z.number().int().positive(),
  manager_id: z.number().int().positive().nullable().optional(),
  department: z.string().max(100).trim().optional(),
});

const updateEmployeeSchema = z
  .object({
    email: z.string().email().toLowerCase().trim().optional(),
    name: z.string().min(1).max(255).trim().optional(),
    role_id: z.number().int().positive().optional(),
    manager_id: z.number().int().positive().nullable().optional(),
    department: z.string().max(100).trim().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' });

// ── GET /api/employees ────────────────────────────────────────────────────────
router.get(
  '/',
  authenticateToken,
  authorizeRole('admin'),
  async (_req, res: Response, next: any) => {
    try {
      const result = await query(
        `SELECT e.id, e.email, e.name, r.name AS role, e.department,
                e.manager_id, e.created_at
         FROM employees e
         JOIN roles r ON e.role_id = r.id
         ORDER BY e.created_at DESC`
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/employees/:id ────────────────────────────────────────────────────
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid employee ID' });

    const { id: userId, role: userRole } = req.user!;

    if (userRole !== 'admin' && userRole !== 'manager' && userId !== id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const result = await query(
      `SELECT e.id, e.email, e.name, r.name AS role, e.department,
              e.manager_id, e.created_at
       FROM employees e
       JOIN roles r ON e.role_id = r.id
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/employees ───────────────────────────────────────────────────────
router.post(
  '/',
  authenticateToken,
  authorizeRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: any) => {
    try {
      const data = createEmployeeSchema.parse(req.body);
      const passwordHash = await hashPassword(data.password);

      const result = await query(
        `INSERT INTO employees (email, password_hash, name, role_id, manager_id, department)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, name, role_id, manager_id, department, created_at`,
        [data.email, passwordHash, data.name, data.role_id, data.manager_id ?? null, data.department ?? null]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// ── PUT /api/employees/:id ────────────────────────────────────────────────────
router.put(
  '/:id',
  authenticateToken,
  authorizeRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: any) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid employee ID' });

      const data = updateEmployeeSchema.parse(req.body);

      const setClauses: string[] = [];
      const values: any[] = [];
      let i = 1;

      if (data.email !== undefined)      { setClauses.push(`email = $${i++}`);      values.push(data.email); }
      if (data.name !== undefined)       { setClauses.push(`name = $${i++}`);       values.push(data.name); }
      if (data.role_id !== undefined)    { setClauses.push(`role_id = $${i++}`);    values.push(data.role_id); }
      if (data.manager_id !== undefined) { setClauses.push(`manager_id = $${i++}`); values.push(data.manager_id); }
      if (data.department !== undefined) { setClauses.push(`department = $${i++}`); values.push(data.department); }

      setClauses.push(`updated_at = NOW()`);
      values.push(id);

      const result = await query(
        `UPDATE employees SET ${setClauses.join(', ')} WHERE id = $${i}
         RETURNING id, email, name, role_id, manager_id, department, created_at, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /api/employees/:id ─────────────────────────────────────────────────
router.delete(
  '/:id',
  authenticateToken,
  authorizeRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: any) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid employee ID' });

      // Prevent self-deletion
      if (req.user!.id === id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      const result = await query(
        `DELETE FROM employees WHERE id = $1 RETURNING id`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      res.json({ message: 'Employee deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
