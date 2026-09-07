import prisma from '../../lib/prisma';
import { ConflictError } from '../../middleware/errorHandler';
import { parsePagination, buildPagination } from '../../utils/paginate';

export async function createReport(reporterId: string, data: { reportable_type: string; reportable_id: string; reason: string }) {
  const existing = await prisma.reports.findFirst({
    where: { reporter_id: reporterId, reportable_type: data.reportable_type as any, reportable_id: data.reportable_id, status: 'pending' },
  });
  if (existing) throw new ConflictError('Already reported');
  return prisma.reports.create({
    data: { reporter_id: reporterId, reportable_type: data.reportable_type as any, reportable_id: data.reportable_id, reason: data.reason },
  });
}

export async function listReports(query: Record<string, string>) {
  const { skip, take, page, limit } = parsePagination(query);
  const where: Record<string, unknown> = {};
  if (query['status']) where['status'] = query['status'];
  if (query['type']) where['reportable_type'] = query['type'];
  const [reports, total] = await Promise.all([
    prisma.reports.findMany({ where, orderBy: { created_at: 'desc' }, skip, take }),
    prisma.reports.count({ where }),
  ]);
  return { reports, pagination: buildPagination(page, limit, total) };
}

export async function resolveReport(reportId: string, adminId: string, resolution: string) {
  return prisma.reports.update({
    where: { id: reportId },
    data: { status: 'action_taken', reviewed_by: adminId, reviewed_at: new Date(), details: resolution },
  });
}

export async function dismissReport(reportId: string) {
  return prisma.reports.update({ where: { id: reportId }, data: { status: 'dismissed', reviewed_at: new Date() } });
}
