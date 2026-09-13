export function createReportsStatements(db) {
  return {
    stmtInsertReport: db.prepare(`
      INSERT INTO reports (id, reporter_id, target_type, target_id, reason, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `),
    stmtGetReports: db.prepare('SELECT * FROM reports ORDER BY created_at DESC LIMIT 100')
  };
}
