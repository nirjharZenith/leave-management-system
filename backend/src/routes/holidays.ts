import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/connection';
import { authenticateToken, authorizeRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ── Zod schemas ───────────────────────────────────────────────────────────────
const createHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  name: z.string().min(1).max(255).trim(),
  description: z.string().max(1000).trim().optional(),
});

const updateHolidaySchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    name: z.string().min(1).max(255).trim().optional(),
    description: z.string().max(1000).trim().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' });

// ── GET /api/holidays ─────────────────────────────────────────────────────────
router.get('/', authenticateToken, async (_req, res: Response, next: any) => {
  try {
    const result = await query(`SELECT * FROM holidays ORDER BY date ASC`);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/holidays ────────────────────────────────────────────────────────
router.post(
  '/',
  authenticateToken,
  authorizeRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: any) => {
    try {
      const data = createHolidaySchema.parse(req.body);

      const result = await query(
        `INSERT INTO holidays (date, name, description)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [data.date, data.name, data.description ?? null]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// ── PUT /api/holidays/:id ─────────────────────────────────────────────────────
router.put(
  '/:id',
  authenticateToken,
  authorizeRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: any) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid holiday ID' });

      const data = updateHolidaySchema.parse(req.body);

      const setClauses: string[] = [];
      const values: any[] = [];
      let i = 1;

      if (data.date !== undefined)        { setClauses.push(`date = $${i++}`);        values.push(data.date); }
      if (data.name !== undefined)        { setClauses.push(`name = $${i++}`);        values.push(data.name); }
      if (data.description !== undefined) { setClauses.push(`description = $${i++}`); values.push(data.description); }

      setClauses.push(`updated_at = NOW()`);
      values.push(id);

      const result = await query(
        `UPDATE holidays SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Holiday not found' });
      }

      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /api/holidays/:id ──────────────────────────────────────────────────
router.delete(
  '/:id',
  authenticateToken,
  authorizeRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: any) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid holiday ID' });

      const result = await query(
        `DELETE FROM holidays WHERE id = $1 RETURNING id`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Holiday not found' });
      }

      res.json({ message: 'Holiday deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
