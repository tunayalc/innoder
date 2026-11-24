import type { QueryDb } from './db.js';
import { HttpError } from './workflow.js';

export const protectLastSuperAdmin = async (db: QueryDb, userId: string) => {
  // Serialize all operations which can remove an active super admin.
  await db.query(
    "SELECT pg_advisory_xact_lock(hashtext('inno-active-super-admin'))",
  );
  const user = (
    await db.query('SELECT role,status FROM users WHERE id=$1 FOR UPDATE', [
      userId,
    ])
  ).rows[0];
  if (user?.role === 'super_admin' && user.status === 'active') {
    const count = Number(
      (
        await db.query(
          "SELECT count(*) FROM users WHERE role='super_admin' AND status='active'",
        )
      ).rows[0].count,
    );
    if (count <= 1)
      throw new HttpError(
        409,
        'Son aktif süper yönetici hesabı kapatılamaz. Önce başka bir süper yönetici atayın.',
      );
  }
};
