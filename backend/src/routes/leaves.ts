import { Router, Response } from 'express';
import { z } from 'zod';
import pool, { query } from '../db/connection';
import { authenticateToken, authorizeRole, AuthenticatedRequest } from '../middleware/auth';
import { resolveApprovalChain } from '../utils/approvalChain';
import { isInManagerSubtree } from '../utils/hierarchyUtils';

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
// Task 4.5: add current_approver_name, approved_by_name, chain_length; subtree CTE for managers
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const { id: userId, role: userRole } = req.user!;

    let sql = `
      SELECT
        l.*,
        e.name AS employee_name,
        e.email AS employee_email,
        ca.name AS current_approver_name,
        ab.name AS approved_by_name,
        jsonb_array_length(COALESCE(l.approval_chain_snapshot, '[]'::jsonb)) AS chain_length
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      LEFT JOIN employees ca ON ca.id = l.current_approver_id
      LEFT JOIN employees ab ON ab.id = l.approved_by
    `;
    const params: any[] = [];

    if (userRole === 'employee') {
      sql += ` WHERE l.employee_id = $1`;
      params.push(userId);
    } else if (userRole === 'manager') {
      // Subtree CTE that also includes the manager's own leaves
      sql += `
        WHERE l.employee_id IN (
          WITH RECURSIVE subtree AS (
            SELECT id FROM employees WHERE manager_id = $1
            UNION ALL
            SELECT e.id FROM employees e JOIN subtree s ON e.manager_id = s.id
          )
          SELECT id FROM subtree
        ) OR l.employee_id = $1`;
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

// ── GET /api/leaves/mine ──────────────────────────────────────────────────────
const getMyLeaves = async (req: AuthenticatedRequest, res: Response, next: any) => {
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
};

router.get('/user/mine', authenticateToken, getMyLeaves);
router.get('/mine', authenticateToken, getMyLeaves);

// ── GET /api/leaves/pending-for-me ────────────────────────────────────────────
// Task 4.6: leaves where I am the current_approver_id and status is Pending
// MUST be registered before /:id to avoid route collision
router.get('/pending-for-me', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const userId = req.user!.id;

    const result = await query(
      `SELECT l.*, e.name AS employee_name, e.email AS employee_email
       FROM leaves l
       JOIN employees e ON l.employee_id = e.id
       WHERE l.current_approver_id = $1
         AND l.status = 'Pending'
       ORDER BY l.created_at DESC`,
      [userId]
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
// Task 4.1: transactional — date-overlap check, resolveApprovalChain, INSERT with approver fields
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: any) => {
  const client = await pool.connect();
  try {
    const data = createLeaveSchema.parse(req.body);
    const employeeId = req.user!.id;

    await client.query('BEGIN');

    // Check for date overlap with existing Pending or Approved leaves
    const overlapResult = await client.query(
      `SELECT id FROM leaves
       WHERE employee_id = $1
         AND status IN ('Pending', 'Approved')
         AND start_date <= $3::date
         AND end_date >= $2::date`,
      [employeeId, data.start_date, data.end_date]
    );

    if (overlapResult.rows.length > 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(409).json({ error: 'Date overlaps with a pending or approved leave request' });
    }

    // Resolve approval chain
    const { chain, currentApproverId } = await resolveApprovalChain(employeeId, client);

    if (currentApproverId === null) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(500).json({ error: 'No approver could be resolved for this leave request' });
    }

    // Insert with current_approver_id and approval_chain_snapshot
    const result = await client.query(
      `INSERT INTO leaves
         (employee_id, start_date, end_date, reason, type, status,
          current_approver_id, approval_chain_snapshot)
       VALUES ($1, $2, $3, $4, $5, 'Pending', $6, $7::jsonb)
       RETURNING *`,
      [
        employeeId,
        data.start_date,
        data.end_date,
        data.reason,
        data.type,
        currentApproverId,
        JSON.stringify(chain),
      ]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ── PUT /api/leaves/:id (approve/reject) ──────────────────────────────────────
// Task 4.3: manual auth (no authorizeRole middleware), PoolClient transaction,
//           isInManagerSubtree for managers, timestamps for approved_at/rejected_at
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: any) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      client.release();
      return res.status(400).json({ error: 'Invalid leave ID' });
    }

    const { status, rejection_reason } = updateLeaveSchema.parse(req.body);
    const { id: userId, role: userRole } = req.user!;

    await client.query('BEGIN');

    const leaveResult = await client.query(
      `SELECT l.*, e.manager_id
       FROM leaves l
       JOIN employees e ON l.employee_id = e.id
       WHERE l.id = $1`,
      [id]
    );

    if (leaveResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ error: 'Leave not found' });
    }

    const leave = leaveResult.rows[0];

    if (leave.status !== 'Pending') {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ error: `Leave is already ${leave.status}` });
    }

    // Authorization checks
    if (userRole === 'admin') {
      // always permitted — no further check needed
    } else if (userRole === 'manager') {
      const inSubtree = await isInManagerSubtree(leave.employee_id, userId, client);
      if (!inSubtree) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    } else {
      // Any other role acting as reporting manager — must be the assigned current_approver
      if (leave.current_approver_id !== userId) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    const result = await client.query(
      `UPDATE leaves
       SET status = $1,
           approved_by = $2,
           rejection_reason = $3,
           current_approver_id = $2,
           approved_at = CASE WHEN $1 = 'Approved' THEN NOW() ELSE approved_at END,
           rejected_at = CASE WHEN $1 = 'Rejected' THEN NOW() ELSE rejected_at END,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, userId, rejection_reason ?? null, id]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

export default router;
