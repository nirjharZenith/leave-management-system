/**
 * db/init.ts — Single source of truth for schema + seed data.
 * Replaces both schema.ts and the old init.ts (which were duplicates with
 * different column sets).  Run with: npx ts-node db/init.ts
 */

import { pool } from './connection';

const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Initializing database schema...\n');

    await client.query('BEGIN');

    // ── roles ────────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ roles table');

    // ── employees ─────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id            SERIAL PRIMARY KEY,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name          VARCHAR(255) NOT NULL,
        role_id       INTEGER NOT NULL REFERENCES roles(id),
        manager_id    INTEGER REFERENCES employees(id),
        department    VARCHAR(100),
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ employees table');

    // ── leaves ────────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS leaves (
        id               SERIAL PRIMARY KEY,
        employee_id      INTEGER NOT NULL REFERENCES employees(id),
        start_date       DATE NOT NULL,
        end_date         DATE NOT NULL,
        reason           TEXT NOT NULL,
        type             VARCHAR(50) NOT NULL,
        status           VARCHAR(50) DEFAULT 'Pending',
        approved_by      INTEGER REFERENCES employees(id),
        rejection_reason TEXT,
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ leaves table');

    // ── holidays ──────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS holidays (
        id          SERIAL PRIMARY KEY,
        date        DATE UNIQUE NOT NULL,
        name        VARCHAR(255) NOT NULL,
        description TEXT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ holidays table');

    // ── indexes ───────────────────────────────────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_employees_role_id    ON employees(role_id);
      CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
      CREATE INDEX IF NOT EXISTS idx_leaves_employee_id   ON leaves(employee_id);
      CREATE INDEX IF NOT EXISTS idx_leaves_status        ON leaves(status);
    `);
    console.log('✅ indexes');

    // ── seed roles ────────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO roles (name) VALUES ('admin'), ('manager'), ('employee')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('✅ roles seeded');

    // ── seed test users ───────────────────────────────────────────────────────
    const seeds = [
      {
        email: 'admin@company.com',
        hash: '$2a$10$3n/n2vduyyjxY0Vn3t2KXeQdM37lqXtmEkjk8xCHXAJQaVVyFPKU.',
        name: 'Admin User',
        role: 'admin',
        dept: 'Management',
        plain: 'admin123',
      },
      {
        email: 'manager@company.com',
        hash: '$2a$10$hvVd2G7uocqkrq.JNP07POcqCHcHDliet2JCGvawW98GdUDIUuuEW',
        name: 'Manager User',
        role: 'manager',
        dept: 'HR',
        plain: 'manager123',
      },
      {
        email: 'employee@company.com',
        hash: '$2a$10$.MTO8jvHs/JcQWn4D3ok8ebOEYiLDQi7LEVWpos.DILKCZNiGlGgO',
        name: 'Employee User',
        role: 'employee',
        dept: 'Engineering',
        plain: 'emp123',
      },
    ];

    for (const u of seeds) {
      const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', [u.role]);
      await client.query(
        `INSERT INTO employees (email, password_hash, name, role_id, department)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING`,
        [u.email, u.hash, u.name, roleRes.rows[0].id, u.dept]
      );
      console.log(`✅ ${u.role}: ${u.email} / ${u.plain}`);
    }

    // ── seed holidays ─────────────────────────────────────────────────────────
    const holidays = [
      { date: '2026-01-26', name: 'Republic Day' },
      { date: '2026-03-25', name: 'Holi' },
      { date: '2026-08-15', name: 'Independence Day' },
      { date: '2026-10-02', name: 'Gandhi Jayanti' },
      { date: '2026-12-25', name: 'Christmas' },
    ];

    for (const h of holidays) {
      await client.query(
        `INSERT INTO holidays (date, name) VALUES ($1, $2) ON CONFLICT (date) DO NOTHING`,
        [h.date, h.name]
      );
    }
    console.log('✅ holidays seeded');

    await client.query('COMMIT');
    console.log('\n✨ Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database initialization failed (rolled back):', error);
    process.exit(1);
  } finally {
    client.release();
  }
};

initializeDatabase();
