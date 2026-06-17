import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/connection';
import { authenticateToken, authorizeRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ── Zod schemas ───────────────────────────────────────────────────────────────
const createLeaveSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(1000).trim(),
  type: z.enum(['Annual', 'Sick', 'Maternity', 'Paternity', 'Unpaid', 'Other']),
}).refine(
  (d) => new Date(d.start_date) <= new Date(d.end_date),
  { message: 'start_date must be on or before end_date', path: ['start_date'] }
);

const updateLeaveSchema = z.object({
  status: z.enum(['Approved', 'Rejected']),
  rejection_reason: z.string().min(5).max(500).trim().optional(),
}).refine(
  (d) => d.status !== 'Rejected' || !!d.rejection_reason,
  { message: 'rejection_reason is required when rejecting a leave', path: ['rejection_reason'] }
);

// ── GET /api/leaves ───────────────────────────────────────────────────────────
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const { id: userId, role: userRole } = req.user!;

    let sql = `
      SELECT l.*, e.name AS employee_name, e.email AS employee_email
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
    `;
    const params: any[] = [];

    if (userRole === 'employee') {
      sql += ` WHERE l.employee_id = $1`;
      params.push(userId);
    } else if (userRole === 'manager') {
      sql += ` WHERE e.manager_id = $1 OR l.employee_id = $1`;
      params.push(userId);
    }
    // admin → no filter, sees all

    sql += ` ORDER BY l.created_at DESC`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/leaves/user/mine ─────────────────────────────────────────────────
router.get('/user/mine', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const result = await query(
      `SELECT l.*, e.name AS employee_name
       FROM leaves l
       JOIN employees e ON l.employee_id = e.id
       WHERE l.employee_id = $1
       ORDER BY l.created_at DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/leaves/:id ───────────────────────────────────────────────────────
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid leave ID' });

    const { id: userId, role: userRole } = req.user!;

    const result = await query(
      `SELECT l.*, e.name AS employee_name, e.manager_id
       FROM leaves l
       JOIN employees e ON l.employee_id = e.id
       WHERE l.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leave not found' });
    }

    const leave = result.rows[0];

    if (userRole === 'employee' && leave.employee_id !== userId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    if (userRole === 'manager' && leave.employee_id !== userId && leave.manager_id !== userId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    res.json(leave);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/leaves ──────────────────────────────────────────────────────────
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const data = createLeaveSchema.parse(req.body);

    const result = await query(
      `INSERT INTO leaves (employee_id, start_date, end_date, reason, type, status)
       VALUES ($1, $2, $3, $4, $5, 'Pending')
       RETURNING *`,
      [req.user!.id, data.start_date, data.end_date, data.reason, data.type]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/leaves/:id (approve/reject) ──────────────────────────────────────
router.put(
  '/:id',
  authenticateToken,
  authorizeRole('admin', 'manager'),
  async (req: AuthenticatedRequest, res: Response, next: any) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid leave ID' });

      const { status, rejection_reason } = updateLeaveSchema.parse(req.body);
      const { id: userId, role: userRole } = req.user!;

      const leaveResult = await query(
        `SELECT l.*, e.manager_id
         FROM leaves l
         JOIN employees e ON l.employee_id = e.id
         WHERE l.id = $1`,
        [id]
      );

      if (leaveResult.rows.length === 0) {
        return res.status(404).json({ error: 'Leave not found' });
      }

      const leave = leaveResult.rows[0];

      if (leave.status !== 'Pending') {
        return res.status(400).json({ error: `Leave is already ${leave.status}` });
      }

      // Managers can only act on their direct reports' leaves
      if (userRole === 'manager' && leave.manager_id !== userId) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // FIX: actually store approved_by and rejection_reason (were ignored before)
      const result = await query(
        `UPDATE leaves
         SET status = $1, approved_by = $2, rejection_reason = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [status, userId, rejection_reason ?? null, id]
      );

      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
