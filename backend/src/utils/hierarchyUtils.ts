import { PoolClient } from 'pg';

/**
 * Returns true if managerId appears in the manager_id ancestry chain of employeeId.
 * Used to authorize managers to act on leaves from indirect reports.
 *
 * Uses a recursive CTE that walks DOWN the tree from managerId, checking if
 * employeeId is a descendant.
 */
export async function isInManagerSubtree(
  employeeId: number,
  managerId: number,
  client: PoolClient
): Promise<boolean> {
  if (employeeId === managerId) return false; // manager cannot act on own leaves via this path

  const result = await client.query<{ in_subtree: boolean }>(
    `WITH RECURSIVE subtree AS (
       -- Start from direct reports of the manager
       SELECT id FROM employees WHERE manager_id = $2
       UNION ALL
       SELECT e.id
       FROM employees e
       JOIN subtree s ON e.manager_id = s.id
     )
     SELECT EXISTS (SELECT 1 FROM subtree WHERE id = $1) AS in_subtree`,
    [employeeId, managerId]
  );

  return result.rows[0]?.in_subtree ?? false;
}

/**
 * Returns all employee IDs in a manager's reporting subtree (all levels).
 * Used for filtering leave lists for managers.
 */
export async function getSubtreeEmployeeIds(
  managerId: number,
  client: PoolClient
): Promise<number[]> {
  const result = await client.query<{ id: number }>(
    `WITH RECURSIVE subtree AS (
       SELECT id FROM employees WHERE manager_id = $1
       UNION ALL
       SELECT e.id
       FROM employees e
       JOIN subtree s ON e.manager_id = s.id
     )
     SELECT id FROM subtree`,
    [managerId]
  );

  return result.rows.map((r) => r.id);
}
