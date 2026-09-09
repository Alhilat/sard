import prisma from '../../lib/prisma';
import { NotFoundError } from '../../middleware/errorHandler';
import { parsePagination, buildPagination } from '../../utils/paginate';

export async function listUsers(query: Record<string, string>) {
  const { skip, take, page, limit } = parsePagination(query);
  const where: Record<string, unknown> = {};
  if (query['status']) where['status'] = query['status'];
  if (query['q']) where['email'] = { contains: query['q'], mode: 'insensitive' };
  if (query['role']) {
    const role = await prisma.roles.findFirst({ where: { name: query['role'] } });
    if (role) where['role_id'] = role.id;
  }
  const [users, total] = await Promise.all([
    prisma.users.findMany({ where, orderBy: { created_at: 'desc' }, skip, take, include: { roles: true } }),
    prisma.users.count({ where }),
  ]);
  return { users, pagination: buildPagination(page, limit, total) };
}

export async function getUser(userId: string) {
  const user = await prisma.users.findUnique({ where: { id: userId }, include: { roles: true } });
  if (!user) throw new NotFoundError('User');
  return user;
}

export async function updateUserStatus(userId: string, status: string, _reason?: string) {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');
  return prisma.users.update({ where: { id: userId }, data: { status: status as any, updated_at: new Date() } });
}

export async function deleteUser(userId: string) {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');
  return prisma.users.update({ where: { id: userId }, data: { status: 'banned', deleted_at: new Date() } });
}

export async function listOrganizations(query: Record<string, string>) {
  const { skip, take, page, limit } = parsePagination(query);
  const where: Record<string, unknown> = {};
  if (query['status']) where['verification_status'] = query['status'];
  const [orgs, total] = await Promise.all([
    prisma.organizations.findMany({ where, orderBy: { created_at: 'desc' }, skip, take }),
    prisma.organizations.count({ where }),
  ]);
  return { organizations: orgs, pagination: buildPagination(page, limit, total) };
}

export async function updateOrgStatus(orgId: string, status: string) {
  const org = await prisma.organizations.findUnique({ where: { id: orgId } });
  if (!org) throw new NotFoundError('Organization');
  return prisma.organizations.update({
    where: { id: orgId },
    data: { verification_status: status as any, updated_at: new Date() },
  });
}

export async function listPosts(query: Record<string, string>) {
  const { skip, take, page, limit } = parsePagination(query);
  const where: Record<string, unknown> = { deleted_at: null };
  if (query['status']) where['status'] = query['status'];
  const [posts, total] = await Promise.all([
    prisma.posts.findMany({ where, orderBy: { created_at: 'desc' }, skip, take }),
    prisma.posts.count({ where }),
  ]);
  return { posts, pagination: buildPagination(page, limit, total) };
}

export async function removePost(postId: string, _adminId: string) {
  return prisma.posts.update({ where: { id: postId }, data: { status: 'removed', deleted_at: new Date() } });
}

export async function listRoles() {
  return prisma.roles.findMany({ orderBy: { name: 'asc' } });
}

export async function assignRole(userId: string, roleId: string) {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');
  const role = await prisma.roles.findUnique({ where: { id: roleId } });
  if (!role) throw new NotFoundError('Role');
  return prisma.users.update({ where: { id: userId }, data: { role_id: roleId, updated_at: new Date() } });
}
