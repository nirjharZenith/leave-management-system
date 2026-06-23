import { PoolClient } from 'pg';
import pool from '../db/connection';

/**
 * Resolves the ordered approval chain for an employee.
 * Returns { chain: number[], currentApproverId: number | null }
 *
 * Algorithm:
 * 1. Fetch employee row (reporting_manager_id, manager_id)
 * 2. If reporting_manager_id is set, check if that person has approval_opt_in=true;
 *    if so, push as first candidate
 * 3. Walk manager_id ancestors via recursive CTE (up to 20 hops):
 *    - role=manager or role=admin: qualify unconditionally
 *    - role=employee: qualify only if approval_opt_in=true
 * 4. Deduplicate while preserving order
 * 5. currentApproverId = chain[0] ?? fallback to lowest-id admin
 */
export async function resolveApprovalChain(
  employeeId: number,
  client: PoolClient
): Promise<{ chain: number[]; currentApproverId: number | null }> {
  // Fetch the employee row
  const empRow = await client.query(
    `SELECT manager_id, reporting_manager_id FROM employees WHERE id = $1`,
    [employeeId]
  );
  if (empRow.rows.length === 0) return { chain: [], currentApproverId: null };

  const { manager_id, reporting_manager_id } = empRow.rows[0];
  const candidates: number[] = [];

  // Step 1: Check reporting_manager_id
  if (reporting_manager_id) {
    const rmRow = await client.query(
      `SELECT e.id, e.approval_opt_in, r.name AS role_name
       FROM employees e JOIN roles r ON r.id = e.role_id
       WHERE e.id = $1`,
      [reporting_manager_id]
    );
    if (rmRow.rows.length > 0) {
      const rm = rmRow.rows[0];
      if (rm.approval_opt_in || rm.role_name === 'manager' || rm.role_name === 'admin') {
        candidates.push(rm.id);
      }
    }
  }

  // Step 2: Walk manager_id ancestors recursively
  if (manager_id) {
    const ancestorsResult = await client.query(
      `WITH RECURSIVE ancestors AS (
        SELECT e.manager_id AS id, 1 AS depth
        FROM employees e
        WHERE e.id = $1 AND e.manager_id IS NOT NULL
        UNION ALL
        SELECT e.manager_id, a.depth + 1
        FROM ancestors a
        JOIN employees e ON e.id = a.id
        WHERE e.manager_id IS NOT NULL AND a.depth < 20
      )
      SELECT a.id, e.approval_opt_in, r.name AS role_name, a.depth
      FROM ancestors a
      JOIN employees e ON e.id = a.id
      JOIN roles r ON r.id = e.role_id
      ORDER BY a.depth ASC`,
      [employeeId]
    );

    for (const row of ancestorsResult.rows) {
      if (row.role_name === 'manager' || row.role_name === 'admin') {
        if (!candidates.includes(row.id)) candidates.push(row.id);
      } else if (row.approval_opt_in) {
        if (!candidates.includes(row.id)) candidates.push(row.id);
      }
    }
  }

  // Step 3: Determine currentApproverId — first candidate or fallback admin
  let currentApproverId: number | null = candidates[0] ?? null;

  if (!currentApproverId) {
    const adminRow = await pool.query(
      `SELECT e.id FROM employees e JOIN roles r ON r.id = e.role_id
       WHERE r.name = 'admin' ORDER BY e.id ASC LIMIT 1`
    );
    if (adminRow.rows.length > 0) {
      const adminId: number = adminRow.rows[0].id;
      currentApproverId = adminId;
      if (!candidates.includes(adminId)) candidates.push(adminId);
    }
  }

  return { chain: candidates, currentApproverId };
}

/**
 * When a reporting manager opts out (approval_opt_in=false), re-route all
 * Pending leaves currently assigned to them to the next eligible approver
 * from the stored approval_chain_snapshot.
 */
export async function rerouteOptedOutLeaves(
  optedOutId: number,
  client: PoolClient
): Promise<void> {
  const pendingResult = await client.query(
    `SELECT id, approval_chain_snapshot FROM leaves
     WHERE current_approver_id = $1 AND status = 'Pending'`,
    [optedOutId]
  );

  for (const row of pendingResult.rows) {
    const chain: number[] = row.approval_chain_snapshot ?? [];
    const idx = chain.indexOf(optedOutId);
    let nextApproverId: number | null = null;

    // Search forward in snapshot for next eligible approver
    for (let i = idx + 1; i < chain.length; i++) {
      const candidateId = chain[i];
      const checkRow = await client.query(
        `SELECT e.id, e.approval_opt_in, r.name AS role_name
         FROM employees e JOIN roles r ON r.id = e.role_id
         WHERE e.id = $1`,
        [candidateId]
      );
      if (checkRow.rows.length > 0) {
        const c = checkRow.rows[0];
        if (c.role_name === 'manager' || c.role_name === 'admin' || c.approval_opt_in) {
          nextApproverId = c.id;
          break;
        }
      }
    }

    // Fallback to lowest-id admin
    if (!nextApproverId) {
      const adminRow = await client.query(
        `SELECT e.id FROM employees e JOIN roles r ON r.id = e.role_id
         WHERE r.name = 'admin' ORDER BY e.id ASC LIMIT 1`
      );
      if (adminRow.rows.length > 0) nextApproverId = adminRow.rows[0].id;
    }

    if (nextApproverId) {
      await client.query(
        `UPDATE leaves SET current_approver_id = $1 WHERE id = $2`,
        [nextApproverId, row.id]
      );
    }
  }
}

/**
 * Returns true if assigning reportingManagerId as the reporting_manager_id
 * for employeeId would create a cycle in the reporting_manager_id chain.
 */
export async function wouldCreateCycle(
  employeeId: number,
  reportingManagerId: number,
  client: PoolClient
): Promise<boolean> {
  // Self-referential shortcut
  if (employeeId === reportingManagerId) return true;

  const result = await client.query<{ has_cycle: boolean }>(
    `WITH RECURSIVE reach AS (
       SELECT reporting_manager_id AS next_id
       FROM employees WHERE id = $2
       UNION ALL
       SELECT e.reporting_manager_id
       FROM reach r
       JOIN employees e ON e.id = r.next_id
       WHERE r.next_id IS NOT NULL AND r.next_id <> $1
     )
     SELECT EXISTS (SELECT 1 FROM reach WHERE next_id = $1) AS has_cycle`,
    [employeeId, reportingManagerId]
  );

  return result.rows[0]?.has_cycle ?? false;
}

/**
 * Returns true if assigning managerId as the manager_id
 * for employeeId would create a cycle in the manager_id chain.
 */
export async function wouldCreateManagerCycle(
  employeeId: number,
  managerId: number,
  client: PoolClient
): Promise<boolean> {
  // Self-referential shortcut
  if (employeeId === managerId) return true;

  const result = await client.query<{ has_cycle: boolean }>(
    `WITH RECURSIVE reach AS (
       SELECT manager_id AS next_id
       FROM employees WHERE id = $2
       UNION ALL
       SELECT e.manager_id
       FROM reach r
       JOIN employees e ON e.id = r.next_id
       WHERE r.next_id IS NOT NULL AND r.next_id <> $1
     )
     SELECT EXISTS (SELECT 1 FROM reach WHERE next_id = $1) AS has_cycle`,
    [employeeId, managerId]
  );

  return result.rows[0]?.has_cycle ?? false;
}
