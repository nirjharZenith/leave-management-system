/**
 * Migration 1.2 — Add approval workflow columns to `leaves` table
 *
 * Adds:
 *   - current_approver_id    INTEGER REFERENCES employees(id)
 *   - approval_chain_snapshot JSONB
 *   - approved_at            TIMESTAMP
 *   - rejected_at            TIMESTAMP
 *
 * Also creates index: idx_leaves_current_approver_id
 */

import { pool } from './connection';

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Running migration 1.2: leaves table columns...\n');

    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE leaves
        ADD COLUMN IF NOT EXISTS current_approver_id    INTEGER REFERENCES employees(id),
        ADD COLUMN IF NOT EXISTS approval_chain_snapshot JSONB,
        ADD COLUMN IF NOT EXISTS approved_at            TIMESTAMP,
        ADD COLUMN IF NOT EXISTS rejected_at            TIMESTAMP;
    `);
    console.log('✅ Columns added (or already present)');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_leaves_current_approver_id
        ON leaves(current_approver_id);
    `);
    console.log('✅ Index idx_leaves_current_approver_id created (or already present)');

    await client.query('COMMIT');
    console.log('\n✨ Migration 1.2 completed successfully!');

    // ── Verification ─────────────────────────────────────────────────────────
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'leaves'
        AND column_name IN (
          'current_approver_id',
          'approval_chain_snapshot',
          'approved_at',
          'rejected_at'
        )
      ORDER BY column_name;
    `);

    console.log('\n📋 Verification — new columns in leaves table:');
    if (result.rows.length === 0) {
      console.error('❌ No matching columns found — something went wrong!');
      process.exit(1);
    }
    for (const row of result.rows) {
      console.log(`  ✔ ${row.column_name}  (${row.data_type}, nullable: ${row.is_nullable})`);
    }

    if (result.rows.length === 4) {
      console.log('\n✅ All 4 expected columns verified.');
    } else {
      console.warn(`⚠️  Expected 4 columns, found ${result.rows.length}.`);
    }

    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration 1.2 failed (rolled back):', error);
    process.exit(1);
  } finally {
    client.release();
  }
};

migrate();
