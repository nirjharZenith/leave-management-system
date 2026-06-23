import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/connection';
import pool from '../db/connection';
import { hashPassword } from '../utils/password';
import { authenticateToken, authorizeRole, AuthenticatedRequest } from '../middleware/auth';
import { wouldCreateCycle, wouldCreateManagerCycle, rerouteOptedOutLeaves } from '../utils/approvalChain';
import { getSubtreeEmployeeIds } from '../utils/hierarchyUtils';

const router = Router();

const createEmployeeSchema = z
  .object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(1).max(255).trim(),
    role_id: z.number().int().positive().optional(),
    role: z.enum(['admin', 'manager', 'employee']).optional(),
    manager_id: z.number().int().positive().nullable().optional(),
    department: z.string().max(100).trim().optional(),
    reporting_manager_id: z.number().int().positive().nullable().optional(),
  })
  .refine((d) => d.role_id !== undefined || d.role !== undefined, {
    message: 'role or role_id is required',
    path: ['role'],
  });

const updateEmployeeSchema = z
  .object({
    email: z.string().email().toLowerCase().trim().optional(),
    name: z.string().min(1).max(255).trim().optional(),
    role_id: z.number().int().positive().optional(),
    role: z.enum(['admin', 'manager', 'employee']).optional(),
    manager_id: z.number().int().positive().nullable().optional(),
    department: z.string().max(100).trim().optional(),
    reporting_manager_id: z.number().int().positive().nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' });

async function resolveRoleId(role?: string, roleId?: number): Promise<number> {
  if (roleId) return roleId;
  if (!role) throw new Error('role or role_id is required');

  const result = await query('SELECT id FROM roles WHERE name = $1', [role]);
  if (result.rows.length === 0) throw new Error(`Unknown role: ${role}`);
  return result.rows[0].id;
}

// ── GET /api/employees ────────────────────────────────────────────────────────
router.get(
  '/',
  authenticateToken,
  authorizeRole('admin', 'manager'),
  async (req: AuthenticatedRequest, res: Response, next: any) => {
    try {
      const { id: userId, role: userRole } = req.user!;

      if (userRole === 'manager') {
        // Use a recursive CTE to get all employees in the manager's subtree
        const client = await pool.connect();
        try {
          const subtreeIds = await getSubtreeEmployeeIds(userId, client);

          if (subtreeIds.length === 0) {
            return res.json([]);
          }

          const result = await client.query(
            `SELECT e.id, e.email, e.name, r.name AS role, e.department,
                    e.manager_id, m.name AS manager_name,
                    e.reporting_manager_id, rm.name AS reporting_manager_name,
                    e.approval_opt_in, e.created_at
             FROM employees e
             JOIN roles r ON e.role_id = r.id
             LEFT JOIN employees m ON e.manager_id = m.id
             LEFT JOIN employees rm ON rm.id = e.reporting_manager_id
             WHERE e.id = ANY($1::int[])
             ORDER BY e.created_at DESC`,
            [subtreeIds]
          );

          return res.json(result.rows);
        } finally {
          client.release();
        }
      }

      // Admin: return all employees
      const result = await query(
        `SELECT e.id, e.email, e.name, r.name AS role, e.department,
                e.manager_id, m.name AS manager_name,
                e.reporting_manager_id, rm.name AS reporting_manager_name,
                e.approval_opt_in, e.created_at
         FROM employees e
         JOIN roles r ON e.role_id = r.id
         LEFT JOIN employees m ON e.manager_id = m.id
         LEFT JOIN employees rm ON rm.id = e.reporting_manager_id
         ORDER BY e.created_at DESC`
      );

      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/employees/hierarchy ──────────────────────────────────────────────
router.get(
  '/hierarchy',
  authenticateToken,
  authorizeRole('admin', 'manager'),
  async (req: AuthenticatedRequest, res: Response, next: any) => {
    try {
      const result = await query(
        `SELECT e.id, e.name, r.name AS role, e.department,
                e.manager_id, e.reporting_manager_id
         FROM employees e
         JOIN roles r ON e.role_id = r.id
         ORDER BY e.id ASC`
      );

      if (result.rows.length === 0) {
        return res.json([]);
      }

      // Build tree in memory
      type HierarchyNode = {
        id: number;
        name: string;
        role: string;
        department: string | null;
        reporting_manager_id: number | null;
        children: HierarchyNode[];
      };

      const nodeMap = new Map<number, HierarchyNode & { manager_id: number | null }>();

      for (const row of result.rows) {
        nodeMap.set(row.id, {
          id: row.id,
          name: row.name,
          role: row.role,
          department: row.department,
          reporting_manager_id: row.reporting_manager_id,
          manager_id: row.manager_id,
          children: [],
        });
      }

      const roots: HierarchyNode[] = [];

      for (const node of nodeMap.values()) {
        if (node.manager_id === null || node.manager_id === undefined) {
          roots.push(node);
        } else {
          const parent = nodeMap.get(node.manager_id);
          if (parent) {
            parent.children.push(node);
          } else {
            // Parent not found — treat as root
            roots.push(node);
          }
        }
      }

      // Strip manager_id from output nodes (recursive helper)
      function stripManagerId(node: HierarchyNode & { manager_id?: number | null }): HierarchyNode {
        const { manager_id, ...rest } = node;
        return {
          ...rest,
          children: rest.children.map(stripManagerId),
        };
      }

      res.json(roots.map(stripManagerId));
    } catch (err) {
      next(err);
    }
  }
);

// ── PATCH /api/employees/me/approval-preference ───────────────────────────────
router.patch(
  '/me/approval-preference',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: any) => {
    const approvalPrefSchema = z.object({ approval_opt_in: z.boolean() });

    const client = await pool.connect();
    try {
      const { approval_opt_in } = approvalPrefSchema.parse(req.body);
      const userId = req.user!.id;

      await client.query('BEGIN');

      await client.query(
        `UPDATE employees SET approval_opt_in = $1, updated_at = NOW() WHERE id = $2`,
        [approval_opt_in, userId]
      );

      if (!approval_opt_in) {
        await rerouteOptedOutLeaves(userId, client);
      }

      await client.query('COMMIT');

      res.json({ approval_opt_in });
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  }
);

// ── GET /api/employees/:id ────────────────────────────────────────────────────
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid employee ID' });

    const { id: userId, role: userRole } = req.user!;

    const result = await query(
      `SELECT e.id, e.email, e.name, r.name AS role, e.department,
              e.manager_id, e.reporting_manager_id, e.approval_opt_in, e.created_at
       FROM employees e
       JOIN roles r ON e.role_id = r.id
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employee = result.rows[0];

    if (userRole === 'employee' && userId !== id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    if (userRole === 'manager' && employee.manager_id !== userId && userId !== id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    res.json(employee);
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

      let roleId = await resolveRoleId(data.role, data.role_id);
      let managerId = data.manager_id ?? null;
      let reportingManagerId = data.reporting_manager_id ?? null;

      // Validate reporting_manager_id exists if provided
      if (reportingManagerId !== null) {
        const rmCheck = await query('SELECT id FROM employees WHERE id = $1', [reportingManagerId]);
        if (rmCheck.rows.length === 0) {
          return res.status(400).json({ error: 'Reporting manager not found' });
        }
      }

      const passwordHash = await hashPassword(data.password);

      const result = await query(
        `INSERT INTO employees (email, password_hash, name, role_id, manager_id, department, reporting_manager_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, name, role_id, manager_id, department, reporting_manager_id, created_at`,
        [data.email, passwordHash, data.name, roleId, managerId, data.department ?? null, reportingManagerId]
      );

      const roleResult = await query('SELECT name FROM roles WHERE id = $1', [roleId]);

      res.status(201).json({
        ...result.rows[0],
        role: roleResult.rows[0].name,
      });
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
    const client = await pool.connect();
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid employee ID' });

      const data = updateEmployeeSchema.parse(req.body);

      // Validate manager_id if provided and non-null
      if (data.manager_id !== undefined && data.manager_id !== null) {
        const mCheck = await client.query('SELECT id FROM employees WHERE id = $1', [data.manager_id]);
        if (mCheck.rows.length === 0) {
          return res.status(400).json({ error: 'Manager not found' });
        }

        const hasCycle = await wouldCreateManagerCycle(id, data.manager_id, client);
        if (hasCycle) {
          return res.status(400).json({ error: 'Circular manager relationship detected' });
        }
      }

      // Validate reporting_manager_id if provided and non-null
      if (data.reporting_manager_id !== undefined && data.reporting_manager_id !== null) {
        const rmCheck = await client.query('SELECT id FROM employees WHERE id = $1', [data.reporting_manager_id]);
        if (rmCheck.rows.length === 0) {
          return res.status(400).json({ error: 'Reporting manager not found' });
        }

        const hasCycle = await wouldCreateCycle(id, data.reporting_manager_id, client);
        if (hasCycle) {
          return res.status(400).json({ error: 'Circular reporting relationship detected' });
        }
      }

      const setClauses: string[] = [];
      const values: any[] = [];
      let i = 1;

      if (data.email !== undefined) { setClauses.push(`email = $${i++}`); values.push(data.email); }
      if (data.name !== undefined) { setClauses.push(`name = $${i++}`); values.push(data.name); }
      if (data.role_id !== undefined || data.role !== undefined) {
        const roleId = await resolveRoleId(data.role, data.role_id);
        setClauses.push(`role_id = $${i++}`);
        values.push(roleId);
      }
      if (data.manager_id !== undefined) { setClauses.push(`manager_id = $${i++}`); values.push(data.manager_id); }
      if (data.department !== undefined) { setClauses.push(`department = $${i++}`); values.push(data.department); }
      if (data.reporting_manager_id !== undefined) { setClauses.push(`reporting_manager_id = $${i++}`); values.push(data.reporting_manager_id); }

      setClauses.push(`updated_at = NOW()`);
      values.push(id);

      const result = await client.query(
        `UPDATE employees SET ${setClauses.join(', ')} WHERE id = $${i}
         RETURNING id, email, name, role_id, manager_id, reporting_manager_id, department, created_at, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    } finally {
      client.release();
    }
  }
);

// ── DELETE /api/employees/:id ─────────────────────────────────────────────────
router.delete(
  '/:id',
  authenticateToken,
  authorizeRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: any) => {
    const client = await pool.connect();
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid employee ID' });

      const { id: userId } = req.user!;

      if (userId === id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      await client.query('BEGIN');

      // 1. Reroute any pending approvals assigned to this employee
      await rerouteOptedOutLeaves(id, client);

      // 1.5. Clear remaining current_approver_id references (e.g. Approved leaves or no fallback found)
      await client.query(
        `UPDATE leaves SET current_approver_id = NULL WHERE current_approver_id = $1`,
        [id]
      );

      // 2. Nullify approved_by references for already processed leaves
      await client.query(
        `UPDATE leaves SET approved_by = NULL WHERE approved_by = $1`,
        [id]
      );

      // 3. Delete the employee's own leave requests
      await client.query(
        `DELETE FROM leaves WHERE employee_id = $1`,
        [id]
      );

      // 4. Clear reporting_manager_id references to this employee
      await client.query(
        `UPDATE employees SET reporting_manager_id = NULL WHERE reporting_manager_id = $1`,
        [id]
      );

      // 5. Clear manager_id references to this employee
      await client.query(
        `UPDATE employees SET manager_id = NULL WHERE manager_id = $1`,
        [id]
      );

      const result = await client.query(
        `DELETE FROM employees WHERE id = $1 RETURNING id`,
        [id]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Employee not found' });
      }

      await client.query('COMMIT');

      res.json({ message: 'Employee deleted successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  }
);

export default router;
