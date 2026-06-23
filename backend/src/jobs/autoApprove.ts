/**
 * Auto-approval cron job.
 * 
 * Runs every hour. Automatically approves any leave request that has been
 * Pending for more than 14 days without action from the assigned approver.
 * Uses node-cron — no extra infrastructure required.
 */
import cron from 'node-cron';
import pool from '../db/connection';

export function startAutoApprovalJob(): void {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('[AutoApprove] Running stale leave check...');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(`
        UPDATE leaves
        SET
          status = 'Approved',
          approved_by = current_approver_id,
          approved_at = NOW(),
          updated_at = NOW()
        WHERE status = 'Pending'
          AND created_at < NOW() - INTERVAL '14 days'
        RETURNING id, employee_id
      `);

      await client.query('COMMIT');

      if (result.rows.length > 0) {
        console.log('[AutoApprove] Auto-approved ' + result.rows.length + ' stale leave(s):');
        for (const row of result.rows) {
          console.log('  Leave #' + row.id + ' (employee ' + row.employee_id + ')');
        }
      } else {
        console.log('[AutoApprove] No stale leaves found.');
      }
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[AutoApprove] Error:', err);
    } finally {
      client.release();
    }
  });

  console.log('[AutoApprove] Scheduled (every hour, 14-day threshold).');
}
