import prisma from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ConflictError, AppError } from '../../middleware/errorHandler';
import { parsePagination, buildPagination } from '../../utils/paginate';

export async function listGroups(query: Record<string, string>) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = { status: 'active' as const, visibility: 'public' as const };
  const [groups, total] = await Promise.all([
    prisma.groups.findMany({ where, orderBy: { created_at: 'desc' }, skip, take }),
    prisma.groups.count({ where }),
  ]);
  return { groups, pagination: buildPagination(page, limit, total) };
}

export async function createGroup(creatorId: string, data: { name: string; description?: string; visibility: string }) {
  const group = await prisma.groups.create({
    data: { name: data.name, description: data.description, visibility: data.visibility as any, creator_id: creatorId },
  });
  await prisma.group_members.create({ data: { group_id: group.id, user_id: creatorId, role: 'creator', status: 'active' } });
  return group;
}

export async function getGroup(groupId: string) {
  const group = await prisma.groups.findUnique({ where: { id: groupId } });
  if (!group) throw new NotFoundError('Group');
  return group;
}

export async function updateGroup(groupId: string, userId: string, data: { name?: string; description?: string; visibility?: string }) {
  const member = await prisma.group_members.findFirst({ where: { group_id: groupId, user_id: userId, status: 'active' } });
  if (!member || !['creator', 'moderator'].includes(member.role)) throw new ForbiddenError();
  return prisma.groups.update({
    where: { id: groupId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.visibility && { visibility: data.visibility as any }),
      updated_at: new Date(),
    },
  });
}

export async function dissolveGroup(groupId: string, userId: string) {
  const group = await prisma.groups.findUnique({ where: { id: groupId } });
  if (!group) throw new NotFoundError('Group');
  if (group.creator_id !== userId) throw new ForbiddenError();
  return prisma.groups.update({ where: { id: groupId }, data: { status: 'dissolved', updated_at: new Date() } });
}

export async function getMembers(groupId: string, query: Record<string, string>) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = { group_id: groupId, status: 'active' as const };
  const [members, total] = await Promise.all([
    prisma.group_members.findMany({ where, include: { users: { select: { id: true, email: true } } }, skip, take }),
    prisma.group_members.count({ where }),
  ]);
  return { members, pagination: buildPagination(page, limit, total) };
}

export async function joinGroup(groupId: string, userId: string) {
  const group = await prisma.groups.findUnique({ where: { id: groupId } });
  if (!group) throw new NotFoundError('Group');
  if (group.status !== 'active') throw new AppError('Group is not active', 400);
  const existing = await prisma.group_members.findUnique({ where: { group_id_user_id: { group_id: groupId, user_id: userId } } });
  if (existing?.status === 'active') throw new ConflictError('Already a member');
  const status = group.visibility === 'private' ? 'pending_request' as const : 'active' as const;
  if (existing) {
    return prisma.group_members.update({ where: { group_id_user_id: { group_id: groupId, user_id: userId } }, data: { status } });
  }
  return prisma.group_members.create({ data: { group_id: groupId, user_id: userId, role: 'member', status } });
}

export async function leaveGroup(groupId: string, userId: string) {
  const member = await prisma.group_members.findUnique({ where: { group_id_user_id: { group_id: groupId, user_id: userId } } });
  if (!member) throw new NotFoundError('Membership');
  if (member.role === 'creator') throw new AppError('Creator cannot leave. Transfer ownership or dissolve the group.', 400);
  await prisma.group_members.delete({ where: { group_id_user_id: { group_id: groupId, user_id: userId } } });
  return { message: 'Left group' };
}

export async function updateMember(groupId: string, actorId: string, targetUserId: string, data: { role?: string; status?: string }) {
  const actor = await prisma.group_members.findFirst({ where: { group_id: groupId, user_id: actorId, status: 'active' } });
  if (!actor || !['creator', 'moderator'].includes(actor.role)) throw new ForbiddenError();
  return prisma.group_members.update({
    where: { group_id_user_id: { group_id: groupId, user_id: targetUserId } },
    data: {
      ...(data.role && { role: data.role as any }),
      ...(data.status && { status: data.status as any }),
    },
  });
}

export async function removeMember(groupId: string, actorId: string, targetUserId: string) {
  const actor = await prisma.group_members.findFirst({ where: { group_id: groupId, user_id: actorId, status: 'active' } });
  if (!actor || !['creator', 'moderator'].includes(actor.role)) throw new ForbiddenError();
  await prisma.group_members.delete({ where: { group_id_user_id: { group_id: groupId, user_id: targetUserId } } });
  return { message: 'Member removed' };
}
