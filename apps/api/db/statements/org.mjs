export function createOrgStatements(db) {
  return {
    stmtGetOrgMembers: db.prepare('SELECT * FROM org_members WHERE org_id = ? ORDER BY created_at ASC'),
    stmtInsertOrgMember: db.prepare(`
      INSERT INTO org_members (id, org_id, user_id, name, email, role, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `),
    stmtDeleteOrgMember: db.prepare('DELETE FROM org_members WHERE id = ?'),
    stmtUpdateOrgMemberRole: db.prepare('UPDATE org_members SET role = ? WHERE id = ?')
  };
}
