import prisma from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ConflictError, AppError } from '../../middleware/errorHandler';
import { parsePagination, buildPagination } from '../../utils/paginate';

async function getOrgByUserId(userId: string) {
  return prisma.organizations.findFirst({ where: { user_id: userId } });
}

export async function listActivities(query: Record<string, string>) {
  const { skip, take, page, limit } = parsePagination(query);
  const where: Record<string, unknown> = { status: { not: 'cancelled' } };
  if (query['org_id']) where['organization_id'] = query['org_id'];
  const [activities, total] = await Promise.all([
    prisma.activities.findMany({ where, orderBy: { start_at: 'asc' }, skip, take }),
    prisma.activities.count({ where }),
  ]);
  return { activities, pagination: buildPagination(page, limit, total) };
}

export async function createActivity(userId: string, data: {
  title: string; description?: string; location_type: string; location_value?: string;
  start_at: string; end_at: string; capacity: number; status?: string; cover_media_id?: string;
}) {
  const org = await getOrgByUserId(userId);
  if (!org) throw new AppError('No organization associated with this account', 403);
  return prisma.activities.create({
    data: {
      ...data, organization_id: org.id,
      location_type: data.location_type as any, status: (data.status ?? 'draft') as any,
      start_at: new Date(data.start_at), end_at: new Date(data.end_at),
    },
  });
}

export async function getActivity(activityId: string) {
  const activity = await prisma.activities.findUnique({ where: { id: activityId } });
  if (!activity) throw new NotFoundError('Activity');
  return activity;
}

export async function updateActivity(activityId: string, userId: string, data: Partial<ReturnType<typeof Object.create>>) {
  const activity = await prisma.activities.findUnique({ where: { id: activityId }, include: { organizations: true } });
  if (!activity) throw new NotFoundError('Activity');
  if (activity.organizations.user_id !== userId) throw new ForbiddenError();
  const { start_at, end_at, ...rest } = data;
  return prisma.activities.update({
    where: { id: activityId },
    data: {
      ...rest,
      ...(start_at && { start_at: new Date(start_at as string) }),
      ...(end_at && { end_at: new Date(end_at as string) }),
      updated_at: new Date(),
    },
  });
}

export async function cancelActivity(activityId: string, userId: string) {
  const activity = await prisma.activities.findUnique({ where: { id: activityId }, include: { organizations: true } });
  if (!activity) throw new NotFoundError('Activity');
  if (activity.organizations.user_id !== userId) throw new ForbiddenError();
  return prisma.activities.update({ where: { id: activityId }, data: { status: 'cancelled', updated_at: new Date() } });
}

export async function register(activityId: string, userId: string) {
  const activity = await prisma.activities.findUnique({ where: { id: activityId } });
  if (!activity) throw new NotFoundError('Activity');
  if (activity.status !== 'published') throw new AppError('Activity is not open for registration', 400);
  const existing = await prisma.activity_registrations.findFirst({ where: { activity_id: activityId, user_id: userId } });
  if (existing?.status === 'registered') throw new ConflictError('Already registered');
  const count = await prisma.activity_registrations.count({ where: { activity_id: activityId, status: 'registered' } });
  const status: 'registered' | 'waitlisted' = count >= activity.capacity ? 'waitlisted' : 'registered';
  return prisma.activity_registrations.create({ data: { activity_id: activityId, user_id: userId, status } });
}

export async function cancelRegistration(activityId: string, userId: string) {
  const reg = await prisma.activity_registrations.findFirst({ where: { activity_id: activityId, user_id: userId } });
  if (!reg) throw new NotFoundError('Registration');
  return prisma.activity_registrations.update({ where: { id: reg.id }, data: { status: 'cancelled', cancelled_at: new Date() } });
}

export async function getRegistrations(activityId: string, userId: string, query: Record<string, string>) {
  const activity = await prisma.activities.findUnique({ where: { id: activityId }, include: { organizations: true } });
  if (!activity) throw new NotFoundError('Activity');
  if (activity.organizations.user_id !== userId) throw new ForbiddenError();
  const { skip, take, page, limit } = parsePagination(query);
  const [regs, total] = await Promise.all([
    prisma.activity_registrations.findMany({ where: { activity_id: activityId }, skip, take }),
    prisma.activity_registrations.count({ where: { activity_id: activityId } }),
  ]);
  return { registrations: regs, pagination: buildPagination(page, limit, total) };
}
