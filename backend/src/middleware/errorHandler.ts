import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface ApiError extends Error {
  status?: number;
  code?: string; // e.g. Postgres error codes
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const isDev = process.env.NODE_ENV !== 'production';

  // ── Zod validation errors ──────────────────────────────────────────────────
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // ── Postgres unique violation ──────────────────────────────────────────────
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists (duplicate)' });
  }

  // ── Postgres foreign key violation ────────────────────────────────────────
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced resource does not exist' });
  }

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Never leak stack traces in production
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} →`, err);

  res.status(status).json({
    error: message,
    ...(isDev && { stack: err.stack }),
  });
};
