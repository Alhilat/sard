import prisma from '../../lib/prisma';
import { NotFoundError, ForbiddenError, AppError } from '../../middleware/errorHandler';
import { parsePagination, buildPagination } from '../../utils/paginate';

export async function getOrg(orgId: string) {
  const org = await prisma.organizations.findUnique({
    where: { id: orgId },
    include: { users: { select: { id: true, email: true, status: true } } },
  });
  if (!org) throw new NotFoundError('Organization');
  return org;
}

export async function listOrgs(query: Record<string, string>) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = query['status'] ? { verification_status: query['status'] as any } : {};
  const [orgs, total] = await Promise.all([
    prisma.organizations.findMany({ where, skip, take, orderBy: { created_at: 'desc' } }),
    prisma.organizations.count({ where }),
  ]);
  return { orgs, pagination: buildPagination(page, limit, total) };
}

export async function updateOrg(orgUserId: string, orgId: string, data: {
  display_name?: string; description?: string; website?: string;
}) {
  const org = await prisma.organizations.findUnique({ where: { id: orgId } });
  if (!org) throw new NotFoundError('Organization');
  if (org.user_id !== orgUserId) throw new ForbiddenError();
  return prisma.organizations.update({ where: { id: orgId }, data: { ...data, updated_at: new Date() } });
}

export async function setMedia(orgId: string, userId: string, fileUrl: string, mimeType: string, sizeBytes: number, type: 'logo' | 'cover') {
  const org = await prisma.organizations.findUnique({ where: { id: orgId } });
  if (!org) throw new NotFoundError('Organization');
  if (org.user_id !== userId) throw new ForbiddenError();
  const media = await prisma.media_files.create({
    data: { uploader_id: userId, file_url: fileUrl, file_type: 'image', mime_type: mimeType, size_bytes: BigInt(sizeBytes) },
  });
  const field = type === 'logo' ? { logo_media_id: media.id } : { cover_media_id: media.id };
  return prisma.organizations.update({ where: { id: orgId }, data: { ...field, updated_at: new Date() } });
}

export async function requestVerification(orgId: string, userId: string, documentMediaId: string) {
  const org = await prisma.organizations.findUnique({ where: { id: orgId } });
  if (!org) throw new NotFoundError('Organization');
  if (org.user_id !== userId) throw new ForbiddenError();
  if (org.verification_status === 'verified') throw new AppError('Organization already verified', 400);
  return prisma.organization_verification_requests.create({
    data: { organization_id: orgId, document_media_id: documentMediaId, status: 'pending' },
  });
}

export async function getOrgActivities(orgId: string, query: Record<string, string>) {
  const { skip, take, page, limit } = parsePagination(query);
  const [activities, total] = await Promise.all([
    prisma.activities.findMany({
      where: { organization_id: orgId, status: { not: 'cancelled' } },
      orderBy: { start_at: 'asc' }, skip, take,
    }),
    prisma.activities.count({ where: { organization_id: orgId, status: { not: 'cancelled' } } }),
  ]);
  return { activities, pagination: buildPagination(page, limit, total) };
}

export async function getOrgCourses(orgId: string, query: Record<string, string>) {
  const { skip, take, page, limit } = parsePagination(query);
  const [courses, total] = await Promise.all([
    prisma.courses.findMany({ where: { organization_id: orgId }, orderBy: { created_at: 'desc' }, skip, take }),
    prisma.courses.count({ where: { organization_id: orgId } }),
  ]);
  return { courses, pagination: buildPagination(page, limit, total) };
}
